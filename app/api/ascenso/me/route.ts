import { createClient } from "@/lib/supabase/server";

// ── GET /api/ascenso/me ──
// Estado del modo ascenso para el usuario autenticado:
//  - su jugador (rango, puntos de ticket, récord)
//  - objetivo de ticket de su rango (null si es S, el rango máximo)
//  - si tiene el ticket lleno
//  - rivales elegibles para el combate de ascenso (mismo rango, ticket lleno)
//  - pelea de ascenso pendiente en la que participa (si hay)

interface OpponentInfo {
  id: string;
  alias: string;
  avatar_url: string | null;
  rank_letter: string;
}

interface ActiveMatch {
  id: string;
  match_kind: string;
  points_awarded: number | null;
  opponent: OpponentInfo;
}

// Datos de ejemplo para preview en localhost (?demo=1|2|3). Solo existe en dev,
// mismo patrón que el preview ?modo= de la landing. Nunca llega a producción.
function demoPayload(escenario: string) {
  const player = {
    id: "demo-player",
    alias: "Desx07",
    avatar_url: null,
    rank_letter: "C",
    ticket_points: 180,
    wins: 28,
    losses: 12,
  };
  const rival = {
    id: "demo-rival",
    alias: "ShadowBurst",
    avatar_url: null,
    rank_letter: "C",
    ticket_points: 320,
  };
  // 1: progreso medio · 2: ticket lleno esperando combate · 3: combate de ascenso creado
  if (escenario === "2" || escenario === "3") {
    player.ticket_points = 310;
  }
  return {
    player,
    ticket_target: 300,
    has_ticket: escenario !== "1",
    eligible_opponents: escenario === "1" ? [] : [rival],
    active_match:
      escenario === "3"
        ? {
            id: "demo-match",
            match_kind: "ascension",
            points_awarded: null,
            opponent: { id: rival.id, alias: rival.alias, avatar_url: null, rank_letter: "C" },
          }
        : null,
  };
}

export async function GET(request: Request) {
  try {
    // Preview sin base de datos, solo en desarrollo
    if (process.env.NODE_ENV === "development") {
      const demo = new URL(request.url).searchParams.get("demo");
      if (demo) {
        return Response.json(demoPayload(demo));
      }
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Jugador del usuario
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, alias, avatar_url, rank_letter, ticket_points, wins, losses")
      .eq("id", user.id)
      .single();

    if (playerError || !player) {
      return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    const rankLetter: string = player.rank_letter ?? "F";
    const ticketPoints: number = player.ticket_points ?? 0;
    const esRangoMaximo = rankLetter === "S";

    // Objetivo de ticket del rango actual (null si es S: no hay más ascenso)
    let ticketTarget: number | null = null;
    if (!esRangoMaximo) {
      const { data: rankRow, error: rankError } = await supabase
        .from("ascenso_ranks")
        .select("ticket_target")
        .eq("letter", rankLetter)
        .single();

      if (rankError || !rankRow) {
        return Response.json(
          { error: `No se encontró configuración del rango ${rankLetter}` },
          { status: 500 }
        );
      }

      ticketTarget = rankRow.ticket_target;
    }

    const hasTicket = !esRangoMaximo && ticketTarget != null && ticketPoints >= ticketTarget;

    // Rivales elegibles: mismo rango, ticket lleno, activos. Solo si el usuario
    // ya tiene su propio ticket lleno; si no, lista vacía.
    let eligibleOpponents: Array<{
      id: string;
      alias: string;
      avatar_url: string | null;
      rank_letter: string;
      ticket_points: number;
    }> = [];

    if (hasTicket && ticketTarget != null) {
      const { data: opponents, error: opponentsError } = await supabase
        .from("players")
        .select("id, alias, avatar_url, rank_letter, ticket_points")
        .eq("rank_letter", rankLetter)
        .gte("ticket_points", ticketTarget)
        .eq("is_eliminated", false)
        .neq("id", user.id)
        .order("ticket_points", { ascending: false });

      if (opponentsError) {
        return Response.json({ error: opponentsError.message }, { status: 500 });
      }

      eligibleOpponents = (opponents ?? []).map((o) => ({
        id: o.id,
        alias: o.alias,
        avatar_url: o.avatar_url ?? null,
        rank_letter: o.rank_letter,
        ticket_points: o.ticket_points ?? 0,
      }));
    }

    // Pelea de ascenso pendiente donde participa el usuario (la más reciente)
    const { data: pendingMatch, error: matchError } = await supabase
      .from("matches")
      .select(
        "id, match_kind, points_awarded, player1_id, player2_id, player1:players!player1_id(id, alias, avatar_url, rank_letter), player2:players!player2_id(id, alias, avatar_url, rank_letter)"
      )
      .eq("mode", "ascenso")
      .eq("status", "pending")
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (matchError) {
      return Response.json({ error: matchError.message }, { status: 500 });
    }

    let activeMatch: ActiveMatch | null = null;
    if (pendingMatch) {
      // El rival es el jugador que no es el usuario
      const esPlayer1 = pendingMatch.player1_id === user.id;
      // Supabase puede tipar las relaciones embebidas como array — normalizamos
      const rawOpponent = esPlayer1 ? pendingMatch.player2 : pendingMatch.player1;
      const opponent = Array.isArray(rawOpponent) ? rawOpponent[0] : rawOpponent;

      if (opponent) {
        activeMatch = {
          id: pendingMatch.id,
          match_kind: pendingMatch.match_kind ?? "normal",
          points_awarded: pendingMatch.points_awarded ?? null,
          opponent: {
            id: opponent.id,
            alias: opponent.alias,
            avatar_url: opponent.avatar_url ?? null,
            rank_letter: opponent.rank_letter,
          },
        };
      }
    }

    return Response.json({
      player: {
        id: player.id,
        alias: player.alias,
        avatar_url: player.avatar_url ?? null,
        rank_letter: rankLetter,
        ticket_points: ticketPoints,
        wins: player.wins ?? 0,
        losses: player.losses ?? 0,
      },
      ticket_target: ticketTarget,
      has_ticket: hasTicket,
      eligible_opponents: eligibleOpponents,
      active_match: activeMatch,
    });
  } catch (err) {
    console.error("GET /api/ascenso/me error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
