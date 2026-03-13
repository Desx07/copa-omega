import { createClient } from "@/lib/supabase/server";

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

    const { data: matches, error } = await supabase
      .from("matches")
      .select(
        "*, player1:players!player1_id(id,alias,stars), player2:players!player2_id(id,alias,stars), winner:players!winner_id(id,alias)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(matches);
  } catch (err) {
    console.error("GET /api/matches error:", err);
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

    // Check admin
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const { player1_id, player2_id, stars_bet } = body;

    // Validate required fields
    if (!player1_id || !player2_id || stars_bet == null) {
      return Response.json(
        { error: "Faltan campos: player1_id, player2_id, stars_bet" },
        { status: 400 }
      );
    }

    // Validate stars_bet range
    if (typeof stars_bet !== "number" || stars_bet < 1 || stars_bet > 5) {
      return Response.json(
        { error: "stars_bet debe ser entre 1 y 5" },
        { status: 400 }
      );
    }

    // Validate different players
    if (player1_id === player2_id) {
      return Response.json(
        { error: "Los jugadores deben ser diferentes" },
        { status: 400 }
      );
    }

    // Verify both players are active and have enough stars
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, alias, stars, is_eliminated")
      .in("id", [player1_id, player2_id]);

    if (playersError) {
      return Response.json({ error: playersError.message }, { status: 500 });
    }

    if (!players || players.length !== 2) {
      return Response.json(
        { error: "Uno o ambos jugadores no existen" },
        { status: 404 }
      );
    }

    const p1 = players.find((p) => p.id === player1_id);
    const p2 = players.find((p) => p.id === player2_id);

    if (p1?.is_eliminated || p2?.is_eliminated) {
      return Response.json(
        { error: "Uno o ambos jugadores están eliminados" },
        { status: 400 }
      );
    }

    if ((p1?.stars ?? 0) < stars_bet) {
      return Response.json(
        { error: `${p1?.alias} no tiene suficientes estrellas (tiene ${p1?.stars})` },
        { status: 400 }
      );
    }

    if ((p2?.stars ?? 0) < stars_bet) {
      return Response.json(
        { error: `${p2?.alias} no tiene suficientes estrellas (tiene ${p2?.stars})` },
        { status: 400 }
      );
    }

    // Create match
    const { data: match, error: insertError } = await supabase
      .from("matches")
      .insert({
        player1_id,
        player2_id,
        stars_bet,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(match, { status: 201 });
  } catch (err) {
    console.error("POST /api/matches error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
