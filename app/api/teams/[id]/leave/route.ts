import { createClient } from "@/lib/supabase/server";

// POST — abandonar equipo
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que es miembro
    const { data: membership } = await supabase
      .from("team_members")
      .select("id, role")
      .eq("team_id", teamId)
      .eq("player_id", user.id)
      .single();

    if (!membership) {
      return Response.json({ error: "No sos miembro de este equipo" }, { status: 400 });
    }

    // El capitan no puede abandonar, tiene que disolver
    if (membership.role === "captain") {
      return Response.json({ error: "El capitan no puede abandonar. Disolvé el equipo." }, { status: 400 });
    }

    // Eliminar miembro
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", membership.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/teams/[id]/leave error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
