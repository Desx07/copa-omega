const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Register system fonts
const sysFonts = 'C:\\Windows\\Fonts';
registerFont(path.join(sysFonts, 'impact.ttf'), { family: 'Impact' });
registerFont(path.join(sysFonts, 'arialbd.ttf'), { family: 'Arial', weight: 'bold' });
registerFont(path.join(sysFonts, 'arial.ttf'), { family: 'Arial', weight: 'normal' });
registerFont(path.join(sysFonts, 'bahnschrift.ttf'), { family: 'Bahnschrift' });

const W = 1080;
const H = 1350;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// ======= BACKGROUND =======
// Deep purple-black gradient
const bgGrad = ctx.createRadialGradient(W/2, H*0.30, 20, W/2, H*0.35, H);
bgGrad.addColorStop(0, '#2D1B69');
bgGrad.addColorStop(0.25, '#1A0A45');
bgGrad.addColorStop(0.5, '#0E0525');
bgGrad.addColorStop(1, '#030010');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, W, H);

// ======= SPECTRAL FOG LAYERS =======
for (let i = 0; i < 5; i++) {
  ctx.save();
  const fogGrad = ctx.createRadialGradient(
    W/2 + (Math.random()-0.5)*400, H*0.3 + (Math.random()-0.5)*200, 10,
    W/2, H*0.3, 300 + i*60
  );
  fogGrad.addColorStop(0, `rgba(100, 50, 200, ${0.08 - i*0.01})`);
  fogGrad.addColorStop(0.5, `rgba(0, 200, 255, ${0.04 - i*0.005})`);
  fogGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ======= CONCENTRIC BEYBLADE RINGS =======
function drawRing(cx, cy, r, color, lw, alpha, dashed) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  if (dashed) ctx.setLineDash(dashed);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

const cx = W/2, cy = H*0.30;
// Outer faint rings
for (let i = 0; i < 12; i++) {
  drawRing(cx, cy, 100 + i*38, '#00C8FF', 0.8, 0.06 + (i < 3 ? 0.04 : 0), null);
}
// Inner bright rings (beyblade)
drawRing(cx, cy, 80, '#00F5FF', 3, 0.5, null);
drawRing(cx, cy, 100, '#7DF9FF', 2.5, 0.35, [10, 8]);
drawRing(cx, cy, 120, '#00F5FF', 2, 0.25, null);
drawRing(cx, cy, 145, '#9B59B6', 1.5, 0.3, [15, 10]);

// ======= SPINNING ENERGY LINES =======
ctx.save();
for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
  const innerR = 85;
  const outerR = 180;
  const x1 = cx + Math.cos(a) * innerR;
  const y1 = cy + Math.sin(a) * innerR;
  const x2 = cx + Math.cos(a + 0.15) * outerR;
  const y2 = cy + Math.sin(a + 0.15) * outerR;
  const lg = ctx.createLinearGradient(x1, y1, x2, y2);
  lg.addColorStop(0, 'rgba(0, 245, 255, 0.5)');
  lg.addColorStop(1, 'rgba(0, 245, 255, 0)');
  ctx.strokeStyle = lg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
ctx.restore();

// ======= GHOST FIGURE (spectral silhouette) =======
// Large spectral apparition behind title
ctx.save();
const ghostCx = W/2, ghostCy = H*0.25;

// Ghost body - ethereal flowing shape
const ghostGrad = ctx.createLinearGradient(ghostCx, ghostCy - 180, ghostCx, ghostCy + 220);
ghostGrad.addColorStop(0, 'rgba(100, 180, 255, 0)');
ghostGrad.addColorStop(0.2, 'rgba(100, 180, 255, 0.06)');
ghostGrad.addColorStop(0.5, 'rgba(0, 200, 255, 0.12)');
ghostGrad.addColorStop(0.8, 'rgba(100, 50, 200, 0.06)');
ghostGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = ghostGrad;
ctx.beginPath();
ctx.moveTo(ghostCx - 150, ghostCy + 200);
ctx.bezierCurveTo(ghostCx - 200, ghostCy + 50, ghostCx - 180, ghostCy - 100, ghostCx - 80, ghostCy - 170);
ctx.bezierCurveTo(ghostCx - 30, ghostCy - 210, ghostCx + 30, ghostCy - 210, ghostCx + 80, ghostCy - 170);
ctx.bezierCurveTo(ghostCx + 180, ghostCy - 100, ghostCx + 200, ghostCy + 50, ghostCx + 150, ghostCy + 200);
// Wavy bottom edge
ctx.bezierCurveTo(ghostCx + 120, ghostCy + 240, ghostCx + 80, ghostCy + 190, ghostCx + 40, ghostCy + 230);
ctx.bezierCurveTo(ghostCx + 10, ghostCy + 250, ghostCx - 10, ghostCy + 250, ghostCx - 40, ghostCy + 230);
ctx.bezierCurveTo(ghostCx - 80, ghostCy + 190, ghostCx - 120, ghostCy + 240, ghostCx - 150, ghostCy + 200);
ctx.fill();

// Ghost eyes - glowing spectral
function drawEye(ex, ey, size) {
  // Outer glow
  const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, size * 3);
  eg.addColorStop(0, 'rgba(0, 255, 200, 0.6)');
  eg.addColorStop(0.3, 'rgba(0, 245, 255, 0.3)');
  eg.addColorStop(1, 'rgba(0, 245, 255, 0)');
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.arc(ex, ey, size * 3, 0, Math.PI * 2);
  ctx.fill();
  // Inner core
  ctx.fillStyle = 'rgba(200, 255, 240, 0.9)';
  ctx.beginPath();
  ctx.ellipse(ex, ey, size * 1.2, size * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bright center
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(ex, ey, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
}
drawEye(ghostCx - 38, ghostCy - 30, 8);
drawEye(ghostCx + 38, ghostCy - 30, 8);
ctx.restore();

// ======= PARTICLE FIELD =======
ctx.save();
for (let i = 0; i < 300; i++) {
  const x = Math.random() * W;
  const y = Math.random() * H;
  const size = Math.random() * 2 + 0.3;
  ctx.globalAlpha = Math.random() * 0.35;
  const colors = ['#00F5FF', '#7DF9FF', '#C0C0FF', '#9B59B6', '#B388FF'];
  ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}
ctx.restore();

// ======= FLOATING SPECTRAL WISPS =======
function drawWisp(startX, startY, endX, endY, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(
    startX + (endX-startX)*0.3, startY - 30,
    startX + (endX-startX)*0.7, endY + 30,
    endX, endY
  );
  ctx.stroke();
  ctx.restore();
}
drawWisp(100, H*0.2, 300, H*0.15, '#00F5FF', 0.15);
drawWisp(W-100, H*0.18, W-250, H*0.25, '#9B59B6', 0.12);
drawWisp(200, H*0.45, 400, H*0.42, '#7DF9FF', 0.1);
drawWisp(W-200, H*0.4, W-350, H*0.48, '#B388FF', 0.1);

// ======= TITLE BLOCK =======

// Ghost Circle badge/shield shape behind title
ctx.save();
const shieldCx = W/2, shieldTop = H*0.44;
const shieldW = 480, shieldH = 200;

// Shield shape
const shieldGrad = ctx.createLinearGradient(shieldCx, shieldTop, shieldCx, shieldTop + shieldH);
shieldGrad.addColorStop(0, 'rgba(20, 5, 60, 0.85)');
shieldGrad.addColorStop(0.5, 'rgba(40, 10, 80, 0.9)');
shieldGrad.addColorStop(1, 'rgba(15, 3, 40, 0.85)');
ctx.fillStyle = shieldGrad;
ctx.beginPath();
ctx.moveTo(shieldCx - shieldW/2, shieldTop + 20);
ctx.lineTo(shieldCx - shieldW/2 + 20, shieldTop);
ctx.lineTo(shieldCx + shieldW/2 - 20, shieldTop);
ctx.lineTo(shieldCx + shieldW/2, shieldTop + 20);
ctx.lineTo(shieldCx + shieldW/2, shieldTop + shieldH - 30);
ctx.lineTo(shieldCx, shieldTop + shieldH + 20);
ctx.lineTo(shieldCx - shieldW/2, shieldTop + shieldH - 30);
ctx.closePath();
ctx.fill();

// Shield border glow
ctx.strokeStyle = 'rgba(0, 245, 255, 0.4)';
ctx.lineWidth = 2;
ctx.shadowColor = '#00F5FF';
ctx.shadowBlur = 15;
ctx.stroke();
ctx.restore();

// Title text: "LA MALDICIÓN"
ctx.save();
ctx.textAlign = 'center';

// Glow pass
ctx.shadowColor = '#00F5FF';
ctx.shadowBlur = 30;
ctx.font = '42px "Impact"';
ctx.fillStyle = 'rgba(0, 245, 255, 0.4)';
ctx.fillText('LA MALDICIÓN', W/2, H*0.49);

// Main text
ctx.shadowBlur = 15;
ctx.fillStyle = '#FFFFFF';
ctx.fillText('LA MALDICIÓN', W/2, H*0.49);

// "DEL FANTASMA" - bigger
ctx.shadowColor = '#00F5FF';
ctx.shadowBlur = 35;
ctx.font = '72px "Impact"';
ctx.fillStyle = 'rgba(0, 245, 255, 0.4)';
ctx.fillText('DEL FANTASMA', W/2, H*0.545);

ctx.shadowBlur = 15;
const tGrad = ctx.createLinearGradient(W/2 - 280, 0, W/2 + 280, 0);
tGrad.addColorStop(0, '#A0D8FF');
tGrad.addColorStop(0.3, '#FFFFFF');
tGrad.addColorStop(0.7, '#FFFFFF');
tGrad.addColorStop(1, '#A0D8FF');
ctx.fillStyle = tGrad;
ctx.fillText('DEL FANTASMA', W/2, H*0.545);
ctx.restore();

// ======= INSCRIPCIONES ABIERTAS =======
ctx.save();
ctx.textAlign = 'center';
ctx.font = 'bold 48px "Arial"';
ctx.shadowColor = '#9B59B6';
ctx.shadowBlur = 20;
ctx.fillStyle = '#FFFFFF';
ctx.fillText('¡INSCRIPCIONES', W/2, H*0.635);
ctx.fillText('ABIERTAS!', W/2, H*0.675);
ctx.restore();

// ======= INFO BAR =======
const barY = H * 0.71;
const barH = 100;

// Bar background
ctx.save();
ctx.fillStyle = 'rgba(15, 3, 40, 0.85)';
ctx.fillRect(50, barY, W - 100, barH);
ctx.strokeStyle = 'rgba(0, 245, 255, 0.25)';
ctx.lineWidth = 1.5;
ctx.strokeRect(50, barY, W - 100, barH);
ctx.restore();

// SAB-28 MARZO
ctx.save();
ctx.textAlign = 'center';
ctx.font = '46px "Impact"';
ctx.fillStyle = '#FFFFFF';
ctx.shadowColor = '#00F5FF';
ctx.shadowBlur = 10;
ctx.fillText('SAB-28', W*0.27, barY + 45);
ctx.font = 'bold 18px "Arial"';
ctx.fillStyle = '#B0B0B0';
ctx.shadowBlur = 0;
ctx.fillText('MARZO', W*0.27, barY + 72);

// Divider line
ctx.fillStyle = 'rgba(0, 245, 255, 0.4)';
ctx.fillRect(W*0.46, barY + 15, 2, barH - 30);

// BLADERS.SFE
ctx.font = '46px "Impact"';
ctx.fillStyle = '#FFFFFF';
ctx.shadowColor = '#00F5FF';
ctx.shadowBlur = 10;
ctx.fillText('BLADERS.SFE', W*0.70, barY + 45);
ctx.font = 'bold 16px "Arial"';
ctx.fillStyle = '#B0B0B0';
ctx.shadowBlur = 0;
ctx.fillText('PARQUE FEDERAL', W*0.70, barY + 72);
ctx.restore();

// ======= HORA =======
ctx.save();
ctx.textAlign = 'center';
ctx.font = '24px "Bahnschrift"';
ctx.fillStyle = '#00F5FF';
ctx.shadowColor = '#00F5FF';
ctx.shadowBlur = 12;
ctx.fillText('Hora de comienzo: 16:00h', W/2, H*0.84);
ctx.restore();

// ======= CTA BUTTON =======
const btnY = H * 0.865;
const btnW = 620;
const btnH = 55;
const btnX = (W - btnW) / 2;

ctx.save();
// Button bg
const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
btnGrad.addColorStop(0, '#5B21B6');
btnGrad.addColorStop(0.5, '#7C3AED');
btnGrad.addColorStop(1, '#5B21B6');
ctx.fillStyle = btnGrad;
ctx.shadowColor = '#7C3AED';
ctx.shadowBlur = 25;

// Rounded rect
const r = 28;
ctx.beginPath();
ctx.moveTo(btnX + r, btnY);
ctx.lineTo(btnX + btnW - r, btnY);
ctx.arcTo(btnX + btnW, btnY, btnX + btnW, btnY + r, r);
ctx.lineTo(btnX + btnW, btnY + btnH - r);
ctx.arcTo(btnX + btnW, btnY + btnH, btnX + btnW - r, btnY + btnH, r);
ctx.lineTo(btnX + r, btnY + btnH);
ctx.arcTo(btnX, btnY + btnH, btnX, btnY + btnH - r, r);
ctx.lineTo(btnX, btnY + r);
ctx.arcTo(btnX, btnY, btnX + r, btnY, r);
ctx.closePath();
ctx.fill();

// Button text
ctx.shadowBlur = 0;
ctx.textAlign = 'center';
ctx.font = 'bold 24px "Arial"';
ctx.fillStyle = '#FFFFFF';
ctx.fillText('PARTICIPA POR UN BEYBLADE', W/2, btnY + 37);
ctx.restore();

// ======= BLADERS SANTA FE LOGO =======
ctx.save();
ctx.textAlign = 'center';

// "BLADERS"
ctx.font = '48px "Impact"';
const lGrad = ctx.createLinearGradient(W/2 - 120, 0, W/2 + 120, 0);
lGrad.addColorStop(0, '#7DF9FF');
lGrad.addColorStop(0.5, '#FFFFFF');
lGrad.addColorStop(1, '#7DF9FF');
ctx.fillStyle = lGrad;
ctx.shadowColor = '#00F5FF';
ctx.shadowBlur = 12;
ctx.fillText('BLADERS', W/2, H*0.955);

// "SANTA FE"
ctx.font = 'bold 20px "Arial"';
ctx.fillStyle = '#00F5FF';
ctx.shadowBlur = 8;
ctx.fillText('SANTA FE', W/2, H*0.98);
ctx.restore();

// ======= CORNER BRACKETS =======
function drawCorner(x, y, dx, dy) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 245, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00F5FF';
  ctx.shadowBlur = 8;
  const len = 45;
  ctx.beginPath();
  ctx.moveTo(x, y + len * dy);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len * dx, y);
  ctx.stroke();
  ctx.restore();
}
drawCorner(25, 25, 1, 1);
drawCorner(W-25, 25, -1, 1);
drawCorner(25, H-25, 1, -1);
drawCorner(W-25, H-25, -1, -1);

// ======= SUBTLE NOISE TEXTURE =======
ctx.save();
ctx.globalAlpha = 0.025;
for (let y = 0; y < H; y += 3) {
  for (let x = 0; x < W; x += 3) {
    if (Math.random() > 0.5) {
      ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#7DF9FF';
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
ctx.restore();

// ======= SAVE =======
const outPath = path.join(__dirname, '..', 'public', 'posts', 'la-maldicion-del-fantasma.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buffer);
console.log('Flyer saved to:', outPath);
console.log('Size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');
