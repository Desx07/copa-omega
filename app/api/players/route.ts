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

    const { data: players, error } = await supabase
      .from("players")
      .select("id, alias, stars, is_eliminated")
      .eq("is_eliminated", false)
      .order("alias");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(players);
  } catch (err) {
    console.error("GET /api/players error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
