import Link from "next/link";
import Image from "next/image";
import { ChevronUp, Swords, Ticket, Lock, Trophy } from "lucide-react";

interface LandingAscensoProps {
  totalPlayers: number;
  totalMatches: number;
}

// Rangos del Torneo de Ascenso (de mayor a menor: S arriba, F abajo).
// Colores y nombres alineados a los componentes reales del torneo
// (app/(app)/ascenso/_components/rank-tower.tsx).
// TODO Fase 3: leer rangos, umbrales y ocupantes reales desde DB.
const RANKS = [
  { letter: "S", name: "Omega",    grad: "from-yellow-500 to-amber-600", text: "text-yellow-300", glow: "rgba(253,224,71,0.55)", stars: "56+",   tag: "Cima" },
  { letter: "A", name: "Diamante", grad: "from-amber-700 to-amber-900",  text: "text-amber-400",  glow: "rgba(251,191,36,0.45)", stars: "41-55", tag: "Élite" },
  { letter: "B", name: "Oro",      grad: "from-red-700 to-red-900",      text: "text-red-400",    glow: "rgba(248,113,113,0.45)", stars: "31-40", tag: "Veterano" },
  { letter: "C", name: "Plata",    grad: "from-purple-700 to-purple-900",text: "text-purple-400", glow: "rgba(192,132,252,0.45)", stars: "21-30", tag: "Aspirante" },
  { letter: "D", name: "Bronce",   grad: "from-blue-700 to-blue-900",    text: "text-blue-400",   glow: "rgba(96,165,250,0.45)",  stars: "11-20", tag: "Retador" },
  { letter: "E", name: "Hierro",   grad: "from-green-800 to-green-950",  text: "text-green-400",  glow: "rgba(74,222,128,0.4)",   stars: "1-10",  tag: "Iniciado" },
  { letter: "F", name: "Novato",   grad: "from-gray-700 to-gray-900",    text: "text-gray-400",   glow: "rgba(156,163,175,0.3)",  stars: "0",     tag: "Punto de partida" },
] as const;

// Landing de la modalidad Torneo de Ascenso.
// Identidad propia tipo arcade/Pokémon Z-A: la TORRE DE RANGOS F→S es la protagonista.
// Mobile-first: una columna; desktop (lg+): hero a 2 columnas y secciones full-width.
export function LandingAscenso({ totalPlayers, totalMatches }: LandingAscensoProps) {
  return (
    <>
      {/* ════════════════════════════════════════════════
          ARENA — hero
          Mobile: torre apilada bajo el título.
          Desktop: 2 columnas (torre | título + CTAs + HUD), full-bleed.
         ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Fondo: estadio difuminado full-bleed + grid neón diagonal (vibe de juego de pelea) */}
        <div className="absolute inset-0 -z-10">
          <Image src="/stadium.png" alt="" fill priority className="object-cover opacity-[0.18] blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-omega-black/70 via-omega-black/85 to-omega-black" />
          {/* Glow lateral que acompaña la columna de la torre en desktop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_28%_45%,_rgba(253,224,71,0.10)_0%,_rgba(123,47,247,0.06)_45%,_transparent_72%)]" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(60deg, rgba(0,180,216,0.5) 1px, transparent 1px), linear-gradient(-60deg, rgba(123,47,247,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 md:px-8 pt-10 pb-16 md:pt-14 md:pb-20 lg:pt-20 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
            {/* ── COLUMNA TORRE — primero en mobile, izquierda en desktop ── */}
            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-xl lg:order-first">
              {/* Halo de la cima */}
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

              <ol className="relative flex flex-col items-center gap-2 md:gap-2.5 lg:gap-3">
                {RANKS.map((r, i) => {
                  // El rango S (i=0) es el más ancho; F (último) el más angosto: forma de torre.
                  const width = 100 - i * 6;
                  const isTop = i === 0;
                  const isBottom = i === RANKS.length - 1;
                  return (
                    <li
                      key={r.letter}
                      style={{ width: `${width}%`, boxShadow: `0 0 24px ${r.glow}` }}
                      className={`relative flex items-center gap-3 rounded-xl border border-white/15 bg-gradient-to-r ${r.grad} px-3 py-2.5 md:px-4 md:py-3 lg:py-3.5 ${isTop ? "star-glow" : ""}`}
                    >
                      {/* Sello del rango */}
                      <span className="flex size-9 md:size-11 lg:size-12 shrink-0 items-center justify-center rounded-lg bg-black/45 ring-1 ring-white/20">
                        <span className={`text-xl md:text-2xl font-black ${r.text}`}>{r.letter}</span>
                      </span>

                      {/* Nombre + etiqueta */}
                      <span className="flex-1 text-left">
                        <span className="block text-sm md:text-base lg:text-lg font-black text-white leading-tight">{r.name}</span>
                        <span className="block text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-white/55">{r.tag}</span>
                      </span>

                      {/* Estrellas requeridas */}
                      <span className="shrink-0 text-right">
                        <span className={`block text-xs md:text-sm font-black ${r.text}`}>⭐ {r.stars}</span>
                        <span className="block text-[9px] md:text-[10px] uppercase tracking-widest text-white/40">estrellas</span>
                      </span>

                      {/* Bandera "estás acá" en el punto de partida */}
                      {isBottom && (
                        <span className="absolute -right-2 -top-2 rotate-3 rounded-md border border-cyan-400/50 bg-omega-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-300 shadow-[0_0_12px_rgba(0,180,216,0.4)]">
                          Arrancás acá
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>

              {/* Flechas de ascenso laterales — refuerzan la dirección "hacia arriba" */}
              <div className="pointer-events-none absolute -left-6 md:-left-9 top-0 bottom-0 hidden sm:flex flex-col justify-center gap-1 text-cyan-400/50">
                {[0, 1, 2].map((n) => (
                  <ChevronUp key={n} className="size-5 md:size-6" style={{ opacity: 1 - n * 0.3 }} />
                ))}
              </div>
              <div className="pointer-events-none absolute -right-6 md:-right-9 top-0 bottom-0 hidden sm:flex flex-col justify-center gap-1 text-cyan-400/50">
                {[0, 1, 2].map((n) => (
                  <ChevronUp key={n} className="size-5 md:size-6" style={{ opacity: 1 - n * 0.3 }} />
                ))}
              </div>
            </div>

            {/* ── COLUMNA TEXTO — segundo en mobile, derecha en desktop ── */}
            <div className="text-center lg:text-left">
              {/* Marquesina arcade */}
              <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.45em] text-cyan-400/80 mb-3">
                Bladers Santa Fe — Modo
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight">
                TORNEO DE
                <br />
                <span className="neon-purple bg-gradient-to-r from-cyan-300 via-purple-300 to-yellow-300 bg-clip-text text-transparent">
                  ASCENSO
                </span>
              </h1>
              <p className="mt-4 mx-auto lg:mx-0 max-w-md lg:max-w-lg text-sm md:text-base lg:text-lg text-omega-muted font-mono tracking-wide">
                Escalá la torre del rango F al S. Cada combate te acerca a la cima.
              </p>

              {/* ── CTAs estilo "INSERT COIN" ── */}
              <div className="mt-8 lg:mt-10 flex flex-col sm:flex-row items-center lg:items-stretch justify-center lg:justify-start gap-3">
                <Link
                  href="/auth/register"
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-yellow-400/40 bg-gradient-to-r from-yellow-500 to-amber-600 px-8 py-4 text-base font-black uppercase tracking-widest text-black shadow-[0_0_30px_rgba(253,224,71,0.4)] transition-all hover:shadow-[0_0_50px_rgba(253,224,71,0.65)] active:scale-95"
                >
                  <Swords className="size-5" />
                  Empezar a ascender
                </Link>
                <Link
                  href="/ascenso"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/5 px-8 py-4 text-base font-bold uppercase tracking-widest text-cyan-300 transition-all hover:bg-cyan-500/15 active:scale-95"
                >
                  Ver la arena
                </Link>
              </div>

              {/* HUD de stats — fila tipo marcador de arcade */}
              <div className="mt-8 inline-flex items-stretch divide-x divide-omega-border/50 rounded-xl border border-omega-border/40 bg-omega-black/60 backdrop-blur-sm">
                <HudStat value={totalPlayers} label="bladers" color="text-cyan-400" />
                <HudStat value={7} label="rangos" color="text-purple-400" />
                <HudStat value={totalMatches} label="combates" color="text-yellow-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          REGLAS DEL ASCENSO — tira horizontal de "mecánicas"
          (deliberadamente NO hexágonos de marketing)
         ════════════════════════════════════════════════ */}
      <section className="relative border-y border-omega-border/30 bg-omega-dark/60 py-12 md:py-14 lg:py-16 px-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.4em] text-purple-300/80 mb-8 lg:mb-12">
            ▸ Cómo se sube de rango
          </p>
          <div className="grid gap-4 lg:gap-6 sm:grid-cols-3">
            <Mechanic
              icon={Swords}
              step="01"
              title="Combatí"
              desc="Pelea contra rivales de tu mismo rango. Ganar suma; perder no te baja."
              accent="text-cyan-400"
            />
            <Mechanic
              icon={Ticket}
              step="02"
              title="Cargá el Ticket"
              desc="Cada victoria acumula Ticket Points hasta llenar tu Challenger's Ticket."
              accent="text-purple-400"
            />
            <Mechanic
              icon={ChevronUp}
              step="03"
              title="Ganá el ascenso"
              desc="Con el ticket lleno, jugás el combate de ascenso. Ganás → subís de rango."
              accent="text-yellow-300"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SALÓN DE LA CIMA — leaderboard "próximamente"
          Desktop: 2 columnas (intro a la izquierda | tablero a la derecha).
          // TODO Fase 3: reemplazar por el ranking real de jugadores por rango.
         ════════════════════════════════════════════════ */}
      <section className="relative py-12 md:py-16 lg:py-20 px-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Intro — centrada en mobile, alineada a la izquierda en desktop */}
            <div className="text-center lg:text-left">
              <Trophy className="mx-auto lg:mx-0 size-9 lg:size-11 text-yellow-300/80 star-glow" />
              <h2 className="mt-4 text-2xl md:text-3xl lg:text-4xl font-black">
                <span className="neon-gold bg-gradient-to-r from-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  Salón del Rango Omega
                </span>
              </h2>
              <p className="mt-3 mx-auto lg:mx-0 max-w-md text-sm md:text-base text-omega-muted">
                Acá van a quedar los que lleguen más alto. Subí la torre, plantá tu nombre en la cima y defendé el rango S.
              </p>

              <Link
                href="/auth/register"
                className="mt-7 inline-flex items-center gap-2 rounded-xl border border-yellow-400/30 px-6 py-3 text-sm font-black uppercase tracking-wider text-yellow-300 transition-all hover:bg-yellow-400/10 active:scale-95"
              >
                Reclamá tu lugar en la torre
                <ChevronUp className="size-4" />
              </Link>
            </div>

            {/* Tablero bloqueado con efecto "locked slot" */}
            <div className="overflow-hidden rounded-2xl border border-yellow-400/20 bg-omega-card/40">
              <div className="border-b border-white/10 bg-black/40 px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.3em] text-yellow-300/70">
                Top de la torre
              </div>
              <ul className="divide-y divide-white/5">
                {[1, 2, 3, 4, 5].map((pos) => (
                  <li key={pos} className="flex items-center gap-4 px-4 py-4 opacity-60">
                    <span className="w-6 text-center font-black text-omega-muted">{pos}</span>
                    <span className="flex size-10 items-center justify-center rounded-lg bg-black/40 ring-1 ring-white/10">
                      <Lock className="size-4 text-omega-muted" />
                    </span>
                    <span className="flex-1 text-left">
                      <span className="block h-3 w-28 rounded bg-omega-elevated/60" />
                      <span className="mt-1.5 block h-2 w-16 rounded bg-omega-elevated/40" />
                    </span>
                    <span className="rounded-md bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-300/60">
                      Rango {pos <= 2 ? "S" : "A"}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="bg-black/30 px-4 py-3 font-mono text-xs uppercase tracking-widest text-cyan-400/70">
                Próximamente — temporada en preparación
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Marcador HUD: número grande arriba, etiqueta chica abajo.
function HudStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="px-5 py-3 md:px-7 md:py-4">
      <p className={`font-mono text-2xl md:text-3xl font-black tabular-nums ${color}`}>
        {value.toLocaleString("es-AR")}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-omega-muted">{label}</p>
    </div>
  );
}

// Tarjeta de mecánica: número de paso + ícono + texto. Layout de "ficha", no de feature card.
function Mechanic({
  icon: Icon,
  step,
  title,
  desc,
  accent,
}: {
  icon: typeof Swords;
  step: string;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-omega-black/50 p-5 lg:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-omega-black/70">
      <span className="absolute right-3 top-2 font-mono text-3xl lg:text-5xl font-black text-white/5">{step}</span>
      <Icon className={`size-7 lg:size-9 ${accent}`} />
      <h3 className="mt-3 text-base lg:text-lg font-black">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-omega-muted">{desc}</p>
    </div>
  );
}
