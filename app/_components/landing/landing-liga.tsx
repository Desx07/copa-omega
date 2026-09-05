import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Users,
  ArrowRight,
  Swords,
  CalendarDays,
  Crown,
  Trophy,
  ListOrdered,
} from "lucide-react";

// Tipo exportado — lo importa app/page.tsx. NO cambiar la firma.
export interface TopTeam {
  name: string;
  stars: number;
  wins: number;
  losses: number;
  logo_url: string | null;
}

interface LandingLigaProps {
  totalTeams: number;
  totalPlayers: number;
  topTeams: TopTeam[];
}

// ──────────────────────────────────────────────────────────────────────────
// Landing de la modalidad "Liga de Equipos" (Beyblade X).
//
// CONCEPTO (no es marketing apilado): es la presentación de una liga deportiva
// por escuadras dentro del estadio. El hero NO es un duelo 1v1 (eso es Ascenso):
// es un CHOQUE DE ESCUADRAS — dos grupos de bladers enfrentados sobre la pista.
// Debajo, la temporada como planilla deportiva (PJ/PG/PE/PP/Pts).
//
// Si `topTeams` trae datos → planilla real con escudos.
// Si viene vacío → estado intencional que muestra cómo se va a ver la liga
// (filas-fantasma + reglas), no un cartel gris.
//
// FORMATO WEB PC: max-w-[1440px], 2 columnas desde md (768px). Mobile-first.
// ──────────────────────────────────────────────────────────────────────────

export function LandingLiga({ totalTeams, totalPlayers, topTeams }: LandingLigaProps) {
  // El líder de la tabla es el equipo destacado de la temporada.
  const leader = topTeams.length > 0 ? topTeams[0] : null;
  const hasTeams = topTeams.length > 0;

  // Labels de las escuadras del hero: nombres reales de los 2 punteros si ya
  // hay equipos; si todavía no hay, genéricos honestos (no nombres inventados).
  const leftSquadLabel = topTeams[0]?.name ?? "Escuadra A";
  const rightSquadLabel = topTeams[1]?.name ?? "Escuadra B";

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          FONDO PROPIO FULL-PAGE (fixed, -z-10)
          Tapa los orbs púrpura/azul de Copa Omega que trae el shell.
          Capa 1: estadio real de Beyblade X.  Capa 2: tinte verde de liga.
         ════════════════════════════════════════════════════════════════ */}
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-[#040a07]">
        <Image
          src="/stadium.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-50 mix-blend-screen"
        />
        {/* Resplandor verde de cancha + viñeta para asentar el contenido. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_25%,_rgba(46,213,115,0.18),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_120%_at_50%_0%,_transparent_45%,_rgba(2,8,5,0.94)_100%)]" />
        {/* Líneas de cancha tenues, como césped iluminado. */}
        <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(90deg,transparent,transparent_92px,rgba(46,213,115,0.6)_92px,rgba(46,213,115,0.6)_94px)]" />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          HERO — CHOQUE DE ESCUADRAS sobre la pista (a todo el ancho PC).
          Izquierda: escuadra local.  Centro: título + reglas + CTAs + stats.
          Derecha: escuadra visitante.  En mobile se apila; en md aparece el
          enfrentamiento de equipos a los costados.
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="mx-auto w-full max-w-[1440px] px-6 pt-8 pb-12 md:px-10 md:pt-12 lg:px-14">
          {/* Marquesina de liga */}
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-omega-green/60" />
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-omega-green/90 md:text-xs">
              Bladers Santa Fe · liga por equipos
            </p>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-omega-green/60" />
          </div>

          {/* ── Núcleo central: título + escudos VS + reglas + CTAs (full-width) ──
              El título va ARRIBA centrado a todo el ancho; las escuadras van
              debajo en una banda propia con espacio de sobra. Así no hay que
              meter 2-3 bladers en columnas laterales angostas. */}
          <div className="relative z-10 mt-6 px-2 text-center md:mt-5 md:px-4">
            {/* Disco de energía verde detrás del título */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[120%] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(46,213,115,0.16),_transparent_65%)] blur-2xl"
            />

            {/* Sello de modalidad */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-omega-green/30 bg-omega-green/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-omega-green">
              <Shield className="size-3.5" />
              Modalidad por equipos
            </div>

            <h1 className="text-5xl font-black uppercase leading-[0.85] tracking-tight md:text-6xl lg:text-7xl">
              <span className="block text-white/95">Liga de</span>
              <span className="block bg-gradient-to-b from-green-200 via-emerald-300 to-omega-green bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(46,213,115,0.45)]">
                Equipos
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-omega-muted md:text-base">
              Tu escuadra de bladers contra el resto. Una{" "}
              <span className="font-black text-omega-green">fecha por semana</span>, combates al{" "}
              <span className="font-black text-omega-green">mejor de 3</span>, y{" "}
              <span className="font-black text-omega-green">3 puntos</span> por victoria. Una sola
              tabla define al campeón.
            </p>
          </div>

          {/* ── BANDA DE CHOQUE DE ESCUADRAS (full-width) ──
              Escuadra local — VS — escuadra visitante. Cada escuadra es una
              FILA de 3 bladers escalonados con separación clara y bases
              alineadas (lectura de foto de plantel), nunca amontonados. */}
          <div className="relative mt-8 grid items-end gap-4 md:mt-10 md:grid-cols-[1fr_auto_1fr] md:gap-6 lg:gap-10">
            {/* Escuadra local */}
            <LigaSquad
              label={leftSquadLabel}
              align="left"
              members={[
                { src: "/characters/chr_06.png" },
                { src: "/characters/chr_07.png" },
                { src: "/characters/chr_24.png" },
              ]}
            />

            {/* Pivote central VS — separa visualmente a las dos escuadras */}
            <div className="order-first flex flex-col items-center justify-center md:order-none md:px-2">
              <div className="flex flex-col items-center rounded-2xl border border-omega-green/30 bg-black/55 px-5 py-4 backdrop-blur-md">
                <Swords className="size-7 text-omega-green drop-shadow-[0_0_12px_rgba(46,213,115,0.8)] md:size-9" />
                <span className="mt-1 font-mono text-2xl font-black italic text-omega-green md:text-3xl">
                  VS
                </span>
              </div>
            </div>

            {/* Escuadra visitante */}
            <LigaSquad
              label={rightSquadLabel}
              align="right"
              members={[
                { src: "/characters/chr_11.png" },
                { src: "/characters/chr_20.png" },
                { src: "/characters/chr_40.png" },
              ]}
            />
          </div>

          {/* CTAs — debajo del choque, centrados a todo el ancho */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg border border-omega-green/60 bg-gradient-to-r from-omega-green to-emerald-500 px-7 py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_30px_rgba(46,213,115,0.45)] transition-all hover:shadow-[0_0_50px_rgba(46,213,115,0.7)] active:scale-95 sm:w-auto"
            >
              <Users className="size-5" />
              Inscribir mi equipo
            </Link>
            <Link
              href="/league"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg border border-omega-green/40 bg-omega-green/10 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-green-200 backdrop-blur-sm transition-all hover:border-omega-green/80 hover:bg-omega-green/20 active:scale-95 sm:w-auto"
            >
              Ir a la liga
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Cinta-marcador de la liga (tipo HUD deportivo) */}
          <div className="mx-auto mt-10 flex max-w-2xl items-stretch divide-x divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-black/50 backdrop-blur-md md:mt-12">
            <ScoreCell value={totalTeams} label="equipos en liga" accent="text-omega-green" />
            <ScoreCell value={totalPlayers} label="bladers" accent="text-green-300" />
            <ScoreCell
              value={leader ? leader.wins * 3 : 0}
              label="pts del puntero"
              accent="text-omega-gold"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TABLA DE POSICIONES — la temporada como planilla deportiva.
          Con datos: planilla ancha (PJ/PG/PE/PP/Pts) + panel lateral.
          Sin datos: estado intencional con filas-fantasma + reglas.
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-white/[0.06] bg-black/40 py-14 backdrop-blur-sm md:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-14">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-omega-green/80">
                <span className="inline-flex items-center gap-2">
                  <ListOrdered className="size-3.5" />
                  Tabla de posiciones
                </span>
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight md:text-4xl lg:text-5xl">
                Cómo va la <span className="text-omega-green">temporada</span>
              </h2>
            </div>
            <Link
              href="/league"
              className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-omega-green transition-colors hover:text-green-300"
            >
              Tabla completa y fechas
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Layout a 2 columnas en desktop: planilla ancha + panel lateral. */}
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.8fr_1fr] lg:items-start">
            {/* ── Planilla deportiva (columna ancha) ── */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm">
              {/* Header de columnas — estilo planilla de fútbol */}
              <div className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem] gap-x-1 border-b border-white/10 bg-omega-green/[0.07] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-omega-muted md:px-4">
                <span className="text-center">#</span>
                <span>Equipo</span>
                <span className="text-center">PJ</span>
                <span className="text-center">PG</span>
                <span className="text-center">PE</span>
                <span className="text-center">PP</span>
                <span className="text-center">Pts</span>
              </div>

              {hasTeams ? (
                <>
                  {/* Filas reales — la planilla deportiva se deriva de wins/losses */}
                  {topTeams.map((team, idx) => (
                    <StandingRow key={team.name} team={team} pos={idx + 1} />
                  ))}
                  <Link
                    href="/league"
                    className="group flex items-center justify-center gap-2 bg-omega-green/[0.06] px-3 py-3 text-xs font-bold uppercase tracking-widest text-omega-green transition-colors hover:bg-omega-green/15"
                  >
                    Ver tabla completa y fechas
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </>
              ) : (
                // ── Estado vacío INTENCIONAL: así se va a ver la liga ──
                // No es un cartel gris: son filas-fantasma con la estructura real
                // de la planilla, para que se entienda cómo arranca la temporada.
                <EmptyStandings />
              )}
            </div>

            {/* ── Panel lateral (aprovecha el ancho en desktop) ── */}
            <aside className="grid gap-4 lg:sticky lg:top-24">
              {/* Puntero de la liga — solo si hay datos */}
              {leader ? (
                <div className="rounded-xl border border-omega-gold/25 bg-omega-gold/[0.06] p-5 backdrop-blur-sm">
                  <p className="mb-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-omega-gold">
                    <Crown className="size-3.5" /> Puntero de la liga
                  </p>
                  <div className="flex items-center gap-3">
                    <TeamLogo logo={leader.logo_url} size="lg" tone="gold" />
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-white">{leader.name}</p>
                      <p className="mt-0.5 text-xs text-omega-muted">
                        {leader.wins}G · {leader.losses}P
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniStat value={leader.wins * 3} label="Puntos" className="text-omega-gold" />
                    <MiniStat value={leader.wins} label="Victorias" className="text-omega-green" />
                  </div>
                </div>
              ) : (
                // Sin puntero todavía: invitación a abrir la temporada
                <div className="rounded-xl border border-omega-green/25 bg-omega-green/[0.05] p-5 text-center backdrop-blur-sm">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-omega-green/25 bg-omega-green/10">
                    <Trophy className="size-7 text-omega-green/80" />
                  </div>
                  <p className="mt-4 text-sm font-black uppercase tracking-wide text-white">
                    El primer puntero te espera
                  </p>
                  <p className="mx-auto mt-2 max-w-[230px] text-xs leading-relaxed text-omega-muted">
                    El primer equipo en ganar su fecha arranca arriba de todo. Inscribite y
                    quedate con la cima desde la jornada uno.
                  </p>
                </div>
              )}

              {/* Reglas reales de la liga — presentes siempre */}
              <div className="rounded-xl border border-white/10 bg-black/50 p-5 backdrop-blur-sm">
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-omega-green">
                  Reglas de la liga
                </p>
                <ul className="flex flex-col gap-3">
                  <RuleItem icon={Users} text="Equipos de varios bladers por escuadra" />
                  <RuleItem icon={Trophy} text="Cada victoria suma 3 puntos a la tabla" />
                  <RuleItem icon={Swords} text="Combates al mejor de 3 por enfrentamiento" />
                  <RuleItem icon={CalendarDays} text="Una fecha por semana, todos contra todos" />
                </ul>
              </div>

              {/* CTA secundaria del panel — solo tiene sentido si está vacía */}
              {!hasTeams && (
                <Link
                  href="/auth/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg border border-omega-green/60 bg-gradient-to-r from-omega-green to-emerald-500 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_25px_rgba(46,213,115,0.4)] transition-all hover:shadow-[0_0_45px_rgba(46,213,115,0.65)] active:scale-95"
                >
                  <Users className="size-5" />
                  Inscribir mi equipo
                </Link>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-componentes presentacionales
// ──────────────────────────────────────────────────────────────────────────

// Miembro de una escuadra: la ruta del PNG del blader.
interface SquadMember {
  src: string;
}

// ── Escuadra del hero: una FILA de bladers escalonados (foto de plantel) ──
// La clave para que NO se amontone: cada blader ocupa su propia celda en un
// flex con separación horizontal real (gap) y todos apoyan en la misma base
// (items-end). El del centro va un poco más grande/adelante y los laterales
// levemente más chicos y elevados → profundidad de equipo sin encimar.
// Cada contenedor `fill` lleva altura explícita (si no, Next avisa height 0).
function LigaSquad({
  label,
  align,
  members,
}: {
  label: string;
  align: "left" | "right";
  members: SquadMember[];
}) {
  const isLeft = align === "left";
  // El blader del medio es el "capitán": más grande y delante.
  const captainIdx = Math.floor(members.length / 2);

  return (
    <div className={`flex flex-col ${isLeft ? "items-center md:items-end" : "items-center md:items-start"}`}>
      <div className="relative">
        {/* Halo verde detrás de toda la escuadra */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-1/2 -z-10 h-2/3 w-[92%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(46,213,115,0.2),_transparent_70%)] blur-3xl"
        />
        {/* Fila de bladers — separados y alineados al piso (los 3 entran enteros) */}
        <div className="flex items-end justify-center gap-3 sm:gap-4 md:gap-6">
          {members.map((m, i) => {
            const isCaptain = i === captainIdx;
            // El capitán es más alto y se adelanta (z-10, sin bajar);
            // los laterales un poco más chicos y elevados (profundidad).
            const sizing = isCaptain
              ? "h-[200px] w-[112px] sm:h-[230px] sm:w-[130px] md:h-[280px] md:w-[160px] lg:h-[330px] lg:w-[188px] z-10"
              : "h-[160px] w-[92px] sm:h-[185px] sm:w-[106px] md:h-[225px] md:w-[128px] lg:h-[270px] lg:w-[152px] mb-2 md:mb-3 z-0";
            // Espejamos a los miembros de la escuadra visitante para que
            // "miren" hacia el centro (hacia el VS).
            const flip = isLeft ? "" : "scale-x-[-1]";
            return (
              <div key={m.src} className={`relative ${sizing} ${flip}`}>
                <Image
                  src={m.src}
                  alt={`Blader de ${label}`}
                  fill
                  sizes="(max-width: 768px) 145px, 200px"
                  className="object-contain object-bottom drop-shadow-[0_14px_24px_rgba(0,0,0,0.6)]"
                  priority
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Placa de equipo — debajo de la escuadra */}
      <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-omega-green/40 bg-black/60 px-3 py-1.5 backdrop-blur-sm">
        <Shield className="size-4 text-omega-green" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{label}</span>
        <span className="text-[10px] font-bold text-omega-green/80">· {members.length} bladers</span>
      </div>
    </div>
  );
}

// Celda del marcador HUD del hero.
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

// Fila real de la planilla deportiva. PE queda en 0 (los datos no traen empates).
function StandingRow({ team, pos }: { team: TopTeam; pos: number }) {
  const played = team.wins + team.losses;
  const points = team.wins * 3;
  const isTop = pos <= 3;
  const posColor =
    pos === 1
      ? "text-omega-gold"
      : pos === 2
        ? "text-[#C0C0C0]"
        : pos === 3
          ? "text-[#CD7F32]"
          : "text-omega-muted";

  return (
    <div
      className={`grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem] items-center gap-x-1 border-b border-white/[0.06] px-3 py-3 transition-colors last:border-b-0 hover:bg-white/[0.04] md:px-4 ${
        isTop ? "bg-omega-green/[0.05]" : ""
      }`}
    >
      <span className={`text-center text-sm font-black ${posColor}`}>{pos}</span>
      <div className="flex min-w-0 items-center gap-2.5">
        <TeamLogo logo={team.logo_url} size="sm" />
        <span className="truncate text-sm font-bold text-white">{team.name}</span>
      </div>
      <span className="text-center text-xs text-omega-muted">{played}</span>
      <span className="text-center text-xs font-bold text-omega-green">{team.wins}</span>
      <span className="text-center text-xs text-omega-muted">0</span>
      <span className="text-center text-xs font-bold text-omega-red">{team.losses}</span>
      <span className={`text-center text-sm font-black ${pos === 1 ? "text-omega-gold" : "text-white"}`}>
        {points}
      </span>
    </div>
  );
}

// Estado vacío INTENCIONAL: filas-fantasma con la estructura real de la planilla.
// Comunica "la temporada arranca cuando se inscriban los equipos" mostrando el
// formato, en vez de un cartel gris de "tabla vacía".
function EmptyStandings() {
  // Posiciones-fantasma que se irán llenando con cada inscripción.
  const ghosts = [1, 2, 3, 4, 5] as const;
  return (
    <div className="relative">
      {ghosts.map((pos) => (
        <div
          key={pos}
          className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem] items-center gap-x-1 border-b border-white/[0.05] px-3 py-3.5 last:border-b-0 md:px-4"
        >
          <span className="text-center text-sm font-black text-omega-muted/40">{pos}</span>
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] md:size-8">
              <Shield className="size-3.5 text-white/15" />
            </div>
            {/* Barra-placeholder del nombre del equipo, ancho variable. */}
            <span
              className="h-3 rounded-full bg-white/[0.06]"
              style={{ width: `${52 - pos * 6}%` }}
            />
          </div>
          {["—", "—", "—", "—", "—"].map((dash, i) => (
            <span key={i} className="text-center text-xs text-white/15">
              {dash}
            </span>
          ))}
        </div>
      ))}

      {/* Sobreimpreso central: el mensaje intencional de "temporada por arrancar". */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-black/40 to-black/60">
        <div className="pointer-events-auto mx-4 flex max-w-md flex-col items-center rounded-2xl border border-omega-green/30 bg-black/80 px-6 py-6 text-center backdrop-blur-md">
          <div className="flex size-12 items-center justify-center rounded-xl border border-omega-green/30 bg-omega-green/10">
            <CalendarDays className="size-6 text-omega-green" />
          </div>
          <h3 className="mt-3 text-base font-black uppercase tracking-tight text-white md:text-lg">
            La temporada arranca con los equipos
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-omega-muted md:text-sm">
            Todavía no hay escuadras inscriptas. Apenas se sumen, estas posiciones se llenan
            jornada a jornada con sus puntos, victorias y derrotas.
          </p>
        </div>
      </div>
    </div>
  );
}

// Logo del equipo con fallback al escudo genérico. `logo_url` puede ser null.
function TeamLogo({
  logo,
  size,
  tone = "green",
}: {
  logo: string | null;
  size: "sm" | "lg";
  tone?: "green" | "gold";
}) {
  const box =
    size === "lg"
      ? "size-14 rounded-full shadow-[0_0_20px_rgba(46,213,115,0.15)]"
      : "size-7 rounded-full md:size-8";
  const border = tone === "gold" ? "border-omega-gold/30" : "border-white/15";
  const icon = tone === "gold" ? "text-omega-gold" : "text-omega-green";
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border bg-black/50 ${box} ${border}`}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo dinámico de equipo
        <img src={logo} alt="" className="size-full object-cover" />
      ) : (
        <Shield className={`${size === "lg" ? "size-7" : "size-3.5"} ${icon}`} />
      )}
    </div>
  );
}

// Stat compacto del panel del puntero.
function MiniStat({
  value,
  label,
  className = "",
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-center">
      <p className={`text-lg font-black leading-none ${className}`}>{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-omega-muted">{label}</p>
    </div>
  );
}

// Ítem de la lista de reglas reales de la liga.
function RuleItem({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3 text-sm text-white/90">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-omega-green/20 bg-omega-green/10">
        <Icon className="size-3.5 text-omega-green" />
      </span>
      {text}
    </li>
  );
}
