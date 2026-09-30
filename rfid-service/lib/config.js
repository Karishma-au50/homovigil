const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  wsPort: 8080,
  pollIntervalMs: 250,
  removeAfterMissedPolls: 3,
  beepOnScan: true,
  // Blood-bag RFID labels are normally ISO 15693 (ICODE SLIX); 14443A covers MIFARE cards.
  protocols: ['iso15693', 'iso14443a'],
  usb: { enabled: true },
  // e.g. [{ "host": "192.168.1.200", "port": 9090, "label": "Storage Fridge 1" }]
  ethernetReaders: [],
};

function loadConfig() {
  const file = path.join(__dirname, '..', 'config.json');
  let user = {};
  if (fs.existsSync(file)) {
    try {
      user = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`[Config] Ignoring invalid config.json: ${err.message}`);
    }
  }

  const config = { ...DEFAULTS, ...user, usb: { ...DEFAULTS.usb, ...user.usb } };
  if (process.env.RFID_WS_PORT) config.wsPort = Number(process.env.RFID_WS_PORT);
  config.protocols = config.protocols.map((p) => String(p).toLowerCase());
  return config;
}

module.exports = { loadConfig };
