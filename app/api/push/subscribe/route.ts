import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/push/subscribe
 * Body: { endpoint, p256dh, auth }
 *
 * Saves (upserts) a Web Push subscription for the authenticated player.
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
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return Response.json(
        { error: "Faltan campos: endpoint, p256dh, auth" },
        { status: 400 }
      );
    }

    if (
      typeof endpoint !== "string" ||
      typeof p256dh !== "string" ||
      typeof auth !== "string"
    ) {
      return Response.json(
        { error: "Campos invalidos" },
        { status: 400 }
      );
    }

    // Upsert by endpoint — if the same browser re-subscribes, update keys
    const { error: upsertError } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          player_id: user.id,
          endpoint,
          p256dh,
          auth,
        },
        { onConflict: "endpoint" }
      );

    if (upsertError) {
      console.error("Push subscribe error:", upsertError);
      return Response.json(
        { error: "Error guardando suscripcion" },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/push/subscribe error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
