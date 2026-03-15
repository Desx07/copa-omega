"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface EditTournamentProps {
  tournamentId: string;
  currentName: string;
  currentDescription: string | null;
  currentMaxParticipants: number;
  participantCount: number;
  status: string;
}

export default function EditTournament({
  tournamentId,
  currentName,
  currentDescription,
  currentMaxParticipants,
  participantCount,
  status,
}: EditTournamentProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? "");
  const [maxParticipants, setMaxParticipants] = useState(currentMaxParticipants);

  if (status !== "registration") return null;

  async function handleSave() {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};

      if (name.trim() !== currentName) body.name = name.trim();
      if (description !== (currentDescription ?? ""))
        body.description = description || null;
      if (maxParticipants !== currentMaxParticipants)
        body.max_participants = maxParticipants;

      if (Object.keys(body).length === 0) {
        setEditing(false);
        return;
      }

      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error actualizando");
        return;
      }

      toast.success("Torneo actualizado");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="omega-btn omega-btn-secondary w-full px-4 py-2.5 text-sm shadow-sm hover:shadow-md"
      >
        <Pencil className="size-4" />
        Editar torneo
      </button>
    );
  }

  return (
    <div className="omega-card shadow-sm border-l-4 border-l-omega-blue p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-omega-blue uppercase tracking-wider">
        <Pencil className="size-4" />
        Editar torneo
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-bold text-omega-muted uppercase tracking-wider block mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="omega-input w-full"
            placeholder="Nombre del torneo"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-omega-muted uppercase tracking-wider block mb-1">
            Descripcion
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="omega-input w-full"
            placeholder="Descripcion (opcional)"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-omega-muted uppercase tracking-wider block mb-1">
            Max participantes
          </label>
          <input
            type="number"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            min={Math.max(2, participantCount)}
            max={256}
            className="omega-input w-full"
          />
          {participantCount > 0 && (
            <p className="text-[10px] text-omega-muted mt-0.5">
              Minimo: {participantCount} (inscriptos actuales)
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={loading || !name.trim()}
          className="omega-btn omega-btn-green px-4 py-2.5 text-sm shadow-sm hover:shadow-md"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Guardar
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setName(currentName);
            setDescription(currentDescription ?? "");
            setMaxParticipants(currentMaxParticipants);
          }}
          disabled={loading}
          className="omega-btn omega-btn-secondary px-4 py-2.5 text-sm shadow-sm"
        >
          <X className="size-4" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
