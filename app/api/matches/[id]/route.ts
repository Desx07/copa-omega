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

    // Check admin or judge
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin, is_judge")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin && !adminPlayer?.is_judge) {
      return Response.json({ error: "Solo administradores o jueces" }, { status: 403 });
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

    // Fetch match first to check current status
    const { data: currentMatch, error: matchFetchError } = await supabase
      .from("matches")
      .select("player1_id, player2_id, stars_bet, status, winner_id")
      .eq("id", id)
      .single();

    if (matchFetchError || !currentMatch) {
      return Response.json({ error: "Partida no encontrada" }, { status: 404 });
    }

    const isEdit = currentMatch.status === "completed";

    if (isEdit) {
      // EDIT MODE: match already completed, admin is correcting the result
      // Use atomic RPC to handle star reversal + match update in a single transaction
      const { error: editError } = await supabase.rpc("edit_match_winner", {
        p_match_id: id,
        p_new_winner_id: winner_id,
        p_player1_score: player1_score ?? null,
        p_player2_score: player2_score ?? null,
      });

      if (editError) {
        return Response.json({ error: editError.message }, { status: 400 });
      }
    } else {
      // FIRST RESOLVE: use the RPC
      const { error } = await supabase.rpc("resolve_match", {
        p_match_id: id,
        p_winner_id: winner_id,
      });

      // Save scores if provided (use admin client to bypass RLS for judges)
      if (!error && player1_score != null && player2_score != null) {
        const adminScores = createAdminClient();
        await adminScores
          .from("matches")
          .update({ player1_score, player2_score })
          .eq("id", id);
      }

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    }

    // Clear live flag when match is resolved
    const adminLive = createAdminClient();
    await adminLive.from("matches").update({ is_live: false }).eq("id", id);

    const matchData = currentMatch;

    // Side effects only on first resolve (not on edit)
    if (!isEdit && matchData) {
      const loserId = matchData.player1_id === winner_id
        ? matchData.player2_id
        : matchData.player1_id;

      // Insert match_result event into activity_feed
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
        const starsBet = matchData.stars_bet ?? 0;
        const xpLabel = starsBet > 0 ? "batalla de estrellas" : "amistoso";
        await awardXp(adminXp, winner_id, 20, "win_match", `Victoria en ${xpLabel}`);
        if (loserId) await awardXp(adminXp, loserId, 5, "lose_match", `Derrota en ${xpLabel}`);
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
            const winMsg = starsBet > 0
              ? `Le ganaste a ${loserPlayer?.alias}. +${starsBet} estrellas`
              : `Le ganaste a ${loserPlayer?.alias} en un amistoso`;
            sendPushToPlayer(
              winnerPlayer.id,
              "Victoria",
              winMsg,
              "/dashboard"
            ).catch((e) => console.error("[push] error:", e));
          }

          if (loserPlayer) {
            const loseMsg = starsBet > 0
              ? `${winnerPlayer?.alias} se llevó ${starsBet} estrellas. Revancha?`
              : `${winnerPlayer?.alias} ganó el amistoso. Revancha?`;
            sendPushToPlayer(
              loserPlayer.id,
              "Derrota",
              loseMsg,
              "/dashboard"
            ).catch((e) => console.error("[push] error:", e));
          }
        }
      } catch (pushErr) {
        console.error("Error sending match push notifications:", pushErr);
      }

      // Mark any linked challenges as "completed"
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

    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/matches/[id] error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check admin or judge
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin, is_judge")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin && !adminPlayer?.is_judge) {
      return Response.json({ error: "Solo administradores o jueces" }, { status: 403 });
    }

    const { id } = await params;
    const adminSupabase = createAdminClient();

    // Fetch match data
    const { data: match, error: matchError } = await adminSupabase
      .from("matches")
      .select("player1_id, player2_id, stars_bet, status, winner_id")
      .eq("id", id)
      .single();

    if (matchError || !match) {
      return Response.json({ error: "Partida no encontrada" }, { status: 404 });
    }

    // If match was completed, atomically reverse the star transfer and win/loss counts
    if (match.status === "completed" && match.winner_id) {
      const { error: reverseError } = await supabase.rpc("reverse_match_stars", {
        p_match_id: id,
      });

      if (reverseError) {
        return Response.json({ error: reverseError.message }, { status: 400 });
      }
    }

    // Delete the match
    const { error: deleteError } = await adminSupabase
      .from("matches")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/matches/[id] error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
