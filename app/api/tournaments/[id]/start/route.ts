import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Match Generation Helpers ────────────────────────────────────

interface Participant {
  id: string;
  player_id: string;
  seed: number | null;
  points: number;
}

interface MatchInsert {
  tournament_id: string;
  round: number;
  match_order: number;
  player1_id: string | null;
  player2_id: string | null;
  status: "pending" | "bye";
  bracket_position: string | null;
  stage: "group" | "finals" | null;
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Next power of 2 >= n */
function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Round Robin: all combinations */
function generateRoundRobin(
  tournamentId: string,
  participants: Participant[]
): MatchInsert[] {
  const matches: MatchInsert[] = [];
  let order = 0;

  // Use circle method for proper round assignment
  const players = [...participants];
  const n = players.length;

  // If odd number of players, add a ghost for byes
  if (n % 2 !== 0) {
    players.push({ id: "ghost", player_id: "ghost", seed: null, points: 0 });
  }

  const totalPlayers = players.length;
  const totalRounds = totalPlayers - 1;

  // Fix first player, rotate the rest
  const fixed = players[0];
  const rotating = players.slice(1);

  for (let round = 0; round < totalRounds; round++) {
    const currentRotation = [
      ...rotating.slice(rotating.length - round),
      ...rotating.slice(0, rotating.length - round),
    ];

    const roundPlayers = [fixed, ...currentRotation];

    for (let i = 0; i < totalPlayers / 2; i++) {
      const p1 = roundPlayers[i];
      const p2 = roundPlayers[totalPlayers - 1 - i];

      // Skip matches involving the ghost player (bye)
      if (p1.player_id === "ghost" || p2.player_id === "ghost") continue;

      matches.push({
        tournament_id: tournamentId,
        round: round + 1,
        match_order: order++,
        player1_id: p1.player_id,
        player2_id: p2.player_id,
        status: "pending",
        bracket_position: null,
        stage: "group",
      });
    }
  }

  return matches;
}

/** Single Elimination: bracket with byes */
function generateSingleElimination(
  tournamentId: string,
  participants: Participant[]
): MatchInsert[] {
  const n = participants.length;
  const bracketSize = nextPowerOf2(n);
  const totalRounds = Math.log2(bracketSize);

  // Seed players (shuffle if no seeds assigned)
  const seeded = participants.some((p) => p.seed != null)
    ? [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999))
    : shuffle(participants);

  // Place players into bracket slots with byes distributed evenly
  // Byes go to top seeds (first players in seeded list)
  const slots: (Participant | null)[] = new Array(bracketSize).fill(null);

  // Standard bracket seeding: place seeds in bracket order
  // For simplicity, fill sequentially and let byes be null
  for (let i = 0; i < seeded.length; i++) {
    slots[i] = seeded[i];
  }

  const matches: MatchInsert[] = [];
  let order = 0;

  // Generate bracket labels
  function bracketLabel(round: number, pos: number): string {
    if (round === totalRounds) return "F";
    if (round === totalRounds - 1) return `SF${pos + 1}`;
    if (round === totalRounds - 2) return `QF${pos + 1}`;
    return `R${round}-M${pos + 1}`;
  }

  // Generate first round matches
  const firstRoundMatchCount = bracketSize / 2;
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const p1 = slots[i * 2];
    const p2 = slots[i * 2 + 1];

    const isBye = p1 === null || p2 === null;

    matches.push({
      tournament_id: tournamentId,
      round: 1,
      match_order: order++,
      player1_id: p1?.player_id ?? null,
      player2_id: p2?.player_id ?? null,
      status: isBye ? "bye" : "pending",
      bracket_position: bracketLabel(1, i),
      stage: null,
    });
  }

  // Generate subsequent round placeholder matches
  let prevRoundCount = firstRoundMatchCount;
  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = prevRoundCount / 2;
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        tournament_id: tournamentId,
        round,
        match_order: order++,
        player1_id: null,
        player2_id: null,
        status: "pending",
        bracket_position: bracketLabel(round, i),
        stage: null,
      });
    }
    prevRoundCount = matchCount;
  }

  return matches;
}

/** Swiss Round 1: random pairings */
function generateSwissRound1(
  tournamentId: string,
  participants: Participant[]
): MatchInsert[] {
  const shuffled = shuffle(participants);
  const matches: MatchInsert[] = [];
  let order = 0;

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    matches.push({
      tournament_id: tournamentId,
      round: 1,
      match_order: order++,
      player1_id: shuffled[i].player_id,
      player2_id: shuffled[i + 1]?.player_id ?? null,
      status: shuffled[i + 1] ? "pending" : "bye",
      bracket_position: null,
      stage: "group",
    });
  }

  // If odd number, last player gets a bye
  if (shuffled.length % 2 !== 0) {
    matches.push({
      tournament_id: tournamentId,
      round: 1,
      match_order: order++,
      player1_id: shuffled[shuffled.length - 1].player_id,
      player2_id: null,
      status: "bye",
      bracket_position: null,
      stage: "group",
    });
  }

  return matches;
}

// ─── Route Handler ───────────────────────────────────────────────

// POST /api/tournaments/[id]/start — Start tournament, generate matches (admin only)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check admin
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    // Fetch tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (tournamentError) {
      if (tournamentError.code === "PGRST116") {
        return Response.json(
          { error: "Torneo no encontrado" },
          { status: 404 }
        );
      }
      return Response.json(
        { error: tournamentError.message },
        { status: 500 }
      );
    }

    if (tournament.status !== "registration") {
      return Response.json(
        { error: "El torneo no está en fase de inscripción" },
        { status: 400 }
      );
    }

    // Fetch participants
    const { data: participants, error: participantsError } = await supabase
      .from("tournament_participants")
      .select("id, player_id, seed, points")
      .eq("tournament_id", tournamentId);

    if (participantsError) {
      return Response.json(
        { error: participantsError.message },
        { status: 500 }
      );
    }

    if (!participants || participants.length < 2) {
      return Response.json(
        { error: "Se necesitan al menos 2 participantes para iniciar" },
        { status: 400 }
      );
    }

    console.log(`[Start] Starting tournament ${tournamentId} with ${participants.length} players, format=${tournament.format}`);

    // Generate matches based on format
    let matchInserts: MatchInsert[];

    switch (tournament.format) {
      case "round_robin":
        matchInserts = generateRoundRobin(tournamentId, participants);
        break;
      case "single_elimination":
        matchInserts = generateSingleElimination(tournamentId, participants);
        break;
      case "swiss":
        matchInserts = generateSwissRound1(tournamentId, participants);
        break;
      default:
        return Response.json(
          { error: `Formato desconocido: ${tournament.format}` },
          { status: 400 }
        );
    }

    // Use admin client for all inserts to bypass RLS
    const adminSupabase = createAdminClient();

    // Insert all matches
    const { data: createdMatches, error: matchError } = await adminSupabase
      .from("tournament_matches")
      .insert(matchInserts)
      .select();

    if (matchError) {
      console.error("[Start] Error inserting matches:", matchError);
      return Response.json({ error: matchError.message }, { status: 500 });
    }

    console.log(`[Start] Created ${createdMatches?.length ?? 0} matches`);

    // For single elimination, link next_match_id for bracket progression
    if (tournament.format === "single_elimination" && createdMatches) {
      const sorted = [...createdMatches].sort(
        (a, b) => a.match_order - b.match_order
      );
      const byRound = new Map<number, typeof sorted>();
      for (const m of sorted) {
        const arr = byRound.get(m.round) || [];
        arr.push(m);
        byRound.set(m.round, arr);
      }

      const totalRounds = Math.max(...Array.from(byRound.keys()));

      // Link next_match_id
      for (let round = 1; round < totalRounds; round++) {
        const currentRound = byRound.get(round) ?? [];
        const nextRound = byRound.get(round + 1) ?? [];

        for (let i = 0; i < currentRound.length; i++) {
          const nextMatchIndex = Math.floor(i / 2);
          if (nextMatchIndex < nextRound.length) {
            const { error: linkErr } = await adminSupabase
              .from("tournament_matches")
              .update({ next_match_id: nextRound[nextMatchIndex].id })
              .eq("id", currentRound[i].id);
            if (linkErr) {
              console.error(`[Start] Error linking match ${currentRound[i].id}:`, linkErr);
            }
          }
        }
      }

      console.log(`[Start] Linked next_match_id for bracket progression`);

      // Auto-advance bye matches: winners move to next round
      const byeMatches = sorted.filter(
        (m) => m.status === "bye" && m.round === 1
      );

      console.log(`[Start] Found ${byeMatches.length} bye matches to auto-advance`);

      for (const byeMatch of byeMatches) {
        const winnerId = byeMatch.player1_id ?? byeMatch.player2_id;
        if (!winnerId) {
          console.error(`[Start] Bye match ${byeMatch.id} has no player, skipping`);
          continue;
        }

        console.log(`[Start] Auto-advancing bye match ${byeMatch.id}, winner=${winnerId}`);

        // Mark bye match as completed with the present player as winner
        const { error: byeUpdateErr } = await adminSupabase
          .from("tournament_matches")
          .update({
            winner_id: winnerId,
            completed_at: new Date().toISOString(),
          })
          .eq("id", byeMatch.id);

        if (byeUpdateErr) {
          console.error(`[Start] Error updating bye match ${byeMatch.id}:`, byeUpdateErr);
          continue;
        }

        // Refetch to get the linked next_match_id (was linked above)
        const { data: linkedBye } = await adminSupabase
          .from("tournament_matches")
          .select("id, match_order, next_match_id")
          .eq("id", byeMatch.id)
          .single();

        if (!linkedBye?.next_match_id) {
          console.error(`[Start] Bye match ${byeMatch.id} has no next_match_id after linking`);
          continue;
        }

        console.log(`[Start] Bye match ${byeMatch.id} next_match_id=${linkedBye.next_match_id}`);

        // Find all matches that feed into the same next match to determine slot
        const { data: feeders } = await adminSupabase
          .from("tournament_matches")
          .select("id, match_order")
          .eq("next_match_id", linkedBye.next_match_id)
          .order("match_order", { ascending: true });

        if (feeders) {
          const feederIndex = feeders.findIndex(
            (f) => f.id === byeMatch.id
          );
          const slot = feederIndex === 0 ? "player1_id" : "player2_id";

          console.log(`[Start] Advancing winner to ${slot} of match ${linkedBye.next_match_id}`);

          const { error: advanceErr } = await adminSupabase
            .from("tournament_matches")
            .update({ [slot]: winnerId })
            .eq("id", linkedBye.next_match_id);

          if (advanceErr) {
            console.error(`[Start] Error advancing bye winner to next match:`, advanceErr);
          }
        } else {
          console.error(`[Start] No feeders found for next_match_id=${linkedBye.next_match_id}`);
        }
      }
    }

    // For Swiss bye matches, auto-award the point
    if (tournament.format === "swiss" && createdMatches) {
      const byeMatches = createdMatches.filter((m) => m.status === "bye");
      for (const byeMatch of byeMatches) {
        const winnerId = byeMatch.player1_id;
        if (!winnerId) continue;

        console.log(`[Start] Swiss bye: auto-resolving match ${byeMatch.id} for player ${winnerId}`);

        const { error: byeErr } = await adminSupabase
          .from("tournament_matches")
          .update({
            winner_id: winnerId,
            player1_score: 1,
            completed_at: new Date().toISOString(),
          })
          .eq("id", byeMatch.id);

        if (byeErr) {
          console.error(`[Start] Error auto-resolving swiss bye ${byeMatch.id}:`, byeErr);
          continue;
        }

        // Award point to the participant
        const { error: pointErr } = await adminSupabase
          .from("tournament_participants")
          .update({ points: 3, tournament_wins: 1 })
          .eq("tournament_id", tournamentId)
          .eq("player_id", winnerId);

        if (pointErr) {
          console.error(`[Start] Error awarding swiss bye points for ${winnerId}:`, pointErr);
        }
      }
    }

    // Update tournament status
    // If round_robin/swiss with top_cut, set stage to group_stage
    const hasTopCut = tournament.top_cut != null && tournament.top_cut > 0;
    const initialStage =
      hasTopCut && (tournament.format === "round_robin" || tournament.format === "swiss")
        ? "group_stage"
        : null;

    const { error: updateError } = await supabase
      .from("tournaments")
      .update({
        status: "in_progress",
        current_round: 1,
        started_at: new Date().toISOString(),
        stage: initialStage,
      })
      .eq("id", tournamentId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[Start] Tournament started: status=in_progress, stage=${initialStage}`);

    return Response.json(
      {
        success: true,
        message: "Torneo iniciado",
        matches_created: createdMatches?.length ?? 0,
        format: tournament.format,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/tournaments/[id]/start error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
