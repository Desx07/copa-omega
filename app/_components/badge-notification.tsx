"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { BADGE_DEFINITIONS } from "@/lib/badges";

/**
 * Client component that checks for unseen badges on mount.
 * Shows a toast notification for each unseen badge and marks them as seen.
 * Place in a layout that wraps authenticated pages.
 */
export default function BadgeNotification() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checked) return;
    setChecked(true);

    async function checkUnseenBadges() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch unseen badges
      const { data: unseenBadges, error } = await supabase
        .from("player_badges")
        .select("id, badge_id")
        .eq("player_id", user.id)
        .eq("seen", false);

      if (error || !unseenBadges || unseenBadges.length === 0) return;

      // Show a toast for each unseen badge
      for (const pb of unseenBadges) {
        const def = BADGE_DEFINITIONS.find((b) => b.id === pb.badge_id);
        if (def) {
          // Stagger toast notifications slightly
          setTimeout(() => {
            toast.success(`${def.icon} ${def.name}`, {
              description: def.description,
              duration: 5000,
            });
          }, 300);
        }
      }

      // Mark all as seen
      const ids = unseenBadges.map((b) => b.id);
      await supabase
        .from("player_badges")
        .update({ seen: true })
        .in("id", ids);
    }

    checkUnseenBadges();
  }, [checked]);

  return null;
}
