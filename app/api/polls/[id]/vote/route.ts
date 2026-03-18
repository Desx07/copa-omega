import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/award-xp";
import { getCurrentWeekStart } from "@/lib/missions";

/**
 * POST /api/polls/[id]/vote
 * Body: { option_index: number }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { option_index } = body;

    if (option_index == null || typeof option_index !== "number") {
      return Response.json(
        { error: "Falta option_index (numero)" },
        { status: 400 }
      );
    }

    // Check poll exists and is active
    const { data: poll } = await supabase
      .from("polls")
      .select("id, options, is_active, expires_at")
      .eq("id", pollId)
      .single();

    if (!poll) {
      return Response.json({ error: "Encuesta no encontrada" }, { status: 404 });
    }

    if (!poll.is_active) {
      return Response.json({ error: "La encuesta ya no esta activa" }, { status: 400 });
    }

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return Response.json({ error: "La encuesta ha expirado" }, { status: 400 });
    }

    // Validate option_index
    const options = poll.options as string[];
    if (option_index < 0 || option_index >= options.length) {
      return Response.json(
        { error: `option_index debe ser entre 0 y ${options.length - 1}` },
        { status: 400 }
      );
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from("poll_votes")
      .select("option_index")
      .eq("poll_id", pollId)
      .eq("player_id", user.id)
      .maybeSingle();

    if (existingVote) {
      return Response.json(
        { error: "Ya votaste en esta encuesta" },
        { status: 409 }
      );
    }

    // Insert vote
    const { error: insertError } = await supabase
      .from("poll_votes")
      .insert({
        poll_id: pollId,
        player_id: user.id,
        option_index,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return Response.json({ error: "Ya votaste en esta encuesta" }, { status: 409 });
      }
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Award XP for voting (fire-and-forget)
    try {
      await awardXp(supabase, user.id, 2, "vote_poll", "Voto en encuesta");
    } catch (xpErr) {
      console.error("Error awarding poll vote XP:", xpErr);
    }

    // Auto-complete mission (fire-and-forget)
    supabase.from("player_missions").upsert({
      player_id: user.id,
      week_start: getCurrentWeekStart(),
      mission_id: "poll",
      completed_at: new Date().toISOString(),
    }, { onConflict: "player_id,week_start,mission_id" }).then(() => {}, e => console.error("mission upsert:", e));

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/polls/[id]/vote error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
