import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Swords,
  ArrowLeft,
  ShieldHalf,
  Timer,
  Scale,
  Trophy,
  Flame,
  Crown,
  Calendar,
} from "lucide-react";
import { BADGE_EMOJIS, ACCENT_COLORS } from "@/lib/titles";
import BadgesDisplay from "@/app/_components/badges-display";

const beyTypeConfig = {
  attack: { label: "Ataque", icon: Swords, color: "text-omega-red", bg: "bg-omega-red/10 border-omega-red/30" },
  defense: { label: "Defensa", icon: ShieldHalf, color: "text-omega-blue", bg: "bg-omega-blue/10 border-omega-blue/30" },
  stamina: { label: "Stamina", icon: Timer, color: "text-omega-green", bg: "bg-omega-green/10 border-omega-green/30" },
  balance: { label: "Balance", icon: Scale, color: "text-omega-purple", bg: "bg-omega-purple/10 border-omega-purple/30" },
} as const;

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [playerResult, beysResult, matchesResult, badgesResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, full_name, alias, stars, wins, losses, is_eliminated, is_judge, avatar_url, created_at, tagline, hide_beys, badge, accent_color")
      .eq("id", id)
      .eq("is_hidden", false)
      .single(),
    supabase
      .from("beys")
      .select("id, name, type")
      .eq("player_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("matches")
      .select("id, player1_id, player2_id, winner_id, stars_bet, status, completed_at, player1:players!player1_id(alias, avatar_url), player2:players!player2_id(alias, avatar_url)")
      .or(`player1_id.eq.${id},player2_id.eq.${id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(20),
    supabase
      .from("player_badges")
      .select("badge_id")
      .eq("player_id", id),
  ]);

  if (!playerResult.data) {
    notFound();
  }

  const player = playerResult.data;
  const beys = beysResult.data ?? [];
  const matches = matchesResult.data ?? [];
  const earnedBadgeIds = (badgesResult.data ?? []).map((b) => b.badge_id);

  // Calculate win streak
  let currentStreak = 0;
  for (const match of matches) {
    if (match.winner_id === id) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate best streak ever
  let bestStreak = 0;
  let tempStreak = 0;
  // Reverse to go chronologically
  const chronological = [...matches].reverse();
  for (const match of chronological) {
    if (match.winner_id === id) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  const winRate = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;

  // Rank among visible players
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id")
    .eq("is_hidden", false)
    .order("stars", { ascending: false })
    .order("wins", { ascending: false })
    .order("created_at", { ascending: true });

  const rank = allPlayers ? allPlayers.findIndex((p) => p.id === id) + 1 : 0;

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-6">
        {/* Back */}
        <Link href="/ranking" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors">
          <ArrowLeft className="size-4" />
          Volver al ranking
        </Link>

        {/* Player card */}
        <div className="omega-card-elevated p-6 text-center space-y-4">
          {/* Avatar */}
          {(() => {
            const ac = ACCENT_COLORS[(player as unknown as { accent_color: string }).accent_color] || ACCENT_COLORS.purple;
            return (
              <div className={`size-32 rounded-full border-2 ${ac.border} overflow-hidden bg-omega-dark mx-auto`}>
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.alias} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-3xl font-black text-omega-purple">
                    {player.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Name, badge, title */}
          <div>
            <p className="text-lg font-black text-omega-text">
              {(player as unknown as { badge: string | null }).badge && (
                <span className="mr-1">{BADGE_EMOJIS[(player as unknown as { badge: string }).badge]}</span>
              )}
              {player.alias}
            </p>
            {rank > 0 && (
              <p className="text-xs text-omega-muted mt-1">
                Ranking <span className="text-omega-gold font-bold">#{rank}</span>
              </p>
            )}
            {player.is_judge && (
              <span className="omega-badge omega-badge-gold mt-2 inline-flex gap-1.5">
                <Scale className="size-3.5 text-omega-gold" />
                Juez Oficial
              </span>
            )}
            {(player as unknown as { tagline: string | null }).tagline && (
              <p className="text-sm text-omega-muted/80 italic mt-2">
                &ldquo;{(player as unknown as { tagline: string }).tagline}&rdquo;
              </p>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-omega-surface p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                <span className="text-xl font-black text-omega-gold">{player.stars}</span>
              </div>
              <p className="text-[10px] text-omega-muted">estrellas</p>
            </div>
            <div className="rounded-xl bg-omega-surface p-3 text-center">
              <p className="text-xl font-black">
                <span className="text-omega-green">{player.wins}</span>
                <span className="text-omega-muted/40">/</span>
                <span className="text-omega-red">{player.losses}</span>
              </p>
              <p className="text-[10px] text-omega-muted">W / L</p>
            </div>
            <div className="rounded-xl bg-omega-surface p-3 text-center">
              <p className="text-xl font-black text-omega-blue">{winRate}%</p>
              <p className="text-[10px] text-omega-muted">win rate</p>
            </div>
          </div>

          {/* Streaks */}
          {(currentStreak > 0 || bestStreak > 0) && (
            <div className="flex items-center justify-center gap-4 text-sm">
              {currentStreak > 0 && (
                <span className="omega-badge omega-badge-green gap-1.5 px-3 py-1">
                  <Flame className="size-3.5 text-omega-green" />
                  <span className="font-bold">{currentStreak}</span>
                  <span className="text-omega-muted text-xs">racha actual</span>
                </span>
              )}
              {bestStreak > 1 && (
                <span className="omega-badge omega-badge-gold gap-1.5 px-3 py-1">
                  <Crown className="size-3.5 text-omega-gold" />
                  <span className="font-bold">{bestStreak}</span>
                  <span className="text-omega-muted text-xs">mejor racha</span>
                </span>
              )}
            </div>
          )}

          {/* Member since */}
          <p className="text-[11px] text-omega-muted/60 flex items-center justify-center gap-1">
            <Calendar className="size-3" />
            Blader desde {new Date(player.created_at).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
          </p>

          {player.is_eliminated && (
            <span className="omega-badge omega-badge-red">ELIMINADO</span>
          )}
        </div>

        {/* Badges / Achievements */}
        {earnedBadgeIds.length > 0 && (
          <BadgesDisplay earnedBadgeIds={earnedBadgeIds} />
        )}

        {/* Beys -- hidden if player chose to hide */}
        {!(player as unknown as { hide_beys: boolean }).hide_beys && beys.length > 0 && (
          <div className="omega-card">
            <div className="omega-section-header">
              <Swords className="size-4 text-omega-purple" />
              Beys
            </div>
            <div>
              {beys.map((bey) => {
                const config = beyTypeConfig[bey.type as keyof typeof beyTypeConfig];
                const Icon = config.icon;
                return (
                  <div key={bey.id} className="omega-row">
                    <div className={`size-8 rounded-lg border flex items-center justify-center ${config.bg}`}>
                      <Icon className={`size-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">{bey.name}</p>
                      <p className={`text-[11px] font-medium ${config.color}`}>{config.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Match history */}
        {matches.length > 0 && (
          <div className="omega-card">
            <div className="omega-section-header">
              <Trophy className="size-4 text-omega-purple" />
              Historial de partidas
            </div>
            <div>
              {matches.map((match) => {
                const won = match.winner_id === id;
                const isPlayer1 = match.player1_id === id;
                const opponent = isPlayer1 ? match.player2 : match.player1;
                const opponentAlias = (opponent as unknown as { alias: string })?.alias ?? "???";

                return (
                  <div
                    key={match.id}
                    className="omega-row"
                  >
                    {/* Result indicator */}
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        won
                          ? "bg-omega-green/10 border border-omega-green/30 text-omega-green"
                          : "bg-omega-red/10 border border-omega-red/30 text-omega-red"
                      }`}
                    >
                      {won ? "W" : "L"}
                    </div>

                    {/* Opponent */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">
                        vs {opponentAlias}
                      </p>
                      <p className="text-[11px] text-omega-muted">
                        {match.completed_at
                          ? new Date(match.completed_at).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "short",
                            })
                          : ""}
                      </p>
                    </div>

                    {/* Stars */}
                    <div className={`flex items-center gap-1 shrink-0 ${won ? "text-omega-green" : "text-omega-red"}`}>
                      <span className="text-sm font-black">
                        {won ? "+" : "-"}{match.stars_bet}
                      </span>
                      <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}
