"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Displays a red badge with the count of unread chat messages
 * since the user's last visit to the chat page.
 * Uses localStorage to track last visit timestamp.
 */
export default function ChatUnread({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      const supabase = createClient();

      // Get last visit timestamp from localStorage
      const lastVisit = localStorage.getItem(`chat_last_visit_${userId}`);
      if (!lastVisit) {
        // First time — no unread count to show
        return;
      }

      const { count: unreadCount } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .gt("created_at", lastVisit)
        .neq("player_id", userId);

      setCount(unreadCount ?? 0);
    }

    fetchUnread();
  }, [userId]);

  if (count <= 0) return null;

  return (
    <span className="absolute -top-1 -right-1 size-5 rounded-full bg-omega-red text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-omega-red/40">
      {count > 99 ? "99+" : count}
    </span>
  );
}
