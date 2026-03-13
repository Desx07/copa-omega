import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { winner_id } = body;

    if (!winner_id) {
      return Response.json({ error: "Falta campo: winner_id" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("resolve_match", {
      p_match_id: id,
      p_winner_id: winner_id,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/matches/[id] error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
