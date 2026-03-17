import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToPlayer } from "@/lib/push";

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

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !["accept", "decline"].includes(action)) {
      return Response.json(
        { error: "action debe ser 'accept' o 'decline'" },
        { status: 400 }
      );
    }

    // Fetch the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from("challenges")
      .select(
        "*, challenger:players!challenger_id(id, alias, avatar_url), challenged:players!challenged_id(id, alias, avatar_url)"
      )
      .eq("id", id)
      .single();

    if (fetchError || !challenge) {
      return Response.json({ error: "Reto no encontrado" }, { status: 404 });
    }

    if (challenge.status !== "pending") {
      return Response.json(
        { error: "Este reto ya no esta pendiente" },
        { status: 400 }
      );
    }

    // Only the challenged player can accept/decline
    if (challenge.challenged_id !== user.id) {
      return Response.json(
        { error: "Solo el jugador retado puede aceptar o rechazar" },
        { status: 403 }
      );
    }

    // Check if expired
    if (new Date(challenge.expires_at) < new Date()) {
      await supabase
        .from("challenges")
        .update({ status: "expired" })
        .eq("id", id);
      return Response.json(
        { error: "Este reto ha expirado" },
        { status: 400 }
      );
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    const { error: updateError } = await supabase
      .from("challenges")
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    const challengerData = challenge.challenger as unknown as {
      id: string;
      alias: string;
    };
    const challengedData = challenge.challenged as unknown as {
      id: string;
      alias: string;
    };

    // Insert activity feed event
    const feedType =
      action === "accept" ? "challenge_accepted" : "challenge_declined";

    await supabase.from("activity_feed").insert({
      type: feedType,
      actor_id: user.id,
      target_id: challenge.challenger_id,
      reference_id: challenge.id,
      metadata: {
        stars_bet: challenge.stars_bet,
        challenger_alias: challengerData.alias,
        challenged_alias: challengedData.alias,
      },
    });

    // If accepted: auto-create a match and link it to the challenge
    if (action === "accept") {
      try {
        const adminSupabase = createAdminClient();
        const { data: match, error: matchError } = await adminSupabase
          .from("matches")
          .insert({
            player1_id: challenge.challenger_id,
            player2_id: challenge.challenged_id,
            stars_bet: challenge.stars_bet,
            status: "pending",
            created_by: challenge.challenger_id,
          })
          .select("id")
          .single();

        if (matchError) {
          console.error("[Challenge] Error auto-creating match:", matchError);
        } else if (match) {
          // Link the match to the challenge
          await adminSupabase
            .from("challenges")
            .update({ match_id: match.id })
            .eq("id", id);
          console.log(`[Challenge] Auto-created match ${match.id} for challenge ${id}`);
        }
      } catch (matchErr) {
        console.error("[Challenge] Error in auto-create match:", matchErr);
      }
    }

    // Push notification to challenger (fire-and-forget)
    if (action === "accept") {
      sendPushToPlayer(
        challenge.challenger_id,
        "Reto aceptado",
        `${challengedData.alias} aceptó tu reto por ${challenge.stars_bet} estrellas. Partida creada!`,
        "/challenges"
      ).catch((e) => console.error("[push] error:", e));
    } else {
      sendPushToPlayer(
        challenge.challenger_id,
        "Reto rechazado",
        `${challengedData.alias} rechazó tu reto`,
        "/challenges"
      ).catch((e) => console.error("[push] error:", e));
    }

    return Response.json({ success: true, status: newStatus });
  } catch (err) {
    console.error("PATCH /api/challenges/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
