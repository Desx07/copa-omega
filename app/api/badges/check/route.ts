import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkBadges, BADGE_DEFINITIONS, type PlayerStats } from "@/lib/badges";

/**
 * POST /api/badges/check
 * Body: { player_id: string }
 *
 * Checks if a player has earned new badges based on current stats.
 * Inserts newly unlocked badges into player_badges.
 * Returns the list of newly unlocked badge IDs.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the caller is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { player_id } = body;

    if (!player_id || typeof player_id !== "string") {
      return Response.json(
        { error: "Falta campo: player_id" },
        { status: 400 }
      );
    }

    // Validar que player_id sea un UUID valido para evitar inyeccion en .or()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(player_id)) {
      return Response.json(
        { error: "player_id no es un UUID valido" },
        { status: 400 }
      );
    }

    // Only allow checking own badges or admin checking any
    const { data: currentPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (player_id !== user.id && !currentPlayer?.is_admin) {
      return Response.json(
        { error: "Solo podés verificar tus propias medallas" },
        { status: 403 }
      );
    }

    // Fetch the player's stats
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("wins, losses, current_login_streak")
      .eq("id", player_id)
      .single();

    if (playerError || !player) {
      return Response.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    // Calculate current streak from recent matches
    const { data: recentMatches } = await supabase
      .from("matches")
      .select("winner_id, player1_id, player2_id")
      .or(`player1_id.eq.${player_id},player2_id.eq.${player_id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    let currentStreak = 0;
    for (const m of recentMatches ?? []) {
      if (m.winner_id === player_id) currentStreak++;
      else break;
    }

    // Also check streak from tournament matches
    const { data: recentTournamentMatches } = await supabase
      .from("tournament_matches")
      .select("winner_id, player1_id, player2_id")
      .or(`player1_id.eq.${player_id},player2_id.eq.${player_id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    let tournamentStreak = 0;
    for (const m of recentTournamentMatches ?? []) {
      if (m.winner_id === player_id) tournamentStreak++;
      else break;
    }

    // Use the higher streak
    const bestStreak = Math.max(currentStreak, tournamentStreak);

    // Count tournaments won (player was the winner of a completed tournament)
    // For single_elimination: winner of the final match
    // For round_robin/swiss: top points
    const { data: completedTournaments } = await supabase
      .from("tournament_participants")
      .select("tournament_id, points, tournament_wins, tournament:tournaments!tournament_id(status, format)")
      .eq("player_id", player_id);

    let tournamentsWon = 0;
    let tournamentsPlayed = 0;

    if (completedTournaments) {
      for (const tp of completedTournaments) {
        const tournament = tp.tournament as unknown as {
          status: string;
          format: string;
        };
        if (!tournament) continue;
        tournamentsPlayed++;

        if (tournament.status === "completed") {
          if (tournament.format === "single_elimination") {
            // Check if player won the final
            const { data: finalMatch } = await supabase
              .from("tournament_matches")
              .select("winner_id")
              .eq("tournament_id", tp.tournament_id)
              .eq("bracket_position", "F")
              .single();

            if (finalMatch?.winner_id === player_id) {
              tournamentsWon++;
            }
          } else {
            // For round_robin/swiss: check if player has the most points
            const { data: topParticipant } = await supabase
              .from("tournament_participants")
              .select("player_id")
              .eq("tournament_id", tp.tournament_id)
              .order("points", { ascending: false })
              .limit(1)
              .single();

            if (topParticipant?.player_id === player_id) {
              tournamentsWon++;
            }
          }
        }
      }
    }

    // Calculate max wins in a single tournament (for executioner badge)
    // Counts ALL wins across all stages (swiss/round robin + elimination bracket)
    let maxEliminations = 0;
    if (completedTournaments) {
      for (const tp of completedTournaments) {
        const { count } = await supabase
          .from("tournament_matches")
          .select("id", { count: "exact", head: true })
          .eq("tournament_id", tp.tournament_id)
          .eq("winner_id", player_id)
          .eq("status", "completed");

        if ((count ?? 0) > maxEliminations) {
          maxEliminations = count ?? 0;
        }
      }
    }

    // ── Queries for new badge stats (run in parallel) ──
    const adminSupabaseForQueries = createAdminClient();

    const [
      chatMessagesResult,
      challengesSentResult,
      beysCountResult,
      pollVotesResult,
      maxComboUpvotesResult,
      predictionsForStreakResult,
    ] = await Promise.all([
      // chat_messages_count
      adminSupabaseForQueries
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("player_id", player_id),
      // challenges_sent
      adminSupabaseForQueries
        .from("challenges")
        .select("id", { count: "exact", head: true })
        .eq("challenger_id", player_id),
      // beys_count
      adminSupabaseForQueries
        .from("beys")
        .select("id", { count: "exact", head: true })
        .eq("player_id", player_id),
      // poll_votes_count
      adminSupabaseForQueries
        .from("poll_votes")
        .select("id", { count: "exact", head: true })
        .eq("player_id", player_id),
      // max_combo_upvotes: get the max upvotes from shared_combos
      adminSupabaseForQueries
        .from("shared_combos")
        .select("upvotes")
        .eq("player_id", player_id)
        .order("upvotes", { ascending: false })
        .limit(1),
      // consecutive correct predictions (most recent resolved, ordered desc)
      adminSupabaseForQueries
        .from("predictions")
        .select("is_correct")
        .eq("predictor_id", player_id)
        .not("is_correct", "is", null)
        .order("created_at", { ascending: false }),
    ]);

    // Calculate consecutive correct predictions from most recent
    let consecutiveCorrectPredictions = 0;
    if (predictionsForStreakResult.data) {
      for (const p of predictionsForStreakResult.data) {
        if (p.is_correct === true) consecutiveCorrectPredictions++;
        else break;
      }
    }

    // Check had_losing_streak_3_then_won: check each match source independently
    // (both arrays are sorted desc by completed_at)
    let hadLosingStreak3ThenWon = false;
    const checkPhoenix = (matches: { winner_id: string | null }[], pid: string): boolean => {
      // Find any position where match[i] is a win and matches[i+1..i+3] are all losses
      for (let i = 0; i < matches.length - 3; i++) {
        if (
          matches[i].winner_id === pid &&
          matches[i + 1].winner_id !== pid &&
          matches[i + 2].winner_id !== pid &&
          matches[i + 3].winner_id !== pid
        ) {
          return true;
        }
      }
      return false;
    };
    hadLosingStreak3ThenWon =
      checkPhoenix(recentMatches ?? [], player_id) ||
      checkPhoenix(recentTournamentMatches ?? [], player_id);

    // Check beat_double_stars_opponent: look at completed matches where player won
    // and opponent had 2x the player's stars at that time.
    // Approximation: check tournament_matches where player won, and look at opponent's current stars
    let beatDoubleStarsOpponent = false;
    const { data: playerStarsData } = await adminSupabaseForQueries
      .from("players")
      .select("stars")
      .eq("id", player_id)
      .single();
    const playerStars = playerStarsData?.stars ?? 0;

    if (playerStars > 0) {
      // Check regular matches won by this player
      const wonMatches = (recentMatches ?? []).filter((m) => m.winner_id === player_id);
      if (wonMatches.length > 0) {
        const opponentIds = wonMatches.map((m) =>
          m.player1_id === player_id ? m.player2_id : m.player1_id
        );
        const uniqueOpponentIds = Array.from(new Set(opponentIds));
        const { data: opponents } = await adminSupabaseForQueries
          .from("players")
          .select("id, stars")
          .in("id", uniqueOpponentIds);
        if (opponents) {
          for (const opp of opponents) {
            if (opp.stars >= playerStars * 2) {
              beatDoubleStarsOpponent = true;
              break;
            }
          }
        }
      }
      // Also check tournament matches
      if (!beatDoubleStarsOpponent) {
        const wonTourneyMatches = (recentTournamentMatches ?? []).filter(
          (m) => m.winner_id === player_id
        );
        if (wonTourneyMatches.length > 0) {
          const opponentIds = wonTourneyMatches.map((m) =>
            m.player1_id === player_id ? m.player2_id : m.player1_id
          );
          const uniqueOpponentIds = Array.from(new Set(opponentIds));
          const { data: opponents } = await adminSupabaseForQueries
            .from("players")
            .select("id, stars")
            .in("id", uniqueOpponentIds);
          if (opponents) {
            for (const opp of opponents) {
              if (opp.stars >= playerStars * 2) {
                beatDoubleStarsOpponent = true;
                break;
              }
            }
          }
        }
      }
    }

    // Build the stats object
    const stats: PlayerStats = {
      wins: player.wins,
      losses: player.losses,
      current_streak: bestStreak,
      tournaments_won: tournamentsWon,
      tournaments_played: tournamentsPlayed,
      tournament_eliminations: maxEliminations,
      login_streak: player.current_login_streak ?? 0,
      // New fields
      total_matches: player.wins + player.losses,
      max_stars_ever: playerStars, // approximation using current stars
      had_losing_streak_3_then_won: hadLosingStreak3ThenWon,
      consecutive_correct_predictions: consecutiveCorrectPredictions,
      chat_messages_count: chatMessagesResult.count ?? 0,
      challenges_sent: challengesSentResult.count ?? 0,
      beat_double_stars_opponent: beatDoubleStarsOpponent,
      beys_count: beysCountResult.count ?? 0,
      poll_votes_count: pollVotesResult.count ?? 0,
      max_combo_upvotes: maxComboUpvotesResult.data?.[0]?.upvotes ?? 0,
    };

    // Determine which badges should be unlocked
    const deservedBadges = checkBadges(stats);

    // Get already-unlocked badges
    const { data: existingBadges } = await supabase
      .from("player_badges")
      .select("badge_id")
      .eq("player_id", player_id);

    const existingBadgeIds = new Set(
      (existingBadges ?? []).map((b) => b.badge_id)
    );

    // Find new badges to award
    const newBadges = deservedBadges.filter((id) => !existingBadgeIds.has(id));

    if (newBadges.length > 0) {
      // Use admin client to insert (player_badges insert requires service role
      // since there's no RLS insert policy for authenticated users)
      const adminSupabase = createAdminClient();

      const { error: insertError } = await adminSupabase
        .from("player_badges")
        .insert(
          newBadges.map((badge_id) => ({
            player_id,
            badge_id,
            seen: false,
          }))
        );

      if (insertError) {
        console.error("Error inserting badges:", insertError);
        return Response.json(
          { error: "Error guardando medallas" },
          { status: 500 }
        );
      }

      // Insert badge_unlocked events into activity_feed
      for (const badge_id of newBadges) {
        const def = BADGE_DEFINITIONS.find((b) => b.id === badge_id);
        try {
          await adminSupabase.from("activity_feed").insert({
            type: "badge_unlocked",
            actor_id: player_id,
            target_id: null,
            reference_id: badge_id,
            metadata: {
              badge_name: def?.name ?? badge_id,
              badge_icon: def?.icon ?? "",
              badge_description: def?.description ?? "",
            },
          });
        } catch (feedErr) {
          console.error("Error inserting badge_unlocked feed event:", feedErr);
        }
      }
    }

    return Response.json({
      new_badges: newBadges,
      all_badges: deservedBadges,
      stats,
    });
  } catch (err) {
    console.error("POST /api/badges/check error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
