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

    // Check if admin (admins can see all players including eliminated)
    const { data: currentPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("players")
      .select("id, alias, stars, is_eliminated")
      .order("alias");

    // Non-admins only see non-eliminated players
    if (!currentPlayer?.is_admin) {
      query = query.eq("is_eliminated", false);
    }

    const { data: players, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(players);
  } catch (err) {
    console.error("GET /api/players error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
