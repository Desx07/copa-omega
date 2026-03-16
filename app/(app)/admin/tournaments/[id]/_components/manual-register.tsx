"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Search, Trash2, UserRoundPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ManualRegisterProps {
  tournamentId: string;
  existingPlayerIds: string[];
  participants: { player_id: string; alias: string }[];
  status: string;
}

export default function ManualRegister({ tournamentId, existingPlayerIds, participants, status }: ManualRegisterProps) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; alias: string; avatar_url: string | null; stars: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  // Quick create
  const [quickAlias, setQuickAlias] = useState("");
  const [quickName, setQuickName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("players")
      .select("id, alias, avatar_url, stars")
      .or(`alias.ilike.%${query.trim()}%,full_name.ilike.%${query.trim()}%`)
      .eq("is_hidden", false)
      .limit(10);
    setResults(data ?? []);
    setSearching(false);
  }

  async function handleAdd(playerId: string) {
    setAdding(playerId);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error inscribiendo");
        return;
      }
      toast.success("Jugador inscripto!");
      setResults(results.filter((r) => r.id !== playerId));
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setAdding(null);
    }
  }

  async function handleRemove(playerId: string) {
    if (!confirm("¿Eliminar este jugador del torneo?")) return;
    setRemoving(playerId);
    try {
      const { error } = await supabase
        .from("tournament_participants")
        .delete()
        .eq("tournament_id", tournamentId)
        .eq("player_id", playerId);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Jugador eliminado del torneo");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setRemoving(null);
    }
  }

  async function handleQuickCreate() {
    if (!quickAlias.trim()) {
      toast.error("El alias es obligatorio");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/players/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: quickAlias.trim(),
          full_name: quickName.trim() || quickAlias.trim(),
          tournament_id: tournamentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error creando jugador");
        return;
      }
      toast.success(data.already_existed ? `${quickAlias} inscripto al torneo` : `${quickAlias} creado e inscripto!`);
      setQuickAlias("");
      setQuickName("");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search existing players */}
      <div className="omega-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-omega-muted uppercase tracking-wider">
          <UserPlus className="size-4 text-omega-green" />
          Agregar jugador existente
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar por alias o nombre..."
            className="omega-input flex-1"
          />
          <button onClick={handleSearch} disabled={searching || !query.trim()} className="omega-btn omega-btn-primary px-4 py-2">
            {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </button>
        </div>
        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((player) => {
              const alreadyIn = existingPlayerIds.includes(player.id);
              return (
                <div key={player.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-omega-surface">
                  <div className="size-8 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                        {player.alias.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-omega-text truncate">{player.alias}</p>
                    <p className="text-xs text-omega-muted">★ {player.stars}</p>
                  </div>
                  {alreadyIn ? (
                    <span className="text-xs text-omega-green font-bold">Ya inscripto</span>
                  ) : (
                    <button onClick={() => handleAdd(player.id)} disabled={adding === player.id} className="omega-btn omega-btn-green px-3 py-1.5 text-xs">
                      {adding === player.id ? <Loader2 className="size-3 animate-spin" /> : "Agregar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick create player (no account needed) */}
      <div className="omega-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-omega-muted uppercase tracking-wider">
          <UserRoundPlus className="size-4 text-omega-blue" />
          Crear jugador rápido (sin cuenta)
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={quickAlias}
            onChange={(e) => setQuickAlias(e.target.value)}
            placeholder="Alias *"
            maxLength={30}
            className="omega-input flex-1"
          />
          <input
            type="text"
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="Nombre (opcional)"
            maxLength={60}
            className="omega-input flex-1"
          />
          <button onClick={handleQuickCreate} disabled={creating || !quickAlias.trim()} className="omega-btn omega-btn-blue px-4 py-2">
            {creating ? <Loader2 className="size-4 animate-spin" /> : "Crear"}
          </button>
        </div>
        <p className="text-[10px] text-omega-muted">Se crea un jugador sin email ni contraseña, solo para el torneo.</p>
      </div>

      {/* Current participants — with remove button */}
      {status === "registration" && participants.length > 0 && (
        <div className="omega-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-omega-muted uppercase tracking-wider">
            Inscriptos ({participants.length})
          </div>
          <div className="space-y-1">
            {participants.map((p) => (
              <div key={p.player_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-omega-surface">
                <span className="text-sm font-bold text-omega-text">{p.alias}</span>
                <button
                  onClick={() => handleRemove(p.player_id)}
                  disabled={removing === p.player_id}
                  className="text-omega-muted hover:text-omega-red transition-colors"
                >
                  {removing === p.player_id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
