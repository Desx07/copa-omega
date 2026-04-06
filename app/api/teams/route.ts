import { createClient } from "@/lib/supabase/server";

// GET — listar equipos activos
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: teams, error } = await supabase
      .from("teams")
      .select(`
        id, name, logo_url, stars, wins, losses, created_at, captain_id,
        team_members (
          player_id,
          role,
          player:players!player_id (id, alias, avatar_url, stars)
        )
      `)
      .eq("is_active", true)
      .order("stars", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(teams ?? []);
  } catch (err) {
    console.error("GET /api/teams error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST — crear equipo
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el jugador no pertenece a un equipo
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id, team:teams!team_id(is_active)")
      .eq("player_id", user.id)
      .limit(10);

    const activeMembership = (existingMember ?? []).find(
      (m) => (m.team as unknown as { is_active: boolean })?.is_active
    );

    if (activeMembership) {
      return Response.json({ error: "Ya perteneces a un equipo" }, { status: 400 });
    }

    const body = await request.json();
    const { name, logo_url } = body as { name: string; logo_url?: string };

    if (!name || name.trim().length < 2 || name.trim().length > 30) {
      return Response.json({ error: "El nombre debe tener entre 2 y 30 caracteres" }, { status: 400 });
    }

    // Verificar nombre unico
    const { data: existing } = await supabase
      .from("teams")
      .select("id")
      .ilike("name", name.trim())
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      return Response.json({ error: "Ya existe un equipo con ese nombre" }, { status: 400 });
    }

    // Crear equipo
    const { data: team, error: insertError } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        logo_url: logo_url || null,
        captain_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Agregar capitan como miembro
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        player_id: user.id,
        role: "captain",
      });

    if (memberError) {
      return Response.json({ error: memberError.message }, { status: 500 });
    }

    return Response.json(team, { status: 201 });
  } catch (err) {
    console.error("POST /api/teams error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
