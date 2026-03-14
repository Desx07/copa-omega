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
    if (!confirm("¿Eliminar este torneo completamente? Se borrarán todas las partidas y participantes.")) return;
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
      toast.error("Error de conexión");
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
      const supabase = createClient();

      // Generate bracket matches based on format
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
      <div className="rounded-xl border border-omega-red/30 bg-omega-red/5 p-4 space-y-3">
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
            className="flex items-center gap-2 rounded-xl bg-omega-red/90 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-omega-red disabled:opacity-50"
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
            className="rounded-xl border border-omega-border bg-omega-card/60 px-4 py-2.5 text-sm font-medium text-omega-muted hover:text-omega-text transition-all"
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
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-omega-green/90 to-omega-green px-4 py-3 font-bold text-omega-dark shadow-lg shadow-omega-green/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
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
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-omega-gold/90 to-omega-gold px-4 py-3 font-bold text-omega-dark shadow-lg shadow-omega-gold/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-omega-red/30 bg-omega-red/5 px-4 py-2.5 text-sm font-medium text-omega-red transition-all hover:bg-omega-red/10 disabled:opacity-50"
        >
          <XCircle className="size-4" />
          Cancelar torneo
        </button>
      )}

      {/* Delete button — always available */}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-omega-border/30 px-4 py-2 text-xs font-medium text-omega-muted hover:text-omega-red hover:border-omega-red/30 transition-all disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
        Eliminar torneo
      </button>
    </div>
  );
}
