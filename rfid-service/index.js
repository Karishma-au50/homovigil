const { NFC } = require('nfc-pcsc');
const WebSocket = require('ws');

// Configure service version
const SERVICE_VERSION = '1.1.0';

// Configure ports
const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });
console.log(`========================================`);
console.log(`RFID WebSocket Service v${SERVICE_VERSION}`);
console.log(`WebSocket Server started on ws://localhost:${PORT}`);
console.log(`========================================`);

// Active readers track
const activeReaders = new Set();

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
    readers: Array.from(activeReaders)
  }));

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

console.log('Initializing NFC/PCSC listener...');
console.log('Ensure your ACR1281U-C1 reader is plugged in and drivers are installed.');

const nfc = new NFC();

nfc.on('reader', reader => {
  const readerName = reader.reader.name;
  console.log(`\n[Reader Connected] ${readerName}`);
  activeReaders.add(readerName);
  
  // Broadcast reader addition
  broadcast({
    event: 'reader-connected',
    version: SERVICE_VERSION,
    reader: readerName,
    readersCount: activeReaders.size
  });

  reader.autoReconnect = true;

  // Card scanned event
  reader.on('card', card => {
    console.log(`\n--- Card Detected ---`);
    console.log(`UID:        ${card.uid}`);
    console.log(`Type:       ${card.type}`);
    console.log(`---------------------`);

    // Broadcast scan event to Angular
    broadcast({
      event: 'card',
      uid: card.uid,
      type: card.type,
      reader: readerName,
      timestamp: new Date().toISOString()
    });
  });

  // Card removed event
  reader.on('card.off', card => {
    console.log(`\n[Card Removed] UID: ${card.uid}`);
    
    // Broadcast removal event to Angular
    broadcast({
      event: 'card-off',
      uid: card.uid,
      reader: readerName,
      timestamp: new Date().toISOString()
    });
  });

  reader.on('error', err => {
    console.error(`[Reader Error] ${readerName}:`, err.message || err);
    broadcast({
      event: 'reader-error',
      reader: readerName,
      error: err.message || err
    });
  });

  reader.on('end', () => {
    console.log(`[Reader Disconnected] ${readerName}`);
    activeReaders.delete(readerName);
    
    // Broadcast reader removal
    broadcast({
      event: 'reader-disconnected',
      reader: readerName,
      readersCount: activeReaders.size
    });
  });
});

nfc.on('error', err => {
  console.error('[NFC Error] Global NFC/PCSC manager error:', err.message || err);
});
