"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_TOURNAMENT_MODE,
  isTournamentMode,
  type TournamentMode,
} from "@/lib/tournament-mode";

// Hook client para leer la modalidad activa (espeja useTeamsEnabled).
// Usar solo en client components; los server components deben usar getTournamentMode().
export function useTournamentMode() {
  const [mode, setMode] = useState<TournamentMode>(DEFAULT_TOURNAMENT_MODE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => {
        const value = d?.tournament_mode;
        if (typeof value === "string" && isTournamentMode(value)) {
          setMode(value);
        }
      })
      .catch(() => setMode(DEFAULT_TOURNAMENT_MODE))
      .finally(() => setLoading(false));
  }, []);

  return { mode, loading };
}
