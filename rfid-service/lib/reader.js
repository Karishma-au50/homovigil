const EventEmitter = require('events');
const {
  CMD,
  FLAGS_16_SLOT,
  ERR_OK,
  buildFrame,
  parseIso15693Uids,
  parseIso14443aUid,
  parseReaderInfo,
} = require('./protocol');

const RESPONSE_TIMEOUT_MS = 1000;
const MAX_CONSECUTIVE_FAILURES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The reader has no "tag arrived" interrupt, so presence is derived by polling
// inventory. A tag counts as removed only after it is missing from several
// consecutive polls, which smooths over RF flicker and ISO 14443A cards that
// skip every other request while they fall back to the IDLE state.
//
// Events: 'card' {uid, type}, 'card-off' {uid, type}, 'closed' (Error|undefined)
class RfidReader extends EventEmitter {
  constructor(transport, options) {
    super();
    this.transport = transport;
    this.options = options;
    this.name = transport.kind === 'ETH' ? `RRHFOEM04 ETH ${transport.host}` : 'RRHFOEM04 USB';
    this.present = new Map(); // uid -> { type, missed }
    this.running = false;
  }

  async command(cmd, data) {
    return this.transport.transceive(buildFrame(cmd, data), cmd, RESPONSE_TIMEOUT_MS);
  }

  async start() {
    await this.transport.open();
    try {
      const res = await this.command(CMD.READER_INFO);
      if (res.error === ERR_OK) {
        const { model, serial } = parseReaderInfo(res.data);
        const where = this.transport.kind === 'ETH' ? this.transport.host : 'USB';
        this.name = `${model} ${where}${serial != null ? ` #${serial}` : ''}`;
      }
    } catch (err) {
      await this.transport.close();
      throw err;
    }
    if (this.options.label) this.name = `${this.options.label} (${this.name})`;

    this.running = true;
    this.pollLoop();
  }

  async stop() {
    this.running = false;
    await this.transport.close();
  }

  async beep() {
    await this.command(CMD.BEEP).catch(() => {});
  }

  // Returns every tag currently in the field, or throws if the reader did not respond.
  async inventory() {
    const tags = [];

    if (this.options.protocols.includes('iso15693')) {
      const res = await this.command(CMD.ISO15693_INVENTORY, [FLAGS_16_SLOT]);
      if (res.error === ERR_OK) {
        const { total, uids } = parseIso15693Uids(res.data);
        // Firmware returns at most 7 UIDs per frame; the rest come via "additional frame".
        while (uids.length < total) {
          const more = await this.command(CMD.ADDITIONAL_FRAME);
          if (more.error !== ERR_OK) break;
          const next = parseIso15693Uids(more.data).uids;
          if (next.length === 0) break;
          uids.push(...next);
        }
        uids.forEach((uid) => tags.push({ uid, type: 'ISO15693' }));
      }
    }

    if (this.options.protocols.includes('iso14443a')) {
      const res = await this.command(CMD.ISO14443A_INVENTORY);
      if (res.error === ERR_OK) {
        const uid = parseIso14443aUid(res.data);
        if (uid) tags.push({ uid, type: 'ISO14443A' });
      }
    }

    return tags;
  }

  updatePresence(tags) {
    const seen = new Set();
    const arrived = [];

    for (const tag of tags) {
      seen.add(tag.uid);
      const entry = this.present.get(tag.uid);
      if (entry) {
        entry.missed = 0;
      } else {
        this.present.set(tag.uid, { type: tag.type, missed: 0 });
        arrived.push(tag);
      }
    }

    for (const [uid, entry] of this.present) {
      if (seen.has(uid)) continue;
      entry.missed += 1;
      if (entry.missed >= this.options.removeAfterMissedPolls) {
        this.present.delete(uid);
        this.emit('card-off', { uid, type: entry.type });
      }
    }

    return arrived;
  }

  async pollLoop() {
    let failures = 0;
    let lastError;

    while (this.running) {
      try {
        const arrived = this.updatePresence(await this.inventory());
        failures = 0;
        for (const tag of arrived) this.emit('card', tag);
        if (arrived.length > 0 && this.options.beepOnScan) await this.beep();
      } catch (err) {
        lastError = err;
        failures += 1;
        if (failures >= MAX_CONSECUTIVE_FAILURES) break;
      }
      await sleep(this.options.pollIntervalMs);
    }

    const wasRunning = this.running;
    this.running = false;
    await this.transport.close();
    if (wasRunning) this.emit('closed', lastError);
  }
}

module.exports = { RfidReader };
