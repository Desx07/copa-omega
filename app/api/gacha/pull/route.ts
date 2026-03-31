import { createClient } from "@/lib/supabase/server";
import { pullGacha, GACHA_COST } from "@/lib/gacha";

// POST /api/gacha/pull — Realizar un pull del BeyGacha
export async function POST() {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el jugador tiene suficientes Omega Coins
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, omega_coins")
      .eq("id", user.id)
      .single();

    if (playerError || !player) {
      return Response.json(
        { error: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    if (player.omega_coins < GACHA_COST) {
      return Response.json(
        {
          error: `No tenes suficientes Omega Coins. Necesitas ${GACHA_COST} OC, tenes ${player.omega_coins} OC.`,
          needed: GACHA_COST,
          current: player.omega_coins,
        },
        { status: 400 }
      );
    }

    // Generar el combo random
    const result = pullGacha();

    // Descontar Omega Coins
    const { error: updateError } = await supabase
      .from("players")
      .update({ omega_coins: player.omega_coins - GACHA_COST })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error descontando OC:", updateError);
      return Response.json(
        { error: "Error al procesar el pago" },
        { status: 500 }
      );
    }

    // Guardar el pull en la base de datos
    const { data: pull, error: insertError } = await supabase
      .from("gacha_pulls")
      .insert({
        player_id: user.id,
        blade: result.blade,
        ratchet: result.ratchet,
        bit: result.bit,
        tier_result: result.overallTier,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error guardando pull:", insertError);
      // Revertir las Omega Coins si falla el insert
      await supabase
        .from("players")
        .update({ omega_coins: player.omega_coins })
        .eq("id", user.id);

      return Response.json(
        { error: "Error al guardar el pull" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      pull: {
        id: pull.id,
        blade: result.blade,
        bladeTier: result.bladeTier,
        ratchet: result.ratchet,
        ratchetTier: result.ratchetTier,
        bit: result.bit,
        bitTier: result.bitTier,
        overallTier: result.overallTier,
        pulled_at: pull.pulled_at,
      },
      remainingCoins: player.omega_coins - GACHA_COST,
    });
  } catch (err) {
    console.error("POST /api/gacha/pull error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
