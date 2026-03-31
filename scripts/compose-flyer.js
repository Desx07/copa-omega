const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Register Normatica fonts
const fontsDir = 'C:\\Users\\ariel\\AppData\\Local\\Microsoft\\Windows\\Fonts';
registerFont(path.join(fontsDir, 'Normatica-Bold.ttf'), { family: 'Normatica', weight: 'bold' });
registerFont(path.join(fontsDir, 'Normatica-Black.ttf'), { family: 'Normatica', weight: '900' });
registerFont(path.join(fontsDir, 'Normatica-Medium.ttf'), { family: 'Normatica', weight: '500' });
registerFont(path.join(fontsDir, 'Normatica-Regular.ttf'), { family: 'Normatica', weight: 'normal' });

async function main() {
  // === LOAD ALL ELEMENTS ===
  const bgArt = await loadImage('tmp_element_background.png');
  const ghostLogo = await loadImage('tmp_fantasma_logo_transparent.png');
  const bladersLogo = await loadImage('public/bladers-logo.png');

  // === CANVAS: 1080x1440 (IG Post Bladers SFE) ===
  const W = 1080, H = 1440;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ============================================
  // LAYER 1: Background gradient (full canvas)
  // ============================================
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#E8308A');
  bgGrad.addColorStop(0.45, '#D02878');
  bgGrad.addColorStop(0.55, '#1A8A7A');
  bgGrad.addColorStop(1, '#0D5C52');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ============================================
  // LAYER 2: Character art (upper portion)
  // ============================================
  // Scale to fill width, crop height
  const artScale = W / bgArt.width; // 1080/1024
  const artH = bgArt.height * artScale;
  // Draw slightly higher to leave room for gradient cut
  ctx.drawImage(bgArt, 0, -artH * 0.08, W, artH);

  // ============================================
  // LAYER 3: Halftone dot pattern overlay
  // ============================================
  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let y = 0; y < H * 0.55; y += 8) {
    for (let x = 0; x < W; x += 8) {
      if ((Math.floor(x/8) + Math.floor(y/8)) % 2 === 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // ============================================
  // LAYER 4: Diagonal gradient cut
  // ============================================
  // Creates the transition from image area to info area
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, H * 0.48);
  ctx.lineTo(W, H * 0.42);
  ctx.lineTo(W, H * 0.55);
  ctx.lineTo(0, H * 0.55);
  ctx.closePath();

  const cutGrad = ctx.createLinearGradient(0, H * 0.42, W, H * 0.55);
  cutGrad.addColorStop(0, '#E8308A');
  cutGrad.addColorStop(0.5, '#F04898');
  cutGrad.addColorStop(1, '#E8308A');
  ctx.fillStyle = cutGrad;
  ctx.fill();
  ctx.restore();

  // Lower solid area
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, H * 0.55);
  ctx.lineTo(W, H * 0.55);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();

  const lowerGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
  lowerGrad.addColorStop(0, '#178878');
  lowerGrad.addColorStop(0.5, '#0F6858');
  lowerGrad.addColorStop(1, '#0A4A3E');
  ctx.fillStyle = lowerGrad;
  ctx.fill();
  ctx.restore();

  // Thin accent line along the diagonal cut
  ctx.save();
  const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0, '#FF2070');
  lineGrad.addColorStop(0.5, '#FF6098');
  lineGrad.addColorStop(1, '#FF2070');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.48);
  ctx.lineTo(W, H * 0.42);
  ctx.stroke();
  ctx.restore();

  // ============================================
  // LAYER 5: Tournament logo (center)
  // ============================================
  const logoW = 320;
  const logoH = logoW * (ghostLogo.height / ghostLogo.width);
  const logoX = (W - logoW) / 2;
  const logoY = H * 0.38 - logoH / 2;
  ctx.drawImage(ghostLogo, logoX, logoY, logoW, logoH);

  // ============================================
  // LAYER 6: Text (Normatica)
  // ============================================
  ctx.textAlign = 'center';

  // "¡INSCRIPCIONES ABIERTAS!"
  ctx.font = '900 62px "Normatica"';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillText('¡INSCRIPCIONES', W/2, H * 0.60);
  ctx.fillText('ABIERTAS!', W/2, H * 0.655);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // "SAB-28 | BLADERS.SFE"
  ctx.font = '900 52px "Normatica"';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('SAB-28', W * 0.28, H * 0.735);

  // Vertical separator
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(W * 0.46, H * 0.705, 2, H * 0.045);

  ctx.font = '900 52px "Normatica"';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('BLADERS.SFE', W * 0.70, H * 0.735);

  // "MARZO" and "PARQUE FEDERAL"
  ctx.font = '500 22px "Normatica"';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('MARZO', W * 0.28, H * 0.77);

  ctx.fillText('📍 PARQUE FEDERAL', W * 0.70, H * 0.77);

  // "Hora de comienzo: 16:00h"
  ctx.font = '500 22px "Normatica"';
  ctx.fillStyle = '#FF6098';
  ctx.fillText('Hora de comienzo: 16:00h', W/2, H * 0.82);

  // ============================================
  // LAYER 7: CTA Button
  // ============================================
  const btnW = 580;
  const btnH = 48;
  const btnX = (W - btnW) / 2;
  const btnY = H * 0.845;
  const btnR = 24;

  // Button gradient
  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
  btnGrad.addColorStop(0, '#E8308A');
  btnGrad.addColorStop(0.5, '#F04898');
  btnGrad.addColorStop(1, '#E8308A');
  ctx.fillStyle = btnGrad;

  // Rounded rect
  ctx.beginPath();
  ctx.moveTo(btnX + btnR, btnY);
  ctx.arcTo(btnX + btnW, btnY, btnX + btnW, btnY + btnH, btnR);
  ctx.arcTo(btnX + btnW, btnY + btnH, btnX, btnY + btnH, btnR);
  ctx.arcTo(btnX, btnY + btnH, btnX, btnY, btnR);
  ctx.arcTo(btnX, btnY, btnX + btnW, btnY, btnR);
  ctx.closePath();
  ctx.fill();

  // Button text
  ctx.font = 'bold 22px "Normatica"';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('PARTICIPÁ POR UN BEYBLADE 🏆', W/2, btnY + 33);

  // ============================================
  // LAYER 8: Bladers Santa Fe logo (bottom)
  // ============================================
  const bLogoW = 180;
  const bLogoH = bLogoW * (bladersLogo.height / bladersLogo.width);
  ctx.drawImage(bladersLogo, (W - bLogoW) / 2, H * 0.91, bLogoW, bLogoH);

  // ============================================
  // SAVE
  // ============================================
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync('tmp_flyer_final.png', buf);
  console.log(`Saved: tmp_flyer_final.png (${W}x${H}, ${buf.length} bytes)`);
}

main().catch(e => console.error(e));
