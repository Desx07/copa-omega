"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Star,
  Swords,
  Trophy,
  Crown,
  Zap,
  Clock,
  Radio,
  Scale,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BADGE_EMOJIS } from "@/lib/titles";

/* --- Types --- */

interface Player {
  id: string;
  alias: string;
  avatar_url: string | null;
  stars: number;
  wins: number;
  losses: number;
  badge: string | null;
  accent_color: string;
}

interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_order: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  player1_score: number;
  player2_score: number;
  status: "pending" | "in_progress" | "completed" | "bye";
  bracket_position: string | null;
  completed_at: string | null;
  judge_id: string | null;
}

interface Tournament {
  id: string;
  name: string;
  format: string;
  status: string;
  current_round: number;
}

interface Participant {
  player_id: string;
  points: number;
  tournament_wins: number;
  tournament_losses: number;
  is_eliminated: boolean;
}

interface CompletedBattle {
  id: string;
  player1Alias: string;
  player2Alias: string;
  player1Score: number;
  player2Score: number;
  winnerAlias: string;
  completedAt: string;
}

interface RankedPlayer {
  id: string;
  alias: string;
  stars: number;
  wins: number;
  losses: number;
  avatar_url: string | null;
  badge: string | null;
}

/* --- Supabase client (singleton) --- */

const supabase = createClient();

/* ===================================================
   SPECTATOR MODE -- /espectador
   Esports-style broadcast overlay for TV/projector
   =================================================== */

export default function EspectadorPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [globalRanking, setGlobalRanking] = useState<RankedPlayer[]>([]);
  const [currentBattle, setCurrentBattle] = useState<TournamentMatch | null>(null);
  const [recentBattles, setRecentBattles] = useState<CompletedBattle[]>([]);
  const [clock, setClock] = useState(new Date());
  const [connected, setConnected] = useState(false);

  const [flashEvent, setFlashEvent] = useState<"battle_start" | "battle_end" | null>(null);

  const playersRef = useRef(players);
  playersRef.current = players;

  /* --- Fetch helpers --- */

  const fetchActiveTournament = useCallback(async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("id, name, format, status, current_round")
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();
    return data as Tournament | null;
  }, []);

  const fetchMatches = useCallback(async (tournamentId: string) => {
    const { data } = await supabase
      .from("tournament_matches")
      .select("id, tournament_id, round, match_order, player1_id, player2_id, winner_id, player1_score, player2_score, status, bracket_position, completed_at, judge_id")
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: true })
      .order("match_order", { ascending: true });
    return (data ?? []) as TournamentMatch[];
  }, []);

  const fetchParticipants = useCallback(async (tournamentId: string) => {
    const { data } = await supabase
      .from("tournament_participants")
      .select("player_id, points, tournament_wins, tournament_losses, is_eliminated")
      .eq("tournament_id", tournamentId);
    return (data ?? []) as Participant[];
  }, []);

  const fetchPlayers = useCallback(async () => {
    const { data } = await supabase
      .from("players")
      .select("id, alias, avatar_url, stars, wins, losses, badge, accent_color")
      .eq("is_hidden", false);
    const map = new Map<string, Player>();
    for (const p of (data ?? []) as Player[]) {
      map.set(p.id, p);
    }
    return map;
  }, []);

  const fetchGlobalRanking = useCallback(async () => {
    const { data } = await supabase
      .from("players")
      .select("id, alias, stars, wins, losses, avatar_url, badge")
      .eq("is_hidden", false)
      .order("stars", { ascending: false })
      .order("wins", { ascending: false })
      .limit(20);
    return (data ?? []) as RankedPlayer[];
  }, []);

  /* --- Build derived state --- */

  const deriveState = useCallback(
    (allMatches: TournamentMatch[], playerMap: Map<string, Player>) => {
      const battle = allMatches.find((m) => m.status === "in_progress") ?? null;
      setCurrentBattle(battle);

      const completed = allMatches
        .filter((m) => m.status === "completed" && m.completed_at)
        .sort(
          (a, b) =>
            new Date(b.completed_at!).getTime() -
            new Date(a.completed_at!).getTime()
        )
        .slice(0, 5);

      const recent: CompletedBattle[] = completed.map((m) => ({
        id: m.id,
        player1Alias: playerMap.get(m.player1_id ?? "")?.alias ?? "???",
        player2Alias: playerMap.get(m.player2_id ?? "")?.alias ?? "???",
        player1Score: m.player1_score,
        player2Score: m.player2_score,
        winnerAlias: playerMap.get(m.winner_id ?? "")?.alias ?? "???",
        completedAt: m.completed_at!,
      }));
      setRecentBattles(recent);
    },
    []
  );

  /* --- Initial data load --- */

  useEffect(() => {
    async function init() {
      const [t, playerMap, ranking] = await Promise.all([
        fetchActiveTournament(),
        fetchPlayers(),
        fetchGlobalRanking(),
      ]);

      setPlayers(playerMap);
      setGlobalRanking(ranking);

      if (t) {
        setTournament(t);
        const [m, p] = await Promise.all([
          fetchMatches(t.id),
          fetchParticipants(t.id),
        ]);
        setMatches(m);
        setParticipants(p);
        deriveState(m, playerMap);
      }
    }
    init();
  }, [fetchActiveTournament, fetchPlayers, fetchGlobalRanking, fetchMatches, fetchParticipants, deriveState]);

  /* --- Clock tick --- */

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* --- Supabase Realtime subscription --- */

  useEffect(() => {
    const channel = supabase
      .channel("tournament-live")
      .on(
        "postgres_changes" as "system",
        {
          event: "*",
          schema: "public",
          table: "tournament_matches",
        } as any,
        async (payload: any) => {
          const record = payload.new as TournamentMatch | undefined;
          if (!record) return;

          if (!tournament || record.tournament_id !== tournament?.id) {
            const t = await fetchActiveTournament();
            if (t) {
              setTournament(t);
              const [m, p, pm] = await Promise.all([
                fetchMatches(t.id),
                fetchParticipants(t.id),
                fetchPlayers(),
              ]);
              setMatches(m);
              setParticipants(p);
              setPlayers(pm);
              deriveState(m, pm);
            }
            return;
          }

          if (record.status === "in_progress") {
            setFlashEvent("battle_start");
            setTimeout(() => setFlashEvent(null), 2000);
          } else if (record.status === "completed") {
            setFlashEvent("battle_end");
            setTimeout(() => setFlashEvent(null), 2000);
          }

          const [m, p, pm, ranking] = await Promise.all([
            fetchMatches(record.tournament_id),
            fetchParticipants(record.tournament_id),
            fetchPlayers(),
            fetchGlobalRanking(),
          ]);
          setMatches(m);
          setParticipants(p);
          setPlayers(pm);
          setGlobalRanking(ranking);
          deriveState(m, pm);

          const { data: tData } = await supabase
            .from("tournaments")
            .select("id, name, format, status, current_round")
            .eq("id", record.tournament_id)
            .single();
          if (tData) setTournament(tData as Tournament);
        }
      )
      .subscribe((status: string) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournament, fetchActiveTournament, fetchMatches, fetchParticipants, fetchPlayers, fetchGlobalRanking, deriveState]);

  /* --- Periodic poll fallback (every 15s) --- */

  useEffect(() => {
    const interval = setInterval(async () => {
      const t = await fetchActiveTournament();
      if (t) {
        setTournament(t);
        const [m, p, pm, ranking] = await Promise.all([
          fetchMatches(t.id),
          fetchParticipants(t.id),
          fetchPlayers(),
          fetchGlobalRanking(),
        ]);
        setMatches(m);
        setParticipants(p);
        setPlayers(pm);
        setGlobalRanking(ranking);
        deriveState(m, pm);
      } else {
        const [pm, ranking] = await Promise.all([
          fetchPlayers(),
          fetchGlobalRanking(),
        ]);
        setPlayers(pm);
        setGlobalRanking(ranking);
        setTournament(null);
        setMatches([]);
        setParticipants([]);
        setCurrentBattle(null);
        setRecentBattles([]);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveTournament, fetchMatches, fetchParticipants, fetchPlayers, fetchGlobalRanking, deriveState]);

  /* --- Compute top 3 from participants --- */

  const top3 = [...participants]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.tournament_wins !== a.tournament_wins) return b.tournament_wins - a.tournament_wins;
      return a.tournament_losses - b.tournament_losses;
    })
    .slice(0, 3)
    .map((p) => ({
      ...p,
      player: players.get(p.player_id),
    }));

  /* --- Bracket data for display --- */

  const bracketRounds = new Map<number, TournamentMatch[]>();
  for (const m of matches) {
    const arr = bracketRounds.get(m.round) || [];
    arr.push(m);
    bracketRounds.set(m.round, arr);
  }
  const sortedRoundKeys = [...bracketRounds.keys()].sort((a, b) => a - b);

  const totalMatchesCount = matches.length;
  const completedMatchesCount = matches.filter((m) => m.status === "completed").length;
  const progressPercent = totalMatchesCount > 0 ? Math.round((completedMatchesCount / totalMatchesCount) * 100) : 0;

  /* ===================================================
     RENDER
     =================================================== */

  return (
    <div className="h-screen w-screen overflow-hidden bg-omega-black hero-grid relative flex flex-col select-none">
      {/* Flash overlay */}
      {flashEvent && (
        <div
          className={`absolute inset-0 z-50 pointer-events-none animate-pulse ${
            flashEvent === "battle_start"
              ? "bg-omega-blue/10"
              : "bg-omega-gold/10"
          }`}
          style={{ animationDuration: "0.5s" }}
        />
      )}

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-omega-purple/5 blur-3xl orb-1" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-omega-blue/5 blur-3xl orb-2" />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full bg-omega-gold/3 blur-3xl orb-3" />
      </div>

      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-omega-border/30 bg-omega-dark/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Star className="size-10 text-omega-gold fill-omega-gold star-glow" />
            <div className="absolute -top-1 -right-1 size-3 rounded-full bg-omega-blue animate-ping" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-omega-text">
              COPA OMEGA <span className="neon-gold">STAR</span>
            </h1>
            <p className="text-[10px] text-omega-muted uppercase tracking-[0.3em]">
              Beyblade X Tournament System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {tournament && (
            <div className="text-right">
              <p className="text-lg font-black text-omega-text truncate max-w-xs">
                {tournament.name}
              </p>
              <p className="text-[10px] text-omega-muted uppercase tracking-wider">
                Ronda {tournament.current_round} &middot; {progressPercent}% completado
              </p>
            </div>
          )}

          <div className="omega-badge omega-badge-red !rounded-full !px-4 !py-2 gap-2">
            <div className="relative">
              <Radio className="size-4" />
              <div className="absolute inset-0 animate-ping">
                <Radio className="size-4 text-omega-red opacity-40" />
              </div>
            </div>
            <span className="text-sm font-black uppercase tracking-wider live-pulse">
              EN VIVO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-2xl font-mono font-bold text-omega-muted/60 tabular-nums">
            {clock.toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <div
            className={`size-2.5 rounded-full ${
              connected ? "bg-omega-green animate-pulse" : "bg-omega-red"
            }`}
            title={connected ? "Conectado" : "Desconectado"}
          />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex relative z-10 overflow-hidden">
        <main className="flex-1 flex items-center justify-center p-6 relative">
          {currentBattle ? (
            <VSScreen
              match={currentBattle}
              players={players}
              tournament={tournament}
            />
          ) : tournament ? (
            <BracketDisplay
              roundKeys={sortedRoundKeys}
              rounds={bracketRounds}
              players={players}
              tournament={tournament}
              totalRounds={sortedRoundKeys.length}
            />
          ) : (
            <WaitingScreen globalRanking={globalRanking} />
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-80 border-l border-omega-border/30 bg-omega-dark/60 backdrop-blur-md flex flex-col shrink-0 overflow-hidden">
          {/* Top 3 */}
          {tournament && top3.length > 0 && (
            <div className="p-5 border-b border-omega-border/30">
              <h3 className="omega-section-header !p-0 !bg-transparent !border-0 !text-omega-gold !tracking-[0.2em] mb-4">
                <Trophy className="size-4" />
                TOP DEL TORNEO
              </h3>
              <div className="space-y-3">
                {top3.map((entry, i) => (
                  <Top3Row
                    key={entry.player_id}
                    rank={i + 1}
                    player={entry.player}
                    points={entry.points}
                    wins={entry.tournament_wins}
                    losses={entry.tournament_losses}
                    eliminated={entry.is_eliminated}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent battles feed */}
          <div className="flex-1 p-5 overflow-hidden">
            <h3 className="omega-section-header !p-0 !bg-transparent !border-0 !text-omega-blue !tracking-[0.2em] mb-4">
              <Swords className="size-4" />
              BATALLAS RECIENTES
            </h3>
            {recentBattles.length > 0 ? (
              <div className="space-y-2.5">
                {recentBattles.map((b) => (
                  <RecentBattleRow key={b.id} battle={b} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-omega-muted/30">
                <Swords className="size-8 mb-2" />
                <p className="text-xs">Sin batallas aun</p>
              </div>
            )}
          </div>

          {/* Tournament progress bar */}
          {tournament && (
            <div className="p-5 border-t border-omega-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-omega-muted uppercase tracking-wider">
                  Progreso
                </span>
                <span className="text-[10px] font-black text-omega-gold tabular-nums">
                  {completedMatchesCount}/{totalMatchesCount}
                </span>
              </div>
              <div className="h-2 rounded-full bg-omega-dark overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-omega-purple via-omega-blue to-omega-gold transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* BOTTOM RANKING STRIP */}
      <footer className="relative z-10 border-t border-omega-border/30 bg-omega-dark/80 backdrop-blur-md shrink-0">
        <div className="flex items-center h-14 px-6 gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-omega-border/30">
            <Crown className="size-4 text-omega-gold" />
            <span className="text-[10px] font-black text-omega-gold uppercase tracking-widest">
              RANKING
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto ranking-scroll">
            {globalRanking.map((p, i) => (
              <RankingChip key={p.id} player={p} rank={i + 1} />
            ))}
          </div>
        </div>
      </footer>

      {/* Inline styles for custom animations */}
      <style jsx>{`
        .live-pulse {
          animation: live-text-pulse 1.5s ease-in-out infinite;
        }
        @keyframes live-text-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .ranking-scroll::-webkit-scrollbar {
          height: 2px;
        }
        .ranking-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .ranking-scroll::-webkit-scrollbar-thumb {
          background: var(--color-omega-border);
          border-radius: 999px;
        }
        .vs-glow {
          text-shadow:
            0 0 20px var(--color-omega-red),
            0 0 60px var(--color-omega-red),
            0 0 100px rgba(255,71,87,0.3);
        }
        @keyframes slide-in-left {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-left {
          animation: slide-in-left 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-right {
          animation: slide-in-right 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }
      `}</style>
    </div>
  );
}

/* ===================================================
   VS SCREEN -- Dramatic battle display
   =================================================== */

function VSScreen({
  match,
  players,
  tournament,
}: {
  match: TournamentMatch;
  players: Map<string, Player>;
  tournament: Tournament | null;
}) {
  const p1 = match.player1_id ? players.get(match.player1_id) : null;
  const p2 = match.player2_id ? players.get(match.player2_id) : null;
  const judge = match.judge_id ? players.get(match.judge_id) : null;

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-8">
      {/* Match info */}
      <div className="flex items-center gap-3 text-omega-muted">
        <Clock className="size-4 animate-pulse text-omega-blue" />
        <span className="text-xs font-bold uppercase tracking-widest">
          {match.bracket_position
            ? match.bracket_position
            : `Ronda ${match.round} - Partida ${match.match_order}`}
        </span>
        <span className="text-omega-border">|</span>
        <span className="omega-badge omega-badge-blue">En juego</span>
        {judge && (
          <>
            <span className="text-omega-border">|</span>
            <span className="omega-badge omega-badge-gold gap-1.5">
              <Scale className="size-3.5" />
              Juez: {judge.alias}
            </span>
          </>
        )}
      </div>

      {/* VS Layout */}
      <div className="flex items-center justify-center gap-8 w-full">
        <div className="flex-1 flex flex-col items-center animate-slide-left">
          <PlayerCard player={p1} side="left" score={match.player1_score} />
        </div>

        <div className="flex flex-col items-center gap-2 animate-scale-in opacity-0 shrink-0">
          <div className="relative">
            <Zap className="size-16 text-omega-red fill-omega-red/20" />
            <div className="absolute inset-0 animate-pulse">
              <Zap className="size-16 text-omega-red/50 fill-omega-red/10" />
            </div>
          </div>
          <span className="text-5xl font-black text-omega-red vs-glow tracking-wider">
            VS
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center animate-slide-right">
          <PlayerCard player={p2} side="right" score={match.player2_score} />
        </div>
      </div>

      {/* Score (if live scoring) */}
      {(match.player1_score > 0 || match.player2_score > 0) && (
        <div className="flex items-center gap-6 mt-4">
          <span className="text-6xl font-black text-omega-blue tabular-nums neon-blue">
            {match.player1_score}
          </span>
          <span className="text-2xl text-omega-muted/40 font-bold">-</span>
          <span className="text-6xl font-black text-omega-purple tabular-nums neon-purple">
            {match.player2_score}
          </span>
        </div>
      )}
    </div>
  );
}

/* --- Player Card (VS screen) --- */

function PlayerCard({
  player,
  side,
  score,
}: {
  player: Player | null | undefined;
  side: "left" | "right";
  score: number;
}) {
  if (!player) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="size-32 rounded-full bg-omega-card border-4 border-omega-border/30 flex items-center justify-center">
          <span className="text-4xl font-black text-omega-muted/30">?</span>
        </div>
        <p className="text-2xl font-black text-omega-muted/40">TBD</p>
      </div>
    );
  }

  const glowClass = side === "left" ? "neon-blue" : "neon-purple";
  const borderColor =
    side === "left"
      ? "border-omega-blue/60 shadow-omega-blue/30"
      : "border-omega-purple/60 shadow-omega-purple/30";
  const bgGradient =
    side === "left"
      ? "from-omega-blue/20 to-transparent"
      : "from-omega-purple/20 to-transparent";

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xs">
      <div className={`relative size-36 rounded-full border-4 ${borderColor} shadow-lg overflow-hidden bg-omega-dark`}>
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt={player.alias}
            className="size-full object-cover"
          />
        ) : (
          <div className={`size-full flex items-center justify-center bg-gradient-to-br ${bgGradient}`}>
            <span className="text-6xl font-black text-omega-text/80">
              {player.alias.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className={`absolute inset-0 rounded-full border-4 ${borderColor} animate-pulse opacity-50`} />
      </div>

      <div className="text-center">
        <p className={`text-4xl font-black ${glowClass} tracking-tight`}>
          {player.badge && (
            <span className="mr-2">{BADGE_EMOJIS[player.badge]}</span>
          )}
          {player.alias}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Star className="size-7 text-omega-gold fill-omega-gold star-glow" />
        <span className="text-3xl font-black neon-gold tabular-nums">
          {player.stars}
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-full bg-omega-dark/80 border border-omega-border/30 px-5 py-2">
        <span className="text-lg font-black text-omega-green tabular-nums">
          {player.wins}W
        </span>
        <div className="w-px h-5 bg-omega-border/50" />
        <span className="text-lg font-black text-omega-red tabular-nums">
          {player.losses}L
        </span>
      </div>
    </div>
  );
}

/* ===================================================
   BRACKET DISPLAY -- When no battle in progress
   =================================================== */

function BracketDisplay({
  roundKeys,
  rounds,
  players,
  tournament,
  totalRounds,
}: {
  roundKeys: number[];
  rounds: Map<number, TournamentMatch[]>;
  players: Map<string, Player>;
  tournament: Tournament;
  totalRounds: number;
}) {
  if (roundKeys.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 text-omega-muted/40">
        <Swords className="size-20" />
        <p className="text-xl font-bold">Esperando partidas...</p>
      </div>
    );
  }

  const roundLabel = (roundIndex: number, total: number): string => {
    if (tournament.format === "single_elimination") {
      const fromEnd = total - roundIndex;
      if (fromEnd === 1) return "FINAL";
      if (fromEnd === 2) return "SEMIFINAL";
      if (fromEnd === 3) return "CUARTOS";
      return `RONDA ${roundIndex + 1}`;
    }
    return `RONDA ${roundKeys[roundIndex]}`;
  };

  return (
    <div className="w-full overflow-x-auto px-4">
      <div className="flex items-center justify-center mb-6 gap-3">
        <Trophy className="size-6 text-omega-gold" />
        <h2 className="text-xl font-black text-omega-text uppercase tracking-wider">
          {tournament.format === "single_elimination" ? "Bracket" : "Rondas"}
        </h2>
      </div>

      <div className="flex gap-6 min-w-max justify-center">
        {roundKeys.map((roundNum, roundIndex) => {
          const roundMatches = rounds.get(roundNum)!;
          return (
            <div key={roundNum} className="flex flex-col min-w-[220px]">
              <div className="text-center mb-4">
                <span
                  className={`text-[11px] font-black uppercase tracking-[0.15em] ${
                    roundNum === tournament.current_round
                      ? "text-omega-blue"
                      : "text-omega-muted/60"
                  }`}
                >
                  {roundLabel(roundIndex, totalRounds)}
                </span>
              </div>

              <div className="flex flex-col justify-around flex-1 gap-3">
                {roundMatches.map((match) => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    players={players}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketMatchCard({
  match,
  players,
}: {
  match: TournamentMatch;
  players: Map<string, Player>;
}) {
  const p1 = match.player1_id ? players.get(match.player1_id) : null;
  const p2 = match.player2_id ? players.get(match.player2_id) : null;
  const p1Alias = p1?.alias ?? (match.player1_id ? "???" : "TBD");
  const p2Alias = p2?.alias ?? (match.player2_id ? "???" : "TBD");

  const p1Won = match.status === "completed" && match.winner_id === match.player1_id;
  const p2Won = match.status === "completed" && match.winner_id === match.player2_id;
  const isActive = match.status === "in_progress";
  const isBye = match.status === "bye";

  return (
    <div
      className={`omega-card transition-all ${
        isActive
          ? "!border-omega-blue/60 !shadow-lg !shadow-omega-blue/20 ring-1 ring-omega-blue/30"
          : isBye
          ? "opacity-50"
          : ""
      }`}
    >
      {/* Player 1 */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 ${
          p1Won
            ? "bg-omega-green/10"
            : isActive
            ? "bg-omega-blue/5"
            : "bg-omega-card"
        }`}
      >
        <div className="size-7 rounded-full bg-omega-dark border border-omega-border/40 flex items-center justify-center shrink-0 overflow-hidden">
          {p1?.avatar_url ? (
            <img src={p1.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[11px] font-black text-omega-purple">
              {p1Alias.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span
          className={`text-sm font-bold truncate flex-1 ${
            p1Won ? "text-omega-green" : match.player1_id ? "text-omega-text" : "text-omega-muted/30"
          }`}
        >
          {p1Won && <Crown className="size-3.5 text-omega-gold inline mr-1" />}
          {isBye && match.player1_id ? `${p1Alias} (BYE)` : p1Alias}
        </span>
        {match.status === "completed" && (
          <span className={`text-xs font-black tabular-nums ${p1Won ? "text-omega-green" : "text-omega-muted/50"}`}>
            {match.player1_score}
          </span>
        )}
      </div>

      <div className="h-px bg-omega-border/20" />

      {/* Player 2 */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 ${
          p2Won
            ? "bg-omega-green/10"
            : isActive
            ? "bg-omega-blue/5"
            : "bg-omega-card"
        }`}
      >
        <div className="size-7 rounded-full bg-omega-dark border border-omega-border/40 flex items-center justify-center shrink-0 overflow-hidden">
          {p2?.avatar_url ? (
            <img src={p2.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[11px] font-black text-omega-blue">
              {p2Alias.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span
          className={`text-sm font-bold truncate flex-1 ${
            p2Won ? "text-omega-green" : match.player2_id ? "text-omega-text" : "text-omega-muted/30"
          }`}
        >
          {p2Won && <Crown className="size-3.5 text-omega-gold inline mr-1" />}
          {p2Alias}
        </span>
        {match.status === "completed" && (
          <span className={`text-xs font-black tabular-nums ${p2Won ? "text-omega-green" : "text-omega-muted/50"}`}>
            {match.player2_score}
          </span>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="px-3 py-1.5 bg-omega-blue/10 border-t border-omega-blue/20 text-center">
          <span className="text-[10px] font-black text-omega-blue uppercase tracking-wider flex items-center justify-center gap-1">
            <Clock className="size-3 animate-pulse" />
            En juego
          </span>
        </div>
      )}
    </div>
  );
}

/* ===================================================
   WAITING SCREEN -- When no tournament is active
   =================================================== */

function WaitingScreen({
  globalRanking,
}: {
  globalRanking: RankedPlayer[];
}) {
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="relative animate-float">
        <Star className="size-28 text-omega-gold fill-omega-gold star-glow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-20 rounded-full border-2 border-omega-gold/20 animate-ping" style={{ animationDuration: "3s" }} />
        </div>
      </div>

      <div className="text-center space-y-3">
        <h2 className="text-5xl font-black text-omega-text">
          COPA OMEGA <span className="neon-gold">STAR</span>
        </h2>
        <p className="text-xl text-omega-muted/60 font-medium">
          Esperando el proximo torneo...
        </p>
      </div>

      {globalRanking.length > 0 && (
        <div className="w-full max-w-md">
          <h3 className="omega-section-header !bg-transparent !border-0 !text-omega-gold !tracking-[0.2em] justify-center mb-4">
            <Crown className="size-4" />
            TOP BLADERS
          </h3>
          <div className="space-y-2">
            {globalRanking.slice(0, 5).map((p, i) => (
              <div
                key={p.id}
                className="omega-row omega-card !rounded-xl"
              >
                <span
                  className={`text-lg font-black w-8 text-center tabular-nums ${
                    i === 0
                      ? "text-omega-gold"
                      : i === 1
                      ? "text-omega-text/70"
                      : i === 2
                      ? "text-amber-700"
                      : "text-omega-muted/50"
                  }`}
                >
                  #{i + 1}
                </span>
                <div className="size-9 rounded-full bg-omega-dark border border-omega-border/40 overflow-hidden shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-sm font-black text-omega-purple">
                      {p.alias.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-base font-bold text-omega-text flex-1 truncate">
                  {p.badge && (
                    <span className="mr-1">{BADGE_EMOJIS[p.badge]}</span>
                  )}
                  {p.alias}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Star className="size-4 text-omega-gold fill-omega-gold" />
                  <span className="text-base font-black text-omega-gold tabular-nums">
                    {p.stars}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================================================
   SIDEBAR COMPONENTS
   =================================================== */

function Top3Row({
  rank,
  player,
  points,
  wins,
  losses,
  eliminated,
}: {
  rank: number;
  player: Player | undefined;
  points: number;
  wins: number;
  losses: number;
  eliminated: boolean;
}) {
  const auraClass = rank === 1 ? "aura-gold" : rank === 2 ? "aura-silver" : "aura-bronze";

  return (
    <div
      className={`omega-row omega-card !rounded-xl ${auraClass} ${eliminated ? "opacity-40" : ""}`}
    >
      <span
        className={`text-lg font-black w-6 text-center ${
          rank === 1 ? "text-omega-gold" : rank === 2 ? "text-omega-text/70" : "text-amber-700"
        }`}
      >
        {rank === 1 ? (
          <Crown className="size-5 text-omega-gold inline" />
        ) : (
          `#${rank}`
        )}
      </span>

      <div className="size-8 rounded-full bg-omega-dark border border-omega-border/40 overflow-hidden shrink-0">
        {player?.avatar_url ? (
          <img src={player.avatar_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
            {player?.alias?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-omega-text truncate">
          {player?.badge && (
            <span className="mr-1">{BADGE_EMOJIS[player.badge]}</span>
          )}
          {player?.alias ?? "???"}
        </p>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="font-bold text-omega-green">{wins}W</span>
          <span className="text-omega-muted/40">/</span>
          <span className="font-bold text-omega-red">{losses}L</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-lg font-black text-omega-gold tabular-nums">
          {points}
        </span>
        <span className="text-[9px] text-omega-muted uppercase">pts</span>
      </div>
    </div>
  );
}

function RecentBattleRow({ battle }: { battle: CompletedBattle }) {
  const timeAgo = getTimeAgo(battle.completedAt);

  return (
    <div className="omega-card !rounded-lg px-3 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`text-xs font-bold truncate ${
              battle.winnerAlias === battle.player1Alias
                ? "text-omega-green"
                : "text-omega-muted"
            }`}
          >
            {battle.player1Alias}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`text-[11px] font-black tabular-nums ${
                battle.player1Score > battle.player2Score
                  ? "text-omega-green"
                  : "text-omega-muted/50"
              }`}
            >
              {battle.player1Score}
            </span>
            <span className="text-omega-muted/30 text-[9px]">-</span>
            <span
              className={`text-[11px] font-black tabular-nums ${
                battle.player2Score > battle.player1Score
                  ? "text-omega-green"
                  : "text-omega-muted/50"
              }`}
            >
              {battle.player2Score}
            </span>
          </div>
          <span
            className={`text-xs font-bold truncate ${
              battle.winnerAlias === battle.player2Alias
                ? "text-omega-green"
                : "text-omega-muted"
            }`}
          >
            {battle.player2Alias}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Crown className="size-3 text-omega-gold" />
          <span className="text-[10px] font-bold text-omega-gold">
            {battle.winnerAlias}
          </span>
        </div>
        <span className="text-[9px] text-omega-muted/50">{timeAgo}</span>
      </div>
    </div>
  );
}

function RankingChip({
  player,
  rank,
}: {
  player: RankedPlayer;
  rank: number;
}) {
  const isTop3 = rank <= 3;
  const rankColor =
    rank === 1
      ? "text-omega-gold"
      : rank === 2
      ? "text-omega-text/70"
      : rank === 3
      ? "text-amber-700"
      : "text-omega-muted/50";

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 shrink-0 transition-all ${
        isTop3
          ? "bg-omega-elevated border border-omega-gold/30"
          : "bg-omega-card border border-omega-border"
      }`}
    >
      <span className={`text-[10px] font-black ${rankColor} tabular-nums`}>
        #{rank}
      </span>
      <span
        className={`text-[11px] font-bold truncate max-w-[80px] ${
          isTop3 ? "text-omega-text" : "text-omega-muted/70"
        }`}
      >
        {player.alias}
      </span>
      <Star
        className={`size-3 ${
          isTop3
            ? "text-omega-gold fill-omega-gold"
            : "text-omega-muted/30 fill-omega-muted/30"
        }`}
      />
      <span
        className={`text-[10px] font-black tabular-nums ${
          isTop3 ? "text-omega-gold" : "text-omega-muted/40"
        }`}
      >
        {player.stars}
      </span>
    </div>
  );
}

/* --- Utility --- */

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}
