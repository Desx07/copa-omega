import Link from "next/link";
import Image from "next/image";
import { Crown, ChevronsUp, Ticket, Swords } from "lucide-react";
import { RANKS, type RankInfo } from "@/lib/ascenso";

interface LandingAscensoProps {
  totalPlayers: number;
  totalMatches: number;
}

// ── Acentos visuales por rango ─────────────────────────────────────────────
// Paleta hex propia de esta landing (glows inline de cada peldaño de la torre).
// Los DATOS del sistema (peleas y puntos por rango) salen de lib/ascenso —
// única fuente de verdad, nunca números inventados acá.
const RANK_HEX: Record<RankInfo["letter"], string> = {
  F: "#7dd3fc",
  E: "#38bdf8",
  D: "#22d3ee",
  C: "#818cf8",
  B: "#c084fc",
  A: "#f472b6",
  S: "#fbbf24",
};

// Los dos bladers protagonistas de la escena (assets anime de Beyblade X).
// El retador arranca en la base (F); el campeón custodia la cima (S).
const FIGHTER_ROOKIE = "/characters/chr_00.png";
const FIGHTER_CHAMPION = "/characters/chr_05.png";

// La torre se recorre de abajo (F) hacia arriba (S): render de S → F.
const TOWER = [...RANKS].reverse();

// ════════════════════════════════════════════════════════════════════════════
// Landing del modo "Torneo de Ascenso".
// NO es marketing apilado: es UNA escena inmersiva de estadio Beyblade X.
// El eje central es la TORRE DE ASCENSO vertical (F abajo → S arriba); a los
// costados, los dos bladers protagonistas (retador en la base, campeón en la
// cima). Subir la torre ES la landing. Mobile-first; el duelo lateral se
// despliega en pantallas grandes, en mobile los bladers quedan de ambiente.
// Server Component: sin estado ni interacción, solo Links e Image.
// ════════════════════════════════════════════════════════════════════════════
export function LandingAscenso({ totalPlayers, totalMatches }: LandingAscensoProps) {
  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          FONDO FULL-PAGE (fixed, -z-10)
          Tapa los orbs de Copa Omega del shell y monta la escena del estadio.
          Capa 1: el beystadium real. Capa 2: resplandor frío. Capa 3: viñeta.
         ════════════════════════════════════════════════════════════════ */}
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-[#04060c]">
        <Image
          src="/stadium.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-50 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_rgba(56,189,248,0.16),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_120%_at_50%_50%,_transparent_35%,_rgba(2,4,10,0.95)_100%)]" />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ESCENA ÚNICA — estadio + torre + bladers. Ocupa el alto útil.
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1440px] flex-col px-4 pb-10 pt-6 md:px-10 md:pt-10">
          {/* ── Encabezado HUD (título del modo, no un hero de marketing) ── */}
          <header className="text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-400/60 md:w-12" />
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-300/90 md:text-xs">
                Bladers Santa Fe · Modo Ascenso
              </p>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-amber-400/60 md:w-12" />
            </div>
            <h1 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-b from-white via-sky-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(56,189,248,0.4)]">
                Torneo de Ascenso
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-omega-muted md:max-w-xl md:text-base">
              Subí de rango ganando peleas. Entrás en{" "}
              <span className="font-black text-cyan-300">F</span> y escalás la torre hasta la
              cima <span className="font-black text-amber-300">S</span>.
            </p>
          </header>

          {/* ── ARENA: torre central con los bladers a los costados ── */}
          <div className="relative mt-8 flex flex-1 items-center justify-center md:mt-6">
            {/* Blader retador — base, izquierda. En mobile queda de ambiente. */}
            <Protagonist
              src={FIGHTER_ROOKIE}
              side="left"
              rank="F"
              role="Retador"
              accent={RANK_HEX.F}
            />
            {/* Blader campeón — cima, derecha. En mobile queda de ambiente. */}
            <Protagonist
              src={FIGHTER_CHAMPION}
              side="right"
              rank="S"
              role="Campeón"
              accent={RANK_HEX.S}
            />

            {/* ── TORRE DE ASCENSO — eje central vertical (S arriba → F abajo) ── */}
            <div className="relative z-10 w-full max-w-[360px] md:max-w-[400px]">
              {/* Remate de la cima */}
              <div className="mb-3 flex flex-col items-center">
                <Crown className="size-6 text-amber-300 drop-shadow-[0_0_14px_rgba(251,191,36,0.85)]" />
                <span className="mt-1 font-mono text-[10px] font-black uppercase tracking-[0.35em] text-amber-300/90">
                  La cima
                </span>
              </div>

              {/* Peldaños: cada rango es un piso de la torre, del más alto al más bajo */}
              <ol className="relative flex flex-col gap-2.5">
                {/* Riel vertical que conecta los peldaños (dorado arriba → cian abajo) */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[30px] top-4 bottom-4 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-300/70 via-fuchsia-400/40 to-cyan-300/70 md:left-[34px]"
                />
                {TOWER.map((rank, i) => (
                  <TowerRung
                    key={rank.letter}
                    rank={rank}
                    hex={RANK_HEX[rank.letter]}
                    isTop={i === 0}
                  />
                ))}
              </ol>

              {/* Base de la torre — punto de partida + acción */}
              <div className="mt-4 flex flex-col items-center">
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300/90">
                  Empezás acá
                </span>
                <Link
                  href="/auth/register"
                  data-testid="ascenso-cta-join"
                  className="group mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300/60 bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all hover:shadow-[0_0_50px_rgba(251,191,36,0.65)] active:scale-95 sm:w-auto"
                >
                  <ChevronsUp className="size-5" />
                  Sumate al torneo
                </Link>
                {/* Datos reales, discretos (no una barra de stats de marketing) */}
                <p className="mt-4 font-mono text-[11px] text-omega-muted/80">
                  <span className="font-bold text-white/70">
                    {totalPlayers.toLocaleString("es-AR")}
                  </span>{" "}
                  bladers en pista
                  <span className="mx-2 text-white/20">·</span>
                  <span className="font-bold text-white/70">
                    {totalMatches.toLocaleString("es-AR")}
                  </span>{" "}
                  combates jugados
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Blader protagonista de la escena ────────────────────────────────────────
// Ilustración anime grande con halo del color de su rango y una placa de rol al
// pie. Se ancla al costado de la torre: el retador abajo-izquierda, el campeón
// arriba-derecha. En mobile se achica y baja la opacidad para quedar de fondo.
function Protagonist({
  src,
  side,
  rank,
  role,
  accent,
}: {
  src: string;
  side: "left" | "right";
  rank: string;
  role: string;
  accent: string;
}) {
  const isLeft = side === "left";
  return (
    <div
      className={`pointer-events-none absolute z-0 flex flex-col opacity-25 sm:opacity-100 ${
        isLeft
          ? "bottom-0 left-0 items-start lg:left-4"
          : "top-0 right-0 items-end lg:right-4"
      }`}
    >
      <div className="relative">
        {/* Halo de energía del color del rango */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-4 left-1/2 -z-10 h-3/4 w-[85%] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${accent}40, transparent 70%)` }}
        />
        <div className="relative h-[220px] w-[150px] sm:h-[300px] sm:w-[210px] md:h-[380px] md:w-[270px] lg:h-[460px] lg:w-[330px]">
          <Image
            src={src}
            alt={`Blader ${role} en pose de combate`}
            fill
            sizes="(max-width: 768px) 210px, 330px"
            className="object-contain object-bottom drop-shadow-[0_18px_30px_rgba(0,0,0,0.65)]"
            priority
          />
        </div>
      </div>
      {/* Placa de rol + rango (solo desde sm: en mobile el blader es ambiente) */}
      <div
        className="pointer-events-auto -mt-3 hidden items-center gap-2 rounded-md border bg-black/65 px-3 py-1.5 backdrop-blur-sm sm:flex"
        style={{ borderColor: `${accent}66` }}
      >
        <span className="font-mono text-xl font-black leading-none" style={{ color: accent }}>
          {rank}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
          {role}
        </span>
      </div>
    </div>
  );
}

// ── Peldaño de la torre de ascenso ──────────────────────────────────────────
// Insignia hexagonal con la letra del rango + su nombre y el costo real para
// habilitar el combate de ascenso (peleas y puntos de ticket de lib/ascenso).
// El rango S (cima) no tiene costo: es el techo de la torre.
function TowerRung({ rank, hex, isTop }: { rank: RankInfo; hex: string; isTop: boolean }) {
  const { letter, name, fightsToRankUp, ticketTarget } = rank;
  const isSummit = ticketTarget === null;
  return (
    <li
      className={`group relative flex items-center gap-3.5 rounded-xl border bg-black/45 p-2.5 pr-3.5 backdrop-blur-md transition-all hover:bg-black/60 md:gap-4 md:p-3 ${
        isTop ? "border-amber-300/40" : "border-white/10 hover:border-white/25"
      }`}
      style={isTop ? { boxShadow: `0 0 26px ${hex}33` } : undefined}
    >
      {/* Insignia hexagonal (queda sobre el riel vertical) */}
      <span
        className="hex-clip flex size-[52px] flex-none items-center justify-center md:size-[60px]"
        style={{
          background: `linear-gradient(135deg, ${hex}, ${hex}88)`,
          boxShadow: `0 0 20px ${hex}66`,
        }}
      >
        <span className="text-2xl font-black text-black/85 md:text-3xl">{letter}</span>
      </span>

      {/* Nombre del rango */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black uppercase tracking-wide text-white md:text-base">
          {name}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-[11px]">
          Rango {letter}
        </p>
      </div>

      {/* Costo real del rango: peleas + puntos. La cima no tiene costo. */}
      {isSummit ? (
        <span className="flex flex-none items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-300/15 px-3 py-1.5">
          <Crown className="size-3.5 text-amber-300" />
          <span className="font-mono text-[11px] font-black uppercase tracking-wide text-amber-300">
            Rango máximo
          </span>
        </span>
      ) : (
        <div className="flex flex-none flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1.5 text-white/85">
            <Swords className="size-3.5" style={{ color: hex }} />
            <span className="font-mono text-xs font-black tabular-nums md:text-sm">
              {fightsToRankUp}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/45">
              peleas
            </span>
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
            style={{ borderColor: `${hex}55`, background: `${hex}1a` }}
          >
            <Ticket className="size-3" style={{ color: hex }} />
            <span className="font-mono text-[11px] font-black tabular-nums" style={{ color: hex }}>
              {ticketTarget} pts
            </span>
          </span>
        </div>
      )}
    </li>
  );
}
