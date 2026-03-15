import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/tournaments/[id]/badges
 * List tournament badges (top 3) with player info, for the admin podium cards UI.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    const { data: badges, error } = await supabase
      .from("tournament_badges")
      .select(
        "id, position, card_image_url, player:players!player_id(id, alias, avatar_url)"
      )
      .eq("tournament_id", tournamentId)
      .order("position", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(badges ?? []);
  } catch (err) {
    console.error("GET /api/admin/tournaments/[id]/badges error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
