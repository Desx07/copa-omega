"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReorderButtonsProps {
  tournamentId: string;
  isFirst: boolean;
  isLast: boolean;
}

export default function ReorderButtons({
  tournamentId,
  isFirst,
  isLast,
}: ReorderButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReorder(direction: "up" | "down") {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tournaments/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId, direction }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error");
        return;
      }
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleReorder("up");
        }}
        disabled={loading || isFirst}
        className="omega-btn omega-btn-secondary !p-0 size-6 !rounded disabled:opacity-30"
        title="Mover arriba"
      >
        {loading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <ChevronUp className="size-3" />
        )}
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleReorder("down");
        }}
        disabled={loading || isLast}
        className="omega-btn omega-btn-secondary !p-0 size-6 !rounded disabled:opacity-30"
        title="Mover abajo"
      >
        {loading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <ChevronDown className="size-3" />
        )}
      </button>
    </div>
  );
}
