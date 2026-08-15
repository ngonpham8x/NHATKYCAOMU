import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

// SVG 1: Standard Logo (with rx=112 for standalone display)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#78350f" />
      <stop offset="50%" stop-color="#92400e" />
      <stop offset="100%" stop-color="#451a03" />
    </linearGradient>
    <linearGradient id="cupGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7" />
      <stop offset="60%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background Icon Container with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  
  <!-- Outer Gold Border Line -->
  <rect x="12" y="12" width="488" height="488" rx="100" fill="none" stroke="url(#goldGrad)" stroke-width="8" opacity="0.85" />

  <!-- Rubber Tree Leaves Canopy -->
  <path d="M 140 180 C 100 130 150 60 220 70 C 260 30 340 30 380 80 C 440 90 450 160 410 200 C 430 250 380 300 320 280 C 280 300 200 290 160 250 C 110 240 100 190 140 180 Z" fill="#10b981" opacity="0.25" />
  <path d="M 180 150 C 150 110 200 60 256 75 C 300 45 360 65 380 110 C 420 130 410 180 380 200 C 350 220 280 210 256 200 C 210 210 160 180 180 150 Z" fill="#34d399" opacity="0.35" />

  <!-- Main Rubber Tree Trunk -->
  <path d="M 180 50 C 200 140 210 260 190 460 L 290 460 C 280 300 290 160 310 50 Z" fill="url(#trunkGrad)" filter="url(#shadow)" />

  <!-- Spiral Tapping Cut Groove -->
  <path d="M 210 170 C 235 195 260 220 285 240" fill="none" stroke="#fef08a" stroke-width="12" stroke-linecap="round" />
  <path d="M 210 170 C 235 195 260 220 285 240" fill="none" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" />

  <!-- Tapping Spout -->
  <path d="M 280 235 L 310 255 L 290 260 Z" fill="#9ca3af" />

  <!-- Dripping Latex Liquid Drops -->
  <path d="M 298 265 C 298 265 292 280 292 288 C 292 293 295 297 298 297 C 301 297 304 293 304 288 C 304 280 298 265 298 265 Z" fill="#ffffff" filter="url(#shadow)" />
  <circle cx="298" cy="315" r="5" fill="#ffffff" />

  <!-- Latex Collection Cup -->
  <g filter="url(#shadow)">
    <!-- Cup Metal Wire Hanger Ring -->
    <path d="M 220 330 C 220 380 370 380 370 330" fill="none" stroke="#d1d5db" stroke-width="6" stroke-dasharray="10 4" />

    <!-- Latex Cup Body -->
    <path d="M 235 320 L 250 400 C 255 420 340 420 345 400 L 360 320 Z" fill="url(#cupGrad)" stroke="#b45309" stroke-width="4" />
    
    <!-- White Liquid Latex Filling the Cup -->
    <ellipse cx="297.5" cy="330" rx="58" ry="16" fill="#ffffff" />
    <ellipse cx="297.5" cy="333" rx="50" ry="12" fill="#f8fafc" />
  </g>

  <!-- Golden Stars & Sparkles -->
  <path d="M 120 120 L 126 138 L 144 144 L 126 150 L 120 168 L 114 150 L 96 144 L 114 138 Z" fill="url(#goldGrad)" opacity="0.9" />
  <path d="M 390 380 L 394 392 L 406 396 L 394 400 L 390 412 L 386 400 L 374 396 L 386 392 Z" fill="url(#goldGrad)" opacity="0.9" />
  <circle cx="410" cy="140" r="6" fill="#fef08a" />
</svg>`;

// SVG 2: Full Bleed Square SVG for iOS Apple Touch Icon & Android Maskable Icons
// iOS and Android mask the corners themselves. Fill 512x512 completely with background, pull in gold border slightly.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#78350f" />
      <stop offset="50%" stop-color="#92400e" />
      <stop offset="100%" stop-color="#451a03" />
    </linearGradient>
    <linearGradient id="cupGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7" />
      <stop offset="60%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Full Bleed Square Background (No transparent corners so iOS/Android don't render black corners) -->
  <rect width="512" height="512" fill="url(#bgGrad)" />
  
  <!-- Outer Gold Border Line (SlightlyInset for Safe Zone Masking) -->
  <rect x="24" y="24" width="464" height="464" rx="90" fill="none" stroke="url(#goldGrad)" stroke-width="8" opacity="0.85" />

  <!-- Rubber Tree Leaves Canopy -->
  <path d="M 140 180 C 100 130 150 60 220 70 C 260 30 340 30 380 80 C 440 90 450 160 410 200 C 430 250 380 300 320 280 C 280 300 200 290 160 250 C 110 240 100 190 140 180 Z" fill="#10b981" opacity="0.25" />
  <path d="M 180 150 C 150 110 200 60 256 75 C 300 45 360 65 380 110 C 420 130 410 180 380 200 C 350 220 280 210 256 200 C 210 210 160 180 180 150 Z" fill="#34d399" opacity="0.35" />

  <!-- Main Rubber Tree Trunk -->
  <path d="M 180 50 C 200 140 210 260 190 460 L 290 460 C 280 300 290 160 310 50 Z" fill="url(#trunkGrad)" filter="url(#shadow)" />

  <!-- Spiral Tapping Cut Groove -->
  <path d="M 210 170 C 235 195 260 220 285 240" fill="none" stroke="#fef08a" stroke-width="12" stroke-linecap="round" />
  <path d="M 210 170 C 235 195 260 220 285 240" fill="none" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" />

  <!-- Tapping Spout -->
  <path d="M 280 235 L 310 255 L 290 260 Z" fill="#9ca3af" />

  <!-- Dripping Latex Liquid Drops -->
  <path d="M 298 265 C 298 265 292 280 292 288 C 292 293 295 297 298 297 C 301 297 304 293 304 288 C 304 280 298 265 298 265 Z" fill="#ffffff" filter="url(#shadow)" />
  <circle cx="298" cy="315" r="5" fill="#ffffff" />

  <!-- Latex Collection Cup -->
  <g filter="url(#shadow)">
    <!-- Cup Metal Wire Hanger Ring -->
    <path d="M 220 330 C 220 380 370 380 370 330" fill="none" stroke="#d1d5db" stroke-width="6" stroke-dasharray="10 4" />

    <!-- Latex Cup Body -->
    <path d="M 235 320 L 250 400 C 255 420 340 420 345 400 L 360 320 Z" fill="url(#cupGrad)" stroke="#b45309" stroke-width="4" />
    
    <!-- White Liquid Latex Filling the Cup -->
    <ellipse cx="297.5" cy="330" rx="58" ry="16" fill="#ffffff" />
    <ellipse cx="297.5" cy="333" rx="50" ry="12" fill="#f8fafc" />
  </g>

  <!-- Golden Stars & Sparkles -->
  <path d="M 120 120 L 126 138 L 144 144 L 126 150 L 120 168 L 114 150 L 96 144 L 114 138 Z" fill="url(#goldGrad)" opacity="0.9" />
  <path d="M 390 380 L 394 392 L 406 396 L 394 400 L 390 412 L 386 400 L 374 396 L 386 392 Z" fill="url(#goldGrad)" opacity="0.9" />
  <circle cx="410" cy="140" r="6" fill="#fef08a" />
</svg>`;

fs.writeFileSync('./public/logo.svg', standardSvg);

function renderPngFromSvg(svgString, width, outputPath) {
  const resvg = new Resvg(Buffer.from(svgString), {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Generated ${outputPath} (${width}x${width}, ${pngBuffer.length} bytes)`);
}

// Standard PWA & Favicon Icons
renderPngFromSvg(standardSvg, 192, path.resolve('./public/pwa-192.png'));
renderPngFromSvg(standardSvg, 512, path.resolve('./public/pwa-512.png'));

// iOS Apple Touch Icons (uses full bleed square so iOS applies rounded corners cleanly with NO black background)
renderPngFromSvg(maskableSvg, 180, path.resolve('./public/apple-touch-icon.png'));
renderPngFromSvg(maskableSvg, 180, path.resolve('./public/apple-touch-icon-precomposed.png'));
renderPngFromSvg(maskableSvg, 167, path.resolve('./public/apple-touch-icon-167x167.png'));
renderPngFromSvg(maskableSvg, 152, path.resolve('./public/apple-touch-icon-152x152.png'));
renderPngFromSvg(maskableSvg, 120, path.resolve('./public/apple-touch-icon-120x120.png'));

// Android Maskable & Chrome Icons (uses full bleed square to fit adaptive icon shapes)
renderPngFromSvg(maskableSvg, 192, path.resolve('./public/android-chrome-192x192.png'));
renderPngFromSvg(maskableSvg, 512, path.resolve('./public/android-chrome-512x512.png'));

console.log('Successfully generated all PWA icons for iOS and Android!');
