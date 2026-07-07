// ============================================================================
// MOCK EN MEMORIA del Torneo de Ascenso — SOLO DEV, sin base de datos.
// Permite correr el FLUJO REAL completo (crear partida → sumar puntos → llenar
// ticket → combate de ascenso → subir de rango) con 2 jugadores inventados,
// para ver que TODAS las animaciones de /ascenso se disparen según el caso.
//
// El estado vive a nivel de módulo (persiste entre requests mientras corre el
// dev server). Se maneja vía /api/ascenso/mock y lo lee /api/ascenso/me?mock=1.
// ============================================================================
import { RANKS, rankInfo, nextRank, hasFullTicket, type RankLetter } from "@/lib/ascenso";

export interface MockPlayer {
  id: string;
  alias: string;
  avatar_url: string | null;
  rank_letter: RankLetter;
  ticket_points: number;
  wins: number;
  losses: number;
  ticket_filled_at: number | null; // orden de llegada FIFO
}

interface MockMatch {
  id: string;
  match_kind: "normal" | "ascension";
  points_awarded: number | null;
  player1_id: string;
  player2_id: string;
}

interface MockLastResult {
  match_id: string;
  match_kind: "normal" | "ascension";
  winner_id: string;
  points_awarded: number | null;
  from_rank: RankLetter | null;
  to_rank: RankLetter | null;
  opponent_id: string;
  completed_at: string;
}

// El usuario "logueado" en /ascenso?mock=1 es siempre p1
export const MOCK_ME_ID = "p1";
let clock = 1;

function freshPlayers(): MockPlayer[] {
  return [
    { id: "p1", alias: "Valt", avatar_url: null, rank_letter: "F", ticket_points: 0, wins: 0, losses: 0, ticket_filled_at: null },
    { id: "p2", alias: "Shu", avatar_url: null, rank_letter: "F", ticket_points: 0, wins: 0, losses: 0, ticket_filled_at: null },
  ];
}

interface MockStore {
  players: MockPlayer[];
  activeMatch: MockMatch | null;
  lastResult: MockLastResult | null;
}

// Persistir en globalThis para sobrevivir el hot-reload del dev server
const g = globalThis as unknown as { __ascensoMock?: MockStore };
if (!g.__ascensoMock) {
  g.__ascensoMock = { players: freshPlayers(), activeMatch: null, lastResult: null };
}
const store = g.__ascensoMock;

const byId = (id: string) => store.players.find((p) => p.id === id);

export function mockReset() {
  store.players = freshPlayers();
  store.activeMatch = null;
  store.lastResult = null;
  clock = 1;
}

// Suma puntos al ticket de un jugador (simula ganar una pelea normal).
// Marca ticket_filled_at al cruzar el umbral (orden de llegada).
export function mockAddPoints(id: string, pts: number) {
  const p = byId(id);
  if (!p) return;
  const target = rankInfo(p.rank_letter).ticketTarget ?? Infinity;
  const wasFull = p.ticket_points >= target;
  p.ticket_points += pts;
  p.wins += 1;
  if (!wasFull && p.ticket_points >= target && p.ticket_filled_at === null) {
    p.ticket_filled_at = clock++;
  }
  const rival = store.players.find((x) => x.id !== id);
  if (rival) rival.losses += 1;
}

// Crea el combate de ascenso entre los 2 (ambos deben tener ticket lleno).
export function mockCreateAscension() {
  store.lastResult = null;
  store.activeMatch = {
    id: `m${clock++}`,
    match_kind: "ascension",
    points_awarded: null,
    player1_id: "p1",
    player2_id: "p2",
  };
}

// Resuelve el combate de ascenso: el ganador sube de rango, ambos reinician
// ticket, y se registra last_result (dispara la animación de rank-up).
export function mockResolveAscension(winnerId: string) {
  const m = store.activeMatch;
  if (!m) return;
  const winner = byId(winnerId);
  const loser = byId(winnerId === "p1" ? "p2" : "p1");
  if (!winner || !loser) return;
  const from = winner.rank_letter;
  const to = nextRank(from) ?? from;
  winner.rank_letter = to;
  winner.ticket_points = 0;
  winner.ticket_filled_at = null;
  winner.wins += 1;
  loser.ticket_points = 0;
  loser.ticket_filled_at = null;
  loser.losses += 1;
  store.lastResult = {
    match_id: m.id,
    match_kind: "ascension",
    winner_id: winnerId,
    points_awarded: null,
    from_rank: from,
    to_rank: to,
    opponent_id: loser.id,
    completed_at: "2026-07-07T02:00:00.000Z",
  };
  store.activeMatch = null;
}

// Arma la respuesta de /api/ascenso/me para el jugador dado, en el mismo shape
// que el endpoint real (para que la página /ascenso corra sin cambios).
export function mockMePayload(meId: string) {
  const me = byId(meId) ?? store.players[0];
  const target = rankInfo(me.rank_letter).ticketTarget;
  const full = hasFullTicket(me.rank_letter, me.ticket_points);

  // Cola FIFO: todos del mismo rango con ticket lleno, por orden de llegada
  const queue = store.players
    .filter((p) => p.rank_letter === me.rank_letter && hasFullTicket(p.rank_letter, p.ticket_points))
    .sort((a, b) => (a.ticket_filled_at ?? 0) - (b.ticket_filled_at ?? 0))
    .map((p) => ({
      id: p.id, alias: p.alias, avatar_url: p.avatar_url,
      rank_letter: p.rank_letter, ticket_filled_at: String(p.ticket_filled_at ?? ""),
      is_me: p.id === me.id,
    }));

  // Match activo donde participa el usuario
  let active_match = null;
  if (store.activeMatch && (store.activeMatch.player1_id === me.id || store.activeMatch.player2_id === me.id)) {
    const oppId = store.activeMatch.player1_id === me.id ? store.activeMatch.player2_id : store.activeMatch.player1_id;
    const opp = byId(oppId);
    if (opp) {
      active_match = {
        id: store.activeMatch.id,
        match_kind: store.activeMatch.match_kind,
        points_awarded: store.activeMatch.points_awarded,
        opponent: { id: opp.id, alias: opp.alias, avatar_url: opp.avatar_url, rank_letter: opp.rank_letter, ticket_points: opp.ticket_points },
      };
    }
  }

  // Último resultado del usuario
  let last_result = null;
  if (store.lastResult && (store.lastResult.winner_id === me.id || store.lastResult.opponent_id === me.id)) {
    const opp = byId(store.lastResult.opponent_id === me.id ? store.lastResult.winner_id : store.lastResult.opponent_id);
    last_result = {
      match_id: store.lastResult.match_id,
      match_kind: store.lastResult.match_kind,
      won: store.lastResult.winner_id === me.id,
      points_awarded: store.lastResult.points_awarded,
      from_rank: store.lastResult.winner_id === me.id ? store.lastResult.from_rank : null,
      to_rank: store.lastResult.winner_id === me.id ? store.lastResult.to_rank : null,
      opponent: opp ? { id: opp.id, alias: opp.alias, avatar_url: opp.avatar_url, rank_letter: opp.rank_letter } : { id: "", alias: "Rival", avatar_url: null, rank_letter: "F" as RankLetter },
      completed_at: store.lastResult.completed_at,
    };
  }

  return {
    player: { id: me.id, alias: me.alias, avatar_url: me.avatar_url, rank_letter: me.rank_letter, ticket_points: me.ticket_points, wins: me.wins, losses: me.losses, ascenso_enabled: true },
    ticket_target: target,
    has_ticket: full,
    eligible_opponents: full ? queue.filter((q) => !q.is_me).map((q) => ({ id: q.id, alias: q.alias, avatar_url: q.avatar_url, rank_letter: q.rank_letter, ticket_points: 0 })) : [],
    queue,
    active_match,
    last_result,
  };
}

export const MOCK_RANKS = RANKS; // re-export por conveniencia
