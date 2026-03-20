"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Radio, Star, Swords } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LiveMatch {
  id: string;
  player1_id: string;
  player2_id: string;
  stars_bet: number;
  player1: { alias: string; avatar_url: string | null };
  player2: { alias: string; avatar_url: string | null };
}

export default function LiveBanner() {
  const [match, setMatch] = useState<LiveMatch | null>(null);

  const fetchLive = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("matches")
      .select(
        "id, player1_id, player2_id, stars_bet, player1:players!player1_id(alias, avatar_url), player2:players!player2_id(alias, avatar_url)"
      )
      .eq("is_live", true)
      .limit(1)
      .maybeSingle();

    setMatch(data as LiveMatch | null);
  }, []);

  useEffect(() => {
    fetchLive();

    // Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel("live-banner")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          fetchLive();
        }
      )
      .subscribe();

    // Fallback polling every 15s
    const interval = setInterval(fetchLive, 15_000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchLive]);

  if (!match) return null;

  return (
    <Link
      href="/live"
      className="block omega-card overflow-hidden border-red-500/40 hover:border-red-500/60 transition-all group"
    >
      {/* Red gradient top edge */}
      <div className="h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />

      <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Pulsing red dot + EN VIVO badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
              <Radio className="size-3" />
              En Vivo
            </span>
          </div>

          {/* Player matchup */}
          <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
            {/* Player 1 */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="size-7 rounded-full bg-omega-dark border border-omega-border overflow-hidden shrink-0">
                {match.player1.avatar_url ? (
                  <img
                    src={match.player1.avatar_url}
                    alt={match.player1.alias}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-[10px] font-black text-omega-purple">
                    {match.player1.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-omega-text truncate max-w-[60px]">
                {match.player1.alias}
              </span>
            </div>

            {/* VS */}
            <Swords className="size-3.5 text-red-400 shrink-0" />

            {/* Player 2 */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-omega-text truncate max-w-[60px]">
                {match.player2.alias}
              </span>
              <div className="size-7 rounded-full bg-omega-dark border border-omega-border overflow-hidden shrink-0">
                {match.player2.avatar_url ? (
                  <img
                    src={match.player2.avatar_url}
                    alt={match.player2.alias}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-[10px] font-black text-omega-purple">
                    {match.player2.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stars bet */}
          <div className="flex items-center gap-1 shrink-0">
            <Star className="size-3 text-omega-gold fill-omega-gold" />
            <span className="text-xs font-bold text-omega-gold">{match.stars_bet}</span>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-2 text-center">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider group-hover:text-red-300 transition-colors">
            Ver batalla en vivo &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
