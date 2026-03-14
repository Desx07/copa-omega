"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, XCircle, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface TournamentAdminActionsProps {
  tournamentId: string;
  status: string;
  participantCount: number;
  maxParticipants: number;
  format: string;
}

export default function TournamentAdminActions({
  tournamentId,
  status,
  participantCount,
  format,
}: TournamentAdminActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function handleDelete() {
    if (!confirm("Eliminar este torneo completamente? Se borraran todas las partidas y participantes.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error eliminando");
        return;
      }
      toast.success("Torneo eliminado");
      router.push("/admin/tournaments");
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    if (participantCount < 2) {
      toast.error("Se necesitan al menos 2 participantes para empezar");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Error al iniciar el torneo");
        setLoading(false);
        return;
      }

      toast.success("Torneo iniciado! Se generaron las partidas.");
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tournaments")
        .update({ status: "cancelled" })
        .eq("id", tournamentId);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success("Torneo cancelado");
      setConfirmCancel(false);
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tournaments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", tournamentId);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      await fetch(`/api/tournaments/${tournamentId}/complete`, { method: "POST" }).catch(() => {});

      toast.success("Torneo finalizado!");
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  // Cancel confirmation overlay
  if (confirmCancel) {
    return (
      <div className="omega-card shadow-sm !border-omega-red/30 border-l-4 border-l-omega-red p-4 space-y-3">
        <div className="flex items-center gap-2 text-omega-red">
          <AlertTriangle className="size-5" />
          <span className="text-sm font-bold">
            Estas seguro de cancelar el torneo?
          </span>
        </div>
        <p className="text-xs text-omega-muted">
          Esta accion no se puede deshacer. El torneo quedara como cancelado.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="omega-btn omega-btn-red px-4 py-2.5 text-sm shadow-sm hover:shadow-md"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            Si, cancelar
          </button>
          <button
            onClick={() => setConfirmCancel(false)}
            disabled={loading}
            className="omega-btn omega-btn-secondary px-4 py-2.5 text-sm shadow-sm"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Start tournament */}
      {status === "registration" && (
        <button
          onClick={handleStart}
          disabled={loading || participantCount < 2}
          className="omega-btn omega-btn-green w-full px-4 py-3 text-base shadow-lg shadow-omega-green/20 hover:shadow-xl"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Play className="size-5" />
              Iniciar torneo ({participantCount} jugadores, {
                format === "single_elimination"
                  ? "Eliminacion directa"
                  : format === "round_robin"
                  ? "Round Robin"
                  : "Suizo"
              })
            </>
          )}
        </button>
      )}

      {/* Complete tournament */}
      {status === "in_progress" && (
        <button
          onClick={handleComplete}
          disabled={loading}
          className="omega-btn omega-btn-gold w-full px-4 py-3 text-base shadow-lg shadow-omega-gold/20 hover:shadow-xl"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <CheckCircle className="size-5" />
              Finalizar torneo
            </>
          )}
        </button>
      )}

      {/* Cancel button */}
      {(status === "registration" || status === "in_progress") && (
        <button
          onClick={() => setConfirmCancel(true)}
          disabled={loading}
          className="omega-btn omega-btn-secondary w-full px-4 py-2.5 text-sm shadow-sm hover:shadow-md !text-omega-red !border-omega-red/30 hover:!bg-omega-red/10 border-l-4 border-l-omega-red"
        >
          <XCircle className="size-4" />
          Cancelar torneo
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="omega-btn omega-btn-secondary w-full px-4 py-2 text-xs shadow-sm !text-omega-muted hover:!text-omega-red hover:!border-omega-red/30 hover:shadow-md"
      >
        <Trash2 className="size-3.5" />
        Eliminar torneo
      </button>
    </div>
  );
}
