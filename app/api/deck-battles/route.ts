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
    const filter = searchParams.get("filter") ?? "all";

    let query = supabase
      .from("deck_battles")
      .select(
        "*, challenger:players!challenger_id(id, alias, avatar_url, stars), opponent:players!opponent_id(id, alias, avatar_url, stars)"
      )
      .order("created_at", { ascending: false });

    switch (filter) {
      case "pending_for_me":
        query = query
          .eq("opponent_id", user.id)
          .eq("status", "pending");
        break;
      case "my_sent":
        query = query
          .eq("challenger_id", user.id)
          .in("status", ["pending", "accepted"]);
        break;
      case "active":
        query = query.in("status", ["pending", "accepted", "in_progress"]);
        break;
      case "completed":
        query = query.eq("status", "completed");
        break;
      case "mine":
        query = query.or(
          `challenger_id.eq.${user.id},opponent_id.eq.${user.id}`
        );
        break;
      case "all":
      default:
        // Sin filtro extra — todos los battles
        break;
    }

    const { data: battles, error } = await query.limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(battles);
  } catch (err) {
    console.error("GET /api/deck-battles error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

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
    const { opponent_id, omega_coins_bet } = body;

    if (!opponent_id) {
      return Response.json(
        { error: "Falta opponent_id" },
        { status: 400 }
      );
    }

    if (opponent_id === user.id) {
      return Response.json(
        { error: "No podes retarte a vos mismo" },
        { status: 400 }
      );
    }

    const coinsBet = typeof omega_coins_bet === "number" ? omega_coins_bet : 0;
    if (coinsBet < 0 || coinsBet > 10) {
      return Response.json(
        { error: "omega_coins_bet debe ser entre 0 y 10" },
        { status: 400 }
      );
    }

    // Verificar que ambos jugadores existan y no esten eliminados
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, alias, stars, is_eliminated, is_admin")
      .in("id", [user.id, opponent_id]);

    if (playersError) {
      return Response.json({ error: playersError.message }, { status: 500 });
    }

    if (!players || players.length !== 2) {
      return Response.json(
        { error: "Uno o ambos jugadores no existen" },
        { status: 404 }
      );
    }

    const challenger = players.find((p) => p.id === user.id);
    const opponent = players.find((p) => p.id === opponent_id);

    if (challenger?.is_eliminated || opponent?.is_eliminated) {
      return Response.json(
        { error: "Uno o ambos jugadores estan eliminados" },
        { status: 400 }
      );
    }

    if (opponent?.is_admin) {
      return Response.json(
        { error: "No se puede retar al administrador" },
        { status: 400 }
      );
    }

    // Verificar que el challenger tenga un deck armado
    const { data: challengerDeck } = await supabase
      .from("player_decks")
      .select("*")
      .eq("player_id", user.id)
      .maybeSingle();

    if (!challengerDeck) {
      return Response.json(
        { error: "Necesitas armar tu deck antes de retar a alguien" },
        { status: 400 }
      );
    }

    // Verificar que no haya un reto pendiente entre estos jugadores
    const { data: existing } = await supabase
      .from("deck_battles")
      .select("id")
      .or(
        `and(challenger_id.eq.${user.id},opponent_id.eq.${opponent_id}),and(challenger_id.eq.${opponent_id},opponent_id.eq.${user.id})`
      )
      .in("status", ["pending", "accepted", "in_progress"])
      .limit(1);

    if (existing && existing.length > 0) {
      return Response.json(
        { error: "Ya tenes un deck battle activo con este blader" },
        { status: 409 }
      );
    }

    // Crear la batalla — guardar snapshot del deck del challenger
    const challengerDeckSnapshot = {
      slot1: { blade: challengerDeck.slot1_blade, ratchet: challengerDeck.slot1_ratchet, bit: challengerDeck.slot1_bit },
      slot2: { blade: challengerDeck.slot2_blade, ratchet: challengerDeck.slot2_ratchet, bit: challengerDeck.slot2_bit },
      slot3: { blade: challengerDeck.slot3_blade, ratchet: challengerDeck.slot3_ratchet, bit: challengerDeck.slot3_bit },
    };

    const { data: battle, error: insertError } = await supabase
      .from("deck_battles")
      .insert({
        challenger_id: user.id,
        opponent_id,
        omega_coins_bet: coinsBet,
        challenger_deck: challengerDeckSnapshot,
      })
      .select(
        "*, challenger:players!challenger_id(id, alias, avatar_url, stars), opponent:players!opponent_id(id, alias, avatar_url, stars)"
      )
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Feed event
    await supabase.from("activity_feed").insert({
      type: "deck_battle_created",
      actor_id: user.id,
      target_id: opponent_id,
      reference_id: battle.id,
      metadata: {
        omega_coins_bet: coinsBet,
        challenger_alias: challenger?.alias,
        opponent_alias: opponent?.alias,
      },
    });

    return Response.json(battle, { status: 201 });
  } catch (err) {
    console.error("POST /api/deck-battles error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
