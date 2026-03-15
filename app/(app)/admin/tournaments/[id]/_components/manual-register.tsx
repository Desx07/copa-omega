"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ManualRegisterProps {
  tournamentId: string;
  existingPlayerIds: string[];
}

export default function ManualRegister({ tournamentId, existingPlayerIds }: ManualRegisterProps) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; alias: string; avatar_url: string | null; stars: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

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

  return (
    <div className="omega-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-omega-muted uppercase tracking-wider">
        <UserPlus className="size-4 text-omega-green" />
        Agregar jugador manualmente
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
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="omega-btn omega-btn-primary px-4 py-2"
        >
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
                  <button
                    onClick={() => handleAdd(player.id)}
                    disabled={adding === player.id}
                    className="omega-btn omega-btn-green px-3 py-1.5 text-xs"
                  >
                    {adding === player.id ? <Loader2 className="size-3 animate-spin" /> : "Agregar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
