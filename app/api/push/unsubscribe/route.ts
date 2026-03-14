import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/push/unsubscribe
 * Body: { endpoint }
 *
 * Removes a push subscription by endpoint for the authenticated player.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint || typeof endpoint !== "string") {
      return Response.json(
        { error: "Falta campo: endpoint" },
        { status: 400 }
      );
    }

    // Only delete the subscription if it belongs to the current user
    const { error: deleteError } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("player_id", user.id);

    if (deleteError) {
      console.error("Push unsubscribe error:", deleteError);
      return Response.json(
        { error: "Error eliminando suscripcion" },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/push/unsubscribe error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
