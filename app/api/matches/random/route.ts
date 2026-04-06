import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/matches/random
 * Genera partidas aleatorias a partir de una lista de jugadores presentes.
 * Si el numero es impar, el ultimo jugador recibe BYE.
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

    const body = await request.json();
    const { player_ids, stars_bet } = body as {
      player_ids: string[];
      stars_bet: number;
    };

    // Validaciones
    if (!Array.isArray(player_ids) || player_ids.length < 2) {
      return Response.json(
        { error: "Se necesitan al menos 2 jugadores" },
        { status: 400 }
      );
    }

    if (typeof stars_bet !== "number" || stars_bet < 0 || stars_bet > 5) {
      return Response.json(
        { error: "stars_bet debe ser entre 0 y 5" },
        { status: 400 }
      );
    }

    // Verificar que todos los jugadores existen y no estan eliminados
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, alias, avatar_url, stars, is_eliminated")
      .in("id", player_ids);

    if (playersError) {
      return Response.json({ error: playersError.message }, { status: 500 });
    }

    if (!players || players.length !== player_ids.length) {
      return Response.json(
        { error: "Uno o mas jugadores no existen" },
        { status: 404 }
      );
    }

    const eliminatedPlayer = players.find((p) => p.is_eliminated);
    if (eliminatedPlayer) {
      return Response.json(
        { error: `${eliminatedPlayer.alias} esta eliminado` },
        { status: 400 }
      );
    }

    // Solo verificar estrellas suficientes cuando se apuestan estrellas
    if (stars_bet > 0) {
      const poorPlayer = players.find((p) => p.stars < stars_bet);
      if (poorPlayer) {
        return Response.json(
          {
            error: `${poorPlayer.alias} no tiene suficientes estrellas (tiene ${poorPlayer.stars})`,
          },
          { status: 400 }
        );
      }
    }

    // Fisher-Yates shuffle
    const shuffled = [...player_ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Determinar BYE si numero impar
    let byePlayerId: string | null = null;
    const toPair = [...shuffled];

    if (toPair.length % 2 !== 0) {
      byePlayerId = toPair.pop()!;
    }

    // Crear pares
    const matchInserts = [];
    for (let i = 0; i < toPair.length; i += 2) {
      matchInserts.push({
        player1_id: toPair[i],
        player2_id: toPair[i + 1],
        stars_bet,
        created_by: user.id,
      });
    }

    // Insertar todas las partidas de una vez
    const { data: matches, error: insertError } = await supabase
      .from("matches")
      .insert(matchInserts)
      .select(
        "*, player1:players!player1_id(id, alias, stars), player2:players!player2_id(id, alias, stars)"
      );

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Buscar alias del jugador BYE
    let byePlayer: { id: string; alias: string; avatar_url?: string | null } | null = null;
    if (byePlayerId) {
      const found = players.find((p) => p.id === byePlayerId);
      if (found) {
        byePlayer = { id: found.id, alias: found.alias, avatar_url: found.avatar_url };
      }
    }

    return Response.json(
      { matches: matches ?? [], bye_player: byePlayer },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/matches/random error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
