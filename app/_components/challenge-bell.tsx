"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function ChallengeBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const supabase = createClient();
      const { count: pendingCount } = await supabase
        .from("challenges")
        .select("id", { count: "exact", head: true })
        .eq("challenged_id", userId)
        .eq("status", "pending");

      setCount(pendingCount ?? 0);
    }

    fetchCount();
  }, [userId]);

  return (
    <Link
      href="/challenges"
      className="relative size-10 rounded-xl bg-omega-card border border-omega-border/30 flex items-center justify-center hover:bg-omega-card-hover transition-colors"
    >
      <Bell className="size-5 text-omega-muted" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 size-5 rounded-full bg-omega-red text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-omega-red/40 animate-pulse">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
