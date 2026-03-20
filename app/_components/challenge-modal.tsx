"use client";

import { useState } from "react";
import { Swords, Star, X, Loader2, Zap, Send } from "lucide-react";

type ChallengeModalProps = {
  targetId: string;
  targetAlias: string;
  onClose: (created?: boolean) => void;
};

export default function ChallengeModal({
  targetId,
  targetAlias,
  onClose,
}: ChallengeModalProps) {
  const [starsBet, setStarsBet] = useState(1);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenged_id: targetId,
          stars_bet: starsBet,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear el reto");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => onClose(true), 1500);
    } catch {
      setError("Error de conexion");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onClose()}
      />

      {/* Modal */}
      <div className="relative omega-card-elevated w-full max-w-sm">
        {/* Header */}
        <div className="omega-section-header justify-between">
          <div className="flex items-center gap-2">
            <Swords className="size-4 text-omega-red" />
            Retar a {targetAlias}
          </div>
          <button onClick={() => onClose()} className="text-omega-muted hover:text-omega-text">
            <X className="size-4" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3">
            <div className="size-14 mx-auto rounded-full bg-omega-green/20 border border-omega-green/30 flex items-center justify-center">
              <Zap className="size-7 text-omega-green" />
            </div>
            <p className="text-sm font-bold text-omega-green">Reto enviado</p>
            <p className="text-xs text-omega-muted">
              {targetAlias} tiene 48 horas para aceptar
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Stars bet selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-omega-text uppercase tracking-wider">
                Estrellas apostadas
              </label>
              <div className="flex items-center gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStarsBet(n)}
                    className={`size-11 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                      starsBet >= n
                        ? "bg-omega-gold/20 border-2 border-omega-gold text-omega-gold shadow-md shadow-omega-gold/20"
                        : "bg-omega-dark border border-omega-border/30 text-omega-muted hover:border-omega-gold/50"
                    }`}
                  >
                    <Star
                      className={`size-5 ${
                        starsBet >= n
                          ? "text-omega-gold fill-omega-gold"
                          : "text-omega-muted/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-omega-gold font-bold">
                {starsBet} {starsBet === 1 ? "estrella" : "estrellas"}
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-omega-text uppercase tracking-wider">
                Mensaje (opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={120}
                rows={2}
                placeholder="Preparate para perder..."
                className="omega-input resize-none"
              />
              <p className="text-[11px] text-omega-muted text-right">
                {message.length}/120
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-omega-red/10 border border-omega-red/30 px-3 py-2">
                <p className="text-xs text-omega-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="omega-btn omega-btn-red w-full py-3 text-sm"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Send className="size-4" />
                  Enviar reto
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
