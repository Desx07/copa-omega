import Link from "next/link";
import { Swords, Ticket, Flame, Trophy } from "lucide-react";
import { RANKS, rankInfo, nextRank, type RankLetter } from "@/lib/ascenso";
import NotificationBell from "@/app/_components/notification-bell";

// ── Hero del dashboard en estética "Torneo de Ascenso" ──────────────────────
// Se usa cuando la modalidad DESTACADA es ascenso (modeConfig.featured).
// Comparte el lenguaje visual de landing-ascenso.tsx: fondo frío de combate,
// sello de rango hexagonal (hex-clip) y paleta cyan→ámbar. NO usa el hero
// púrpura/estrellas de Copa Omega.
//
// Los DATOS (ticketTarget por rango) salen de lib/ascenso — única fuente de
// verdad, nunca números inventados acá.

// Acentos hex por rango, calcados de landing-ascenso (frío en F, cálido en S).
const RANK_HEX: Record<RankLetter, string> = {
  F: "#7dd3fc",
  E: "#38bdf8",
  D: "#22d3ee",
  C: "#818cf8",
  B: "#c084fc",
  A: "#f472b6",
  S: "#fbbf24",
};

interface AscensoHeroProps {
  userId: string;
  alias: string;
  avatarUrl: string | null;
  badgeEmoji?: string;
  tagline?: string | null;
  wins: number;
  losses: number;
  rankPosition: number;
  totalPlayers: number;
  winRate: number;
  streak: number;
  rankLetter: RankLetter;
  ticketPoints: number;
}

export function AscensoHero({
  userId,
  alias,
  avatarUrl,
  badgeEmoji,
  tagline,
  wins,
  losses,
  rankPosition,
  totalPlayers,
  winRate,
  streak,
  rankLetter,
  ticketPoints,
}: AscensoHeroProps) {
  const info = rankInfo(rankLetter);
  const hex = RANK_HEX[rankLetter];
  const next = nextRank(rankLetter);
  const target = info.ticketTarget; // null en S
  const pct =
    target !== null ? Math.max(4, Math.min(100, Math.round((ticketPoints / target) * 100))) : 100;
  const ticketFull = target !== null && ticketPoints >= target;

  return (
    <div className="relative -mx-4 overflow-hidden rounded-b-[2rem] px-6 pt-6 pb-8">
      {/* ── Fondo de combate (frío, oscuro) — reemplaza los orbs púrpura ── */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#05070d]">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${hex}22, transparent 70%)`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_120%_at_50%_0%,_transparent_45%,_rgba(2,4,10,0.85)_100%)]" />
      </div>

      {/* Marquesina de combate + campana */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-cyan-400/60" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/90">
            Combate por el rango
          </p>
        </div>
        <NotificationBell userId={userId} />
      </div>

      {/* Identidad del blader + sello de rango hexagonal */}
      <div className="relative mt-3 flex items-center gap-4">
        <Link
          href="/profile"
          className="size-16 shrink-0 overflow-hidden rounded-full border-2 bg-omega-dark ring-4 ring-black/40"
          style={{ borderColor: `${hex}aa` }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={alias} className="size-full object-cover" />
          ) : (
            <div
              className="flex size-full items-center justify-center text-2xl font-black"
              style={{ color: hex }}
            >
              {alias.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-black text-white">
            {badgeEmoji && <span className="mr-1">{badgeEmoji}</span>}
            {alias}
          </p>
          {tagline && (
            <p className="truncate text-xs italic text-omega-muted/80">&ldquo;{tagline}&rdquo;</p>
          )}
        </div>

        {/* Sello hexagonal del rango (como la landing) */}
        <div className="shrink-0 text-center">
          <span
            className="hex-clip mx-auto flex size-14 items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${hex}, ${hex}99)`,
              boxShadow: `0 0 22px ${hex}80`,
            }}
          >
            <span className="text-2xl font-black text-black/85">{info.letter}</span>
          </span>
          <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-white/55">
            Rango
          </span>
        </div>
      </div>

      {/* Barra de ticket F→S */}
      <div className="relative mt-5">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-cyan-300/90">
            <Ticket className="size-3.5" style={{ color: hex }} />
            Ticket de ascenso
          </span>
          {target !== null ? (
            <span className="font-mono font-bold tabular-nums" style={{ color: hex }}>
              {ticketPoints}/{target} pts
            </span>
          ) : (
            <span className="font-mono font-bold uppercase text-amber-300">La cima · S</span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${hex}, #fbbf24)`,
              boxShadow: `0 0 12px ${hex}aa`,
            }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-omega-muted">
          <span>Rango {info.letter}</span>
          {next ? (
            ticketFull ? (
              <span className="font-bold text-amber-300">¡Ticket lleno! Combate de ascenso a {next}</span>
            ) : (
              <span>Próximo: {next}</span>
            )
          ) : (
            <span className="text-amber-300">Rango máximo</span>
          )}
        </div>
      </div>

      {/* Cinta-marcador (HUD) — combates y posición, paleta de combate */}
      <div className="relative mt-4 flex items-stretch divide-x divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm">
        {rankPosition > 0 && (
          <ScoreCell
            icon={<Trophy className="size-3.5 text-amber-300" />}
            value={`#${rankPosition}`}
            label={`de ${totalPlayers}`}
            accent="text-amber-300"
          />
        )}
        <ScoreCell value={`${wins}-${losses}`} label="V · D" accent="text-cyan-300" />
        {winRate > 0 && <ScoreCell value={`${winRate}%`} label="winrate" accent="text-cyan-300" />}
        {streak >= 2 && (
          <ScoreCell
            icon={<Flame className="size-3.5 text-amber-300" />}
            value={String(streak)}
            label="racha"
            accent="text-amber-300"
          />
        )}
      </div>

      {/* CTA de combate */}
      <div className="relative mt-5 flex justify-center">
        <Link
          href="/ascenso"
          className="group inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300/50 bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_24px_rgba(251,191,36,0.4)] transition-all hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] active:scale-95"
        >
          <Swords className="size-4" />
          Ir al torneo de ascenso
        </Link>
      </div>
    </div>
  );
}

function ScoreCell({
  value,
  label,
  accent = "text-white",
  icon,
}: {
  value: string;
  label: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex-1 px-3 py-2.5 text-center">
      <p className={`flex items-center justify-center gap-1 font-mono text-base font-black tabular-nums ${accent}`}>
        {icon}
        {value}
      </p>
      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-omega-muted">{label}</p>
    </div>
  );
}
