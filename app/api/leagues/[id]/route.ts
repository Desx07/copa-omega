import { createClient } from "@/lib/supabase/server";

// GET — detalle de liga con standings
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: league, error } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !league) {
      return Response.json({ error: "Liga no encontrada" }, { status: 404 });
    }

    // Season activa
    const { data: activeSeason } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .maybeSingle();

    const seasonId = activeSeason?.id ?? null;

    // Standings
    const { data: standings } = await supabase
      .from("league_memberships")
      .select(`
        id, position, wins, losses, games_played, promotion_points,
        player:players!player_id (id, alias, avatar_url, stars, wins, losses)
      `)
      .eq("league_id", id)
      .eq("season_id", seasonId ?? "")
      .order("position", { ascending: true });

    return Response.json({ league, standings: standings ?? [], season_id: seasonId });
  } catch (err) {
    console.error("GET /api/leagues/[id] error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH — actualizar liga (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const { data: updated, error } = await supabase
      .from("leagues")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(updated);
  } catch (err) {
    console.error("PATCH /api/leagues/[id] error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
