"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface PresenceContextValue {
  onlineCount: number;
  isOnline: (playerId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineCount: 1,
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

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const POLL_INTERVAL = 30_000; // 30 seconds

export function PresenceProvider({
  children,
  userId,
}: PresenceProviderProps) {
  const [onlineCount, setOnlineCount] = useState(1); // at least self

  const isOnline = useCallback(
    (playerId: string) => playerId === userId,
    [userId]
  );

  useEffect(() => {
    // Send heartbeat immediately and then every 30s
    function heartbeat() {
      fetch("/api/presence", { method: "POST" }).catch(() => {});
    }

    // Poll online count
    function pollCount() {
      fetch("/api/presence")
        .then((r) => r.json())
        .then((data) => {
          if (data.online != null) setOnlineCount(Math.max(1, data.online));
        })
        .catch(() => {});
    }

    // Fire immediately
    heartbeat();
    pollCount();

    const hbInterval = setInterval(heartbeat, HEARTBEAT_INTERVAL);
    const pollInterval = setInterval(pollCount, POLL_INTERVAL);

    return () => {
      clearInterval(hbInterval);
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <PresenceContext.Provider
      value={{ onlineCount, isOnline }}
    >
      {children}
    </PresenceContext.Provider>
  );
}
