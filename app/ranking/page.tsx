import Link from "next/link";
import { Star, Trophy, Crown, Flame, Swords, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function RankingPage() {
  const supabase = await createClient();

  // Check if logged in (for back button)
  const { data: { user } } = await supabase.auth.getUser();

  // Leaderboard + recent matches
  const [playersResult, matchesResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, alias, full_name, stars, wins, losses, is_eliminated, avatar_url")
      .eq("is_hidden", false)
      .order("stars", { ascending: false })
      .order("wins", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("matches")
      .select("id, player1_id, player2_id, winner_id, stars_bet, completed_at, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10),
  ]);

  const players = playersResult.data;
  const { data: recentMatches } = matchesResult;

  const leaderboard = players ?? [];
  const matches = recentMatches ?? [];

  // Calculate current win streaks for all players
  const streaks = new Map<string, number>();
  if (matches.length > 0) {
    // Get all completed matches for streak calculation
    const { data: allCompleted } = await supabase
      .from("matches")
      .select("player1_id, player2_id, winner_id, completed_at")
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (allCompleted) {
      for (const player of leaderboard) {
        let streak = 0;
        for (const m of allCompleted) {
          if (m.player1_id !== player.id && m.player2_id !== player.id) continue;
          if (m.winner_id === player.id) {
            streak++;
          } else {
            break;
          }
        }
        if (streak >= 2) streaks.set(player.id, streak);
      }
    }
  }

  return (
    <div className="min-h-screen bg-omega-black text-omega-text">
      {/* Ambient bg */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[20%] w-[500px] h-[500px] rounded-full bg-omega-purple/[0.08] blur-[120px]" />
        <div className="absolute top-[50%] left-[5%] w-[400px] h-[400px] rounded-full bg-omega-blue/[0.05] blur-[100px]" />
        <div className="absolute inset-0 hero-grid opacity-30" />
      </div>
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Back */}
        {user ? (
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        ) : (
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors">
            <ArrowLeft className="size-4" />
            Inicio
          </Link>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Star className="size-8 text-omega-gold star-glow fill-omega-gold" />
            <h1 className="text-3xl font-black tracking-tight neon-gold">
              RANKING
            </h1>
            <Star className="size-8 text-omega-gold star-glow fill-omega-gold" />
          </div>
          <p className="text-sm text-omega-muted">
            Copa Omega Star — Bladers Santa Fe
          </p>
        </div>

        {/* Empty state */}
        {leaderboard.length === 0 && (
          <div className="rounded-2xl border border-omega-border bg-omega-card/50 p-12 text-center space-y-4 backdrop-blur-sm">
            <Trophy className="size-16 text-omega-muted/30 mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-bold text-omega-muted">
                No hay jugadores todavía
              </p>
              <p className="text-sm text-omega-muted/70">
                Registrate para ser el primero en la tabla
              </p>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-6 py-3 font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Star className="size-4" />
              Registrarme
            </Link>
          </div>
        )}

        {/* Top 3 podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            <PodiumCard player={leaderboard[1]} rank={2} streak={streaks.get(leaderboard[1].id)} />
            <PodiumCard player={leaderboard[0]} rank={1} streak={streaks.get(leaderboard[0].id)} />
            <PodiumCard player={leaderboard[2]} rank={3} streak={streaks.get(leaderboard[2].id)} />
          </div>
        )}

        {/* If only 1 or 2 players, show them inline */}
        {leaderboard.length > 0 && leaderboard.length < 3 && (
          <div className="flex justify-center gap-4">
            {leaderboard.slice(0, 3).map((player, i) => (
              <div key={player.id} className="w-48">
                <PodiumCard player={player} rank={(i + 1) as 1 | 2 | 3} streak={streaks.get(player.id)} />
              </div>
            ))}
          </div>
        )}

        {/* Full leaderboard table — skip top 3 if podium is shown */}
        {leaderboard.length > 0 && (() => {
          const hasPodium = leaderboard.length >= 3;
          const tableStart = hasPodium ? 3 : 0;
          const tablePlayers = leaderboard.slice(tableStart);
          if (tablePlayers.length === 0) return null;

          return (
            <div className="rounded-2xl border border-omega-border bg-omega-card/40 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-omega-border bg-omega-card/60">
                <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="size-4 text-omega-purple" />
                  Tabla completa
                </h2>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-omega-border/30">
                {tablePlayers.map((player, index) => {
                  const rank = tableStart + index + 1;
                  const streak = streaks.get(player.id);
                  return (
                    <Link
                      href={`/player/${player.id}`}
                      key={player.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-omega-card/60 ${
                        player.is_eliminated ? "opacity-60" : ""
                      }`}
                    >
                      {/* Rank */}
                      <span className="text-sm font-black text-omega-muted/70 w-6 text-center shrink-0">
                        {rank}
                      </span>

                      {/* Avatar */}
                      <div className="size-8 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                            {player.alias.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Player info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-bold truncate ${
                              player.is_eliminated
                                ? "text-omega-muted line-through"
                                : "text-omega-text"
                            }`}
                          >
                            {player.alias}
                          </span>
                          {player.is_eliminated && (
                            <span className="size-1.5 rounded-full bg-omega-red shrink-0" />
                          )}
                          {streak && (
                            <span className="flex items-center gap-0.5 text-omega-green shrink-0">
                              <Flame className="size-3" />
                              <span className="text-[10px] font-bold">{streak}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-omega-muted">
                          <span className="text-omega-green">{player.wins}W</span>
                          <span className="text-omega-muted/40"> / </span>
                          <span className="text-omega-red">{player.losses}L</span>
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                        <span className="text-sm font-black text-omega-gold">
                          {player.stars}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Recent matches */}
        {matches.length > 0 && (
          <div className="rounded-2xl border border-omega-border bg-omega-card/40 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-omega-border bg-omega-card/60">
              <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
                <Swords className="size-4 text-omega-blue" />
                Ultimas partidas
              </h2>
            </div>
            <div className="divide-y divide-omega-border/30">
              {matches.map((match) => {
                const p1 = match.player1 as unknown as { alias: string } | null;
                const p2 = match.player2 as unknown as { alias: string } | null;
                const p1Won = match.winner_id === match.player1_id;

                return (
                  <div key={match.id} className="flex items-center gap-3 px-4 py-3">
                    {/* Player 1 */}
                    <span className={`text-sm font-bold truncate flex-1 text-right ${p1Won ? "text-omega-green" : "text-omega-muted"}`}>
                      {p1Won && <Crown className="size-3 text-omega-gold inline mr-1" />}
                      {p1?.alias ?? "???"}
                    </span>

                    {/* VS + stars */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-0.5 rounded-full bg-omega-gold/10 border border-omega-gold/30 px-2 py-0.5">
                        <Star className="size-3 text-omega-gold fill-omega-gold" />
                        <span className="text-[11px] font-black text-omega-gold">{match.stars_bet}</span>
                      </div>
                    </div>

                    {/* Player 2 */}
                    <span className={`text-sm font-bold truncate flex-1 ${!p1Won ? "text-omega-green" : "text-omega-muted"}`}>
                      {p2?.alias ?? "???"}
                      {!p1Won && <Crown className="size-3 text-omega-gold inline ml-1" />}
                    </span>

                    {/* Date */}
                    <span className="text-[10px] text-omega-muted/60 shrink-0">
                      {match.completed_at
                        ? new Date(match.completed_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                        : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

    </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helper components                                                          */
/* -------------------------------------------------------------------------- */

interface PodiumPlayer {
  id: string;
  alias: string;
  stars: number;
  wins: number;
  losses: number;
  is_eliminated: boolean;
  avatar_url: string | null;
}

interface PodiumCardProps {
  player: PodiumPlayer;
  rank: 1 | 2 | 3;
  streak?: number;
}

const podiumConfig = {
  1: {
    border: "border-omega-gold/50",
    bg: "bg-gradient-to-b from-omega-gold/10 to-omega-card/80",
    shadow: "shadow-lg shadow-omega-gold/10",
    starClass: "text-omega-gold",
    label: "neon-gold",
    height: "pt-2",
    avatarBorder: "border-omega-gold",
    icon: <Crown className="size-6 text-omega-gold fill-omega-gold/30" />,
  },
  2: {
    border: "border-omega-muted/30",
    bg: "bg-gradient-to-b from-omega-muted/10 to-omega-card/80",
    shadow: "",
    starClass: "text-omega-muted",
    label: "text-omega-muted",
    height: "pt-6",
    avatarBorder: "border-omega-muted/50",
    icon: <Crown className="size-5 text-omega-muted/70" />,
  },
  3: {
    border: "border-orange-700/30",
    bg: "bg-gradient-to-b from-orange-900/10 to-omega-card/80",
    shadow: "",
    starClass: "text-orange-500",
    label: "text-orange-500",
    height: "pt-8",
    avatarBorder: "border-orange-500/50",
    icon: <Crown className="size-5 text-orange-500/70" />,
  },
} as const;

function PodiumCard({ player, rank, streak }: PodiumCardProps) {
  const config = podiumConfig[rank];

  return (
    <div
      className={`${config.height} ${rank === 1 ? "order-2 -mt-2" : rank === 2 ? "order-1 mt-2" : "order-3 mt-2"}`}
    >
      <Link
        href={`/player/${player.id}`}
        className={`block rounded-2xl border ${config.border} ${config.bg} ${config.shadow} p-4 text-center space-y-2 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]`}
      >
        {/* Crown */}
        <div className="flex justify-center">{config.icon}</div>

        {/* Avatar */}
        <div className={`size-12 rounded-full border-2 ${config.avatarBorder} overflow-hidden bg-omega-dark mx-auto`}>
          {player.avatar_url ? (
            <img src={player.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center text-lg font-black text-omega-purple">
              {player.alias.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Alias */}
        <p
          className={`text-sm font-black truncate ${
            player.is_eliminated ? "text-omega-muted line-through" : "text-omega-text"
          }`}
        >
          {player.alias}
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-1">
          <Star
            className={`size-4 ${config.starClass} ${rank === 1 ? "star-glow fill-omega-gold" : ""}`}
          />
          <span className={`text-xl font-black ${config.label}`}>
            {player.stars}
          </span>
        </div>

        {/* W/L + streak */}
        <div className="space-y-1">
          <p className="text-[11px] text-omega-muted">
            <span className="text-omega-green font-bold">{player.wins}W</span>
            {" "}
            <span className="text-omega-red font-bold">{player.losses}L</span>
          </p>
          {streak && (
            <p className="flex items-center justify-center gap-1 text-[10px] text-omega-green font-bold">
              <Flame className="size-3" />
              {streak} racha
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
