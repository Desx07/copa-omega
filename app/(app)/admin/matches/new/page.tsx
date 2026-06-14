"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Swords, ArrowLeft, Loader2, Plus, TrendingUp, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import PlayerSearch, { type PlayerSearchResult } from "@/app/_components/player-search";
import { hasFullTicket, type RankLetter } from "@/lib/ascenso";

interface Player {
  id: string;
  alias: string;
  full_name: string | null;
  avatar_url: string | null;
  stars: number;
  is_eliminated: boolean;
  // Campos del modo ascenso (pueden no venir si la migración no corrió)
  rank_letter?: RankLetter | null;
  ticket_points?: number | null;
}

type MatchMode = "copa_omega" | "ascenso";

export default function NewMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<PlayerSearchResult | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<PlayerSearchResult | null>(null);
  const [starsBet, setStarsBet] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  // ── Modo ascenso ──
  const [ascensoEnabled, setAscensoEnabled] = useState(false);
  const [matchMode, setMatchMode] = useState<MatchMode>("copa_omega");
  const [isAscension, setIsAscension] = useState(false); // combate de ascenso (sube de rango)
  const [pointsAwarded, setPointsAwarded] = useState("25"); // puntos para el ganador (default 25)

  useEffect(() => {
    async function fetchPlayers() {
      const supabase = createClient();

      // Verificar que el usuario es admin
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("players")
        .select("is_admin, is_judge")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin && !profile?.is_judge) {
        router.push("/dashboard");
        return;
      }

      // Obtener jugadores activos — intentamos traer también los campos de
      // ascenso; si las columnas todavía no existen, caemos al select base.
      let playerData: Player[] | null = null;
      const { data: withRank, error: rankError } = await supabase
        .from("players")
        .select("id, alias, full_name, avatar_url, stars, is_eliminated, rank_letter, ticket_points")
        .eq("is_eliminated", false)
        .order("alias", { ascending: true });

      if (!rankError) {
        playerData = (withRank ?? []) as Player[];
      } else {
        const { data, error } = await supabase
          .from("players")
          .select("id, alias, full_name, avatar_url, stars, is_eliminated")
          .eq("is_eliminated", false)
          .order("alias", { ascending: true });

        if (error) {
          toast.error("Error al cargar jugadores");
          // Sin esto el spinner queda girando para siempre: cortamos el loading.
          setLoadingPlayers(false);
          return;
        }
        playerData = (data ?? []) as Player[];
      }

      setPlayers(playerData);
      setLoadingPlayers(false);
    }

    // ¿Está activa la modalidad ascenso? (define si mostramos el selector)
    async function fetchModeConfig() {
      try {
        const res = await fetch("/api/app-config");
        if (!res.ok) return;
        const config = (await res.json()) as Record<string, string>;
        setAscensoEnabled(config?.mode_ascenso_enabled === "true");
      } catch {
        // sin config no mostramos el selector — flujo copa intacto
      }
    }

    fetchPlayers();
    fetchModeConfig();
  }, [router]);

  const player1Id = selectedPlayer1?.id ?? "";
  const player2Id = selectedPlayer2?.id ?? "";

  // Para "combate de ascenso": si tenemos datos de rango, filtramos a los que
  // tienen el ticket lleno. Si no hay datos, no bloqueamos (el server valida).
  const playersWithTicketData = players.filter(
    (p) => p.rank_letter != null && p.ticket_points != null
  );
  const fullTicketPlayers = playersWithTicketData.filter((p) =>
    hasFullTicket(p.rank_letter as RankLetter, p.ticket_points as number)
  );
  const shouldFilterByTicket =
    matchMode === "ascenso" && isAscension && playersWithTicketData.length > 0;

  // Jugador 1: en combate de ascenso, solo bladers con ticket lleno.
  const searchablePlayers1 = shouldFilterByTicket ? fullTicketPlayers : players;

  // Jugador 2: además del ticket lleno, mismo rango que el jugador 1 elegido
  // (el combate de ascenso se pelea entre bladers del mismo rango).
  const selectedP1Data = selectedPlayer1
    ? (players.find((p) => p.id === selectedPlayer1.id) ?? null)
    : null;
  const searchablePlayers2 =
    shouldFilterByTicket && selectedP1Data?.rank_letter != null
      ? fullTicketPlayers.filter((p) => p.rank_letter === selectedP1Data.rank_letter)
      : searchablePlayers1;

  // Al entrar al modo combate de ascenso, deseleccionamos a quien no tenga el
  // ticket lleno — así el juez no se entera del error recién en el submit.
  // Solo si tenemos datos de rango para validarlo localmente.
  function deselectPlayersWithoutFullTicket() {
    if (playersWithTicketData.length === 0) return;
    const fullIds = new Set(fullTicketPlayers.map((p) => p.id));
    if (selectedPlayer1 && !fullIds.has(selectedPlayer1.id)) setSelectedPlayer1(null);
    if (selectedPlayer2 && !fullIds.has(selectedPlayer2.id)) setSelectedPlayer2(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!player1Id || !player2Id) {
      toast.error("Selecciona ambos jugadores");
      return;
    }

    if (player1Id === player2Id) {
      toast.error("Los jugadores deben ser diferentes");
      return;
    }

    // ── MODO ASCENSO: se crea vía API (el server valida tickets/puntos) ──
    if (matchMode === "ascenso") {
      const pointsNum = parseInt(pointsAwarded) || 0;

      if (!isAscension && (pointsNum < 1 || pointsNum > 500)) {
        toast.error("Los puntos deben ser entre 1 y 500");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player1_id: player1Id,
            player2_id: player2Id,
            mode: "ascenso",
            match_kind: isAscension ? "ascension" : "normal",
            // ascension no lleva puntos: el premio es subir de rango
            ...(isAscension ? {} : { points_awarded: pointsNum }),
          }),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          toast.error(data.error ?? "Error al crear la partida");
          setLoading(false);
          return;
        }

        toast.success(isAscension ? "Combate de ascenso creado!" : "Partida de ascenso creada!");
        router.push("/admin/matches");
      } catch {
        toast.error("Error al crear la partida");
        setLoading(false);
      }
      return;
    }

    // ── MODO COPA OMEGA: flujo histórico intacto ──
    const starsBetNum = parseInt(starsBet) || 0;

    if (starsBetNum < 1 || starsBetNum > 5) {
      toast.error("Las estrellas deben ser entre 1 y 5");
      return;
    }

    // Verificar que ambos jugadores tienen suficientes estrellas
    const p1 = players.find((p) => p.id === player1Id);
    const p2 = players.find((p) => p.id === player2Id);

    if (p1 && p1.stars < starsBetNum) {
      toast.error(`${p1.alias} no tiene suficientes estrellas (tiene ${p1.stars})`);
      return;
    }

    if (p2 && p2.stars < starsBetNum) {
      toast.error(`${p2.alias} no tiene suficientes estrellas (tiene ${p2.stars})`);
      return;
    }

    setLoading(true);

    try {
      // Unificamos con el modo ascenso: creamos vía POST /api/matches en vez de
      // insertar directo. El endpoint revalida en el server (jugadores activos,
      // estrellas suficientes, roles admin/juez) y crea la fila con stars_bet.
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1_id: player1Id,
          player2_id: player2Id,
          mode: "copa_omega",
          stars_bet: starsBetNum,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "Error al crear la partida");
        setLoading(false);
        return;
      }

      toast.success("Partida creada!");
      router.push("/admin/matches");
    } catch {
      toast.error("Error al crear la partida");
      setLoading(false);
    }
  }

  if (loadingPlayers) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 text-omega-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-purple/20 via-omega-blue/10 to-omega-dark shadow-lg shadow-omega-purple/10 mb-8">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/admin/matches"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Partidas
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-omega-purple/20 flex items-center justify-center">
              <Swords className="size-5 text-omega-purple" />
            </div>
            <h1 className="text-2xl font-black neon-purple">NUEVA PARTIDA</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de modalidad (solo si ascenso está activo) */}
          {ascensoEnabled && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                Modalidad
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMatchMode("copa_omega")}
                  data-testid="mode-copa-btn"
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                    matchMode === "copa_omega"
                      ? "bg-omega-gold/20 border-omega-gold/40 text-omega-gold"
                      : "bg-omega-surface border-omega-border/30 text-omega-muted hover:border-omega-gold/30"
                  }`}
                >
                  <Star className="size-4" />
                  Copa Omega
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMatchMode("ascenso");
                    // Si el toggle de combate de ascenso quedó activo de antes,
                    // aplicamos la misma limpieza de selecciones inválidas.
                    if (isAscension) deselectPlayersWithoutFullTicket();
                  }}
                  data-testid="mode-ascenso-btn"
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                    matchMode === "ascenso"
                      ? "bg-omega-purple/20 border-omega-purple/40 text-omega-purple"
                      : "bg-omega-surface border-omega-border/30 text-omega-muted hover:border-omega-purple/30"
                  }`}
                >
                  <TrendingUp className="size-4" />
                  Ascenso
                </button>
              </div>
            </div>
          )}

          {/* Player 1 */}
          <PlayerSearch
            players={searchablePlayers1}
            onSelect={(p) => {
              setSelectedPlayer1(p ?? null);
              // En combate de ascenso el rival debe ser del mismo rango: si el
              // jugador 2 ya elegido no coincide, lo deseleccionamos.
              if (p && shouldFilterByTicket && selectedPlayer2) {
                const p1Data = players.find((pl) => pl.id === p.id);
                const p2Data = players.find((pl) => pl.id === selectedPlayer2.id);
                if (
                  p1Data?.rank_letter != null &&
                  p2Data?.rank_letter != null &&
                  p1Data.rank_letter !== p2Data.rank_letter
                ) {
                  setSelectedPlayer2(null);
                }
              }
            }}
            placeholder="Buscar jugador 1..."
            label="Jugador 1"
            selectedPlayer={selectedPlayer1}
            excludeIds={player2Id ? [player2Id] : []}
            showStars={matchMode === "copa_omega"}
            showRank={matchMode === "ascenso"}
            clearable
            testId="player1-search"
          />

          {/* Player 2 */}
          <PlayerSearch
            players={searchablePlayers2}
            onSelect={(p) => setSelectedPlayer2(p ?? null)}
            placeholder="Buscar jugador 2..."
            label="Jugador 2"
            selectedPlayer={selectedPlayer2}
            excludeIds={player1Id ? [player1Id] : []}
            showStars={matchMode === "copa_omega"}
            showRank={matchMode === "ascenso"}
            clearable
            testId="player2-search"
          />

          {matchMode === "copa_omega" ? (
            /* Stars bet — flujo copa intacto */
            <div className="space-y-2">
              <label htmlFor="starsBet" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                Estrellas en juego
              </label>
              <div className="relative">
                <Star className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-omega-gold" />
                <input
                  id="starsBet"
                  type="number"
                  required
                  min={1}
                  max={5}
                  value={starsBet}
                  onChange={(e) => setStarsBet(e.target.value)}
                  placeholder="Estrellas (1-5)"
                  className="omega-input pl-10 py-3"
                />
              </div>
              <p className="text-[11px] text-omega-muted">
                Entre 1 y 5 estrellas. El perdedor las transfiere al ganador.
              </p>
            </div>
          ) : (
            /* Config del modo ascenso */
            <div className="space-y-4">
              {/* Toggle combate de ascenso */}
              <div className="flex items-center gap-3 rounded-xl border border-omega-purple/20 bg-omega-purple/5 p-3">
                <Ticket className="size-5 text-omega-purple shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-omega-text">Combate de ascenso</p>
                  <p className="text-xs text-omega-muted">
                    El ganador sube de rango. Requiere ticket lleno.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isAscension;
                    setIsAscension(next);
                    // Al activar: limpiamos selecciones sin ticket lleno para
                    // que el juez no choque con el 400 del server al guardar.
                    if (next) deselectPlayersWithoutFullTicket();
                  }}
                  aria-pressed={isAscension}
                  data-testid="ascension-toggle"
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    isAscension ? "bg-omega-purple" : "bg-omega-border/60"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                      isAscension ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {isAscension ? (
                <p className="text-[11px] text-omega-muted">
                  {shouldFilterByTicket
                    ? selectedP1Data?.rank_letter != null
                      ? `Mostrando solo jugadores de rango ${selectedP1Data.rank_letter} con ticket lleno.`
                      : "Mostrando solo jugadores con ticket lleno."
                    : "El servidor valida que ambos jugadores tengan el ticket lleno y el mismo rango."}
                </p>
              ) : (
                /* Puntos para el ganador */
                <div className="space-y-2">
                  <label htmlFor="pointsAwarded" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                    Puntos para el ganador
                  </label>
                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-omega-purple" />
                    <input
                      id="pointsAwarded"
                      type="number"
                      required
                      min={1}
                      max={500}
                      value={pointsAwarded}
                      onChange={(e) => setPointsAwarded(e.target.value)}
                      placeholder="Puntos (1-500)"
                      data-testid="points-awarded-input"
                      className="omega-input pl-10 py-3"
                    />
                  </div>
                  <p className="text-[11px] text-omega-muted">
                    Entre 1 y 500 puntos de ticket. Solo los suma el ganador.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {selectedPlayer1 && selectedPlayer2 && (
            <div className="rounded-2xl bg-gradient-to-br from-omega-purple/10 to-omega-blue/10 border border-omega-purple/20 p-4 shadow-sm">
              <p className="text-xs text-omega-muted mb-3 text-center">Vista previa</p>
              <div className="flex items-center gap-3 justify-center">
                <span className="text-sm font-bold text-omega-text">
                  {selectedPlayer1.alias}
                </span>
                {matchMode === "copa_omega" ? (
                  <span className="omega-badge omega-badge-gold">
                    <Star className="size-3 text-omega-gold fill-omega-gold mr-0.5" />
                    {parseInt(starsBet) || "?"}
                  </span>
                ) : isAscension ? (
                  <span className="omega-badge omega-badge-purple">
                    <TrendingUp className="size-3 text-omega-purple mr-0.5" />
                    ASCENSO
                  </span>
                ) : (
                  <span className="omega-badge omega-badge-purple">
                    <Ticket className="size-3 text-omega-purple mr-0.5" />
                    {parseInt(pointsAwarded) || "?"} pts
                  </span>
                )}
                <span className="text-sm font-bold text-omega-text">
                  {selectedPlayer2.alias}
                </span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedPlayer1 || !selectedPlayer2}
            className="omega-btn omega-btn-primary w-full py-3 text-sm"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Plus className="size-5" />
                {matchMode === "ascenso" && isAscension
                  ? "Crear combate de ascenso"
                  : "Crear partida"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
