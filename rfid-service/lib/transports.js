const net = require('net');
const HID = require('node-hid');
const { parseResponse } = require('./protocol');

const USB_VENDOR_ID = 0x1781; // RapidRadio
const USB_PRODUCT_ID = 0x0c10; // RRHFOEM04 / RRHFOEM07 USB
const HID_REPORT_SIZE = 64;

async function listUsbReaders() {
  const devices = await HID.devicesAsync(USB_VENDOR_ID, USB_PRODUCT_ID);
  return devices.filter((d) => d.path);
}

// USB readers are HID devices: every exchange is one 64-byte output report
// (prefixed with report ID 0) and one 64-byte input report.
class UsbTransport {
  constructor(deviceInfo) {
    this.path = deviceInfo.path;
    this.kind = 'USB';
    this.device = null;
  }

  async open() {
    this.device = await HID.HIDAsync.open(this.path);
  }

  async transceive(frame, expectedCmd, timeoutMs) {
    if (!this.device) throw new Error('USB reader is not open');

    const report = Buffer.alloc(HID_REPORT_SIZE + 1);
    frame.copy(report, 1);
    await this.device.write(report);

    // Discard any stale reports left over from an earlier timed-out exchange.
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const rx = await this.device.read(Math.max(1, deadline - Date.now()));
      if (!rx || rx.length === 0) continue;
      const res = parseResponse(rx);
      if (res && res.cmd === expectedCmd) return res;
    }
    throw new Error(`USB reader did not answer command 0x${expectedCmd.toString(16)}`);
  }

  async close() {
    const device = this.device;
    this.device = null;
    if (device) await device.close().catch(() => {});
  }
}

// Ethernet readers (RRHFOEM04 ETH) act as a TCP server (factory default
// 192.168.1.200:9090) and use the same frames without the HID report ID.
class TcpTransport {
  constructor({ host, port }) {
    this.host = host;
    this.port = port || 9090;
    this.kind = 'ETH';
    this.socket = null;
    this.rx = Buffer.alloc(0);
    this.waiter = null;
  }

  open(timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const socket = net.connect({ host: this.host, port: this.port });
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error(`Timed out connecting to ${this.host}:${this.port}`));
      }, timeoutMs);

      socket.once('connect', () => {
        clearTimeout(timer);
        socket.setNoDelay(true);
        socket.setKeepAlive(true, 10000);
        this.socket = socket;
        resolve();
      });
      // Errors after connecting (cable pulled, reader rebooted) are followed by
      // 'close', which fails the pending exchange; they must not crash the service.
      socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      socket.on('data', (chunk) => {
        this.rx = Buffer.concat([this.rx, chunk]);
        if (this.waiter) this.waiter();
      });
      socket.on('close', () => {
        this.socket = null;
        if (this.waiter) this.waiter();
      });
    });
  }

  // Pops one complete frame off the receive buffer, or returns undefined if
  // more bytes are needed. A frame that fails its CRC means the stream is out
  // of sync, so the whole buffer is dropped.
  takeFrame() {
    if (this.rx.length < 1) return undefined;
    const total = this.rx[0] + 2;
    if (this.rx.length < total) return undefined;
    const res = parseResponse(this.rx.subarray(0, total));
    this.rx = res ? this.rx.subarray(total) : Buffer.alloc(0);
    return res;
  }

  async transceive(frame, expectedCmd, timeoutMs) {
    if (!this.socket) throw new Error(`Ethernet reader ${this.host} is not connected`);
    this.rx = Buffer.alloc(0);
    this.socket.write(frame);

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      let res;
      while ((res = this.takeFrame()) !== undefined) {
        if (res && res.cmd === expectedCmd) return res;
      }
      if (!this.socket) throw new Error(`Ethernet reader ${this.host} closed the connection`);
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, Math.max(1, deadline - Date.now()));
        this.waiter = () => {
          clearTimeout(timer);
          resolve();
        };
      });
      this.waiter = null;
    }
    throw new Error(`Ethernet reader ${this.host} did not answer command 0x${expectedCmd.toString(16)}`);
  }

  async close() {
    if (this.socket) this.socket.destroy();
    this.socket = null;
  }
}

module.exports = { listUsbReaders, UsbTransport, TcpTransport };
