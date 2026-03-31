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

    const { data: beypet, error } = await supabase
      .from("beypets")
      .select("*")
      .eq("player_id", user.id)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Tambien traer omega_coins del jugador
    const { data: player } = await supabase
      .from("players")
      .select("omega_coins")
      .eq("id", user.id)
      .single();

    return Response.json({
      beypet: beypet ?? null,
      omega_coins: player?.omega_coins ?? 100,
    });
  } catch (err) {
    console.error("GET /api/beypets error:", err);
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
    const { name, beast_type } = body;

    if (!name || !beast_type) {
      return Response.json(
        { error: "Faltan campos: name, beast_type" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 20) {
      return Response.json(
        { error: "El nombre debe tener entre 2 y 20 caracteres" },
        { status: 400 }
      );
    }

    // Verificar que no tenga ya un beypet
    const { data: existing } = await supabase
      .from("beypets")
      .select("id")
      .eq("player_id", user.id)
      .maybeSingle();

    if (existing) {
      return Response.json(
        { error: "Ya tenes un BeyPet activo" },
        { status: 409 }
      );
    }

    // Verificar que el beast_type corresponda a uno de sus beys
    const { data: beys } = await supabase
      .from("beys")
      .select("name, type")
      .eq("player_id", user.id);

    if (!beys || beys.length === 0) {
      return Response.json(
        { error: "Necesitas tener al menos un bey registrado en tu perfil" },
        { status: 400 }
      );
    }

    const matchingBey = beys.find(
      (b) => b.name.toLowerCase() === beast_type.toLowerCase()
    );

    if (!matchingBey) {
      return Response.json(
        { error: "El beast_type debe corresponder a uno de tus beys" },
        { status: 400 }
      );
    }

    // Asignar stats base segun el tipo del bey
    let atk = 10;
    let def = 10;
    let sta = 10;

    switch (matchingBey.type) {
      case "attack":
        atk = 15;
        def = 8;
        sta = 7;
        break;
      case "defense":
        atk = 7;
        def = 15;
        sta = 8;
        break;
      case "stamina":
        atk = 7;
        def = 8;
        sta = 15;
        break;
      case "balance":
        atk = 10;
        def = 10;
        sta = 10;
        break;
    }

    const { data: beypet, error: insertError } = await supabase
      .from("beypets")
      .insert({
        player_id: user.id,
        name: name.trim(),
        beast_type: beast_type.trim(),
        level: 1,
        xp: 0,
        energy: 100,
        atk,
        def,
        sta,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(beypet, { status: 201 });
  } catch (err) {
    console.error("POST /api/beypets error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
