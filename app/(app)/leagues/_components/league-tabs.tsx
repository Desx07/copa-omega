"use client";

import { useState } from "react";
import {
  Trophy,
  History,
  ScrollText,
  ChevronUp,
  ChevronDown,
  Minus,
  Star,
  Crown,
  Shield,
  Gem,
  Zap,
  ShieldHalf,
  Users,
} from "lucide-react";

interface StandingPlayer {
  id: string;
  position: number;
  wins: number;
  losses: number;
  games_played: number;
  promotion_points: number;
  player: {
    id: string;
    alias: string;
    avatar_url: string | null;
    stars: number;
    wins: number;
    losses: number;
  };
  league: {
    id: string;
    name: string;
    tier: number;
    color: string;
    icon: string;
  };
}

interface HistoryEntry {
  id: string;
  reason: string;
  changed_at: string;
  from_league: { id: string; name: string; tier: number; color: string } | null;
  to_league: { id: string; name: string; tier: number; color: string };
  season: { id: string; name: string; number: number } | null;
}

interface League {
  id: string;
  name: string;
  tier: number;
  color: string;
  icon: string;
  min_stars: number;
  max_stars: number | null;
  max_players: number;
  member_count: number;
  is_current: boolean;
}

interface LeagueTabsProps {
  standings: StandingPlayer[];
  history: HistoryEntry[];
  currentPlayerId: string;
  currentLeague: League | null;
}

type Tab = "standings" | "history" | "rules";

const LEAGUE_ICONS: Record<string, React.ReactNode> = {
  shield: <Shield className="size-4" />,
  "shield-half": <ShieldHalf className="size-4" />,
  crown: <Crown className="size-4" />,
  gem: <Gem className="size-4" />,
  zap: <Zap className="size-4" />,
};

export default function LeagueTabs({
  standings,
  history,
  currentPlayerId,
  currentLeague,
}: LeagueTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("standings");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "standings", label: "Clasificacion", icon: <Trophy className="size-4" /> },
    { key: "history", label: "Historial", icon: <History className="size-4" /> },
    { key: "rules", label: "Reglas", icon: <ScrollText className="size-4" /> },
  ];

  return (
    <div className="space-y-3">
      {/* Tab buttons */}
      <div className="flex gap-1 bg-omega-surface rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.key
                ? "bg-omega-card text-omega-text shadow-md"
                : "text-omega-muted hover:text-omega-text"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "standings" && (
        <StandingsTab
          standings={standings}
          currentPlayerId={currentPlayerId}
          currentLeague={currentLeague}
        />
      )}
      {activeTab === "history" && <HistoryTab history={history} />}
      {activeTab === "rules" && <RulesTab />}
    </div>
  );
}

// ═══════════════════════════════════════════
// STANDINGS TAB
// ═══════════════════════════════════════════

function StandingsTab({
  standings,
  currentPlayerId,
  currentLeague,
}: {
  standings: StandingPlayer[];
  currentPlayerId: string;
  currentLeague: League | null;
}) {
  if (!currentLeague || standings.length === 0) {
    return (
      <div className="omega-card p-8 text-center">
        <Users className="size-10 mx-auto text-omega-muted/40 mb-3" />
        <p className="text-omega-muted text-sm">
          No estas asignado a una liga todavia.
        </p>
        <p className="text-omega-muted/60 text-xs mt-1">
          El admin debe recalcular las ligas para asignarte.
        </p>
      </div>
    );
  }

  return (
    <div className="omega-card overflow-hidden">
      <div
        className="omega-section-header"
        style={{
          background: `linear-gradient(135deg, ${currentLeague.color}15, transparent)`,
          borderBottomColor: `${currentLeague.color}20`,
        }}
      >
        <div style={{ color: currentLeague.color }}>
          {LEAGUE_ICONS[currentLeague.icon] ?? <Shield className="size-4" />}
        </div>
        <span style={{ color: currentLeague.color }}>
          Liga {currentLeague.name}
        </span>
        <span className="text-omega-muted ml-auto text-[10px]">
          {standings.length} jugadores
        </span>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {standings.map((s, idx) => {
          const isMe = s.player?.id === currentPlayerId;
          const player = s.player as StandingPlayer["player"];
          const winRate =
            player.wins + player.losses > 0
              ? Math.round((player.wins / (player.wins + player.losses)) * 100)
              : 0;

          // Top 3 = zona de ascenso, bottom 3 = zona de descenso
          const isPromoZone = s.position <= 3;
          const isRelegationZone = s.position > standings.length - 3;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isMe ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
              }`}
            >
              {/* Posicion */}
              <div className="w-8 shrink-0 text-center">
                {s.position <= 3 ? (
                  <span
                    className="text-sm font-black"
                    style={{
                      color:
                        s.position === 1
                          ? "#FFD700"
                          : s.position === 2
                            ? "#C0C0C0"
                            : "#CD7F32",
                    }}
                  >
                    #{s.position}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-omega-muted">
                    #{s.position}
                  </span>
                )}
              </div>

              {/* Avatar + Nombre */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold truncate ${
                      isMe ? "text-omega-text" : "text-omega-text/80"
                    }`}
                  >
                    {player?.alias ?? "???"}
                  </span>
                  {isMe && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-omega-purple/20 text-omega-purple">
                      Tu
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-omega-muted">
                  {player?.wins ?? 0}V / {player?.losses ?? 0}D ({winRate}%)
                </p>
              </div>

              {/* Estrellas */}
              <div className="flex items-center gap-1 shrink-0">
                <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                <span className="text-sm font-bold">{player?.stars ?? 0}</span>
              </div>

              {/* Indicador de zona */}
              <div className="w-5 shrink-0 flex justify-center">
                {isPromoZone && currentLeague.tier < 5 && (
                  <ChevronUp className="size-4 text-omega-green" />
                )}
                {isRelegationZone && currentLeague.tier > 1 && (
                  <ChevronDown className="size-4 text-omega-red" />
                )}
                {!isPromoZone && !isRelegationZone && (
                  <Minus className="size-3 text-omega-muted/30" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-4 py-3 px-4 bg-omega-surface/50 text-[10px] text-omega-muted">
        {currentLeague.tier < 5 && (
          <span className="flex items-center gap-1">
            <ChevronUp className="size-3 text-omega-green" /> Zona ascenso
          </span>
        )}
        {currentLeague.tier > 1 && (
          <span className="flex items-center gap-1">
            <ChevronDown className="size-3 text-omega-red" /> Zona descenso
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════

function HistoryTab({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="omega-card p-8 text-center">
        <History className="size-10 mx-auto text-omega-muted/40 mb-3" />
        <p className="text-omega-muted text-sm">Sin historial de ligas.</p>
        <p className="text-omega-muted/60 text-xs mt-1">
          Tus ascensos y descensos aparecen aca.
        </p>
      </div>
    );
  }

  const reasonConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    promotion: { label: "Ascenso", color: "#2ed573", icon: <ChevronUp className="size-4" /> },
    relegation: { label: "Descenso", color: "#ff4757", icon: <ChevronDown className="size-4" /> },
    placement: { label: "Ubicacion", color: "#00b4d8", icon: <Minus className="size-4" /> },
  };

  return (
    <div className="omega-card overflow-hidden">
      <div className="omega-section-header">
        <History className="size-4" />
        Tu historial de ligas
      </div>
      <div className="divide-y divide-white/[0.04]">
        {history.map((entry) => {
          const config = reasonConfig[entry.reason] ?? reasonConfig.placement;
          const date = new Date(entry.changed_at);

          return (
            <div key={entry.id} className="px-4 py-3 flex items-center gap-3">
              <div
                className="flex items-center justify-center size-8 rounded-lg shrink-0"
                style={{
                  background: `${config.color}15`,
                  color: config.color,
                  border: `1px solid ${config.color}25`,
                }}
              >
                {config.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </span>
                  {entry.from_league && (
                    <span className="text-xs text-omega-muted">
                      <span style={{ color: entry.from_league.color }}>
                        {entry.from_league.name}
                      </span>
                      {" → "}
                      <span style={{ color: entry.to_league.color }}>
                        {entry.to_league.name}
                      </span>
                    </span>
                  )}
                  {!entry.from_league && (
                    <span className="text-xs text-omega-muted">
                      → <span style={{ color: entry.to_league.color }}>{entry.to_league.name}</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-omega-muted/60 mt-0.5">
                  {date.toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {entry.season && ` — Temporada ${entry.season.number}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// RULES TAB
// ═══════════════════════════════════════════

function RulesTab() {
  const rules = [
    {
      icon: <Star className="size-4 text-omega-gold" />,
      title: "Asignacion por estrellas",
      desc: "Tu liga se determina automaticamente segun tus estrellas. Gana batallas para subir.",
    },
    {
      icon: <ChevronUp className="size-4 text-omega-green" />,
      title: "Ascenso",
      desc: "Los TOP 3 de cada liga ascienden a la liga superior al final de cada mes.",
    },
    {
      icon: <ChevronDown className="size-4 text-omega-red" />,
      title: "Descenso",
      desc: "Los ultimos 3 de cada liga descienden a la liga inferior.",
    },
    {
      icon: <Crown className="size-4 text-omega-purple" />,
      title: "Liga Omega (exclusiva)",
      desc: "La elite. Torneo mensual exclusivo con los mejores premios. Solo los mas fuertes llegan aca.",
    },
    {
      icon: <Shield className="size-4 text-omega-blue" />,
      title: "Nuevos jugadores",
      desc: "Todos comienzan en Liga Bronce. Demuestra tu nivel y escala la torre.",
    },
    {
      icon: <Trophy className="size-4 text-omega-gold" />,
      title: "Puntos de promocion",
      desc: "Se acumulan con victorias dentro de tu liga. Ayudan a definir desempates en el ranking.",
    },
  ];

  return (
    <div className="omega-card overflow-hidden">
      <div className="omega-section-header">
        <ScrollText className="size-4" />
        Reglamento Copa Ascenso
      </div>
      <div className="divide-y divide-white/[0.04]">
        {rules.map((rule, i) => (
          <div key={i} className="px-4 py-3.5 flex gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-white/5 shrink-0">
              {rule.icon}
            </div>
            <div>
              <p className="text-sm font-bold">{rule.title}</p>
              <p className="text-xs text-omega-muted mt-0.5 leading-relaxed">{rule.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
