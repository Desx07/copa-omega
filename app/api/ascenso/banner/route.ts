import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import path from "path";

// Genera un banner de VS para compartir en WhatsApp
// GET /api/ascenso/banner?p1=alias&p2=alias&r1=C&r2=C&c1=00&c2=05
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Validación de query params: el endpoint es público (imagen para compartir),
    // así que sanitizamos todo antes de dibujar o de armar paths de archivos.
    // - p1/p2: recortados a 24 caracteres para que no desborden el canvas
    // - r1/r2: solo letras de rango válidas (F,E,D,C,B,A,S), sino "F"
    // - c1/c2: solo 1-2 dígitos (índice de personaje), sino defaults
    const RANGO_VALIDO = /^[FEDCBAS]$/;
    const PERSONAJE_VALIDO = /^[0-9]{1,2}$/;
    const p1Name = (searchParams.get("p1") || "Jugador 1").slice(0, 24);
    const p2Name = (searchParams.get("p2") || "Jugador 2").slice(0, 24);
    const r1Raw = searchParams.get("r1") ?? "";
    const r1 = RANGO_VALIDO.test(r1Raw) ? r1Raw : "F";
    const r2Raw = searchParams.get("r2") ?? "";
    const r2 = RANGO_VALIDO.test(r2Raw) ? r2Raw : "F";
    const c1Raw = searchParams.get("c1") ?? "";
    const c1 = PERSONAJE_VALIDO.test(c1Raw) ? c1Raw : "00";
    const c2Raw = searchParams.get("c2") ?? "";
    const c2 = PERSONAJE_VALIDO.test(c2Raw) ? c2Raw : "05";

    // Colores hexagonales de rango — MISMOS que la landing (RANK_HEX)
    const RANK_HEX: Record<string, string> = {
      F: "#7dd3fc", E: "#38bdf8", D: "#22d3ee",
      C: "#818cf8", B: "#c084fc", A: "#f472b6", S: "#fbbf24",
    };
    const hex1 = RANK_HEX[r1] ?? "#7dd3fc";
    const hex2 = RANK_HEX[r2] ?? "#7dd3fc";

    const WIDTH = 1200;
    const HEIGHT = 630; // OG image standard
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    const publicDir = path.join(process.cwd(), "public");

    // ── Fondo: estadio real oscurecido (como el versus de la app) ──
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    try {
      const stadium = await loadImage(path.join(publicDir, "stadium.png"));
      // Cover: escalar para llenar el canvas manteniendo proporción
      const scale = Math.max(WIDTH / stadium.width, HEIGHT / stadium.height);
      const sw = stadium.width * scale;
      const sh = stadium.height * scale;
      ctx.globalAlpha = 0.35;
      ctx.drawImage(stadium, (WIDTH - sw) / 2, (HEIGHT - sh) / 2, sw, sh);
      ctx.globalAlpha = 1;
    } catch { /* sin estadio, queda el fondo oscuro */ }

    // Viñeta + glow frío central (profundidad de estadio)
    const vig = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 100, WIDTH / 2, HEIGHT / 2, WIDTH * 0.7);
    vig.addColorStop(0, "rgba(56,189,248,0.10)");
    vig.addColorStop(0.55, "rgba(5,7,13,0.35)");
    vig.addColorStop(1, "rgba(5,7,13,0.92)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Cargar personajes
    let chr1, chr2;
    try { chr1 = await loadImage(path.join(publicDir, "characters", `chr_${c1}.png`)); } catch { chr1 = null; }
    try { chr2 = await loadImage(path.join(publicDir, "characters", `chr_${c2}.png`)); } catch { chr2 = null; }

    // Personajes en las esquinas inferiores, con halo del color de su rango
    const chrSize = 430;
    if (chr1) {
      ctx.save();
      const gx = 150 + chrSize / 2, gy = HEIGHT - chrSize / 2;
      const glow = ctx.createRadialGradient(gx, gy, 20, gx, gy, chrSize * 0.55);
      glow.addColorStop(0, hex1 + "55");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, HEIGHT - chrSize - 40, chrSize + 200, chrSize + 60);
      ctx.drawImage(chr1, -30, HEIGHT - chrSize - 10, chrSize, chrSize);
      ctx.restore();
    }
    if (chr2) {
      ctx.save();
      const gx = WIDTH - 150 - chrSize / 2, gy = HEIGHT - chrSize / 2;
      const glow = ctx.createRadialGradient(gx, gy, 20, gx, gy, chrSize * 0.55);
      glow.addColorStop(0, hex2 + "55");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(WIDTH - chrSize - 200, HEIGHT - chrSize - 40, chrSize + 200, chrSize + 60);
      // Espejar el personaje derecho para que mire al centro
      ctx.translate(WIDTH + 30, HEIGHT - chrSize - 10);
      ctx.scale(-1, 1);
      ctx.drawImage(chr2, 0, 0, chrSize, chrSize);
      ctx.restore();
    }

    // ── Sello hexagonal de rango (flat-top, como la landing) ──
    function drawRankSeal(cx: number, cy: number, radius: number, color: string, letter: string) {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i - Math.PI / 6; // flat-top
        const px = cx + radius * Math.cos(ang);
        const py = cy + radius * Math.sin(ang);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
      g.addColorStop(0, color);
      g.addColorStop(1, color + "aa");
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.fillStyle = g;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.stroke();
      // Letra
      ctx.fillStyle = "#05070d";
      ctx.font = `900 ${radius}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, cx, cy + 2);
      ctx.restore();
    }

    // Título arriba
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = "900 26px Arial";
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "rgba(251,191,36,0.6)";
    ctx.shadowBlur = 18;
    ctx.fillText("COMBATE DE ASCENSO", WIDTH / 2, 62);
    ctx.shadowBlur = 0;
    ctx.font = "bold 15px Arial";
    ctx.fillStyle = "rgba(125,211,252,0.75)";
    ctx.fillText("BLADERS SANTA FE · TORNEO DE ASCENSO", WIDTH / 2, 92);

    // Sellos hexagonales de rango a cada lado del centro
    drawRankSeal(WIDTH / 2 - 250, HEIGHT / 2, 60, hex1, r1);
    drawRankSeal(WIDTH / 2 + 250, HEIGHT / 2, 60, hex2, r2);

    // ── VS central grande, dorado con stroke (como el clash de la app) ──
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 130px Arial";
    ctx.shadowColor = "rgba(251,191,36,0.9)";
    ctx.shadowBlur = 40;
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#0b0b16";
    ctx.strokeText("VS", WIDTH / 2, HEIGHT / 2 + 4);
    const vsGrad = ctx.createLinearGradient(0, HEIGHT / 2 - 70, 0, HEIGHT / 2 + 70);
    vsGrad.addColorStop(0, "#fde68a");
    vsGrad.addColorStop(1, "#f59e0b");
    ctx.fillStyle = vsGrad;
    ctx.fillText("VS", WIDTH / 2, HEIGHT / 2 + 4);
    ctx.restore();

    // Nombres de jugadores (bajo cada personaje)
    ctx.textBaseline = "alphabetic";
    ctx.font = "900 34px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    ctx.textAlign = "left";
    ctx.fillText(p1Name.toUpperCase(), 60, HEIGHT - 40);
    ctx.textAlign = "right";
    ctx.fillText(p2Name.toUpperCase(), WIDTH - 60, HEIGHT - 40);
    ctx.shadowBlur = 0;

    // Return as PNG
    const buffer = canvas.toBuffer("image/png");
    return new NextResponse(Buffer.from(buffer) as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("Banner generation error:", err);
    return NextResponse.json({ error: "Failed to generate banner" }, { status: 500 });
  }
}
