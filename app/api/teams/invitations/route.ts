import { createClient } from "@/lib/supabase/server";

// GET — obtener mis invitaciones pendientes
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: invitations, error } = await supabase
      .from("team_invitations")
      .select(`
        id, status, created_at,
        team:teams!team_id (id, name, logo_url, stars, wins, losses),
        invited_by_player:players!invited_by (alias, avatar_url)
      `)
      .eq("player_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(invitations ?? []);
  } catch (err) {
    console.error("GET /api/teams/invitations error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH — aceptar o rechazar invitacion
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { invitation_id, action } = body as { invitation_id: string; action: "accept" | "decline" };

    if (!invitation_id || !["accept", "decline"].includes(action)) {
      return Response.json({ error: "Parametros invalidos" }, { status: 400 });
    }

    // Verificar que la invitacion es para este usuario
    const { data: invitation } = await supabase
      .from("team_invitations")
      .select("id, team_id, player_id, status")
      .eq("id", invitation_id)
      .eq("player_id", user.id)
      .single();

    if (!invitation || invitation.status !== "pending") {
      return Response.json({ error: "Invitacion no encontrada o ya procesada" }, { status: 404 });
    }

    if (action === "decline") {
      await supabase
        .from("team_invitations")
        .update({ status: "declined" })
        .eq("id", invitation_id);

      return Response.json({ success: true, action: "declined" });
    }

    // Aceptar — verificar que no pertenece a un equipo
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id, team:teams!team_id(is_active)")
      .eq("player_id", user.id)
      .limit(10);

    const activeTeam = (existingMember ?? []).find(
      (m) => (m.team as unknown as { is_active: boolean })?.is_active
    );

    if (activeTeam) {
      return Response.json({ error: "Ya perteneces a un equipo" }, { status: 400 });
    }

    // Verificar que el equipo no tiene 3 miembros
    const { count } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", invitation.team_id);

    if ((count ?? 0) >= 3) {
      return Response.json({ error: "El equipo ya tiene 3 miembros" }, { status: 400 });
    }

    // Agregar miembro
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: invitation.team_id,
        player_id: user.id,
        role: "member",
      });

    if (memberError) {
      return Response.json({ error: memberError.message }, { status: 500 });
    }

    // Marcar invitacion como aceptada
    await supabase
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation_id);

    // Cancelar otras invitaciones pendientes de este jugador
    await supabase
      .from("team_invitations")
      .update({ status: "declined" })
      .eq("player_id", user.id)
      .eq("status", "pending")
      .neq("id", invitation_id);

    return Response.json({ success: true, action: "accepted" });
  } catch (err) {
    console.error("PATCH /api/teams/invitations error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
