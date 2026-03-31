const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

registerFont(path.resolve('C:/Windows/Fonts/impact.ttf'), { family: 'Impact' });

async function main() {
  const ghostFace = await loadImage('tmp_ghost_circle_blade.png');

  const W = 800, H = 950;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const sy = 30, sw = 500, sh = 560;

  function shieldPath() {
    ctx.beginPath();
    ctx.moveTo(cx, sy);
    ctx.lineTo(cx + sw/2, sy + sh*0.06);
    ctx.lineTo(cx + sw/2, sy + sh*0.5);
    ctx.quadraticCurveTo(cx + sw/2, sy + sh*0.82, cx, sy + sh);
    ctx.quadraticCurveTo(cx - sw/2, sy + sh*0.82, cx - sw/2, sy + sh*0.5);
    ctx.lineTo(cx - sw/2, sy + sh*0.06);
    ctx.closePath();
  }

  // Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  shieldPath();
  ctx.fillStyle = '#15152a';
  ctx.fill();
  ctx.restore();

  // Shield fill
  ctx.save();
  shieldPath();
  const sg = ctx.createLinearGradient(0, sy, 0, sy + sh);
  sg.addColorStop(0, '#1e1e35');
  sg.addColorStop(1, '#12122a');
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.restore();

  // Shield border
  ctx.save();
  shieldPath();
  ctx.strokeStyle = '#C23078';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();

  // Ghost face clipped inside shield
  ctx.save();
  shieldPath();
  ctx.clip();
  const gs = 340;
  ctx.drawImage(ghostFace, cx - gs/2, sy + sh*0.17, gs, gs);
  ctx.restore();

  // Magenta vignette OUTSIDE the clip
  ctx.save();
  shieldPath();
  ctx.clip();
  const vg = ctx.createRadialGradient(cx, sy + sh*0.45, gs*0.2, cx, sy + sh*0.45, gs*0.7);
  vg.addColorStop(0, 'rgba(194,48,120,0.0)');
  vg.addColorStop(1, 'rgba(194,48,120,0.3)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // === TEXT (completely separate save/restore) ===
  const textY = sy + sh + 20;

  // "LA MALDICIÓN DEL"
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '30px "Impact"';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('LA MALDICIÓN DEL', cx, textY);
  ctx.restore();

  // Decorative lines
  ctx.save();
  ctx.strokeStyle = '#C23078';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 260, textY + 45);
  ctx.lineTo(cx - 50, textY + 45);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 50, textY + 45);
  ctx.lineTo(cx + 260, textY + 45);
  ctx.stroke();
  // Diamond
  ctx.fillStyle = '#C23078';
  ctx.beginPath();
  ctx.moveTo(cx, textY + 39);
  ctx.lineTo(cx + 6, textY + 45);
  ctx.lineTo(cx, textY + 51);
  ctx.lineTo(cx - 6, textY + 45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // "FANTASMA"
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '85px "Impact"';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('FANTASMA', cx, textY + 55);
  ctx.restore();

  // Bottom line
  ctx.save();
  ctx.strokeStyle = 'rgba(194,48,120,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 180, textY + 145);
  ctx.lineTo(cx + 180, textY + 145);
  ctx.stroke();
  ctx.restore();

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync('public/posts/fantasma-elementos/element_logo_canvas.png', buf);
  console.log('Logo: ' + W + 'x' + H + ', ' + buf.length + ' bytes');
}

main().catch(e => console.error(e));
