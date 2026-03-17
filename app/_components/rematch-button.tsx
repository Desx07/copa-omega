"use client";

import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RematchButtonProps {
  opponentId: string;
  starsBet: number;
}

export default function RematchButton({ opponentId, starsBet }: RematchButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRematch() {
    setLoading(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenged_id: opponentId,
          stars_bet: starsBet,
          message: "Revancha!",
        }),
      });
      if (res.ok) {
        toast.success("Revancha enviada!");
        setSent(true);
      } else {
        const data = await res.json();
        toast.error(data.error || "Error");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  if (sent) return <span className="text-[9px] text-omega-green font-bold">Enviada</span>;

  return (
    <button
      onClick={handleRematch}
      disabled={loading}
      className="omega-btn omega-btn-secondary !px-2 !py-1 text-[9px] !rounded-md gap-1"
      title="Pedir revancha"
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
      Revancha
    </button>
  );
}
