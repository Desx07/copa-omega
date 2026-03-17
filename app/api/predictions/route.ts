import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/award-xp";
import { getCurrentWeekStart } from "@/lib/missions";

/**
 * GET /api/predictions
 * Returns upcoming matches available for prediction + user's existing predictions.
 */
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

    // Regular matches removed from predictions — they duplicate challenges
    // (when a challenge is accepted, it auto-creates a match)

    // Get active tournament IDs (only in_progress tournaments)
    const { data: activeTournaments } = await supabase
      .from("tournaments")
      .select("id")
      .eq("status", "in_progress");

    const activeTournamentIds = (activeTournaments ?? []).map((t) => t.id);

    // Get pending tournament matches (only from active tournaments, exclude own)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tournamentMatches: any[] | null = [];
    if (activeTournamentIds.length > 0) {
      const { data } = await supabase
        .from("tournament_matches")
        .select(
          "id, tournament_id, player1_id, player2_id, round, bracket_position, status, player1:players!player1_id(alias, avatar_url), player2:players!player2_id(alias, avatar_url), tournament:tournaments!tournament_id(name)"
        )
        .eq("status", "pending")
        .in("tournament_id", activeTournamentIds)
        .not("player1_id", "is", null)
        .not("player2_id", "is", null)
        .neq("player1_id", user.id)
        .neq("player2_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      tournamentMatches = data;
    }

    // Get pending challenges (exclude own challenges)
    const { data: challenges } = await supabase
      .from("challenges")
      .select(
        "id, challenger_id, challenged_id, stars_bet, status, challenger:players!challenger_id(alias, avatar_url), challenged:players!challenged_id(alias, avatar_url)"
      )
      .in("status", ["pending", "accepted"])
      .neq("challenger_id", user.id)
      .neq("challenged_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Get user's existing predictions
    const { data: myPredictions } = await supabase
      .from("predictions")
      .select("id, match_id, tournament_match_id, challenge_id, predicted_winner_id, is_correct")
      .eq("predictor_id", user.id);

    return Response.json({
      matches: [],
      tournament_matches: tournamentMatches ?? [],
      challenges: challenges ?? [],
      my_predictions: myPredictions ?? [],
    });
  } catch (err) {
    console.error("GET /api/predictions error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/predictions
 * Body: { match_id?, tournament_match_id?, challenge_id?, predicted_winner_id }
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
    const { match_id, tournament_match_id, challenge_id, predicted_winner_id } = body;

    if (!predicted_winner_id) {
      return Response.json(
        { error: "Falta predicted_winner_id" },
        { status: 400 }
      );
    }

    // Must have exactly one reference
    const refs = [match_id, tournament_match_id, challenge_id].filter(Boolean);
    if (refs.length !== 1) {
      return Response.json(
        { error: "Debe especificar exactamente uno: match_id, tournament_match_id o challenge_id" },
        { status: 400 }
      );
    }

    // Can't predict own matches
    if (match_id) {
      const { data: match } = await supabase
        .from("matches")
        .select("player1_id, player2_id, status")
        .eq("id", match_id)
        .single();

      if (!match) {
        return Response.json({ error: "Partida no encontrada" }, { status: 404 });
      }
      if (match.status !== "pending") {
        return Response.json({ error: "La partida ya no acepta predicciones" }, { status: 400 });
      }
      if (match.player1_id === user.id || match.player2_id === user.id) {
        return Response.json({ error: "No podes predecir tus propias partidas" }, { status: 400 });
      }
      if (predicted_winner_id !== match.player1_id && predicted_winner_id !== match.player2_id) {
        return Response.json({ error: "El ganador predicho debe ser uno de los jugadores" }, { status: 400 });
      }
    }

    if (tournament_match_id) {
      const { data: tmatch } = await supabase
        .from("tournament_matches")
        .select("player1_id, player2_id, status")
        .eq("id", tournament_match_id)
        .single();

      if (!tmatch) {
        return Response.json({ error: "Partida de torneo no encontrada" }, { status: 404 });
      }
      if (tmatch.status !== "pending") {
        return Response.json({ error: "La partida ya no acepta predicciones" }, { status: 400 });
      }
      if (tmatch.player1_id === user.id || tmatch.player2_id === user.id) {
        return Response.json({ error: "No podes predecir tus propias partidas" }, { status: 400 });
      }
      if (predicted_winner_id !== tmatch.player1_id && predicted_winner_id !== tmatch.player2_id) {
        return Response.json({ error: "El ganador predicho debe ser uno de los jugadores" }, { status: 400 });
      }
    }

    if (challenge_id) {
      const { data: challenge } = await supabase
        .from("challenges")
        .select("challenger_id, challenged_id, status")
        .eq("id", challenge_id)
        .single();

      if (!challenge) {
        return Response.json({ error: "Reto no encontrado" }, { status: 404 });
      }
      if (!["pending", "accepted"].includes(challenge.status)) {
        return Response.json({ error: "El reto ya no acepta predicciones" }, { status: 400 });
      }
      if (challenge.challenger_id === user.id || challenge.challenged_id === user.id) {
        return Response.json({ error: "No podes predecir tus propios retos" }, { status: 400 });
      }
      if (predicted_winner_id !== challenge.challenger_id && predicted_winner_id !== challenge.challenged_id) {
        return Response.json({ error: "El ganador predicho debe ser uno de los jugadores" }, { status: 400 });
      }
    }

    const insertData: Record<string, unknown> = {
      predictor_id: user.id,
      predicted_winner_id,
    };
    if (match_id) insertData.match_id = match_id;
    if (tournament_match_id) insertData.tournament_match_id = tournament_match_id;
    if (challenge_id) insertData.challenge_id = challenge_id;

    const { data: prediction, error } = await supabase
      .from("predictions")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "Ya predijiste esta partida" }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Award XP for making prediction (fire-and-forget)
    try {
      await awardXp(supabase, user.id, 2, "make_prediction", "Prediccion realizada");
    } catch (xpErr) {
      console.error("Error awarding prediction XP:", xpErr);
    }

    // Auto-complete mission (fire-and-forget)
    supabase.from("player_missions").upsert({
      player_id: user.id,
      week_start: getCurrentWeekStart(),
      mission_id: "prediction",
      completed_at: new Date().toISOString(),
    }, { onConflict: "player_id,week_start,mission_id" }).then(() => {});

    return Response.json(prediction, { status: 201 });
  } catch (err) {
    console.error("POST /api/predictions error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
