import { createClient } from "@/lib/supabase/server";
import { getCapabilities, capabilityGate } from "@/lib/capabilities";

/**
 * GET /api/bets
 * Mis apuestas + saldo + retos apostables. Si la tabla `bets` no existe todavía
 * (migración pendiente), devuelve enabled=false y no rompe.
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

    // Wallet apagada → no se muestran apuestas (misma forma que "feature deshabilitada").
    const caps = await getCapabilities(supabase);
    if (!caps.walletEnabled) {
      return Response.json({
        enabled: false,
        balance: 0,
        my_bets: [],
        challenges: [],
      });
    }

    const { data: me } = await supabase
      .from("players")
      .select("omega_coins")
      .eq("id", user.id)
      .single();

    const { data: myBets, error: betsError } = await supabase
      .from("bets")
      .select(
        "id, match_id, challenge_id, predicted_winner_id, stake, payout, status, created_at, resolved_at"
      )
      .eq("bettor_id", user.id)
      .order("created_at", { ascending: false });

    if (betsError) {
      // Tabla ausente (migración pendiente) → feature deshabilitada, sin romper.
      return Response.json({
        enabled: false,
        balance: me?.omega_coins ?? 0,
        my_bets: [],
        challenges: [],
      });
    }

    // Retos pendientes apostables (no propios) — mismo criterio que predictions.
    const { data: challenges } = await supabase
      .from("challenges")
      .select(
        "id, challenger_id, challenged_id, status, challenger:players!challenger_id(alias, avatar_url), challenged:players!challenged_id(alias, avatar_url)"
      )
      .in("status", ["pending", "accepted"])
      .neq("challenger_id", user.id)
      .neq("challenged_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return Response.json({
      enabled: true,
      balance: me?.omega_coins ?? 0,
      my_bets: myBets ?? [],
      challenges: challenges ?? [],
    });
  } catch (err) {
    console.error("GET /api/bets error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/bets
 * Body: { match_id? | challenge_id?, predicted_winner_id, stake }
 * Apuesta coins a un ganador. Escrow atómico del stake; si algo falla se reintegra.
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

    // Gate de wallet: antes del escrow (deduct_omega_coins).
    const caps = await getCapabilities(supabase);
    const gate = capabilityGate(caps.walletEnabled, "La wallet está desactivada");
    if (gate) return gate;

    const body = await request.json();
    const { match_id, challenge_id, predicted_winner_id } = body;
    const stake = Number(body.stake);

    if (!predicted_winner_id) {
      return Response.json({ error: "Falta predicted_winner_id" }, { status: 400 });
    }
    if (!Number.isInteger(stake) || stake <= 0) {
      return Response.json({ error: "El monto debe ser un entero mayor a 0" }, { status: 400 });
    }

    const refs = [match_id, challenge_id].filter(Boolean);
    if (refs.length !== 1) {
      return Response.json(
        { error: "Debe especificar exactamente uno: match_id o challenge_id" },
        { status: 400 }
      );
    }

    // Validación de la partida/reto (igual que predictions).
    if (match_id) {
      const { data: match } = await supabase
        .from("matches")
        .select("player1_id, player2_id, status")
        .eq("id", match_id)
        .single();
      if (!match) return Response.json({ error: "Partida no encontrada" }, { status: 404 });
      if (match.status !== "pending")
        return Response.json({ error: "La partida ya no acepta apuestas" }, { status: 400 });
      if (match.player1_id === user.id || match.player2_id === user.id)
        return Response.json({ error: "No podés apostar tus propias partidas" }, { status: 400 });
      if (predicted_winner_id !== match.player1_id && predicted_winner_id !== match.player2_id)
        return Response.json({ error: "El ganador debe ser uno de los jugadores" }, { status: 400 });
    }
    if (challenge_id) {
      const { data: ch } = await supabase
        .from("challenges")
        .select("challenger_id, challenged_id, status")
        .eq("id", challenge_id)
        .single();
      if (!ch) return Response.json({ error: "Reto no encontrado" }, { status: 404 });
      if (!["pending", "accepted"].includes(ch.status))
        return Response.json({ error: "El reto ya no acepta apuestas" }, { status: 400 });
      if (ch.challenger_id === user.id || ch.challenged_id === user.id)
        return Response.json({ error: "No podés apostar tus propios retos" }, { status: 400 });
      if (predicted_winner_id !== ch.challenger_id && predicted_winner_id !== ch.challenged_id)
        return Response.json({ error: "El ganador debe ser uno de los jugadores" }, { status: 400 });
    }

    // Escrow atómico del stake (valida saldo dentro del RPC).
    const { data: remaining, error: deductError } = await supabase.rpc("deduct_omega_coins", {
      p_player_id: user.id,
      p_amount: stake,
    });
    if (deductError) {
      return Response.json({ error: "No se pudo procesar el saldo" }, { status: 500 });
    }
    if (remaining === -1) {
      return Response.json({ error: "Saldo insuficiente" }, { status: 400 });
    }

    // Insertar la apuesta.
    const insertData: Record<string, unknown> = {
      bettor_id: user.id,
      predicted_winner_id,
      stake,
    };
    if (match_id) insertData.match_id = match_id;
    if (challenge_id) insertData.challenge_id = challenge_id;

    const { data: bet, error: insertError } = await supabase
      .from("bets")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      // Ante CUALQUIER fallo (incluida tabla ausente o unique) se reintegra el stake.
      await supabase.rpc("add_omega_coins", { p_player_id: user.id, p_amount: stake });
      if (insertError.code === "23505") {
        return Response.json({ error: "Ya apostaste esta partida" }, { status: 409 });
      }
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({ bet, balance: remaining }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bets error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
