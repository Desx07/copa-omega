"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Swords, Users, Loader2, Check, Radio } from "lucide-react";
import { toast } from "sonner";
import {
  TOURNAMENT_MODES,
  enabledKeyFor,
  LANDING_FEATURED_KEY,
  type TournamentMode,
} from "@/lib/tournament-mode";

const MODE_META: Record<TournamentMode, { label: string; desc: string; icon: typeof Star; color: string }> = {
  copa_omega: { label: "Copa Omega", desc: "Estrellas · top 16", icon: Star, color: "text-omega-gold" },
  ascenso: { label: "Ascenso", desc: "Rangos F→S individual", icon: Swords, color: "text-omega-purple" },
  liga: { label: "Liga", desc: "Torneo por equipos", icon: Users, color: "text-omega-green" },
};

export function TournamentModeToggle() {
  const router = useRouter();
  const [active, setActive] = useState<Record<TournamentMode, boolean>>({
    copa_omega: true,
    ascenso: false,
    liga: false,
  });
  const [featured, setFeatured] = useState<TournamentMode>("copa_omega");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => {
        setActive({
          copa_omega: d?.mode_copa_omega_enabled !== "false", // default on
          ascenso: d?.mode_ascenso_enabled === "true",
          liga: d?.mode_liga_enabled === "true",
        });
        const f = d?.[LANDING_FEATURED_KEY];
        if (f === "copa_omega" || f === "ascenso" || f === "liga") setFeatured(f);
      })
      .finally(() => setLoading(false));
  }, []);

  async function patch(key: string, value: string) {
    const res = await fetch("/api/app-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  }

  async function toggleActive(mode: TournamentMode) {
    if (busy) return;
    const next = !active[mode];
    // No permitir apagar la modalidad que está destacada en la landing.
    if (!next && featured === mode) {
      toast.error("No podés apagar la modalidad destacada. Cambiá la destacada primero.");
      return;
    }
    setBusy(`active-${mode}`);
    if (await patch(enabledKeyFor(mode), next ? "true" : "false")) {
      // En modo Liga, los equipos dependen del flag teams_enabled: lo acompañamos.
      if (mode === "liga") await patch("teams_enabled", next ? "true" : "false");
      setActive((p) => ({ ...p, [mode]: next }));
      toast.success(`${MODE_META[mode].label}: ${next ? "activada" : "desactivada"}`);
      router.refresh();
    } else {
      toast.error("Error cambiando el estado");
    }
    setBusy(null);
  }

  async function setAsFeatured(mode: TournamentMode) {
    if (busy || featured === mode) return;
    if (!active[mode]) {
      toast.error("Activá la modalidad antes de destacarla en la landing.");
      return;
    }
    setBusy(`feat-${mode}`);
    if (await patch(LANDING_FEATURED_KEY, mode)) {
      setFeatured(mode);
      toast.success(`Landing: ahora muestra ${MODE_META[mode].label}`);
      router.refresh();
    } else {
      toast.error("Error cambiando la destacada");
    }
    setBusy(null);
  }

  if (loading) return null;

  return (
    <div className="omega-card !rounded-2xl !p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-omega-text">Modalidades de torneo</p>
        <p className="text-xs text-omega-muted">
          Activá las que quieras (conviven adentro). La <span className="font-bold">destacada</span> es la que se ve en la landing.
        </p>
      </div>

      <div className="space-y-2">
        {TOURNAMENT_MODES.map((mode) => {
          const meta = MODE_META[mode];
          const Icon = meta.icon;
          const on = active[mode];
          const isFeat = featured === mode;
          return (
            <div
              key={mode}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                on ? "border-omega-border/60 bg-omega-card/40" : "border-omega-border/25 bg-transparent"
              }`}
            >
              <Icon className={`size-5 shrink-0 ${meta.color} ${on ? "" : "opacity-40"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${on ? "text-omega-text" : "text-omega-muted"}`}>{meta.label}</p>
                <p className="text-[11px] text-omega-muted/80 truncate">{meta.desc}</p>
              </div>

              {/* Destacar en landing — solo si la modalidad está activa */}
              {on && (
                <button
                  onClick={() => setAsFeatured(mode)}
                  disabled={!!busy || isFeat}
                  title="Mostrar esta modalidad en la landing"
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all disabled:cursor-default ${
                    isFeat
                      ? "bg-omega-purple/25 text-omega-purple ring-1 ring-inset ring-omega-purple/40"
                      : "bg-omega-elevated text-omega-muted hover:text-omega-text"
                  }`}
                >
                  {busy === `feat-${mode}` ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : isFeat ? (
                    <Check className="size-3" />
                  ) : (
                    <Radio className="size-3" />
                  )}
                  {isFeat ? "Landing" : "Destacar"}
                </button>
              )}

              {/* Switch on/off */}
              <button
                onClick={() => toggleActive(mode)}
                disabled={!!busy}
                role="switch"
                aria-checked={on}
                title={on ? "Desactivar" : "Activar"}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60 ${
                  on ? "bg-omega-green" : "bg-omega-elevated border border-omega-border"
                }`}
              >
                <span
                  className={`absolute top-1/2 size-[18px] -translate-y-1/2 rounded-full bg-white shadow-md transition-all duration-200 ${
                    on ? "left-[calc(100%-20px)]" : "left-[2px]"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
