// RapidRadio RRHFOEM04 / RRHFOEM07 wire protocol (see "RRHFOEM04 Communication Protocol v2.x").
//
// Request : [len][cmdHi][cmdLo][data...][crcHi][crcLo]
// Response: [len][cmdHi][cmdLo][errHi][errLo][data...][crcHi][crcLo]
//
// `len` counts from the length byte itself up to the end of data (CRC excluded),
// so a frame on the wire is always len + 2 bytes. The CRC is CRC-16/CCITT
// (poly 0x1021, init 0xFFFF) inverted, sent MSB first as in the vendor C# SDK.

const CMD = {
  ISO15693_INVENTORY: 0x1f01, // "Full inventory" – anti-collision, up to 7 UIDs per frame
  ISO15693_GET_SYSTEM_INFO: 0x100e,
  ISO14443A_INVENTORY: 0x2f01,
  READER_INFO: 0xf000,
  BEEP: 0xf001,
  ADDITIONAL_FRAME: 0xf002, // remaining UIDs when more than 7 tags are in the field
};

const FLAGS_16_SLOT = 0x06; // data-rate + inventory flag
const ERR_OK = 0x0000;
const MAX_UIDS_PER_FRAME = 7;

function crc16(bytes) {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return ~crc & 0xffff;
}

function buildFrame(cmd, data = []) {
  const body = [3 + data.length, (cmd >> 8) & 0xff, cmd & 0xff, ...data];
  const crc = crc16(body);
  return Buffer.from([...body, crc >> 8, crc & 0xff]);
}

// Parses a response frame. Trailing bytes (HID reports are fixed-size and not
// zeroed by the firmware) are ignored. Returns null if the frame is incomplete
// or fails the CRC check.
function parseResponse(buf) {
  if (!buf || buf.length < 7) return null;
  const len = buf[0];
  if (len < 5 || buf.length < len + 2) return null;

  const crc = (buf[len] << 8) | buf[len + 1];
  if (crc16(buf.subarray(0, len)) !== crc) return null;

  return {
    cmd: (buf[1] << 8) | buf[2],
    error: (buf[3] << 8) | buf[4],
    data: Buffer.from(buf.subarray(5, len)),
  };
}

// ISO 15693 UIDs are canonically written MSB first and always start with E0.
// Normalise so the same tag yields the same string regardless of reader byte order.
function formatIso15693Uid(bytes) {
  const b = Buffer.from(bytes);
  if (b[0] !== 0xe0 && b[b.length - 1] === 0xe0) b.reverse();
  return b.toString('hex').toUpperCase();
}

// Inventory response data: [count][uid0 (8 bytes)][uid1]...
function parseIso15693Uids(data) {
  if (data.length < 1) return { total: 0, uids: [] };
  const total = data[0];
  const uids = [];
  for (let i = 0; i < Math.min(total, MAX_UIDS_PER_FRAME); i++) {
    const start = 1 + i * 8;
    if (start + 8 > data.length) break;
    uids.push(formatIso15693Uid(data.subarray(start, start + 8)));
  }
  return { total, uids };
}

// ISO 14443A inventory response data: [uidLen][uid...]
function parseIso14443aUid(data) {
  if (data.length < 1) return null;
  const uidLen = data[0];
  if (![4, 7, 10].includes(uidLen) || data.length < 1 + uidLen) return null;
  return data.subarray(1, 1 + uidLen).toString('hex').toUpperCase();
}

// Reader info data is 16 bytes: ASCII model (e.g. "RRHFOEM07-$") followed by
// version bytes and a serial number in the last 4 bytes.
function parseReaderInfo(data) {
  const info = data.subarray(0, 16);
  const model = info.toString('latin1').split('-')[0].replace(/[^\x20-\x7e]/g, '').trim();
  const serial = info.length >= 16 ? info.readUInt32BE(12) : null;
  return { model: model || 'RRHFOEM04', serial };
}

module.exports = {
  CMD,
  FLAGS_16_SLOT,
  ERR_OK,
  MAX_UIDS_PER_FRAME,
  crc16,
  buildFrame,
  parseResponse,
  parseIso15693Uids,
  parseIso14443aUid,
  parseReaderInfo,
};
