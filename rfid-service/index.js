const WebSocket = require('ws');
const { loadConfig } = require('./lib/config');
const { RfidReader } = require('./lib/reader');
const { listUsbReaders, UsbTransport, TcpTransport } = require('./lib/transports');

// Configure service version (the Angular app flags older bridges as outdated)
const SERVICE_VERSION = '2.0.0';

const USB_SCAN_INTERVAL_MS = 2000;
const ETHERNET_RETRY_MS = 5000;

const config = loadConfig();

const wss = new WebSocket.Server({ port: config.wsPort });
console.log(`========================================`);
console.log(`RFID WebSocket Service v${SERVICE_VERSION}`);
console.log(`WebSocket Server started on ws://localhost:${config.wsPort}`);
console.log(`Reader: RapidRadio RRHFOEM04 (USB${config.ethernetReaders.length ? ' + Ethernet' : ''})`);
console.log(`Protocols: ${config.protocols.join(', ')}`);
console.log(`========================================`);

// Active readers track: key (USB path or host:port) -> RfidReader
const activeReaders = new Map();

function readerNames() {
  return Array.from(activeReaders.values(), (r) => r.name);
}

// Broadcast helper
function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// WebSocket Connection Handler
wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');

  // Send current reader status and version to the newly connected client
  ws.send(JSON.stringify({
    event: 'status',
    version: SERVICE_VERSION,
    readersCount: activeReaders.size,
    readers: readerNames()
  }));

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

wss.on('error', (err) => {
  console.error(`[WebSocket] Server error: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${config.wsPort} is already in use. Is another RFID service instance running?`);
    process.exit(1);
  }
});

// Starts a reader and wires its events to the WebSocket clients.
// `onClosed` is called after the reader drops (unplugged, powered off, network loss).
async function attachReader(key, transport, options, onClosed) {
  const reader = new RfidReader(transport, { ...config, ...options });

  // Card scanned event
  reader.on('card', card => {
    console.log(`\n--- Card Detected ---`);
    console.log(`UID:        ${card.uid}`);
    console.log(`Type:       ${card.type}`);
    console.log(`Reader:     ${reader.name}`);
    console.log(`---------------------`);

    // Broadcast scan event to Angular
    broadcast({
      event: 'card',
      uid: card.uid,
      type: card.type,
      reader: reader.name,
      timestamp: new Date().toISOString()
    });
  });

  // Card removed event
  reader.on('card-off', card => {
    console.log(`\n[Card Removed] UID: ${card.uid}`);

    // Broadcast removal event to Angular
    broadcast({
      event: 'card-off',
      uid: card.uid,
      reader: reader.name,
      timestamp: new Date().toISOString()
    });
  });

  reader.on('closed', err => {
    activeReaders.delete(key);
    if (err) {
      console.error(`[Reader Error] ${reader.name}:`, err.message || err);
      broadcast({
        event: 'reader-error',
        reader: reader.name,
        error: err.message || String(err)
      });
    }
    console.log(`[Reader Disconnected] ${reader.name}`);

    // Broadcast reader removal
    broadcast({
      event: 'reader-disconnected',
      reader: reader.name,
      readersCount: activeReaders.size
    });
    onClosed();
  });

  await reader.start();
  activeReaders.set(key, reader);
  console.log(`\n[Reader Connected] ${reader.name}`);

  // Broadcast reader addition
  broadcast({
    event: 'reader-connected',
    version: SERVICE_VERSION,
    reader: reader.name,
    readersCount: activeReaders.size
  });
}

// USB: poll the HID device list so readers can be plugged in or out at any time.
const pendingUsb = new Set();

async function scanUsbReaders() {
  let devices;
  try {
    devices = await listUsbReaders();
  } catch (err) {
    console.error('[USB] Device enumeration failed:', err.message || err);
    return;
  }

  for (const info of devices) {
    if (activeReaders.has(info.path) || pendingUsb.has(info.path)) continue;
    pendingUsb.add(info.path);
    attachReader(info.path, new UsbTransport(info), {}, () => {})
      .catch(err => console.error('[USB] Could not open RRHFOEM04 reader:', err.message || err))
      .finally(() => pendingUsb.delete(info.path));
  }
}

// Ethernet: keep a connection to each configured reader, retrying while it is offline.
function connectEthernetReader(entry) {
  const port = entry.port || 9090;
  const key = `${entry.host}:${port}`;
  const retry = () => setTimeout(() => connectEthernetReader(entry), ETHERNET_RETRY_MS);

  attachReader(key, new TcpTransport({ host: entry.host, port }), { label: entry.label }, retry)
    .catch(err => {
      console.warn(`[ETH] ${key} unavailable (${err.message || err}). Retrying in ${ETHERNET_RETRY_MS / 1000}s...`);
      retry();
    });
}

if (config.usb.enabled) {
  console.log('Watching for RRHFOEM04 USB readers. Plug the reader in; it beeps once when powered.');
  scanUsbReaders();
  setInterval(scanUsbReaders, USB_SCAN_INTERVAL_MS);
}
config.ethernetReaders.forEach(connectEthernetReader);

async function shutdown() {
  console.log('\nShutting down RFID service...');
  await Promise.all(Array.from(activeReaders.values(), (r) => r.stop()));
  wss.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
