"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface OnlineUser {
  id: string;
  alias: string;
  avatar_url: string | null;
}

const POLL_INTERVAL = 30_000; // 30 seconds
const MAX_VISIBLE = 8;

export default function OnlineUsers() {
  const [users, setUsers] = useState<OnlineUser[]>([]);

  const fetchOnline = useCallback(() => {
    fetch("/api/presence")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchOnline();
    const interval = setInterval(fetchOnline, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOnline]);

  if (users.length === 0) return null;

  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = users.length - MAX_VISIBLE;

  return (
    <div className="omega-card px-4 py-3 space-y-2">
      {/* Header: green dot + count */}
      <div className="flex items-center gap-2">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full rounded-full bg-omega-green opacity-75 animate-ping" />
          <span className="relative inline-flex size-2.5 rounded-full bg-omega-green" />
        </span>
        <span className="text-xs font-bold text-omega-text">
          {users.length} online
        </span>
      </div>

      {/* Avatar row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {visible.map((u) => (
          <Link
            key={u.id}
            href={`/player/${u.id}`}
            title={u.alias}
            className="size-8 rounded-full border-2 border-omega-purple/40 overflow-hidden bg-omega-dark shrink-0 hover:border-omega-purple transition-colors"
          >
            {u.avatar_url ? (
              <img
                src={u.avatar_url}
                alt={u.alias}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                {u.alias.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        ))}
        {overflow > 0 && (
          <div className="size-8 rounded-full border-2 border-omega-border/30 bg-omega-dark flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-omega-muted">
              +{overflow}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
