"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Swords, RotateCcw, Home, Zap, Trophy, X } from "lucide-react";
import {
  BeyArenaGame,
  COLORS,
  type GamePhase,
  type GameResult,
  type GameMode,
} from "./_components/game-engine";

// ═══════════════════════════════════════════════════════════════
// BeyArena — Minijuego pixel art de batallas de beyblades
// ═══════════════════════════════════════════════════════════════

export default function BeyArenaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<BeyArenaGame | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [result, setResult] = useState<GameResult | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // ── Inicializar el juego ──────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    if (!container) return;

    // Determinar tamanio del canvas
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height, 600);
      canvas.width = size;
      canvas.height = size;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      if (gameRef.current) {
        gameRef.current.resize(size, size);
      }
    };

    updateSize();

    // Crear instancia del juego
    const game = new BeyArenaGame(canvas);
    game.setCallbacks(setPhase, setResult);
    game.start();
    gameRef.current = game;

    // Detectar mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();

    // Listeners de teclado
    const onKeyDown = (e: KeyboardEvent) => game.handleKeyDown(e);
    const onKeyUp = (e: KeyboardEvent) => game.handleKeyUp(e);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Listeners de touch
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      game.handleTouchStart(touch.clientX, touch.clientY, canvas.getBoundingClientRect());
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      game.handleTouchMove(touch.clientX, touch.clientY, canvas.getBoundingClientRect());
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      game.handleTouchEnd();
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    // Resize listener
    const onResize = () => {
      updateSize();
      checkMobile();
    };
    window.addEventListener("resize", onResize);

    return () => {
      game.stop();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ── Acciones ──────────────────────────────────────────────

  const startGame = useCallback((mode: GameMode) => {
    gameRef.current?.startGame(mode);
  }, []);

  const returnToMenu = useCallback(() => {
    gameRef.current?.returnToMenu();
  }, []);

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-omega-border/30">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-omega-muted hover:text-omega-text transition-colors"
        >
          <ArrowLeft className="size-5" />
          <span className="text-sm font-bold">Volver</span>
        </Link>
        <div className="flex items-center gap-2">
          <Gamepad2 className="size-5 text-omega-purple" />
          <h1
            className="text-lg font-black tracking-wider"
            style={{
              background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.blue})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            BEYARENA
          </h1>
        </div>
        <button
          onClick={() => setShowControls(!showControls)}
          className="text-omega-muted hover:text-omega-text transition-colors text-xs font-bold uppercase"
        >
          {showControls ? <X className="size-5" /> : "?"}
        </button>
      </header>

      {/* Controles info overlay */}
      {showControls && (
        <div className="absolute inset-0 z-50 bg-omega-black/90 flex items-center justify-center p-6">
          <div className="omega-card p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-omega-text">Controles</h2>
              <button
                onClick={() => setShowControls(false)}
                className="text-omega-muted hover:text-omega-text"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="omega-badge omega-badge-purple px-2 py-1 text-xs font-mono">
                  WASD / Flechas
                </div>
                <span className="text-omega-muted">Mover tu beyblade</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="omega-badge omega-badge-gold px-2 py-1 text-xs font-mono">
                  ESPACIO
                </div>
                <span className="text-omega-muted">X-Dash (cuesta stamina)</span>
              </div>
              <div className="energy-line my-3" />
              <p className="text-omega-muted text-xs leading-relaxed">
                Tu beyblade pierde stamina con el tiempo. Chocá al oponente para
                sacarlo del estadio o quedate con mas stamina cuando ambos se
                detengan. El <span className="text-omega-gold font-bold">X-Dash</span> te
                impulsa hacia el centro del rail con un boost de velocidad.
              </p>
              {isMobile && (
                <>
                  <div className="energy-line my-3" />
                  <p className="text-omega-blue text-xs font-bold">
                    Mobile: Tocá la mitad izquierda para mover, mitad derecha inferior para X-Dash.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Arena principal */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 py-4">
        {/* Canvas container */}
        <div
          ref={containerRef}
          className="relative w-full max-w-[600px] aspect-square flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            className="rounded-xl border-2 border-omega-border/30"
            style={{ imageRendering: "pixelated" }}
          />

          {/* ── MENU OVERLAY ── */}
          {phase === "menu" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-omega-black/70 rounded-xl z-10">
              {/* Logo */}
              <div className="mb-8 text-center">
                <h2
                  className="text-4xl sm:text-5xl font-black tracking-widest mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.blue})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "none",
                  }}
                >
                  BEYARENA
                </h2>
                <p className="text-omega-muted text-xs tracking-[0.3em] uppercase">
                  Pixel Beyblade Battle
                </p>
                <div className="energy-line mt-4 mx-auto w-48" />
              </div>

              {/* Botones de modo */}
              <div className="space-y-3 w-full max-w-[240px]">
                <button
                  onClick={() => startGame("practice")}
                  className="omega-btn omega-btn-purple w-full py-3 text-sm"
                >
                  <Swords className="size-5" />
                  Practica vs CPU
                </button>
                <button
                  disabled
                  className="omega-btn omega-btn-secondary w-full py-3 text-sm opacity-50 cursor-not-allowed"
                  title="Proximamente"
                >
                  <Zap className="size-5" />
                  Reto Rapido (pronto)
                </button>
              </div>

              {/* Controles hint */}
              <div className="mt-8 text-center">
                <p className="text-omega-muted text-[10px] uppercase tracking-widest mb-1">
                  Controles
                </p>
                <p className="text-omega-text text-xs">
                  {isMobile ? "Tocá para mover | Zona derecha = Dash" : "WASD / Flechas = Mover | ESPACIO = X-Dash"}
                </p>
              </div>
            </div>
          )}

          {/* ── RESULT OVERLAY ── */}
          {phase === "result" && result && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-omega-black/80 rounded-xl z-10">
              {/* Resultado */}
              <div className="mb-6 text-center">
                {result.winner === "player" ? (
                  <>
                    <Trophy className="size-12 text-omega-gold mx-auto mb-3 animate-float" />
                    <h2
                      className="text-3xl sm:text-4xl font-black mb-1"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.gold}, #ffa500)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      VICTORIA!
                    </h2>
                  </>
                ) : result.winner === "opponent" ? (
                  <>
                    <X className="size-12 text-omega-red mx-auto mb-3" />
                    <h2 className="text-3xl sm:text-4xl font-black text-omega-red mb-1">
                      DERROTA
                    </h2>
                  </>
                ) : (
                  <>
                    <Swords className="size-12 text-omega-muted mx-auto mb-3" />
                    <h2 className="text-3xl sm:text-4xl font-black text-omega-muted mb-1">
                      EMPATE
                    </h2>
                  </>
                )}

                {/* Razon */}
                <p className="text-omega-muted text-xs uppercase tracking-widest">
                  {result.reason === "knockout"
                    ? "Knockout — Fuera del estadio!"
                    : result.reason === "stamina"
                      ? "Fin de stamina"
                      : "Tiempo agotado"}
                </p>
              </div>

              {/* Stats */}
              <div className="omega-card p-4 mb-6 w-full max-w-[240px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-omega-blue">TU</span>
                  <span className="text-xs font-bold text-omega-red">CPU</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-omega-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-omega-blue rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, result.playerStamina)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-omega-muted font-mono w-8 text-center">
                    {Math.floor(result.playerStamina)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-omega-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-omega-red rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, result.opponentStamina)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-omega-muted font-mono w-8 text-center">
                    {Math.floor(result.opponentStamina)}%
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="space-y-2 w-full max-w-[240px]">
                <button
                  onClick={() => startGame("practice")}
                  className="omega-btn omega-btn-purple w-full py-3 text-sm"
                >
                  <RotateCcw className="size-4" />
                  Revancha
                </button>
                <button
                  onClick={returnToMenu}
                  className="omega-btn omega-btn-secondary w-full py-2.5 text-sm"
                >
                  <Home className="size-4" />
                  Menu
                </button>
              </div>
            </div>
          )}

          {/* ── Mobile touch controls overlay ── */}
          {isMobile && phase === "playing" && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* D-pad visual hint (izquierda abajo) */}
              <div className="absolute bottom-4 left-4 opacity-30">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  {/* Arriba */}
                  <rect x="28" y="4" width="24" height="24" rx="4" fill={COLORS.muted} />
                  <path d="M40 10 L34 22 L46 22 Z" fill={COLORS.text} />
                  {/* Abajo */}
                  <rect x="28" y="52" width="24" height="24" rx="4" fill={COLORS.muted} />
                  <path d="M40 70 L34 58 L46 58 Z" fill={COLORS.text} />
                  {/* Izquierda */}
                  <rect x="4" y="28" width="24" height="24" rx="4" fill={COLORS.muted} />
                  <path d="M10 40 L22 34 L22 46 Z" fill={COLORS.text} />
                  {/* Derecha */}
                  <rect x="52" y="28" width="24" height="24" rx="4" fill={COLORS.muted} />
                  <path d="M70 40 L58 34 L58 46 Z" fill={COLORS.text} />
                </svg>
              </div>

              {/* Dash button visual hint (derecha abajo) */}
              <div className="absolute bottom-4 right-4 opacity-30">
                <div className="w-16 h-16 rounded-full border-2 border-omega-gold/60 flex items-center justify-center">
                  <span
                    className="text-xs font-black"
                    style={{ color: COLORS.gold }}
                  >
                    DASH
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timer durante el juego */}
        {phase === "playing" && (
          <div className="mt-3 text-center">
            <p className="text-[10px] text-omega-muted uppercase tracking-widest">
              {isMobile
                ? "Tocá para mover · Zona derecha = X-Dash"
                : "WASD / Flechas = Mover · ESPACIO = X-Dash"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
