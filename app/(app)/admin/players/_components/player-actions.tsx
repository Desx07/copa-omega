"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, Trash2, Loader2, Scale, Check, X } from "lucide-react";
import { toast } from "sonner";
import { RANKS, rankInfo, type RankLetter } from "@/lib/ascenso";

interface PlayerActionsProps {
  playerId: string;
  isHidden: boolean;
  isJudge: boolean;
  ascensoEnabled: boolean;
  /** Rango actual del jugador. Tolera migración pendiente: default "F". */
  rankLetter: string;
  alias: string;
}

/** Normaliza un string arbitrario a una RankLetter válida (default "F"). */
function toRankLetter(value: string): RankLetter {
  return RANKS.some((r) => r.letter === value) ? (value as RankLetter) : "F";
}

export function PlayerActions({ playerId, isHidden, isJudge, ascensoEnabled, rankLetter, alias }: PlayerActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"hide" | "delete" | "judge" | "ascenso" | "rank" | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  // Estado optimista local del flag de ascenso: se actualiza ni bien se clickea
  // y se revierte si el PATCH falla.
  const [ascenso, setAscenso] = useState(ascensoEnabled);
  // Rango actual (fuente de verdad tras un cambio) y editor inline.
  const [rank, setRank] = useState<RankLetter>(toRankLetter(rankLetter));
  const [rankSel, setRankSel] = useState<RankLetter>(toRankLetter(rankLetter));
  const [showRank, setShowRank] = useState(false);
  const currentRankInfo = rankInfo(rank);

  // ── Cambio manual de rango. Resetea el ticket del jugador a 0 (por eso confirm). ──
  async function handleChangeRank() {
    if (rankSel === rank) {
      setShowRank(false);
      return;
    }
    const info = rankInfo(rankSel);
    // confirm() explícito: la acción es destructiva (reinicia el ticket).
    if (
      !window.confirm(
        `¿Cambiar el rango de ${alias} a ${rankSel} · ${info.name}?\n\nEsto reinicia su ticket de ascenso a 0.`
      )
    ) {
      return;
    }
    setLoading("rank");
    try {
      const res = await fetch(`/api/admin/players/${playerId}/rank`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rank_letter: rankSel }),
      });
      if (!res.ok) {
        // No tragamos el error: mostramos el body del server tal cual.
        const data = await res.json().catch(() => null);
        toast.error(data?.error || `Error ${res.status} al cambiar el rango`);
        return;
      }
      const data = await res.json();
      const nuevo = toRankLetter(String(data.rank_letter ?? rankSel));
      setRank(nuevo);
      setRankSel(nuevo);
      setShowRank(false);
      toast.success(`${alias} ahora es rango ${nuevo} · ${rankInfo(nuevo).name}`);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(null);
    }
  }

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
      {/* Rango actual + cambio manual (inline, patrón del confirm de borrado) */}
      {showRank ? (
        <div className="flex items-center gap-1">
          <select
            value={rankSel}
            onChange={(e) => setRankSel(e.target.value as RankLetter)}
            disabled={loading !== null}
            aria-label={`Nuevo rango para ${alias}`}
            data-testid="rank-select"
            className="h-8 rounded-lg border border-omega-border bg-omega-elevated px-1.5 text-xs font-bold text-omega-text focus:outline-none focus:ring-1 focus:ring-omega-purple disabled:opacity-60"
          >
            {RANKS.map((r) => (
              <option key={r.letter} value={r.letter}>
                {r.letter} · {r.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleChangeRank}
            disabled={loading !== null || rankSel === rank}
            title="Cambiar rango"
            aria-label={`Cambiar rango de ${alias}`}
            data-testid="rank-save"
            className="omega-btn omega-btn-purple size-8 !rounded-lg !p-0 disabled:opacity-50"
          >
            {loading === "rank" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
          </button>
          <button
            onClick={() => {
              setRankSel(rank);
              setShowRank(false);
            }}
            disabled={loading !== null}
            title="Cancelar"
            aria-label="Cancelar cambio de rango"
            className="omega-btn omega-btn-secondary size-8 !rounded-lg !p-0 disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setRankSel(rank);
            setShowRank(true);
          }}
          disabled={loading !== null}
          title={`Rango ${currentRankInfo.name} — cambiar`}
          aria-label={`Rango actual ${rank} (${currentRankInfo.name}). Cambiar rango de ${alias}`}
          data-testid="rank-chip"
          className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${currentRankInfo.color} text-sm font-black text-white shadow-sm ring-1 ring-inset ring-white/10 disabled:opacity-50`}
        >
          {rank}
        </button>
      )}

      {/* Mientras se edita el rango, ocultamos el resto de controles para que el
          editor (select + confirmar/cancelar) tenga lugar y la fila no desborde. */}
      {!showRank && (
        <>
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
        </>
      )}
    </div>
  );
}
