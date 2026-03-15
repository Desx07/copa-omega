"use client";

import { useState, useEffect } from "react";
import { Trophy, Loader2, Link2, Check, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Badge {
  id: string;
  position: number;
  card_image_url: string | null;
  player: {
    id: string;
    alias: string;
    avatar_url: string | null;
  };
}

const POSITION_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "1er lugar", color: "text-omega-gold", bg: "bg-omega-gold/15 border-omega-gold/40" },
  2: { label: "2do lugar", color: "text-gray-400", bg: "bg-white/5 border-gray-400/30" },
  3: { label: "3er lugar", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
};

interface PodiumCardsManagerProps {
  tournamentId: string;
}

export default function PodiumCardsManager({
  tournamentId,
}: PodiumCardsManagerProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBadges() {
    try {
      const res = await fetch(
        `/api/admin/tournaments/${tournamentId}/badges`
      );
      if (res.ok) {
        const data = await res.json();
        setBadges(
          data.map((b: Record<string, unknown>) => ({
            ...b,
            player: b.player as Badge["player"],
          }))
        );
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function startEditing(badge: Badge) {
    setEditingId(badge.id);
    setUrlInput(badge.card_image_url ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setUrlInput("");
  }

  async function saveCardUrl(badgeId: string) {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/tournaments/${tournamentId}/badges/${badgeId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ card_image_url: urlInput.trim() || null }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error guardando");
        return;
      }

      setBadges(
        badges.map((b) =>
          b.id === badgeId
            ? { ...b, card_image_url: urlInput.trim() || null }
            : b
        )
      );
      setEditingId(null);
      setUrlInput("");
      toast.success("Tarjeta de podio actualizada!");
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="omega-card shadow-sm">
        <div className="omega-section-header">
          <Trophy className="size-4 text-omega-gold" />
          Tarjetas de podio
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-omega-gold" />
        </div>
      </div>
    );
  }

  if (badges.length === 0) {
    return null; // No badges = tournament hasn't been completed yet or no top 3
  }

  return (
    <div className="omega-card shadow-sm">
      <div className="omega-section-header">
        <Trophy className="size-4 text-omega-gold" />
        Tarjetas de podio
        <span className="omega-badge omega-badge-gold ml-auto">
          {badges.filter((b) => b.card_image_url).length}/{badges.length}
        </span>
      </div>

      <div className="divide-y divide-omega-border/30">
        {badges.map((badge) => {
          const config = POSITION_LABELS[badge.position] ?? POSITION_LABELS[3];
          const isEditing = editingId === badge.id;

          return (
            <div key={badge.id} className="p-4 space-y-3">
              {/* Player info row */}
              <div className="flex items-center gap-3">
                {/* Position badge */}
                <div
                  className={`size-9 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 ${config.bg} ${config.color}`}
                >
                  {badge.position}
                </div>

                {/* Avatar */}
                <div className="size-8 rounded-full overflow-hidden bg-omega-dark shrink-0">
                  {badge.player.avatar_url ? (
                    <img
                      src={badge.player.avatar_url}
                      alt={badge.player.alias}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-xs font-bold text-omega-purple">
                      {badge.player.alias.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-omega-text truncate">
                    {badge.player.alias}
                  </p>
                  <p className={`text-[11px] font-medium ${config.color}`}>
                    {config.label}
                  </p>
                </div>

                {/* Card status indicator */}
                {badge.card_image_url ? (
                  <span className="omega-badge omega-badge-green text-[10px] gap-1">
                    <ImageIcon className="size-3" />
                    Tarjeta
                  </span>
                ) : (
                  <span className="omega-badge omega-badge-red text-[10px] opacity-60">
                    Sin tarjeta
                  </span>
                )}
              </div>

              {/* Card image preview */}
              {badge.card_image_url && !isEditing && (
                <div className="rounded-xl overflow-hidden border border-omega-border/30 bg-omega-dark">
                  <img
                    src={badge.card_image_url}
                    alt={`Tarjeta de podio - ${badge.player.alias}`}
                    className="w-full object-contain max-h-[300px]"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Edit form */}
              {isEditing ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Link2 className="size-4 text-omega-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="URL de la tarjeta de podio..."
                      className="omega-input pl-9"
                      autoFocus
                    />
                  </div>
                  {urlInput.trim() && (
                    <div className="rounded-xl overflow-hidden border border-omega-border/30 bg-omega-dark">
                      <img
                        src={urlInput.trim()}
                        alt="Vista previa"
                        className="w-full object-contain max-h-[250px]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveCardUrl(badge.id)}
                      disabled={saving}
                      className="omega-btn omega-btn-green px-4 py-2 text-sm flex-1"
                    >
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Guardar
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={saving}
                      className="omega-btn omega-btn-secondary px-4 py-2 text-sm"
                    >
                      <X className="size-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startEditing(badge)}
                  className="omega-btn omega-btn-secondary w-full px-4 py-2 text-xs"
                >
                  <ImageIcon className="size-3.5" />
                  {badge.card_image_url
                    ? "Cambiar tarjeta de podio"
                    : "Agregar tarjeta de podio"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
