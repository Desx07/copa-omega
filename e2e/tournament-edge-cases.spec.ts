import { test, expect } from "./fixtures";
import { adminSupabase, TEST_USERS } from "./helpers/auth";

// ─── Helpers ──────────────────────────────────────────────────────────

/** Create quick test players with auth accounts */
async function createQuickPlayers(
  count: number,
  prefix: string
): Promise<string[]> {
  const ids: string[] = [];
  const ts = Date.now();
  for (let i = 0; i < count; i++) {
    const email = `${prefix.toLowerCase()}${i + 1}-${ts}@copaomega.test`;
    // Check if alias already exists
    const { data: existing } = await adminSupabase
      .from("players")
      .select("id")
      .eq("alias", `${prefix}${i + 1}`)
      .maybeSingle();

    if (existing) {
      ids.push(existing.id);
      continue;
    }

    // Create auth user (which auto-creates player row via trigger or we update)
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: "TestQuick123!",
      email_confirm: true,
      user_metadata: { full_name: `${prefix} ${i + 1}`, alias: `${prefix}${i + 1}` },
    });

    if (authError) throw new Error(`Failed to create auth user: ${authError.message}`);
    if (!authData.user) throw new Error("No user returned from auth create");

    // Update player profile
    await adminSupabase
      .from("players")
      .update({ alias: `${prefix}${i + 1}`, full_name: `${prefix} ${i + 1}` })
      .eq("id", authData.user.id);

    ids.push(authData.user.id);
  }
  return ids;
}

/** Clean up quick-created auth users */
async function cleanupQuickPlayers(ids: string[]) {
  for (const id of ids) {
    try {
      await adminSupabase.from("players").delete().eq("id", id);
      await adminSupabase.auth.admin.deleteUser(id);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/** Get admin player id */
async function getAdminId(): Promise<string> {
  const { data } = await adminSupabase
    .from("players")
    .select("id")
    .eq("alias", TEST_USERS.admin.alias)
    .single();

  if (!data) throw new Error("Admin player not found");
  return data.id;
}

/** Create a tournament */
async function createTournament(opts: {
  name: string;
  format: "single_elimination" | "round_robin" | "swiss";
  maxParticipants: number;
  createdBy: string;
}): Promise<string> {
  const { data, error } = await adminSupabase
    .from("tournaments")
    .insert({
      name: opts.name,
      description: `Edge-case test: ${opts.name}`,
      format: opts.format,
      max_participants: opts.maxParticipants,
      status: "registration",
      created_by: opts.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create tournament: ${error.message}`);
  return data!.id;
}

/** Register a list of player IDs for a tournament */
async function registerPlayers(
  tournamentId: string,
  playerIds: string[]
): Promise<void> {
  for (const playerId of playerIds) {
    const { error } = await adminSupabase
      .from("tournament_participants")
      .upsert(
        { tournament_id: tournamentId, player_id: playerId },
        { onConflict: "tournament_id,player_id" }
      );
    if (error)
      throw new Error(`Failed to register player ${playerId}: ${error.message}`);
  }
}

/**
 * Simulate the bracket generation logic from
 * app/api/tournaments/[id]/start/route.ts
 * directly via the database (the API requires auth cookies we don't have in
 * pure data tests). This replicates the exact algorithm.
 */
async function startTournamentDirect(tournamentId: string): Promise<void> {
  // Fetch tournament
  const { data: tournament, error: tErr } = await adminSupabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (tErr || !tournament) throw new Error("Tournament not found");
  if (tournament.status !== "registration")
    throw new Error("Tournament not in registration");

  // Fetch participants
  const { data: participants, error: pErr } = await adminSupabase
    .from("tournament_participants")
    .select("id, player_id, seed, points")
    .eq("tournament_id", tournamentId);

  if (pErr || !participants || participants.length < 2)
    throw new Error("Not enough participants");

  type Participant = (typeof participants)[0];

  // ── Match generation by format ──
  if (tournament.format === "single_elimination") {
    await generateSingleEliminationDirect(tournamentId, participants);
  } else if (tournament.format === "round_robin") {
    await generateRoundRobinDirect(tournamentId, participants);
  } else {
    throw new Error(`Unsupported format in test: ${tournament.format}`);
  }

  // Update status
  await adminSupabase
    .from("tournaments")
    .update({
      status: "in_progress",
      current_round: 1,
      started_at: new Date().toISOString(),
    })
    .eq("id", tournamentId);
}

/** Replicates the single elimination algorithm from the start route */
async function generateSingleEliminationDirect(
  tournamentId: string,
  participants: { id: string; player_id: string; seed: number | null; points: number }[]
): Promise<void> {
  const n = participants.length;

  // Shuffle (no seeds in tests)
  const seeded = [...participants];
  for (let i = seeded.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seeded[i], seeded[j]] = [seeded[j], seeded[i]];
  }

  const bracketSize = nextPowerOf2(n);
  const totalRounds = Math.ceil(Math.log2(bracketSize));

  // Build slots
  const slots: (typeof seeded[0] | null)[] = new Array(bracketSize).fill(null);
  for (let i = 0; i < seeded.length; i++) {
    slots[i] = seeded[i];
  }

  function bracketLabel(round: number, pos: number): string {
    const fromEnd = totalRounds - round + 1;
    if (fromEnd === 1) return "F";
    if (fromEnd === 2) return `SF${pos + 1}`;
    if (fromEnd === 3) return `QF${pos + 1}`;
    return `R${round}-M${pos + 1}`;
  }

  // Round 1 matches — use standard bracket seeding (same as API)
  // Match i: player[i] vs player[bracketSize-1-i]
  const round1MatchCount = bracketSize / 2;
  const round1Inserts = [];
  for (let i = 0; i < round1MatchCount; i++) {
    const p1Index = i;
    const p2Index = bracketSize - 1 - i;
    const p1 = p1Index < n ? seeded[p1Index] : null;
    const p2 = p2Index < n ? seeded[p2Index] : null;
    const isBye = p1 === null || p2 === null;

    round1Inserts.push({
      tournament_id: tournamentId,
      round: 1,
      match_order: i,
      player1_id: p1?.player_id ?? null,
      player2_id: p2?.player_id ?? null,
      status: isBye ? "bye" : "pending",
      bracket_position: bracketLabel(1, i),
    });
  }

  const { data: round1Data, error: r1Err } = await adminSupabase
    .from("tournament_matches")
    .insert(round1Inserts)
    .select("id, match_order, status, player1_id, player2_id");

  if (r1Err) throw new Error(`Round 1 insert error: ${r1Err.message}`);

  const round1Matches = round1Data ?? [];

  // Set winners for bye matches
  for (const m of round1Matches) {
    if (m.status === "bye") {
      const winnerId = m.player1_id ?? m.player2_id;
      if (winnerId) {
        await adminSupabase
          .from("tournament_matches")
          .update({ winner_id: winnerId, completed_at: new Date().toISOString() })
          .eq("id", m.id);
      }
    }
  }

  // Generate subsequent rounds
  let prevRoundIds = round1Matches
    .sort((a, b) => a.match_order - b.match_order)
    .map((m) => m.id);

  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = prevRoundIds.length / 2;
    const roundInserts = [];
    for (let i = 0; i < matchCount; i++) {
      roundInserts.push({
        tournament_id: tournamentId,
        round,
        match_order: i,
        player1_id: null,
        player2_id: null,
        bracket_position: bracketLabel(round, i),
        status: "pending",
      });
    }

    const { data: roundData, error: rErr } = await adminSupabase
      .from("tournament_matches")
      .insert(roundInserts)
      .select("id");

    if (rErr) throw new Error(`Round ${round} insert error: ${rErr.message}`);

    const roundIds = (roundData ?? []).map((m) => m.id);

    // Link previous round to next
    for (let i = 0; i < prevRoundIds.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      await adminSupabase
        .from("tournament_matches")
        .update({ next_match_id: roundIds[nextMatchIndex] })
        .eq("id", prevRoundIds[i]);
    }

    prevRoundIds = roundIds;
  }

  // Auto-advance bye winners to next round
  const byeMatches = round1Matches.filter((m) => m.status === "bye");
  for (const byeMatch of byeMatches) {
    const winnerId = byeMatch.player1_id ?? byeMatch.player2_id;
    if (!winnerId) continue;

    // Refetch with next_match_id
    const { data: linked } = await adminSupabase
      .from("tournament_matches")
      .select("id, match_order, next_match_id")
      .eq("id", byeMatch.id)
      .single();

    if (!linked?.next_match_id) continue;

    // Find feeders to determine slot
    const { data: feeders } = await adminSupabase
      .from("tournament_matches")
      .select("id, match_order")
      .eq("next_match_id", linked.next_match_id)
      .order("match_order", { ascending: true });

    if (feeders) {
      const feederIndex = feeders.findIndex((f) => f.id === byeMatch.id);
      const slot = feederIndex === 0 ? "player1_id" : "player2_id";
      await adminSupabase
        .from("tournament_matches")
        .update({ [slot]: winnerId })
        .eq("id", linked.next_match_id);
    }
  }
}

/** Replicates the round robin algorithm from the start route */
async function generateRoundRobinDirect(
  tournamentId: string,
  participants: { id: string; player_id: string }[]
): Promise<void> {
  const players = participants.map((p) => p.player_id);
  const n = players.length;

  const isOdd = n % 2 !== 0;
  if (isOdd) players.push("BYE");

  const totalPlayers = players.length;
  const totalRounds = totalPlayers - 1;

  const fixed = players[0];
  const rotating = players.slice(1);

  const allMatches: {
    tournament_id: string;
    round: number;
    match_order: number;
    player1_id: string | null;
    player2_id: string | null;
    status: string;
    bracket_position: string;
  }[] = [];

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

  const { error } = await adminSupabase
    .from("tournament_matches")
    .insert(allMatches);

  if (error) throw new Error(`Round robin insert error: ${error.message}`);
}

/** Resolve a match: set winner, advance in bracket if single elimination */
async function resolveMatch(
  tournamentId: string,
  matchId: string,
  winnerId: string,
  p1Score: number,
  p2Score: number
): Promise<void> {
  // Fetch the match
  const { data: match } = await adminSupabase
    .from("tournament_matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match) throw new Error(`Match ${matchId} not found`);

  const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;

  // Update match
  await adminSupabase
    .from("tournament_matches")
    .update({
      winner_id: winnerId,
      player1_score: p1Score,
      player2_score: p2Score,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  // Update winner participant stats
  const { data: winnerP } = await adminSupabase
    .from("tournament_participants")
    .select("points, tournament_wins")
    .eq("tournament_id", tournamentId)
    .eq("player_id", winnerId)
    .single();

  if (winnerP) {
    await adminSupabase
      .from("tournament_participants")
      .update({
        points: winnerP.points + 3,
        tournament_wins: winnerP.tournament_wins + 1,
      })
      .eq("tournament_id", tournamentId)
      .eq("player_id", winnerId);
  }

  // Update loser stats
  if (loserId) {
    const { data: loserP } = await adminSupabase
      .from("tournament_participants")
      .select("tournament_losses")
      .eq("tournament_id", tournamentId)
      .eq("player_id", loserId)
      .single();

    if (loserP) {
      await adminSupabase
        .from("tournament_participants")
        .update({
          tournament_losses: loserP.tournament_losses + 1,
          is_eliminated: true,
        })
        .eq("tournament_id", tournamentId)
        .eq("player_id", loserId);
    }
  }

  // Advance winner in bracket
  if (match.next_match_id) {
    const { data: feeders } = await adminSupabase
      .from("tournament_matches")
      .select("id, match_order")
      .eq("next_match_id", match.next_match_id)
      .order("match_order", { ascending: true });

    if (feeders) {
      const feederIndex = feeders.findIndex((f) => f.id === matchId);
      const slot = feederIndex === 0 ? "player1_id" : "player2_id";
      await adminSupabase
        .from("tournament_matches")
        .update({ [slot]: winnerId })
        .eq("id", match.next_match_id);
    }
  }
}

/** Clean up a tournament and its related data, plus quick-created players */
async function cleanup(
  tournamentId: string | null,
  quickPlayerIds: string[]
): Promise<void> {
  if (tournamentId) {
    await adminSupabase
      .from("tournament_participants")
      .delete()
      .eq("tournament_id", tournamentId);
    await adminSupabase
      .from("tournament_matches")
      .delete()
      .eq("tournament_id", tournamentId);
    await adminSupabase
      .from("tournaments")
      .delete()
      .eq("id", tournamentId);
  }

  await cleanupQuickPlayers(quickPlayerIds);
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// ─── Tests ────────────────────────────────────────────────────────────

test.describe("Tournament Edge Cases", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 1: 3 players single elimination (4-slot bracket, 1 bye)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("3 players single elimination — 1 bye, correct bracket structure", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(3, "Edge3P");

      tournamentId = await createTournament({
        name: "Test Edge 3P SE",
        format: "single_elimination",
        maxParticipants: 4,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      // Verify 3 participants registered
      const { count: participantCount } = await adminSupabase
        .from("tournament_participants")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", tournamentId);
      expect(participantCount).toBe(3);

      // Start tournament
      await startTournamentDirect(tournamentId);

      // Fetch all matches
      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(matches).toBeTruthy();

      // 3 players -> 4-slot bracket -> 2 rounds
      // Round 1: 2 matches (one real, one bye)
      // Round 2: 1 match (final)
      // Total: 3 matches
      expect(matches!.length).toBe(3);

      const round1 = matches!.filter((m) => m.round === 1);
      const round2 = matches!.filter((m) => m.round === 2);

      expect(round1.length).toBe(2);
      expect(round2.length).toBe(1);

      // Exactly 1 bye match in round 1
      const byeMatches = round1.filter((m) => m.status === "bye");
      expect(byeMatches.length).toBe(1);

      // The bye match should have a winner already set (auto-advanced)
      const byeMatch = byeMatches[0];
      expect(byeMatch.winner_id).toBeTruthy();
      expect(byeMatch.player1_id || byeMatch.player2_id).toBeTruthy();

      // Exactly 1 pending match in round 1
      const pendingMatches = round1.filter((m) => m.status === "pending");
      expect(pendingMatches.length).toBe(1);
      expect(pendingMatches[0].player1_id).toBeTruthy();
      expect(pendingMatches[0].player2_id).toBeTruthy();

      // Final match should exist as pending
      expect(round2[0].status).toBe("pending");
      expect(round2[0].bracket_position).toBe("F");

      // The bye winner should already be advanced to the final
      const finalMatch = round2[0];
      const byeWinnerId = byeMatch.winner_id;
      const advancedToFinal =
        finalMatch.player1_id === byeWinnerId ||
        finalMatch.player2_id === byeWinnerId;
      expect(advancedToFinal).toBe(true);

      // Every round-1 match should have a next_match_id pointing to the final
      for (const m of round1) {
        expect(m.next_match_id).toBe(finalMatch.id);
      }

      // Bracket positions should be correct for a 4-slot bracket (2 rounds)
      // Round 1 = semifinals, Round 2 = final
      expect(round1[0].bracket_position).toBe("SF1");
      expect(round1[1].bracket_position).toBe("SF2");
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 2: 5 players single elimination (8-slot bracket, 3 byes)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("5 players single elimination — 3 byes in 8-slot bracket", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(5, "Edge5P");

      tournamentId = await createTournament({
        name: "Test Edge 5P SE",
        format: "single_elimination",
        maxParticipants: 8,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(matches).toBeTruthy();

      // 5 players -> 8-slot bracket -> 3 rounds
      // Round 1: 4 matches (bracketSize/2=4)
      // Round 2: 2 matches
      // Round 3: 1 match (final)
      // Total: 7 matches
      expect(matches!.length).toBe(7);

      const round1 = matches!.filter((m) => m.round === 1);
      const round2 = matches!.filter((m) => m.round === 2);
      const round3 = matches!.filter((m) => m.round === 3);

      expect(round1.length).toBe(4);
      expect(round2.length).toBe(2);
      expect(round3.length).toBe(1);

      // 8-slot bracket with 5 players = 3 byes
      const byeMatches = round1.filter((m) => m.status === "bye");
      expect(byeMatches.length).toBe(3);

      // All byes should have winner_id set (auto-advanced)
      for (const bye of byeMatches) {
        expect(bye.winner_id).toBeTruthy();
      }

      // 2 real first-round matches: only one match should have two real players
      const pendingR1 = round1.filter((m) => m.status === "pending");
      expect(pendingR1.length).toBe(1);
      expect(pendingR1[0].player1_id).toBeTruthy();
      expect(pendingR1[0].player2_id).toBeTruthy();

      // Bye winners should be advanced to round 2
      for (const bye of byeMatches) {
        const advancedMatch = matches!.find(
          (m) => m.id === bye.next_match_id
        );
        expect(advancedMatch).toBeTruthy();
        const hasAdvanced =
          advancedMatch!.player1_id === bye.winner_id ||
          advancedMatch!.player2_id === bye.winner_id;
        expect(hasAdvanced).toBe(true);
      }

      // Final bracket position
      expect(round3[0].bracket_position).toBe("F");

      // Verify bracket labels for 8-slot (3 rounds)
      // Round 1 = QF, Round 2 = SF, Round 3 = F
      for (const m of round1) {
        expect(m.bracket_position).toMatch(/^QF\d+$/);
      }
      for (const m of round2) {
        expect(m.bracket_position).toMatch(/^SF\d+$/);
      }
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 3: 7 players single elimination (8-slot bracket, 1 bye)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("7 players single elimination — 1 bye in 8-slot bracket", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(7, "Edge7P");

      tournamentId = await createTournament({
        name: "Test Edge 7P SE",
        format: "single_elimination",
        maxParticipants: 8,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(matches).toBeTruthy();

      // 7 players -> 8-slot bracket -> 3 rounds
      // Round 1: 4 matches
      // Round 2: 2 matches
      // Round 3: 1 match
      // Total: 7 matches
      expect(matches!.length).toBe(7);

      const round1 = matches!.filter((m) => m.round === 1);

      // Only 1 bye (8 - 7 = 1 empty slot)
      const byeMatches = round1.filter((m) => m.status === "bye");
      expect(byeMatches.length).toBe(1);

      // 3 real matches in round 1
      const pendingR1 = round1.filter((m) => m.status === "pending");
      expect(pendingR1.length).toBe(3);

      // All pending matches should have both players
      for (const m of pendingR1) {
        expect(m.player1_id).toBeTruthy();
        expect(m.player2_id).toBeTruthy();
      }

      // Bye match winner should be advanced
      const bye = byeMatches[0];
      expect(bye.winner_id).toBeTruthy();
      const nextMatch = matches!.find((m) => m.id === bye.next_match_id);
      expect(nextMatch).toBeTruthy();
      const advancedCorrectly =
        nextMatch!.player1_id === bye.winner_id ||
        nextMatch!.player2_id === bye.winner_id;
      expect(advancedCorrectly).toBe(true);

      // All round 1 matches linked to round 2
      const round2Ids = matches!
        .filter((m) => m.round === 2)
        .map((m) => m.id);
      for (const m of round1) {
        expect(round2Ids).toContain(m.next_match_id);
      }
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 4: Full lifecycle — 4 player single elimination
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("4 players full lifecycle — create, start, resolve all matches, verify podium", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(4, "Life4P");

      tournamentId = await createTournament({
        name: "Test Lifecycle 4P SE",
        format: "single_elimination",
        maxParticipants: 4,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      // Fetch matches
      const { data: allMatches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(allMatches).toBeTruthy();

      // 4 players -> 4-slot bracket -> 2 rounds
      // Round 1: 2 matches, Round 2: 1 match
      // No byes (power of 2)
      expect(allMatches!.length).toBe(3);

      const round1 = allMatches!.filter((m) => m.round === 1);
      const round2 = allMatches!.filter((m) => m.round === 2);

      expect(round1.length).toBe(2);
      expect(round2.length).toBe(1);

      // No byes for exact power-of-2
      const byeCount = round1.filter((m) => m.status === "bye").length;
      expect(byeCount).toBe(0);

      // All round 1 matches should have both players
      for (const m of round1) {
        expect(m.player1_id).toBeTruthy();
        expect(m.player2_id).toBeTruthy();
      }

      // ── Resolve Semi-Final 1: player1 wins ──
      const sf1 = round1[0];
      await resolveMatch(tournamentId, sf1.id, sf1.player1_id!, 3, 1);

      // ── Resolve Semi-Final 2: player1 wins ──
      const sf2 = round1[1];
      await resolveMatch(tournamentId, sf2.id, sf2.player1_id!, 2, 0);

      // Verify winners are advanced to the final
      const { data: finalMatch } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("id", round2[0].id)
        .single();

      expect(finalMatch).toBeTruthy();
      expect(finalMatch!.player1_id).toBe(sf1.player1_id);
      expect(finalMatch!.player2_id).toBe(sf2.player1_id);

      // ── Resolve Final: sf1 winner takes the tournament ──
      const champion = sf1.player1_id!;
      const runnerUp = sf2.player1_id!;
      await resolveMatch(tournamentId, finalMatch!.id, champion, 4, 2);

      // Mark tournament as completed
      await adminSupabase
        .from("tournaments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", tournamentId);

      // Verify tournament is completed
      const { data: completedTournament } = await adminSupabase
        .from("tournaments")
        .select("status")
        .eq("id", tournamentId)
        .single();

      expect(completedTournament!.status).toBe("completed");

      // Verify all matches are completed
      const { data: finalMatches } = await adminSupabase
        .from("tournament_matches")
        .select("status, winner_id")
        .eq("tournament_id", tournamentId);

      for (const m of finalMatches!) {
        expect(m.status).toBe("completed");
        expect(m.winner_id).toBeTruthy();
      }

      // Verify champion has the most wins (2 wins: SF + Final)
      const { data: championStats } = await adminSupabase
        .from("tournament_participants")
        .select("points, tournament_wins, tournament_losses, is_eliminated")
        .eq("tournament_id", tournamentId)
        .eq("player_id", champion)
        .single();

      expect(championStats!.tournament_wins).toBe(2);
      expect(championStats!.points).toBe(6); // 3 points per win x 2

      // Runner-up: 1 win (SF), 1 loss (final)
      const { data: runnerUpStats } = await adminSupabase
        .from("tournament_participants")
        .select("points, tournament_wins, tournament_losses, is_eliminated")
        .eq("tournament_id", tournamentId)
        .eq("player_id", runnerUp)
        .single();

      expect(runnerUpStats!.tournament_wins).toBe(1);
      expect(runnerUpStats!.tournament_losses).toBe(1);
      expect(runnerUpStats!.is_eliminated).toBe(true);

      // Semi-final losers: 0 wins, 1 loss, eliminated
      const sfLosers = [sf1.player2_id!, sf2.player2_id!];
      for (const loserId of sfLosers) {
        const { data: loserStats } = await adminSupabase
          .from("tournament_participants")
          .select("tournament_wins, tournament_losses, is_eliminated")
          .eq("tournament_id", tournamentId)
          .eq("player_id", loserId)
          .single();

        expect(loserStats!.tournament_wins).toBe(0);
        expect(loserStats!.tournament_losses).toBe(1);
        expect(loserStats!.is_eliminated).toBe(true);
      }
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 5: Round robin with 3 players — 3 matches (each pair plays once)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("3 players round robin — 3 real matches, each pair plays once", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(3, "RR3P");

      tournamentId = await createTournament({
        name: "Test Edge 3P RR",
        format: "round_robin",
        maxParticipants: 4,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(matches).toBeTruthy();

      // 3 players round robin:
      // With circle method for odd N: add ghost -> 4 players -> 3 rounds
      // Each round: 2 pairs, but one pair includes ghost -> skip
      // So each round has 1 real match + 1 bye
      // Total real matches = 3 (C(3,2) = 3), plus bye matches

      // Count real (non-bye) matches
      const realMatches = matches!.filter((m) => m.status !== "bye");
      expect(realMatches.length).toBe(3);

      // Verify each pair plays exactly once
      const pairs = new Set<string>();
      for (const m of realMatches) {
        expect(m.player1_id).toBeTruthy();
        expect(m.player2_id).toBeTruthy();
        const pair = [m.player1_id, m.player2_id].sort().join("-");
        pairs.add(pair);
      }

      // Should be exactly 3 unique pairs (C(3,2) = 3)
      expect(pairs.size).toBe(3);

      // Each player should appear in exactly 2 real matches
      const playerAppearances = new Map<string, number>();
      for (const m of realMatches) {
        playerAppearances.set(
          m.player1_id!,
          (playerAppearances.get(m.player1_id!) ?? 0) + 1
        );
        playerAppearances.set(
          m.player2_id!,
          (playerAppearances.get(m.player2_id!) ?? 0) + 1
        );
      }

      expect(playerAppearances.size).toBe(3);
      for (const count of Array.from(playerAppearances.values())) {
        expect(count).toBe(2);
      }

      // Bye matches: with 3 players (odd), each round has 1 bye
      const byeMatches = matches!.filter((m) => m.status === "bye");
      expect(byeMatches.length).toBe(3); // 3 rounds, 1 bye each

      // Verify rounds: 3 rounds (circle method with 4 virtual players)
      const rounds = new Set(matches!.map((m) => m.round));
      expect(rounds.size).toBe(3);
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 6: 12 players single elimination (16-slot bracket, 4 byes)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("12 players single elimination — 4 byes in 16-slot bracket", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(12, "Edge12P");

      tournamentId = await createTournament({
        name: "Test Edge 12P SE",
        format: "single_elimination",
        maxParticipants: 16,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(matches).toBeTruthy();

      // 12 players -> 16-slot bracket -> 4 rounds
      // Round 1: 8 matches, Round 2: 4, Round 3: 2 (SFs), Round 4: 1 (Final)
      // Total: 15 matches
      expect(matches!.length).toBe(15);

      const round1 = matches!.filter((m) => m.round === 1);
      const round2 = matches!.filter((m) => m.round === 2);
      const round3 = matches!.filter((m) => m.round === 3);
      const round4 = matches!.filter((m) => m.round === 4);

      expect(round1.length).toBe(8);
      expect(round2.length).toBe(4);
      expect(round3.length).toBe(2);
      expect(round4.length).toBe(1);

      // 16 - 12 = 4 byes
      const byeMatches = round1.filter((m) => m.status === "bye");
      expect(byeMatches.length).toBe(4);

      // 4 real matches in round 1
      const pendingR1 = round1.filter((m) => m.status === "pending");
      expect(pendingR1.length).toBe(4);

      // All bye winners should be advanced
      for (const bye of byeMatches) {
        expect(bye.winner_id).toBeTruthy();
        const next = matches!.find((m) => m.id === bye.next_match_id);
        expect(next).toBeTruthy();
        const advanced =
          next!.player1_id === bye.winner_id ||
          next!.player2_id === bye.winner_id;
        expect(advanced).toBe(true);
      }

      // Final should be labeled "F"
      expect(round4[0].bracket_position).toBe("F");

      // Round 3 should be semifinals
      for (const m of round3) {
        expect(m.bracket_position).toMatch(/^SF\d+$/);
      }

      // Round 2 should be quarterfinals
      for (const m of round2) {
        expect(m.bracket_position).toMatch(/^QF\d+$/);
      }

      // Round 1 for 16-slot bracket = R1-Mx
      for (const m of round1) {
        expect(m.bracket_position).toMatch(/^R1-M\d+$/);
      }
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 7: 15 players single elimination (16-slot bracket, 1 bye)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("15 players single elimination — 1 bye in 16-slot bracket", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(15, "Edge15P");

      tournamentId = await createTournament({
        name: "Test Edge 15P SE",
        format: "single_elimination",
        maxParticipants: 16,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(matches).toBeTruthy();

      // 15 players -> 16-slot bracket -> 15 total matches
      expect(matches!.length).toBe(15);

      const round1 = matches!.filter((m) => m.round === 1);

      // 16 - 15 = 1 bye
      const byeMatches = round1.filter((m) => m.status === "bye");
      expect(byeMatches.length).toBe(1);

      // 7 real matches in round 1
      const pendingR1 = round1.filter((m) => m.status === "pending");
      expect(pendingR1.length).toBe(7);

      // All pending matches should have both players
      for (const m of pendingR1) {
        expect(m.player1_id).toBeTruthy();
        expect(m.player2_id).toBeTruthy();
      }

      // The single bye should be advanced
      const bye = byeMatches[0];
      expect(bye.winner_id).toBeTruthy();

      // Every match in the tournament should be connected via next_match_id
      // (except the final which has no next)
      const finalMatch = matches!.find((m) => m.bracket_position === "F");
      expect(finalMatch).toBeTruthy();
      expect(finalMatch!.next_match_id).toBeNull();

      // All non-final matches should have a next_match_id
      const nonFinalMatches = matches!.filter(
        (m) => m.bracket_position !== "F"
      );
      for (const m of nonFinalMatches) {
        expect(m.next_match_id).toBeTruthy();
      }
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 8: Bracket integrity — next_match_id chain is valid
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("bracket integrity — next_match_id chain connects all rounds correctly", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(8, "Chain8P");

      tournamentId = await createTournament({
        name: "Test Chain 8P SE",
        format: "single_elimination",
        maxParticipants: 8,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(matches).toBeTruthy();

      // 8 players = perfect bracket, 0 byes
      // R1: 4 matches, R2: 2, R3: 1 = 7 total
      expect(matches!.length).toBe(7);

      const round1 = matches!.filter((m) => m.round === 1);
      const round2 = matches!.filter((m) => m.round === 2);
      const round3 = matches!.filter((m) => m.round === 3);

      // No byes in a perfect bracket
      const byeCount = round1.filter((m) => m.status === "bye").length;
      expect(byeCount).toBe(0);

      // All R1 matches should be pending with two players
      for (const m of round1) {
        expect(m.status).toBe("pending");
        expect(m.player1_id).toBeTruthy();
        expect(m.player2_id).toBeTruthy();
      }

      // Verify chain: R1 match 0 and 1 feed into R2 match 0
      expect(round1[0].next_match_id).toBe(round2[0].id);
      expect(round1[1].next_match_id).toBe(round2[0].id);

      // R1 match 2 and 3 feed into R2 match 1
      expect(round1[2].next_match_id).toBe(round2[1].id);
      expect(round1[3].next_match_id).toBe(round2[1].id);

      // R2 match 0 and 1 feed into the final
      expect(round2[0].next_match_id).toBe(round3[0].id);
      expect(round2[1].next_match_id).toBe(round3[0].id);

      // Final has no next
      expect(round3[0].next_match_id).toBeNull();

      // Every feeder pair maps to exactly one next match (2-to-1 ratio)
      for (const nextMatch of round2) {
        const feeders = round1.filter(
          (m) => m.next_match_id === nextMatch.id
        );
        expect(feeders.length).toBe(2);
      }

      const finalFeeders = round2.filter(
        (m) => m.next_match_id === round3[0].id
      );
      expect(finalFeeders.length).toBe(2);
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 9: Winner propagation through multi-round bracket
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("winner propagation — resolving matches advances winners correctly through rounds", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(6, "Prop6P");

      tournamentId = await createTournament({
        name: "Test Propagation 6P SE",
        format: "single_elimination",
        maxParticipants: 8,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: initialMatches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(initialMatches).toBeTruthy();

      const round1 = initialMatches!.filter((m) => m.round === 1);
      const round2 = initialMatches!.filter((m) => m.round === 2);

      // 6 players in 8-slot = 2 byes, 2 pending in R1
      const pendingR1 = round1.filter((m) => m.status === "pending");
      expect(pendingR1.length).toBe(2);

      // Resolve both pending R1 matches
      for (const m of pendingR1) {
        await resolveMatch(tournamentId, m.id, m.player1_id!, 3, 1);
      }

      // Verify that R2 matches now have both players filled
      const { data: r2After } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("round", 2)
        .order("match_order", { ascending: true });

      expect(r2After).toBeTruthy();
      for (const m of r2After!) {
        expect(m.player1_id).toBeTruthy();
        expect(m.player2_id).toBeTruthy();
      }

      // Resolve R2 matches
      for (const m of r2After!) {
        await resolveMatch(tournamentId, m.id, m.player1_id!, 4, 2);
      }

      // Verify final has both players
      const { data: finalAfter } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("round", 3)
        .single();

      expect(finalAfter).toBeTruthy();
      expect(finalAfter!.player1_id).toBeTruthy();
      expect(finalAfter!.player2_id).toBeTruthy();
      expect(finalAfter!.status).toBe("pending");

      // Resolve final
      await resolveMatch(
        tournamentId,
        finalAfter!.id,
        finalAfter!.player1_id!,
        5,
        3
      );

      // Verify final is completed
      const { data: completedFinal } = await adminSupabase
        .from("tournament_matches")
        .select("status, winner_id")
        .eq("id", finalAfter!.id)
        .single();

      expect(completedFinal!.status).toBe("completed");
      expect(completedFinal!.winner_id).toBe(finalAfter!.player1_id);
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 10: 2 players — minimum viable tournament
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("2 players single elimination — minimum viable tournament, single final", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(2, "Min2P");

      tournamentId = await createTournament({
        name: "Test Min 2P SE",
        format: "single_elimination",
        maxParticipants: 2,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true });

      expect(matches).toBeTruthy();

      // 2 players -> 2-slot bracket -> 1 round, 1 match (the final)
      expect(matches!.length).toBe(1);
      expect(matches![0].round).toBe(1);
      expect(matches![0].bracket_position).toBe("F");
      expect(matches![0].status).toBe("pending");
      expect(matches![0].player1_id).toBeTruthy();
      expect(matches![0].player2_id).toBeTruthy();
      expect(matches![0].next_match_id).toBeNull();

      // Resolve the only match
      await resolveMatch(
        tournamentId,
        matches![0].id,
        matches![0].player1_id!,
        3,
        0
      );

      // Verify it's completed
      const { data: resolved } = await adminSupabase
        .from("tournament_matches")
        .select("status, winner_id")
        .eq("id", matches![0].id)
        .single();

      expect(resolved!.status).toBe("completed");
      expect(resolved!.winner_id).toBe(matches![0].player1_id);
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 11: Round robin 4 players — 6 matches, no byes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("4 players round robin — 6 matches, no byes, all unique pairs", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(4, "RR4P");

      tournamentId = await createTournament({
        name: "Test Edge 4P RR",
        format: "round_robin",
        maxParticipants: 4,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(matches).toBeTruthy();

      // 4 players even count: no byes needed
      // C(4,2) = 6 matches total
      // 3 rounds, 2 matches per round
      const realMatches = matches!.filter((m) => m.status !== "bye");
      expect(realMatches.length).toBe(6);

      const byeMatches = matches!.filter((m) => m.status === "bye");
      expect(byeMatches.length).toBe(0);

      // 3 rounds
      const rounds = new Set(matches!.map((m) => m.round));
      expect(rounds.size).toBe(3);

      // 2 matches per round
      for (const roundNum of Array.from(rounds)) {
        const roundMatches = matches!.filter((m) => m.round === roundNum);
        expect(roundMatches.length).toBe(2);
      }

      // All unique pairs
      const pairs = new Set<string>();
      for (const m of realMatches) {
        expect(m.player1_id).toBeTruthy();
        expect(m.player2_id).toBeTruthy();
        const pair = [m.player1_id, m.player2_id].sort().join("-");
        pairs.add(pair);
      }
      expect(pairs.size).toBe(6);

      // Each player appears in exactly 3 matches
      const appearances = new Map<string, number>();
      for (const m of realMatches) {
        appearances.set(m.player1_id!, (appearances.get(m.player1_id!) ?? 0) + 1);
        appearances.set(m.player2_id!, (appearances.get(m.player2_id!) ?? 0) + 1);
      }
      expect(appearances.size).toBe(4);
      for (const count of Array.from(appearances.values())) {
        expect(count).toBe(3);
      }
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 12: Round robin 5 players — odd count with byes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("5 players round robin — 10 matches, byes for odd count", async () => {
    let tournamentId: string | null = null;
    let quickPlayerIds: string[] = [];

    try {
      const adminId = await getAdminId();
      quickPlayerIds = await createQuickPlayers(5, "RR5P");

      tournamentId = await createTournament({
        name: "Test Edge 5P RR",
        format: "round_robin",
        maxParticipants: 6,
        createdBy: adminId,
      });

      await registerPlayers(tournamentId, quickPlayerIds);

      await startTournamentDirect(tournamentId);

      const { data: matches } = await adminSupabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true });

      expect(matches).toBeTruthy();

      // 5 players odd: add ghost -> 6 virtual players -> 5 rounds
      // Each round: 3 pairs, 1 bye (ghost match)
      // C(5,2) = 10 real matches
      const realMatches = matches!.filter((m) => m.status !== "bye");
      expect(realMatches.length).toBe(10);

      // 5 rounds of byes (one per round)
      const byeMatches = matches!.filter((m) => m.status === "bye");
      expect(byeMatches.length).toBe(5);

      // 5 rounds total
      const rounds = new Set(matches!.map((m) => m.round));
      expect(rounds.size).toBe(5);

      // All unique pairs
      const pairs = new Set<string>();
      for (const m of realMatches) {
        const pair = [m.player1_id, m.player2_id].sort().join("-");
        pairs.add(pair);
      }
      expect(pairs.size).toBe(10);

      // Each player appears in exactly 4 real matches
      const appearances = new Map<string, number>();
      for (const m of realMatches) {
        appearances.set(m.player1_id!, (appearances.get(m.player1_id!) ?? 0) + 1);
        appearances.set(m.player2_id!, (appearances.get(m.player2_id!) ?? 0) + 1);
      }
      expect(appearances.size).toBe(5);
      for (const count of Array.from(appearances.values())) {
        expect(count).toBe(4);
      }
    } finally {
      await cleanup(tournamentId, quickPlayerIds);
    }
  });
});
