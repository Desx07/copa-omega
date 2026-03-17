"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image,
  Video,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";
import Link from "next/link";

interface CarouselItem {
  id: string;
  type: "photo" | "video";
  url: string;
  thumbnail_url: string | null;
  title: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function AdminCarouselPage() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselEnabled, setCarouselEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [activeTab, setActiveTab] = useState<"landing" | "dashboard">("landing");

  // New item form
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<"photo" | "video">("photo");
  const [newTitle, setNewTitle] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(`/api/carousel?target=${activeTab}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
      setCarouselEnabled(data.enabled);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  async function toggleCarousel() {
    setToggling(true);
    const settingKey = activeTab === "dashboard" ? "dashboard_carousel" : "carousel";
    try {
      const res = await fetch(`/api/settings/${settingKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !carouselEnabled }),
      });
      if (res.ok) {
        setCarouselEnabled(!carouselEnabled);
      }
    } catch {
      // Silent
    } finally {
      setToggling(false);
    }
  }

  async function addItem() {
    if (!newUrl.trim()) return;
    setAdding(true);

    try {
      const res = await fetch("/api/admin/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          url: newUrl.trim(),
          thumbnail_url: newThumbnail.trim() || null,
          title: newTitle.trim() || null,
          target: activeTab,
        }),
      });

      if (res.ok) {
        setNewUrl("");
        setNewTitle("");
        setNewThumbnail("");
        loadItems();
      }
    } catch {
      // Silent
    } finally {
      setAdding(false);
    }
  }

  async function deleteItem(id: string) {
    try {
      const res = await fetch(`/api/admin/carousel/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // Silent
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/admin/carousel/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, is_active: !currentActive } : item
          )
        );
      }
    } catch {
      // Silent
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-blue/20 via-omega-surface to-omega-purple/15 px-6 pt-8 pb-6 shadow-lg shadow-omega-blue/40">
        <div className="relative mb-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </div>
        <div className="relative text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight neon-blue">
            CAROUSEL
          </h1>
          <p className="text-sm text-omega-muted">
            Administrar galeria del landing
          </p>
        </div>
      </div>

      {/* Tab: Landing / Dashboard */}
      <div className="px-4">
        <div className="flex rounded-xl bg-omega-dark/60 border border-white/[0.06] p-1">
          <button
            onClick={() => setActiveTab("landing")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
              activeTab === "landing"
                ? "bg-omega-card text-omega-blue shadow-sm"
                : "text-omega-muted hover:text-omega-text"
            }`}
          >
            Landing
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
              activeTab === "dashboard"
                ? "bg-omega-card text-omega-purple shadow-sm"
                : "text-omega-muted hover:text-omega-text"
            }`}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Toggle carousel */}
      <div className="px-4">
        <button
          onClick={toggleCarousel}
          disabled={toggling}
          className={`w-full omega-btn py-3 text-sm ${
            carouselEnabled ? "omega-btn-green" : "omega-btn-red"
          }`}
        >
          {toggling ? (
            <Loader2 className="size-4 animate-spin" />
          ) : carouselEnabled ? (
            <>
              <Power className="size-4" />
              Carousel activado — Click para desactivar
            </>
          ) : (
            <>
              <PowerOff className="size-4" />
              Carousel desactivado — Click para activar
            </>
          )}
        </button>
      </div>

      {/* Add new item */}
      <div className="px-4 space-y-3">
        <div className="flex items-center gap-2">
          <Plus className="size-4 text-omega-blue" />
          <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">
            Agregar item
          </h2>
        </div>

        <div className="omega-card p-4 space-y-3">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setNewType("photo")}
              className={`flex-1 omega-btn py-2 text-xs ${
                newType === "photo"
                  ? "omega-btn-purple"
                  : "omega-btn-secondary"
              }`}
            >
              <Image className="size-3.5" />
              Foto
            </button>
            <button
              onClick={() => setNewType("video")}
              className={`flex-1 omega-btn py-2 text-xs ${
                newType === "video"
                  ? "omega-btn-blue"
                  : "omega-btn-secondary"
              }`}
            >
              <Video className="size-3.5" />
              Video
            </button>
          </div>

          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder={
              newType === "photo"
                ? "URL de la imagen..."
                : "URL del video (YouTube, TikTok)..."
            }
            className="omega-input"
          />

          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titulo (opcional)"
            className="omega-input"
          />

          {newType === "video" && (
            <input
              type="text"
              value={newThumbnail}
              onChange={(e) => setNewThumbnail(e.target.value)}
              placeholder="URL de thumbnail (opcional, auto para YouTube)"
              className="omega-input"
            />
          )}

          <button
            onClick={addItem}
            disabled={adding || !newUrl.trim()}
            className="w-full omega-btn omega-btn-primary py-3 text-sm"
          >
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Plus className="size-4" />
                Agregar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="size-4 text-omega-purple" />
            <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">
              Items ({items.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 text-omega-purple animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="omega-card p-10 text-center space-y-3">
            <Image className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">
              No hay items en el carousel
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border-l-4 ${
                  item.is_active
                    ? item.type === "photo"
                      ? "border-l-omega-purple"
                      : "border-l-omega-blue"
                    : "border-l-omega-border"
                } bg-omega-card px-4 py-3 shadow-sm flex items-center gap-3`}
              >
                {/* Thumbnail */}
                <div className="size-12 rounded-lg overflow-hidden bg-omega-dark shrink-0">
                  {item.type === "photo" ? (
                    <img
                      src={item.url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center">
                      <Video className="size-5 text-omega-blue/50" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-omega-text truncate">
                    {item.title || item.url.slice(0, 40)}
                  </p>
                  <p className="text-[10px] text-omega-muted uppercase tracking-wider">
                    {item.type} — #{item.sort_order}
                    {!item.is_active && (
                      <span className="text-omega-red ml-2">INACTIVO</span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => toggleActive(item.id, item.is_active)}
                  className={`size-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    item.is_active
                      ? "bg-omega-green/20 text-omega-green hover:bg-omega-green/30"
                      : "bg-omega-muted/20 text-omega-muted hover:bg-omega-muted/30"
                  }`}
                  title={item.is_active ? "Desactivar" : "Activar"}
                >
                  {item.is_active ? (
                    <Power className="size-3.5" />
                  ) : (
                    <PowerOff className="size-3.5" />
                  )}
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="size-8 rounded-lg bg-omega-red/20 text-omega-red flex items-center justify-center hover:bg-omega-red/30 transition-colors shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
