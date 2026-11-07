// Renders a contact sheet of sprites to a PNG, for reviewing parts while drawing them.
// Usage: node scripts/sprite-sheet.ts <out.png> [count=24] [scale=4]
// Each cell shows both idle frames side by side; the seeds are printed in order.

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { SIZE } from '../src/lib/spriteParts.ts';
import { spriteParams } from '../src/lib/spriteParams.ts';
import { spriteFrames, type Frame } from '../src/lib/spriteArt.ts';

const [out = 'sprites.png', countArg = '24', scaleArg = '4'] = process.argv.slice(2);
const count = Number(countArg);
const scale = Number(scaleArg);
const COLS = Math.min(6, count);
const GAP = 4;
const cellW = (SIZE * 2 + GAP) * scale;
const cellH = SIZE * scale;
const pad = GAP * scale;
const width = COLS * (cellW + pad) + pad;
const rows = Math.ceil(count / COLS);
const height = rows * (cellH + pad) + pad;

const BG = [0x5a, 0x52, 0x56];
const px = new Uint8Array(width * height * 3);
for (let i = 0; i < width * height; i++) px.set(BG, i * 3);

function blit(frame: Frame, ox: number, oy: number) {
  frame.forEach((row, y) =>
    row.forEach((c, x) => {
      if (!c) return;
      const rgb = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) px.set(rgb, ((oy + y * scale + dy) * width + ox + x * scale + dx) * 3);
      }
    }),
  );
}

for (let i = 0; i < count; i++) {
  const seed = `sheet-${i}`;
  const params = spriteParams(seed);
  const [a, b] = spriteFrames(params);
  const ox = pad + (i % COLS) * (cellW + pad);
  const oy = pad + Math.floor(i / COLS) * (cellH + pad);
  blit(a, ox, oy);
  blit(b, ox + (SIZE + GAP) * scale, oy);
  const parts = Object.values(params.parts).join(', ');
  console.log(`${i}: ${params.name} · ${params.build} ${params.corrupted ? 'corrupted ' : ''}${params.archetype} · ${parts}`);
}

// Minimal PNG encoder: 8-bit RGB, one IDAT chunk.
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Uint8Array) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type: string, data: Uint8Array): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 2;
const raw = Buffer.alloc((width * 3 + 1) * height);
for (let y = 0; y < height; y++) Buffer.from(px.subarray(y * width * 3, (y + 1) * width * 3)).copy(raw, y * (width * 3 + 1) + 1);
writeFileSync(
  out,
  Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array())]),
);
console.log(`wrote ${out} (${width}×${height})`);
