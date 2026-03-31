import { createClient } from "@/lib/supabase/server";

// GET /api/gacha/history — Historial de pulls del jugador actual
export async function GET() {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener todos los pulls del jugador, mas recientes primero
    const { data: pulls, error } = await supabase
      .from("gacha_pulls")
      .select("id, blade, ratchet, bit, tier_result, tournament_id, pulled_at")
      .eq("player_id", user.id)
      .order("pulled_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching gacha history:", error);
      return Response.json(
        { error: "Error al obtener historial" },
        { status: 500 }
      );
    }

    return Response.json({ pulls: pulls ?? [] });
  } catch (err) {
    console.error("GET /api/gacha/history error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
