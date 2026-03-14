import Link from "next/link";
import { Star, Trophy, Crown, Flame, Swords, ArrowLeft, Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function RankingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [playersResult, matchesResult, tournamentPointsResult] = await Promise.all([
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
    supabase
      .from("tournament_points")
      .select("player_id, points, player:players!player_id(alias, avatar_url)"),
  ]);

  const players = playersResult.data;
  const { data: recentMatches } = matchesResult;
  const rawTournamentPoints = tournamentPointsResult.data ?? [];

  const leaderboard = players ?? [];
  const matches = recentMatches ?? [];

  // Aggregate tournament points by player
  const pointsMap = new Map<string, { alias: string; avatar_url: string | null; total: number }>();
  for (const tp of rawTournamentPoints) {
    const player = tp.player as unknown as { alias: string; avatar_url: string | null };
    if (!player) continue;
    const existing = pointsMap.get(tp.player_id);
    if (existing) {
      existing.total += tp.points;
    } else {
      pointsMap.set(tp.player_id, {
        alias: player.alias,
        avatar_url: player.avatar_url,
        total: tp.points,
      });
    }
  }
  const tournamentRanking = [...pointsMap.entries()]
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);

  // Calculate current win streaks for all players
  const streaks = new Map<string, number>();
  if (matches.length > 0) {
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
    <div className="mx-auto max-w-3xl pb-10 space-y-5">
      {/* ═══ HERO BANNER ═══ */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-gold/20 via-omega-surface to-omega-purple/15 px-6 pt-8 pb-10 shadow-lg shadow-omega-gold/40">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-omega-gold/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-omega-purple/15 rounded-full blur-[60px] pointer-events-none" />

        {/* Back button */}
        <div className="relative mb-5">
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
        </div>

        {/* Title */}
        <div className="relative text-center space-y-1">
          <h1 className="text-3xl font-black tracking-tight neon-gold">RANKING</h1>
          <p className="text-sm text-omega-muted">Copa Omega Star — Bladers Santa Fe</p>
        </div>

        {/* Stats strip inside hero */}
        <div className="relative flex items-center justify-around rounded-xl bg-omega-dark/60 border border-white/[0.06] py-2.5 px-2 mt-6">
          <div className="flex items-center gap-1.5 text-sm">
            <Trophy className="size-3.5 text-omega-gold" />
            <span className="font-bold text-omega-gold">{leaderboard.length}</span>
            <span className="text-omega-muted text-xs">bladers</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-sm">
            <Swords className="size-3.5 text-omega-blue" />
            <span className="font-bold text-omega-blue">{matches.length}</span>
            <span className="text-omega-muted text-xs">partidas recientes</span>
          </div>
          {tournamentRanking.length > 0 && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5 text-sm">
                <Medal className="size-3.5 text-omega-purple" />
                <span className="font-bold text-omega-purple">{tournamentRanking.length}</span>
                <span className="text-omega-muted text-xs">en torneos</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Empty state */}
      {leaderboard.length === 0 && (
        <div className="mx-4 omega-card p-12 text-center space-y-4">
          <Trophy className="size-16 text-omega-muted/30 mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-bold text-omega-muted">No hay jugadores todavia</p>
            <p className="text-sm text-omega-muted/70">Registrate para ser el primero en la tabla</p>
          </div>
          <Link href="/auth/register" className="omega-btn omega-btn-primary px-6 py-3">
            <Star className="size-4" />
            Registrarme
          </Link>
        </div>
      )}

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 px-4">
          <PodiumCard player={leaderboard[1]} rank={2} streak={streaks.get(leaderboard[1].id)} />
          <PodiumCard player={leaderboard[0]} rank={1} streak={streaks.get(leaderboard[0].id)} />
          <PodiumCard player={leaderboard[2]} rank={3} streak={streaks.get(leaderboard[2].id)} />
        </div>
      )}

      {/* If only 1 or 2 players, show them inline */}
      {leaderboard.length > 0 && leaderboard.length < 3 && (
        <div className="flex justify-center gap-4 px-4">
          {leaderboard.slice(0, 3).map((player, i) => (
            <div key={player.id} className="w-48">
              <PodiumCard player={player} rank={(i + 1) as 1 | 2 | 3} streak={streaks.get(player.id)} />
            </div>
          ))}
        </div>
      )}

      {/* Full leaderboard table */}
      {leaderboard.length > 0 && (() => {
        const hasPodium = leaderboard.length >= 3;
        const tableStart = hasPodium ? 3 : 0;
        const tablePlayers = leaderboard.slice(tableStart);
        if (tablePlayers.length === 0) return null;

        return (
          <div className="px-4 space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-omega-purple" />
                <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Tabla completa</h2>
              </div>
              <span className="omega-badge omega-badge-purple">{tablePlayers.length}</span>
            </div>

            {/* List rows with border-l-4 */}
            <div className="space-y-2">
              {tablePlayers.map((player, index) => {
                const rank = tableStart + index + 1;
                const streak = streaks.get(player.id);
                const isTop16 = rank <= 16;
                return (
                  <Link
                    href={`/player/${player.id}`}
                    key={player.id}
                    className={`rounded-xl border-l-4 ${isTop16 ? "border-l-omega-purple" : "border-l-omega-border"} bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3 ${player.is_eliminated ? "opacity-60" : ""}`}
                  >
                    {/* Rank */}
                    <span className="text-sm font-black text-omega-muted/70 w-6 text-center shrink-0">
                      {rank}
                    </span>

                    {/* Avatar */}
                    <div className="size-9 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
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
                        <span className={`text-sm font-bold truncate ${player.is_eliminated ? "text-omega-muted line-through" : "text-omega-text"}`}>
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
                      <span className="text-sm font-black text-omega-gold">{player.stars}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Tournament Points Ranking */}
      {tournamentRanking.length > 0 && (
        <div className="px-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Medal className="size-4 text-omega-gold" />
              <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Ranking de Torneos</h2>
            </div>
            <span className="omega-badge omega-badge-gold">{tournamentRanking.length}</span>
          </div>

          {/* List rows with border-l-4 */}
          <div className="space-y-2">
            {tournamentRanking.map((entry, index) => {
              const borderColor = index === 0 ? "border-l-omega-gold" : index === 1 ? "border-l-gray-400" : index === 2 ? "border-l-orange-500" : "border-l-omega-border";
              return (
                <Link
                  key={entry.id}
                  href={`/player/${entry.id}`}
                  className={`rounded-xl border-l-4 ${borderColor} bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3`}
                >
                  {/* Rank */}
                  <span className={`text-sm font-black w-6 text-center shrink-0 ${
                    index === 0 ? "text-omega-gold" : index === 1 ? "text-omega-muted" : index === 2 ? "text-orange-500" : "text-omega-muted/70"
                  }`}>
                    {index + 1}
                  </span>

                  {/* Avatar */}
                  <div className="size-9 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                        {entry.alias.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Alias */}
                  <span className="text-sm font-bold text-omega-text flex-1 truncate">
                    {index === 0 && <Crown className="size-3 text-omega-gold inline mr-1" />}
                    {entry.alias}
                  </span>

                  {/* Points */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm font-black text-omega-gold">{entry.total}</span>
                    <span className="text-[10px] text-omega-muted">pts</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent matches */}
      {matches.length > 0 && (
        <div className="px-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="size-4 text-omega-blue" />
              <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Ultimas partidas</h2>
            </div>
            <span className="omega-badge omega-badge-blue">{matches.length}</span>
          </div>

          {/* Match rows with border-l-4 */}
          <div className="space-y-2">
            {matches.map((match) => {
              const p1 = match.player1 as unknown as { alias: string } | null;
              const p2 = match.player2 as unknown as { alias: string } | null;
              const p1Won = match.winner_id === match.player1_id;

              return (
                <div
                  key={match.id}
                  className="rounded-xl border-l-4 border-l-omega-blue bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3"
                >
                  {/* Player 1 */}
                  <span className={`text-sm font-bold truncate flex-1 text-right ${p1Won ? "text-omega-green" : "text-omega-muted"}`}>
                    {p1Won && <Crown className="size-3 text-omega-gold inline mr-1" />}
                    {p1?.alias ?? "???"}
                  </span>

                  {/* VS + stars */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="omega-badge omega-badge-gold">
                      <Star className="size-3 text-omega-gold fill-omega-gold mr-0.5" />
                      {match.stars_bet}
                    </span>
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
    aura: "aura-gold",
    starClass: "text-omega-gold",
    label: "neon-gold",
    height: "pt-2",
    avatarBorder: "border-omega-gold",
    icon: <Crown className="size-6 text-omega-gold fill-omega-gold/30" />,
    gradient: "from-omega-gold/20 to-omega-gold/5",
  },
  2: {
    aura: "aura-silver",
    starClass: "text-omega-muted",
    label: "text-omega-muted",
    height: "pt-6",
    avatarBorder: "border-omega-muted/50",
    icon: <Crown className="size-5 text-omega-muted/70" />,
    gradient: "from-gray-400/15 to-gray-500/5",
  },
  3: {
    aura: "aura-bronze",
    starClass: "text-orange-500",
    label: "text-orange-500",
    height: "pt-8",
    avatarBorder: "border-orange-500/50",
    icon: <Crown className="size-5 text-orange-500/70" />,
    gradient: "from-orange-500/15 to-orange-600/5",
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
        className={`group rounded-2xl bg-gradient-to-br ${config.gradient} ${config.aura} p-4 block text-center space-y-2 shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
      >
        {/* Crown */}
        <div className="flex justify-center">{config.icon}</div>

        {/* Avatar */}
        <div className={`size-14 rounded-full border-2 ${config.avatarBorder} overflow-hidden bg-omega-dark mx-auto`}>
          {player.avatar_url ? (
            <img src={player.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center text-lg font-black text-omega-purple">
              {player.alias.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Alias */}
        <p className={`text-sm font-black truncate ${player.is_eliminated ? "text-omega-muted line-through" : "text-omega-text"}`}>
          {player.alias}
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-1">
          <Star className={`size-4 ${config.starClass} ${rank === 1 ? "star-glow fill-omega-gold" : ""}`} />
          <span className={`text-xl font-black ${config.label}`}>{player.stars}</span>
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
