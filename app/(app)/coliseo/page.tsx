"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Skull,
  Crown,
  Shield,
  Swords,
  Coins,
  Users,
  Clock,
  Trophy,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Tipos ──────────────────────────────────────────────

interface ColiseoPlayer {
  id: string;
  alias: string;
  avatar_url: string | null;
  omega_coins?: number;
}

interface ColiseoParticipant {
  id: string;
  player_id: string;
  placement: number | null;
  eliminated_at: string | null;
  player: ColiseoPlayer;
}

interface ColiseoEvent {
  id: string;
  name: string;
  status: "upcoming" | "live" | "completed";
  max_players: number;
  entry_fee_oc: number;
  prize_pool_oc: number;
  winner_id: string | null;
  winner: ColiseoPlayer | null;
  participant_count: number;
  participants: ColiseoParticipant[];
  created_at: string;
}

// ─── Componente principal ───────────────────────────────

export default function ColiseoPage() {
  const [events, setEvents] = useState<ColiseoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [myOC, setMyOC] = useState(0);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/coliseo");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setMyId(user.id);
        const { data: player } = await supabase
          .from("players")
          .select("omega_coins")
          .eq("id", user.id)
          .single();
        setMyOC(player?.omega_coins ?? 0);
      }
      await fetchEvents();
      setLoading(false);
    };
    init();

    // Realtime
    const supabase = createClient();
    const channel = supabase
      .channel("coliseo-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coliseo_events" },
        () => fetchEvents()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coliseo_participants" },
        () => fetchEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  const handleJoin = async (eventId: string) => {
    setJoiningId(eventId);
    setError(null);
    try {
      const res = await fetch(`/api/coliseo/${eventId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        await fetchEvents();
        // Actualizar OC
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: player } = await supabase
            .from("players")
            .select("omega_coins")
            .eq("id", user.id)
            .single();
          setMyOC(player?.omega_coins ?? 0);
        }
      }
    } catch {
      setError("Error de conexion");
    }
    setJoiningId(null);
  };

  const upcoming = events.filter((e) => e.status === "upcoming");
  const live = events.filter((e) => e.status === "live");
  const completed = events.filter((e) => e.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="size-10 text-omega-red animate-spin mx-auto" />
          <p className="text-sm text-omega-muted">Cargando el Coliseo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo gladiador dramatico */}
      <div className="fixed inset-0 bg-gradient-to-b from-red-950/50 via-omega-black to-omega-dark pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-red-600/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-orange-600/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-1/3 left-0 w-[300px] h-[300px] bg-omega-purple/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto pb-10">
        {/* Header */}
        <div className="px-4 pt-6 pb-2">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-red transition-colors inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>

          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-red-500/20 ring-2 ring-red-500/40 shadow-lg shadow-red-500/20">
              <Skull className="size-8 text-red-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-500">
              COLISEO
            </h1>
            <p className="text-sm text-omega-muted">
              Battle Royale -- Solo uno sale victorioso
            </p>

            {/* OC balance */}
            <div className="inline-flex items-center gap-2 bg-omega-card/80 border border-omega-gold/30 rounded-full px-4 py-1.5">
              <Coins className="size-4 text-omega-gold" />
              <span className="text-sm font-bold text-omega-gold">
                {myOC} OC
              </span>
            </div>
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-omega-red/15 border border-omega-red/30 text-omega-red text-sm text-center">
            {error}
          </div>
        )}

        {/* Coliseo en vivo */}
        {live.map((event) => (
          <div key={event.id} className="px-4 mt-6">
            <LiveArena event={event} myId={myId} />
          </div>
        ))}

        {/* Eventos proximos */}
        {upcoming.length > 0 && (
          <div className="px-4 mt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-omega-blue" />
              <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                Proximos eventos
              </h2>
              <span className="omega-badge omega-badge-blue ml-auto">
                {upcoming.length}
              </span>
            </div>

            {upcoming.map((event) => {
              const isJoined =
                myId &&
                event.participants.some(
                  (p: ColiseoParticipant) => p.player_id === myId
                );
              const isFull = event.participant_count >= event.max_players;

              return (
                <div
                  key={event.id}
                  className="omega-card border-l-4 border-l-omega-red/60 overflow-visible"
                >
                  {/* Glow sutil */}
                  <div className="h-0.5 bg-gradient-to-r from-red-500/40 via-orange-500/40 to-red-500/40" />
                  <div className="p-5 space-y-4">
                    {/* Titulo */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-omega-text">
                          {event.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-omega-muted flex items-center gap-1">
                            <Users className="size-3" />
                            {event.participant_count}/{event.max_players}
                          </span>
                          {event.entry_fee_oc > 0 && (
                            <span className="text-[11px] text-omega-gold flex items-center gap-1">
                              <Coins className="size-3" />
                              {event.entry_fee_oc} OC entrada
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="omega-badge omega-badge-blue gap-1">
                        <Shield className="size-3" />
                        PROXIMO
                      </span>
                    </div>

                    {/* Avatares en circulo pequeno */}
                    {event.participants.length > 0 && (
                      <div className="flex items-center -space-x-2">
                        {event.participants.slice(0, 8).map((p) => (
                          <div
                            key={p.id}
                            className="size-8 rounded-full border-2 border-omega-dark overflow-hidden bg-omega-surface"
                          >
                            {p.player.avatar_url ? (
                              <img
                                src={p.player.avatar_url}
                                alt={p.player.alias}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="size-full flex items-center justify-center text-[10px] font-black text-omega-purple">
                                {p.player.alias.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        ))}
                        {event.participant_count > 8 && (
                          <div className="size-8 rounded-full border-2 border-omega-dark bg-omega-surface flex items-center justify-center">
                            <span className="text-[10px] font-bold text-omega-muted">
                              +{event.participant_count - 8}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prize pool */}
                    {event.prize_pool_oc > 0 && (
                      <div className="flex items-center gap-2 bg-omega-gold/10 border border-omega-gold/20 rounded-xl px-3 py-2">
                        <Trophy className="size-4 text-omega-gold" />
                        <span className="text-sm font-bold text-omega-gold">
                          Pool: {event.prize_pool_oc} OC
                        </span>
                      </div>
                    )}

                    {/* Boton inscribirme */}
                    {isJoined ? (
                      <div className="omega-btn omega-btn-secondary w-full py-3 text-sm cursor-default opacity-80">
                        <Shield className="size-4 text-omega-green" />
                        <span className="text-omega-green">
                          Ya estas inscripto
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoin(event.id)}
                        disabled={
                          isFull || joiningId === event.id
                        }
                        className="omega-btn omega-btn-red w-full py-3 text-sm"
                      >
                        {joiningId === event.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Swords className="size-4" />
                        )}
                        {isFull
                          ? "Cupo lleno"
                          : event.entry_fee_oc > 0
                            ? `Inscribirme (${event.entry_fee_oc} OC)`
                            : "Inscribirme"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Historial de eventos completados */}
        {completed.length > 0 && (
          <div className="px-4 mt-6 space-y-3">
            <button
              onClick={() => setExpandedHistory(!expandedHistory)}
              className="flex items-center gap-2 w-full"
            >
              <Trophy className="size-4 text-omega-muted" />
              <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                Historial del Coliseo
              </h2>
              <span className="omega-badge omega-badge-purple ml-auto mr-2">
                {completed.length}
              </span>
              {expandedHistory ? (
                <ChevronUp className="size-4 text-omega-muted" />
              ) : (
                <ChevronDown className="size-4 text-omega-muted" />
              )}
            </button>

            {expandedHistory &&
              completed.map((event) => (
                <CompletedEventCard key={event.id} event={event} />
              ))}
          </div>
        )}

        {/* Estado vacio */}
        {events.length === 0 && (
          <div className="px-4 mt-10">
            <div className="omega-card p-12 text-center space-y-4">
              <Skull className="size-16 text-omega-muted/30 mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-bold text-omega-muted">
                  El Coliseo esta vacio
                </p>
                <p className="text-sm text-omega-muted/70">
                  Cuando un admin cree un evento Battle Royale, va a aparecer
                  aca.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Arena en Vivo ──────────────────────────────────────

function LiveArena({
  event,
  myId,
}: {
  event: ColiseoEvent;
  myId: string | null;
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const sortedParticipants = [...event.participants].sort((a, b) => {
    // Eliminados al final
    if (a.eliminated_at && !b.eliminated_at) return 1;
    if (!a.eliminated_at && b.eliminated_at) return -1;
    return 0;
  });

  const activeCount = sortedParticipants.filter(
    (p) => !p.eliminated_at
  ).length;

  useEffect(() => {
    if (activeCount === 1) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeCount]);

  return (
    <div className="relative">
      {/* Confetti para el ganador */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-3xl">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti-coliseo"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              <div
                className="size-2 rounded-sm"
                style={{
                  backgroundColor: [
                    "#f59e0b",
                    "#ef4444",
                    "#ff6b35",
                    "#7c3aed",
                    "#f97316",
                    "#dc2626",
                  ][i % 6],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-3xl bg-gradient-to-br from-red-950/60 via-omega-card to-omega-surface border border-red-500/20 shadow-2xl shadow-red-500/15 overflow-hidden">
        {/* Barra de energia */}
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse" />

        <div className="p-6 space-y-5">
          {/* Header en vivo */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-omega-text">
                {event.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-omega-muted">
                  {activeCount} gladiadores en pie
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-3 py-1.5 rounded-full animate-pulse">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[11px] font-black text-red-400 uppercase tracking-widest">
                En Vivo
              </span>
            </div>
          </div>

          {/* Prize pool */}
          {event.prize_pool_oc > 0 && (
            <div className="flex items-center justify-center gap-2 bg-omega-gold/10 border border-omega-gold/25 rounded-xl px-4 py-2">
              <Coins className="size-4 text-omega-gold" />
              <span className="text-sm font-bold text-omega-gold">
                Premio: {event.prize_pool_oc} OC
              </span>
            </div>
          )}

          {/* Arena circular */}
          <div className="relative mx-auto aspect-square max-w-[320px]">
            {/* Anillo de la arena */}
            <div className="absolute inset-4 rounded-full border-2 border-red-500/20" />
            <div className="absolute inset-8 rounded-full border border-red-500/10" />
            <div className="absolute inset-12 rounded-full border border-orange-500/10" />

            {/* Centro: icono Coliseo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Swords className="size-8 text-red-400/60" />
              </div>
            </div>

            {/* Jugadores en circulo */}
            {sortedParticipants.map((participant, i) => {
              const angle =
                (i / sortedParticipants.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 42; // % del contenedor
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              const isEliminated = !!participant.eliminated_at;
              const isWinner = activeCount === 1 && !isEliminated;
              const isMe = participant.player_id === myId;

              return (
                <div
                  key={participant.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {/* Crown para el ganador */}
                    {isWinner && (
                      <Crown className="size-4 text-omega-gold fill-omega-gold animate-bounce" />
                    )}

                    {/* Avatar */}
                    <div
                      className={`relative size-12 rounded-full overflow-hidden border-2 transition-all duration-500 ${
                        isWinner
                          ? "border-omega-gold shadow-lg shadow-omega-gold/40 ring-2 ring-omega-gold/30 scale-110"
                          : isEliminated
                            ? "border-omega-muted/20 opacity-30 grayscale scale-90"
                            : isMe
                              ? "border-omega-purple ring-2 ring-omega-purple/20"
                              : "border-red-500/40"
                      }`}
                    >
                      {participant.player.avatar_url ? (
                        <img
                          src={participant.player.avatar_url}
                          alt={participant.player.alias}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full bg-omega-dark flex items-center justify-center text-sm font-black text-omega-purple">
                          {participant.player.alias.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* X overlay para eliminados */}
                      {isEliminated && (
                        <div className="absolute inset-0 bg-omega-dark/60 flex items-center justify-center">
                          <Skull className="size-5 text-omega-red/60" />
                        </div>
                      )}
                    </div>

                    {/* Nombre */}
                    <span
                      className={`text-[9px] font-bold max-w-[60px] truncate text-center ${
                        isWinner
                          ? "text-omega-gold"
                          : isEliminated
                            ? "text-omega-muted/30"
                            : "text-omega-text"
                      }`}
                    >
                      {participant.player.alias}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linea dramatica */}
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

          {/* Status */}
          <div className="text-center">
            {activeCount > 1 ? (
              <p className="text-sm text-omega-muted">
                <span className="text-red-400 font-bold">{activeCount}</span>{" "}
                gladiadores compiten por la gloria
              </p>
            ) : activeCount === 1 ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-omega-gold/20 border border-omega-gold/40 animate-bounce">
                  <Crown className="size-5 text-omega-gold" />
                  <span className="text-lg font-black text-omega-gold">
                    Campeon del Coliseo!
                  </span>
                  <Crown className="size-5 text-omega-gold" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* CSS para confetti */}
      <style jsx global>{`
        @keyframes confetti-fall-coliseo {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-coliseo {
          animation: confetti-fall-coliseo linear forwards;
        }
      `}</style>
    </div>
  );
}

// ─── Evento completado ──────────────────────────────────

function CompletedEventCard({ event }: { event: ColiseoEvent }) {
  const podium = [...event.participants]
    .filter((p) => p.placement && p.placement <= 3)
    .sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));

  const placementIcons: Record<number, React.ReactNode> = {
    1: <Crown className="size-3.5 text-omega-gold" />,
    2: <Trophy className="size-3.5 text-gray-400" />,
    3: <Shield className="size-3.5 text-amber-600" />,
  };

  const placementColors: Record<number, string> = {
    1: "text-omega-gold",
    2: "text-gray-400",
    3: "text-amber-600",
  };

  return (
    <div className="omega-card overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-omega-muted/20 via-omega-muted/40 to-omega-muted/20" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-omega-text">{event.name}</h3>
            <span className="text-[10px] text-omega-muted">
              {new Date(event.created_at).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <span className="omega-badge omega-badge-green gap-1">
            <Sparkles className="size-3" />
            COMPLETADO
          </span>
        </div>

        {/* Podio */}
        {podium.length > 0 && (
          <div className="space-y-1.5">
            {podium.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5">
                {placementIcons[p.placement ?? 99]}
                <div className="size-6 rounded-full overflow-hidden border border-omega-border bg-omega-surface">
                  {p.player.avatar_url ? (
                    <img
                      src={p.player.avatar_url}
                      alt={p.player.alias}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-[8px] font-black text-omega-purple">
                      {p.player.alias.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-bold ${placementColors[p.placement ?? 99] ?? "text-omega-text"}`}
                >
                  {p.player.alias}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Prize pool repartido */}
        {event.prize_pool_oc > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-omega-gold">
            <Coins className="size-3" />
            <span className="font-bold">{event.prize_pool_oc} OC</span>
            <span className="text-omega-muted">repartidos</span>
          </div>
        )}
      </div>
    </div>
  );
}
