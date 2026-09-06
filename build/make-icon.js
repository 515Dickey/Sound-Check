// Generates build/icon.png (256px) and build/icon.ico (multi-size, PNG entries) with no dependencies.
const fs = require('fs'), zlib = require('zlib'), path = require('path');

const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(buf) { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) { raw[y * (1 + w * 4)] = 0; rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BG = hex('#1c1f26'), EDGE = hex('#2c313b'), RED = hex('#ef4444'), YEL = hex('#eab308'), GRN = hex('#22c55e');

// Signed distance to a rounded rectangle centred at (cx,cy)
function sdRound(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r, qy = Math.abs(py - cy) - hh + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

function render(S) {
  const out = Buffer.alloc(S * S * 4);
  const SS = 4, inv = 1 / (SS * SS);
  const lights = [[0.5, 0.26, RED], [0.5, 0.5, YEL], [0.5, 0.74, GRN]];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const px = (x + (sx + .5) / SS) / S, py = (y + (sy + .5) / SS) / S;
      // body: tall rounded housing
      const d = sdRound(px, py, 0.5, 0.5, 0.30, 0.46, 0.14);
      if (d > 0) continue;
      let c = d > -0.035 ? EDGE : BG;
      for (const [lx, ly, col] of lights) {
        const dist = Math.hypot(px - lx, py - ly);
        if (dist < 0.115) { c = col; break; }
        if (dist < 0.135) { c = [c[0] * 0.5, c[1] * 0.5, c[2] * 0.5]; break; } // dark ring
      }
      r += c[0]; g += c[1]; b += c[2]; a += 255;
    }
    const i = (y * S + x) * 4;
    if (a) { const cov = a / (SS * SS * 255); out[i] = r / (a / 255); out[i + 1] = g / (a / 255); out[i + 2] = b / (a / 255); out[i + 3] = Math.round(cov * 255); }
  }
  return out;
}

const sizes = [256, 128, 64, 48, 32, 16];
const pngs = sizes.map(s => png(s, s, render(s)));
fs.writeFileSync(path.join(__dirname, 'icon.png'), pngs[0]);

const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
const entries = [], blobs = []; let offset = 6 + 16 * sizes.length;
sizes.forEach((s, i) => {
  const e = Buffer.alloc(16);
  e[0] = s === 256 ? 0 : s; e[1] = s === 256 ? 0 : s; e[2] = 0; e[3] = 0;
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(offset, 12);
  offset += pngs[i].length; entries.push(e); blobs.push(pngs[i]);
});
fs.writeFileSync(path.join(__dirname, 'icon.ico'), Buffer.concat([header, ...entries, ...blobs]));
console.log('wrote icon.png and icon.ico', sizes.join(','));
