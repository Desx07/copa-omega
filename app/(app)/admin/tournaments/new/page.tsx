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
    description: "Todos contra todos. Gana el que más puntos acumule.",
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
  const [logoUrl, setLogoUrl] = useState("");
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
          logo_url: logoUrl.trim() || null,
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
    <div className="max-w-lg mx-auto pb-8">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-gold/20 via-omega-purple/10 to-omega-dark shadow-lg shadow-omega-gold/10 mb-8">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/admin/tournaments"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Torneos
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-omega-gold/20 flex items-center justify-center">
              <Trophy className="size-5 text-omega-gold" />
            </div>
            <h1 className="text-2xl font-black neon-gold">NUEVO TORNEO</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4">
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
                  className={`flex items-start gap-3 rounded-xl border-l-4 bg-omega-card px-4 py-3 shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                    format === opt.value
                      ? "border-l-omega-gold aura-gold"
                      : "border-l-omega-border hover:border-l-omega-purple"
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
              <div className="flex items-start gap-2 rounded-xl bg-gradient-to-br from-omega-blue/10 to-omega-blue/5 border border-omega-blue/20 px-3 py-2 text-[11px] text-omega-blue shadow-sm">
                <Info className="size-4 shrink-0 mt-0.5" />
                <p>
                  Para eliminación directa se recomienda potencia de 2 (4, 8, 16,
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
              <div className="flex items-start gap-2 rounded-xl bg-gradient-to-br from-omega-gold/10 to-omega-gold/5 border border-omega-gold/20 px-3 py-2 text-[11px] text-omega-gold shadow-sm">
                <Info className="size-4 shrink-0 mt-0.5" />
                <p>
                  Los mejores del grupo clasifican a un bracket de eliminación directa.
                </p>
              </div>
            </div>
          )}

          {/* Logo URL */}
          <div className="space-y-2">
            <label
              htmlFor="logoUrl"
              className="text-xs font-bold text-omega-muted uppercase tracking-wider"
            >
              URL del logo (imagen){" "}
              <span className="text-omega-muted/50 normal-case font-normal">
                (opcional)
              </span>
            </label>
            <input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
              className="omega-input"
            />
            {logoUrl && (
              <div className="flex items-center gap-2">
                <img
                  src={logoUrl}
                  alt="Preview"
                  className="size-10 rounded-lg object-cover border border-omega-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-[10px] text-omega-muted">Vista previa</span>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-2xl bg-gradient-to-br from-omega-card to-omega-surface border border-white/10 p-4 space-y-2 shadow-sm">
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
    </div>
  );
}
