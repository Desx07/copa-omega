import { createClient } from "@/lib/supabase/server";

// GET — detalle de equipo
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

    const { data: team, error } = await supabase
      .from("teams")
      .select(`
        id, name, logo_url, stars, wins, losses, created_at, captain_id, is_active,
        team_members (
          id, player_id, role, joined_at,
          player:players!player_id (id, alias, avatar_url, stars, wins, losses)
        )
      `)
      .eq("id", id)
      .single();

    if (error || !team) {
      return Response.json({ error: "Equipo no encontrado" }, { status: 404 });
    }

    return Response.json(team);
  } catch (err) {
    console.error("GET /api/teams/[id] error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH — actualizar equipo (solo capitan)
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

    const { data: team } = await supabase
      .from("teams")
      .select("captain_id")
      .eq("id", id)
      .single();

    if (!team || team.captain_id !== user.id) {
      return Response.json({ error: "Solo el capitan puede editar el equipo" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name) updates.name = body.name.trim();
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;

    const { data: updated, error } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(updated);
  } catch (err) {
    console.error("PATCH /api/teams/[id] error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE — disolver equipo (solo capitan)
export async function DELETE(
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

    const { data: team } = await supabase
      .from("teams")
      .select("captain_id")
      .eq("id", id)
      .single();

    if (!team || team.captain_id !== user.id) {
      return Response.json({ error: "Solo el capitan puede disolver el equipo" }, { status: 403 });
    }

    // Marcar como inactivo (soft delete)
    const { error } = await supabase
      .from("teams")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Eliminar miembros
    await supabase.from("team_members").delete().eq("team_id", id);

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/teams/[id] error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
