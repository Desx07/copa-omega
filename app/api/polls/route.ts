import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/polls
 * Returns active polls with vote counts and current user's vote.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get active polls (not expired)
    const { data: polls, error } = await supabase
      .from("polls")
      .select("*, creator:players!created_by(alias)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Get all vote counts for these polls
    const pollIds = (polls ?? []).map((p) => p.id);
    let voteCounts: Record<string, Record<number, number>> = {};
    let myVotes: Record<string, number> = {};

    if (pollIds.length > 0) {
      const { data: allVotes } = await supabase
        .from("poll_votes")
        .select("poll_id, option_index, player_id")
        .in("poll_id", pollIds);

      if (allVotes) {
        for (const v of allVotes) {
          if (!voteCounts[v.poll_id]) voteCounts[v.poll_id] = {};
          voteCounts[v.poll_id][v.option_index] = (voteCounts[v.poll_id][v.option_index] || 0) + 1;

          if (v.player_id === user.id) {
            myVotes[v.poll_id] = v.option_index;
          }
        }
      }
    }

    const enrichedPolls = (polls ?? []).map((poll) => ({
      ...poll,
      vote_counts: voteCounts[poll.id] || {},
      total_votes: Object.values(voteCounts[poll.id] || {}).reduce((a: number, b: number) => a + b, 0),
      my_vote: myVotes[poll.id] ?? null,
    }));

    return Response.json(enrichedPolls);
  } catch (err) {
    console.error("GET /api/polls error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
