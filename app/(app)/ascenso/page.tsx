"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Ticket, Swords, Trophy, ChevronsUp, Share2, Lock, Users } from "lucide-react";
import BattleScreen, { type BattlePlayer } from "./_components/battle-card";
import BattleClash from "./_components/battle-clash";
import RankTower from "./_components/rank-tower";
import RankUpAnimation from "./_components/rank-up-animation";
import {
  AscensoBackground,
  AscensoKicker,
  AscensoPanel,
  RankSeal,
  RANK_HEX,
  ASCENSO_CTA_CLASS,
  ASCENSO_TEXT_GRADIENT,
  ASCENSO_TEXT_GRADIENT_GOLD,
} from "./_components/ascenso-ui";
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

  // ── Loading inicial (estética del modo: estadio + spinner cian) ──
  if (!data && !loadError) {
    return (
      <div className="relative min-h-screen text-white flex flex-col items-center justify-center">
        <AscensoBackground />
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <p className="mt-5 text-cyan-300 text-sm font-mono tracking-[0.3em] animate-pulse">
          CARGANDO
        </p>
      </div>
    );
  }

  // ── Error (mismo fondo de estadio para no romper la coherencia) ──
  if (!data) {
    return (
      <div className="relative min-h-screen text-white flex flex-col items-center justify-center px-4">
        <AscensoBackground />
        <p className="text-white/60 text-sm font-mono text-center">{loadError}</p>
        {unauthorized ? (
          // Sin sesión: reintentar no sirve, va directo al login
          <a
            href="/auth/login"
            data-testid="ascenso-login-btn"
            className="mt-5 px-6 py-2 bg-white/10 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition"
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
            className="mt-5 px-6 py-2 bg-white/10 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition"
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
    <div className="relative min-h-screen text-white">
      {/* Fondo tipo estadio (mismo de la landing aprobada): /stadium.png sobre #05070d */}
      <AscensoBackground />

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

      {/* Header — kicker + título black uppercase con gradiente cian→ámbar (landing) */}
      <div className="text-center px-4 pt-8 pb-5">
        <AscensoKicker left="cyan" right="amber">
          Bladers Santa Fe · torneo de ascenso
        </AscensoKicker>
        <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-tight md:text-5xl">
          <span className="text-white/95">Torneo </span>
          <span className={ASCENSO_TEXT_GRADIENT}>de Ascenso</span>
        </h1>
        <p className="mt-2 text-sm text-white/45">
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
              className="mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-amber-400/10 border border-amber-400/30 rounded-xl text-center backdrop-blur-sm"
            >
              <Swords className="size-4 text-amber-300 shrink-0" />
              <p className="text-amber-200 text-sm font-bold">{cancelNotice}</p>
            </div>
          )}

          {/* Card de rango actual — panel translúcido + sello hexagonal (landing) */}
          <AscensoPanel className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Sello hexagonal del rango (latido = tu rango activo) */}
              <RankSeal letter={player.rank_letter} size="md" pulse />
              <div className="flex-1 text-left">
                <div className="text-lg font-black uppercase tracking-wide">{player.alias}</div>
                <div className="text-sm text-white/60">Rango {info.name}</div>
                <div className="text-xs font-mono text-white/40">
                  {player.wins}W · {player.losses}L
                </div>
              </div>
            </div>

            {/* Barra de Ticket Points — cian (en progreso) / ámbar (lleno) */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-white/50">
                <span className="flex items-center gap-1.5">
                  <Ticket className="size-3.5 text-cyan-300/80" /> Ticket Points
                </span>
                <span className="tabular-nums text-white/70">
                  {player.ticket_points.toLocaleString()}
                  {ticketTarget != null && ` / ${ticketTarget.toLocaleString()}`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    hasTicket
                      ? "bg-gradient-to-r from-amber-300 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                      : "bg-gradient-to-r from-cyan-400 to-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {hasTicket && (
              <div className="mt-3 flex items-center justify-center gap-2 text-amber-300 text-xs font-black uppercase tracking-widest">
                <Ticket className="size-4 animate-pulse" />
                <span>Ticket lleno — {activeMatch ? "¡combate listo!" : "esperando combate"}</span>
              </div>
            )}
          </AscensoPanel>

          {/* Estado / acción según haya combate armado por el juez */}
          {activeMatch ? (
            <button
              onClick={startBattle}
              data-testid="ascenso-battle-btn"
              className={`${ASCENSO_CTA_CLASS} w-full animate-pulse`}
              style={{ animationDuration: "2s" }}
            >
              <Swords className="size-5" />
              {activeMatch.match_kind === "ascension" ? "COMBATE DE ASCENSO" : "COMBATE EN CURSO"}
            </button>
          ) : hasTicket ? (
            <div>
              {/* El combate lo arma el juez en el torneo */}
              <AscensoPanel className="mb-5 border-amber-400/25 bg-amber-400/[0.06] text-center">
                <p className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm uppercase tracking-widest">
                  <Ticket className="size-4" /> Ticket lleno — esperando combate
                </p>
                <p className="text-white/45 text-xs mt-1.5">
                  El juez va a armar tu combate de ascenso en el torneo
                </p>
              </AscensoPanel>

              {/* Cola de combate FIFO — posición del usuario + lista ordenada.
                  No se muestra si la cola viene vacía o el usuario está en rango S
                  (en S nunca hay ticket lleno, así que este branch tampoco corre). */}
              {queue.length > 0 && player.rank_letter !== "S" && (
                <div className="text-left" data-testid="ascenso-queue">
                  {/* Titular con la posición en la fila */}
                  <AscensoPanel className="mb-3 border-cyan-400/25 bg-cyan-400/[0.06] text-center">
                    <p className="text-lg font-black" data-testid="ascenso-queue-position">
                      {myQueuePos > 0 ? (
                        <>
                          Sos el{" "}
                          <span className={`inline-block ${ASCENSO_TEXT_GRADIENT}`}>{myQueuePos}º</span>{" "}
                          en la fila
                        </>
                      ) : (
                        "Estás en la fila"
                      )}
                    </p>
                    <p className="text-white/45 text-xs mt-1.5 leading-relaxed">
                      Los combates se arman por <span className="text-white/65">orden de llegada</span>:
                      a medida que cada jugador llena su ticket entra a la cola y se enfrenta cuando
                      es su turno.
                    </p>
                  </AscensoPanel>

                  <p className="mb-2 flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.2em] text-cyan-300/70">
                    <Users className="size-3.5" /> Cola de combate · {queue.length} en espera
                  </p>
                  <div className="space-y-1.5">
                    {queue.map((q, i) => (
                      <div
                        key={q.id}
                        data-testid={`ascenso-queue-${q.id}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border backdrop-blur-sm ${
                          q.is_me
                            ? "bg-cyan-400/15 border-cyan-400/50 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                            : "bg-white/[0.03] border-white/10"
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
                            <span
                              className="text-sm font-black"
                              style={{ color: RANK_HEX[q.rank_letter] }}
                            >
                              {q.alias.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">
                            {q.alias}
                            {q.is_me && (
                              <span className="ml-1.5 align-middle text-[9px] font-black uppercase tracking-wide text-cyan-300 bg-cyan-400/20 px-1.5 py-0.5 rounded-full">
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
                        {/* Letra de rango con el color hex de la sección (RANK_HEX) */}
                        <span
                          className="text-lg font-black shrink-0"
                          style={{ color: RANK_HEX[q.rank_letter] }}
                        >
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
              <p className="text-white/45 text-sm mb-3">
                Ganá batallas para acumular Ticket Points
              </p>
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-white/10 bg-white/[0.03] text-lg font-black uppercase tracking-widest text-white/35 cursor-not-allowed backdrop-blur-sm"
              >
                {ticketTarget != null ? (
                  <>
                    <Lock className="size-4" />
                    Faltan {Math.max(ticketTarget - player.ticket_points, 0).toLocaleString()} puntos
                  </>
                ) : (
                  <>
                    <Trophy className="size-4 text-amber-300/60" />
                    Rango máximo
                  </>
                )}
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
                <div className="flex flex-col items-center">
                  {/* Sello hexagonal del rango alcanzado */}
                  <RankSeal letter={rankUp.to} caption={rankInfo(rankUp.to).name} size="lg" pulse />
                  <p className="mt-3 flex items-center justify-center gap-2 text-lg font-black uppercase tracking-wide">
                    <ChevronsUp className="size-5 text-amber-300" />
                    <span className={ASCENSO_TEXT_GRADIENT_GOLD}>¡Ascenso al rango {rankUp.to}!</span>
                  </p>
                  <p className="text-white/50 text-sm mb-4">
                    Tu nuevo rango: {rankInfo(rankUp.to).name}
                  </p>
                  {/* Compartir en WhatsApp (verde de marca; el mensaje lleva emojis, la UI no) */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `⚔️ *COMBATE DE ASCENSO* ⚔️\n\n${player.alias} venció a ${opponentInfo?.alias ?? "su rival"} y ascendió al *Rango ${rankUp.to} (${rankInfo(rankUp.to).name})*!\n\n🏆 Bladers Santa Fe — Torneo de Ascenso\n👉 https://bladers-sf.vercel.app/ascenso`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 rounded-lg text-sm font-bold hover:bg-green-500 transition shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  >
                    <Share2 className="size-4" /> Compartir en WhatsApp
                  </a>
                </div>
              ) : resultInfo.kind === "won_points" ? (
                <div className="flex flex-col items-center">
                  <p className="flex items-center justify-center gap-2 text-lg font-black uppercase tracking-wide mb-2">
                    <Trophy className="size-5 text-amber-300" />
                    <span className={ASCENSO_TEXT_GRADIENT}>¡Victoria!</span>
                  </p>
                  <p className="text-white/50 text-sm">
                    Sumaste{" "}
                    <span className="text-cyan-300 font-black">
                      +{(resultInfo.delta ?? 0).toLocaleString()}
                    </span>{" "}
                    Ticket Points
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-red-400 font-black text-lg uppercase tracking-wide mb-2">
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
                className="mt-5 px-6 py-2 bg-white/10 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition"
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
