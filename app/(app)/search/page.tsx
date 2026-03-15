"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Search, Star, Loader2, User } from "lucide-react";

interface PlayerResult {
  id: string;
  alias: string;
  full_name: string | null;
  avatar_url: string | null;
  stars: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    setLoading(true);
    setSearched(true);

    try {
      const supabase = createClient();
      const searchTerm = `%${trimmed}%`;

      const { data, error } = await supabase
        .from("players")
        .select("id, alias, full_name, avatar_url, stars")
        .eq("is_hidden", false)
        .or(`alias.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
        .order("stars", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Search error:", error);
        setResults([]);
      } else {
        setResults(data ?? []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="px-4 pt-6 space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-omega-purple/20 flex items-center justify-center">
            <Search className="size-6 text-omega-purple" />
          </div>
          <div>
            <h1 className="text-xl font-black text-omega-text">Buscar Bladers</h1>
            <p className="text-xs text-omega-muted">Encontrá a otros jugadores</p>
          </div>
        </div>
      </div>

      {/* Search form */}
      <div className="px-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o alias..."
            className="omega-input flex-1"
            minLength={2}
          />
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="omega-btn bg-omega-purple text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-omega-purple-glow transition-colors flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="omega-card p-10 text-center">
            <Loader2 className="size-6 text-omega-muted animate-spin mx-auto" />
          </div>
        ) : searched && results.length === 0 ? (
          <div className="omega-card p-10 text-center space-y-3">
            <User className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">No se encontraron bladers</p>
          </div>
        ) : (
          results.map((player) => (
            <Link
              key={player.id}
              href={`/player/${player.id}`}
              className="omega-card p-4 flex items-center gap-3 hover:border-omega-purple/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {/* Avatar */}
              <div className="size-11 rounded-full overflow-hidden bg-omega-dark border border-omega-border/30 shrink-0">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.alias} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-lg font-black text-omega-purple">
                    {player.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-omega-text truncate">{player.alias}</p>
                {player.full_name && (
                  <p className="text-xs text-omega-muted truncate">{player.full_name}</p>
                )}
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-sm font-black text-omega-gold">{player.stars}</span>
                <Star className="size-3.5 text-omega-gold fill-omega-gold" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
