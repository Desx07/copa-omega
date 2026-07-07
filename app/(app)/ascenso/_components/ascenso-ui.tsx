// ============================================================================
// ASCENSO · DESIGN SYSTEM (piezas reutilizables)
//
// Extrae la estética APROBADA de la landing de Ascenso
// (app/_components/landing/landing-ascenso.tsx) a componentes reutilizables,
// para aplicarla consistente en TODAS las pantallas de la sección Ascenso.
//
// ⚠️ La landing NO se toca: es la fuente de verdad visual. Estas piezas son
// una copia fiel de sus estilos para usarlas fuera de ella.
//
// El look que define esta sección:
//   · Fondo tipo estadio: /stadium.png (mix-blend-screen) sobre #05070d + glows.
//   · Sellos HEXAGONALES por rango, con glow del color del rango.
//   · Tipografía black uppercase con gradiente de texto cian→ámbar.
//   · Acentos cian (#38bdf8) / ámbar (#fbbf24). NADA de cards púrpura de Copa Omega.
//
// ── CÓMO USAR ────────────────────────────────────────────────────────────────
//
//   import {
//     AscensoBackground, AscensoScreen, RankSeal, AscensoHeading,
//     AscensoKicker, AscensoCta, AscensoPanel, RankPlate,
//     ScoreHud, ScoreCell, RANK_HEX,
//   } from "./_components/ascenso-ui";
//
//   // 1) Envolver una pantalla con el fondo de estadio:
//   <AscensoScreen>
//     <AscensoKicker left="cyan" right="amber">Bladers Santa Fe · combate</AscensoKicker>
//     <AscensoHeading top="Torneo" bottom="de Ascenso" />
//     ...
//   </AscensoScreen>
//
//   // …o sólo el fondo fijo (para componer manualmente):
//   <AscensoBackground />
//
//   // 2) Sello de rango (deriva el color de RANK_HEX según la letra):
//   <RankSeal letter="S" caption="campeón" size="md" />
//
//   // 3) CTA dorado (Link o button):
//   <AscensoCta href="/auth/register">Empezar a ascender</AscensoCta>
//   <AscensoCta onClick={start} showArrow>Combatir</AscensoCta>
//
//   // 4) Superficie/tarjeta consistente sobre el estadio:
//   <AscensoPanel>…contenido…</AscensoPanel>
//
// Todos estos componentes son presentacionales (sin hooks) → se pueden usar
// tanto en Server como en Client Components.
// ============================================================================

import Link from "next/link";
import Image from "next/image";
import { ChevronsUp, ArrowRight, Swords } from "lucide-react";
import type { ReactNode } from "react";
import type { RankLetter } from "@/lib/ascenso";

// ── Paleta hex por rango (idéntica a la de la landing aprobada) ──────────────
// Fuente única del color visual de cada rango en la sección Ascenso.
// NO confundir con lib/ascenso.color/glow (gradientes Tailwind del sistema de
// datos): estos hex son los del beystadium y mandan en el look de esta sección.
export const RANK_HEX: Record<RankLetter, string> = {
  F: "#7dd3fc",
  E: "#38bdf8",
  D: "#22d3ee",
  C: "#818cf8",
  B: "#c084fc",
  A: "#f472b6",
  S: "#fbbf24",
};

// Acentos globales de la sección (para halos, líneas y glows genéricos).
export const ASCENSO_ACCENT = {
  cyan: "#38bdf8",
  amber: "#fbbf24",
} as const;

// ── Fondo full-page tipo estadio ─────────────────────────────────────────────
// Réplica exacta del fondo de la landing: tapa los orbs púrpura/azul del shell
// de Copa Omega con el beystadium real + glow frío + viñeta.
// Se monta como capa fija (-z-10). Colocar UNA sola vez por pantalla.
export function AscensoBackground({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`fixed inset-0 -z-10 overflow-hidden bg-[#05070d] ${className}`}
    >
      {/* Capa 1 — el estadio real de Beyblade X, gigante y centrado arriba. */}
      <Image
        src="/stadium.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top opacity-60 mix-blend-screen"
      />
      {/* Capa 2 — resplandor frío (cian). */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,_rgba(56,189,248,0.2),_transparent_70%)]" />
      {/* Capa 3 — viñeta que asienta el contenido. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_120%_at_50%_0%,_transparent_45%,_rgba(2,4,10,0.92)_100%)]" />
    </div>
  );
}

// ── Wrapper de pantalla completa ─────────────────────────────────────────────
// Compone el fondo de estadio + un contenedor relativo min-h-screen listo para
// recibir el contenido de la pantalla. Atajo para no repetir el fondo a mano.
export function AscensoScreen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative min-h-screen text-omega-text ${className}`}>
      <AscensoBackground />
      {children}
    </div>
  );
}

// ── Sello hexagonal de rango ─────────────────────────────────────────────────
// La pieza más distintiva: insignia hexagonal con la letra del rango y glow del
// color del rango. Réplica del RankSeal de la landing, con tamaños parametrizables.
//   letter  — rango (F..S); deriva el color de RANK_HEX salvo que pases `hex`.
//   hex     — override manual del color (opcional).
//   caption — texto chico opcional debajo del sello (ej: "campeón").
//   size    — sm (tablero) | md (HUD, default) | lg (héroe / rank-up).
//   pulse   — si true, agrega un latido suave del glow (ideal para el rango activo).
type SealSize = "sm" | "md" | "lg";

const SEAL_SIZES: Record<
  SealSize,
  { box: string; text: string; glow: number; alpha: string }
> = {
  sm: { box: "size-14 md:size-16", text: "text-2xl md:text-3xl", glow: 22, alpha: "66" },
  md: { box: "size-16 md:size-20", text: "text-3xl md:text-4xl", glow: 28, alpha: "80" },
  lg: { box: "size-24 md:size-28", text: "text-5xl md:text-6xl", glow: 40, alpha: "90" },
};

export function RankSeal({
  letter,
  hex,
  caption,
  size = "md",
  pulse = false,
  className = "",
}: {
  letter: RankLetter;
  hex?: string;
  caption?: string;
  size?: SealSize;
  pulse?: boolean;
  className?: string;
}) {
  const color = hex ?? RANK_HEX[letter];
  const s = SEAL_SIZES[size];
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <span
        className={`hex-clip flex items-center justify-center ${s.box} ${
          pulse ? "ascenso-seal-pulse" : ""
        }`}
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
          boxShadow: `0 0 ${s.glow}px ${color}${s.alpha}`,
          // Variable usada por la animación .ascenso-seal-pulse (glow del color).
          ["--seal-glow" as string]: `${color}${s.alpha}`,
        }}
      >
        <span className={`font-black text-black/85 ${s.text}`}>{letter}</span>
      </span>
      {caption && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/55">
          {caption}
        </span>
      )}
    </div>
  );
}

// ── Título estilo landing (black uppercase con gradiente cian→ámbar) ──────────
// Dos formas de uso:
//   a) <AscensoHeading top="Torneo" bottom="de Ascenso" />  → h1 a dos líneas
//      (línea 1 blanca, línea 2 con gradiente), como el hero de la landing.
//   b) <AscensoHeading>Subí rango a rango</AscensoHeading>   → una sola línea
//      con la clase de gradiente aplicada por defecto (gradient=true).
export function AscensoHeading({
  top,
  bottom,
  children,
  as: Tag = "h1",
  gradient = true,
  className = "",
}: {
  top?: string;
  bottom?: string;
  children?: ReactNode;
  as?: "h1" | "h2" | "h3";
  gradient?: boolean;
  className?: string;
}) {
  const base =
    "font-black uppercase leading-[0.85] tracking-tight text-5xl md:text-6xl lg:text-7xl";
  if (top !== undefined || bottom !== undefined) {
    return (
      <Tag className={`${base} ${className}`}>
        {top !== undefined && <span className="block text-white/95">{top}</span>}
        {bottom !== undefined && (
          <span className={`block ${ASCENSO_TEXT_GRADIENT}`}>{bottom}</span>
        )}
      </Tag>
    );
  }
  return (
    <Tag className={`${base} ${gradient ? ASCENSO_TEXT_GRADIENT : "text-white/95"} ${className}`}>
      {children}
    </Tag>
  );
}

// Clase del gradiente de texto cian→ámbar con el drop-shadow del hero.
// Exportada para reusar en cualquier texto suelto (números, palabras destacadas).
export const ASCENSO_TEXT_GRADIENT =
  "bg-gradient-to-b from-cyan-200 via-sky-300 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(56,189,248,0.45)]";

// Variante dorada (cierre "¡Go Shoot!"): from-amber-300 via-orange-400 to-amber-300.
export const ASCENSO_TEXT_GRADIENT_GOLD =
  "bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,146,60,0.6)]";

// ── Marquesina / kicker (font-mono con líneas a los costados) ─────────────────
// El texto pequeño uppercase con tracking ancho y las líneas h-px a los lados.
//   left/right — color del degradé de cada línea ("cyan" | "amber").
export function AscensoKicker({
  children,
  left = "cyan",
  right = "amber",
  className = "",
}: {
  children: ReactNode;
  left?: "cyan" | "amber";
  right?: "cyan" | "amber";
  className?: string;
}) {
  const line = (side: "left" | "right", color: "cyan" | "amber") => {
    const to = color === "cyan" ? "to-cyan-400/60" : "to-amber-400/60";
    const dir = side === "left" ? "from-transparent" : "from-transparent";
    const grad = side === "left" ? "bg-gradient-to-r" : "bg-gradient-to-l";
    return <span className={`h-px w-10 ${grad} ${dir} ${to}`} />;
  };
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {line("left", left)}
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-300/90 md:text-xs">
        {children}
      </p>
      {line("right", right)}
    </div>
  );
}

// ── CTA dorado ───────────────────────────────────────────────────────────────
// El botón principal de la sección: gradiente ámbar, texto negro black uppercase,
// glow dorado que crece en hover. Renderiza <Link> si pasás `href`, si no <button>.
//   showArrow — agrega la flecha ArrowRight al final (como el CTA de cierre).
//   icon      — icono inicial (por defecto ChevronsUp; pasá null para ninguno).
export const ASCENSO_CTA_CLASS =
  "group inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300/60 bg-gradient-to-r from-amber-400 to-amber-500 px-9 py-4 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_30px_rgba(251,191,36,0.45)] transition-all hover:shadow-[0_0_50px_rgba(251,191,36,0.7)] active:scale-95";

export function AscensoCta({
  children,
  href,
  onClick,
  type = "button",
  showArrow = false,
  icon,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  showArrow?: boolean;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const leading = icon === undefined ? <ChevronsUp className="size-5" /> : icon;
  const inner = (
    <>
      {leading}
      {children}
      {showArrow && (
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  );
  const cls = `${ASCENSO_CTA_CLASS} ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

// ── Panel / superficie translúcida ───────────────────────────────────────────
// Tarjeta consistente sobre el estadio (como las "estaciones" del tablero):
// borde tenue, fondo casi transparente y backdrop-blur. NADA de cards opacas.
//   hover — si true, resalta el borde al pasar el mouse (interactivo).
export function AscensoPanel({
  children,
  hover = false,
  className = "",
}: {
  children: ReactNode;
  hover?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm md:p-5 ${
        hover ? "transition-all hover:border-white/25 hover:bg-white/[0.06]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Placa de rango (letra + etiqueta) ────────────────────────────────────────
// La chapa que va al pie de cada blader: borde del color del rango, letra
// font-mono black en color y una etiqueta chica uppercase.
export function RankPlate({
  letter,
  label,
  hex,
  className = "",
}: {
  letter: RankLetter;
  label: string;
  hex?: string;
  className?: string;
}) {
  const color = hex ?? RANK_HEX[letter];
  return (
    <div
      className={`flex items-center gap-2 rounded-md border bg-black/60 px-3 py-1.5 backdrop-blur-sm ${className}`}
      style={{ borderColor: `${color}66` }}
    >
      <span className="font-mono text-xl font-black leading-none" style={{ color }}>
        {letter}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
        {label}
      </span>
    </div>
  );
}

// ── HUD de marcador (cinta con celdas divididas) ─────────────────────────────
// La cinta-marcador tipo fighting game: fondo negro translúcido, celdas con
// números font-mono black. Usar ScoreHud como contenedor y ScoreCell adentro.
export function ScoreHud({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex items-stretch divide-x divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-black/50 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

// Celda del marcador. `accent` es una clase de color de texto (ej "text-cyan-300").
export function ScoreCell({
  value,
  label,
  accent = "text-cyan-300",
}: {
  value: number | string;
  label: string;
  accent?: string;
}) {
  return (
    <div className="flex-1 px-4 py-3 text-center md:px-6 md:py-4">
      <p className={`font-mono text-2xl font-black tabular-nums md:text-3xl ${accent}`}>
        {typeof value === "number" ? value.toLocaleString("es-AR") : value}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-omega-muted">{label}</p>
    </div>
  );
}

// ── Marca VS del HUD central (sellos F vs S con las espadas) ──────────────────
// Bloque reutilizable del "VS" del hero: dos sellos con las espadas ámbar en el
// medio. Útil para cabeceras de combate.
export function VsSeal({
  leftLetter = "F",
  rightLetter = "S",
  leftCaption,
  rightCaption,
  size = "md",
  className = "",
}: {
  leftLetter?: RankLetter;
  rightLetter?: RankLetter;
  leftCaption?: string;
  rightCaption?: string;
  size?: SealSize;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <RankSeal letter={leftLetter} caption={leftCaption} size={size} />
      <div className="flex flex-col items-center">
        <Swords className="size-6 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] md:size-7" />
        <span className="mt-0.5 font-mono text-lg font-black italic text-amber-300 md:text-xl">
          VS
        </span>
      </div>
      <RankSeal letter={rightLetter} caption={rightCaption} size={size} />
    </div>
  );
}
