"use client";

import { useState, useEffect } from "react";
import { Store, Loader2 } from "lucide-react";
import { toast } from "sonner";

type StoreStatus = "open" | "closed" | "hidden";

const statusConfig: Record<StoreStatus, { label: string; desc: string; color: string; next: StoreStatus }> = {
  open: { label: "Abierta", desc: "Visible y operativa", color: "text-omega-green", next: "closed" },
  closed: { label: "Cerrada", desc: "Se ve el cartel de mantenimiento", color: "text-omega-gold", next: "hidden" },
  hidden: { label: "Oculta", desc: "No aparece en el dashboard", color: "text-omega-red", next: "open" },
};

export function StoreToggle() {
  const [status, setStatus] = useState<StoreStatus>("open");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/settings/store")
      .then((r) => r.json())
      .then((d) => setStatus(d.status || "open"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCycle() {
    setToggling(true);
    const next = statusConfig[status].next;
    try {
      const res = await fetch("/api/settings/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setStatus(next);
        toast.success(`Tienda: ${statusConfig[next].label}`);
      }
    } catch {
      toast.error("Error cambiando estado");
    }
    setToggling(false);
  }

  if (loading) return null;

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between rounded-2xl border border-omega-border/40 bg-omega-card/30 backdrop-blur-sm p-4">
      <div className="flex items-center gap-3">
        <Store className={`size-5 ${config.color}`} />
        <div>
          <p className="text-sm font-bold text-omega-text">Tienda: <span className={config.color}>{config.label}</span></p>
          <p className="text-xs text-omega-muted">{config.desc}</p>
        </div>
      </div>
      <button
        onClick={handleCycle}
        disabled={toggling}
        className="px-3 py-1.5 rounded-lg border border-omega-border text-xs font-bold text-omega-muted hover:text-omega-text hover:border-omega-purple/50 transition-all disabled:opacity-50"
      >
        {toggling ? <Loader2 className="size-3 animate-spin" /> : "Cambiar"}
      </button>
    </div>
  );
}

// Export for dashboard to check if store button should be shown
export function useStoreStatus() {
  const [status, setStatus] = useState<StoreStatus>("open");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/store")
      .then((r) => r.json())
      .then((d) => setStatus(d.status || "open"))
      .finally(() => setLoading(false));
  }, []);

  return { status, loading };
}
