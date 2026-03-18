import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToPlayer } from "@/lib/push";
import { awardXp } from "@/lib/award-xp";

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

    // Check admin
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { winner_id, player1_score, player2_score } = body;

    if (!winner_id) {
      return Response.json({ error: "Falta campo: winner_id" }, { status: 400 });
    }

    // Validate scores if provided
    if (player1_score != null && (typeof player1_score !== "number" || player1_score < 0)) {
      return Response.json(
        { error: "player1_score debe ser un numero >= 0" },
        { status: 400 }
      );
    }
    if (player2_score != null && (typeof player2_score !== "number" || player2_score < 0)) {
      return Response.json(
        { error: "player2_score debe ser un numero >= 0" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("resolve_match", {
      p_match_id: id,
      p_winner_id: winner_id,
    });

    // Save scores if provided
    if (!error && player1_score != null && player2_score != null) {
      await supabase
        .from("matches")
        .update({ player1_score, player2_score })
        .eq("id", id);
    }

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // Fetch match to find both players for badge checking and feed
    const { data: matchData, error: matchFetchError } = await supabase
      .from("matches")
      .select("player1_id, player2_id, stars_bet")
      .eq("id", id)
      .single();

    if (matchFetchError) {
      console.error("[matches] Error fetching match data:", matchFetchError);
    }

    // Insert match_result event into activity_feed
    if (matchData) {
      const loserId = matchData.player1_id === winner_id
        ? matchData.player2_id
        : matchData.player1_id;

      try {
        const adminSupabase = createAdminClient();

        await adminSupabase.from("activity_feed").insert({
          type: "match_result",
          actor_id: winner_id,
          target_id: loserId,
          reference_id: id,
          metadata: {
            stars_bet: matchData.stars_bet ?? 0,
          },
        });
      } catch (feedErr) {
        console.error("Error inserting match_result feed event:", feedErr);
      }

      // Award XP to both players (fire-and-forget)
      try {
        const adminXp = createAdminClient();
        await awardXp(adminXp, winner_id, 20, "win_match", "Victoria en batalla de estrellas");
        if (loserId) await awardXp(adminXp, loserId, 5, "lose_match", "Derrota en batalla de estrellas");
      } catch (xpErr) {
        console.error("Error awarding match XP:", xpErr);
      }

      // Push notifications to both players (fire-and-forget)
      try {
        const { data: matchPlayers } = await supabase
          .from("players")
          .select("id, alias")
          .in("id", [matchData.player1_id, matchData.player2_id]);

        if (matchPlayers) {
          const winnerPlayer = matchPlayers.find((p) => p.id === winner_id);
          const loserPlayer = matchPlayers.find((p) => p.id === loserId);
          const starsBet = matchData.stars_bet ?? 0;

          if (winnerPlayer) {
            sendPushToPlayer(
              winnerPlayer.id,
              "Victoria",
              `Le ganaste a ${loserPlayer?.alias}. +${starsBet} estrellas`,
              "/dashboard"
            ).catch((e) => console.error("[push] error:", e));
          }

          if (loserPlayer) {
            sendPushToPlayer(
              loserPlayer.id,
              "Derrota",
              `${winnerPlayer?.alias} se llevó ${starsBet} estrellas. Revancha?`,
              "/dashboard"
            ).catch((e) => console.error("[push] error:", e));
          }
        }
      } catch (pushErr) {
        console.error("Error sending match push notifications:", pushErr);
      }
    }

    // Mark any linked challenges as "completed"
    if (matchData) {
      try {
        const adminSupabase = createAdminClient();
        // Find accepted challenges between these two players and mark completed
        await adminSupabase
          .from("challenges")
          .update({ status: "completed", match_id: id })
          .eq("status", "accepted")
          .or(
            `and(challenger_id.eq.${matchData.player1_id},challenged_id.eq.${matchData.player2_id}),and(challenger_id.eq.${matchData.player2_id},challenged_id.eq.${matchData.player1_id})`
          );
      } catch (challengeErr) {
        console.error("Error completing linked challenges:", challengeErr);
      }
    }

    // Trigger badge checks for both players (fire-and-forget)
    if (matchData) {
      const baseUrl = new URL(request.url).origin;
      const badgePlayers = [matchData.player1_id, matchData.player2_id].filter(Boolean);
      for (const playerId of badgePlayers) {
        fetch(`${baseUrl}/api/badges/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") ?? "",
          },
          body: JSON.stringify({ player_id: playerId }),
        }).catch((e) => console.error("[push] error:", e));
      }
    }

    // Resolve predictions for this match (and linked challenge if any)
    try {
      const adminSupabase = createAdminClient();

      // Find predictions by match_id
      const { data: matchPredictions } = await adminSupabase
        .from("predictions")
        .select("id, predictor_id, predicted_winner_id")
        .eq("match_id", id)
        .is("is_correct", null);

      // Also find predictions by challenge_id if this match was created from a challenge
      let challengePredictions: typeof matchPredictions = [];
      const { data: linkedChallenge } = await adminSupabase
        .from("challenges")
        .select("id")
        .eq("match_id", id)
        .maybeSingle();

      if (linkedChallenge) {
        const { data: chPreds } = await adminSupabase
          .from("predictions")
          .select("id, predictor_id, predicted_winner_id")
          .eq("challenge_id", linkedChallenge.id)
          .is("is_correct", null);
        challengePredictions = chPreds ?? [];
      }

      const allPredictions = [...(matchPredictions ?? []), ...challengePredictions];

      if (allPredictions.length > 0) {
        const predictorIds = [...new Set(allPredictions.map((p) => p.predictor_id))];

        for (const pred of allPredictions) {
          const isCorrect = pred.predicted_winner_id === winner_id;
          await adminSupabase
            .from("predictions")
            .update({ is_correct: isCorrect })
            .eq("id", pred.id);
        }

        // Update prediction stats for each predictor
        for (const pid of predictorIds) {
          const { count: totalCount } = await adminSupabase
            .from("predictions")
            .select("id", { count: "exact", head: true })
            .eq("predictor_id", pid)
            .not("is_correct", "is", null);

          const { count: correctCount } = await adminSupabase
            .from("predictions")
            .select("id", { count: "exact", head: true })
            .eq("predictor_id", pid)
            .eq("is_correct", true);

          await adminSupabase
            .from("players")
            .update({
              predictions_total: totalCount ?? 0,
              predictions_correct: correctCount ?? 0,
            })
            .eq("id", pid);
        }
      }
    } catch (predErr) {
      console.error("Error resolving predictions:", predErr);
      // Non-blocking — match is still resolved
    }

    // Update dynamic title for both players (combines matches + tournament_matches)
    if (matchData) {
      try {
        const adminSupabase = createAdminClient();
        for (const playerId of [matchData.player1_id, matchData.player2_id].filter(Boolean)) {
          const { data: regularMatches } = await adminSupabase
            .from("matches")
            .select("winner_id, completed_at")
            .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
            .eq("status", "completed")
            .order("completed_at", { ascending: false })
            .limit(10);

          const { data: tournamentMatches } = await adminSupabase
            .from("tournament_matches")
            .select("winner_id, completed_at")
            .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
            .eq("status", "completed")
            .order("completed_at", { ascending: false })
            .limit(10);

          const combined = [...(regularMatches ?? []), ...(tournamentMatches ?? [])]
            .sort((a, b) => {
              const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
              const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 10);

          if (combined.length > 0) {
            const { computeTitleFromMatches } = await import("@/lib/dynamic-titles");
            const title = computeTitleFromMatches(combined, playerId, 10);
            await adminSupabase
              .from("players")
              .update({ current_title: title.label })
              .eq("id", playerId);
          }
        }
      } catch (titleErr) {
        console.error("Error updating dynamic titles:", titleErr);
      }
    }

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/matches/[id] error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
