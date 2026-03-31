import { createClient } from "@/lib/supabase/server";

// GET /api/live-predictions -- Predicciones abiertas para matches en vivo
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

    // Buscar match en vivo
    const { data: liveMatch } = await supabase
      .from("matches")
      .select(
        `id, player1_id, player2_id, stars_bet, status, is_live,
         player1:players!player1_id(id, alias, avatar_url),
         player2:players!player2_id(id, alias, avatar_url)`
      )
      .eq("is_live", true)
      .limit(1)
      .maybeSingle();

    // Predicciones existentes para este match
    let predictions: unknown[] = [];
    let myPrediction: unknown = null;
    let odds = { player1_total: 0, player2_total: 0 };

    if (liveMatch) {
      const { data: allPredictions } = await supabase
        .from("live_predictions")
        .select(
          "id, predictor_id, predicted_winner_id, omega_coins_bet, result, payout_oc, predictor:players!predictor_id(alias, avatar_url)"
        )
        .eq("match_id", liveMatch.id);

      predictions = allPredictions ?? [];

      // Buscar prediccion del usuario
      const myPred = (allPredictions ?? []).find(
        (p: { predictor_id: string }) => p.predictor_id === user.id
      );
      myPrediction = myPred ?? null;

      // Calcular odds (ratio de apuestas)
      interface PredictionRow {
        predicted_winner_id: string;
        omega_coins_bet: number;
      }
      const p1Total = (allPredictions ?? [])
        .filter(
          (p: PredictionRow) =>
            p.predicted_winner_id ===
            (liveMatch as unknown as { player1_id: string }).player1_id
        )
        .reduce(
          (sum: number, p: PredictionRow) => sum + p.omega_coins_bet,
          0
        );
      const p2Total = (allPredictions ?? [])
        .filter(
          (p: PredictionRow) =>
            p.predicted_winner_id ===
            (liveMatch as unknown as { player2_id: string }).player2_id
        )
        .reduce(
          (sum: number, p: PredictionRow) => sum + p.omega_coins_bet,
          0
        );

      odds = { player1_total: p1Total, player2_total: p2Total };
    }

    // OC del usuario
    const { data: player } = await supabase
      .from("players")
      .select("omega_coins")
      .eq("id", user.id)
      .single();

    return Response.json({
      live_match: liveMatch,
      predictions,
      my_prediction: myPrediction,
      odds,
      my_omega_coins: player?.omega_coins ?? 0,
    });
  } catch (err) {
    console.error("GET /api/live-predictions error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/live-predictions -- Apostar OC en un match en vivo
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
    const { match_id, predicted_winner_id, omega_coins_bet } = body;

    if (!match_id || !predicted_winner_id || !omega_coins_bet) {
      return Response.json(
        {
          error:
            "Faltan campos: match_id, predicted_winner_id, omega_coins_bet",
        },
        { status: 400 }
      );
    }

    if (typeof omega_coins_bet !== "number" || omega_coins_bet < 1) {
      return Response.json(
        { error: "omega_coins_bet debe ser >= 1" },
        { status: 400 }
      );
    }

    if (omega_coins_bet > 500) {
      return Response.json(
        { error: "Maximo de apuesta: 500 OC" },
        { status: 400 }
      );
    }

    // Verificar que el match existe y esta en vivo
    const { data: match } = await supabase
      .from("matches")
      .select("id, player1_id, player2_id, is_live, status")
      .eq("id", match_id)
      .single();

    if (!match) {
      return Response.json(
        { error: "Partida no encontrada" },
        { status: 404 }
      );
    }

    if (!match.is_live || match.status !== "in_progress") {
      return Response.json(
        { error: "La partida no esta en vivo" },
        { status: 400 }
      );
    }

    // No apostar en tu propia partida
    if (match.player1_id === user.id || match.player2_id === user.id) {
      return Response.json(
        { error: "No podes apostar en tu propia partida" },
        { status: 400 }
      );
    }

    // El ganador predicho debe ser uno de los jugadores
    if (
      predicted_winner_id !== match.player1_id &&
      predicted_winner_id !== match.player2_id
    ) {
      return Response.json(
        { error: "El ganador predicho debe ser uno de los jugadores" },
        { status: 400 }
      );
    }

    // Verificar OC suficientes
    const { data: player } = await supabase
      .from("players")
      .select("omega_coins")
      .eq("id", user.id)
      .single();

    if (!player || (player.omega_coins ?? 0) < omega_coins_bet) {
      return Response.json(
        {
          error: `No tenes suficientes Omega Coins. Tenes ${player?.omega_coins ?? 0} OC`,
        },
        { status: 400 }
      );
    }

    // Descontar OC
    const { error: deductError } = await supabase
      .from("players")
      .update({
        omega_coins: (player.omega_coins ?? 0) - omega_coins_bet,
      })
      .eq("id", user.id);

    if (deductError) {
      return Response.json(
        { error: "Error al descontar Omega Coins" },
        { status: 500 }
      );
    }

    // Crear prediccion
    const { data: prediction, error: insertError } = await supabase
      .from("live_predictions")
      .insert({
        match_id,
        predictor_id: user.id,
        predicted_winner_id,
        omega_coins_bet,
      })
      .select()
      .single();

    if (insertError) {
      // Si ya aposto, devolver OC
      if (insertError.code === "23505") {
        await supabase
          .from("players")
          .update({ omega_coins: player.omega_coins ?? 0 })
          .eq("id", user.id);
        return Response.json(
          { error: "Ya apostaste en esta partida" },
          { status: 409 }
        );
      }

      // Devolver OC por error generico
      await supabase
        .from("players")
        .update({ omega_coins: player.omega_coins ?? 0 })
        .eq("id", user.id);
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(prediction, { status: 201 });
  } catch (err) {
    console.error("POST /api/live-predictions error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
