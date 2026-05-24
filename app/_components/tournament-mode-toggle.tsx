"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Swords, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_TOURNAMENT_MODE,
  isTournamentMode,
  type TournamentMode,
} from "@/lib/tournament-mode";

// Config visual de cada modalidad
const MODE_CONFIG: Record<
  TournamentMode,
  { label: string; desc: string; icon: typeof Star; color: string; activeBg: string }
> = {
  copa_omega: {
    label: "Copa Omega",
    desc: "Estrellas: apostás 1-5 por batalla, top 16",
    icon: Star,
    color: "text-omega-gold",
    activeBg: "bg-gradient-to-br from-omega-gold to-omega-gold-glow",
  },
  ascenso: {
    label: "Ascenso",
    desc: "Rangos F→S: subí de rango ganando combates",
    icon: Swords,
    color: "text-omega-purple",
    activeBg: "bg-gradient-to-br from-omega-purple to-omega-blue",
  },
  liga: {
    label: "Liga",
    desc: "Liga por equipos con tabla de posiciones",
    icon: Users,
    color: "text-omega-green",
    activeBg: "bg-gradient-to-br from-omega-green to-omega-blue",
  },
};

const MODES: TournamentMode[] = ["copa_omega", "ascenso", "liga"];

export function TournamentModeToggle() {
  const router = useRouter();
  const [mode, setMode] = useState<TournamentMode>(DEFAULT_TOURNAMENT_MODE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<TournamentMode | null>(null);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => {
        const value = d?.tournament_mode;
        if (typeof value === "string" && isTournamentMode(value)) {
          setMode(value);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(next: TournamentMode) {
    if (next === mode || saving) return;

    const ok = window.confirm(
      `Vas a cambiar la modalidad activa a "${MODE_CONFIG[next].label}". Esto reconfigura la app y la landing para todos. ¿Confirmás?`
    );
    if (!ok) return;

    setSaving(next);
    try {
      const res = await fetch("/api/app-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "tournament_mode", value: next }),
      });
      if (!res.ok) {
        toast.error("Error cambiando la modalidad");
        return;
      }

      // En modo Liga, habilitar equipos automáticamente (flag independiente y visible)
      if (next === "liga") {
        await fetch("/api/app-config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "teams_enabled", value: "true" }),
        });
        toast.success("Modalidad: Liga · Equipos habilitados");
      } else {
        toast.success(`Modalidad: ${MODE_CONFIG[next].label}`);
      }

      setMode(next);
      router.refresh(); // dashboard y landing son server components
    } catch {
      toast.error("Error cambiando la modalidad");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return null;

  return (
    <div className="omega-card !rounded-2xl !p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-omega-text">Modalidad de torneo activa</p>
        <p className="text-xs text-omega-muted">Define qué ven todos en la app y la landing</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => {
          const cfg = MODE_CONFIG[m];
          const Icon = cfg.icon;
          const active = m === mode;
          const isSaving = saving === m;
          return (
            <button
              key={m}
              onClick={() => handleSelect(m)}
              disabled={!!saving}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all active:scale-[0.98] disabled:opacity-60 ${
                active
                  ? `${cfg.activeBg} shadow-md`
                  : "bg-omega-card border border-omega-border/40 hover:border-omega-border"
              }`}
            >
              <div
                className={`size-9 rounded-lg flex items-center justify-center ${
                  active ? "bg-white/20" : "bg-black/20"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin text-white" />
                ) : (
                  <Icon className={`size-4 ${active ? "text-white" : cfg.color}`} />
                )}
              </div>
              <span className={`text-[11px] font-bold ${active ? "text-white" : "text-omega-text"}`}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-omega-muted leading-relaxed">{MODE_CONFIG[mode].desc}</p>
    </div>
  );
}
