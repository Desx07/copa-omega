import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/tournaments/[id]/complete
 *
 * Called when a tournament is completed.
 * Awards tournament_points to all participants based on the points system:
 *   - 1st place: 100 points
 *   - 2nd place: 75 points
 *   - 3rd place: 50 points
 *   - Participation: 10 points per tournament
 *   - Win bonus: 5 points per battle won in the tournament
 *
 * Also triggers badge checks for all participants.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verify admin
    const { data: currentPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!currentPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    // Get tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, format, status, top_cut, stage")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return Response.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    if (tournament.status !== "completed") {
      return Response.json(
        { error: "El torneo no esta completado" },
        { status: 400 }
      );
    }

    // Check if points were already awarded
    const { count: existingPointsCount } = await supabase
      .from("tournament_points")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    if ((existingPointsCount ?? 0) > 0) {
      return Response.json(
        { error: "Los puntos ya fueron otorgados para este torneo" },
        { status: 400 }
      );
    }

    // Get all participants with their stats
    const { data: participants } = await supabase
      .from("tournament_participants")
      .select("player_id, points, tournament_wins, tournament_losses, is_eliminated")
      .eq("tournament_id", tournamentId);

    if (!participants || participants.length === 0) {
      return Response.json(
        { error: "No hay participantes" },
        { status: 400 }
      );
    }

    // Get matches for this tournament (to count wins per player)
    const { data: matches } = await supabase
      .from("tournament_matches")
      .select("winner_id, player1_id, player2_id, status, bracket_position, stage")
      .eq("tournament_id", tournamentId)
      .eq("status", "completed");

    // Determine positions
    let positionMap = new Map<string, number>();

    const hadFinalsBracket = tournament.stage === "finals" && tournament.top_cut != null;

    if (tournament.format === "single_elimination" || hadFinalsBracket) {
      // For single_elimination or tournaments with a finals bracket,
      // positions come from the elimination bracket
      const bracketMatches = hadFinalsBracket
        ? (matches ?? []).filter((m) => m.stage === "finals")
        : (matches ?? []);

      // 1st: winner of final
      const finalMatch = bracketMatches.find((m) => m.bracket_position === "F");
      if (finalMatch?.winner_id) {
        positionMap.set(finalMatch.winner_id, 1);
        // 2nd: loser of final
        const loserId =
          finalMatch.player1_id === finalMatch.winner_id
            ? finalMatch.player2_id
            : finalMatch.player1_id;
        if (loserId) positionMap.set(loserId, 2);
      }

      // 3rd: losers of semifinals
      const semiFinals = bracketMatches.filter((m) =>
        m.bracket_position?.startsWith("SF")
      );
      for (const sf of semiFinals) {
        if (sf.winner_id && sf.status === "completed") {
          const loser =
            sf.player1_id === sf.winner_id ? sf.player2_id : sf.player1_id;
          if (loser && !positionMap.has(loser)) {
            positionMap.set(loser, 3);
          }
        }
      }

      // For multi-stage: assign positions to remaining top-cut players
      // based on how far they got (QF losers = 5th, etc.), then remaining by group points
      if (hadFinalsBracket) {
        // QF losers get position 5
        const qfMatches = bracketMatches.filter((m) =>
          m.bracket_position?.startsWith("QF")
        );
        for (const qf of qfMatches) {
          if (qf.winner_id) {
            const loser =
              qf.player1_id === qf.winner_id ? qf.player2_id : qf.player1_id;
            if (loser && !positionMap.has(loser)) {
              positionMap.set(loser, 5);
            }
          }
        }

        // Players who didn't make top cut: rank by group stage points
        const sorted = [...participants].sort((a, b) => b.points - a.points);
        let nextPosition = (tournament.top_cut ?? 0) + 1;
        for (const p of sorted) {
          if (!positionMap.has(p.player_id)) {
            positionMap.set(p.player_id, nextPosition++);
          }
        }
      }
    } else {
      // Round robin / Swiss without top cut: sorted by tournament points
      const sorted = [...participants].sort((a, b) => b.points - a.points);
      sorted.forEach((p, index) => {
        positionMap.set(p.player_id, index + 1);
      });
    }

    // Count wins per player
    const winsMap = new Map<string, number>();
    for (const m of matches ?? []) {
      if (m.winner_id) {
        winsMap.set(m.winner_id, (winsMap.get(m.winner_id) ?? 0) + 1);
      }
    }

    // Calculate and insert points
    const adminSupabase = createAdminClient();
    const pointsToInsert: {
      player_id: string;
      tournament_id: string;
      points: number;
      position: number | null;
    }[] = [];

    for (const p of participants) {
      const position = positionMap.get(p.player_id) ?? null;
      const wins = winsMap.get(p.player_id) ?? 0;

      let totalPoints = 0;

      // Participation bonus: 10 points
      totalPoints += 10;

      // Win bonus: 5 points per battle won
      totalPoints += wins * 5;

      // Position bonus
      if (position === 1) totalPoints += 100;
      else if (position === 2) totalPoints += 75;
      else if (position === 3) totalPoints += 50;

      pointsToInsert.push({
        player_id: p.player_id,
        tournament_id: tournamentId,
        points: totalPoints,
        position,
      });
    }

    const { error: insertError } = await adminSupabase
      .from("tournament_points")
      .insert(pointsToInsert);

    if (insertError) {
      console.error("Error inserting tournament points:", insertError);
      return Response.json(
        { error: "Error guardando puntos" },
        { status: 500 }
      );
    }

    // Trigger badge checks for all participants
    const baseUrl = new URL(_request.url).origin;
    for (const p of participants) {
      try {
        await fetch(`${baseUrl}/api/badges/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: _request.headers.get("cookie") ?? "",
          },
          body: JSON.stringify({ player_id: p.player_id }),
        });
      } catch (err) {
        // Non-critical: log and continue
        console.error(`Badge check failed for ${p.player_id}:`, err);
      }
    }

    return Response.json({
      success: true,
      points_awarded: pointsToInsert.length,
      points: pointsToInsert,
    });
  } catch (err) {
    console.error("POST /api/tournaments/[id]/complete error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
