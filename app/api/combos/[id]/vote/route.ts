import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/combos/[id]/vote
 * Body: { vote: 'up' | 'down' }
 * Toggles: if same vote exists, removes it. If opposite exists, switches.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: comboId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { vote } = body;

    if (!vote || !["up", "down"].includes(vote)) {
      return Response.json(
        { error: "Vote debe ser 'up' o 'down'" },
        { status: 400 }
      );
    }

    // Check combo exists
    const { data: combo } = await supabase
      .from("shared_combos")
      .select("id, upvotes, downvotes, player_id")
      .eq("id", comboId)
      .single();

    if (!combo) {
      return Response.json({ error: "Combo no encontrado" }, { status: 404 });
    }

    // Can't vote on own combo
    if (combo.player_id === user.id) {
      return Response.json({ error: "No podes votar tu propio combo" }, { status: 400 });
    }

    // Check existing vote
    const { data: existingVote } = await supabase
      .from("combo_votes")
      .select("vote")
      .eq("combo_id", comboId)
      .eq("player_id", user.id)
      .maybeSingle();

    let upDelta = 0;
    let downDelta = 0;

    if (existingVote) {
      if (existingVote.vote === vote) {
        // Same vote — remove it (toggle off)
        await supabase
          .from("combo_votes")
          .delete()
          .eq("combo_id", comboId)
          .eq("player_id", user.id);

        if (vote === "up") upDelta = -1;
        else downDelta = -1;
      } else {
        // Different vote — switch
        await supabase
          .from("combo_votes")
          .delete()
          .eq("combo_id", comboId)
          .eq("player_id", user.id);

        await supabase
          .from("combo_votes")
          .insert({ combo_id: comboId, player_id: user.id, vote });

        if (vote === "up") {
          upDelta = 1;
          downDelta = -1;
        } else {
          upDelta = -1;
          downDelta = 1;
        }
      }
    } else {
      // No existing vote — insert new
      await supabase
        .from("combo_votes")
        .insert({ combo_id: comboId, player_id: user.id, vote });

      if (vote === "up") upDelta = 1;
      else downDelta = 1;
    }

    // Update combo counts (use admin client to bypass RLS — no UPDATE policy on shared_combos)
    const adminClient = createAdminClient();
    const { data: updated, error } = await adminClient
      .from("shared_combos")
      .update({
        upvotes: combo.upvotes + upDelta,
        downvotes: combo.downvotes + downDelta,
      })
      .eq("id", comboId)
      .select("id, upvotes, downvotes")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(updated);
  } catch (err) {
    console.error("POST /api/combos/[id]/vote error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
