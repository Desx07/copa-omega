import { createClient } from "@/lib/supabase/server";

// GET /api/coliseo -- Lista de eventos coliseo
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: events, error } = await supabase
      .from("coliseo_events")
      .select(
        `*,
         winner:players!winner_id(id, alias, avatar_url),
         participant_count:coliseo_participants(count),
         participants:coliseo_participants(
           id, player_id, placement, eliminated_at,
           player:players!player_id(id, alias, avatar_url, omega_coins)
         )`
      )
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Aplanar conteo
    const result = (events ?? []).map((e) => ({
      ...e,
      participant_count:
        Array.isArray(e.participant_count) && e.participant_count.length > 0
          ? (e.participant_count[0] as { count: number }).count
          : 0,
    }));

    return Response.json(result);
  } catch (err) {
    console.error("GET /api/coliseo error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/coliseo -- Crear evento coliseo (admin/judge)
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

    // Verificar admin o juez
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin, is_judge")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin && !adminPlayer?.is_judge) {
      return Response.json(
        { error: "Solo administradores o jueces" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, max_players, entry_fee_oc } = body;

    if (!name) {
      return Response.json(
        { error: "Falta el nombre del evento" },
        { status: 400 }
      );
    }

    const maxP = max_players ?? 8;
    const fee = entry_fee_oc ?? 0;

    if (typeof maxP !== "number" || maxP < 2 || maxP > 32) {
      return Response.json(
        { error: "max_players debe ser entre 2 y 32" },
        { status: 400 }
      );
    }

    if (typeof fee !== "number" || fee < 0) {
      return Response.json(
        { error: "entry_fee_oc debe ser >= 0" },
        { status: 400 }
      );
    }

    const { data: event, error: insertError } = await supabase
      .from("coliseo_events")
      .insert({
        name,
        max_players: maxP,
        entry_fee_oc: fee,
        prize_pool_oc: 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(event, { status: 201 });
  } catch (err) {
    console.error("POST /api/coliseo error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
