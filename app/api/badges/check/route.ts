import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkBadges, type PlayerStats } from "@/lib/badges";

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

    // Calculate max eliminations in a single tournament (for executioner badge)
    // In single_elimination format, each win = an elimination
    let maxEliminations = 0;
    if (completedTournaments) {
      for (const tp of completedTournaments) {
        const tournament = tp.tournament as unknown as {
          status: string;
          format: string;
        };
        if (!tournament || tournament.format !== "single_elimination") continue;

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

    // Build the stats object
    const stats: PlayerStats = {
      wins: player.wins,
      losses: player.losses,
      current_streak: bestStreak,
      tournaments_won: tournamentsWon,
      tournaments_played: tournamentsPlayed,
      tournament_eliminations: maxEliminations,
      login_streak: player.current_login_streak ?? 0,
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
