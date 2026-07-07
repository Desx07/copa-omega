"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import BattleScreen, { type BattlePlayer } from "./_components/battle-card";
import BattleClash from "./_components/battle-clash";
import RankTower from "./_components/rank-tower";
import RankUpAnimation from "./_components/rank-up-animation";
import { rankInfo, type RankLetter } from "@/lib/ascenso";

// ── Tipos de la respuesta de GET /api/ascenso/me ──
interface MePlayer {
  id: string;
  alias: string;
  avatar_url: string | null;
  rank_letter: RankLetter;
  ticket_points: number;
  wins: number;
  losses: number;
}

interface MeOpponent {
  id: string;
  alias: string;
  avatar_url: string | null;
  rank_letter: RankLetter;
  ticket_points: number;
}

// Jugador en la cola de combate por orden de llegada (FIFO). is_me marca al
// propio usuario para resaltar su lugar en la fila.
interface MeQueueEntry {
  id: string;
  alias: string;
  avatar_url: string | null;
  rank_letter: RankLetter;
  ticket_filled_at: string | null;
  is_me: boolean;
}

interface MeActiveMatch {
  id: string;
  match_kind: "normal" | "ascension";
  points_awarded: number | null;
  opponent: {
    id: string;
    alias: string;
    avatar_url: string | null;
    rank_letter: RankLetter;
    ticket_points: number | null;
  };
}

// Último combate completado del usuario — siempre viene en /me (el server no trackea visto)
interface MeLastResult {
  match_id: string;
  match_kind: "normal" | "ascension";
  won: boolean;
  points_awarded: number | null;
  from_rank: RankLetter | null;
  to_rank: RankLetter | null;
  opponent: {
    id: string;
    alias: string;
    avatar_url: string | null;
    rank_letter: RankLetter;
  };
  completed_at: string;
}

interface AscensoMe {
  player: MePlayer;
  ticket_target: number | null;
  has_ticket: boolean;
  eligible_opponents: MeOpponent[];
  // Cola FIFO del rango: todos con ticket lleno ordenados por quién llenó primero.
  queue: MeQueueEntry[];
  active_match: MeActiveMatch | null;
  last_result: MeLastResult | null;
}

// Forma mínima del rival para armar la card de batalla (ticket solo en match activo)
interface OpponentDisplay {
  id: string;
  alias: string;
  avatar_url: string | null;
  rank_letter: RankLetter;
  ticket_points?: number | null;
}

// ── Personajes de Beyblade X disponibles en /public/characters ──
const CHARACTER_IDS = [
  "00", "01", "05", "06", "07", "08", "10", "11", "12", "16", "17", "18",
  "19", "20", "21", "22", "24", "25", "26", "27", "32", "36", "37", "38",
  "39", "40", "41", "42", "43", "44", "45", "46", "48", "49", "50", "51",
  "52", "53", "54", "55", "56", "57", "58",
];

// Personaje determinístico por id de jugador (no cambia entre renders ni sesiones)
function characterFor(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;
  }
  return CHARACTER_IDS[hash % CHARACTER_IDS.length];
}

type GamePhase = "idle" | "tower" | "loading" | "clash" | "versus" | "rank_up" | "result";

// Resultado del último combate resuelto (viene de last_result en /me)
interface ResultInfo {
  kind: "rank_up" | "won_points" | "lost";
  delta?: number;
}

// ── Persistencia del último resultado visto (para no repetirlo) ──
const SEEN_RESULT_KEY = "ascenso_last_result_seen";

// En el preview dev (?demo=N) el "visto" vive solo en memoria así cada
// recarga vuelve a mostrar el resultado del escenario
function isDemoPreview(): boolean {
  return new URLSearchParams(window.location.search).has("demo");
}

function readSeenResultId(): string | null {
  try {
    return localStorage.getItem(SEEN_RESULT_KEY);
  } catch {
    return null;
  }
}

export default function AscensoPage() {
  const [data, setData] = useState<AscensoMe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [battleStatus, setBattleStatus] = useState<
    "loading" | "reveal" | "ready" | "in_progress" | "completed"
  >("loading");
  const [rankUp, setRankUp] = useState<{ from: RankLetter; to: RankLetter } | null>(null);
  const [resultInfo, setResultInfo] = useState<ResultInfo | null>(null);
  // Aviso de combate cancelado por el juez (banner temporal en idle)
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);

  // Refs para usar el estado actual dentro del fetch sin re-crear callbacks
  const prevRef = useRef<AscensoMe | null>(null);
  const phaseRef = useRef<GamePhase>("idle");
  // Guardamos el último match activo para seguir mostrando el versus/resultado
  // cuando el juez ya lo resolvió y desaparece de la API
  const lastMatchRef = useRef<MeActiveMatch | null>(null);
  // Resultado ya disparado en esta sesión (evita re-mostrar en cada refetch)
  const shownResultIdRef = useRef<string | null>(null);
  // "Visto" en memoria para el preview dev (?demo) — no toca localStorage
  const demoSeenRef = useRef<string | null>(null);
  // Timer del loading → versus, cancelable si el resultado llega antes
  const versusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Marca un resultado como visto (en demo solo en memoria, así el preview se repite)
  const markResultSeen = useCallback((matchId: string) => {
    demoSeenRef.current = matchId;
    if (!isDemoPreview()) {
      try {
        localStorage.setItem(SEEN_RESULT_KEY, matchId);
      } catch {
        // Sin storage disponible no persistimos: el peor caso es re-mostrar el resultado
      }
    }
  }, []);

  // ── Fetch del estado real del jugador ──
  const fetchMe = useCallback(async () => {
    try {
      // Passthrough del preview ?demo=N de localhost hacia la API (solo dev)
      const demo = new URLSearchParams(window.location.search).get("demo");
      const res = await fetch(`/api/ascenso/me${demo ? `?demo=${demo}` : ""}`, { cache: "no-store" });
      if (!res.ok) {
        if (!prevRef.current) {
          setUnauthorized(res.status === 401);
          setLoadError(
            res.status === 401
              ? "Iniciá sesión para ver tu progreso de ascenso"
              : "No pudimos cargar tu estado de ascenso"
          );
        }
        return;
      }
      const me = (await res.json()) as AscensoMe;
      const prev = prevRef.current;

      // ── Resultado pendiente de ver: last_result es la fuente de verdad ──
      const lr = me.last_result;
      const seenId = isDemoPreview() ? demoSeenRef.current : readSeenResultId();

      if (lr && lr.match_id !== seenId && lr.match_id !== shownResultIdRef.current) {
        // Resultado nuevo no visto: lo mostramos desde cualquier fase (incluso idle)
        shownResultIdRef.current = lr.match_id;
        setBattleStatus("completed");
        if (lr.match_kind === "ascension" && lr.won && lr.from_rank && lr.to_rank) {
          // Ascenso ganado: animación con los rangos reales del server
          setRankUp({ from: lr.from_rank, to: lr.to_rank });
          setResultInfo({ kind: "rank_up" });
          setPhase("rank_up");
        } else {
          setResultInfo({
            kind: lr.won ? "won_points" : "lost",
            delta: lr.points_awarded ?? undefined,
          });
          setPhase("result");
        }
      } else if (prev?.active_match && !me.active_match) {
        // El match desapareció SIN resultado nuevo ⇒ el juez lo canceló (no es derrota)
        lastMatchRef.current = null;
        if (
          phaseRef.current === "tower" ||
          phaseRef.current === "loading" ||
          phaseRef.current === "versus"
        ) {
          setPhase("idle");
          setBattleStatus("loading");
        }
        setCancelNotice("El combate fue cancelado por el juez");
      }

      if (me.active_match) lastMatchRef.current = me.active_match;
      prevRef.current = me;
      setData(me);
      setLoadError(null);
      setUnauthorized(false);
    } catch {
      if (!prevRef.current) {
        setLoadError("No pudimos cargar tu estado de ascenso");
      }
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  // Refetch suave al volver el foco a la pestaña
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") void fetchMe();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [fetchMe]);

  // Polling liviano cada 30s mientras hay un combate activo
  useEffect(() => {
    if (!data?.active_match) return;
    const id = setInterval(() => void fetchMe(), 30000);
    return () => clearInterval(id);
  }, [data?.active_match, fetchMe]);

  // El aviso de cancelación se esconde solo después de unos segundos
  useEffect(() => {
    if (!cancelNotice) return;
    const id = setTimeout(() => setCancelNotice(null), 6000);
    return () => clearTimeout(id);
  }, [cancelNotice]);

  // Flujo: idle → tower → loading → versus (el resultado lo carga el juez)
  const startBattle = useCallback(() => {
    setCancelNotice(null);
    setPhase("tower");
    setBattleStatus("loading");
  }, []);

  const onTowerComplete = useCallback(() => {
    setPhase("loading");
    setBattleStatus("loading");
    // Breve loading (1s) → CHOQUE (clash). Antes eran 3,5s mostrando solo el logo,
    // lo que hacía sentir que la animación no aparecía. Cancelable: si llega un
    // resultado o el usuario sale, no pisamos la fase actual.
    if (versusTimerRef.current) clearTimeout(versusTimerRef.current);
    versusTimerRef.current = setTimeout(() => {
      versusTimerRef.current = null;
      if (phaseRef.current === "loading") {
        setPhase("clash");
      }
    }, 1000);
  }, []);

  // El choque (clash) terminó → mostramos la pantalla de versus estática
  const onClashComplete = useCallback(() => {
    // Si mientras chocaban ya llegó el resultado, no pisamos esa fase
    if (phaseRef.current === "clash") {
      setPhase("versus");
      setBattleStatus("ready");
    }
  }, []);

  // Limpieza del timer loading → versus al desmontar
  useEffect(() => {
    return () => {
      if (versusTimerRef.current) clearTimeout(versusTimerRef.current);
    };
  }, []);

  // Seguridad: si entramos al choque sin un rival conocido, saltamos al versus
  // (la pantalla de versus tolera la ausencia de rival y no deja la fase trabada)
  const hasOpponentForClash = Boolean(
    data?.active_match?.opponent ?? lastMatchRef.current?.opponent ?? data?.last_result?.opponent
  );
  useEffect(() => {
    if (phase === "clash" && !hasOpponentForClash) {
      setPhase("versus");
      setBattleStatus("ready");
    }
  }, [phase, hasOpponentForClash]);

  // ── Loading inicial (estética del modo) ──
  if (!data && !loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <p className="mt-5 text-cyan-400 text-sm font-mono tracking-[0.3em] animate-pulse">
          CARGANDO
        </p>
      </div>
    );
  }

  // ── Error ──
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex flex-col items-center justify-center px-4">
        <p className="text-white/60 text-sm font-mono text-center">{loadError}</p>
        {unauthorized ? (
          // Sin sesión: reintentar no sirve, va directo al login
          <a
            href="/auth/login"
            data-testid="ascenso-login-btn"
            className="mt-5 px-6 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition"
          >
            Iniciar sesión
          </a>
        ) : (
          <button
            onClick={() => {
              setLoadError(null);
              void fetchMe();
            }}
            data-testid="ascenso-retry-btn"
            className="mt-5 px-6 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  const { player } = data;
  const hasTicket = data.has_ticket;
  const activeMatch = data.active_match;
  // Cola de combate FIFO del rango (incluye al usuario). Vacía = no se muestra.
  const queue = data.queue ?? [];
  // Posición del usuario en la fila (índice + 1); 0 si no está en la cola.
  const myQueuePos = queue.findIndex((q) => q.is_me) + 1;
  const info = rankInfo(player.rank_letter);
  const ticketTarget = data.ticket_target;
  const progressPercent = ticketTarget
    ? Math.min((player.ticket_points / ticketTarget) * 100, 100)
    : 100;

  const lastResult = data.last_result;
  // Match a mostrar en versus/result: el activo, o el último visto si ya se resolvió
  const matchForBattle = activeMatch ?? lastMatchRef.current;
  const playerCharacterId = characterFor(player.id);

  // Rival a mostrar: cuando hay resultado manda el del last_result (es el combate
  // que se resolvió); si no, el del match activo o el último conocido
  const opponentInfo: OpponentDisplay | null =
    (resultInfo && lastResult ? lastResult.opponent : null) ??
    activeMatch?.opponent ??
    lastMatchRef.current?.opponent ??
    lastResult?.opponent ??
    null;

  // Tipo de combate vigente (define los textos de torre y batalla)
  const battleKind: "normal" | "ascension" =
    (resultInfo && lastResult ? lastResult.match_kind : null) ??
    matchForBattle?.match_kind ??
    lastResult?.match_kind ??
    "ascension";

  // Puntos del combate (para el banner de victoria en peleas normales)
  const battlePoints: number | null =
    (resultInfo && lastResult ? lastResult.points_awarded : null) ??
    matchForBattle?.points_awarded ??
    null;

  const battlePlayer: BattlePlayer = {
    id: player.id,
    alias: player.alias,
    avatar_url: player.avatar_url ?? undefined,
    rank: player.rank_letter,
    ticketPoints: player.ticket_points,
    wins: player.wins,
    losses: player.losses,
    characterId: playerCharacterId,
    statusText: hasTicket ? "¡AL MÁXIMO!" : "EN COMBATE",
  };

  const battleOpponent: BattlePlayer | null = opponentInfo
    ? {
        id: opponentInfo.id,
        alias: opponentInfo.alias,
        avatar_url: opponentInfo.avatar_url ?? undefined,
        rank: opponentInfo.rank_letter,
        // El ticket del rival viene directo en active_match.opponent (campo nuevo)
        ticketPoints: opponentInfo.ticket_points ?? undefined,
        characterId: characterFor(opponentInfo.id),
        statusText: "PRÓXIMO COMBATE",
      }
    : null;

  // Ganador a mostrar cuando el combate ya se resolvió
  const battleWinner =
    resultInfo == null
      ? undefined
      : resultInfo.kind === "lost"
        ? opponentInfo?.id
        : player.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Animación de ascenso de rango (fullscreen overlay) */}
      {phase === "rank_up" && rankUp && (
        <RankUpAnimation
          fromRank={rankUp.from}
          toRank={rankUp.to}
          playerAlias={player.alias}
          characterId={playerCharacterId}
          onComplete={() => setPhase("result")}
        />
      )}

      {/* Torre de presentación (fullscreen overlay) */}
      {phase === "tower" && (
        <RankTower
          currentRank={player.rank_letter}
          playerAlias={player.alias}
          ticketPoints={player.ticket_points}
          kind={battleKind}
          onComplete={onTowerComplete}
        />
      )}

      {/* Choque de enfrentamiento (fullscreen overlay) — estilo Beyblade X */}
      {phase === "clash" && battleOpponent && (
        <BattleClash
          player={{
            alias: battlePlayer.alias,
            rank: battlePlayer.rank,
            characterId: battlePlayer.characterId,
          }}
          opponent={{
            alias: battleOpponent.alias,
            rank: battleOpponent.rank,
            characterId: battleOpponent.characterId,
          }}
          kind={battleKind}
          onComplete={onClashComplete}
        />
      )}

      {/* Header */}
      <div className="text-center pt-8 pb-4">
        <h1 className="text-3xl font-black tracking-wider bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          TORNEO DE ASCENSO
        </h1>
        <p className="text-white/40 text-sm mt-1 font-mono">
          Subí de rango derrotando a tus rivales
        </p>
      </div>

      {/* ── IDLE: tu rango + barra de progreso + estado ── */}
      {phase === "idle" && (
        <div className="px-4 mb-8 max-w-md mx-auto">
          {/* Aviso de combate cancelado por el juez (temporal) */}
          {cancelNotice && (
            <div
              data-testid="ascenso-cancel-notice"
              className="mb-4 px-4 py-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-center"
            >
              <p className="text-orange-400 text-sm font-bold">{cancelNotice}</p>
            </div>
          )}

          {/* Card de rango actual */}
          <div className="bg-gradient-to-r from-purple-800/60 to-purple-900/60 rounded-xl p-5 border border-purple-500/30 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-black/40 flex items-center justify-center border border-purple-500/40 shadow-[0_0_20px_rgba(192,132,252,0.3)]">
                <span className="text-4xl font-black text-purple-400">{player.rank_letter}</span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-lg">{player.alias}</div>
                <div className="text-sm text-white/60">Rango {info.name}</div>
                <div className="text-xs text-white/40">{player.wins}W / {player.losses}L</div>
              </div>
            </div>

            {/* Barra de Ticket Points */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Ticket Points</span>
                <span>
                  {player.ticket_points.toLocaleString()}
                  {ticketTarget != null && ` / ${ticketTarget.toLocaleString()}`}
                </span>
              </div>
              <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    hasTicket
                      ? "bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_10px_rgba(253,224,71,0.5)]"
                      : "bg-gradient-to-r from-cyan-500 to-purple-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {hasTicket && (
              <div className="text-center mt-3">
                <span className="text-yellow-400 text-sm font-bold animate-pulse">
                  🎫 TICKET LLENO — {activeMatch ? "¡COMBATE LISTO!" : "esperando combate"}
                </span>
              </div>
            )}
          </div>

          {/* Estado / acción según haya combate armado por el juez */}
          {activeMatch ? (
            <button
              onClick={startBattle}
              data-testid="ascenso-battle-btn"
              className={`w-full px-8 py-4 rounded-xl text-lg font-black tracking-wider transition-all active:scale-95 animate-pulse ${
                activeMatch.match_kind === "ascension"
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 shadow-[0_0_30px_rgba(253,224,71,0.4)] hover:shadow-[0_0_50px_rgba(253,224,71,0.6)]"
                  : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)]"
              }`}
              style={{ animationDuration: "2s" }}
            >
              ⚔️ {activeMatch.match_kind === "ascension" ? "COMBATE DE ASCENSO" : "COMBATE EN CURSO"}
            </button>
          ) : hasTicket ? (
            <div>
              {/* El combate lo arma el juez en el torneo */}
              <div className="w-full px-6 py-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center mb-5">
                <p className="text-yellow-400 font-bold text-sm tracking-wider">
                  🎫 TICKET LLENO — ESPERANDO COMBATE
                </p>
                <p className="text-white/40 text-xs mt-1.5">
                  El juez va a armar tu combate de ascenso en el torneo
                </p>
              </div>

              {/* Cola de combate FIFO — posición del usuario + lista ordenada.
                  No se muestra si la cola viene vacía o el usuario está en rango S
                  (en S nunca hay ticket lleno, así que este branch tampoco corre). */}
              {queue.length > 0 && player.rank_letter !== "S" && (
                <div className="text-left" data-testid="ascenso-queue">
                  {/* Titular con la posición en la fila */}
                  <div className="mb-3 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-center">
                    <p className="text-lg font-black text-cyan-200" data-testid="ascenso-queue-position">
                      {myQueuePos > 0 ? (
                        <>
                          Sos el <span className="text-cyan-400">{myQueuePos}º</span> en la fila
                        </>
                      ) : (
                        "Estás en la fila"
                      )}
                    </p>
                    <p className="text-white/40 text-xs mt-1.5 leading-relaxed">
                      Los combates se arman por <span className="text-white/60">orden de llegada</span>:
                      a medida que cada jugador llena su ticket entra a la cola y se enfrenta cuando
                      es su turno.
                    </p>
                  </div>

                  <p className="text-xs font-mono tracking-[0.2em] text-cyan-400/70 mb-2">
                    COLA DE COMBATE · {queue.length} EN ESPERA
                  </p>
                  <div className="space-y-1.5">
                    {queue.map((q, i) => (
                      <div
                        key={q.id}
                        data-testid={`ascenso-queue-${q.id}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                          q.is_me
                            ? "bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        {/* Posición en la fila */}
                        <span
                          className={`w-6 text-center text-sm font-black shrink-0 ${
                            q.is_me ? "text-cyan-300" : "text-white/40"
                          }`}
                        >
                          {i + 1}º
                        </span>
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                          {q.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={q.avatar_url} alt={q.alias} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-black text-purple-400">
                              {q.alias.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">
                            {q.alias}
                            {q.is_me && (
                              <span className="ml-1.5 align-middle text-[9px] font-black uppercase tracking-wide text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded-full">
                                Vos
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-white/40">
                            {q.ticket_filled_at
                              ? `Ticket lleno · ${new Date(q.ticket_filled_at).toLocaleString("es-AR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : "Ticket lleno"}
                          </p>
                        </div>
                        <span className="text-lg font-black text-purple-400 shrink-0">
                          {q.rank_letter}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white/40 text-sm mb-3">
                Ganá batallas para acumular Ticket Points
              </p>
              <button
                disabled
                className="w-full px-8 py-4 bg-gray-700/50 rounded-xl text-lg font-black tracking-wider text-white/30 cursor-not-allowed"
              >
                {ticketTarget != null
                  ? `FALTAN ${Math.max(ticketTarget - player.ticket_points, 0).toLocaleString()} PUNTOS`
                  : "RANGO MÁXIMO"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LOADING + VERSUS + RESULT: pantalla de combate ── */}
      {(phase === "loading" || phase === "versus" || phase === "result") && (
        <div className="px-4 mb-8">
          {/* La card de batalla solo si conocemos al rival; el resultado se muestra igual */}
          {battleOpponent && (
            <BattleScreen
              player={battlePlayer}
              opponent={battleOpponent}
              status={battleStatus}
              winner={battleWinner}
              kind={battleKind}
              pointsAwarded={battlePoints}
            />
          )}

          {/* En versus/loading, el resultado lo carga el juez — siempre con salida */}
          {(phase === "versus" || phase === "loading") && (
            <div className="text-center mt-4">
              {phase === "versus" && (
                <p className="text-white/40 text-xs font-mono tracking-[0.2em] animate-pulse">
                  EL JUEZ CARGA EL RESULTADO AL TERMINAR
                </p>
              )}
              <button
                onClick={() => {
                  // Salida segura: el combate sigue armado y el resultado llega igual
                  setPhase("idle");
                  setBattleStatus("loading");
                }}
                data-testid="ascenso-exit-btn"
                className="mt-3 px-5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white/50 hover:bg-white/10 hover:text-white/80 transition"
              >
                Volver
              </button>
            </div>
          )}

          {/* Resultado */}
          {phase === "result" && resultInfo && (
            <div className="text-center mt-4">
              {resultInfo.kind === "rank_up" && rankUp ? (
                <div>
                  <p className="text-yellow-400 font-bold text-lg mb-3">
                    🎉 ¡ASCENSO AL RANGO {rankUp.to}!
                  </p>
                  <p className="text-white/50 text-sm mb-4">
                    Tu nuevo rango: {rankInfo(rankUp.to).name}
                  </p>
                  {/* Compartir en WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `⚔️ *COMBATE DE ASCENSO* ⚔️\n\n${player.alias} venció a ${opponentInfo?.alias ?? "su rival"} y ascendió al *Rango ${rankUp.to} (${rankInfo(rankUp.to).name})*!\n\n🏆 Bladers Santa Fe — Torneo de Ascenso\n👉 https://bladers-sf.vercel.app/ascenso`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 rounded-xl text-sm font-bold hover:bg-green-500 transition shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  >
                    📱 Compartir en WhatsApp
                  </a>
                </div>
              ) : resultInfo.kind === "won_points" ? (
                <div>
                  <p className="text-yellow-400 font-bold text-lg mb-3">🏆 ¡VICTORIA!</p>
                  <p className="text-white/50 text-sm">
                    Sumaste{" "}
                    <span className="text-cyan-400 font-bold">
                      +{(resultInfo.delta ?? 0).toLocaleString()}
                    </span>{" "}
                    Ticket Points
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-red-400 font-bold text-lg mb-3">
                    {(resultInfo.delta ?? 0) < 0 ? "Ticket Points reiniciados" : "Derrota"}
                  </p>
                  <p className="text-white/50 text-sm">
                    Mantenés tu rango {info.name}. ¡Seguí peleando!
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  // Marcamos el resultado como visto para no repetirlo en próximas cargas
                  const seenId = lastResult?.match_id ?? shownResultIdRef.current;
                  if (seenId) markResultSeen(seenId);
                  setPhase("idle");
                  setResultInfo(null);
                  setRankUp(null);
                  setBattleStatus("loading");
                }}
                data-testid="ascenso-back-btn"
                className="mt-4 px-6 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition"
              >
                Volver
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
