import { createClient } from "@/lib/supabase/server";

// POST — invitar jugador a equipo (solo capitan)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que es capitan del equipo
    const { data: team } = await supabase
      .from("teams")
      .select("captain_id, is_active")
      .eq("id", teamId)
      .single();

    if (!team || !team.is_active) {
      return Response.json({ error: "Equipo no encontrado" }, { status: 404 });
    }

    if (team.captain_id !== user.id) {
      return Response.json({ error: "Solo el capitan puede invitar" }, { status: 403 });
    }

    // Verificar que el equipo no tiene 3 miembros
    const { count } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);

    if ((count ?? 0) >= 3) {
      return Response.json({ error: "El equipo ya tiene 3 miembros" }, { status: 400 });
    }

    const body = await request.json();
    const { player_id } = body as { player_id: string };

    if (!player_id) {
      return Response.json({ error: "Falta player_id" }, { status: 400 });
    }

    // Verificar que el jugador existe
    const { data: targetPlayer } = await supabase
      .from("players")
      .select("id, alias")
      .eq("id", player_id)
      .single();

    if (!targetPlayer) {
      return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    // Verificar que no pertenece a otro equipo activo
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id, team:teams!team_id(is_active)")
      .eq("player_id", player_id)
      .limit(10);

    const activeTeam = (existingMember ?? []).find(
      (m) => (m.team as unknown as { is_active: boolean })?.is_active
    );

    if (activeTeam) {
      return Response.json({ error: "El jugador ya pertenece a otro equipo" }, { status: 400 });
    }

    // Verificar que no tiene invitacion pendiente de este equipo
    const { data: existingInvite } = await supabase
      .from("team_invitations")
      .select("id")
      .eq("team_id", teamId)
      .eq("player_id", player_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return Response.json({ error: "Ya se envio una invitacion a este jugador" }, { status: 400 });
    }

    // Crear invitacion
    const { data: invitation, error: insertError } = await supabase
      .from("team_invitations")
      .insert({
        team_id: teamId,
        player_id,
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(invitation, { status: 201 });
  } catch (err) {
    console.error("POST /api/teams/[id]/invite error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
