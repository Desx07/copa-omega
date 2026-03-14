import Link from "next/link";
import {
  Star,
  Swords,
  Flame,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BADGE_EMOJIS, ACCENT_COLORS } from "@/lib/titles";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [playerResult, matchesResult, allPlayersResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, full_name, alias, stars, wins, losses, is_eliminated, avatar_url, tagline, badge, accent_color, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("matches")
      .select("id, player1_id, player2_id, winner_id, stars_bet, completed_at, player1:players!player1_id(alias), player2:players!player2_id(alias)")
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("players")
      .select("id")
      .eq("is_hidden", false)
      .order("stars", { ascending: false })
      .order("wins", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  const player = playerResult.data;
  if (!player) return null;

  const matches = matchesResult.data ?? [];
  const allPlayers = allPlayersResult.data ?? [];
  const rank = allPlayers.findIndex((p) => p.id === user.id) + 1;

  let currentStreak = 0;
  for (const m of matches) {
    if (m.winner_id === user.id) currentStreak++;
    else break;
  }

  const winRate = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;

  const accentConfig = ACCENT_COLORS[player.accent_color] || ACCENT_COLORS.purple;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">
      {/* Player card */}
      <div className="relative overflow-hidden rounded-2xl border border-omega-purple/20 bg-gradient-to-br from-omega-card/60 to-omega-card/30 p-5 backdrop-blur-sm">
        <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-omega-purple/60 to-transparent" />
        <div className="flex items-center gap-4">
          <Link href="/profile" className={`size-16 rounded-full border-2 ${accentConfig.border} overflow-hidden bg-omega-dark shrink-0`}>
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.alias} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-2xl font-black text-omega-purple">
                {player.alias.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-omega-text truncate">
              {player.badge && <span className="mr-1">{BADGE_EMOJIS[player.badge]}</span>}
              {player.alias}
            </p>
            {player.tagline && (
              <p className="text-xs text-omega-muted/80 italic truncate">&ldquo;{player.tagline}&rdquo;</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              {rank > 0 && <span className="text-xs text-omega-gold font-bold">#{rank}</span>}
              <span className="text-xs text-omega-muted">
                <span className="text-omega-green font-bold">{player.wins}W</span>
                {" / "}
                <span className="text-omega-red font-bold">{player.losses}L</span>
              </span>
              {winRate > 0 && <span className="text-xs text-omega-blue font-bold">{winRate}%</span>}
            </div>
          </div>

          <div className="text-center shrink-0">
            <div className="flex items-center gap-1">
              <Star className="size-6 text-omega-gold fill-omega-gold star-glow" />
              <span className="text-3xl font-black neon-gold">{player.stars}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Streak */}
      {currentStreak >= 2 && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-omega-green/10 border border-omega-green/20 py-2 px-4">
          <Flame className="size-4 text-omega-green" />
          <span className="text-sm font-bold text-omega-green">Racha de {currentStreak} victorias!</span>
        </div>
      )}

      {/* Tournament progress */}
      <div className="rounded-xl border border-omega-border/40 bg-omega-card/30 backdrop-blur-sm p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-omega-muted uppercase tracking-wider font-bold">Clasificación</span>
          <span className="text-omega-gold font-bold">Top 16</span>
        </div>
        <div className="h-2 rounded-full bg-omega-dark overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-omega-purple to-omega-blue transition-all"
            style={{ width: `${allPlayers.length > 0 ? Math.max(5, Math.min(100, ((allPlayers.length - rank + 1) / allPlayers.length) * 100)) : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-omega-muted">
          <span>Posición <span className="text-omega-gold font-bold">#{rank}</span> de {allPlayers.length}</span>
          <span>{rank > 0 && rank <= 16 ? <span className="text-omega-green font-bold">Clasificado</span> : <span className="text-omega-red">Fuera del top 16</span>}</span>
        </div>
      </div>

      {/* Recent matches */}
      <div className="rounded-2xl border border-omega-border bg-omega-card/40 backdrop-blur-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-omega-border bg-omega-card/60">
          <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
            <Swords className="size-4 text-omega-blue" />
            Mis ultimas batallas
          </h2>
        </div>

        {matches.length === 0 ? (
          <div className="p-8 text-center">
            <Swords className="size-8 text-omega-muted/30 mx-auto mb-2" />
            <p className="text-sm text-omega-muted/70">Todavía no tenés batallas</p>
          </div>
        ) : (
          <div className="divide-y divide-omega-border/30">
            {matches.map((match) => {
              const won = match.winner_id === user.id;
              const isPlayer1 = match.player1_id === user.id;
              const opponent = isPlayer1 ? match.player2 : match.player1;
              const opponentAlias = (opponent as unknown as { alias: string })?.alias ?? "???";

              return (
                <div key={match.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      won
                        ? "bg-omega-green/10 border border-omega-green/30 text-omega-green"
                        : "bg-omega-red/10 border border-omega-red/30 text-omega-red"
                    }`}
                  >
                    {won ? "W" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-omega-text truncate">vs {opponentAlias}</p>
                    <p className="text-[11px] text-omega-muted">
                      {match.completed_at
                        ? new Date(match.completed_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                        : ""}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 shrink-0 ${won ? "text-omega-green" : "text-omega-red"}`}>
                    <span className="text-sm font-black">{won ? "+" : "-"}{match.stars_bet}</span>
                    <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
