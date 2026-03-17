import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id: tournamentId } = await context.params;
  const supabase = await createClient();

  // Verify auth + admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("players")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Fetch tournament
  const { data: tournament, error: tErr } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (tErr || !tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  if (tournament.status !== "registration") {
    return NextResponse.json(
      { error: "El torneo no esta en fase de inscripcion" },
      { status: 400 }
    );
  }

  // Fetch participants
  const { data: participants } = await supabase
    .from("tournament_participants")
    .select("id, player_id, seed, checked_in")
    .eq("tournament_id", tournamentId)
    .order("seed", { ascending: true });

  if (!participants || participants.length < 2) {
    return NextResponse.json(
      { error: "Se necesitan al menos 2 participantes" },
      { status: 400 }
    );
  }

  // If check-in was enabled, only include checked-in players
  let filteredParticipants = participants;
  if (tournament.checkin_open) {
    filteredParticipants = participants.filter((p) => p.checked_in);
    if (filteredParticipants.length < 2) {
      return NextResponse.json(
        { error: "Menos de 2 jugadores hicieron check-in" },
        { status: 400 }
      );
    }
    // Remove non-checked-in participants
    const nonCheckedIn = participants.filter((p) => !p.checked_in);
    for (const p of nonCheckedIn) {
      await supabase
        .from("tournament_participants")
        .delete()
        .eq("id", p.id);
    }
  }

  // Generate matches based on format
  try {
    if (tournament.format === "single_elimination") {
      await generateSingleElimination(supabase, tournamentId, filteredParticipants);
    } else if (tournament.format === "round_robin") {
      await generateRoundRobin(supabase, tournamentId, filteredParticipants);
    } else if (tournament.format === "swiss") {
      await generateSwissRound1(supabase, tournamentId, filteredParticipants);
    }

    // Update tournament status
    const { error: updateErr } = await supabase
      .from("tournaments")
      .update({
        status: "in_progress",
        current_round: 1,
        started_at: new Date().toISOString(),
      })
      .eq("id", tournamentId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar partidas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ─── Single Elimination Bracket Generator ─── */

async function generateSingleElimination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  participants: { id: string; player_id: string; seed: number | null }[]
) {
  const n = participants.length;

  // Seed players: if seeds not assigned, shuffle; otherwise use seed order
  const seeded = [...participants];
  const hasSeeds = seeded.some((p) => p.seed !== null);

  if (!hasSeeds) {
    // Fisher-Yates shuffle
    for (let i = seeded.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seeded[i], seeded[j]] = [seeded[j], seeded[i]];
    }
    // Assign seeds
    for (let i = 0; i < seeded.length; i++) {
      await supabase
        .from("tournament_participants")
        .update({ seed: i + 1 })
        .eq("id", seeded[i].id);
    }
  } else {
    seeded.sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  }

  // Calculate bracket size (next power of 2)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const totalRounds = Math.ceil(Math.log2(bracketSize));

  // Generate all match slots (working backwards from final)
  // Round 1 has bracketSize/2 matches, round 2 has bracketSize/4, etc.
  const allMatches: Array<{
    round: number;
    match_order: number;
    player1_id: string | null;
    player2_id: string | null;
    bracket_position: string;
    status: string;
    tournament_id: string;
  }> = [];

  // Round 1: fill with players, byes where needed
  const round1MatchCount = bracketSize / 2;
  const byeCount = bracketSize - n;

  for (let i = 0; i < round1MatchCount; i++) {
    const p1Index = i;
    const p2Index = bracketSize - 1 - i; // Standard bracket seeding

    const p1 = p1Index < n ? seeded[p1Index].player_id : null;
    const p2 = p2Index < n ? seeded[p2Index].player_id : null;

    const isBye = !p1 || !p2;
    const label = getRoundLabel(1, i, totalRounds);

    allMatches.push({
      round: 1,
      match_order: i,
      player1_id: p1,
      player2_id: p2,
      bracket_position: label,
      status: isBye ? "bye" : "pending",
      tournament_id: tournamentId,
    });
  }

  // Insert round 1 matches
  const { data: round1Data, error: r1Err } = await supabase
    .from("tournament_matches")
    .insert(allMatches)
    .select("id, match_order, status, player1_id, player2_id");

  if (r1Err) throw new Error(r1Err.message);

  // For bye matches, set winner
  const round1Matches = round1Data ?? [];
  for (const m of round1Matches) {
    if (m.status === "bye") {
      const winnerId = m.player1_id ?? m.player2_id;
      if (winnerId) {
        await supabase
          .from("tournament_matches")
          .update({ winner_id: winnerId })
          .eq("id", m.id);
      }
    }
  }

  // Generate subsequent rounds (empty slots)
  let prevRoundIds = round1Matches.map((m) => m.id);

  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = prevRoundIds.length / 2;
    const roundMatches: Array<{
      round: number;
      match_order: number;
      player1_id: null;
      player2_id: null;
      bracket_position: string;
      status: string;
      tournament_id: string;
    }> = [];

    for (let i = 0; i < matchCount; i++) {
      const label = getRoundLabel(round, i, totalRounds);
      roundMatches.push({
        round,
        match_order: i,
        player1_id: null,
        player2_id: null,
        bracket_position: label,
        status: "pending",
        tournament_id: tournamentId,
      });
    }

    const { data: roundData, error: rErr } = await supabase
      .from("tournament_matches")
      .insert(roundMatches)
      .select("id");

    if (rErr) throw new Error(rErr.message);

    const roundIds = (roundData ?? []).map((m) => m.id);

    // Link previous round matches to next round
    for (let i = 0; i < prevRoundIds.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      const nextMatchId = roundIds[nextMatchIndex];
      await supabase
        .from("tournament_matches")
        .update({ next_match_id: nextMatchId })
        .eq("id", prevRoundIds[i]);
    }

    prevRoundIds = roundIds;
  }

  // Create 3rd place match (between semifinal losers)
  // Only if bracket has at least 4 players (i.e. semifinals exist)
  if (totalRounds >= 2) {
    const { data: thirdPlaceMatch, error: tpErr } = await supabase
      .from("tournament_matches")
      .insert({
        round: totalRounds, // same round as Final
        match_order: 1, // after the Final (which is match_order 0)
        player1_id: null,
        player2_id: null,
        bracket_position: "3P",
        status: "pending",
        tournament_id: tournamentId,
      })
      .select("id")
      .single();

    if (tpErr) {
      console.error("[Bracket] Error creating 3rd place match:", tpErr);
    } else {
      console.log(`[Bracket] Created 3rd place match: ${thirdPlaceMatch.id}`);
    }
  }
}

/* ─── Round Robin Generator ─── */

async function generateRoundRobin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  participants: { id: string; player_id: string }[]
) {
  const players = participants.map((p) => p.player_id);
  const n = players.length;

  // If odd number, add a "ghost" player for BYE
  const isOdd = n % 2 !== 0;
  if (isOdd) players.push("BYE");

  const totalPlayers = players.length;
  const totalRounds = totalPlayers - 1;

  // Circle method for round robin scheduling
  const fixed = players[0];
  const rotating = players.slice(1);

  const allMatches: Array<{
    tournament_id: string;
    round: number;
    match_order: number;
    player1_id: string | null;
    player2_id: string | null;
    status: string;
    bracket_position: string;
  }> = [];

  for (let round = 0; round < totalRounds; round++) {
    const roundPlayers = [fixed, ...rotating];
    const matchCount = totalPlayers / 2;

    for (let i = 0; i < matchCount; i++) {
      const p1 = roundPlayers[i];
      const p2 = roundPlayers[totalPlayers - 1 - i];

      const isBye = p1 === "BYE" || p2 === "BYE";

      allMatches.push({
        tournament_id: tournamentId,
        round: round + 1,
        match_order: i,
        player1_id: p1 === "BYE" ? null : p1,
        player2_id: p2 === "BYE" ? null : p2,
        status: isBye ? "bye" : "pending",
        bracket_position: `R${round + 1}-M${i + 1}`,
      });
    }

    // Rotate: move last to second position
    rotating.unshift(rotating.pop()!);
  }

  const { error } = await supabase.from("tournament_matches").insert(allMatches);
  if (error) throw new Error(error.message);
}

/* ─── Swiss Round 1 Generator ─── */

async function generateSwissRound1(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  participants: { id: string; player_id: string }[]
) {
  // Swiss round 1: random pairing
  const players = [...participants];

  // Shuffle
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  const matches: Array<{
    tournament_id: string;
    round: number;
    match_order: number;
    player1_id: string | null;
    player2_id: string | null;
    status: string;
    bracket_position: string;
  }> = [];

  for (let i = 0; i < players.length; i += 2) {
    const p1 = players[i];
    const p2 = players[i + 1] ?? null;

    matches.push({
      tournament_id: tournamentId,
      round: 1,
      match_order: Math.floor(i / 2),
      player1_id: p1.player_id,
      player2_id: p2?.player_id ?? null,
      status: p2 ? "pending" : "bye",
      bracket_position: `R1-M${Math.floor(i / 2) + 1}`,
    });
  }

  const { error } = await supabase.from("tournament_matches").insert(matches);
  if (error) throw new Error(error.message);

  // Set bye winners
  if (players.length % 2 !== 0) {
    const lastMatch = matches[matches.length - 1];
    if (lastMatch.status === "bye" && lastMatch.player1_id) {
      await supabase
        .from("tournament_matches")
        .update({ winner_id: lastMatch.player1_id })
        .eq("tournament_id", tournamentId)
        .eq("round", 1)
        .eq("match_order", lastMatch.match_order);
    }
  }
}

/* ─── Helpers ─── */

function getRoundLabel(round: number, matchIndex: number, totalRounds: number): string {
  const fromEnd = totalRounds - round + 1;
  if (fromEnd === 1) return "F";
  if (fromEnd === 2) return `SF${matchIndex + 1}`;
  if (fromEnd === 3) return `QF${matchIndex + 1}`;
  return `R${round}-M${matchIndex + 1}`;
}
