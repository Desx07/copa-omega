"use client";

import { useState, useEffect } from "react";
import { Store, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Tienda: 2 estados. "Abierta" = visible en el dashboard; "Apagada" = fuera del
// dashboard (se guarda como "hidden" en la DB, que es lo que oculta el botón y
// la sección). El estado legacy "closed" se normaliza a "Abierta".
type StoreStatus = "open" | "hidden";

function normalize(raw: string | undefined): StoreStatus {
  return raw === "hidden" ? "hidden" : "open";
}

const statusConfig: Record<StoreStatus, { label: string; desc: string; color: string; borderColor: string; next: StoreStatus }> = {
  open: { label: "Abierta", desc: "Visible en el dashboard", color: "text-omega-green", borderColor: "border-l-omega-green", next: "hidden" },
  hidden: { label: "Apagada", desc: "No aparece en el dashboard", color: "text-omega-red", borderColor: "border-l-omega-red", next: "open" },
};

export function StoreToggle() {
  const [status, setStatus] = useState<StoreStatus>("open");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/settings/store")
      .then((r) => r.json())
      .then((d) => setStatus(normalize(d.status)))
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
      } else {
        // Respuesta HTTP de error (403/500/etc): leemos el mensaje del body.
        const msg = await res
          .json()
          .then((d) => d?.error as string | undefined)
          .catch(() => undefined);
        console.error("Error cambiando estado de la tienda:", res.status, msg);
        toast.error(msg ?? "No se pudo cambiar el estado de la tienda");
      }
    } catch (err) {
      console.error("Error de red cambiando estado de la tienda:", err);
      toast.error("Error de conexión cambiando estado");
    }
    setToggling(false);
  }

  if (loading) return null;

  const config = statusConfig[status];
  const isOn = status === "open";

  return (
    <div className={`omega-card shadow-sm border-l-4 ${config.borderColor} !rounded-2xl !p-4 flex items-center gap-3 transition-all hover:shadow-md`}>
      <Store className={`size-5 ${config.color}`} />
      <div className="flex-1">
        <p className="text-sm font-bold text-omega-text">Tienda: <span className={config.color}>{config.label}</span></p>
        <p className="text-xs text-omega-muted">{config.desc}</p>
      </div>
      {/* Switch on/off: prendido = Abierta, apagado = Apagada */}
      <button
        onClick={handleCycle}
        disabled={toggling}
        role="switch"
        aria-checked={isOn}
        aria-label="Prender o apagar la tienda"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          isOn ? "bg-omega-green" : "bg-omega-border/60"
        } ${toggling ? "opacity-60" : ""}`}
      >
        {toggling ? (
          <Loader2 className="size-3 animate-spin text-white mx-auto" />
        ) : (
          <span
            className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
              isOn ? "translate-x-6" : "translate-x-1"
            }`}
          />
        )}
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
      .then((d) => setStatus(normalize(d.status)))
      .finally(() => setLoading(false));
  }, []);

  return { status, loading };
}
