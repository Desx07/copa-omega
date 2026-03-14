import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Star,
  Trophy,
  Swords,
  Shield,
  User,
  Crown,
  ArrowRight,
  Flame,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/app/_components/logout-button";
import { BADGE_EMOJIS, ACCENT_COLORS } from "@/lib/titles";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch player, recent matches, and rank in parallel
  const [playerResult, matchesResult, allPlayersResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, full_name, alias, stars, wins, losses, is_eliminated, avatar_url, tagline, badge, accent_color, is_admin, created_at")
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
  if (!player) redirect("/auth/login");

  const matches = matchesResult.data ?? [];
  const allPlayers = allPlayersResult.data ?? [];
  const rank = allPlayers.findIndex((p) => p.id === user.id) + 1;
  const isAdmin = player.is_admin;

  // Current streak
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
    <div className="min-h-screen bg-omega-black">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-omega-purple)_0%,_transparent_60%)] opacity-10 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--color-omega-blue)_0%,_transparent_50%)] opacity-5 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-lg px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black neon-gold">COPA OMEGA STAR</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin/matches"
                className="flex items-center gap-1.5 rounded-lg border border-omega-border bg-omega-card/60 px-3 py-1.5 text-xs font-medium text-omega-muted hover:text-omega-blue hover:border-omega-blue/50 transition-all"
              >
                <Shield className="size-3.5" />
                Admin
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        {/* Player card */}
        <div className="rounded-2xl border border-omega-border bg-omega-card/60 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Link href="/profile" className={`size-16 rounded-full border-2 ${accentConfig.border} overflow-hidden bg-omega-dark shrink-0`}>
              {player.avatar_url ? (
                <img src={player.avatar_url} alt={player.alias} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-2xl font-black text-omega-purple">
                  {player.alias.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-omega-text truncate">
                {player.badge && <span className="mr-1">{BADGE_EMOJIS[player.badge]}</span>}
                {player.alias}
              </p>
              {player.tagline && (
                <p className="text-xs text-omega-muted/80 italic truncate">&ldquo;{player.tagline}&rdquo;</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                {rank > 0 && (
                  <span className="text-xs text-omega-gold font-bold">#{rank}</span>
                )}
                <span className="text-xs text-omega-muted">
                  <span className="text-omega-green font-bold">{player.wins}W</span>
                  {" / "}
                  <span className="text-omega-red font-bold">{player.losses}L</span>
                </span>
                {winRate > 0 && (
                  <span className="text-xs text-omega-blue font-bold">{winRate}%</span>
                )}
              </div>
            </div>

            {/* Stars */}
            <div className="text-center shrink-0">
              <div className="flex items-center gap-1">
                <Star className="size-5 text-omega-gold fill-omega-gold star-glow" />
                <span className="text-2xl font-black text-omega-gold">{player.stars}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {currentStreak >= 2 && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-omega-green/10 border border-omega-green/20 py-2 px-4">
            <Flame className="size-4 text-omega-green" />
            <span className="text-sm font-bold text-omega-green">Racha de {currentStreak} victorias!</span>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/ranking"
            className="flex items-center gap-3 rounded-xl border border-omega-border bg-omega-card/40 p-4 hover:border-omega-gold/40 hover:bg-omega-card/60 transition-all group"
          >
            <div className="size-10 rounded-lg bg-omega-gold/10 flex items-center justify-center">
              <Trophy className="size-5 text-omega-gold" />
            </div>
            <div>
              <p className="text-sm font-bold text-omega-text">Ranking</p>
              <p className="text-[11px] text-omega-muted">Ver tabla</p>
            </div>
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl border border-omega-border bg-omega-card/40 p-4 hover:border-omega-purple/40 hover:bg-omega-card/60 transition-all group"
          >
            <div className="size-10 rounded-lg bg-omega-purple/10 flex items-center justify-center">
              <User className="size-5 text-omega-purple" />
            </div>
            <div>
              <p className="text-sm font-bold text-omega-text">Mi Perfil</p>
              <p className="text-[11px] text-omega-muted">Editar</p>
            </div>
          </Link>
        </div>

        {/* Recent matches */}
        <div className="rounded-2xl border border-omega-border bg-omega-card/40 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-omega-border bg-omega-card/60 flex items-center justify-between">
            <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
              <Swords className="size-4 text-omega-blue" />
              Mis ultimas batallas
            </h2>
          </div>

          {matches.length === 0 ? (
            <div className="p-8 text-center">
              <Swords className="size-8 text-omega-muted/30 mx-auto mb-2" />
              <p className="text-sm text-omega-muted/70">Todavia no tenes batallas</p>
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

        {/* Top 3 preview */}
        {allPlayers.length >= 3 && (
          <Link
            href="/ranking"
            className="flex items-center justify-between rounded-xl border border-omega-border bg-omega-card/40 p-4 hover:border-omega-gold/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Crown className="size-5 text-omega-gold" />
              <span className="text-sm font-bold text-omega-text">Ver ranking completo</span>
            </div>
            <ArrowRight className="size-4 text-omega-muted group-hover:text-omega-gold group-hover:translate-x-1 transition-all" />
          </Link>
        )}
      </div>
    </div>
  );
}
