"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import BattleScreen, { type BattlePlayer } from "./_components/battle-card";
import RankTower from "./_components/rank-tower";
import RankUpAnimation from "./_components/rank-up-animation";
import { RANKS, rankInfo, type RankLetter } from "@/lib/ascenso";

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

interface MeActiveMatch {
  id: string;
  match_kind: "normal" | "ascension";
  points_awarded: number | null;
  opponent: {
    id: string;
    alias: string;
    avatar_url: string | null;
    rank_letter: RankLetter;
  };
}

interface AscensoMe {
  player: MePlayer;
  ticket_target: number | null;
  has_ticket: boolean;
  eligible_opponents: MeOpponent[];
  active_match: MeActiveMatch | null;
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

// Posición del rango en la escalera F→S (mayor índice = rango más alto)
function rankIndexOf(letter: RankLetter): number {
  return RANKS.findIndex((r) => r.letter === letter);
}

type GamePhase = "idle" | "tower" | "loading" | "versus" | "rank_up" | "result";

// Resultado del último combate resuelto (se infiere del refetch)
interface ResultInfo {
  kind: "rank_up" | "won_points" | "lost";
  delta?: number;
}

export default function AscensoPage() {
  const [data, setData] = useState<AscensoMe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [battleStatus, setBattleStatus] = useState<
    "loading" | "reveal" | "ready" | "in_progress" | "completed"
  >("loading");
  const [rankUp, setRankUp] = useState<{ from: RankLetter; to: RankLetter } | null>(null);
  const [resultInfo, setResultInfo] = useState<ResultInfo | null>(null);

  // Refs para usar el estado actual dentro del fetch sin re-crear callbacks
  const prevRef = useRef<AscensoMe | null>(null);
  const phaseRef = useRef<GamePhase>("idle");
  // Guardamos el último match activo para seguir mostrando el versus/resultado
  // cuando el juez ya lo resolvió y desaparece de la API
  const lastMatchRef = useRef<MeActiveMatch | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ── Fetch del estado real del jugador ──
  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/ascenso/me", { cache: "no-store" });
      if (!res.ok) {
        if (!prevRef.current) {
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

      if (prev) {
        const prevIdx = rankIndexOf(prev.player.rank_letter);
        const newIdx = rankIndexOf(me.player.rank_letter);

        if (newIdx > prevIdx) {
          // El juez resolvió a favor: ¡ascenso de rango!
          setRankUp({ from: prev.player.rank_letter, to: me.player.rank_letter });
          setResultInfo({ kind: "rank_up" });
          setBattleStatus("completed");
          setPhase("rank_up");
        } else if (
          prev.active_match &&
          !me.active_match &&
          (phaseRef.current === "versus" ||
            phaseRef.current === "loading" ||
            phaseRef.current === "tower")
        ) {
          // El combate que estaba mirando se resolvió sin ascenso
          const delta = me.player.ticket_points - prev.player.ticket_points;
          setResultInfo({ kind: delta > 0 ? "won_points" : "lost", delta });
          setBattleStatus("completed");
          setPhase("result");
        }
      }

      if (me.active_match) lastMatchRef.current = me.active_match;
      prevRef.current = me;
      setData(me);
      setLoadError(null);
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

  // Flujo: idle → tower → loading → versus (el resultado lo carga el juez)
  const startBattle = useCallback(() => {
    setPhase("tower");
    setBattleStatus("loading");
  }, []);

  const onTowerComplete = useCallback(() => {
    setPhase("loading");
    setBattleStatus("loading");
    // Loading 3s → reveal oponente → versus
    setTimeout(() => {
      setPhase("versus");
      setBattleStatus("ready");
    }, 3500);
  }, []);

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
      </div>
    );
  }

  const { player, eligible_opponents: eligibleOpponents } = data;
  const hasTicket = data.has_ticket;
  const activeMatch = data.active_match;
  const info = rankInfo(player.rank_letter);
  const ticketTarget = data.ticket_target;
  const progressPercent = ticketTarget
    ? Math.min((player.ticket_points / ticketTarget) * 100, 100)
    : 100;

  // Match a mostrar en versus/result: el activo, o el último visto si ya se resolvió
  const matchForBattle = activeMatch ?? lastMatchRef.current;
  const playerCharacterId = characterFor(player.id);

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

  const battleOpponent: BattlePlayer | null = matchForBattle
    ? {
        id: matchForBattle.opponent.id,
        alias: matchForBattle.opponent.alias,
        avatar_url: matchForBattle.opponent.avatar_url ?? undefined,
        rank: matchForBattle.opponent.rank_letter,
        ticketPoints: eligibleOpponents.find((o) => o.id === matchForBattle.opponent.id)
          ?.ticket_points,
        characterId: characterFor(matchForBattle.opponent.id),
        statusText: "PRÓXIMO COMBATE",
      }
    : null;

  // Ganador a mostrar cuando el combate ya se resolvió
  const battleWinner =
    resultInfo == null
      ? undefined
      : resultInfo.kind === "lost"
        ? matchForBattle?.opponent.id
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
          onComplete={onTowerComplete}
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

              {/* Rivales con ticket lleno */}
              <div className="text-left">
                <p className="text-xs font-mono tracking-[0.2em] text-cyan-400/70 mb-2">
                  RIVALES CON TICKET LLENO
                </p>
                {eligibleOpponents.length === 0 ? (
                  <p className="text-white/30 text-xs py-3 text-center bg-white/5 rounded-lg">
                    Todavía no hay rivales con ticket lleno
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {eligibleOpponents.map((op) => (
                      <div
                        key={op.id}
                        className="flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded-lg"
                        data-testid={`ascenso-rival-${op.id}`}
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                          {op.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={op.avatar_url} alt={op.alias} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-black text-purple-400">
                              {op.alias.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{op.alias}</p>
                          <p className="text-[10px] text-white/40">
                            🎫 {op.ticket_points.toLocaleString()} pts
                          </p>
                        </div>
                        <span className="text-lg font-black text-purple-400 shrink-0">
                          {op.rank_letter}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
      {(phase === "loading" || phase === "versus" || phase === "result") && battleOpponent && (
        <div className="px-4 mb-8">
          <BattleScreen
            player={battlePlayer}
            opponent={battleOpponent}
            status={battleStatus}
            winner={battleWinner}
          />

          {/* En versus, el resultado lo carga el juez — acá solo se espera */}
          {phase === "versus" && (
            <p className="text-center mt-4 text-white/40 text-xs font-mono tracking-[0.2em] animate-pulse">
              EL JUEZ CARGA EL RESULTADO AL TERMINAR
            </p>
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
                      `⚔️ *COMBATE DE ASCENSO* ⚔️\n\n${player.alias} venció a ${matchForBattle?.opponent.alias ?? "su rival"} y ascendió al *Rango ${rankUp.to} (${rankInfo(rankUp.to).name})*!\n\n🏆 Bladers Santa Fe — Torneo de Ascenso\n👉 https://bladers-sf.vercel.app/ascenso`
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
