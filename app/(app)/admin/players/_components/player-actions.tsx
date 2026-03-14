"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, Trash2, Loader2, Scale } from "lucide-react";
import { toast } from "sonner";

interface PlayerActionsProps {
  playerId: string;
  isHidden: boolean;
  isJudge: boolean;
  alias: string;
}

export function PlayerActions({ playerId, isHidden, isJudge, alias }: PlayerActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"hide" | "delete" | "judge" | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleToggleHidden() {
    setLoading("hide");
    try {
      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_hidden: !isHidden }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error");
        return;
      }
      toast.success(isHidden ? `${alias} visible en ranking` : `${alias} oculto del ranking`);
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(null);
    }
  }

  async function handleToggleJudge() {
    setLoading("judge");
    try {
      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_judge: !isJudge }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error");
        return;
      }
      toast.success(isJudge ? `${alias} ya no es juez` : `${alias} es ahora juez`);
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/players/${playerId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error");
        return;
      }
      toast.success(`${alias} eliminado`);
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(null);
      setShowConfirm(false);
    }
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* Toggle judge */}
      <button
        onClick={handleToggleJudge}
        disabled={loading !== null}
        title={isJudge ? "Quitar rol de juez" : "Hacer juez"}
        className={`omega-btn size-8 !rounded-lg !p-0 ${
          isJudge
            ? "omega-btn-gold !shadow-none"
            : "omega-btn-secondary"
        } disabled:opacity-50`}
      >
        {loading === "judge" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Scale className="size-4" />
        )}
      </button>

      {/* Toggle hidden */}
      <button
        onClick={handleToggleHidden}
        disabled={loading !== null}
        title={isHidden ? "Mostrar en ranking" : "Ocultar del ranking"}
        className={`omega-btn size-8 !rounded-lg !p-0 ${
          isHidden
            ? "omega-btn-green !shadow-none"
            : "omega-btn-secondary"
        } disabled:opacity-50`}
      >
        {loading === "hide" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isHidden ? (
          <Eye className="size-4" />
        ) : (
          <EyeOff className="size-4" />
        )}
      </button>

      {/* Delete */}
      {showConfirm ? (
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={loading !== null}
            className="omega-btn omega-btn-red px-2 py-1 text-[10px]"
          >
            {loading === "delete" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              "CONFIRMAR"
            )}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="omega-btn omega-btn-secondary px-2 py-1 text-[10px]"
          >
            NO
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading !== null}
          title="Eliminar jugador"
          className="omega-btn omega-btn-secondary size-8 !rounded-lg !p-0 hover:!bg-omega-red/20 hover:!text-omega-red disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
