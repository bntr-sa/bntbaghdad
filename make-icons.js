// Pure-JS PNG icon generator (no dependencies). Run: node make-icons.js
const fs = require('fs');
const zlib = require('zlib');

const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const cd = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cd), 0);
  return Buffer.concat([len, cd, crc]);
}
function makePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}
function paint(size, radiusFrac) {
  const buf = Buffer.alloc(size * size * 4);
  const plum = [43, 27, 46], gold = [200, 162, 74];
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = plum[0]; buf[i * 4 + 1] = plum[1]; buf[i * 4 + 2] = plum[2]; buf[i * 4 + 3] = 255;
  }
  const cx = size / 2, cy = size / 2, r = size * radiusFrac;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy <= r * r) {
      const i = (y * size + x) * 4;
      buf[i] = gold[0]; buf[i + 1] = gold[1]; buf[i + 2] = gold[2]; buf[i + 3] = 255;
    }
  }
  return buf;
}
fs.writeFileSync('public/icon-192.png', makePng(192, 192, paint(192, 0.32)));
fs.writeFileSync('public/icon-512.png', makePng(512, 512, paint(512, 0.32)));
fs.writeFileSync('public/icon-180.png', makePng(180, 180, paint(180, 0.32)));
fs.writeFileSync('public/icon-maskable-512.png', makePng(512, 512, paint(512, 0.20)));
console.log('icons written to public/');
