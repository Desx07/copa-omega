import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que es admin
    const { data: player } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!player?.is_admin) {
      return Response.json(
        { error: "Solo administradores pueden recalcular ligas" },
        { status: 403 }
      );
    }

    // Obtener season activa
    const { data: activeSeason } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .maybeSingle();

    if (!activeSeason) {
      return Response.json(
        { error: "No hay temporada activa para recalcular" },
        { status: 404 }
      );
    }

    // Llamar a la funcion RPC que recalcula todo
    const { data: result, error: rpcError } = await supabase.rpc(
      "recalculate_league_memberships",
      { p_season_id: activeSeason.id }
    );

    if (rpcError) {
      console.error("RPC recalculate_league_memberships error:", rpcError);
      return Response.json({ error: rpcError.message }, { status: 500 });
    }

    return Response.json({
      message: "Ligas recalculadas exitosamente",
      result,
    });
  } catch (err) {
    console.error("POST /api/leagues/recalculate error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
