"use client";

import { useState, useEffect } from "react";
import { Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";

// La wallet arranca HABILITADA salvo que el flag esté explícitamente en "false".
// Así, si nunca se tocó el toggle, se comporta como siempre (monedas visibles).

export function WalletToggle() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => setEnabled(d.wallet_enabled !== "false"))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle() {
    setToggling(true);
    const newValue = !enabled;
    try {
      const res = await fetch("/api/app-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "wallet_enabled", value: newValue ? "true" : "false" }),
      });
      if (res.ok) {
        setEnabled(newValue);
        toast.success(`Wallet: ${newValue ? "Habilitada" : "Deshabilitada"}`);
      } else {
        const msg = await res.json().then((d) => d?.error as string | undefined).catch(() => undefined);
        console.error("Error cambiando estado de wallet:", res.status, msg);
        toast.error(msg ?? "No se pudo cambiar el estado de la wallet");
      }
    } catch (err) {
      console.error("Error de red cambiando estado de wallet:", err);
      toast.error("Error de conexión cambiando estado");
    }
    setToggling(false);
  }

  if (loading) return null;

  return (
    <div className={`omega-card shadow-sm border-l-4 ${enabled ? "border-l-omega-gold" : "border-l-omega-red"} !rounded-2xl !p-4 flex items-center gap-3 transition-all hover:shadow-md`}>
      <Coins className={`size-5 ${enabled ? "text-omega-gold" : "text-omega-red"}`} />
      <div className="flex-1">
        <p className="text-sm font-bold text-omega-text">
          Wallet: <span className={enabled ? "text-omega-gold" : "text-omega-red"}>
            {enabled ? "Habilitada" : "Deshabilitada"}
          </span>
        </p>
        <p className="text-xs text-omega-muted">
          {enabled ? "Los jugadores ven sus Omega Coins, vouchers y tickets" : "La wallet y las monedas están ocultas"}
        </p>
      </div>
      {/* Switch on/off: prendido = Habilitada, apagado = Deshabilitada */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        role="switch"
        aria-checked={enabled}
        aria-label="Prender o apagar la wallet"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          enabled ? "bg-omega-green" : "bg-omega-border/60"
        } ${toggling ? "opacity-60" : ""}`}
      >
        {toggling ? (
          <Loader2 className="size-3 animate-spin text-white mx-auto" />
        ) : (
          <span
            className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        )}
      </button>
    </div>
  );
}

// Hook para verificar si la wallet está habilitada (default: true).
export function useWalletEnabled() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => setEnabled(d.wallet_enabled !== "false"))
      .catch(() => setEnabled(true))
      .finally(() => setLoading(false));
  }, []);

  return { enabled, loading };
}
