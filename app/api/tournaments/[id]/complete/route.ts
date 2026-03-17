import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToPlayer } from "@/lib/push";

/**
 * POST /api/tournaments/[id]/complete
 *
 * Called when a tournament is completed.
 * Awards tournament_points to all participants based on the points system:
 *   - 1st place: 100 points
 *   - 2nd place: 75 points
 *   - 3rd place: 50 points
 *   - Participation: 10 points per tournament
 *   - Win bonus: 5 points per battle won in the tournament (ALL phases)
 *
 * BUG 6 FIX: For multi-stage tournaments (swiss+elimination), positions 1st/2nd/3rd
 * are determined ONLY from the finals bracket. Swiss phase results only determine
 * who qualifies for the top cut — not final placement.
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
      .select("id, name, format, status, top_cut, stage")
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
    const { searchParams } = new URL(_request.url);
    const forceRecalculate = searchParams.get("force") === "true";

    const { count: existingPointsCount } = await supabase
      .from("tournament_points")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    if ((existingPointsCount ?? 0) > 0) {
      if (!forceRecalculate) {
        return Response.json(
          { error: "Los puntos ya fueron otorgados. Usa ?force=true para recalcular." },
          { status: 400 }
        );
      }
      // Clear old points and badges for recalculation
      const adminForCleanup = createAdminClient();
      await adminForCleanup
        .from("tournament_points")
        .delete()
        .eq("tournament_id", tournamentId);
      await adminForCleanup
        .from("tournament_badges")
        .delete()
        .eq("tournament_id", tournamentId);
    }

    // Get all participants with their stats
    const { data: participants, error: participantsError } = await supabase
      .from("tournament_participants")
      .select("player_id, points, tournament_wins, tournament_losses, is_eliminated")
      .eq("tournament_id", tournamentId);

    if (participantsError) {
      console.error("[complete] Error fetching participants:", participantsError);
      return Response.json({ error: "Error obteniendo participantes" }, { status: 500 });
    }

    if (!participants || participants.length === 0) {
      return Response.json(
        { error: "No hay participantes" },
        { status: 400 }
      );
    }

    // Get ALL completed matches for this tournament (for counting wins across all phases)
    const { data: allMatches, error: allMatchesError } = await supabase
      .from("tournament_matches")
      .select("winner_id, player1_id, player2_id, status, bracket_position, stage")
      .eq("tournament_id", tournamentId)
      .eq("status", "completed");

    if (allMatchesError) {
      console.error("[complete] Error fetching allMatches:", allMatchesError);
      return Response.json({ error: "Error obteniendo partidas del torneo" }, { status: 500 });
    }

    // Also count byes as wins
    const { data: byeMatches, error: byeMatchesError } = await supabase
      .from("tournament_matches")
      .select("winner_id, player1_id, player2_id, status, bracket_position, stage")
      .eq("tournament_id", tournamentId)
      .eq("status", "bye");

    if (byeMatchesError) {
      console.error("[complete] Error fetching byeMatches:", byeMatchesError);
      return Response.json({ error: "Error obteniendo byes del torneo" }, { status: 500 });
    }

    const matches = [...(allMatches ?? []), ...(byeMatches ?? [])];

    // Determine positions
    const positionMap = new Map<string, number>();

    const hadFinalsBracket = tournament.stage === "finals" && tournament.top_cut != null;

    if (tournament.format === "single_elimination" || hadFinalsBracket) {
      // BUG 6 FIX: For multi-stage tournaments, positions come ONLY from the finals bracket.
      // For single_elimination without stages, use all matches.
      const bracketMatches = hadFinalsBracket
        ? matches.filter((m) => m.stage === "finals")
        : matches;

      console.log(`[Complete] Determining positions from ${hadFinalsBracket ? "finals bracket" : "all matches"} (${bracketMatches.length} matches)`);

      // 1st: winner of final
      const finalMatch = bracketMatches.find((m) => m.bracket_position === "F");
      if (finalMatch?.winner_id) {
        positionMap.set(finalMatch.winner_id, 1);
        console.log(`[Complete] 1st place: ${finalMatch.winner_id}`);

        // 2nd: loser of final
        const loserId =
          finalMatch.player1_id === finalMatch.winner_id
            ? finalMatch.player2_id
            : finalMatch.player1_id;
        if (loserId) {
          positionMap.set(loserId, 2);
          console.log(`[Complete] 2nd place: ${loserId}`);
        }
      }

      // 3rd: winner of 3rd place match, or if no 3P match, losers of semifinals
      const thirdPlaceMatch = bracketMatches.find((m) => m.bracket_position === "3P");
      if (thirdPlaceMatch?.winner_id) {
        positionMap.set(thirdPlaceMatch.winner_id, 3);
        console.log(`[Complete] 3rd place (from 3P match): ${thirdPlaceMatch.winner_id}`);
        // 4th: loser of 3rd place match
        const fourthId =
          thirdPlaceMatch.player1_id === thirdPlaceMatch.winner_id
            ? thirdPlaceMatch.player2_id
            : thirdPlaceMatch.player1_id;
        if (fourthId && !positionMap.has(fourthId)) {
          positionMap.set(fourthId, 4);
          console.log(`[Complete] 4th place: ${fourthId}`);
        }
      } else {
        // Fallback: both SF losers get 3rd (no 3P match played)
        const semiFinals = bracketMatches.filter((m) =>
          m.bracket_position?.startsWith("SF")
        );
        for (const sf of semiFinals) {
          if (sf.winner_id) {
            const loser =
              sf.player1_id === sf.winner_id ? sf.player2_id : sf.player1_id;
            if (loser && !positionMap.has(loser)) {
              positionMap.set(loser, 3);
              console.log(`[Complete] 3rd place (SF loser): ${loser}`);
            }
          }
        }
      }

      // For multi-stage: assign positions to remaining top-cut players
      // based on how far they got (QF losers = 5th, R1 losers = 9th, etc.)
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

        // R1 losers in finals bracket get position 9
        const r1Matches = bracketMatches.filter(
          (m) => m.bracket_position && !m.bracket_position.startsWith("SF") &&
                 !m.bracket_position.startsWith("QF") &&
                 m.bracket_position !== "F"
        );
        for (const r1 of r1Matches) {
          if (r1.winner_id) {
            const loser =
              r1.player1_id === r1.winner_id ? r1.player2_id : r1.player1_id;
            if (loser && !positionMap.has(loser)) {
              positionMap.set(loser, 9);
            }
          }
        }

        // BUG 6 FIX: Players who didn't make top cut get positions after all
        // top-cut players, ranked by their swiss/group stage performance
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

    // BUG 6 FIX: Count wins per player from ALL phases (group + finals)
    // Battle win bonus applies to all actual match wins
    const winsMap = new Map<string, number>();
    for (const m of matches) {
      if (m.winner_id && m.status === "completed") {
        // Only count actual match wins, not bye auto-advances
        winsMap.set(m.winner_id, (winsMap.get(m.winner_id) ?? 0) + 1);
      }
    }

    console.log(`[Complete] Position map:`, Object.fromEntries(positionMap));
    console.log(`[Complete] Wins map:`, Object.fromEntries(winsMap));

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

      // Win bonus: 5 points per battle won (from ALL phases)
      totalPoints += wins * 5;

      // BUG 6 FIX: Position bonus based on FINAL placement
      // (which for multi-stage tournaments is from the elimination bracket only)
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

    // ── Grant tournament badges (top 3) ──
    const badgesToInsert: {
      player_id: string;
      tournament_id: string;
      position: number;
    }[] = [];

    for (const p of pointsToInsert) {
      if (p.position != null && p.position >= 1 && p.position <= 3) {
        badgesToInsert.push({
          player_id: p.player_id,
          tournament_id: tournamentId,
          position: p.position,
        });
      }
    }

    if (badgesToInsert.length > 0) {
      const { error: badgeError } = await adminSupabase
        .from("tournament_badges")
        .upsert(badgesToInsert, { onConflict: "player_id,tournament_id" });

      if (badgeError) {
        // Non-critical: log and continue
        console.error("Error inserting tournament badges:", badgeError);
      }
    }

    // Push notifications to top 3 (fire-and-forget)
    const tournamentName = tournament.name ?? "el torneo";
    const tournamentUrl = `/tournaments/${tournamentId}`;

    for (const badge of badgesToInsert) {
      if (badge.position === 1) {
        sendPushToPlayer(
          badge.player_id,
          "CAMPEÓN",
          `Ganaste ${tournamentName}. Tu nombre queda en la historia.`,
          tournamentUrl
        ).catch((e) => console.error("[push] error:", e));
      } else if (badge.position === 2) {
        sendPushToPlayer(
          badge.player_id,
          "Subcampeón",
          `2do puesto en ${tournamentName}. Tan cerca...`,
          tournamentUrl
        ).catch((e) => console.error("[push] error:", e));
      } else if (badge.position === 3) {
        sendPushToPlayer(
          badge.player_id,
          "Podio",
          `3er puesto en ${tournamentName}. En el podio.`,
          tournamentUrl
        ).catch((e) => console.error("[push] error:", e));
      }
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
