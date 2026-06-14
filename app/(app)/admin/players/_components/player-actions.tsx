"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, Trash2, Loader2, Scale } from "lucide-react";
import { toast } from "sonner";

interface PlayerActionsProps {
  playerId: string;
  isHidden: boolean;
  isJudge: boolean;
  ascensoEnabled: boolean;
  alias: string;
}

export function PlayerActions({ playerId, isHidden, isJudge, ascensoEnabled, alias }: PlayerActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"hide" | "delete" | "judge" | "ascenso" | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  // Estado optimista local del flag de ascenso: se actualiza ni bien se clickea
  // y se revierte si el PATCH falla.
  const [ascenso, setAscenso] = useState(ascensoEnabled);

  async function handleToggleAscenso() {
    const next = !ascenso;
    setLoading("ascenso");
    setAscenso(next); // optimista
    try {
      const res = await fetch(`/api/admin/players/${playerId}/ascenso`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || `Error ${res.status} al cambiar ascenso`);
        setAscenso(!next); // revert
        return;
      }
      const data = await res.json();
      // Sincronizamos con lo que devolvió el server (fuente de verdad).
      setAscenso(Boolean(data.ascenso_enabled));
      toast.success(
        data.ascenso_enabled
          ? `${alias} habilitado para Ascenso`
          : `${alias} deshabilitado de Ascenso`
      );
      router.refresh();
    } catch {
      toast.error("Error de conexión");
      setAscenso(!next); // revert
    } finally {
      setLoading(null);
    }
  }

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
      toast.error("Error de conexión");
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
      toast.error("Error de conexión");
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
      toast.error("Error de conexión");
    } finally {
      setLoading(null);
      setShowConfirm(false);
    }
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* Switch ascenso — habilita/deshabilita la participación en el Torneo de Ascenso */}
      <button
        onClick={handleToggleAscenso}
        disabled={loading !== null}
        role="switch"
        aria-checked={ascenso}
        aria-label={ascenso ? `Deshabilitar a ${alias} de Ascenso` : `Habilitar a ${alias} en Ascenso`}
        title={ascenso ? "Deshabilitar de Ascenso" : "Habilitar para Ascenso"}
        data-testid="ascenso-toggle"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60 ${
          ascenso ? "bg-omega-green" : "bg-omega-elevated border border-omega-border"
        }`}
      >
        <span
          className={`absolute top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 ${
            ascenso ? "left-[calc(100%-20px)]" : "left-[2px]"
          }`}
        >
          {loading === "ascenso" && (
            <Loader2 className="size-3 animate-spin text-omega-dark" />
          )}
        </span>
      </button>

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
