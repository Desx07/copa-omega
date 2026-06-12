"use client";

import { useState, useCallback } from "react";
import BattleScreen from "./_components/battle-card";
import RankTower from "./_components/rank-tower";
import RankUpAnimation from "./_components/rank-up-animation";

// ── Rangos y puntos necesarios (basado en Pokémon Z-A) ──
const RANK_CONFIG = [
  { letter: "S", name: "Omega", points: 0, color: "yellow" },
  { letter: "A", name: "Diamante", points: 45000, color: "amber" },
  { letter: "B", name: "Oro", points: 38000, color: "red" },
  { letter: "C", name: "Plata", points: 30000, color: "purple" },
  { letter: "D", name: "Bronce", points: 20000, color: "blue" },
  { letter: "E", name: "Hierro", points: 10000, color: "green" },
  { letter: "F", name: "Novato", points: 1000, color: "gray" },
];

// Datos de prueba
const MOCK_PLAYER = {
  id: "player-1",
  alias: "Desx07",
  rank: "C",
  stars: 35,
  wins: 28,
  losses: 12,
  beyImage: "dransword",
  beyName: "Dran Sword",
  characterId: "00",
  ticketPoints: 28500, // puntos acumulados
  ticketMax: 30000, // puntos necesarios para el ticket
  hasTicket: false, // se pone true cuando llega al máximo
  statusText: "¡AL MÁXIMO!",
};

const MOCK_OPPONENT = {
  id: "player-2",
  alias: "ShadowBurst",
  rank: "C", // mismo rango que el jugador
  stars: 33,
  wins: 25,
  losses: 15,
  beyImage: "hellsscythe",
  beyName: "Hell's Scythe",
  characterId: "05",
  statusText: "PRÓXIMO COMBATE",
};

type GamePhase = "idle" | "tower" | "loading" | "versus" | "rank_up" | "result";

export default function AscensoPage() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [battleStatus, setBattleStatus] = useState<
    "loading" | "reveal" | "ready" | "in_progress" | "completed"
  >("loading");
  const [winner, setWinner] = useState<string | undefined>();
  const [ticketPoints, setTicketPoints] = useState(MOCK_PLAYER.ticketPoints);
  const hasTicket = ticketPoints >= MOCK_PLAYER.ticketMax;

  // Flujo: idle → tower → loading → versus → result
  const startBattle = useCallback(() => {
    setPhase("tower");
    setWinner(undefined);
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

  const handleVictory = () => {
    setBattleStatus("completed");
    setWinner(MOCK_PLAYER.id);
    // Mostrar animación de ascenso antes del resultado
    setTimeout(() => setPhase("rank_up"), 2000);
  };

  const handleDefeat = () => {
    setBattleStatus("completed");
    setWinner(MOCK_OPPONENT.id);
    setTicketPoints(0); // pierde puntos pero mantiene rango
    setPhase("result");
  };

  const rankConfig = RANK_CONFIG.find(r => r.letter === MOCK_PLAYER.rank);
  const progressPercent = Math.min((ticketPoints / MOCK_PLAYER.ticketMax) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Animación de ascenso de rango (fullscreen overlay) */}
      {phase === "rank_up" && (
        <RankUpAnimation
          fromRank={MOCK_PLAYER.rank}
          toRank="B"
          playerAlias={MOCK_PLAYER.alias}
          characterId={MOCK_PLAYER.characterId}
          onComplete={() => setPhase("result")}
        />
      )}

      {/* Torre de presentación (fullscreen overlay) */}
      {phase === "tower" && (
        <RankTower
          currentRank={MOCK_PLAYER.rank}
          playerAlias={MOCK_PLAYER.alias}
          stars={MOCK_PLAYER.stars}
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

      {/* ── IDLE: tu rango + barra de progreso + botón ── */}
      {phase === "idle" && (
        <div className="px-4 mb-8 max-w-md mx-auto">
          {/* Card de rango actual */}
          <div className="bg-gradient-to-r from-purple-800/60 to-purple-900/60 rounded-xl p-5 border border-purple-500/30 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-black/40 flex items-center justify-center border border-purple-500/40 shadow-[0_0_20px_rgba(192,132,252,0.3)]">
                <span className="text-4xl font-black text-purple-400">{MOCK_PLAYER.rank}</span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-lg">{MOCK_PLAYER.alias}</div>
                <div className="text-sm text-white/60">Rango {rankConfig?.name} · ⭐ {MOCK_PLAYER.stars}</div>
                <div className="text-xs text-white/40">{MOCK_PLAYER.wins}W / {MOCK_PLAYER.losses}L</div>
              </div>
            </div>

            {/* Barra de Ticket Points */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Ticket Points</span>
                <span>{ticketPoints.toLocaleString()} / {MOCK_PLAYER.ticketMax.toLocaleString()}</span>
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
                  🎫 ¡CHALLENGER&apos;S TICKET CONSEGUIDO!
                </span>
              </div>
            )}
          </div>

          {/* Botón */}
          {hasTicket ? (
            <button
              onClick={startBattle}
              className="w-full px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl text-lg font-black
                tracking-wider hover:from-yellow-400 hover:to-amber-500 transition-all
                shadow-[0_0_30px_rgba(253,224,71,0.4)] hover:shadow-[0_0_50px_rgba(253,224,71,0.6)]
                active:scale-95 animate-pulse"
              style={{ animationDuration: "2s" }}
            >
              ⚔️ COMBATE DE ASCENSO
            </button>
          ) : (
            <div className="text-center">
              <p className="text-white/40 text-sm mb-3">
                Ganá batallas para acumular Ticket Points
              </p>
              <button
                disabled
                className="w-full px-8 py-4 bg-gray-700/50 rounded-xl text-lg font-black tracking-wider text-white/30 cursor-not-allowed"
              >
                FALTAN {(MOCK_PLAYER.ticketMax - ticketPoints).toLocaleString()} PUNTOS
              </button>
            </div>
          )}

          {/* Demo: simular ganar puntos */}
          <button
            onClick={() => setTicketPoints(prev => Math.min(prev + 5000, MOCK_PLAYER.ticketMax))}
            className="w-full mt-3 px-4 py-2 bg-white/5 rounded-lg text-xs text-white/30 hover:bg-white/10 transition"
          >
            [Demo] +5000 puntos
          </button>
        </div>
      )}

      {/* ── LOADING + VERSUS: pantalla de combate ── */}
      {(phase === "loading" || phase === "versus" || phase === "result") && (
        <div className="px-4 mb-8">
          <BattleScreen
            player={MOCK_PLAYER}
            opponent={MOCK_OPPONENT}
            status={battleStatus}
            winner={winner}
          />

          {/* Botones SOLO después del versus, no durante loading */}
          {phase === "versus" && (
            <div className="flex gap-2 justify-center mt-4">
              <button onClick={handleVictory}
                className="px-6 py-2 bg-green-600 rounded-lg text-sm font-bold hover:bg-green-500 transition">
                Victoria
              </button>
              <button onClick={handleDefeat}
                className="px-6 py-2 bg-red-600 rounded-lg text-sm font-bold hover:bg-red-500 transition">
                Derrota
              </button>
            </div>
          )}

          {/* Resultado */}
          {phase === "result" && (
            <div className="text-center mt-4">
              {winner === MOCK_PLAYER.id ? (
                <div>
                  <p className="text-yellow-400 font-bold text-lg mb-3">🎉 ¡ASCENSO AL RANGO B!</p>
                  <p className="text-white/50 text-sm mb-4">Tu nuevo rango: Oro</p>
                  {/* Compartir en WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `⚔️ *COMBATE DE ASCENSO* ⚔️\n\n${MOCK_PLAYER.alias} venció a ${MOCK_OPPONENT.alias} y ascendió al *Rango B (Oro)*!\n\n🏆 Bladers Santa Fe — Torneo de Ascenso\n👉 https://bladers-sf.vercel.app/ascenso`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 rounded-xl text-sm font-bold hover:bg-green-500 transition shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  >
                    📱 Compartir en WhatsApp
                  </a>
                </div>
              ) : (
                <div>
                  <p className="text-red-400 font-bold text-lg mb-3">Ticket Points reiniciados</p>
                  <p className="text-white/50 text-sm">Mantenés tu rango {rankConfig?.name}. ¡Seguí peleando!</p>
                </div>
              )}
              <button
                onClick={() => { setPhase("idle"); setWinner(undefined); }}
                className="mt-4 px-6 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition">
                Volver
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
