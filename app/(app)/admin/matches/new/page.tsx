"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Swords, ArrowLeft, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Player {
  id: string;
  alias: string;
  stars: number;
  is_eliminated: boolean;
}

export default function NewMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [starsBet, setStarsBet] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

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

      // Obtener jugadores activos
      const { data, error } = await supabase
        .from("players")
        .select("id, alias, stars, is_eliminated")
        .eq("is_eliminated", false)
        .order("alias", { ascending: true });

      if (error) {
        toast.error("Error al cargar jugadores");
        return;
      }

      setPlayers(data ?? []);
      setLoadingPlayers(false);
    }

    fetchPlayers();
  }, [router]);

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
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("No estas autenticado");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("matches").insert({
        player1_id: player1Id,
        player2_id: player2Id,
        stars_bet: starsBetNum,
        created_by: user.id,
      });

      if (error) {
        toast.error(error.message);
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
          {/* Player 1 */}
          <div className="space-y-2">
            <label htmlFor="player1" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
              Jugador 1
            </label>
            <select
              id="player1"
              required
              value={player1Id}
              onChange={(e) => setPlayer1Id(e.target.value)}
              className="omega-input py-3"
            >
              <option value="" className="bg-omega-card text-omega-muted">
                Seleccionar jugador...
              </option>
              {players.map((player) => (
                <option key={player.id} value={player.id} className="bg-omega-card">
                  {player.alias} ({player.stars} estrellas)
                </option>
              ))}
            </select>
          </div>

          {/* Player 2 */}
          <div className="space-y-2">
            <label htmlFor="player2" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
              Jugador 2
            </label>
            <select
              id="player2"
              required
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              className="omega-input py-3"
            >
              <option value="" className="bg-omega-card text-omega-muted">
                Seleccionar jugador...
              </option>
              {players
                .filter((p) => p.id !== player1Id)
                .map((player) => (
                  <option key={player.id} value={player.id} className="bg-omega-card">
                    {player.alias} ({player.stars} estrellas)
                  </option>
                ))}
            </select>
          </div>

          {/* Stars bet */}
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

          {/* Preview */}
          {player1Id && player2Id && (
            <div className="rounded-2xl bg-gradient-to-br from-omega-purple/10 to-omega-blue/10 border border-omega-purple/20 p-4 shadow-sm">
              <p className="text-xs text-omega-muted mb-3 text-center">Vista previa</p>
              <div className="flex items-center gap-3 justify-center">
                <span className="text-sm font-bold text-omega-text">
                  {players.find((p) => p.id === player1Id)?.alias}
                </span>
                <span className="omega-badge omega-badge-gold">
                  <Star className="size-3 text-omega-gold fill-omega-gold mr-0.5" />
                  {parseInt(starsBet) || "?"}
                </span>
                <span className="text-sm font-bold text-omega-text">
                  {players.find((p) => p.id === player2Id)?.alias}
                </span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !player1Id || !player2Id}
            className="omega-btn omega-btn-primary w-full py-3 text-sm"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Plus className="size-5" />
                Crear partida
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
