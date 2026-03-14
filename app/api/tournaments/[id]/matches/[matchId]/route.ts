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

    // Fetch tournament to know the format, top_cut, and stage
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("format, current_round, top_cut, stage")
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

        // In single elimination or finals stage, mark loser as eliminated
        if (
          tournament?.format === "single_elimination" ||
          (tournament?.stage === "finals" && match.stage === "finals")
        ) {
          updateData.is_eliminated = true;
        }

        await supabase
          .from("tournament_participants")
          .update(updateData)
          .eq("tournament_id", tournamentId)
          .eq("player_id", loserId);
      }
    }

    // Format-specific post-match logic: bracket advancement
    // Applies to single_elimination AND finals stage matches (which are elimination brackets)
    const isBracketMatch =
      tournament?.format === "single_elimination" ||
      (match.stage === "finals" && updatedMatch.next_match_id);

    if (isBracketMatch && updatedMatch.next_match_id) {
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

    // Check if current round is complete (for Swiss group stage: generate next round)
    if (tournament?.format === "swiss" && tournament.stage !== "finals") {
      const currentRound = tournament.current_round;

      const { count: pendingCount } = await supabase
        .from("tournament_matches")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", tournamentId)
        .eq("round", currentRound)
        .eq("stage", "group")
        .in("status", ["pending", "in_progress"]);

      if (pendingCount === 0) {
        // All matches in current round are done — generate next round
        await generateNextSwissRound(supabase, tournamentId, currentRound);
      }
    }

    // --- GROUP STAGE COMPLETION CHECK (round_robin / swiss with top_cut) ---
    const hasTopCut = tournament?.top_cut != null && tournament.top_cut > 0;

    if (
      (tournament?.format === "round_robin" || tournament?.format === "swiss") &&
      tournament.stage === "group_stage"
    ) {
      // Count pending group stage matches only
      const { count: groupPending } = await supabase
        .from("tournament_matches")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", tournamentId)
        .eq("stage", "group")
        .in("status", ["pending", "in_progress"]);

      let groupDone = groupPending === 0;

      // For Swiss, also check if all expected rounds are generated
      if (groupDone && tournament.format === "swiss") {
        const { count: participantCount } = await supabase
          .from("tournament_participants")
          .select("id", { count: "exact", head: true })
          .eq("tournament_id", tournamentId);

        const expectedRounds = Math.ceil(Math.log2(participantCount ?? 2));
        if ((tournament.current_round ?? 0) < expectedRounds) {
          groupDone = false;
        }
      }

      if (groupDone && hasTopCut) {
        // Group stage is done and we have a top cut — generate finals bracket
        await generateFinalsBracket(supabase, tournamentId, tournament.top_cut!);
      } else if (groupDone && !hasTopCut) {
        // No top cut — just complete the tournament
        await completeTournament(supabase, request, tournamentId);
      }
    }

    // --- NO TOP CUT: round_robin/swiss without stage (legacy behavior) ---
    if (
      (tournament?.format === "round_robin" || tournament?.format === "swiss") &&
      tournament.stage == null
    ) {
      const { count: totalPending } = await supabase
        .from("tournament_matches")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", tournamentId)
        .in("status", ["pending", "in_progress"]);

      if (totalPending === 0) {
        let shouldComplete = true;

        if (tournament.format === "swiss") {
          const { count: participantCount } = await supabase
            .from("tournament_participants")
            .select("id", { count: "exact", head: true })
            .eq("tournament_id", tournamentId);

          const expectedRounds = Math.ceil(Math.log2(participantCount ?? 2));
          if ((tournament.current_round ?? 0) < expectedRounds) {
            shouldComplete = false;
          }
        }

        if (shouldComplete) {
          await completeTournament(supabase, request, tournamentId);
        }
      }
    }

    // --- FINALS STAGE COMPLETION CHECK ---
    if (tournament?.stage === "finals") {
      // Check if the finals bracket final match is done (no next_match_id)
      if (match.stage === "finals" && !updatedMatch.next_match_id) {
        await completeTournament(supabase, request, tournamentId);
      }
    }

    // --- SINGLE ELIMINATION: check if final is done ---
    if (tournament?.format === "single_elimination" && tournament.stage == null) {
      if (!updatedMatch.next_match_id) {
        await completeTournament(supabase, request, tournamentId);
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

// ─── Helper: Complete a tournament ──────────────────────────────────────

async function completeTournament(
  supabase: Awaited<ReturnType<typeof createClient>>,
  request: Request,
  tournamentId: string
) {
  await supabase
    .from("tournaments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", tournamentId);

  // Auto-award tournament points (fire-and-forget)
  fetch(
    `${new URL(request.url).origin}/api/tournaments/${tournamentId}/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
    }
  ).catch(() => {});
}

// ─── Generate Finals Bracket from top-cut players ──────────────────────

async function generateFinalsBracket(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  topCut: number
) {
  // Get participants sorted by group stage points (desc), then wins (desc) as tiebreak
  const { data: participants, error } = await supabase
    .from("tournament_participants")
    .select("id, player_id, points, tournament_wins")
    .eq("tournament_id", tournamentId)
    .order("points", { ascending: false })
    .order("tournament_wins", { ascending: false });

  if (error || !participants) {
    console.error("generateFinalsBracket: Failed to fetch participants", error);
    return;
  }

  // Take the top N players
  const topPlayers = participants.slice(0, topCut);

  if (topPlayers.length < 2) {
    console.error("generateFinalsBracket: Not enough players for top cut");
    return;
  }

  // Generate elimination bracket for top players
  const bracketSize = nextPowerOf2(topPlayers.length);
  const totalRounds = Math.log2(bracketSize);

  // Seeded by group stage performance (index 0 = #1 seed)
  const slots: (typeof topPlayers[0] | null)[] = new Array(bracketSize).fill(null);
  for (let i = 0; i < topPlayers.length; i++) {
    slots[i] = topPlayers[i];
  }

  // Determine the max match_order from existing matches to avoid conflicts
  const { data: existingMatches } = await supabase
    .from("tournament_matches")
    .select("match_order")
    .eq("tournament_id", tournamentId)
    .order("match_order", { ascending: false })
    .limit(1);

  let orderStart = (existingMatches?.[0]?.match_order ?? 0) + 1;

  // Determine the max round from existing group matches to offset finals rounds
  const { data: existingRounds } = await supabase
    .from("tournament_matches")
    .select("round")
    .eq("tournament_id", tournamentId)
    .order("round", { ascending: false })
    .limit(1);

  const roundOffset = existingRounds?.[0]?.round ?? 0;

  function bracketLabel(round: number, pos: number): string {
    if (round === totalRounds) return "F";
    if (round === totalRounds - 1) return `SF${pos + 1}`;
    if (round === totalRounds - 2) return `QF${pos + 1}`;
    return `R${round}-M${pos + 1}`;
  }

  interface FinalsMatchInsert {
    tournament_id: string;
    round: number;
    match_order: number;
    player1_id: string | null;
    player2_id: string | null;
    status: "pending" | "bye";
    bracket_position: string | null;
    stage: "finals";
  }

  const matches: FinalsMatchInsert[] = [];

  // Generate first round matches
  const firstRoundMatchCount = bracketSize / 2;
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const p1 = slots[i * 2];
    const p2 = slots[i * 2 + 1];
    const isBye = p1 === null || p2 === null;

    matches.push({
      tournament_id: tournamentId,
      round: roundOffset + 1,
      match_order: orderStart++,
      player1_id: p1?.player_id ?? null,
      player2_id: p2?.player_id ?? null,
      status: isBye ? "bye" : "pending",
      bracket_position: bracketLabel(1, i),
      stage: "finals",
    });
  }

  // Generate subsequent round placeholder matches
  let prevRoundCount = firstRoundMatchCount;
  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = prevRoundCount / 2;
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        tournament_id: tournamentId,
        round: roundOffset + round,
        match_order: orderStart++,
        player1_id: null,
        player2_id: null,
        status: "pending",
        bracket_position: bracketLabel(round, i),
        stage: "finals",
      });
    }
    prevRoundCount = matchCount;
  }

  // Insert all finals matches
  const { data: createdMatches, error: insertError } = await supabase
    .from("tournament_matches")
    .insert(matches)
    .select();

  if (insertError || !createdMatches) {
    console.error("generateFinalsBracket: Failed to insert matches", insertError);
    return;
  }

  // Link next_match_id for bracket progression
  const sorted = [...createdMatches].sort((a, b) => a.match_order - b.match_order);
  const byRound = new Map<number, typeof sorted>();
  for (const m of sorted) {
    const arr = byRound.get(m.round) || [];
    arr.push(m);
    byRound.set(m.round, arr);
  }

  const roundKeys = Array.from(byRound.keys()).sort((a, b) => a - b);

  for (let ri = 0; ri < roundKeys.length - 1; ri++) {
    const currentRound = byRound.get(roundKeys[ri]) ?? [];
    const nextRound = byRound.get(roundKeys[ri + 1]) ?? [];

    for (let i = 0; i < currentRound.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      if (nextMatchIndex < nextRound.length) {
        await supabase
          .from("tournament_matches")
          .update({ next_match_id: nextRound[nextMatchIndex].id })
          .eq("id", currentRound[i].id);
      }
    }
  }

  // Auto-advance bye matches in the first round
  const firstRoundKey = roundKeys[0];
  const firstRoundMatches = byRound.get(firstRoundKey) ?? [];
  const byeMatches = firstRoundMatches.filter(
    (m) => m.status === "bye" && (m.player1_id || m.player2_id)
  );

  for (const byeMatch of byeMatches) {
    const winnerId = byeMatch.player1_id ?? byeMatch.player2_id;
    if (!winnerId) continue;

    await supabase
      .from("tournament_matches")
      .update({
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", byeMatch.id);

    // Refetch to get linked next_match_id
    const { data: linkedBye } = await supabase
      .from("tournament_matches")
      .select("id, next_match_id")
      .eq("id", byeMatch.id)
      .single();

    if (linkedBye?.next_match_id) {
      const { data: feeders } = await supabase
        .from("tournament_matches")
        .select("id, match_order")
        .eq("next_match_id", linkedBye.next_match_id)
        .order("match_order", { ascending: true });

      if (feeders) {
        const feederIndex = feeders.findIndex((f) => f.id === byeMatch.id);
        if (feederIndex === 0) {
          await supabase
            .from("tournament_matches")
            .update({ player1_id: winnerId })
            .eq("id", linkedBye.next_match_id);
        } else {
          await supabase
            .from("tournament_matches")
            .update({ player2_id: winnerId })
            .eq("id", linkedBye.next_match_id);
        }
      }
    }
  }

  // Update tournament: switch to finals stage
  await supabase
    .from("tournaments")
    .update({
      stage: "finals",
      current_round: roundOffset + 1,
    })
    .eq("id", tournamentId);
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
    // Swiss group rounds are done — check if we need top cut or complete
    // The completion logic is handled in the PATCH handler after this returns
    return;
  }

  // Get previous matchups to avoid rematches (only group stage)
  const { data: previousMatches } = await supabase
    .from("tournament_matches")
    .select("player1_id, player2_id")
    .eq("tournament_id", tournamentId)
    .eq("stage", "group");

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
    stage: "group";
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
        stage: "group",
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
        stage: "group",
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

/** Next power of 2 >= n */
function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}
