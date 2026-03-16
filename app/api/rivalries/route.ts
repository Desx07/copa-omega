import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("player_id") || user.id;

    // Get all completed matches involving this player
    const { data: matches, error } = await supabase
      .from("matches")
      .select("player1_id, player2_id, winner_id, stars_bet, completed_at")
      .eq("status", "completed")
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
      .order("completed_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Also get tournament matches
    const { data: tournamentMatches, error: tournamentMatchesError } = await supabase
      .from("tournament_matches")
      .select("player1_id, player2_id, winner_id, completed_at")
      .eq("status", "completed")
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`);

    if (tournamentMatchesError) {
      console.error("[rivalries] Error fetching tournament_matches:", tournamentMatchesError);
    }

    // Combine and count opponents
    const opponentStats = new Map<
      string,
      {
        wins: number;
        losses: number;
        total: number;
        last_match: string;
        stars_exchanged: number;
      }
    >();

    const allMatches = [...(matches ?? []), ...(tournamentMatches ?? [])];

    for (const m of allMatches) {
      const opponentId =
        m.player1_id === playerId ? m.player2_id : m.player1_id;
      if (!opponentId) continue;

      const current = opponentStats.get(opponentId) || {
        wins: 0,
        losses: 0,
        total: 0,
        last_match: "",
        stars_exchanged: 0,
      };

      current.total++;
      if (m.winner_id === playerId) current.wins++;
      else if (m.winner_id === opponentId) current.losses++;
      if (
        m.completed_at &&
        (!current.last_match || m.completed_at > current.last_match)
      ) {
        current.last_match = m.completed_at;
      }
      if ("stars_bet" in m && typeof m.stars_bet === "number")
        current.stars_exchanged += m.stars_bet;

      opponentStats.set(opponentId, current);
    }

    // Filter to rivalries (3+ matches)
    const rivalryIds = Array.from(opponentStats.entries())
      .filter(([, stats]) => stats.total >= 3)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([id]) => id);

    if (rivalryIds.length === 0) {
      return Response.json([]);
    }

    // Fetch player info for rivals
    const { data: rivalPlayers, error: rivalPlayersError } = await supabase
      .from("players")
      .select("id, alias, avatar_url, stars, current_title")
      .in("id", rivalryIds);

    if (rivalPlayersError) {
      console.error("[rivalries] Error fetching rival players:", rivalPlayersError);
      return Response.json({ error: rivalPlayersError.message }, { status: 500 });
    }

    const rivalries = rivalryIds.map((rivalId) => {
      const stats = opponentStats.get(rivalId)!;
      const player = rivalPlayers?.find((p) => p.id === rivalId);
      return {
        rival: player,
        wins: stats.wins,
        losses: stats.losses,
        total_matches: stats.total,
        last_match: stats.last_match,
        stars_exchanged: stats.stars_exchanged,
        dominance:
          stats.total > 0
            ? Math.round((stats.wins / stats.total) * 100)
            : 0,
      };
    });

    return Response.json(rivalries);
  } catch (err) {
    console.error("GET /api/rivalries error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
