const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// === REGISTER NORMATICA ===
const fontsDir = 'C:\\Users\\ariel\\AppData\\Local\\Microsoft\\Windows\\Fonts';
registerFont(path.join(fontsDir, 'Normatica-Bold.ttf'), { family: 'Normatica', weight: 'bold' });
registerFont(path.join(fontsDir, 'Normatica-Black.ttf'), { family: 'Normatica', weight: '900' });
registerFont(path.join(fontsDir, 'Normatica-Medium.ttf'), { family: 'Normatica', weight: '500' });

async function main() {
  // === LOAD ELEMENTS ===
  const bgArt = await loadImage('tmp_element_background.png');
  const ghostLogo = await loadImage('tmp_fantasma_logo_transparent.png');
  const bladersLogo = await loadImage('public/bladers-logo.png');

  // === CANVAS 1080x1440 ===
  const W = 1080, H = 1440;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // =============================================
  // LAYER 1: Base background color
  // =============================================
  ctx.fillStyle = '#dcdbd9'; // Fondo gris hueso (igual que Figma)
  ctx.fillRect(0, 0, W, H);

  // =============================================
  // LAYER 2: Character art (upper ~60%)
  // =============================================
  const artScale = W / bgArt.width;
  const artH = bgArt.height * artScale;
  ctx.drawImage(bgArt, 0, -20, W, artH);

  // =============================================
  // LAYER 3: Gradient cut principal (imagen -> info)
  // Design system: 1169x989, vertical gradient
  // Original: #ec790f -> #16222c
  // Fantasma: naranja suave -> magenta (transicion gradual)
  // =============================================
  ctx.save();
  const cutY = 505; // Y position from design system
  const cutH = 989;
  const cutGrad = ctx.createLinearGradient(0, cutY, 0, cutY + cutH);
  cutGrad.addColorStop(0, 'rgba(236, 121, 15, 0.0)');    // transparente arriba
  cutGrad.addColorStop(0.15, 'rgba(236, 121, 15, 0.4)'); // naranja suave
  cutGrad.addColorStop(0.35, 'rgba(200, 80, 80, 0.7)');  // transicion
  cutGrad.addColorStop(0.55, 'rgba(180, 40, 90, 0.85)'); // rosa/magenta
  cutGrad.addColorStop(0.75, 'rgba(139, 26, 92, 0.95)'); // magenta oscuro
  cutGrad.addColorStop(1.0, '#6B1248');                    // magenta profundo
  ctx.fillStyle = cutGrad;
  ctx.fillRect(-45, cutY, W + 90, cutH);
  ctx.restore();

  // =============================================
  // LAYER 4: Franja horizontal media (info area background)
  // Design system: 1844x462, gradient naranja->dorado
  // Fantasma: magenta->rosa dorado
  // =============================================
  ctx.save();
  const franjaY = 880;
  const franjaH = 560; // hasta el final
  const franjaGrad = ctx.createLinearGradient(0, franjaY, 0, franjaY + franjaH);
  franjaGrad.addColorStop(0, '#8B1A5C');   // magenta
  franjaGrad.addColorStop(0.4, '#7A1650'); // magenta medio
  franjaGrad.addColorStop(1, '#5A1040');   // magenta oscuro
  ctx.fillStyle = franjaGrad;
  ctx.fillRect(-380, franjaY, W + 760, franjaH);
  ctx.restore();

  // =============================================
  // LAYER 5: Franja horizontal superior (accent strip)
  // Design system: 1844x154
  // =============================================
  ctx.save();
  const accentY = 860;
  const accentGrad = ctx.createLinearGradient(0, accentY, 0, accentY + 154);
  accentGrad.addColorStop(0, '#C23078'); // rosa fuerte
  accentGrad.addColorStop(1, '#E8508A'); // rosa claro
  ctx.fillStyle = accentGrad;
  ctx.fillRect(-380, accentY, W + 760, 154);
  ctx.restore();

  // =============================================
  // LAYER 6: Halftone dot pattern (23% opacity)
  // Design system: puntos blancos sobre fondo oscuro, 23%
  // =============================================
  ctx.save();
  ctx.globalAlpha = 0.23;
  for (let y = 880; y < H; y += 6) {
    for (let x = 0; x < W; x += 6) {
      if ((Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // =============================================
  // LAYER 7: Tournament logo
  // Design system: centered, ~Y=350-500 from top
  // =============================================
  const logoW = 350;
  const logoH = logoW * (ghostLogo.height / ghostLogo.width);
  const logoX = (W - logoW) / 2;
  const logoY = 620 - logoH / 2;
  ctx.drawImage(ghostLogo, logoX, logoY, logoW, logoH);

  // =============================================
  // LAYER 8: Text with Normatica + shadows
  // Design system: all white, SMALL_CAPS, DROP_SHADOW 25% black
  // =============================================
  ctx.textAlign = 'center';

  function drawText(text, x, y, fontSize, weight) {
    const shadowR = Math.round(fontSize * 0.104);
    ctx.save();
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = shadowR;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = shadowR;
    ctx.font = `${weight} ${fontSize}px "Normatica"`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // "¡INSCRIPCIONES ABIERTAS!" - 72px bold
  drawText('¡INSCRIPCIONES', W / 2, 940, 72, 'bold');
  drawText('ABIERTAS!', W / 2, 1015, 72, 'bold');

  // "SAB-28" - 62.7px bold
  drawText('SAB-28', W * 0.28, 1100, 63, 'bold');

  // Vertical separator - 7px stroke, 95px tall
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(W * 0.47, 1060);
  ctx.lineTo(W * 0.47, 1155);
  ctx.stroke();
  ctx.restore();

  // "BLADERS.SFE" - 62.7px bold
  drawText('BLADERS.SFE', W * 0.72, 1100, 63, 'bold');

  // "MARZO" below SAB-28
  drawText('MARZO', W * 0.28, 1140, 30, 'bold');

  // Pin icon + "PARQUE FEDERAL" below BLADERS.SFE
  drawText('📍 PARQUE FEDERAL', W * 0.72, 1140, 30, 'bold');

  // "Hora de comienzo: 16:00h" - 40px, rosa accent
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 4;
  ctx.font = 'bold 40px "Normatica"';
  ctx.fillStyle = '#FF80B0'; // rosa claro como accent
  ctx.fillText('Hora de comienzo: 16:00h', W / 2, 1200);
  ctx.restore();

  // =============================================
  // LAYER 9: CTA Button
  // Design system: 669x58, radius 19, gradient rojo->naranja, 65% opacity
  // Fantasma: gradient magenta->rosa
  // =============================================
  const btnW = 669, btnH = 58, btnR = 19;
  const btnX = (W - btnW) / 2;
  const btnY = 1230;

  ctx.save();
  ctx.globalAlpha = 0.65;
  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
  btnGrad.addColorStop(0, '#C22060');   // magenta
  btnGrad.addColorStop(1, '#E8508A');   // rosa
  ctx.fillStyle = btnGrad;

  ctx.beginPath();
  ctx.moveTo(btnX + btnR, btnY);
  ctx.arcTo(btnX + btnW, btnY, btnX + btnW, btnY + btnH, btnR);
  ctx.arcTo(btnX + btnW, btnY + btnH, btnX, btnY + btnH, btnR);
  ctx.arcTo(btnX, btnY + btnH, btnX, btnY, btnR);
  ctx.arcTo(btnX, btnY, btnX + btnW, btnY, btnR);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // CTA text - 40.9px
  drawText('PARTICIPÁ POR UN BEYBLADE 🏆', W / 2, btnY + 42, 41, 'bold');

  // =============================================
  // LAYER 10: Bladers Santa Fe logo (bottom)
  // Design system: ~260x121, centered, ~Y=1300
  // =============================================
  const bLogoW = 260;
  const bLogoH = bLogoW * (bladersLogo.height / bladersLogo.width);
  ctx.drawImage(bladersLogo, (W - bLogoW) / 2, 1310, bLogoW, bLogoH);

  // =============================================
  // SAVE
  // =============================================
  const buf = canvas.toBuffer('image/png');
  const outPath = 'public/posts/fantasma-elementos/flyer_composed_final.png';
  fs.writeFileSync(outPath, buf);
  console.log(`Saved: ${outPath} (${W}x${H}, ${buf.length} bytes)`);
}

main().catch(e => console.error(e));
