import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/coliseo/[id]/join -- Unirse a un evento coliseo (pagar entry fee OC)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener evento
    const { data: event, error: eventError } = await supabase
      .from("coliseo_events")
      .select("id, status, max_players, entry_fee_oc, prize_pool_oc")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return Response.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    if (event.status !== "upcoming") {
      return Response.json(
        { error: "El evento ya no acepta inscripciones" },
        { status: 400 }
      );
    }

    // Verificar cupos
    const { count: participantCount } = await supabase
      .from("coliseo_participants")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);

    if ((participantCount ?? 0) >= event.max_players) {
      return Response.json(
        { error: "El evento esta lleno" },
        { status: 400 }
      );
    }

    // Verificar que no este ya inscripto
    const { data: existing } = await supabase
      .from("coliseo_participants")
      .select("id")
      .eq("event_id", eventId)
      .eq("player_id", user.id)
      .maybeSingle();

    if (existing) {
      return Response.json(
        { error: "Ya estas inscripto en este evento" },
        { status: 409 }
      );
    }

    // Verificar OC suficientes
    const { data: player } = await supabase
      .from("players")
      .select("omega_coins")
      .eq("id", user.id)
      .single();

    if (!player) {
      return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    if ((player.omega_coins ?? 0) < event.entry_fee_oc) {
      return Response.json(
        {
          error: `No tenes suficientes Omega Coins. Necesitas ${event.entry_fee_oc} OC, tenes ${player.omega_coins ?? 0} OC`,
        },
        { status: 400 }
      );
    }

    // Usar admin client para transaccion atomica
    const adminSupabase = createAdminClient();

    // Descontar entry fee
    if (event.entry_fee_oc > 0) {
      const { error: deductError } = await adminSupabase
        .from("players")
        .update({
          omega_coins: (player.omega_coins ?? 0) - event.entry_fee_oc,
        })
        .eq("id", user.id);

      if (deductError) {
        return Response.json(
          { error: "Error al descontar Omega Coins" },
          { status: 500 }
        );
      }

      // Sumar al prize pool
      const { error: poolError } = await adminSupabase
        .from("coliseo_events")
        .update({
          prize_pool_oc: event.prize_pool_oc + event.entry_fee_oc,
        })
        .eq("id", eventId);

      if (poolError) {
        console.error("Error updating prize pool:", poolError);
      }
    }

    // Inscribir participante
    const { data: participant, error: insertError } = await supabase
      .from("coliseo_participants")
      .insert({
        event_id: eventId,
        player_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      // Si falla la inscripcion, devolver OC
      if (event.entry_fee_oc > 0) {
        await adminSupabase
          .from("players")
          .update({
            omega_coins: (player.omega_coins ?? 0),
          })
          .eq("id", user.id);
      }
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(participant, { status: 201 });
  } catch (err) {
    console.error("POST /api/coliseo/[id]/join error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
