"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft, Loader2, Plus, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const FORMAT_OPTIONS = [
  {
    value: "single_elimination",
    label: "Eliminacion directa",
    description: "Perdes y quedas afuera. Rapido e intenso.",
  },
  {
    value: "round_robin",
    label: "Round Robin",
    description: "Todos contra todos. Gana el que mas puntos acumule.",
  },
  {
    value: "swiss",
    label: "Suizo",
    description: "Rondas con emparejamiento por nivel. Ideal para muchos jugadores.",
  },
] as const;

export default function NewTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<string>("single_elimination");
  const [maxParticipants, setMaxParticipants] = useState(32);
  const [topCut, setTopCut] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const showTopCut = format === "round_robin" || format === "swiss";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre del torneo es obligatorio");
      return;
    }

    if (maxParticipants < 2) {
      toast.error("Minimo 2 participantes");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          format,
          max_participants: maxParticipants,
          top_cut: showTopCut ? topCut : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.error || "Error creando torneo");
        setLoading(false);
        return;
      }

      const data = await res.json();

      toast.success("Torneo creado!");
      router.push(`/admin/tournaments/${data.id}`);
    } catch {
      toast.error("Error al crear el torneo");
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/tournaments"
          className="omega-btn omega-btn-secondary size-10 !p-0"
          aria-label="Volver a torneos"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-omega-gold" />
          <h1 className="text-2xl font-black neon-gold">NUEVO TORNEO</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-xs font-bold text-omega-muted uppercase tracking-wider"
          >
            Nombre del torneo
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Copa Omega Star #1"
            maxLength={100}
            className="omega-input"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-xs font-bold text-omega-muted uppercase tracking-wider"
          >
            Descripcion{" "}
            <span className="text-omega-muted/50 normal-case font-normal">
              (opcional)
            </span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Reglas, premios, lugar del torneo..."
            maxLength={500}
            rows={3}
            className="omega-input resize-none"
          />
        </div>

        {/* Format */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
            Formato
          </label>
          <div className="space-y-2">
            {FORMAT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 omega-card p-4 cursor-pointer transition-all ${
                  format === opt.value
                    ? "!border-omega-gold/50 aura-gold"
                    : "hover:bg-omega-card-hover"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={opt.value}
                  checked={format === opt.value}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-1 accent-[var(--color-omega-gold)]"
                />
                <div>
                  <p
                    className={`text-sm font-bold ${
                      format === opt.value
                        ? "text-omega-gold"
                        : "text-omega-text"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-omega-muted mt-0.5">
                    {opt.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Max participants */}
        <div className="space-y-2">
          <label
            htmlFor="maxParticipants"
            className="text-xs font-bold text-omega-muted uppercase tracking-wider"
          >
            Maximo de participantes
          </label>
          <input
            id="maxParticipants"
            type="number"
            required
            min={2}
            max={256}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            className="omega-input"
          />
          {format === "single_elimination" && (
            <div className="flex items-start gap-2 omega-badge omega-badge-blue !rounded-lg !px-3 !py-2 !text-[11px] !font-normal">
              <Info className="size-4 text-omega-blue shrink-0 mt-0.5" />
              <p>
                Para eliminacion directa se recomienda potencia de 2 (4, 8, 16,
                32, 64). Si no es potencia de 2, algunos jugadores tendran BYE
                en la primera ronda.
              </p>
            </div>
          )}
        </div>

        {/* Top Cut -- only for Round Robin and Swiss */}
        {showTopCut && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
              Top Cut (clasifican a llaves finales)
            </label>
            <select
              value={topCut ?? ""}
              onChange={(e) => setTopCut(e.target.value ? Number(e.target.value) : null)}
              className="omega-input"
            >
              <option value="">Sin top cut (solo grupo)</option>
              <option value="4">Top 4</option>
              <option value="8">Top 8</option>
              <option value="16">Top 16</option>
              <option value="32">Top 32</option>
            </select>
            <div className="flex items-start gap-2 omega-badge omega-badge-gold !rounded-lg !px-3 !py-2 !text-[11px] !font-normal">
              <Info className="size-4 text-omega-gold shrink-0 mt-0.5" />
              <p>
                Los mejores del grupo clasifican a un bracket de eliminacion directa.
              </p>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="omega-card p-4 space-y-2">
          <p className="text-xs text-omega-muted text-center">Vista previa</p>
          <div className="text-center space-y-1">
            <p className="text-base font-black text-omega-text">
              {name || "Nombre del torneo"}
            </p>
            <p className="text-[11px] text-omega-muted uppercase tracking-wider">
              {FORMAT_OPTIONS.find((f) => f.value === format)?.label} -- Max{" "}
              {maxParticipants} jugadores
              {topCut && showTopCut && ` -> Top ${topCut} a llaves`}
            </p>
            {description && (
              <p className="text-xs text-omega-muted/70 italic">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="omega-btn omega-btn-gold w-full px-4 py-3 text-base"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Plus className="size-5" />
              Crear torneo
            </>
          )}
        </button>
      </form>
    </div>
  );
}
