import { createClient } from "@/lib/supabase/server";
import { RANKS } from "@/lib/ascenso";

// ── GET /api/ascenso/me ──
// Estado del modo ascenso para el usuario autenticado:
//  - su jugador (rango, puntos de ticket, récord)
//  - objetivo de ticket de su rango (null si es S, el rango máximo)
//  - si tiene el ticket lleno
//  - rivales elegibles para el combate de ascenso (mismo rango, ticket lleno)
//  - pelea de ascenso activa (pendiente o en vivo) en la que participa (si hay)
//  - último resultado de ascenso completado (para mostrarlo aunque no estuviera mirando)

interface OpponentInfo {
  id: string;
  alias: string;
  avatar_url: string | null;
  rank_letter: string;
}

// Jugador en la cola de combate por orden de llegada (FIFO). is_me marca al
// propio usuario para que la UI pueda mostrar "sos el Nº de la fila".
interface QueueEntry {
  id: string;
  alias: string;
  avatar_url: string | null;
  rank_letter: string;
  ticket_filled_at: string | null;
  is_me: boolean;
}

interface ActiveMatch {
  id: string;
  match_kind: string;
  points_awarded: number | null;
  // El rival incluye sus puntos de ticket para mostrarlos en el versus
  opponent: OpponentInfo & { ticket_points: number | null };
}

interface LastResult {
  match_id: string;
  match_kind: string;
  won: boolean;
  points_awarded: number | null;
  from_rank: string | null;
  to_rank: string | null;
  opponent: OpponentInfo;
  completed_at: string;
}

// Datos de ejemplo para preview en localhost (?demo=1|2|3|4). Solo existe en dev,
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
  // 4: como el 1 pero recién ascendido (ganó el combate C → B, ticket reiniciado)
  if (escenario === "2" || escenario === "3") {
    player.ticket_points = 310;
  }
  if (escenario === "4") {
    player.rank_letter = "B";
    player.ticket_points = 0;
  }
  const hasTicket = escenario === "2" || escenario === "3";
  return {
    player,
    // El objetivo es del rango actual: C = 300, B = 400 (escenario 4, ya ascendido)
    ticket_target: escenario === "4" ? 400 : 300,
    has_ticket: hasTicket,
    eligible_opponents: hasTicket
      ? [{ ...rival, ticket_filled_at: "2026-07-06T18:00:00.000Z" }]
      : [],
    // Cola FIFO de ejemplo: el rival llenó primero, después el usuario (si tiene
    // ticket lleno). Solo con datos cuando el usuario está en la fila.
    queue: hasTicket
      ? [
          {
            id: rival.id,
            alias: rival.alias,
            avatar_url: null,
            rank_letter: player.rank_letter,
            ticket_filled_at: "2026-07-06T18:00:00.000Z",
            is_me: false,
          },
          {
            id: player.id,
            alias: player.alias,
            avatar_url: null,
            rank_letter: player.rank_letter,
            ticket_filled_at: "2026-07-06T18:30:00.000Z",
            is_me: true,
          },
        ]
      : [],
    active_match:
      escenario === "3"
        ? {
            id: "demo-match",
            match_kind: "ascension",
            points_awarded: null,
            opponent: {
              id: rival.id,
              alias: rival.alias,
              avatar_url: null,
              rank_letter: "C",
              ticket_points: rival.ticket_points,
            },
          }
        : null,
    last_result:
      escenario === "4"
        ? {
            match_id: "demo-last-match",
            match_kind: "ascension",
            won: true,
            points_awarded: null,
            from_rank: "C",
            to_rank: "B",
            opponent: { id: rival.id, alias: rival.alias, avatar_url: null, rank_letter: "C" },
            // Fecha fija para que el demo sea determinístico (no usar new Date())
            completed_at: "2026-06-07T21:30:00.000Z",
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

    // Jugador del usuario — SOLO columnas base (existen siempre). Las columnas
    // de ascenso (rank_letter, ticket_points, ascenso_enabled) se consultan
    // aparte para tolerar que la migración todavía no esté aplicada: si no
    // existen, caemos a defaults sin romper el endpoint (antes esto tiraba 404
    // en toda la página porque la query principal las incluía).
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, alias, avatar_url, wins, losses")
      .eq("id", user.id)
      .single();

    if (playerError || !player) {
      return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    // Columnas de ascenso, tolerantes a migración pendiente (42703).
    let rankLetter = "F";
    let ticketPoints = 0;
    let ascensoEnabled = false;
    {
      const { data: ascRow, error: ascError } = await supabase
        .from("players")
        .select("rank_letter, ticket_points, ascenso_enabled")
        .eq("id", user.id)
        .single();
      if (ascError) {
        if (ascError.code !== "42703") {
          return Response.json({ error: ascError.message }, { status: 500 });
        }
        // columnas inexistentes → defaults F / 0 / false
      } else if (ascRow) {
        rankLetter = ascRow.rank_letter ?? "F";
        ticketPoints = ascRow.ticket_points ?? 0;
        ascensoEnabled = ascRow.ascenso_enabled ?? false;
      }
    }

    const esRangoMaximo = rankLetter === "S";

    // Objetivo de ticket del rango actual (null si es S: no hay más ascenso).
    // Fallback a los targets de lib/ascenso si la tabla ascenso_ranks no existe
    // todavía (migración pendiente) — antes esto tiraba 500 y rompía la página.
    let ticketTarget: number | null = null;
    if (!esRangoMaximo) {
      const { data: rankRow, error: rankError } = await supabase
        .from("ascenso_ranks")
        .select("ticket_target")
        .eq("letter", rankLetter)
        .single();

      if (rankError || !rankRow) {
        const fallback = RANKS.find((r) => r.letter === rankLetter);
        ticketTarget = fallback?.ticketTarget ?? null;
      } else {
        ticketTarget = rankRow.ticket_target;
      }
    }

    const hasTicket = !esRangoMaximo && ticketTarget != null && ticketPoints >= ticketTarget;

    // Rivales elegibles: mismo rango, ticket lleno, activos. Solo si el usuario
    // ya tiene su propio ticket lleno; si no, lista vacía.
    // Orden de llegada (FIFO): los que llenaron el ticket primero aparecen
    // primero (ticket_filled_at asc). Los sin marca de llenado (columna vieja o
    // dato faltante) van al final (nullsFirst: false).
    let eligibleOpponents: Array<{
      id: string;
      alias: string;
      avatar_url: string | null;
      rank_letter: string;
      ticket_points: number;
      ticket_filled_at: string | null;
    }> = [];

    if (hasTicket && ticketTarget != null) {
      // Solo rivales habilitados para el torneo de ascenso (ascenso_enabled = true).
      const baseOpponents = () =>
        supabase
          .from("players")
          .select("id, alias, avatar_url, rank_letter, ticket_points, ticket_filled_at")
          .eq("rank_letter", rankLetter)
          .gte("ticket_points", ticketTarget)
          .eq("is_eliminated", false)
          .eq("ascenso_enabled", true)
          .neq("id", user.id);

      let { data: opponents, error: opponentsError } = await baseOpponents().order(
        "ticket_filled_at",
        { ascending: true, nullsFirst: false }
      );

      // Tolerante: si ticket_filled_at todavía no existe (migración sin aplicar),
      // caemos al orden anterior por ticket_points desc sin romper.
      if (opponentsError?.code === "42703") {
        const fallback = await supabase
          .from("players")
          .select("id, alias, avatar_url, rank_letter, ticket_points")
          .eq("rank_letter", rankLetter)
          .gte("ticket_points", ticketTarget)
          .eq("is_eliminated", false)
          .eq("ascenso_enabled", true)
          .neq("id", user.id)
          .order("ticket_points", { ascending: false });
        opponents = fallback.data as typeof opponents;
        opponentsError = fallback.error;
      }

      if (opponentsError) {
        // Tolerante a columna inexistente del filtro de habilitación (ascenso_enabled):
        // sin ese filtro no podemos resolver rivales de forma segura, así que
        // devolvemos lista vacía en vez de 500.
        if (opponentsError.code !== "42703") {
          return Response.json({ error: opponentsError.message }, { status: 500 });
        }
      }

      eligibleOpponents = (opponents ?? []).map((o) => ({
        id: o.id,
        alias: o.alias,
        avatar_url: o.avatar_url ?? null,
        rank_letter: o.rank_letter,
        ticket_points: o.ticket_points ?? 0,
        ticket_filled_at: (o as { ticket_filled_at?: string | null }).ticket_filled_at ?? null,
      }));
    }

    // Cola de combate por orden de llegada (FIFO): todos los jugadores del MISMO
    // rango del usuario con ticket lleno, ordenados por quién llenó primero.
    // Incluye al propio usuario (is_me) para que la UI muestre su lugar en la fila.
    // Se arma siempre que el usuario NO esté en el rango máximo (S no tiene cola).
    let queue: QueueEntry[] = [];
    if (!esRangoMaximo && ticketTarget != null) {
      const { data: queueRows, error: queueError } = await supabase
        .from("players")
        .select("id, alias, avatar_url, rank_letter, ticket_filled_at")
        .eq("rank_letter", rankLetter)
        .gte("ticket_points", ticketTarget)
        .eq("is_eliminated", false)
        .eq("ascenso_enabled", true)
        .order("ticket_filled_at", { ascending: true, nullsFirst: false });

      if (queueError) {
        // Tolerante a columna inexistente (ticket_filled_at o ascenso_enabled sin
        // migrar): la cola es informativa, devolvemos vacío en vez de 500.
        if (queueError.code !== "42703") {
          return Response.json({ error: queueError.message }, { status: 500 });
        }
      } else {
        queue = (queueRows ?? []).map((q) => ({
          id: q.id,
          alias: q.alias,
          avatar_url: q.avatar_url ?? null,
          rank_letter: q.rank_letter,
          ticket_filled_at: q.ticket_filled_at ?? null,
          is_me: q.id === user.id,
        }));
      }
    }

    // Pelea de ascenso activa donde participa el usuario (la más reciente).
    // Incluye "in_progress": el juez puede ponerla en vivo antes de resolverla
    // y no tiene que desaparecer de la pantalla del jugador.
    const { data: pendingMatch, error: matchError } = await supabase
      .from("matches")
      .select(
        "id, match_kind, points_awarded, player1_id, player2_id, player1:players!player1_id(id, alias, avatar_url, rank_letter, ticket_points), player2:players!player2_id(id, alias, avatar_url, rank_letter, ticket_points)"
      )
      .eq("mode", "ascenso")
      .in("status", ["pending", "in_progress"])
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Tolerante: si las columnas de ascenso no existen (migración pendiente),
    // no puede haber partidas de ascenso todavía → tratamos como sin partida
    // activa en vez de tirar 500 (antes esto rompía toda la página).
    if (matchError && matchError.code !== "42703") {
      return Response.json({ error: matchError.message }, { status: 500 });
    }

    let activeMatch: ActiveMatch | null = null;
    if (!matchError && pendingMatch) {
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
            rank_letter: opponent.rank_letter ?? rankLetter,
            ticket_points: opponent.ticket_points ?? null,
          },
        };
      }
    }

    // Último resultado de ascenso completado donde participó el usuario.
    // Sirve para mostrarle el resultado aunque no estuviera mirando cuando el
    // juez resolvió. El cliente decide si ya lo vio (localStorage); el server
    // siempre devuelve el último. Es informativo: si falla, no rompemos el endpoint.
    let lastResult: LastResult | null = null;
    const { data: lastMatch, error: lastMatchError } = await supabase
      .from("matches")
      .select(
        "id, match_kind, points_awarded, winner_id, completed_at, player1_id, player2_id, player1:players!player1_id(id, alias, avatar_url, rank_letter), player2:players!player2_id(id, alias, avatar_url, rank_letter)"
      )
      .eq("mode", "ascenso")
      .eq("status", "completed")
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMatchError) {
      console.error("GET /api/ascenso/me — error buscando último resultado:", lastMatchError);
    } else if (lastMatch && lastMatch.completed_at) {
      const esPlayer1 = lastMatch.player1_id === user.id;
      const rawOpponent = esPlayer1 ? lastMatch.player2 : lastMatch.player1;
      const opponent = Array.isArray(rawOpponent) ? rawOpponent[0] : rawOpponent;

      if (opponent) {
        const won = lastMatch.winner_id === user.id;
        const matchKind: string = lastMatch.match_kind ?? "normal";

        // from/to_rank solo si fue un combate de ascensión GANADO: el rango ya
        // fue actualizado por el RPC, así que to = rango actual y from = el
        // escalón anterior de la escalera F → S.
        let fromRank: string | null = null;
        let toRank: string | null = null;
        if (matchKind === "ascension" && won) {
          const idx = RANKS.findIndex((r) => r.letter === rankLetter);
          if (idx > 0) {
            toRank = rankLetter;
            fromRank = RANKS[idx - 1].letter;
          }
        }

        lastResult = {
          match_id: lastMatch.id,
          match_kind: matchKind,
          won,
          points_awarded: lastMatch.points_awarded ?? null,
          from_rank: fromRank,
          to_rank: toRank,
          opponent: {
            id: opponent.id,
            alias: opponent.alias,
            avatar_url: opponent.avatar_url ?? null,
            rank_letter: opponent.rank_letter,
          },
          completed_at: lastMatch.completed_at,
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
        ascenso_enabled: ascensoEnabled,
      },
      ticket_target: ticketTarget,
      has_ticket: hasTicket,
      eligible_opponents: eligibleOpponents,
      queue,
      active_match: activeMatch,
      last_result: lastResult,
    });
  } catch (err) {
    console.error("GET /api/ascenso/me error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
