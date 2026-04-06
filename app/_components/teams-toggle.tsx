"use client";

import { useState, useEffect } from "react";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TeamsToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => setEnabled(d.teams_enabled === "true"))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle() {
    setToggling(true);
    const newValue = !enabled;
    try {
      const res = await fetch("/api/app-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "teams_enabled", value: newValue ? "true" : "false" }),
      });
      if (res.ok) {
        setEnabled(newValue);
        toast.success(`Equipos: ${newValue ? "Habilitados" : "Deshabilitados"}`);
      }
    } catch {
      toast.error("Error cambiando estado");
    }
    setToggling(false);
  }

  if (loading) return null;

  return (
    <div className={`omega-card shadow-sm border-l-4 ${enabled ? "border-l-omega-green" : "border-l-omega-red"} !rounded-2xl !p-4 flex items-center gap-3 transition-all hover:shadow-md`}>
      <Users className={`size-5 ${enabled ? "text-omega-green" : "text-omega-red"}`} />
      <div className="flex-1">
        <p className="text-sm font-bold text-omega-text">
          Equipos: <span className={enabled ? "text-omega-green" : "text-omega-red"}>
            {enabled ? "Habilitados" : "Deshabilitados"}
          </span>
        </p>
        <p className="text-xs text-omega-muted">
          {enabled ? "Los jugadores pueden crear equipos y jugar partidas de equipo" : "Las funciones de equipo estan ocultas"}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={toggling}
        className="omega-btn omega-btn-secondary px-3 py-1.5 text-xs shadow-sm hover:shadow-md"
      >
        {toggling ? <Loader2 className="size-3 animate-spin" /> : "Cambiar"}
      </button>
    </div>
  );
}

// Hook para verificar si equipos estan habilitados
export function useTeamsEnabled() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => setEnabled(d.teams_enabled === "true"))
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, []);

  return { enabled, loading };
}
