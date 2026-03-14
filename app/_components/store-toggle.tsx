"use client";

import { useState, useEffect } from "react";
import { Store, Loader2 } from "lucide-react";
import { toast } from "sonner";

type StoreStatus = "open" | "closed" | "hidden";

const statusConfig: Record<StoreStatus, { label: string; desc: string; color: string; borderColor: string; next: StoreStatus }> = {
  open: { label: "Abierta", desc: "Visible y operativa", color: "text-omega-green", borderColor: "border-l-omega-green", next: "closed" },
  closed: { label: "Cerrada", desc: "Se ve el cartel de mantenimiento", color: "text-omega-gold", borderColor: "border-l-omega-gold", next: "hidden" },
  hidden: { label: "Oculta", desc: "No aparece en el dashboard", color: "text-omega-red", borderColor: "border-l-omega-red", next: "open" },
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
    <div className={`omega-card shadow-sm border-l-4 ${config.borderColor} !rounded-2xl !p-4 flex items-center gap-3 transition-all hover:shadow-md`}>
      <Store className={`size-5 ${config.color}`} />
      <div className="flex-1">
        <p className="text-sm font-bold text-omega-text">Tienda: <span className={config.color}>{config.label}</span></p>
        <p className="text-xs text-omega-muted">{config.desc}</p>
      </div>
      <button
        onClick={handleCycle}
        disabled={toggling}
        className="omega-btn omega-btn-secondary px-3 py-1.5 text-xs shadow-sm hover:shadow-md"
      >
        {toggling ? <Loader2 className="size-3 animate-spin" /> : "Cambiar"}
      </button>
    </div>
  );
}

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
