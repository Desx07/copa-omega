"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceUser {
  user_id: string;
  alias: string;
  avatar_url: string | null;
}

interface PresenceContextValue {
  onlineUsers: Map<string, PresenceUser>;
  onlineCount: number;
  isOnline: (playerId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUsers: new Map(),
  onlineCount: 0,
  isOnline: () => false,
});

export function usePresence() {
  return useContext(PresenceContext);
}

interface PresenceProviderProps {
  children: ReactNode;
  userId: string;
  alias: string;
  avatarUrl: string | null;
}

export function PresenceProvider({
  children,
  userId,
  alias,
  avatarUrl,
}: PresenceProviderProps) {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(
    new Map()
  );
  const channelRef = useRef<RealtimeChannel | null>(null);

  const isOnline = useCallback(
    (playerId: string) => onlineUsers.has(playerId),
    [onlineUsers]
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel("online-presence", {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = new Map<string, PresenceUser>();

        for (const [, presences] of Object.entries(state)) {
          for (const presence of presences) {
            users.set(presence.user_id, {
              user_id: presence.user_id,
              alias: presence.alias,
              avatar_url: presence.avatar_url,
            });
          }
        }

        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setOnlineUsers((prev) => {
          const next = new Map(prev);
          for (const p of newPresences as PresenceUser[]) {
            next.set(p.user_id, { user_id: p.user_id, alias: p.alias, avatar_url: p.avatar_url });
          }
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setOnlineUsers((prev) => {
          const next = new Map(prev);
          for (const p of leftPresences as PresenceUser[]) {
            next.delete(p.user_id);
          }
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track self
          await channel.track({
            user_id: userId,
            alias,
            avatar_url: avatarUrl,
          });
          // Ensure self is in the map immediately after tracking
          setOnlineUsers((prev) => {
            if (prev.has(userId)) return prev;
            const next = new Map(prev);
            next.set(userId, { user_id: userId, alias, avatar_url: avatarUrl });
            return next;
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <PresenceContext.Provider
      value={{
        onlineUsers,
        onlineCount: onlineUsers.size,
        isOnline,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}
