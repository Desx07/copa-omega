"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Client component that silently tracks daily login streaks.
 * On mount: checks if today's login is already recorded.
 * If not, inserts into daily_logins and updates the player's streak.
 * Then triggers a badge check for streak badges.
 */
export function StreakTracker() {
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (tracked) return;
    setTracked(true);

    async function trackLogin() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's date in YYYY-MM-DD format (local timezone)
      const today = new Date().toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD

      // Check if already logged today
      const { data: existing } = await supabase
        .from("daily_logins")
        .select("login_date")
        .eq("player_id", user.id)
        .eq("login_date", today)
        .maybeSingle();

      if (existing) return; // Already tracked today

      // Insert today's login
      const { error: insertError } = await supabase
        .from("daily_logins")
        .insert({ player_id: user.id, login_date: today });

      if (insertError) {
        // Might be a duplicate key race condition — safe to ignore
        return;
      }

      // Get player's current streak info
      const { data: player } = await supabase
        .from("players")
        .select("current_login_streak, max_login_streak, last_login_date")
        .eq("id", user.id)
        .single();

      if (!player) return;

      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString("en-CA");

      let newStreak: number;
      if (player.last_login_date === yesterdayStr) {
        // Consecutive day — increment streak
        newStreak = player.current_login_streak + 1;
      } else if (player.last_login_date === today) {
        // Same day — no change (shouldn't reach here but safety)
        return;
      } else {
        // Streak broken — reset to 1
        newStreak = 1;
      }

      const newMax = Math.max(newStreak, player.max_login_streak);

      // Update player streak
      await supabase
        .from("players")
        .update({
          current_login_streak: newStreak,
          max_login_streak: newMax,
          last_login_date: today,
        })
        .eq("id", user.id);

      // Check streak badges
      if (newStreak >= 3) {
        await fetch("/api/badges/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player_id: user.id }),
        });
      }
    }

    trackLogin();
  }, [tracked]);

  return null;
}
