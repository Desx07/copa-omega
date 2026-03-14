import { createClient } from "@/lib/supabase/server";

// PATCH /api/tournaments/[id]/matches/[matchId] — Update match result (admin or assigned judge)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id: tournamentId, matchId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check admin or judge
    const { data: currentPlayer } = await supabase
      .from("players")
      .select("is_admin, is_judge")
      .eq("id", user.id)
      .single();

    const isAdmin = currentPlayer?.is_admin === true;
    const isJudge = currentPlayer?.is_judge === true;

    if (!isAdmin && !isJudge) {
      return Response.json(
        { error: "Solo administradores o jueces" },
        { status: 403 }
      );
    }

    // Fetch the match
    const { data: match, error: matchError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("id", matchId)
      .eq("tournament_id", tournamentId)
      .single();

    if (matchError) {
      if (matchError.code === "PGRST116") {
        return Response.json(
          { error: "Partido no encontrado" },
          { status: 404 }
        );
      }
      return Response.json({ error: matchError.message }, { status: 500 });
    }

    // If judge (not admin), verify they are the assigned judge
    if (!isAdmin && isJudge && match.judge_id !== user.id) {
      return Response.json(
        { error: "No sos el juez asignado a este partido" },
        { status: 403 }
      );
    }

    // Check match is not already completed
    if (match.status === "completed") {
      return Response.json(
        { error: "Este partido ya fue completado" },
        { status: 400 }
      );
    }

    if (match.status === "bye") {
      return Response.json(
        { error: "No se puede modificar un partido bye" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { winner_id, player1_score, player2_score } = body;

    // Validate winner_id is required
    if (!winner_id) {
      return Response.json(
        { error: "Falta campo: winner_id" },
        { status: 400 }
      );
    }

    // Validate winner is one of the match players
    if (winner_id !== match.player1_id && winner_id !== match.player2_id) {
      return Response.json(
        { error: "El ganador debe ser uno de los jugadores del partido" },
        { status: 400 }
      );
    }

    // Validate scores if provided
    if (player1_score != null && (typeof player1_score !== "number" || player1_score < 0)) {
      return Response.json(
        { error: "player1_score debe ser un número >= 0" },
        { status: 400 }
      );
    }
    if (player2_score != null && (typeof player2_score !== "number" || player2_score < 0)) {
      return Response.json(
        { error: "player2_score debe ser un número >= 0" },
        { status: 400 }
      );
    }

    const loserId =
      winner_id === match.player1_id ? match.player2_id : match.player1_id;

    // Update the match
    const { data: updatedMatch, error: updateError } = await supabase
      .from("tournament_matches")
      .update({
        winner_id,
        player1_score: player1_score ?? match.player1_score,
        player2_score: player2_score ?? match.player2_score,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .select()
      .single();

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // Fetch tournament to know the format
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("format, current_round")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error("Failed to fetch tournament:", tournamentError);
      return Response.json({ error: "Error obteniendo torneo" }, { status: 500 });
    }

    // Update participant stats
    // Winner: +1 win, +3 points
    const { data: winnerParticipant } = await supabase
      .from("tournament_participants")
      .select("points, tournament_wins")
      .eq("tournament_id", tournamentId)
      .eq("player_id", winner_id)
      .single();

    if (winnerParticipant) {
      const { error: winErr } = await supabase
        .from("tournament_participants")
        .update({
          points: winnerParticipant.points + 3,
          tournament_wins: winnerParticipant.tournament_wins + 1,
        })
        .eq("tournament_id", tournamentId)
        .eq("player_id", winner_id);
      if (winErr) console.error("Error updating winner stats:", winErr);
    }

    // Get current participant stats for loser
    if (loserId) {
      const { data: loserParticipant } = await supabase
        .from("tournament_participants")
        .select("tournament_losses, is_eliminated")
        .eq("tournament_id", tournamentId)
        .eq("player_id", loserId)
        .single();

      if (loserParticipant) {
        const updateData: Record<string, unknown> = {
          tournament_losses: loserParticipant.tournament_losses + 1,
        };

        // In single elimination, mark loser as eliminated
        if (tournament?.format === "single_elimination") {
          updateData.is_eliminated = true;
        }

        await supabase
          .from("tournament_participants")
          .update(updateData)
          .eq("tournament_id", tournamentId)
          .eq("player_id", loserId);
      }
    }

    // Format-specific post-match logic
    if (tournament?.format === "single_elimination" && updatedMatch.next_match_id) {
      // Advance winner to next match in bracket
      const { data: nextMatch } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("id", updatedMatch.next_match_id)
        .single();

      if (nextMatch) {
        // Find which feeder slot this match fills
        const { data: feeders } = await supabase
          .from("tournament_matches")
          .select("id, match_order")
          .eq("next_match_id", updatedMatch.next_match_id)
          .order("match_order", { ascending: true });

        if (feeders) {
          const feederIndex = feeders.findIndex((f) => f.id === matchId);
          if (feederIndex === 0) {
            await supabase
              .from("tournament_matches")
              .update({ player1_id: winner_id })
              .eq("id", updatedMatch.next_match_id);
          } else {
            await supabase
              .from("tournament_matches")
              .update({ player2_id: winner_id })
              .eq("id", updatedMatch.next_match_id);
          }
        }
      }
    }

    // Check if current round is complete (for Swiss: generate next round)
    if (tournament?.format === "swiss") {
      const currentRound = tournament.current_round;

      const { count: pendingCount } = await supabase
        .from("tournament_matches")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", tournamentId)
        .eq("round", currentRound)
        .in("status", ["pending", "in_progress"]);

      if (pendingCount === 0) {
        // All matches in current round are done — generate next round
        await generateNextSwissRound(supabase, tournamentId, currentRound);
      }
    }

    // Check if tournament is complete
    if (tournament?.format === "round_robin" || tournament?.format === "swiss") {
      const { count: totalPending } = await supabase
        .from("tournament_matches")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", tournamentId)
        .in("status", ["pending", "in_progress"]);

      if (totalPending === 0) {
        // Check if Swiss still needs more rounds (standard: ceil(log2(n)) rounds)
        let shouldComplete = true;

        if (tournament.format === "swiss") {
          const { count: participantCount } = await supabase
            .from("tournament_participants")
            .select("id", { count: "exact", head: true })
            .eq("tournament_id", tournamentId);

          const expectedRounds = Math.ceil(
            Math.log2(participantCount ?? 2)
          );
          if ((tournament.current_round ?? 0) < expectedRounds) {
            shouldComplete = false;
          }
        }

        if (shouldComplete) {
          await supabase
            .from("tournaments")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", tournamentId);

          // Auto-award tournament points
          fetch(`${new URL(request.url).origin}/api/tournaments/${tournamentId}/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              cookie: request.headers.get("cookie") ?? "",
            },
          }).catch(() => {});
        }
      }
    }

    // Check if single elimination final is done
    if (tournament?.format === "single_elimination") {
      // If there's no next_match_id, this was the final
      if (!updatedMatch.next_match_id) {
        await supabase
          .from("tournaments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", tournamentId);

        // Auto-award tournament points
        fetch(`${new URL(request.url).origin}/api/tournaments/${tournamentId}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") ?? "",
          },
        }).catch(() => {});
      }
    }

    // Trigger badge checks for both players (fire-and-forget)
    const baseUrl = new URL(request.url).origin;
    const badgePlayers = [winner_id, loserId].filter(Boolean);
    for (const playerId of badgePlayers) {
      fetch(`${baseUrl}/api/badges/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ player_id: playerId }),
      }).catch(() => {});
    }

    return Response.json(updatedMatch);
  } catch (err) {
    console.error("PATCH /api/tournaments/[id]/matches/[matchId] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ─── Swiss: Generate next round by pairing players with similar points ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateNextSwissRound(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  completedRound: number
) {
  const nextRound = completedRound + 1;

  // Get participants sorted by points (desc)
  const { data: participants, error } = await supabase
    .from("tournament_participants")
    .select("id, player_id, points")
    .eq("tournament_id", tournamentId)
    .order("points", { ascending: false });

  if (error || !participants) return;

  // Determine expected rounds for Swiss
  const expectedRounds = Math.ceil(Math.log2(participants.length));
  if (nextRound > expectedRounds) {
    // Tournament is done, mark complete
    await supabase
      .from("tournaments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", tournamentId);
    return;
  }

  // Get previous matchups to avoid rematches
  const { data: previousMatches } = await supabase
    .from("tournament_matches")
    .select("player1_id, player2_id")
    .eq("tournament_id", tournamentId);

  const playedPairs = new Set<string>();
  for (const m of previousMatches ?? []) {
    if (m.player1_id && m.player2_id) {
      playedPairs.add(`${m.player1_id}-${m.player2_id}`);
      playedPairs.add(`${m.player2_id}-${m.player1_id}`);
    }
  }

  // Pair players with similar points, avoiding rematches
  const paired = new Set<string>();
  const matches: {
    tournament_id: string;
    round: number;
    match_order: number;
    player1_id: string | null;
    player2_id: string | null;
    status: "pending" | "bye";
    bracket_position: string | null;
  }[] = [];
  let order = 0;

  for (let i = 0; i < participants.length; i++) {
    if (paired.has(participants[i].player_id)) continue;

    let matched = false;
    for (let j = i + 1; j < participants.length; j++) {
      if (paired.has(participants[j].player_id)) continue;

      const pairKey = `${participants[i].player_id}-${participants[j].player_id}`;
      if (playedPairs.has(pairKey)) continue;

      paired.add(participants[i].player_id);
      paired.add(participants[j].player_id);

      matches.push({
        tournament_id: tournamentId,
        round: nextRound,
        match_order: order++,
        player1_id: participants[i].player_id,
        player2_id: participants[j].player_id,
        status: "pending",
        bracket_position: null,
      });
      matched = true;
      break;
    }

    // If no match found (odd player or all opponents already played), give bye
    if (!matched && !paired.has(participants[i].player_id)) {
      paired.add(participants[i].player_id);
      matches.push({
        tournament_id: tournamentId,
        round: nextRound,
        match_order: order++,
        player1_id: participants[i].player_id,
        player2_id: null,
        status: "bye",
        bracket_position: null,
      });
    }
  }

  if (matches.length > 0) {
    const { data: createdMatches } = await supabase
      .from("tournament_matches")
      .insert(matches)
      .select();

    // Auto-resolve bye matches
    if (createdMatches) {
      for (const m of createdMatches) {
        if (m.status === "bye" && m.player1_id) {
          await supabase
            .from("tournament_matches")
            .update({
              winner_id: m.player1_id,
              player1_score: 1,
              completed_at: new Date().toISOString(),
            })
            .eq("id", m.id);

          // Award point
          const { data: participant } = await supabase
            .from("tournament_participants")
            .select("points, tournament_wins")
            .eq("tournament_id", tournamentId)
            .eq("player_id", m.player1_id)
            .single();

          if (participant) {
            await supabase
              .from("tournament_participants")
              .update({
                points: participant.points + 3,
                tournament_wins: participant.tournament_wins + 1,
              })
              .eq("tournament_id", tournamentId)
              .eq("player_id", m.player1_id);
          }
        }
      }
    }

    // Update tournament current round
    await supabase
      .from("tournaments")
      .update({ current_round: nextRound })
      .eq("id", tournamentId);
  }
}
