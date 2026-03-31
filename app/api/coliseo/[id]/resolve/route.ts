import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/coliseo/[id]/resolve -- Definir placements y repartir premios (admin/judge)
export async function POST(
  request: Request,
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

    // Verificar admin o juez
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin, is_judge")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin && !adminPlayer?.is_judge) {
      return Response.json(
        { error: "Solo administradores o jueces" },
        { status: 403 }
      );
    }

    // Body: { placements: [{ player_id, placement }] }
    const body = await request.json();
    const { placements } = body as {
      placements: { player_id: string; placement: number }[];
    };

    if (!placements || !Array.isArray(placements) || placements.length === 0) {
      return Response.json(
        { error: "Falta el array de placements" },
        { status: 400 }
      );
    }

    // Obtener evento
    const { data: event, error: eventError } = await supabase
      .from("coliseo_events")
      .select("id, status, prize_pool_oc")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return Response.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    if (event.status === "completed") {
      return Response.json(
        { error: "El evento ya fue resuelto" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const pool = event.prize_pool_oc;

    // Distribucion del premio:
    // 1ro: 50% del pool
    // 2do: 30% del pool
    // 3ro: 20% del pool
    const prizeShares: Record<number, number> = {
      1: 0.5,
      2: 0.3,
      3: 0.2,
    };

    // Encontrar ganador (placement === 1)
    const winner = placements.find((p) => p.placement === 1);

    // Actualizar placements en coliseo_participants
    for (const p of placements) {
      const { error: updateError } = await adminSupabase
        .from("coliseo_participants")
        .update({
          placement: p.placement,
          eliminated_at:
            p.placement > 1 ? new Date().toISOString() : null,
        })
        .eq("event_id", eventId)
        .eq("player_id", p.player_id);

      if (updateError) {
        console.error(
          `Error updating placement for ${p.player_id}:`,
          updateError
        );
      }

      // Repartir premio si aplica
      const share = prizeShares[p.placement];
      if (share && pool > 0) {
        const payout = Math.floor(pool * share);
        if (payout > 0) {
          const { error: rpcError } = await adminSupabase.rpc("increment_omega_coins", {
            p_player_id: p.player_id,
            p_amount: payout,
          });

          // Fallback: si no existe el RPC, hacer update directo
          if (rpcError) {
            const { data: playerData } = await adminSupabase
              .from("players")
              .select("omega_coins")
              .eq("id", p.player_id)
              .single();

            if (playerData) {
              const currentOC = (playerData as unknown as { omega_coins: number }).omega_coins ?? 0;
              await adminSupabase
                .from("players")
                .update({ omega_coins: currentOC + payout })
                .eq("id", p.player_id);
            }
          }
        }
      }
    }

    // Marcar evento como completado
    const { error: completeError } = await adminSupabase
      .from("coliseo_events")
      .update({
        status: "completed",
        winner_id: winner?.player_id ?? null,
      })
      .eq("id", eventId);

    if (completeError) {
      return Response.json(
        { error: completeError.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/coliseo/[id]/resolve error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
