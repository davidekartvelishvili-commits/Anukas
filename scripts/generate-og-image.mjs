import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

// 1200×630 OG image — black background, yellow brand, white subtitle, yellow bonus line
const W = 1200;
const H = 630;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="rgba(255,215,0,0.25)"/>
      <stop offset="100%" stop-color="rgba(255,215,0,0)"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="${W/2}" cy="280" rx="500" ry="260" fill="url(#glow)"/>

  <!-- S logo circle -->
  <g transform="translate(${W/2 - 55}, 110)">
    <circle cx="55" cy="55" r="55" fill="#FFD700"/>
    <text x="55" y="84"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="900"
      font-size="86"
      text-anchor="middle"
      fill="#000000">S</text>
  </g>

  <!-- Brand: შანსი -->
  <text x="${W/2}" y="310"
    font-family="'Helvetica Neue', Arial, 'BPG Nino Mtavruli', 'Sylfaen', sans-serif"
    font-weight="900"
    font-size="120"
    text-anchor="middle"
    fill="#FFD700"
    letter-spacing="4">შანსი</text>

  <!-- Subtitle -->
  <text x="${W/2}" y="395"
    font-family="'Helvetica Neue', Arial, 'Sylfaen', sans-serif"
    font-weight="600"
    font-size="42"
    text-anchor="middle"
    fill="#FFFFFF">ყოველ ხარჯს ვაქცევთ თამაშად 🎰</text>

  <!-- Divider -->
  <line x1="${W/2 - 180}" y1="450" x2="${W/2 + 180}" y2="450" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>

  <!-- Bonus line -->
  <text x="${W/2}" y="520"
    font-family="'Helvetica Neue', Arial, 'Sylfaen', sans-serif"
    font-weight="700"
    font-size="36"
    text-anchor="middle"
    fill="#FFD700">მიიღე 10 ₾ სარეგისტრაციო ბონუსი</text>

  <!-- backapp URL -->
  <text x="${W/2}" y="580"
    font-family="Arial, sans-serif"
    font-weight="500"
    font-size="22"
    text-anchor="middle"
    fill="#888888">backapp-liart.vercel.app</text>
</svg>`;

const outPath = path.join(process.cwd(), "public", "og-image.png");
const png = await sharp(Buffer.from(svg))
  .png()
  .toBuffer();
await writeFile(outPath, png);
console.log(`Wrote ${outPath} (${png.length} bytes, ${W}×${H})`);
