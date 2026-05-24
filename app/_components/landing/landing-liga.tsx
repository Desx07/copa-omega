import Link from "next/link";
import {
  Shield,
  Trophy,
  Users,
  ArrowRight,
  Swords,
  CalendarDays,
  Crown,
  Flame,
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
// Landing de la Liga por equipos.
// Identidad deportiva: la TABLA DE POSICIONES manda. Cabecera de temporada,
// planilla estilo fútbol (PJ/PG/PE/PP/Pts) y banda de enfrentamientos.
//
// LAYOUT DESKTOP (1280px+): hero a 2 columnas (afiche + tablero de marcador),
// y la tabla de posiciones a 2 columnas (planilla ancha + panel lateral con
// puntero, próxima fecha y reglas). En mobile todo colapsa a una sola columna.
// ──────────────────────────────────────────────────────────────────────────
export function LandingLiga({ totalTeams, totalPlayers, topTeams }: LandingLigaProps) {
  // El líder de la tabla es el equipo destacado de la temporada.
  const leader = topTeams.length > 0 ? topTeams[0] : null;

  // Enfrentamiento destacado para la banda de fixture: 1° vs 2°.
  const featuredMatch =
    topTeams.length >= 2 ? { home: topTeams[0], away: topTeams[1] } : null;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          CABECERA DE TEMPORADA — hero a 2 columnas en desktop.
          Izquierda: afiche de liga (título, copy, CTAs).
          Derecha: tablero de marcador (stats + duelo de la cima).
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-omega-border/30 overflow-hidden">
        {/* Fondo cancha: gradiente verde + líneas como césped iluminado */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_75%_10%,_rgba(46,213,115,0.16)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(90deg,transparent,transparent_78px,rgba(46,213,115,0.5)_78px,rgba(46,213,115,0.5)_80px)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 pt-12 pb-12 md:pt-16 md:pb-16 lg:pt-20 lg:pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
            {/* ── Columna izquierda: afiche de liga ── */}
            <div>
              {/* Badge de temporada en juego */}
              <div className="inline-flex items-center gap-2 rounded-md border border-omega-green/30 bg-omega-green/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-omega-green mb-6">
                <span className="size-2 rounded-full bg-omega-green animate-pulse" />
                Temporada 2026 — En juego
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-omega-green to-omega-blue shadow-[0_0_30px_rgba(46,213,115,0.4)]">
                  <Shield className="size-6 text-white" />
                </span>
                <span className="text-xs uppercase tracking-[0.3em] text-omega-muted font-bold">
                  Beyblade X · Santa Fe
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase leading-[0.95] tracking-tight">
                Liga de{" "}
                <span
                  className="bg-gradient-to-r from-green-300 via-emerald-400 to-omega-blue bg-clip-text text-transparent"
                  style={{ textShadow: "0 0 40px rgba(46,213,115,0.35)" }}
                >
                  Equipos
                </span>
              </h1>

              <p className="mt-4 max-w-lg text-base md:text-lg text-omega-muted leading-relaxed">
                Tu escuadra contra todas. Jornada a jornada, 3 puntos por victoria,
                una sola tabla que define al campeón.
              </p>

              {/* CTAs */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-white bg-gradient-to-r from-omega-green to-omega-blue rounded-lg shadow-[0_0_30px_rgba(46,213,115,0.35)] hover:shadow-[0_0_50px_rgba(46,213,115,0.55)] transition-all active:scale-95"
                >
                  <Users className="size-4" />
                  Inscribir mi equipo
                </Link>
                <Link
                  href="/league"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-omega-muted border border-omega-border/50 rounded-lg hover:text-omega-text hover:border-omega-green/50 hover:bg-omega-green/5 transition-all"
                >
                  Ir a la liga
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              {/* Stats en línea — refuerzan el ancho de la columna */}
              <div className="mt-8 flex items-center gap-6 sm:gap-10">
                <HeroStat value={totalTeams} label="Equipos" />
                <div className="h-10 w-px bg-gradient-to-b from-transparent via-omega-border/60 to-transparent" />
                <HeroStat value={totalPlayers} label="Bladers" />
                <div className="h-10 w-px bg-gradient-to-b from-transparent via-omega-border/60 to-transparent" />
                <HeroStat
                  value={leader ? leader.wins * 3 : 0}
                  label="Pts del puntero"
                  accent
                />
              </div>
            </div>

            {/* ── Columna derecha: tablero de marcador ── */}
            <div className="relative">
              {/* Glow detrás del panel */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-omega-green/10 via-transparent to-omega-blue/10 blur-2xl" />

              <div className="relative omega-card-elevated p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-omega-green font-black flex items-center gap-2">
                    <Trophy className="size-3.5" /> Tablero de la fecha
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-omega-muted">
                    Jornada en curso
                  </span>
                </div>

                {featuredMatch ? (
                  <>
                    {/* Duelo de la cima — escudo vs escudo */}
                    <p className="text-[10px] uppercase tracking-[0.25em] text-omega-muted font-bold mb-3 flex items-center gap-1.5">
                      <Swords className="size-3" /> Duelo de la cima
                    </p>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-omega-border/30 bg-omega-dark/50 px-4 py-5">
                      <FixtureSide team={featuredMatch.home} align="end" />
                      <div className="flex flex-col items-center gap-1 shrink-0 px-1">
                        <span className="text-2xl md:text-3xl font-black italic text-omega-red leading-none">
                          VS
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-omega-muted">
                          Próx. fecha
                        </span>
                      </div>
                      <FixtureSide team={featuredMatch.away} align="start" />
                    </div>

                    {/* Mini puntero destacado */}
                    {leader && (
                      <div className="mt-4 flex items-center gap-3 rounded-xl border border-omega-gold/25 bg-omega-gold/5 px-4 py-3">
                        <Crown className="size-5 text-omega-gold shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-omega-muted leading-none">
                            Puntero de la liga
                          </p>
                          <p className="text-sm font-black text-omega-gold truncate mt-0.5">
                            {leader.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-omega-gold leading-none">
                            {leader.wins * 3}
                          </p>
                          <p className="text-[9px] uppercase tracking-wider text-omega-muted">
                            pts
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Sin enfrentamiento aún: invitación a arrancar la temporada
                  <div className="flex flex-col items-center text-center gap-3 py-8">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-omega-green/20 bg-omega-green/5">
                      <Shield className="size-7 text-omega-green/70" />
                    </div>
                    <p className="text-sm font-bold text-omega-text">
                      La temporada todavía no arrancó
                    </p>
                    <p className="text-xs text-omega-muted max-w-[220px]">
                      En cuanto se inscriban los equipos, acá vas a ver el duelo de la cima.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TABLA DE POSICIONES — a 2 columnas en desktop.
          Izquierda: planilla estilo fútbol (ancha).
          Derecha: panel sticky con puntero, próxima fecha y reglas.
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 md:px-8 py-12 md:py-16 section-bg-leaderboard">
        <div className="mx-auto max-w-6xl">
          {/* Encabezado de sección */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-omega-green font-bold mb-1">
                Tabla de posiciones
              </p>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                Cómo va la liga
              </h2>
            </div>
            <Link
              href="/league"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-omega-green hover:text-omega-blue transition-colors group"
            >
              Tabla completa y fechas
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {topTeams.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-start">
              {/* ── Planilla (columna ancha) ── */}
              <div className="omega-card overflow-hidden">
                {/* Header de columnas — igual a la planilla real de /league */}
                <div className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem] gap-x-1 px-3 md:px-4 py-2.5 bg-omega-dark/60 border-b border-omega-border/30 text-[10px] font-bold text-omega-muted uppercase tracking-wider">
                  <span className="text-center">#</span>
                  <span>Equipo</span>
                  <span className="text-center">PJ</span>
                  <span className="text-center">PG</span>
                  <span className="text-center">PE</span>
                  <span className="text-center">PP</span>
                  <span className="text-center">Pts</span>
                </div>

                {/* Filas — derivamos la planilla deportiva desde wins/losses */}
                {topTeams.map((team, idx) => {
                  const pos = idx + 1;
                  const played = team.wins + team.losses; // PE = 0 (no hay empates en datos)
                  const points = team.wins * 3;
                  const isTop = pos <= 3;

                  return (
                    <div
                      key={team.name}
                      className={`grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem] gap-x-1 items-center px-3 md:px-4 py-3 border-b border-omega-border/10 last:border-b-0 transition-colors hover:bg-omega-surface/50 ${
                        isTop ? "bg-omega-green/5" : ""
                      }`}
                    >
                      {/* Posición con color de podio */}
                      <span
                        className={`text-center text-sm font-black ${
                          pos === 1
                            ? "text-omega-gold"
                            : pos === 2
                              ? "text-[#C0C0C0]"
                              : pos === 3
                                ? "text-[#CD7F32]"
                                : "text-omega-muted"
                        }`}
                      >
                        {pos}
                      </span>

                      {/* Escudo + nombre */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-7 md:size-8 rounded-lg border border-omega-border/40 bg-omega-dark flex items-center justify-center overflow-hidden shrink-0">
                          {team.logo_url ? (
                            // Logo del equipo con fallback al escudo genérico
                            <img
                              src={team.logo_url}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <Shield className="size-3.5 text-omega-green" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-omega-text truncate">
                          {team.name}
                        </span>
                      </div>

                      <span className="text-center text-xs text-omega-muted">{played}</span>
                      <span className="text-center text-xs font-bold text-omega-green">{team.wins}</span>
                      <span className="text-center text-xs text-omega-muted">0</span>
                      <span className="text-center text-xs font-bold text-omega-red">{team.losses}</span>
                      <span
                        className={`text-center text-sm font-black ${
                          pos === 1 ? "text-omega-gold" : "text-omega-text"
                        }`}
                      >
                        {points}
                      </span>
                    </div>
                  );
                })}

                {/* Pie de planilla — acceso a la tabla completa */}
                <Link
                  href="/league"
                  className="flex items-center justify-center gap-2 px-3 py-3 bg-omega-dark/40 text-xs font-bold text-omega-green hover:bg-omega-dark/70 transition-colors group"
                >
                  Ver tabla completa y fechas
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* ── Panel lateral (aprovecha el ancho en desktop) ── */}
              <aside className="grid gap-4 lg:sticky lg:top-24">
                {/* Líder de la temporada */}
                {leader && (
                  <div className="omega-card p-5">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-omega-gold font-black flex items-center gap-1.5 mb-4">
                      <Crown className="size-3.5" /> Líder de la temporada
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="size-14 rounded-xl border border-omega-gold/30 bg-omega-dark flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_20px_rgba(255,214,10,0.15)]">
                        {leader.logo_url ? (
                          <img src={leader.logo_url} alt="" className="size-full object-cover" />
                        ) : (
                          <Shield className="size-7 text-omega-gold" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-black text-omega-text truncate">
                          {leader.name}
                        </p>
                        <p className="text-xs text-omega-muted mt-0.5">
                          {leader.wins}G · {leader.losses}P
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniStat
                        value={leader.wins * 3}
                        label="Puntos"
                        className="text-omega-gold"
                      />
                      <MiniStat
                        value={leader.wins}
                        label="Victorias"
                        className="text-omega-green"
                      />
                    </div>
                  </div>
                )}

                {/* Próxima fecha — duelo de la cima */}
                {featuredMatch && (
                  <div className="omega-card p-5">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-omega-green font-black flex items-center gap-1.5 mb-4">
                      <Flame className="size-3.5" /> Próxima fecha
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <FixtureSide team={featuredMatch.home} align="end" />
                      <span className="text-xl font-black italic text-omega-red shrink-0 px-1">
                        VS
                      </span>
                      <FixtureSide team={featuredMatch.away} align="start" />
                    </div>
                  </div>
                )}

                {/* Reglas — formato planilla */}
                <div className="omega-card p-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-omega-blue font-black mb-4">
                    Reglas de la liga
                  </p>
                  <ul className="flex flex-col gap-3">
                    <LegendItem icon={Trophy} text="Victoria = 3 puntos" />
                    <LegendItem icon={Swords} text="Combates al mejor de 3" />
                    <LegendItem icon={CalendarDays} text="Una fecha por semana" />
                  </ul>
                </div>
              </aside>
            </div>
          ) : (
            // Estado vacío deportivo — "todavía no arrancó la temporada"
            <div className="omega-card flex flex-col items-center text-center gap-4 px-6 py-14 md:py-20">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-omega-green/20 bg-omega-green/5">
                <Shield className="size-8 text-omega-green/70" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">
                  La tabla está vacía
                </h3>
                <p className="mt-2 text-sm text-omega-muted max-w-sm">
                  Todavía no hay equipos en la liga. Inscribí tu escuadra y arrancá
                  la temporada en lo más alto.
                </p>
              </div>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-wide text-white bg-gradient-to-r from-omega-green to-omega-blue rounded-lg shadow-[0_0_25px_rgba(46,213,115,0.3)] hover:shadow-[0_0_40px_rgba(46,213,115,0.5)] transition-all active:scale-95"
              >
                <Users className="size-4" />
                Inscribir mi equipo
              </Link>

              {/* Reglas también visibles en vacío — refuerzan identidad */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-omega-muted">
                <LegendItem icon={Trophy} text="Victoria = 3 pts" inline />
                <LegendItem icon={Swords} text="Combates al mejor de 3" inline />
                <LegendItem icon={CalendarDays} text="Una fecha por semana" inline />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-componentes presentacionales
// ──────────────────────────────────────────────────────────────────────────

// Stat del hero (columna izquierda del marcador).
function HeroStat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-2xl md:text-3xl font-black leading-none ${
          accent ? "text-omega-gold" : "text-omega-text"
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-[0.2em] text-omega-muted mt-1.5">
        {label}
      </p>
    </div>
  );
}

// Stat compacto dentro del panel del líder.
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
    <div className="rounded-lg border border-omega-border/30 bg-omega-dark/40 px-3 py-2.5 text-center">
      <p className={`text-lg font-black leading-none ${className}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-[0.2em] text-omega-muted mt-1">
        {label}
      </p>
    </div>
  );
}

// Un lado del enfrentamiento destacado (local o visitante).
function FixtureSide({ team, align }: { team: TopTeam; align: "start" | "end" }) {
  const isEnd = align === "end";
  return (
    <div
      className={`flex flex-1 items-center gap-2.5 min-w-0 ${
        isEnd ? "flex-row-reverse text-right justify-start" : "text-left"
      }`}
    >
      <div className="size-11 md:size-12 rounded-xl border border-omega-border/40 bg-omega-dark flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_20px_rgba(46,213,115,0.15)]">
        {team.logo_url ? (
          <img src={team.logo_url} alt="" className="size-full object-cover" />
        ) : (
          <Shield className="size-5 md:size-6 text-omega-green" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black text-omega-text truncate">{team.name}</p>
        <p className="text-[11px] text-omega-muted">
          {team.wins}G · {team.losses}P
        </p>
      </div>
    </div>
  );
}

// Ítem de la leyenda de reglas. `inline` lo usa el estado vacío (fila horizontal).
function LegendItem({
  icon: Icon,
  text,
  inline,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Icon className="size-3.5 text-omega-green/70" />
        {text}
      </span>
    );
  }
  return (
    <li className="flex items-center gap-3 text-sm text-omega-text">
      <span className="flex size-7 items-center justify-center rounded-lg bg-omega-green/10 border border-omega-green/20 shrink-0">
        <Icon className="size-3.5 text-omega-green" />
      </span>
      {text}
    </li>
  );
}
