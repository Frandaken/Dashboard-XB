import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

function createIconSVG(options = {}) {
  const { isMaskable = false } = options;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Vignette Radial Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="46%" r="65%">
      <stop offset="0%" stop-color="#285338" />
      <stop offset="40%" stop-color="#1F442D" />
      <stop offset="75%" stop-color="#153220" />
      <stop offset="100%" stop-color="#0C2014" />
    </radialGradient>

    <!-- Crest Gradients -->
    <linearGradient id="wingGradLeft" x1="100%" y1="30%" x2="0%" y2="70%">
      <stop offset="0%" stop-color="#A2B34B" />
      <stop offset="60%" stop-color="#839438" />
      <stop offset="100%" stop-color="#5D6C23" />
    </linearGradient>

    <linearGradient id="wingGradRight" x1="0%" y1="30%" x2="100%" y2="70%">
      <stop offset="0%" stop-color="#A2B34B" />
      <stop offset="60%" stop-color="#839438" />
      <stop offset="100%" stop-color="#5D6C23" />
    </linearGradient>

    <linearGradient id="redPlumeGrad" x1="80%" y1="100%" x2="20%" y2="0%">
      <stop offset="0%" stop-color="#873325" />
      <stop offset="100%" stop-color="#B54D39" />
    </linearGradient>

    <linearGradient id="silverPlumeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DFE8E3" />
      <stop offset="100%" stop-color="#A8B8B0" />
    </linearGradient>

    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E3ECE6" />
      <stop offset="100%" stop-color="#BAC7BF" />
    </linearGradient>

    <!-- Crisp Drop Shadow for Foreground XB Sticker -->
    <filter id="stickerShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#000000" flood-opacity="0.65" />
    </filter>
  </defs>

  <!-- Background Base -->
  ${isMaskable 
    ? '<rect width="512" height="512" fill="url(#bgGrad)" />' 
    : '<rect width="512" height="512" rx="108" fill="url(#bgGrad)" />'
  }

  <!-- Background School Crest / Emblem Group -->
  <g id="school-crest">
    <!-- Top Central Crest / Plumes -->
    <!-- Red Left Plume -->
    <path d="M224 115 C205 130 198 160 216 195 C230 175 242 150 248 120 C238 116 230 114 224 115 Z" 
          fill="url(#redPlumeGrad)" stroke="#14281A" stroke-width="2" />
    <path d="M216 195 C202 225 212 255 235 270 C240 240 245 210 248 180 Z" 
          fill="#7A2E20" opacity="0.8" />

    <!-- Center Silver Plume / Spear -->
    <path d="M256 80 C248 110 242 160 252 205 C256 160 264 110 256 80 Z" 
          fill="url(#silverPlumeGrad)" stroke="#14281A" stroke-width="2" />
    <path d="M256 80 L256 205 C262 165 268 120 256 80 Z" 
          fill="#96A69E" opacity="0.6" />

    <!-- Right Olive Plume -->
    <path d="M288 115 C307 130 314 160 296 195 C282 175 270 150 264 120 C274 116 282 114 288 115 Z" 
          fill="url(#wingGradRight)" stroke="#14281A" stroke-width="2" />

    <!-- Left Wing / Laurel Foliage -->
    <path d="M220 220 
             C180 180 140 170 102 205 
             C90 235 98 275 116 310 
             C136 345 168 375 215 395 
             C202 355 198 305 214 260 Z" 
          fill="url(#wingGradLeft)" stroke="#14281A" stroke-width="3" stroke-linejoin="round" />
    
    <!-- Left Wing Internal Feathers Detail Lines -->
    <path d="M104 208 C124 235 154 255 190 265 
             M96 242 C120 265 152 282 186 292 
             M106 278 C130 300 162 318 194 326 
             M122 315 C146 335 178 350 210 360" 
          fill="none" stroke="#14281A" stroke-width="2.5" stroke-linecap="round" />

    <!-- Right Wing / Laurel Foliage -->
    <path d="M292 220 
             C332 180 372 170 410 205 
             C422 235 414 275 396 310 
             C376 345 344 375 297 395 
             C310 355 314 305 298 260 Z" 
          fill="url(#wingGradRight)" stroke="#14281A" stroke-width="3" stroke-linejoin="round" />

    <!-- Right Wing Internal Feathers Detail Lines -->
    <path d="M408 208 C388 235 358 255 322 265 
             M416 242 C392 265 360 282 326 292 
             M406 278 C382 300 350 318 318 326 
             M390 315 C366 335 334 350 302 360" 
          fill="none" stroke="#14281A" stroke-width="2.5" stroke-linecap="round" />

    <!-- Bottom Ribbon / Banner -->
    <!-- Ribbon Tail Left -->
    <path d="M155 412 L120 440 L138 402 L112 376 L156 384 Z" 
          fill="#9EB2A7" stroke="#14281A" stroke-width="2.5" stroke-linejoin="round" />

    <!-- Ribbon Tail Right -->
    <path d="M357 412 L392 440 L374 402 L400 376 L356 384 Z" 
          fill="#9EB2A7" stroke="#14281A" stroke-width="2.5" stroke-linejoin="round" />

    <!-- Main Ribbon Arch Body -->
    <path d="M140 388 
             C178 366 216 360 256 360 
             C296 360 334 366 372 388 
             L360 424 
             C326 406 292 400 256 400 
             C220 400 186 406 152 424 Z" 
          fill="url(#ribbonGrad)" stroke="#14281A" stroke-width="3" stroke-linejoin="round" />

    <!-- Text: PUTRA on the left banner wing -->
    <g transform="translate(210, 403) rotate(-14)">
      <text font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="24" fill="#14281A" letter-spacing="3.5">PUTRA</text>
    </g>
  </g>

  <!-- Foreground: Giant XB Hero Badge -->
  <g id="hero-xb" filter="url(#stickerShadow)">
    <!-- 
      Outer White Sticker Contour:
      Calculated from composite XB geometry with thick rounded stroke
    -->
    <path d="
      M 86 118
      L 172 118
      L 238 214
      L 266 172
      L 242 118
      L 326 118
      L 366 182
      C 376 195 388 206 395 218
      C 416 232 426 254 426 278
      C 426 298 412 314 394 322
      C 416 332 430 354 430 382
      C 430 412 404 432 368 434
      L 326 434
      L 262 434
      L 234 394
      L 172 434
      L 86 434
      L 168 316
      Z
    " fill="#FFFFFF" stroke="#FFFFFF" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" />

    <!-- 
      Inner Black Fill of the Composite 'XB'
    -->
    <path d="
      M 86 118
      L 172 118
      L 238 214
      L 266 172
      L 242 118
      L 326 118
      L 366 182
      C 376 195 388 206 395 218
      C 416 232 426 254 426 278
      C 426 298 412 314 394 322
      C 416 332 430 354 430 382
      C 430 412 404 432 368 434
      L 326 434
      L 262 434
      L 234 394
      L 172 434
      L 86 434
      L 168 316
      Z
    " fill="#080808" />

    <!-- White Diagonal Text '2025-2026' inside top-left arm of X -->
    <g transform="translate(196, 260) rotate(-49)">
      <text x="0" y="2" 
            font-family="'Plus Jakarta Sans', Arial, Helvetica, sans-serif" 
            font-weight="900" 
            font-size="35" 
            fill="#FFFFFF" 
            text-anchor="middle" 
            letter-spacing="1.5">2025-2026</text>
    </g>
  </g>
</svg>`;
}

export async function generateAllIcons(outputDir = 'frontend/public') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const standardSvg = createIconSVG({ isMaskable: false });
  const maskableSvg = createIconSVG({ isMaskable: true });

  const svgPath = path.join(outputDir, 'icon.svg');
  const maskableSvgPath = path.join('/tmp', 'maskable.svg');

  fs.writeFileSync(svgPath, standardSvg);
  fs.writeFileSync(maskableSvgPath, maskableSvg);

  const standardBuf = Buffer.from(standardSvg);
  const maskableBuf = Buffer.from(maskableSvg);

  // 1. apple-touch-icon.png (180x180)
  await sharp(standardBuf)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));

  // 2. pwa-192x192.png (192x192)
  await sharp(standardBuf)
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDir, 'pwa-192x192.png'));

  // 3. pwa-512x512.png (512x512)
  await sharp(standardBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'pwa-512x512.png'));

  // 4. pwa-maskable-512x512.png (512x512)
  await sharp(maskableBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'pwa-maskable-512x512.png'));

  // 5. favicon.ico (48x48)
  await sharp(standardBuf)
    .resize(48, 48)
    .png()
    .toFile(path.join(outputDir, 'favicon.ico'));

  console.log(`Generated all icons in ${outputDir}`);
}

generateAllIcons();
