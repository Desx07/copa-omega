import { createClient } from "@/lib/supabase/server";

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
    const { action, round, winner_id } = body;

    // Fetch the battle
    const { data: battle, error: fetchError } = await supabase
      .from("deck_battles")
      .select(
        "*, challenger:players!challenger_id(id, alias, avatar_url), opponent:players!opponent_id(id, alias, avatar_url)"
      )
      .eq("id", id)
      .single();

    if (fetchError || !battle) {
      return Response.json({ error: "Deck battle no encontrado" }, { status: 404 });
    }

    // ========== ACCEPT ==========
    if (action === "accept") {
      if (battle.status !== "pending") {
        return Response.json(
          { error: "Este reto ya no esta pendiente" },
          { status: 400 }
        );
      }

      if (battle.opponent_id !== user.id) {
        return Response.json(
          { error: "Solo el oponente puede aceptar el reto" },
          { status: 403 }
        );
      }

      // Verificar que el oponente tenga un deck armado
      const { data: opponentDeck } = await supabase
        .from("player_decks")
        .select("*")
        .eq("player_id", user.id)
        .maybeSingle();

      if (!opponentDeck) {
        return Response.json(
          { error: "Necesitas armar tu deck antes de aceptar el reto" },
          { status: 400 }
        );
      }

      // Guardar snapshot del deck del oponente
      const opponentDeckSnapshot = {
        slot1: { blade: opponentDeck.slot1_blade, ratchet: opponentDeck.slot1_ratchet, bit: opponentDeck.slot1_bit },
        slot2: { blade: opponentDeck.slot2_blade, ratchet: opponentDeck.slot2_ratchet, bit: opponentDeck.slot2_bit },
        slot3: { blade: opponentDeck.slot3_blade, ratchet: opponentDeck.slot3_ratchet, bit: opponentDeck.slot3_bit },
      };

      const { error: updateError } = await supabase
        .from("deck_battles")
        .update({
          status: "in_progress",
          opponent_deck: opponentDeckSnapshot,
        })
        .eq("id", id);

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }

      return Response.json({ success: true, status: "in_progress" });
    }

    // ========== DECLINE ==========
    if (action === "decline") {
      if (battle.status !== "pending") {
        return Response.json(
          { error: "Este reto ya no esta pendiente" },
          { status: 400 }
        );
      }

      if (battle.opponent_id !== user.id) {
        return Response.json(
          { error: "Solo el oponente puede rechazar el reto" },
          { status: 403 }
        );
      }

      const { error: updateError } = await supabase
        .from("deck_battles")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }

      return Response.json({ success: true, status: "cancelled" });
    }

    // ========== CANCEL (challenger cancels own pending challenge) ==========
    if (action === "cancel") {
      if (battle.status !== "pending") {
        return Response.json(
          { error: "Solo se puede cancelar un reto pendiente" },
          { status: 400 }
        );
      }

      if (battle.challenger_id !== user.id) {
        return Response.json(
          { error: "Solo el retador puede cancelar" },
          { status: 403 }
        );
      }

      const { error: updateError } = await supabase
        .from("deck_battles")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }

      return Response.json({ success: true, status: "cancelled" });
    }

    // ========== RESOLVE ROUND (judge/admin sets round winner) ==========
    if (action === "resolve_round") {
      // Verificar que sea admin o juez
      const { data: userPlayer } = await supabase
        .from("players")
        .select("is_admin, is_judge")
        .eq("id", user.id)
        .single();

      if (!userPlayer?.is_admin && !userPlayer?.is_judge) {
        return Response.json(
          { error: "Solo jueces o admins pueden resolver rounds" },
          { status: 403 }
        );
      }

      if (battle.status !== "in_progress") {
        return Response.json(
          { error: "La batalla no esta en progreso" },
          { status: 400 }
        );
      }

      if (!round || ![1, 2, 3].includes(round)) {
        return Response.json(
          { error: "round debe ser 1, 2 o 3" },
          { status: 400 }
        );
      }

      if (!winner_id || ![battle.challenger_id, battle.opponent_id].includes(winner_id)) {
        return Response.json(
          { error: "winner_id debe ser uno de los participantes" },
          { status: 400 }
        );
      }

      const roundField = `round${round}_winner` as const;

      // Determinar si la batalla termina con este round
      const updatedRounds: Record<string, string | null> = {
        round1_winner: battle.round1_winner,
        round2_winner: battle.round2_winner,
        round3_winner: battle.round3_winner,
      };
      updatedRounds[roundField] = winner_id;

      // Contar victorias de cada jugador
      const roundValues = Object.values(updatedRounds).filter(Boolean);
      const challengerWins = roundValues.filter((w) => w === battle.challenger_id).length;
      const opponentWins = roundValues.filter((w) => w === battle.opponent_id).length;

      // Alguien gano 2 de 3?
      const battleWinner =
        challengerWins >= 2
          ? battle.challenger_id
          : opponentWins >= 2
            ? battle.opponent_id
            : null;

      const updatePayload: Record<string, unknown> = {
        [roundField]: winner_id,
      };

      if (battleWinner) {
        updatePayload.winner_id = battleWinner;
        updatePayload.status = "completed";
      }

      const { error: updateError } = await supabase
        .from("deck_battles")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }

      // Si la batalla termino, insertar feed event
      if (battleWinner) {
        const challengerData = battle.challenger as unknown as { alias: string };
        const opponentData = battle.opponent as unknown as { alias: string };
        const winnerAlias = battleWinner === battle.challenger_id
          ? challengerData.alias
          : opponentData.alias;

        await supabase.from("activity_feed").insert({
          type: "deck_battle_completed",
          actor_id: battleWinner,
          target_id: battleWinner === battle.challenger_id ? battle.opponent_id : battle.challenger_id,
          reference_id: battle.id,
          metadata: {
            winner_alias: winnerAlias,
            challenger_alias: challengerData.alias,
            opponent_alias: opponentData.alias,
            score: `${challengerWins}-${opponentWins}`,
            omega_coins_bet: battle.omega_coins_bet,
          },
        });
      }

      return Response.json({
        success: true,
        round,
        winner_id,
        battle_winner: battleWinner,
        status: battleWinner ? "completed" : "in_progress",
      });
    }

    return Response.json(
      { error: "action debe ser 'accept', 'decline', 'cancel' o 'resolve_round'" },
      { status: 400 }
    );
  } catch (err) {
    console.error("PATCH /api/deck-battles/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
