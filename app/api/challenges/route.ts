import { createClient } from "@/lib/supabase/server";
import { sendPushToPlayer } from "@/lib/push";
import { getCurrentWeekStart } from "@/lib/missions";

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
    const filter = searchParams.get("filter") ?? "pending_for_me";

    let query = supabase
      .from("challenges")
      .select(
        "*, challenger:players!challenger_id(id, alias, avatar_url, stars), challenged:players!challenged_id(id, alias, avatar_url, stars)"
      )
      .order("created_at", { ascending: false });

    switch (filter) {
      case "pending_for_me":
        query = query
          .eq("challenged_id", user.id)
          .eq("status", "pending");
        break;
      case "my_sent":
        query = query
          .eq("challenger_id", user.id)
          .in("status", ["pending", "accepted"]);
        break;
      case "all_active":
        query = query.in("status", ["pending", "accepted"]);
        break;
      default:
        query = query
          .eq("challenged_id", user.id)
          .eq("status", "pending");
    }

    const { data: challenges, error } = await query.limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(challenges);
  } catch (err) {
    console.error("GET /api/challenges error:", err);
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
    const { challenged_id, stars_bet, message } = body;

    if (!challenged_id || stars_bet == null) {
      return Response.json(
        { error: "Faltan campos: challenged_id, stars_bet" },
        { status: 400 }
      );
    }

    if (challenged_id === user.id) {
      return Response.json(
        { error: "No podes retarte a vos mismo" },
        { status: 400 }
      );
    }

    if (typeof stars_bet !== "number" || stars_bet < 1 || stars_bet > 5) {
      return Response.json(
        { error: "stars_bet debe ser entre 1 y 5" },
        { status: 400 }
      );
    }

    if (message && typeof message === "string" && message.length > 120) {
      return Response.json(
        { error: "El mensaje no puede superar 120 caracteres" },
        { status: 400 }
      );
    }

    // Verify both players exist and have enough stars
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, alias, stars, is_eliminated")
      .in("id", [user.id, challenged_id]);

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
    const challenged = players.find((p) => p.id === challenged_id);

    if (challenger?.is_eliminated || challenged?.is_eliminated) {
      return Response.json(
        { error: "Uno o ambos jugadores estan eliminados" },
        { status: 400 }
      );
    }

    if ((challenger?.stars ?? 0) < stars_bet) {
      return Response.json(
        { error: `No tenes suficientes estrellas (tenes ${challenger?.stars})` },
        { status: 400 }
      );
    }

    if ((challenged?.stars ?? 0) < stars_bet) {
      return Response.json(
        { error: `${challenged?.alias} no tiene suficientes estrellas (tiene ${challenged?.stars})` },
        { status: 400 }
      );
    }

    // Check no pending challenge between same players
    const { data: existing } = await supabase
      .from("challenges")
      .select("id")
      .or(
        `and(challenger_id.eq.${user.id},challenged_id.eq.${challenged_id}),and(challenger_id.eq.${challenged_id},challenged_id.eq.${user.id})`
      )
      .eq("status", "pending")
      .limit(1);

    if (existing && existing.length > 0) {
      return Response.json(
        { error: "Ya existe un reto pendiente entre ustedes" },
        { status: 409 }
      );
    }

    // Create the challenge
    const { data: challenge, error: insertError } = await supabase
      .from("challenges")
      .insert({
        challenger_id: user.id,
        challenged_id,
        stars_bet,
        message: message || null,
      })
      .select(
        "*, challenger:players!challenger_id(id, alias, avatar_url), challenged:players!challenged_id(id, alias, avatar_url)"
      )
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Insert activity feed event
    await supabase.from("activity_feed").insert({
      type: "challenge_created",
      actor_id: user.id,
      target_id: challenged_id,
      reference_id: challenge.id,
      metadata: {
        stars_bet,
        message: message || null,
        challenger_alias: challenger?.alias,
        challenged_alias: challenged?.alias,
      },
    });

    // Push notification to challenged player (fire-and-forget)
    sendPushToPlayer(
      challenged_id,
      "Te están buscando",
      `${challenger?.alias} te retó por ${stars_bet} estrellas`,
      "/challenges"
    ).catch((e) => console.error("[push] error:", e));

    // Auto-complete mission (fire-and-forget)
    supabase.from("player_missions").upsert({
      player_id: user.id,
      week_start: getCurrentWeekStart(),
      mission_id: "challenge",
      completed_at: new Date().toISOString(),
    }, { onConflict: "player_id,week_start,mission_id" }).then(() => {}, e => console.error("mission upsert:", e));

    return Response.json(challenge, { status: 201 });
  } catch (err) {
    console.error("POST /api/challenges error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
