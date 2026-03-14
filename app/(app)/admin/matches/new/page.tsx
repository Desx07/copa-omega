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
  const [starsBet, setStarsBet] = useState(1);
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
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
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

    if (starsBet < 1 || starsBet > 5) {
      toast.error("Las estrellas deben ser entre 1 y 5");
      return;
    }

    // Verificar que ambos jugadores tienen suficientes estrellas
    const p1 = players.find((p) => p.id === player1Id);
    const p2 = players.find((p) => p.id === player2Id);

    if (p1 && p1.stars < starsBet) {
      toast.error(`${p1.alias} no tiene suficientes estrellas (tiene ${p1.stars})`);
      return;
    }

    if (p2 && p2.stars < starsBet) {
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
        stars_bet: starsBet,
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
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/matches"
          className="omega-btn omega-btn-secondary size-10"
          aria-label="Volver a partidas"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Swords className="size-5 text-omega-purple" />
          <h1 className="text-2xl font-black neon-purple">NUEVA PARTIDA</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Player 1 */}
        <div className="space-y-2">
          <label htmlFor="player1" className="text-sm font-medium text-omega-muted">
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
          <label htmlFor="player2" className="text-sm font-medium text-omega-muted">
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
          <label htmlFor="starsBet" className="text-sm font-medium text-omega-muted">
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
              onChange={(e) => setStarsBet(Number(e.target.value))}
              className="omega-input pl-10 py-3"
            />
          </div>
          <p className="text-[11px] text-omega-muted">
            Entre 1 y 5 estrellas. El perdedor las transfiere al ganador.
          </p>
        </div>

        {/* Preview */}
        {player1Id && player2Id && (
          <div className="omega-card p-4">
            <p className="text-xs text-omega-muted mb-3 text-center">Vista previa</p>
            <div className="flex items-center gap-3 justify-center">
              <span className="text-sm font-bold text-omega-text">
                {players.find((p) => p.id === player1Id)?.alias}
              </span>
              <span className="omega-badge omega-badge-gold">
                <Star className="size-3 text-omega-gold fill-omega-gold mr-0.5" />
                {starsBet}
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
  );
}
