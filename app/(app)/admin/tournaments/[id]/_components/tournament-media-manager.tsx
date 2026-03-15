"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Film, Trash2, Plus, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  url: string;
  type: "photo" | "video";
  caption: string | null;
  sort_order: number;
}

interface TournamentMediaManagerProps {
  tournamentId: string;
}

export default function TournamentMediaManager({
  tournamentId,
}: TournamentMediaManagerProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [url, setUrl] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [caption, setCaption] = useState("");

  useEffect(() => {
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMedia() {
    try {
      const res = await fetch(
        `/api/admin/tournaments/${tournamentId}/media`
      );
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!url.trim()) {
      toast.error("Pega una URL");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(
        `/api/admin/tournaments/${tournamentId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: url.trim(),
            type,
            caption: caption.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error agregando");
        return;
      }

      const newItem = await res.json();
      setMediaItems([...mediaItems, newItem]);
      setUrl("");
      setCaption("");
      toast.success("Agregado!");
    } catch {
      toast.error("Error de conexion");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(mediaId: string) {
    try {
      const res = await fetch(
        `/api/admin/tournaments/${tournamentId}/media/${mediaId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error eliminando");
        return;
      }

      setMediaItems(mediaItems.filter((m) => m.id !== mediaId));
      toast.success("Eliminado");
    } catch {
      toast.error("Error de conexion");
    }
  }

  // Auto-detect type from URL
  function handleUrlChange(value: string) {
    setUrl(value);
    const lower = value.toLowerCase();
    if (
      lower.includes("youtube.com") ||
      lower.includes("youtu.be") ||
      lower.includes("tiktok.com")
    ) {
      setType("video");
    } else if (
      lower.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i)
    ) {
      setType("photo");
    }
  }

  return (
    <div className="omega-card shadow-sm">
      <div className="omega-section-header">
        <ImageIcon className="size-4 text-omega-purple" />
        Galeria de medios
        <span className="omega-badge omega-badge-purple ml-auto">
          {mediaItems.length}
        </span>
      </div>

      {/* Add form */}
      <div className="p-4 space-y-3 border-b border-omega-border/30">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Link2 className="size-4 text-omega-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Pegar URL de foto o video..."
              className="omega-input pl-9"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "photo" | "video")}
            className="omega-input w-auto"
          >
            <option value="photo">Foto</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Descripcion (opcional)"
            maxLength={200}
            className="omega-input flex-1 min-w-0"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !url.trim()}
            className="omega-btn omega-btn-purple px-4 py-2.5 text-sm shrink-0"
          >
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Agregar
          </button>
        </div>
      </div>

      {/* Media list */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-omega-purple" />
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="py-8 text-center">
            <Film className="size-8 text-omega-muted/20 mx-auto mb-2" />
            <p className="text-xs text-omega-muted/60">No hay medios todavia</p>
          </div>
        ) : (
          mediaItems.map((item) => (
            <div
              key={item.id}
              className="omega-row group"
            >
              {/* Type icon */}
              <div
                className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.type === "photo"
                    ? "bg-omega-green/10 border border-omega-green/30"
                    : "bg-omega-blue/10 border border-omega-blue/30"
                }`}
              >
                {item.type === "photo" ? (
                  <ImageIcon className="size-4 text-omega-green" />
                ) : (
                  <Film className="size-4 text-omega-blue" />
                )}
              </div>

              {/* Thumbnail preview for photos */}
              {item.type === "photo" && (
                <img
                  src={item.url}
                  alt=""
                  className="size-10 rounded-lg object-cover border border-omega-border shrink-0"
                  loading="lazy"
                />
              )}

              {/* URL and caption */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-omega-text truncate font-mono">
                  {item.url}
                </p>
                {item.caption && (
                  <p className="text-[10px] text-omega-muted truncate mt-0.5">
                    {item.caption}
                  </p>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(item.id)}
                className="size-7 rounded-md flex items-center justify-center text-omega-muted hover:text-omega-red hover:bg-omega-red/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
