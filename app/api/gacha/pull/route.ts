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

    // Generar el combo random
    const result = pullGacha();

    // Descontar Omega Coins atomicamente (evita race conditions)
    const { data: remainingCoins, error: deductError } = await supabase
      .rpc("deduct_omega_coins", { p_player_id: user.id, p_amount: GACHA_COST });

    if (deductError) {
      console.error("Error descontando OC:", deductError);
      return Response.json(
        { error: "Error al procesar el pago" },
        { status: 500 }
      );
    }

    if (remainingCoins === -1) {
      return Response.json(
        {
          error: `No tenes suficientes Omega Coins. Necesitas ${GACHA_COST} OC.`,
          needed: GACHA_COST,
        },
        { status: 400 }
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
      // Revertir las Omega Coins atomicamente si falla el insert
      await supabase.rpc("add_omega_coins", { p_player_id: user.id, p_amount: GACHA_COST });

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
      remainingCoins: remainingCoins,
    });
  } catch (err) {
    console.error("POST /api/gacha/pull error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
