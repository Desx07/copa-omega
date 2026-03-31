import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Shield, Crown, Gem, Zap, ChevronUp, ChevronDown, Minus, Users, Star, Trophy, History, ScrollText, ShieldHalf } from "lucide-react";
import LeagueTabs from "./_components/league-tabs";

// Iconos por nombre de liga
const LEAGUE_ICONS: Record<string, React.ReactNode> = {
  "shield": <Shield className="size-6" />,
  "shield-half": <ShieldHalf className="size-6" />,
  "crown": <Crown className="size-6" />,
  "gem": <Gem className="size-6" />,
  "zap": <Zap className="size-6" />,
};

interface League {
  id: string;
  name: string;
  tier: number;
  min_stars: number;
  max_stars: number | null;
  max_players: number;
  color: string;
  icon: string;
  member_count: number;
  is_current: boolean;
}

interface UserMembership {
  league_id: string;
  position: number;
  wins: number;
  losses: number;
  games_played: number;
  promotion_points: number;
}

interface StandingPlayer {
  id: string;
  position: number;
  wins: number;
  losses: number;
  games_played: number;
  promotion_points: number;
  player: { id: string; alias: string; avatar_url: string | null; stars: number; wins: number; losses: number };
  league: { id: string; name: string; tier: number; color: string; icon: string };
}

interface HistoryEntry {
  id: string;
  reason: string;
  changed_at: string;
  from_league: { id: string; name: string; tier: number; color: string } | null;
  to_league: { id: string; name: string; tier: number; color: string };
  season: { id: string; name: string; number: number } | null;
}

export default async function LeaguesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Obtener player actual
  const { data: currentPlayer } = await supabase
    .from("players")
    .select("id, alias, stars, avatar_url")
    .eq("id", user.id)
    .single();

  // Obtener todas las ligas
  const { data: leaguesRaw } = await supabase
    .from("leagues")
    .select("*")
    .order("tier", { ascending: true });

  // Obtener season activa
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "active")
    .maybeSingle();

  const seasonId = activeSeason?.id ?? null;

  // Obtener memberships de la season para conteo
  const { data: allMemberships } = await supabase
    .from("league_memberships")
    .select("league_id, player_id")
    .eq("season_id", seasonId ?? "");

  const memberCounts: Record<string, number> = {};
  for (const m of allMemberships ?? []) {
    memberCounts[m.league_id] = (memberCounts[m.league_id] ?? 0) + 1;
  }

  // Membership del usuario
  const { data: userMembership } = await supabase
    .from("league_memberships")
    .select("league_id, position, wins, losses, games_played, promotion_points")
    .eq("player_id", user.id)
    .eq("season_id", seasonId ?? "")
    .maybeSingle();

  // Construir ligas con conteo
  const leagues: League[] = (leaguesRaw ?? []).map((l) => ({
    ...l,
    member_count: memberCounts[l.id] ?? 0,
    is_current: userMembership?.league_id === l.id,
  }));

  // Obtener standings de la liga del usuario (si tiene)
  let myLeagueStandings: StandingPlayer[] = [];
  if (userMembership?.league_id && seasonId) {
    const { data: standings } = await supabase
      .from("league_memberships")
      .select(
        "id, position, games_played, wins, losses, promotion_points, joined_at, player:players!player_id(id, alias, avatar_url, stars, wins, losses), league:leagues!league_id(id, name, tier, color, icon)"
      )
      .eq("season_id", seasonId)
      .eq("league_id", userMembership.league_id)
      .order("position", { ascending: true });

    myLeagueStandings = (standings ?? []) as unknown as StandingPlayer[];
  }

  // Historial del jugador
  const { data: historyRaw } = await supabase
    .from("league_history")
    .select(
      "id, reason, changed_at, from_league:leagues!from_league(id, name, tier, color), to_league:leagues!to_league(id, name, tier, color), season:seasons!season_id(id, name, number)"
    )
    .eq("player_id", user.id)
    .order("changed_at", { ascending: false })
    .limit(20);

  const history = (historyRaw ?? []) as unknown as HistoryEntry[];

  // Liga actual del usuario
  const currentLeague = leagues.find((l) => l.is_current);
  // Total de jugadores en la liga del usuario
  const totalInLeague = currentLeague?.member_count ?? 0;

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-6 px-1">
        <Link href="/dashboard" className="omega-btn omega-btn-secondary p-2 rounded-lg">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Copa Ascenso</h1>
          <p className="text-xs text-omega-muted">Sistema de ligas competitivo</p>
        </div>
      </div>

      {/* Tu Liga Actual — Destacado */}
      {currentLeague && userMembership && (
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${currentLeague.color}20, ${currentLeague.color}08)`,
            border: `1px solid ${currentLeague.color}40`,
            boxShadow: `0 0 40px ${currentLeague.color}15, 0 0 80px ${currentLeague.color}08`,
          }}
        >
          {/* Glow orb decorativo */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] pointer-events-none"
            style={{ background: `${currentLeague.color}25` }}
          />
          <div className="relative flex items-center gap-4">
            <div
              className="flex items-center justify-center size-14 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${currentLeague.color}30, ${currentLeague.color}10)`,
                border: `1px solid ${currentLeague.color}50`,
                color: currentLeague.color,
              }}
            >
              {LEAGUE_ICONS[currentLeague.icon] ?? <Shield className="size-6" />}
            </div>
            <div className="flex-1">
              <p className="text-xs text-omega-muted uppercase tracking-wider font-bold">Tu liga</p>
              <p className="text-xl font-black" style={{ color: currentLeague.color }}>
                Liga {currentLeague.name}
              </p>
              <p className="text-sm text-omega-muted">
                Posicion #{userMembership.position} de {totalInLeague}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: currentLeague.color }}>
                {currentPlayer?.stars ?? 0}
              </p>
              <p className="text-[10px] text-omega-muted uppercase tracking-wider">estrellas</p>
            </div>
          </div>

          {/* Stats rapidos */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-omega-green">{userMembership.wins}</p>
              <p className="text-[10px] text-omega-muted uppercase">Victorias</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-omega-red">{userMembership.losses}</p>
              <p className="text-[10px] text-omega-muted uppercase">Derrotas</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <p className="text-lg font-bold text-omega-gold">{userMembership.promotion_points}</p>
              <p className="text-[10px] text-omega-muted uppercase">Pts. Promo</p>
            </div>
          </div>
        </div>
      )}

      {/* Torre de Ligas (piramide) — Omega arriba, Bronce abajo */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider px-1 flex items-center gap-2">
          <Trophy className="size-4" />
          Torre de Ligas
        </h2>
        <div className="space-y-1.5">
          {[...leagues].reverse().map((league, idx) => {
            const isOmega = league.tier === 5;
            const isCurrent = league.is_current;
            const widthPercent = 60 + league.tier * 8; // Omega = 100%, Bronce = 68%

            return (
              <div
                key={league.id}
                className="mx-auto transition-all duration-300"
                style={{ width: `${widthPercent}%` }}
              >
                <div
                  className={`relative overflow-hidden rounded-xl p-3.5 transition-all duration-300 ${
                    isCurrent ? "scale-[1.02]" : ""
                  }`}
                  style={{
                    background: isCurrent
                      ? `linear-gradient(135deg, ${league.color}25, ${league.color}10)`
                      : isOmega
                        ? `linear-gradient(135deg, ${league.color}18, ${league.color}08)`
                        : "var(--color-omega-card)",
                    border: `1px solid ${isCurrent ? league.color + "60" : league.color + "25"}`,
                    boxShadow: isCurrent
                      ? `0 0 25px ${league.color}20, 0 0 50px ${league.color}10, 0 0 0 2px ${league.color}80`
                      : isOmega
                        ? `0 0 30px ${league.color}15`
                        : "none",
                  }}
                >
                  {/* Omega tiene glow extra */}
                  {isOmega && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse at center, ${league.color}12 0%, transparent 70%)`,
                      }}
                    />
                  )}

                  <div className="relative flex items-center gap-3">
                    <div
                      className="flex items-center justify-center size-10 rounded-lg shrink-0"
                      style={{
                        background: `${league.color}20`,
                        color: league.color,
                        border: `1px solid ${league.color}30`,
                      }}
                    >
                      {LEAGUE_ICONS[league.icon] ?? <Shield className="size-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-black text-sm"
                          style={{ color: league.color }}
                        >
                          {league.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-omega-text">
                            Tu liga
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-omega-muted">
                        {league.min_stars}{league.max_stars ? `–${league.max_stars}` : "+"} estrellas
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-omega-muted">
                        <Users className="size-3" />
                        <span className="text-xs font-bold">{league.member_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs: Standings + Historial + Reglas */}
      <LeagueTabs
        standings={myLeagueStandings}
        history={history}
        currentPlayerId={user.id}
        currentLeague={currentLeague ?? null}
      />
    </div>
  );
}
