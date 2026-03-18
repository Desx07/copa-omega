import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/award-xp";
import { getCurrentWeekStart } from "@/lib/missions";

/**
 * GET /api/combos
 * Returns shared combos sorted by net votes (upvotes - downvotes).
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

    const { data: combos, error } = await supabase
      .from("shared_combos")
      .select("*, player:players!player_id(alias, avatar_url)")
      .order("upvotes", { ascending: false })
      .limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Get current user's votes on these combos
    const comboIds = (combos ?? []).map((c) => c.id);
    let myVotes: Record<string, string> = {};

    if (comboIds.length > 0) {
      const { data: votes } = await supabase
        .from("combo_votes")
        .select("combo_id, vote")
        .eq("player_id", user.id)
        .in("combo_id", comboIds);

      if (votes) {
        myVotes = Object.fromEntries(votes.map((v) => [v.combo_id, v.vote]));
      }
    }

    return Response.json({
      combos: combos ?? [],
      my_votes: myVotes,
    });
  } catch (err) {
    console.error("GET /api/combos error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/combos
 * Body: { blade, ratchet, bit, type, description?, context? }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { blade, ratchet, bit, type, description, context } = body;

    if (!blade || !ratchet || !bit || !type) {
      return Response.json(
        { error: "Faltan campos: blade, ratchet, bit, type" },
        { status: 400 }
      );
    }

    const validTypes = ["attack", "defense", "stamina", "balance"];
    if (!validTypes.includes(type)) {
      return Response.json(
        { error: "Tipo invalido. Debe ser: attack, defense, stamina o balance" },
        { status: 400 }
      );
    }

    const validContexts = ["next_tournament", "general", "counter"];
    if (context && !validContexts.includes(context)) {
      return Response.json(
        { error: "Contexto invalido. Debe ser: next_tournament, general o counter" },
        { status: 400 }
      );
    }

    if (description && description.length > 200) {
      return Response.json(
        { error: "La descripcion no puede superar 200 caracteres" },
        { status: 400 }
      );
    }

    const { data: combo, error } = await supabase
      .from("shared_combos")
      .insert({
        player_id: user.id,
        blade,
        ratchet,
        bit,
        type,
        description: description || null,
        context: context || null,
      })
      .select("*, player:players!player_id(alias, avatar_url)")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Award XP for sharing combo (fire-and-forget)
    try {
      await awardXp(supabase, user.id, 3, "share_combo", "Combo compartido");
    } catch (xpErr) {
      console.error("Error awarding combo XP:", xpErr);
    }

    // Auto-complete mission (fire-and-forget)
    supabase.from("player_missions").upsert({
      player_id: user.id,
      week_start: getCurrentWeekStart(),
      mission_id: "combo",
      completed_at: new Date().toISOString(),
    }, { onConflict: "player_id,week_start,mission_id" }).then(() => {}).catch(e => console.error("mission upsert:", e));

    return Response.json(combo, { status: 201 });
  } catch (err) {
    console.error("POST /api/combos error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
