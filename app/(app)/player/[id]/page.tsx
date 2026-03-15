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
import TournamentBadgesDisplay from "@/app/_components/tournament-badges-display";
import PodiumCardsAccordion from "@/app/_components/podium-cards-accordion";

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

  const [playerResult, beysResult, matchesResult, badgesResult, tournamentBadgesResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, full_name, alias, stars, wins, losses, is_eliminated, is_judge, avatar_url, created_at, tagline, hide_beys, badge, accent_color, profile_card_url")
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
    supabase
      .from("tournament_badges")
      .select("position, card_image_url, tournament:tournaments!tournament_id(name, logo_url)")
      .eq("player_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!playerResult.data) {
    notFound();
  }

  const player = playerResult.data;
  const beys = beysResult.data ?? [];
  const matches = matchesResult.data ?? [];
  const earnedBadgeIds = (badgesResult.data ?? []).map((b) => b.badge_id);
  const tournamentBadges = (tournamentBadgesResult.data ?? []).map((tb) => {
    const tournament = tb.tournament as unknown as { name: string; logo_url: string | null };
    return {
      tournament_name: tournament?.name ?? "Torneo",
      logo_url: tournament?.logo_url ?? null,
      position: tb.position,
      card_image_url: (tb as unknown as { card_image_url: string | null }).card_image_url ?? null,
    };
  });

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
  const accentConfig = ACCENT_COLORS[(player as unknown as { accent_color: string }).accent_color] || ACCENT_COLORS.purple;
  const memberSince = new Date(player.created_at).toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-md pb-10 space-y-5">
      {/* ═══ HERO BANNER ═══ */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-purple/30 via-omega-surface to-omega-blue/15 px-6 pt-8 pb-10 shadow-lg shadow-omega-purple/40">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-omega-purple/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-omega-blue/15 rounded-full blur-[60px] pointer-events-none" />

        {/* Back button */}
        <div className="relative mb-5">
          <Link href="/ranking" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors">
            <ArrowLeft className="size-4" />
            Volver al ranking
          </Link>
        </div>

        {/* Avatar centered */}
        <div className="relative flex flex-col items-center">
          <div className={`size-28 rounded-full border-2 ${accentConfig.border} overflow-hidden bg-omega-dark ring-4 ring-omega-card shadow-lg`}>
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.alias} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-3xl font-black text-omega-purple">
                {player.alias.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + badge */}
          <p className="text-xl font-black text-omega-text mt-3">
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

          {player.is_eliminated && (
            <span className="omega-badge omega-badge-red mt-2">ELIMINADO</span>
          )}
        </div>

        {/* Stats strip inside hero */}
        <div className="relative flex items-center justify-around rounded-xl bg-omega-dark/60 border border-white/[0.06] py-2.5 px-2 mt-5">
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="size-3.5 text-omega-gold fill-omega-gold star-glow" />
            <span className="text-xl font-black neon-gold">{player.stars}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-omega-green">{player.wins}W</span>
            <span className="text-omega-muted/50">/</span>
            <span className="font-bold text-omega-red">{player.losses}L</span>
          </div>
          {winRate > 0 && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <span className="font-bold text-omega-blue text-sm">{winRate}%</span>
            </>
          )}
        </div>

        {/* Streaks inside hero */}
        {(currentStreak > 0 || bestStreak > 0) && (
          <div className="relative flex items-center justify-center gap-3 mt-3">
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

        <p className="relative text-[11px] text-omega-muted/60 flex items-center justify-center gap-1 mt-3">
          <Calendar className="size-3" />
          Blader desde {memberSince}
        </p>
      </div>

      {/* Tournament Winner Badges */}
      {tournamentBadges.length > 0 && (
        <div className="px-4">
          <TournamentBadgesDisplay badges={tournamentBadges} />
        </div>
      )}

      {/* Badges / Achievements */}
      {earnedBadgeIds.length > 0 && (
        <div className="px-4">
          <BadgesDisplay earnedBadgeIds={earnedBadgeIds} />
        </div>
      )}

      {/* ═══ PROFILE CARD (ficha de perfil) ═══ */}
      {(player as unknown as { profile_card_url: string | null }).profile_card_url && (
        <div className="px-4">
          <div className="omega-card shadow-sm overflow-hidden">
            <div className="omega-section-header">
              <Trophy className="size-4 text-omega-purple" />
              Ficha de jugador
            </div>
            <img
              src={(player as unknown as { profile_card_url: string }).profile_card_url}
              alt={`Ficha de ${player.alias}`}
              className="w-full object-contain"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* ═══ PODIUM CARDS (tarjetas de podio por torneo) ═══ */}
      {tournamentBadges.some((b) => b.card_image_url) && (
        <div className="px-4">
          <PodiumCardsAccordion badges={tournamentBadges.filter((b) => b.card_image_url)} />
        </div>
      )}

      {/* ═══ BEYS ═══ */}
      {!(player as unknown as { hide_beys: boolean }).hide_beys && beys.length > 0 && (
        <div className="px-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="size-4 text-omega-purple" />
              <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Beys</h2>
            </div>
            <span className="omega-badge omega-badge-purple">{beys.length}</span>
          </div>

          {/* Bey rows with border-l-4 */}
          <div className="space-y-2">
            {beys.map((bey) => {
              const config = beyTypeConfig[bey.type as keyof typeof beyTypeConfig];
              const Icon = config.icon;
              const borderColor =
                bey.type === "attack" ? "border-l-omega-red" :
                bey.type === "defense" ? "border-l-omega-blue" :
                bey.type === "stamina" ? "border-l-omega-green" :
                "border-l-omega-purple";
              return (
                <div
                  key={bey.id}
                  className={`rounded-xl border-l-4 ${borderColor} bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3`}
                >
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

      {/* ═══ MATCH HISTORY ═══ */}
      {matches.length > 0 && (
        <div className="px-4 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-omega-purple" />
              <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Historial de partidas</h2>
            </div>
            <span className="omega-badge omega-badge-purple">{matches.length}</span>
          </div>

          {/* Match rows with border-l-4 */}
          <div className="space-y-2">
            {matches.map((match) => {
              const won = match.winner_id === id;
              const isPlayer1 = match.player1_id === id;
              const opponent = isPlayer1 ? match.player2 : match.player1;
              const opponentAlias = (opponent as unknown as { alias: string })?.alias ?? "???";

              return (
                <div
                  key={match.id}
                  className={`rounded-xl border-l-4 ${won ? "border-l-omega-green" : "border-l-omega-red"} bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3`}
                >
                  {/* Result indicator */}
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      won
                        ? "bg-omega-green/20 border border-omega-green/40 text-omega-green"
                        : "bg-omega-red/20 border border-omega-red/40 text-omega-red"
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
