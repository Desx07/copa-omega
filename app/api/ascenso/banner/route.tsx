import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Imagen de VS para WhatsApp / carrusel — reproduce la card del versus de la app
// (mismo diseño que /ascenso demo=3), renderizada con next/og (JSX → PNG).
// GET /api/ascenso/banner?p1=alias&p2=alias&r1=C&r2=C&c1=00&c2=05

export const runtime = "nodejs";

// Colores hexagonales de rango — MISMOS que la landing/versus (RANK_HEX)
const RANK_HEX: Record<string, string> = {
  F: "#7dd3fc", E: "#38bdf8", D: "#22d3ee",
  C: "#818cf8", B: "#c084fc", A: "#f472b6", S: "#fbbf24",
};

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  // Sanitización (endpoint público): nombres 24 chars, rangos F..S, personaje 1-2 dígitos
  const RANGO = /^[FEDCBAS]$/;
  const PERS = /^[0-9]{1,2}$/;
  const p1 = (searchParams.get("p1") || "Jugador 1").slice(0, 24);
  const p2 = (searchParams.get("p2") || "Jugador 2").slice(0, 24);
  const r1 = RANGO.test(searchParams.get("r1") ?? "") ? searchParams.get("r1")! : "F";
  const r2 = RANGO.test(searchParams.get("r2") ?? "") ? searchParams.get("r2")! : "F";
  const c1 = PERS.test(searchParams.get("c1") ?? "") ? searchParams.get("c1")! : "00";
  const c2 = PERS.test(searchParams.get("c2") ?? "") ? searchParams.get("c2")! : "05";

  const hex1 = RANK_HEX[r1] ?? RANK_HEX.F;
  const hex2 = RANK_HEX[r2] ?? RANK_HEX.F;
  const stadium = `${origin}/stadium.png`;
  const chr1 = `${origin}/characters/chr_${c1}.png`;
  const chr2 = `${origin}/characters/chr_${c2}.png`;

  // Columna de un blader (personaje + badge de rango + banner de estado)
  const playerCol = (
    alias: string,
    rank: string,
    accent: string,
    chr: string,
    status: string,
  ) => (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative", height: "100%" }}>
      {/* Nombre */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
        <span style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>{alias}</span>
      </div>
      {/* Badge de rango */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(5,7,13,0.7)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "6px 14px" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#9aa2b8", letterSpacing: 1 }}>RANGO</span>
          <div style={{ display: "flex", width: 34, height: 34, borderRadius: 8, background: accent, alignItems: "center", justifyContent: "center", boxShadow: `0 0 18px ${accent}` }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#05070d" }}>{rank}</span>
          </div>
        </div>
      </div>
      {/* Halo + personaje */}
      <div style={{ display: "flex", position: "absolute", inset: 0, alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ position: "absolute", left: "10%", right: "10%", bottom: 60, top: "40%", background: `radial-gradient(ellipse at 50% 70%, ${accent}33, transparent 70%)` }} />
        <img src={chr} width={340} height={340} style={{ objectFit: "contain" }} />
      </div>
      {/* Banner de estado */}
      <div style={{ display: "flex", position: "absolute", left: 24, right: 24, bottom: 22, justifyContent: "center", background: accent, borderRadius: 6, padding: "8px 0", boxShadow: `0 0 22px ${accent}88` }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: "#05070d", letterSpacing: 0.5 }}>{status}</span>
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", position: "relative", backgroundColor: "#05070d", fontFamily: "sans-serif" }}>
        {/* Fondo estadio oscurecido */}
        <img src={stadium} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.32 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(56,189,248,0.10), rgba(5,7,13,0.5) 60%, rgba(5,7,13,0.94) 100%)" }} />

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, zIndex: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#7dd3fc", letterSpacing: 4 }}>BLADERS SANTA FE · TORNEO DE ASCENSO</span>
          <span style={{ fontSize: 30, fontWeight: 900, color: "#fbbf24", letterSpacing: 1, marginTop: 4 }}>COMBATE DE ASCENSO</span>
        </div>

        {/* Cuerpo: dos columnas + VS al medio */}
        <div style={{ display: "flex", flex: 1, position: "relative", zIndex: 2 }}>
          {playerCol(p1.toUpperCase(), r1, hex1, chr1, "¡AL MÁXIMO!")}
          {playerCol(p2.toUpperCase(), r2, hex2, chr2, "PRÓXIMO COMBATE")}
          {/* VS central */}
          <div style={{ display: "flex", position: "absolute", left: 0, right: 0, top: "42%", justifyContent: "center", zIndex: 3 }}>
            <span style={{ fontSize: 96, fontWeight: 900, color: "#f59e0b", textShadow: "0 0 30px rgba(251,191,36,0.9), 0 4px 0 #0b0b16" }}>VS</span>
          </div>
        </div>

        {/* Barra dorada abajo */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 56, background: "linear-gradient(90deg, #f59e0b, #fbbf24)", zIndex: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#05070d", letterSpacing: 1 }}>¡COMBATE DE ASCENSO LISTO!</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
