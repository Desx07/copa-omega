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
  console.log('Generating BeyGames assets...\n');

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

  // 2. Title background - dramatic purple center glow + bottom accent
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

  // 3. Section title bg - purple glow on left side
  await createAsset('bg-section.png', `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">
    <rect width="960" height="540" fill="#0A0E1A"/>
    <defs>
      <radialGradient id="g1" cx="30%" cy="50%" r="60%">
        <stop offset="0%" style="stop-color:#1e1250;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#0A0E1A;stop-opacity:1"/>
      </radialGradient>
    </defs>
    <rect width="960" height="540" fill="url(#g1)"/>
    <rect x="0" y="0" width="6" height="540" fill="#8B5CF6" opacity="0.8"/>
  </svg>`);

  // 4. Accent bar - purple to cyan
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

  // 5. Gold accent bar
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

  // 6. Cyan accent bar
  await createAsset('accent-cyan.png', `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#06B6D4;stop-opacity:0"/>
        <stop offset="30%" style="stop-color:#06B6D4;stop-opacity:1"/>
        <stop offset="70%" style="stop-color:#06B6D4;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="4" fill="url(#g)"/>
  </svg>`);

  // 7. Green accent bar
  await createAsset('accent-green.png', `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#10B981;stop-opacity:0"/>
        <stop offset="30%" style="stop-color:#10B981;stop-opacity:1"/>
        <stop offset="70%" style="stop-color:#10B981;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#10B981;stop-opacity:0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="4" fill="url(#g)"/>
  </svg>`);

  // 8. Red accent bar
  await createAsset('accent-red.png', `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#EF4444;stop-opacity:0"/>
        <stop offset="30%" style="stop-color:#EF4444;stop-opacity:1"/>
        <stop offset="70%" style="stop-color:#EF4444;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#EF4444;stop-opacity:0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="4" fill="url(#g)"/>
  </svg>`);

  // 9. Pink accent bar
  await createAsset('accent-pink.png', `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="4">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#EC4899;stop-opacity:0"/>
        <stop offset="30%" style="stop-color:#EC4899;stop-opacity:1"/>
        <stop offset="70%" style="stop-color:#EC4899;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#EC4899;stop-opacity:0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="4" fill="url(#g)"/>
  </svg>`);

  // 10. BeyPet icon - digital creature/tamagotchi
  await createAsset('beypet-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:#06B6D4;stop-opacity:0.3"/>
        <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:0"/>
      </radialGradient>
    </defs>
    <circle cx="128" cy="128" r="120" fill="url(#glow)"/>
    <ellipse cx="128" cy="135" rx="65" ry="55" fill="#06B6D4"/>
    <ellipse cx="128" cy="130" rx="60" ry="50" fill="#0891B2"/>
    <circle cx="105" cy="118" r="12" fill="#FFFFFF"/>
    <circle cx="151" cy="118" r="12" fill="#FFFFFF"/>
    <circle cx="108" cy="118" r="6" fill="#0A0E1A"/>
    <circle cx="154" cy="118" r="6" fill="#0A0E1A"/>
    <path d="M112,145 Q128,158 144,145" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
    <path d="M80,90 Q90,60 110,85" fill="#06B6D4" stroke="none"/>
    <path d="M176,90 Q166,60 146,85" fill="#06B6D4" stroke="none"/>
  </svg>`);

  // 11. Swords/Deck Battle icon
  await createAsset('swords-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <g transform="rotate(-45, 128, 128)">
      <rect x="118" y="20" width="20" height="160" rx="3" fill="#EF4444"/>
      <rect x="110" y="170" width="36" height="10" rx="3" fill="#94A3B8"/>
      <rect x="115" y="182" width="26" height="30" rx="3" fill="#64748B"/>
    </g>
    <g transform="rotate(45, 128, 128)">
      <rect x="118" y="20" width="20" height="160" rx="3" fill="#8B5CF6"/>
      <rect x="110" y="170" width="36" height="10" rx="3" fill="#94A3B8"/>
      <rect x="115" y="182" width="26" height="30" rx="3" fill="#64748B"/>
    </g>
  </svg>`);

  // 12. Gacha/dice icon
  await createAsset('gacha-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F59E0B"/>
        <stop offset="100%" style="stop-color:#D97706"/>
      </linearGradient>
    </defs>
    <rect x="50" y="50" width="156" height="156" rx="24" fill="url(#g)" transform="rotate(15, 128, 128)"/>
    <circle cx="98" cy="98" r="14" fill="#0A0E1A"/>
    <circle cx="158" cy="98" r="14" fill="#0A0E1A"/>
    <circle cx="128" cy="128" r="14" fill="#0A0E1A"/>
    <circle cx="98" cy="158" r="14" fill="#0A0E1A"/>
    <circle cx="158" cy="158" r="14" fill="#0A0E1A"/>
  </svg>`);

  // 13. Gear/simulator icon
  await createAsset('gear-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981"/>
        <stop offset="100%" style="stop-color:#059669"/>
      </linearGradient>
    </defs>
    <path d="M128,40 l20,0 l5,20 l18,8 l18-10 l14,14 l-10,18 l8,18 l20,5 l0,20 l-20,5 l-8,18 l10,18 l-14,14 l-18-10 l-18,8 l-5,20 l-20,0 l-5-20 l-18-8 l-18,10 l-14-14 l10-18 l-8-18 l-20-5 l0-20 l20-5 l8-18 l-10-18 l14-14 l18,10 l18-8 z" fill="url(#g)"/>
    <circle cx="128" cy="128" r="35" fill="#0A0E1A"/>
    <circle cx="128" cy="128" r="25" fill="none" stroke="#10B981" stroke-width="4"/>
  </svg>`);

  // 14. Coliseum/arena icon
  await createAsset('coliseum-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#EF4444"/>
        <stop offset="100%" style="stop-color:#B91C1C"/>
      </linearGradient>
    </defs>
    <ellipse cx="128" cy="180" rx="100" ry="35" fill="none" stroke="#EF4444" stroke-width="6"/>
    <rect x="38" y="80" width="16" height="100" rx="4" fill="url(#g)"/>
    <rect x="74" y="60" width="16" height="120" rx="4" fill="url(#g)"/>
    <rect x="110" y="50" width="16" height="130" rx="4" fill="url(#g)"/>
    <rect x="148" y="50" width="16" height="130" rx="4" fill="url(#g)"/>
    <rect x="184" y="60" width="16" height="120" rx="4" fill="url(#g)"/>
    <rect x="218" y="80" width="16" height="100" rx="4" fill="url(#g)"/>
    <path d="M28,80 h216 v-15 l-108-30 l-108,30 z" fill="#EF4444" opacity="0.6"/>
  </svg>`);

  // 15. Card/blader card icon
  await createAsset('card-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#EC4899"/>
        <stop offset="100%" style="stop-color:#BE185D"/>
      </linearGradient>
    </defs>
    <rect x="55" y="30" width="146" height="196" rx="14" fill="url(#g)"/>
    <rect x="62" y="37" width="132" height="182" rx="10" fill="#0A0E1A"/>
    <circle cx="128" cy="95" r="30" fill="#EC4899" opacity="0.4"/>
    <circle cx="128" cy="95" r="22" fill="#EC4899" opacity="0.6"/>
    <rect x="80" y="140" width="96" height="8" rx="4" fill="#EC4899" opacity="0.5"/>
    <rect x="90" y="158" width="76" height="6" rx="3" fill="#94A3B8" opacity="0.4"/>
    <rect x="85" y="175" width="86" height="6" rx="3" fill="#94A3B8" opacity="0.3"/>
    <rect x="95" y="192" width="66" height="6" rx="3" fill="#94A3B8" opacity="0.2"/>
  </svg>`);

  // 16. Coin icon
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

  // 17. VS badge
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

  // 18. Star icon
  await createAsset('star-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FBBF24"/>
        <stop offset="100%" style="stop-color:#F59E0B"/>
      </linearGradient>
    </defs>
    <polygon points="128,20 160,95 240,105 180,160 195,240 128,205 61,240 76,160 16,105 96,95" fill="url(#g)"/>
  </svg>`);

  // 19. BeyPet creature mockup - larger for the mockup slide
  await createAsset('beypet-creature.png', `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:0.4"/>
        <stop offset="60%" style="stop-color:#06B6D4;stop-opacity:0.15"/>
        <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:0"/>
      </radialGradient>
      <radialGradient id="body" cx="50%" cy="40%" r="50%">
        <stop offset="0%" style="stop-color:#22D3EE"/>
        <stop offset="100%" style="stop-color:#0891B2"/>
      </radialGradient>
    </defs>
    <circle cx="150" cy="150" r="145" fill="url(#glow)"/>
    <path d="M90,100 Q80,50 115,80" fill="#06B6D4"/>
    <path d="M210,100 Q220,50 185,80" fill="#06B6D4"/>
    <ellipse cx="150" cy="160" rx="80" ry="70" fill="url(#body)"/>
    <ellipse cx="150" cy="155" rx="75" ry="65" fill="#0891B2"/>
    <ellipse cx="150" cy="150" rx="70" ry="60" fill="#0E7490"/>
    <circle cx="120" cy="135" r="18" fill="#FFFFFF"/>
    <circle cx="180" cy="135" r="18" fill="#FFFFFF"/>
    <circle cx="124" cy="135" r="10" fill="#0A0E1A"/>
    <circle cx="184" cy="135" r="10" fill="#0A0E1A"/>
    <circle cx="126" cy="132" r="4" fill="#FFFFFF"/>
    <circle cx="186" cy="132" r="4" fill="#FFFFFF"/>
    <path d="M130,175 Q150,192 170,175" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
    <path d="M85,200 Q70,230 95,220" fill="#06B6D4"/>
    <path d="M215,200 Q230,230 205,220" fill="#06B6D4"/>
    <ellipse cx="150" cy="220" rx="40" ry="8" fill="#8B5CF6" opacity="0.15"/>
  </svg>`);

  // 20. Slot machine columns (BLADE | RATCHET | BIT)
  await createAsset('slot-machine.png', `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="200" viewBox="0 0 500 200">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#1E1B4B"/>
        <stop offset="100%" style="stop-color:#0A0E1A"/>
      </linearGradient>
    </defs>
    <rect width="500" height="200" rx="16" fill="url(#g)" stroke="#8B5CF6" stroke-width="3"/>
    <rect x="20" y="50" width="140" height="100" rx="10" fill="#111827" stroke="#F59E0B" stroke-width="2"/>
    <rect x="180" y="50" width="140" height="100" rx="10" fill="#111827" stroke="#06B6D4" stroke-width="2"/>
    <rect x="340" y="50" width="140" height="100" rx="10" fill="#111827" stroke="#10B981" stroke-width="2"/>
    <text x="90" y="108" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#F59E0B">BLADE</text>
    <text x="250" y="108" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#06B6D4">RATCHET</text>
    <text x="410" y="108" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#10B981">BIT</text>
    <text x="90" y="30" text-anchor="middle" font-family="Arial" font-size="14" fill="#94A3B8">?</text>
    <text x="250" y="30" text-anchor="middle" font-family="Arial" font-size="14" fill="#94A3B8">?</text>
    <text x="410" y="30" text-anchor="middle" font-family="Arial" font-size="14" fill="#94A3B8">?</text>
  </svg>`);

  // 21. Pentagon radar chart mockup
  await createAsset('radar-chart.png', `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <defs>
      <linearGradient id="fill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981;stop-opacity:0.3"/>
        <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:0.3"/>
      </linearGradient>
    </defs>
    <!-- Pentagon grid lines -->
    <polygon points="150,30 270,117 225,258 75,258 30,117" fill="none" stroke="#1E293B" stroke-width="1"/>
    <polygon points="150,66 234,135 201,231 99,231 66,135" fill="none" stroke="#1E293B" stroke-width="1"/>
    <polygon points="150,102 198,153 177,204 123,204 102,153" fill="none" stroke="#1E293B" stroke-width="1"/>
    <!-- Data polygon -->
    <polygon points="150,50 255,130 210,245 90,220 55,125" fill="url(#fill)" stroke="#10B981" stroke-width="2"/>
    <!-- Vertices dots -->
    <circle cx="150" cy="50" r="5" fill="#10B981"/>
    <circle cx="255" cy="130" r="5" fill="#10B981"/>
    <circle cx="210" cy="245" r="5" fill="#10B981"/>
    <circle cx="90" cy="220" r="5" fill="#10B981"/>
    <circle cx="55" cy="125" r="5" fill="#10B981"/>
    <!-- Labels -->
    <text x="150" y="20" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#FFFFFF">ATK</text>
    <text x="285" y="120" text-anchor="start" font-family="Arial" font-weight="bold" font-size="14" fill="#FFFFFF">DEF</text>
    <text x="225" y="275" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#FFFFFF">STA</text>
    <text x="75" y="275" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#FFFFFF">PESO</text>
    <text x="15" y="120" text-anchor="start" font-family="Arial" font-weight="bold" font-size="14" fill="#FFFFFF">BURST</text>
  </svg>`);

  // 22. Arena/coliseo circular with 8 positions
  await createAsset('arena-8.png', `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <radialGradient id="arena" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:#1E1B4B"/>
        <stop offset="70%" style="stop-color:#0F172A"/>
        <stop offset="100%" style="stop-color:#0A0E1A"/>
      </radialGradient>
    </defs>
    <circle cx="200" cy="200" r="190" fill="url(#arena)" stroke="#EF4444" stroke-width="3"/>
    <circle cx="200" cy="200" r="140" fill="none" stroke="#EF4444" stroke-width="1" opacity="0.3"/>
    <circle cx="200" cy="200" r="50" fill="none" stroke="#F59E0B" stroke-width="2" opacity="0.5"/>
    <!-- 8 player positions -->
    <circle cx="200" cy="40" r="22" fill="#111827" stroke="#8B5CF6" stroke-width="2"/>
    <text x="200" y="46" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#8B5CF6">P1</text>
    <circle cx="313" cy="87" r="22" fill="#111827" stroke="#06B6D4" stroke-width="2"/>
    <text x="313" y="93" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#06B6D4">P2</text>
    <circle cx="360" cy="200" r="22" fill="#111827" stroke="#10B981" stroke-width="2"/>
    <text x="360" y="206" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#10B981">P3</text>
    <circle cx="313" cy="313" r="22" fill="#111827" stroke="#F59E0B" stroke-width="2"/>
    <text x="313" y="319" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#F59E0B">P4</text>
    <circle cx="200" cy="360" r="22" fill="#111827" stroke="#EF4444" stroke-width="2"/>
    <text x="200" y="366" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#EF4444">P5</text>
    <circle cx="87" cy="313" r="22" fill="#111827" stroke="#EC4899" stroke-width="2"/>
    <text x="87" y="319" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#EC4899">P6</text>
    <circle cx="40" cy="200" r="22" fill="#111827" stroke="#8B5CF6" stroke-width="2"/>
    <text x="40" y="206" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#8B5CF6">P7</text>
    <circle cx="87" cy="87" r="22" fill="#111827" stroke="#06B6D4" stroke-width="2"/>
    <text x="87" y="93" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#06B6D4">P8</text>
  </svg>`);

  // 23. Blader card mockup
  await createAsset('blader-card.png', `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="400" viewBox="0 0 280 400">
    <defs>
      <linearGradient id="border" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F59E0B"/>
        <stop offset="50%" style="stop-color:#8B5CF6"/>
        <stop offset="100%" style="stop-color:#F59E0B"/>
      </linearGradient>
      <radialGradient id="bg" cx="50%" cy="30%" r="70%">
        <stop offset="0%" style="stop-color:#1E1B4B"/>
        <stop offset="100%" style="stop-color:#0A0E1A"/>
      </radialGradient>
    </defs>
    <rect x="4" y="4" width="272" height="392" rx="16" fill="url(#bg)" stroke="url(#border)" stroke-width="4"/>
    <!-- Avatar circle -->
    <circle cx="140" cy="100" r="45" fill="#111827" stroke="#8B5CF6" stroke-width="3"/>
    <circle cx="140" cy="100" r="35" fill="#8B5CF6" opacity="0.3"/>
    <text x="140" y="110" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="24" fill="#FFFFFF">D</text>
    <!-- Name -->
    <text x="140" y="175" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="28" fill="#FFFFFF">DESX</text>
    <!-- Badge -->
    <rect x="85" y="188" width="110" height="24" rx="12" fill="#F59E0B" opacity="0.2"/>
    <text x="140" y="206" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="13" fill="#F59E0B">CHAMPION</text>
    <!-- Stats -->
    <text x="140" y="245" text-anchor="middle" font-family="Arial" font-size="16" fill="#94A3B8">28 | W: 5 | L: 2</text>
    <!-- Win rate -->
    <rect x="75" y="260" width="130" height="8" rx="4" fill="#1E293B"/>
    <rect x="75" y="260" width="92" height="8" rx="4" fill="#10B981"/>
    <text x="140" y="285" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14" fill="#10B981">Win Rate: 71%</text>
    <!-- Main bey -->
    <rect x="40" y="305" width="200" height="40" rx="8" fill="#111827" stroke="#8B5CF6" stroke-width="1"/>
    <text x="140" y="320" text-anchor="middle" font-family="Arial" font-size="10" fill="#94A3B8">MAIN BEY</text>
    <text x="140" y="338" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="13" fill="#FFFFFF">Shark Scale 4-55LO</text>
    <!-- Bottom glow line -->
    <line x1="40" y1="370" x2="240" y2="370" stroke="#8B5CF6" stroke-width="2" opacity="0.5"/>
  </svg>`);

  // 24. Number circles (1-6) for overview grid
  const modeColors = ['06B6D4', '8B5CF6', 'F59E0B', '10B981', 'EF4444', 'EC4899'];
  for (let i = 1; i <= 6; i++) {
    await createAsset(`num-${i}.png`, `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r="58" fill="#${modeColors[i-1]}"/>
      <text x="64" y="82" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="56" fill="white">${i}</text>
    </svg>`);
  }

  // 25. Live/prediction icon (eye with glow)
  await createAsset('live-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:#EF4444;stop-opacity:0.3"/>
        <stop offset="100%" style="stop-color:#EF4444;stop-opacity:0"/>
      </radialGradient>
    </defs>
    <circle cx="128" cy="128" r="120" fill="url(#glow)"/>
    <path d="M30,128 Q128,50 226,128 Q128,206 30,128 Z" fill="none" stroke="#EF4444" stroke-width="8"/>
    <circle cx="128" cy="128" r="35" fill="#EF4444"/>
    <circle cx="128" cy="128" r="20" fill="#0A0E1A"/>
    <circle cx="128" cy="128" r="10" fill="#EF4444"/>
    <circle cx="120" cy="120" r="5" fill="#FFFFFF" opacity="0.7"/>
  </svg>`);

  // 26. Closing bg - dramatic glow
  await createAsset('bg-closing.png', `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">
    <rect width="960" height="540" fill="#0A0E1A"/>
    <defs>
      <radialGradient id="g1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:#2d1b69;stop-opacity:1"/>
        <stop offset="50%" style="stop-color:#120a30;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#0A0E1A;stop-opacity:1"/>
      </radialGradient>
    </defs>
    <rect width="960" height="540" fill="url(#g1)"/>
    <line x1="0" y1="5" x2="960" y2="5" stroke="#F59E0B" stroke-width="3" opacity="0.6"/>
    <line x1="0" y1="535" x2="960" y2="535" stroke="#8B5CF6" stroke-width="3" opacity="0.6"/>
  </svg>`);

  // 27. Trophy small
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

  // 28. Check icon
  await createAsset('check-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="28" fill="#10B981"/>
    <path d="M20,32 l8,8 l16-16" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`);

  // 29. X icon
  await createAsset('x-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="28" fill="#EF4444"/>
    <path d="M22,22 l20,20 M42,22 l-20,20" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/>
  </svg>`);

  // 30. Question mark icon
  await createAsset('question-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="28" fill="#F59E0B"/>
    <text x="32" y="42" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="32" fill="white">?</text>
  </svg>`);

  // 31. Energy bolt
  await createAsset('energy-icon.png', `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <polygon points="72,8 32,64 56,64 40,120 96,52 68,52" fill="#F59E0B"/>
  </svg>`);

  console.log('\nAll BeyGames assets generated!');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
