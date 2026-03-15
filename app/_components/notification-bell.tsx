"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Zap, Award, MessageCircle } from "lucide-react";
import Link from "next/link";
import { BADGE_DEFINITIONS } from "@/lib/badges";

interface Notification {
  id: string;
  type: "challenge" | "badge" | "comment";
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const items: Notification[] = [];

    // 1. Pending challenges for me
    const { data: challenges } = await supabase
      .from("challenges")
      .select("id, challenger_id, stars_bet, created_at, challenger:players!challenger_id(alias)")
      .eq("challenged_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10);

    if (challenges) {
      for (const c of challenges) {
        const challengerAlias = (c.challenger as unknown as { alias: string })?.alias ?? "Alguien";
        items.push({
          id: `challenge-${c.id}`,
          type: "challenge",
          title: `Reto de ${challengerAlias}`,
          description: `Te desafió por ${c.stars_bet} estrellas`,
          href: "/challenges",
          createdAt: c.created_at,
        });
      }
    }

    // 2. Unseen badge unlocks
    const { data: unseenBadges } = await supabase
      .from("player_badges")
      .select("id, badge_id, unlocked_at")
      .eq("player_id", userId)
      .eq("seen", false)
      .order("unlocked_at", { ascending: false })
      .limit(10);

    if (unseenBadges) {
      for (const pb of unseenBadges) {
        const def = BADGE_DEFINITIONS.find((b) => b.id === pb.badge_id);
        items.push({
          id: `badge-${pb.id}`,
          type: "badge",
          title: `${def?.icon ?? ""} ${def?.name ?? "Medalla"}`,
          description: def?.description ?? "Desbloqueaste una medalla",
          href: "/profile",
          createdAt: pb.unlocked_at ?? new Date().toISOString(),
        });
      }
    }

    // 3. Unread battle comments on my matches (last 20 comments on my matches, from last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: myMatches } = await supabase
      .from("matches")
      .select("id")
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(20);

    if (myMatches && myMatches.length > 0) {
      const matchIds = myMatches.map((m) => m.id);
      const { data: recentComments } = await supabase
        .from("battle_comments")
        .select("id, match_id, player_id, content, created_at, player:players!player_id(alias)")
        .in("match_id", matchIds)
        .neq("player_id", userId)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentComments) {
        for (const comment of recentComments) {
          const commenterAlias = (comment.player as unknown as { alias: string })?.alias ?? "Alguien";
          items.push({
            id: `comment-${comment.id}`,
            type: "comment",
            title: `Comentario de ${commenterAlias}`,
            description: comment.content.slice(0, 60) + (comment.content.length > 60 ? "..." : ""),
            href: "/feed",
            createdAt: comment.created_at,
          });
        }
      }
    }

    // Sort by date
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setNotifications(items);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const count = notifications.length;

  function getNotificationIcon(type: string) {
    switch (type) {
      case "challenge":
        return <Zap className="size-4 text-omega-red" />;
      case "badge":
        return <Award className="size-4 text-omega-gold" />;
      case "comment":
        return <MessageCircle className="size-4 text-omega-blue" />;
      default:
        return <Bell className="size-4 text-omega-muted" />;
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative size-10 rounded-xl bg-omega-card border border-omega-border/30 flex items-center justify-center hover:bg-omega-card-hover transition-colors"
      >
        <Bell className="size-5 text-omega-muted" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 size-5 rounded-full bg-omega-red text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-omega-red/40 animate-pulse">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-2xl bg-omega-card border border-omega-border/30 shadow-xl shadow-black/40 z-50">
          <div className="px-4 py-3 border-b border-omega-border/20">
            <p className="text-sm font-bold text-omega-text">Notificaciones</p>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="size-8 text-omega-muted/20 mx-auto mb-2" />
              <p className="text-xs text-omega-muted/70">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-omega-border/10">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-omega-surface/50 transition-colors"
                >
                  <div className="size-8 rounded-lg bg-omega-dark border border-omega-border/30 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-omega-text truncate">{notif.title}</p>
                    <p className="text-xs text-omega-muted truncate">{notif.description}</p>
                  </div>
                  <span className="text-[10px] text-omega-muted/60 shrink-0">{timeAgo(notif.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
