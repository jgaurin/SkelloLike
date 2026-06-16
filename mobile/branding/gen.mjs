import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

const svg = readFileSync('branding/logo.svg');

// Icône maître (carré plein, coins arrondis) — 1024px.
await sharp(svg, { density: 384 })
  .resize(1024, 1024)
  .png()
  .toFile('branding/icon.png');

// Foreground adaptive : juste le R blanc sur fond transparent, centré dans
// la safe zone (~66% pour laisser la marge des masques Android).
const R = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(256,256) scale(1.0)">
    <path fill="#ffffff" transform="scale(1.0)" d="
      M 150 132 h 132 q 70 0 70 70 q 0 52 -44 66 l 54 112 h -68
      l -48 -104 h -30 v 104 h -64 z
      M 214 188 v 64 h 58 q 18 0 18 -32 q 0 -32 -18 -32 z"/>
  </g>
</svg>`;
await sharp(Buffer.from(R), { density: 384 }).resize(1024,1024).png().toFile('branding/icon_foreground.png');

console.log('OK: branding/icon.png + icon_foreground.png');
