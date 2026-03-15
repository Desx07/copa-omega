"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Swords,
  Star,
  Trophy,
  Zap,
  Award,
  UserPlus,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Flame,
  Skull,
  Laugh,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import BattleComments from "./battle-comments";

type FeedItem = {
  id: string;
  type: string;
  actor_id: string | null;
  target_id: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: { id: string; alias: string; avatar_url: string | null } | null;
  target: { id: string; alias: string; avatar_url: string | null } | null;
  reactions: { reaction: string; player_id: string }[];
  comment_count?: number;
};

const REACTION_EMOJIS: Record<string, { icon: React.ReactNode; label: string }> = {
  fire: { icon: <Flame className="size-3.5" />, label: "Fuego" },
  star: { icon: <Sparkles className="size-3.5" />, label: "Estrella" },
  skull: { icon: <Skull className="size-3.5" />, label: "Calavera" },
  lightning: { icon: <Zap className="size-3.5" />, label: "Rayo" },
  laugh: { icon: <Laugh className="size-3.5" />, label: "Risa" },
};

function getEventIcon(type: string) {
  switch (type) {
    case "match_result":
      return <Swords className="size-4 text-omega-blue" />;
    case "challenge_created":
      return <Zap className="size-4 text-omega-red" />;
    case "challenge_accepted":
      return <Swords className="size-4 text-omega-green" />;
    case "challenge_declined":
      return <Swords className="size-4 text-omega-muted" />;
    case "badge_unlocked":
      return <Award className="size-4 text-omega-gold" />;
    case "tournament_result":
    case "tournament_registration":
      return <Trophy className="size-4 text-omega-purple" />;
    case "new_player":
      return <UserPlus className="size-4 text-omega-green" />;
    case "combo_shared":
      return <Star className="size-4 text-omega-blue" />;
    case "rank_change":
      return <Trophy className="size-4 text-omega-gold" />;
    case "streak":
      return <Flame className="size-4 text-omega-red" />;
    default:
      return <Star className="size-4 text-omega-muted" />;
  }
}

function getEventText(item: FeedItem): string {
  const actorAlias = item.actor?.alias ?? "Alguien";
  const targetAlias = item.target?.alias ?? "";
  const meta = item.metadata;

  switch (item.type) {
    case "match_result": {
      const stars = meta.stars_bet ?? 0;
      return `${actorAlias} le gano a ${targetAlias} (+${stars}\u2605)`;
    }
    case "challenge_created": {
      const stars = meta.stars_bet ?? 0;
      return `${actorAlias} reto a ${targetAlias} por ${stars}\u2605`;
    }
    case "challenge_accepted":
      return `${actorAlias} acepto el reto de ${targetAlias}`;
    case "challenge_declined":
      return `${actorAlias} rechazo el reto de ${targetAlias}`;
    case "badge_unlocked": {
      const badgeName = (meta.badge_name as string) ?? "un logro";
      const badgeIcon = (meta.badge_icon as string) ?? "";
      return `${actorAlias} desbloqueo ${badgeIcon} ${badgeName}`;
    }
    case "combo_shared": {
      const combo = (meta.combo as string) ?? "";
      return `${actorAlias} compartio un combo: ${combo}`;
    }
    case "tournament_registration":
      return `${actorAlias} se inscribio en un torneo`;
    case "tournament_result":
      return `${actorAlias} termino en posicion ${meta.position ?? "?"}`;
    case "new_player":
      return `${actorAlias} se unio a Copa Omega Star`;
    case "rank_change":
      return `${actorAlias} subio al puesto #${meta.new_rank ?? "?"}`;
    case "streak":
      return `${actorAlias} lleva ${meta.streak ?? "?"} victorias seguidas`;
    default:
      return `${actorAlias} hizo algo`;
  }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function FeedClient({ userId }: { userId: string }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());
  const PAGE_SIZE = 30;

  const fetchFeed = useCallback(
    async (offset = 0, append = false) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const supabase = supabaseRef.current;
        const { data, error } = await supabase
          .from("activity_feed")
          .select(
            "id, type, actor_id, target_id, reference_id, metadata, created_at, actor:players!actor_id(id, alias, avatar_url), target:players!target_id(id, alias, avatar_url)"
          )
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
          console.error("Feed fetch error:", error);
          return;
        }

        const feedItems = data as unknown as FeedItem[];

        // Fetch reactions for these items
        if (feedItems.length > 0) {
          const ids = feedItems.map((item) => item.id);
          const { data: reactions } = await supabase
            .from("feed_reactions")
            .select("feed_item_id, reaction, player_id")
            .in("feed_item_id", ids);

          // Fetch comment counts for match_result items
          const matchResultItems = feedItems.filter(
            (item) => item.type === "match_result" && item.reference_id
          );

          let commentCounts: Record<string, number> = {};
          if (matchResultItems.length > 0) {
            const matchIds = matchResultItems.map((item) => item.reference_id!);
            const { data: comments } = await supabase
              .from("battle_comments")
              .select("match_id")
              .in("match_id", matchIds);

            if (comments) {
              for (const c of comments) {
                commentCounts[c.match_id] =
                  (commentCounts[c.match_id] || 0) + 1;
              }
            }
          }

          for (const item of feedItems) {
            item.reactions =
              reactions?.filter((r) => r.feed_item_id === item.id) ?? [];
            if (item.type === "match_result" && item.reference_id) {
              item.comment_count = commentCounts[item.reference_id] ?? 0;
            }
          }
        }

        if (append) {
          setItems((prev) => [...prev, ...feedItems]);
        } else {
          setItems(feedItems);
        }

        setHasMore(feedItems.length === PAGE_SIZE);
      } catch {
        // ignore
      }

      setLoading(false);
      setLoadingMore(false);
    },
    []
  );

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Realtime subscription
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("feed-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_feed" },
        async (payload) => {
          const newItem = payload.new as FeedItem;

          // Fetch actor and target info
          const [actorRes, targetRes] = await Promise.all([
            newItem.actor_id
              ? supabase
                  .from("players")
                  .select("id, alias, avatar_url")
                  .eq("id", newItem.actor_id)
                  .single()
              : Promise.resolve({ data: null }),
            newItem.target_id
              ? supabase
                  .from("players")
                  .select("id, alias, avatar_url")
                  .eq("id", newItem.target_id)
                  .single()
              : Promise.resolve({ data: null }),
          ]);

          newItem.actor = actorRes.data;
          newItem.target = targetRes.data;
          newItem.reactions = [];

          setItems((prev) => [newItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleReaction(feedItemId: string, reaction: string) {
    try {
      const res = await fetch("/api/feed/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feed_item_id: feedItemId, reaction }),
      });

      if (res.ok) {
        const result = await res.json();
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== feedItemId) return item;
            let newReactions = [...item.reactions];

            if (result.action === "removed") {
              newReactions = newReactions.filter(
                (r) => !(r.player_id === userId && r.reaction === reaction)
              );
            } else {
              // Remove previous reaction by this user
              newReactions = newReactions.filter(
                (r) => r.player_id !== userId
              );
              newReactions.push({
                reaction,
                player_id: userId,
                feed_item_id: feedItemId,
              } as never);
            }

            return { ...item, reactions: newReactions };
          })
        );
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="px-4 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-omega-purple/20 border border-omega-purple/30 flex items-center justify-center">
            <Zap className="size-5 text-omega-purple" />
          </div>
          <div>
            <h1 className="text-xl font-black text-omega-text">Feed</h1>
            <p className="text-xs text-omega-muted">
              Actividad reciente de Copa Omega
            </p>
          </div>
        </div>
      </div>

      {/* Feed items */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="omega-card p-10 text-center">
            <Loader2 className="size-6 text-omega-muted animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="omega-card p-10 text-center space-y-3">
            <Zap className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">
              No hay actividad todavia
            </p>
          </div>
        ) : (
          <>
            {items.map((item) => {
              // Count reactions by type
              const reactionCounts: Record<string, number> = {};
              const myReaction = item.reactions.find(
                (r) => r.player_id === userId
              )?.reaction;

              for (const r of item.reactions) {
                reactionCounts[r.reaction] =
                  (reactionCounts[r.reaction] || 0) + 1;
              }

              return (
                <div key={item.id} className="omega-card overflow-hidden">
                  <div className="px-4 py-3 flex items-start gap-3">
                    {/* Icon */}
                    <div className="size-9 rounded-lg bg-omega-dark border border-omega-border/30 flex items-center justify-center shrink-0 mt-0.5">
                      {getEventIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-omega-text leading-relaxed">
                        {getEventText(item)}
                      </p>
                      <p className="text-[11px] text-omega-muted mt-1">
                        {timeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Reactions bar */}
                  <div className="px-4 py-2 bg-omega-surface/30 border-t border-white/[0.04] flex items-center gap-1.5 flex-wrap">
                    {Object.entries(REACTION_EMOJIS).map(([key, { icon }]) => {
                      const count = reactionCounts[key] ?? 0;
                      const isActive = myReaction === key;

                      return (
                        <button
                          key={key}
                          onClick={() => handleReaction(item.id, key)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                            isActive
                              ? "bg-omega-purple/20 border border-omega-purple/40 text-omega-purple"
                              : "bg-omega-dark/50 border border-white/[0.06] text-omega-muted hover:border-omega-purple/30 hover:text-omega-text"
                          }`}
                        >
                          {icon}
                          {count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}

                    {/* Comment count for match results */}
                    {item.type === "match_result" && item.reference_id && (
                      <button
                        onClick={() =>
                          setExpandedComments(
                            expandedComments === item.id ? null : item.id
                          )
                        }
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ml-auto ${
                          expandedComments === item.id
                            ? "bg-omega-blue/20 border border-omega-blue/40 text-omega-blue"
                            : "bg-omega-dark/50 border border-white/[0.06] text-omega-muted hover:border-omega-blue/30 hover:text-omega-text"
                        }`}
                      >
                        <MessageCircle className="size-3.5" />
                        {(item.comment_count ?? 0) > 0 && (
                          <span>{item.comment_count}</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded comments */}
                  {expandedComments === item.id &&
                    item.type === "match_result" &&
                    item.reference_id && (
                      <div className="border-t border-white/[0.04]">
                        <BattleComments
                          matchId={item.reference_id}
                          userId={userId}
                          isAdmin={false}
                        />
                      </div>
                    )}
                </div>
              );
            })}

            {/* Load more */}
            {hasMore && (
              <button
                onClick={() => fetchFeed(items.length, true)}
                disabled={loadingMore}
                className="omega-btn omega-btn-secondary w-full py-3 text-sm"
              >
                {loadingMore ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Cargar mas"
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
