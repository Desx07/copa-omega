// Helper de "piel por modalidad" para el dashboard.
// Devuelve clases Copa Omega (originales, CERO regresión) o de combate (ascenso),
// según la modalidad destacada. Ver openspec/changes/ascenso-dashboard-theming.
//
// Uso:  className={skin(ascensoSkin, "<clases copa originales>", CB.bigCyan)}
// Con ascensoSkin=false devuelve exactamente las clases originales → no rompe Copa.

export function skin(ascenso: boolean, copa: string, combat: string): string {
  return ascenso ? combat : copa;
}

// Paleta de combate (cyan/ámbar sobre #0a0f1a), alineada con AscensoHero / landing-ascenso.
export const CB = {
  // Tarjeta de acción grande (grilla de Quick Actions).
  bigCyan:
    "group rounded-2xl border border-cyan-400/25 bg-[#0a0f1a] p-5 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-cyan-400/50 shadow-[0_0_18px_rgba(56,189,248,0.12)] hover:shadow-[0_0_28px_rgba(56,189,248,0.25)]",
  // Igual pero con posicion relativa (para la card de chat que lleva un badge absoluto).
  bigCyanRel:
    "relative group rounded-2xl border border-cyan-400/25 bg-[#0a0f1a] p-5 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-cyan-400/50 shadow-[0_0_18px_rgba(56,189,248,0.12)] hover:shadow-[0_0_28px_rgba(56,189,248,0.25)]",
  // Acento ámbar (para la card "premium": Ranking).
  bigAmber:
    "group rounded-2xl border border-amber-300/30 bg-[#0a0f1a] p-5 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-amber-300/55 shadow-[0_0_18px_rgba(251,191,36,0.12)] hover:shadow-[0_0_28px_rgba(251,191,36,0.25)]",
  // Ícono tintado (para superficies donde el ícono viene coloreado en Copa).
  iconWrapCyan:
    "size-12 rounded-2xl bg-cyan-400/15 mb-3 flex items-center justify-center group-hover:bg-cyan-400/25 transition-colors",
  iconCyan: "text-cyan-300",
  // Tarjeta chica (links de engagement) + su ícono.
  smallCard:
    "group rounded-xl border border-cyan-400/20 bg-[#0a0f1a] p-3 flex flex-col items-center gap-1.5 text-center transition-all hover:border-cyan-400/45 hover:scale-[1.02] active:scale-[0.98]",
  smallIconWrap:
    "size-10 rounded-xl bg-cyan-400/15 flex items-center justify-center group-hover:bg-cyan-400/25 transition-colors",
  // Fila/CTA con estilo omega-card (search, "ver todas las partidas").
  rowCyan:
    "flex items-center gap-3 px-4 py-3 rounded-2xl border border-cyan-400/20 bg-[#0a0f1a] transition-all hover:border-cyan-400/45",
  rowCyanBetween:
    "flex items-center justify-between px-4 py-3 rounded-2xl border border-cyan-400/20 bg-[#0a0f1a] transition-all hover:border-cyan-400/45 group",
  // Botón Wallet en modo combate (ámbar).
  walletAmber:
    "group relative overflow-hidden rounded-2xl p-4 flex items-center gap-4 border border-amber-300/30 bg-[#0a0f1a] transition-all hover:scale-[1.01] active:scale-[0.98] hover:border-amber-300/55 shadow-[0_0_18px_rgba(251,191,36,0.12)]",
  walletIconWrap:
    "size-12 rounded-2xl bg-amber-300/15 flex items-center justify-center group-hover:bg-amber-300/25 transition-colors ring-2 ring-amber-300/30",
  amber: "text-amber-300",
} as const;
