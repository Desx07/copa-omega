import Link from "next/link";
import Image from "next/image";
import { Swords, Ticket, ChevronRight, ArrowRight, ChevronsUp } from "lucide-react";
import { RANKS, type RankInfo } from "@/lib/ascenso";

interface LandingAscensoProps {
  totalPlayers: number;
  totalMatches: number;
}

// ── Acentos visuales por rango ─────────────────────────────────────────────
// Paleta hex propia de esta landing (estilos inline del beystadium).
// Los DATOS del sistema (objetivo de Ticket Points por rango) salen de
// lib/ascenso — única fuente de verdad, nunca números inventados acá.
const RANK_HEX: Record<RankInfo["letter"], string> = {
  F: "#7dd3fc",
  E: "#38bdf8",
  D: "#22d3ee",
  C: "#818cf8",
  B: "#c084fc",
  A: "#f472b6",
  S: "#fbbf24",
};

// Los dos bladers protagonistas del duelo (assets anime de Beyblade X).
const FIGHTER_LEFT = "/characters/chr_00.png";
const FIGHTER_RIGHT = "/characters/chr_05.png";

// Landing de la modalidad "Torneo de Ascenso".
// Concepto: NO es marketing apilado — es una PANTALLA DE COMBATE Beyblade X.
// El beystadium hexagonal y los dos bladers enfrentados son los protagonistas;
// la progresión F→S es un "tablero de combate" lateral, no una pila de barras.
// Mobile-first; el layout de duelo a 2 columnas aparece desde md (768px).
export function LandingAscenso({ totalPlayers, totalMatches }: LandingAscensoProps) {
  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          FONDO PROPIO FULL-PAGE (fixed, -z-10)
          Tapa los orbs púrpura/azul/dorado de Copa Omega que trae el shell.
          Capa 1: el beystadium hexagonal real, gigante y centrado.
          Capa 2: tinte oscuro + viñeta para que el contenido respire.
         ════════════════════════════════════════════════════════════════ */}
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-[#05070d]">
        {/* El estadio real de Beyblade X de fondo, ocupando todo el ancho de PC. */}
        <Image
          src="/stadium.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-60 mix-blend-screen"
        />
        {/* Resplandor frío del estadio + viñeta para asentar el combate. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,_rgba(56,189,248,0.2),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_120%_at_50%_0%,_transparent_45%,_rgba(2,4,10,0.92)_100%)]" />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          DUELO — pantalla de combate a todo el ancho (1440px en PC).
          Izquierda: blader retador.  Centro: HUD VS + título.  Derecha: rival.
          En mobile se apila; el duelo de 2 bladers a los costados aparece en md.
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="mx-auto w-full max-w-[1440px] px-6 pt-8 pb-14 md:px-10 md:pt-12 lg:px-14">
          {/* Marquesina de combate */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-400/60" />
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-300/90 md:text-xs">
              Bladers Santa Fe · combate por el rango
            </p>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-400/60" />
          </div>

          {/* Escena del duelo: bladers a los costados, HUD en el medio.
              Columnas laterales con minmax para que NO colapsen a 0 ancho. */}
          <div className="relative mt-6 grid items-center gap-0 md:mt-4 md:grid-cols-[minmax(200px,1fr)_minmax(0,560px)_minmax(200px,1fr)] lg:grid-cols-[minmax(280px,1fr)_minmax(0,560px)_minmax(280px,1fr)]">
            {/* ── Blader izquierdo (retador) ── */}
            <Fighter
              src={FIGHTER_LEFT}
              side="left"
              rank="F"
              label="Retador"
              accent="#7dd3fc"
            />

            {/* ── Núcleo central: título + HUD VS + CTAs ── */}
            <div className="relative z-10 order-first px-2 text-center md:order-none md:px-6">
              {/* Disco de energía del beystadium detrás del título */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.16),_transparent_65%)] blur-2xl"
              />

              <h1 className="text-5xl font-black uppercase leading-[0.85] tracking-tight md:text-6xl lg:text-7xl">
                <span className="block text-white/95">Torneo</span>
                <span className="block bg-gradient-to-b from-cyan-200 via-sky-300 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(56,189,248,0.45)]">
                  de Ascenso
                </span>
              </h1>

              {/* HUD VS — sello de combate (insignia hexagonal con la letra del rango) */}
              <div className="mt-6 flex items-center justify-center gap-4 md:mt-7">
                <RankSeal letter="F" hex="#7dd3fc" caption="retador" />
                <div className="flex flex-col items-center">
                  <Swords className="size-6 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] md:size-7" />
                  <span className="mt-0.5 font-mono text-lg font-black italic text-amber-300 md:text-xl">
                    VS
                  </span>
                </div>
                <RankSeal letter="S" hex="#fbbf24" caption="campeón" />
              </div>

              <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-omega-muted md:text-base">
                Se sube <span className="font-black text-cyan-300">rango por rango</span>, a fuerza
                de combates. La <span className="font-black text-amber-300">cima</span> es de uno solo.
              </p>

              {/* CTA de combate */}
              <div className="mt-10 flex justify-center">
                <Link
                  href="/auth/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300/60 bg-gradient-to-r from-amber-400 to-amber-500 px-9 py-4 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_30px_rgba(251,191,36,0.45)] transition-all hover:shadow-[0_0_50px_rgba(251,191,36,0.7)] active:scale-95"
                >
                  <ChevronsUp className="size-5" />
                  Empezar a ascender
                </Link>
              </div>
            </div>

            {/* ── Blader derecho (campeón) ── */}
            <Fighter
              src={FIGHTER_RIGHT}
              side="right"
              rank="S"
              label="Campeón"
              accent="#fbbf24"
            />
          </div>

          {/* Cinta-marcador del combate (tipo HUD de fighting game) */}
          <div className="mx-auto mt-12 flex max-w-2xl items-stretch divide-x divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-black/50 backdrop-blur-md md:mt-14">
            <ScoreCell value={totalPlayers} label="bladers en pista" accent="text-cyan-300" />
            <ScoreCell value={RANKS.length} label="rangos · F a S" accent="text-indigo-300" />
            <ScoreCell value={totalMatches} label="combates jugados" accent="text-amber-300" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TABLERO DE ASCENSO — la progresión F→S como escalera de combate.
          NO es una pila de barras: cada rango es una "estación" con su
          insignia hexagonal y el objetivo de Ticket Points que abre la
          siguiente (targets reales de lib/ascenso).
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-white/[0.06] bg-black/40 py-14 backdrop-blur-sm md:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-14">
          <div className="text-center">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-300/80">
              El camino a la cima
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase md:text-4xl lg:text-5xl">
              Subí <span className="text-amber-300">rango</span> a <span className="text-amber-300">rango</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-omega-muted md:text-base">
              Ganá peleas para cargar tu ticket. Cuando lo llenás, desbloqueás el combate de
              ascenso contra otro blader de tu rango.
            </p>
          </div>

          {/* Escalera de rangos — de F (izquierda) a S (derecha) en PC. */}
          <ol className="mt-12 flex flex-col gap-3 md:flex-row md:items-stretch md:gap-2 lg:gap-3">
            {RANKS.map((r, i) => (
              <RankStation key={r.letter} rank={r} index={i} isLast={i === RANKS.length - 1} />
            ))}
          </ol>

          {/* Nota del ticket: qué pasa en el combate de ascenso. */}
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-omega-muted md:text-sm">
            <Ticket className="size-4 text-amber-300/80" />
            En el combate de ascenso el ganador sube de rango y los dos reinician el ticket en cero.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CIERRE — desafío directo, sin podio ni leaderboard.
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-base font-bold uppercase tracking-[0.5em] text-cyan-300/90 md:text-lg">
            3 · 2 · 1
          </p>
          <h2 className="mt-2 text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,146,60,0.6)]">¡Go Shoot!</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm text-omega-muted md:text-base">
            Soltá el bey, ganá combates y subí del rango F a la cima S.
          </p>
          <Link
            href="/auth/register"
            className="group mt-8 inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300/60 bg-gradient-to-r from-amber-400 to-amber-500 px-9 py-4 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_30px_rgba(251,191,36,0.45)] transition-all hover:shadow-[0_0_55px_rgba(251,191,36,0.7)] active:scale-95"
          >
            <ChevronsUp className="size-5" />
            Empezar a ascender
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}

// ── Blader protagonista del duelo ──────────────────────────────────────────
// Ilustración anime grande, con halo del color de su rango y una placa de
// rango al pie. En mobile se reduce y comparte fila; en md ocupa el costado.
function Fighter({
  src,
  side,
  rank,
  label,
  accent,
}: {
  src: string;
  side: "left" | "right";
  rank: string;
  label: string;
  accent: string;
}) {
  const isLeft = side === "left";
  return (
    <div
      className={`relative flex flex-col items-center ${
        isLeft ? "md:items-start" : "md:items-end"
      }`}
    >
      {/* Halo de energía detrás del blader, del color de su rango. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-3/4 w-[88%] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent}33, transparent 70%)` }}
      />
      <div
        className={`relative h-[230px] w-[180px] sm:h-[300px] sm:w-[230px] md:h-[360px] md:w-[280px] lg:h-[440px] lg:w-[340px] ${
          isLeft ? "" : "scale-x-[-1]"
        }`}
      >
        <Image
          src={src}
          alt={`Blader ${label} en pose de combate`}
          fill
          sizes="(max-width: 768px) 230px, 340px"
          className="object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)]"
          priority
        />
      </div>
      {/* Placa de rango al pie (no es texto invertido: va fuera del scale-x). */}
      <div
        className={`-mt-4 flex items-center gap-2 rounded-md border bg-black/60 px-3 py-1.5 backdrop-blur-sm ${
          isLeft ? "md:self-start" : "md:self-end"
        }`}
        style={{ borderColor: `${accent}66` }}
      >
        <span
          className="font-mono text-xl font-black leading-none"
          style={{ color: accent }}
        >
          {rank}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Sello de rango hexagonal (insignia de combate del HUD VS) ──────────────
function RankSeal({ letter, hex, caption }: { letter: string; hex: string; caption: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="hex-clip flex size-16 items-center justify-center md:size-20"
        style={{
          background: `linear-gradient(135deg, ${hex}, ${hex}99)`,
          boxShadow: `0 0 28px ${hex}80`,
        }}
      >
        <span className="text-3xl font-black text-black/85 md:text-4xl">{letter}</span>
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/55">
        {caption}
      </span>
    </div>
  );
}

// ── Celda del marcador HUD ──────────────────────────────────────────────────
function ScoreCell({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div className="flex-1 px-4 py-3 text-center md:px-6 md:py-4">
      <p className={`font-mono text-2xl font-black tabular-nums md:text-3xl ${accent}`}>
        {value.toLocaleString("es-AR")}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-omega-muted">{label}</p>
    </div>
  );
}

// ── Estación de rango en el tablero de ascenso ─────────────────────────────
// Cada rango es una tarjeta-insignia con su letra hexagonal y, debajo, el
// objetivo de Ticket Points que habilita el combate de ascenso.
function RankStation({ rank, index, isLast }: { rank: RankInfo; index: number; isLast: boolean }) {
  const { letter, ticketTarget } = rank;
  const hex = RANK_HEX[letter];
  return (
    <li className="relative flex flex-1 flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.06] md:p-5">
      {/* Conector hacia el siguiente rango (flecha de ascenso). */}
      {!isLast && (
        <ChevronRight
          aria-hidden
          className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-white/30 md:block"
          style={{ color: `${hex}99` }}
        />
      )}

      {/* Insignia hexagonal con la letra del rango. */}
      <span
        className="hex-clip flex size-14 items-center justify-center md:size-16"
        style={{
          background: `linear-gradient(135deg, ${hex}, ${hex}88)`,
          boxShadow: `0 0 22px ${hex}66`,
        }}
      >
        <span className="text-2xl font-black text-black/85 md:text-3xl">{letter}</span>
      </span>

      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/70">
        Rango {letter}
      </p>

      {/* Objetivo del ticket: puntos que habilitan el combate de ascenso. */}
      {ticketTarget !== null ? (
        <span
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
          style={{ borderColor: `${hex}55`, background: `${hex}1a` }}
        >
          <Ticket className="size-3.5" style={{ color: hex }} />
          <span className="font-mono text-xs font-black" style={{ color: hex }}>
            {ticketTarget} pts
          </span>
        </span>
      ) : (
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-300/15 px-2.5 py-1">
          <span className="font-mono text-xs font-black uppercase text-amber-300">La cima</span>
        </span>
      )}

      {/* Etiqueta de punto de partida en F. */}
      {index === 0 && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-cyan-400/50 bg-[#05070d] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.5)]">
          Arrancás acá
        </span>
      )}
    </li>
  );
}
