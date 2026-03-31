const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.resolve(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

async function createAsset(filename, svgContent) {
  const outPath = path.join(assetsDir, filename);
  await sharp(Buffer.from(svgContent)).png().toFile(outPath);
  console.log(`  Created: ${filename}`);
}

async function main() {
  console.log('Generating assets...\n');

  // 1. Background - dark with subtle purple/cyan radial glow
  await createAsset('bg-dark.png', `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">
    <rect width="960" height="540" fill="#0A0E1A"/>
    <defs>
      <radialGradient id="g1" cx="50%" cy="40%" r="70%">
        <stop offset="0%" style="stop-color:#1a1040;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#0A0E1A;stop-opacity:1"/>
      </radialGradient>
    </defs>
    <rect width="960" height="540" fill="url(#g1)"/>
  </svg>`);

  // 2. Title background - more dramatic with purple center glow
  await createAsset('bg-title.png', `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">
    <rect width="960" height="540" fill="#0A0E1A"/>
    <defs>
      <radialGradient id="g1" cx="50%" cy="45%" r="60%">
        <stop offset="0%" style="stop-color:#2d1b69;stop-opacity:1"/>
        <stop offset="60%" style="stop-color:#120a30;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#0A0E1A;stop-opacity:1"/>
      </radialGradient>
    </defs>
    <rect width="960" height="540" fill="url(#g1)"/>
    <line x1="0" y1="535" x2="960" y2="535" stroke="#8B5CF6" stroke-width="3" opacity="0.6"/>
  </svg>`);

  // 3. Accent bar - purple gradient
  await createAsset('accent-purple.png', `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:0"/>
        <stop offset="30%" style="stop-color:#8B5CF6;stop-opacity:1"/>
        <stop offset="70%" style="stop-color:#06B6D4;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="4" fill="url(#g)"/>
  </svg>`);

  // 4. Gold accent bar
  await createAsset('accent-gold.png', `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:0"/>
        <stop offset="30%" style="stop-color:#F59E0B;stop-opacity:1"/>
        <stop offset="70%" style="stop-color:#F59E0B;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="4" fill="url(#g)"/>
  </svg>`);

  // 5. Coin icon - gold circle with OC text
  await createAsset('coin-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FBBF24"/>
        <stop offset="50%" style="stop-color:#F59E0B"/>
        <stop offset="100%" style="stop-color:#D97706"/>
      </linearGradient>
    </defs>
    <circle cx="128" cy="128" r="120" fill="url(#g)"/>
    <circle cx="128" cy="128" r="100" fill="none" stroke="#92400E" stroke-width="4" opacity="0.4"/>
    <text x="128" y="148" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="72" fill="#92400E" opacity="0.8">OC</text>
    <text x="128" y="145" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="72" fill="#FFFFFF">OC</text>
  </svg>`);

  // 6. Star icon - golden star
  await createAsset('star-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FBBF24"/>
        <stop offset="100%" style="stop-color:#F59E0B"/>
      </linearGradient>
    </defs>
    <polygon points="128,20 160,95 240,105 180,160 195,240 128,205 61,240 76,160 16,105 96,95" fill="url(#g)"/>
  </svg>`);

  // 7. Trophy icon
  await createAsset('trophy-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FBBF24"/>
        <stop offset="100%" style="stop-color:#F59E0B"/>
      </linearGradient>
    </defs>
    <path d="M80,40 h96 v10 h30 v50 c0,25-20,40-40,45 h-10 l-5,40 h-46 l-5-40 h-10 c-20-5-40-20-40-45 v-50 h30 z" fill="url(#g)"/>
    <rect x="90" y="190" width="76" height="12" rx="3" fill="#F59E0B"/>
    <rect x="80" y="206" width="96" height="16" rx="4" fill="#D97706"/>
  </svg>`);

  // 8. Swords icon (battle/challenge)
  await createAsset('swords-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <g transform="rotate(-45, 128, 128)">
      <rect x="118" y="20" width="20" height="160" rx="3" fill="#06B6D4"/>
      <rect x="110" y="170" width="36" height="10" rx="3" fill="#94A3B8"/>
      <rect x="115" y="182" width="26" height="30" rx="3" fill="#64748B"/>
    </g>
    <g transform="rotate(45, 128, 128)">
      <rect x="118" y="20" width="20" height="160" rx="3" fill="#EF4444"/>
      <rect x="110" y="170" width="36" height="10" rx="3" fill="#94A3B8"/>
      <rect x="115" y="182" width="26" height="30" rx="3" fill="#64748B"/>
    </g>
  </svg>`);

  // 9. Store/shop icon
  await createAsset('store-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect x="40" y="100" width="176" height="120" rx="8" fill="#8B5CF6"/>
    <path d="M30,60 h196 l20,40 h-236 z" fill="#A78BFA"/>
    <rect x="100" y="140" width="56" height="80" rx="4" fill="#0A0E1A"/>
    <circle cx="145" cy="180" r="5" fill="#F59E0B"/>
  </svg>`);

  // 10. Shield/rules icon
  await createAsset('shield-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <path d="M128,30 L220,70 V150 C220,200 175,240 128,250 C81,240 36,200 36,150 V70 Z" fill="#10B981"/>
    <path d="M110,140 l25,25 l45-50" fill="none" stroke="white" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`);

  // 11. Clock/timeline icon
  await createAsset('clock-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <circle cx="128" cy="128" r="110" fill="none" stroke="#06B6D4" stroke-width="12"/>
    <circle cx="128" cy="128" r="8" fill="#06B6D4"/>
    <line x1="128" y1="128" x2="128" y2="60" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
    <line x1="128" y1="128" x2="180" y2="128" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
  </svg>`);

  // 12. Rocket/launch icon
  await createAsset('rocket-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <path d="M128,30 C128,30 170,80 170,160 L148,190 H108 L86,160 C86,80 128,30 128,30Z" fill="#8B5CF6"/>
    <circle cx="128" cy="120" r="20" fill="#06B6D4"/>
    <path d="M108,190 L90,230 L128,210 L166,230 L148,190Z" fill="#F59E0B"/>
    <path d="M86,130 L50,150 L86,160Z" fill="#A78BFA"/>
    <path d="M170,130 L206,150 L170,160Z" fill="#A78BFA"/>
  </svg>`);

  // 13. Card background - dark card with purple border glow
  await createAsset('card-purple.png', `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect x="4" y="4" width="292" height="192" rx="12" fill="#111827" stroke="#8B5CF6" stroke-width="2" filter="url(#glow)"/>
  </svg>`);

  // 14. Card background - gold border
  await createAsset('card-gold.png', `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
    <rect x="4" y="4" width="292" height="192" rx="12" fill="#111827" stroke="#F59E0B" stroke-width="2"/>
  </svg>`);

  // 15. Arrow right
  await createAsset('arrow-right.png', `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <path d="M20,32 h24 M36,22 l12,10 l-12,10" fill="none" stroke="#8B5CF6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`);

  // 16. Person/user icon
  await createAsset('user-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <circle cx="128" cy="90" r="50" fill="#06B6D4"/>
    <path d="M48,230 C48,170 88,140 128,140 C168,140 208,170 208,230" fill="#06B6D4"/>
  </svg>`);

  // 17. QR/check-in icon
  await createAsset('qr-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect x="30" y="30" width="80" height="80" rx="8" fill="none" stroke="#10B981" stroke-width="10"/>
    <rect x="50" y="50" width="40" height="40" rx="4" fill="#10B981"/>
    <rect x="146" y="30" width="80" height="80" rx="8" fill="none" stroke="#10B981" stroke-width="10"/>
    <rect x="166" y="50" width="40" height="40" rx="4" fill="#10B981"/>
    <rect x="30" y="146" width="80" height="80" rx="8" fill="none" stroke="#10B981" stroke-width="10"/>
    <rect x="50" y="166" width="40" height="40" rx="4" fill="#10B981"/>
    <rect x="146" y="146" width="30" height="30" rx="4" fill="#10B981"/>
    <rect x="196" y="146" width="30" height="30" rx="4" fill="#10B981"/>
    <rect x="146" y="196" width="30" height="30" rx="4" fill="#10B981"/>
    <rect x="196" y="196" width="30" height="30" rx="4" fill="#10B981"/>
  </svg>`);

  // 18. VS badge for challenge slide
  await createAsset('vs-badge.png', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:#EF4444"/>
        <stop offset="100%" style="stop-color:#991B1B"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="90" fill="url(#g)"/>
    <text x="100" y="120" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="64" fill="white">VS</text>
  </svg>`);

  // 19. Number circle badges (1-4)
  for (let i = 1; i <= 4; i++) {
    await createAsset(`num-${i}.png`, `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r="58" fill="#8B5CF6"/>
      <text x="64" y="82" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="56" fill="white">${i}</text>
    </svg>`);
  }

  // 20. Fire/streak icon
  await createAsset('fire-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <path d="M128,20 C128,20 190,80 190,160 C190,200 162,240 128,240 C94,240 66,200 66,160 C66,80 128,20 128,20Z" fill="#EF4444"/>
    <path d="M128,100 C128,100 160,130 160,170 C160,195 146,215 128,215 C110,215 96,195 96,170 C96,130 128,100 128,100Z" fill="#F59E0B"/>
    <path d="M128,150 C128,150 142,165 142,185 C142,198 136,205 128,205 C120,205 114,198 114,185 C114,165 128,150 128,150Z" fill="#FBBF24"/>
  </svg>`);

  console.log('\nAll assets generated!');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
