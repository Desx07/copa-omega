"use client";

import { useState, useEffect, useRef } from "react";
import { ImageIcon, Film, Trash2, Plus, Loader2, Link2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload-image";

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

  // Video URL input
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");

  // Photo upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  async function handleAddVideo() {
    if (!videoUrl.trim()) {
      toast.error("Pega una URL de video");
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
            url: videoUrl.trim(),
            type: "video",
            caption: videoCaption.trim() || null,
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
      setVideoUrl("");
      setVideoCaption("");
      toast.success("Video agregado!");
    } catch {
      toast.error("Error de conexion");
    } finally {
      setAdding(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = "";

    setUploadingPhoto(true);
    const captionValue = photoCaption.trim() || null;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} pesa mas de 10MB, omitido`);
          continue;
        }

        // Upload to storage
        const filename = `${Date.now()}-${i}.jpeg`;
        const path = `tournaments/${tournamentId}/${filename}`;
        const publicUrl = await uploadImage("media", path, file, 1600);

        // Save to DB via API
        const res = await fetch(
          `/api/admin/tournaments/${tournamentId}/media`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: publicUrl,
              type: "photo",
              caption: captionValue,
            }),
          }
        );

        if (res.ok) {
          const newItem = await res.json();
          setMediaItems((prev) => [...prev, newItem]);
        } else {
          const data = await res.json();
          toast.error(data.error || "Error guardando foto");
        }
      }

      setPhotoCaption("");
      toast.success(files.length > 1 ? "Fotos subidas!" : "Foto subida!");
    } catch {
      toast.error("Error subiendo foto");
    } finally {
      setUploadingPhoto(false);
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

  return (
    <div className="omega-card shadow-sm">
      <div className="omega-section-header">
        <ImageIcon className="size-4 text-omega-purple" />
        Galeria de medios
        <span className="omega-badge omega-badge-purple ml-auto">
          {mediaItems.length}
        </span>
      </div>

      {/* Photo upload section */}
      <div className="p-4 space-y-3 border-b border-omega-border/30">
        <p className="text-[11px] font-bold text-omega-text uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="size-3.5 text-omega-green" />
          Subir fotos
        </p>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handlePhotoUpload}
        />

        <input
          type="text"
          value={photoCaption}
          onChange={(e) => setPhotoCaption(e.target.value)}
          placeholder="Descripcion (opcional)"
          maxLength={200}
          className="omega-input"
        />

        <button
          onClick={() => photoInputRef.current?.click()}
          disabled={uploadingPhoto}
          className="omega-btn omega-btn-green w-full px-4 py-2.5 text-sm"
        >
          {uploadingPhoto ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploadingPhoto ? "Subiendo..." : "Seleccionar fotos"}
        </button>
      </div>

      {/* Video URL section */}
      <div className="p-4 space-y-3 border-b border-omega-border/30">
        <p className="text-[11px] font-bold text-omega-text uppercase tracking-wider flex items-center gap-1.5">
          <Film className="size-3.5 text-omega-blue" />
          Agregar video (YouTube / TikTok)
        </p>

        <div className="relative">
          <Link2 className="size-4 text-omega-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Pegar URL de YouTube o TikTok..."
            className="omega-input pl-9"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={videoCaption}
            onChange={(e) => setVideoCaption(e.target.value)}
            placeholder="Descripcion (opcional)"
            maxLength={200}
            className="omega-input flex-1 min-w-0"
          />
          <button
            onClick={handleAddVideo}
            disabled={adding || !videoUrl.trim()}
            className="omega-btn omega-btn-blue px-4 py-2.5 text-sm shrink-0"
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
