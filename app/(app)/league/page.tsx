"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Users,
  Star,
  Trophy,
  Calendar,
  Shield,
  ChevronDown,
  Swords,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamStanding {
  team_id: string;
  team_name: string;
  team_logo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
}

interface LeagueMatch {
  id: string;
  round: number;
  status: string;
  team1: { id: string; name: string; logo_url: string | null } | null;
  team2: { id: string; name: string; logo_url: string | null } | null;
  team1_wins: number | null;
  team2_wins: number | null;
  winner_team_id: string | null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function LeaguePage() {
  const [loading, setLoading] = useState(true);
  const [teamsEnabled, setTeamsEnabled] = useState(true);
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [tab, setTab] = useState<"tabla" | "calendario" | "historial">("tabla");
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      // Check feature flag
      try {
        const configRes = await fetch("/api/app-config");
        if (configRes.ok) {
          const config = await configRes.json();
          if (config.teams_enabled === "false") {
            setTeamsEnabled(false);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }

      // Fetch standings from team_league_teams (liga activa)
      try {
        const supabase = createClient();

        // Buscar liga activa (in_progress o registration)
        const { data: activeLeague } = await supabase
          .from("team_leagues")
          .select("id")
          .in("status", ["in_progress", "registration"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeLeague) {
          // Obtener standings de la liga
          const { data: leagueTeams } = await supabase
            .from("team_league_teams")
            .select("team_id, points, played, won, drawn, lost, fights_won, fights_lost, team:teams!team_id(id, name, logo_url)")
            .eq("team_league_id", activeLeague.id)
            .order("points", { ascending: false });

          if (leagueTeams && leagueTeams.length > 0) {
            const standings: TeamStanding[] = leagueTeams.map((lt) => {
              const team = lt.team as unknown as { id: string; name: string; logo_url: string | null };
              return {
                team_id: lt.team_id,
                team_name: team?.name ?? "???",
                team_logo: team?.logo_url ?? null,
                played: lt.played,
                won: lt.won,
                drawn: lt.drawn,
                lost: lt.lost,
                points: lt.points,
              };
            });

            // Sort by points desc, then won desc (for tiebreaker)
            standings.sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              return b.won - a.won;
            });

            setTeams(standings);
          }

          // Fetch league matches
          const { data: leagueMatches } = await supabase
            .from("team_league_matches")
            .select(`
              id, round, status,
              team1:teams!team1_id(id, name, logo_url),
              team2:teams!team2_id(id, name, logo_url),
              team_match:team_matches!team_match_id(team1_wins, team2_wins, winner_team_id)
            `)
            .eq("team_league_id", activeLeague.id)
            .order("round", { ascending: true });

          if (leagueMatches) {
            const mappedMatches: LeagueMatch[] = leagueMatches.map((m) => {
              const tm = m.team_match as unknown as { team1_wins: number | null; team2_wins: number | null; winner_team_id: string | null } | null;
              return {
                id: m.id,
                round: m.round,
                status: m.status,
                team1: m.team1 as unknown as { id: string; name: string; logo_url: string | null } | null,
                team2: m.team2 as unknown as { id: string; name: string; logo_url: string | null } | null,
                team1_wins: tm?.team1_wins ?? null,
                team2_wins: tm?.team2_wins ?? null,
                winner_team_id: tm?.winner_team_id ?? null,
              };
            });
            setMatches(mappedMatches);
          }
        } else {
          // Fallback: usar datos globales de equipos si no hay liga activa
          const res = await fetch("/api/teams");
          if (res.ok) {
            const data = await res.json();
            const standings: TeamStanding[] = data.map((t: {
              id: string; name: string; logo_url: string | null; wins: number; losses: number;
            }) => ({
              team_id: t.id,
              team_name: t.name,
              team_logo: t.logo_url,
              played: t.wins + t.losses,
              won: t.wins,
              drawn: 0,
              lost: t.losses,
              points: t.wins * 3,
            }));

            standings.sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              return b.won - a.won;
            });

            setTeams(standings);
          }
        }
      } catch {
        toast.error("Error cargando datos de liga");
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 text-omega-green animate-spin" />
      </div>
    );
  }

  if (!teamsEnabled) {
    return (
      <div className="max-w-lg mx-auto pb-10 pt-6 px-4 space-y-6">
        <Link href="/dashboard" className="text-sm text-omega-muted hover:text-omega-text transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>
        <div className="omega-card p-8 text-center space-y-3">
          <Shield className="size-12 text-omega-muted/30 mx-auto" />
          <h2 className="text-xl font-black text-omega-text">Equipos deshabilitados</h2>
          <p className="text-sm text-omega-muted">La liga de equipos no esta activa.</p>
        </div>
      </div>
    );
  }

  // Group matches by round
  const roundsMap = new Map<number, LeagueMatch[]>();
  for (const m of matches) {
    const existing = roundsMap.get(m.round) ?? [];
    existing.push(m);
    roundsMap.set(m.round, existing);
  }
  const rounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-green/20 via-omega-surface to-omega-gold/10 shadow-lg shadow-omega-green/10">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-text transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-omega-green/20 flex items-center justify-center ring-2 ring-omega-green/30">
              <Trophy className="size-6 text-omega-green" />
            </div>
            <div>
              <h1 className="text-2xl font-black" style={{ textShadow: "0 0 10px rgba(46,213,115,0.5)" }}>
                LIGA
              </h1>
              <p className="text-xs text-omega-muted">
                Temporada 2026 - {teams.length} equipos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex bg-omega-surface rounded-xl p-1 gap-1">
          {[
            { key: "tabla" as const, label: "Tabla", icon: Trophy },
            { key: "calendario" as const, label: "Fechas", icon: Calendar },
            { key: "historial" as const, label: "Historial", icon: Crown },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                tab === key
                  ? "bg-omega-green/20 text-omega-green border border-omega-green/30"
                  : "text-omega-muted hover:text-omega-text"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Tabla de posiciones */}
      {tab === "tabla" && (
        <div className="px-4">
          {teams.length === 0 ? (
            <div className="omega-card p-8 text-center space-y-3">
              <Users className="size-12 text-omega-muted/20 mx-auto" />
              <p className="text-sm text-omega-muted">No hay equipos en la liga</p>
            </div>
          ) : (
            <div className="omega-card overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[auto_1fr_repeat(5,_minmax(0,_1fr))] gap-x-2 px-3 py-2.5 bg-omega-dark/60 border-b border-omega-border/20 text-[10px] font-bold text-omega-muted uppercase tracking-wider">
                <span className="w-6 text-center">#</span>
                <span>Equipo</span>
                <span className="text-center">PJ</span>
                <span className="text-center">PG</span>
                <span className="text-center">PE</span>
                <span className="text-center">PP</span>
                <span className="text-center">Pts</span>
              </div>

              {/* Rows */}
              {teams.map((team, idx) => {
                const pos = idx + 1;
                const isTop = pos <= 3;

                return (
                  <div
                    key={team.team_id}
                    className={`grid grid-cols-[auto_1fr_repeat(5,_minmax(0,_1fr))] gap-x-2 items-center px-3 py-2.5 border-b border-omega-border/10 last:border-b-0 transition-colors hover:bg-omega-surface/50 ${
                      isTop ? "bg-omega-green/5" : ""
                    }`}
                  >
                    <span className={`w-6 text-center text-xs font-black ${
                      pos === 1 ? "text-omega-gold" : pos <= 3 ? "text-omega-green" : "text-omega-muted"
                    }`}>
                      {pos}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-omega-purple/15 flex items-center justify-center overflow-hidden shrink-0">
                        {team.team_logo ? (
                          <img src={team.team_logo} alt={team.team_name} className="size-full object-cover" />
                        ) : (
                          <Users className="size-3.5 text-omega-purple" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-omega-text truncate">
                        {team.team_name}
                      </span>
                    </div>
                    <span className="text-center text-xs text-omega-muted">{team.played}</span>
                    <span className="text-center text-xs font-bold text-omega-green">{team.won}</span>
                    <span className="text-center text-xs text-omega-muted">{team.drawn}</span>
                    <span className="text-center text-xs font-bold text-omega-red">{team.lost}</span>
                    <span className={`text-center text-xs font-black ${
                      pos === 1 ? "text-omega-gold" : "text-omega-text"
                    }`}>
                      {team.points}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Calendario */}
      {tab === "calendario" && (
        <div className="px-4 space-y-3">
          {rounds.length === 0 ? (
            <div className="omega-card p-8 text-center space-y-3">
              <Calendar className="size-12 text-omega-muted/20 mx-auto" />
              <p className="text-sm text-omega-muted">No hay fechas programadas</p>
              <p className="text-xs text-omega-muted/70">
                Las fechas se generan automaticamente al iniciar la liga
              </p>
            </div>
          ) : (
            rounds.map(([round, roundMatches]) => (
              <div key={round} className="omega-card overflow-hidden">
                <button
                  onClick={() => setExpandedRound(expandedRound === round ? null : round)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-omega-dark/40 hover:bg-omega-dark/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-omega-green" />
                    <span className="text-sm font-bold text-omega-text">Fecha {round}</span>
                    <span className="text-[10px] text-omega-muted">
                      ({roundMatches.length} partidas)
                    </span>
                  </div>
                  <ChevronDown className={`size-4 text-omega-muted transition-transform ${
                    expandedRound === round ? "rotate-180" : ""
                  }`} />
                </button>
                {expandedRound === round && (
                  <div className="divide-y divide-omega-border/10">
                    {roundMatches.map((m) => (
                      <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 text-right">
                          <span className="text-xs font-bold text-omega-text">
                            {m.team1?.name ?? "???"}
                          </span>
                        </div>
                        <div className="shrink-0 px-2">
                          {m.status === "completed" ? (
                            <span className="text-xs font-black text-omega-gold">
                              {m.team1_wins} - {m.team2_wins}
                            </span>
                          ) : (
                            <span className="text-xs text-omega-muted">vs</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-xs font-bold text-omega-text">
                            {m.team2?.name ?? "???"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Historial */}
      {tab === "historial" && (
        <div className="px-4 space-y-3">
          <div className="omega-card p-8 text-center space-y-3">
            <Crown className="size-12 text-omega-gold/20 mx-auto" />
            <p className="text-sm text-omega-muted">Historial de campeones</p>
            <p className="text-xs text-omega-muted/70">
              Esta es la primera temporada de la liga
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
