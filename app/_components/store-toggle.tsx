"use client";

import { useState, useEffect } from "react";
import { Store, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function StoreToggle() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/settings/store")
      .then((r) => r.json())
      .then((d) => setEnabled(d.enabled))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle() {
    setToggling(true);
    try {
      const res = await fetch("/api/settings/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled);
        toast.success(data.enabled ? "Tienda habilitada" : "Tienda deshabilitada");
      }
    } catch {
      toast.error("Error cambiando estado de la tienda");
    }
    setToggling(false);
  }

  if (loading) return null;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-omega-border/40 bg-omega-card/30 backdrop-blur-sm p-4">
      <div className="flex items-center gap-3">
        <Store className={`size-5 ${enabled ? "text-omega-green" : "text-omega-red"}`} />
        <div>
          <p className="text-sm font-bold text-omega-text">Tienda</p>
          <p className="text-xs text-omega-muted">{enabled ? "Visible para todos" : "Cerrada (mantenimiento)"}</p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`w-12 h-7 rounded-full transition-all relative ${enabled ? "bg-omega-green" : "bg-omega-border"} disabled:opacity-50`}
      >
        {toggling ? (
          <Loader2 className="size-4 animate-spin text-white absolute top-1.5 left-4" />
        ) : (
          <div className={`size-5 rounded-full bg-white absolute top-1 transition-all ${enabled ? "left-6" : "left-1"}`} />
        )}
      </button>
    </div>
  );
}
