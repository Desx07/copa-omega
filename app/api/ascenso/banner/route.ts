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

    const WIDTH = 1200;
    const HEIGHT = 630; // OG image standard
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // Fondo oscuro con gradiente
    const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bgGrad.addColorStop(0, "#0f0a1e");
    bgGrad.addColorStop(0.5, "#1a1030");
    bgGrad.addColorStop(1, "#0f0a1e");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Grid tech de fondo
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    // Cargar personajes
    const publicDir = path.join(process.cwd(), "public");
    let chr1, chr2;
    try {
      chr1 = await loadImage(path.join(publicDir, "characters", `chr_${c1}.png`));
    } catch { chr1 = null; }
    try {
      chr2 = await loadImage(path.join(publicDir, "characters", `chr_${c2}.png`));
    } catch { chr2 = null; }

    // Dividir en dos mitades
    // Mitad izquierda — gradiente púrpura
    const leftGrad = ctx.createLinearGradient(0, 0, WIDTH / 2, HEIGHT);
    leftGrad.addColorStop(0, "rgba(88,28,135,0.4)");
    leftGrad.addColorStop(1, "rgba(88,28,135,0.1)");
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, WIDTH / 2, HEIGHT);

    // Mitad derecha — gradiente azul
    const rightGrad = ctx.createLinearGradient(WIDTH / 2, 0, WIDTH, HEIGHT);
    rightGrad.addColorStop(0, "rgba(30,58,138,0.1)");
    rightGrad.addColorStop(1, "rgba(30,58,138,0.4)");
    ctx.fillStyle = rightGrad;
    ctx.fillRect(WIDTH / 2, 0, WIDTH / 2, HEIGHT);

    // Personaje 1 (izquierda)
    if (chr1) {
      const chrSize = 400;
      ctx.drawImage(chr1, 50, HEIGHT - chrSize - 30, chrSize, chrSize);
    }

    // Personaje 2 (derecha)
    if (chr2) {
      const chrSize = 400;
      ctx.drawImage(chr2, WIDTH - chrSize - 50, HEIGHT - chrSize - 30, chrSize, chrSize);
    }

    // Línea diagonal central
    ctx.strokeStyle = "rgba(255,50,50,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();

    // VS central
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VS", WIDTH / 2, HEIGHT / 2);

    // Nombre jugador 1
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "left";
    ctx.fillText(p1Name, 60, 50);

    // Rango 1
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "rgba(192,132,252,0.9)";
    ctx.fillText(r1, 60, 110);

    ctx.font = "12px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("RANGO", 60, 130);

    // Nombre jugador 2
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "right";
    ctx.fillText(p2Name, WIDTH - 60, 50);

    // Rango 2
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "rgba(96,165,250,0.9)";
    ctx.fillText(r2, WIDTH - 60, 110);

    ctx.font = "12px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("RANGO", WIDTH - 100, 130);

    // Título arriba
    ctx.textAlign = "center";
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "rgba(0,255,255,0.7)";
    ctx.fillText("⚔ COMBATE DE ASCENSO ⚔", WIDTH / 2, 30);

    // Footer
    ctx.font = "14px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("BLADERS SANTA FE — TORNEO DE ASCENSO", WIDTH / 2, HEIGHT - 20);

    // Banner diagonal "¡AL MÁXIMO!"
    ctx.save();
    ctx.translate(200, 420);
    ctx.rotate(-0.1);
    ctx.fillStyle = "rgba(168,85,247,0.85)";
    ctx.fillRect(-10, -15, 220, 35);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("¡AL MÁXIMO!", 100, 7);
    ctx.restore();

    // Banner "PRÓXIMO COMBATE"
    ctx.save();
    ctx.translate(WIDTH - 420, 420);
    ctx.rotate(0.1);
    ctx.fillStyle = "rgba(37,99,235,0.85)";
    ctx.fillRect(-10, -15, 250, 35);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PRÓXIMO COMBATE", 115, 7);
    ctx.restore();

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
