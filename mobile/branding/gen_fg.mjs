import sharp from 'sharp';
// Le R original occupe la boîte x:150..352, y:132..410 (≈202 x 278) dans le
// viewBox 512. Centre ≈ (251, 271). Pour l'adaptive foreground (1024, safe zone
// ~60%), on recadre le R au centre à ~50% de la surface.
const fg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(512,512) scale(1.45) translate(-251,-271)">
    <path fill="#ffffff" d="
      M 150 132 h 132 q 70 0 70 70 q 0 52 -44 66 l 54 112 h -68
      l -48 -104 h -30 v 104 h -64 z
      M 214 188 v 64 h 58 q 18 0 18 -32 q 0 -32 -18 -32 z"/>
  </g>
</svg>`;
await sharp(Buffer.from(fg), { density: 384 }).resize(1024,1024).png().toFile('branding/icon_foreground.png');
console.log('foreground recentré OK');
