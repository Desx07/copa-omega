"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselItem {
  id: string;
  type: "photo" | "video";
  url: string;
  thumbnail_url: string | null;
  title: string | null;
}

interface DashboardCarouselProps {
  items: CarouselItem[];
}

export default function DashboardCarousel({ items }: DashboardCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, items.length]);

  if (items.length === 0) return null;

  const item = items[current];
  const isVideo = item.type === "video";

  // For videos, get YouTube thumbnail
  const imgSrc = isVideo
    ? item.thumbnail_url || getYtThumb(item.url)
    : item.url;

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-omega-card shadow-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
    >
      {/* Image container — full width, natural height */}
      <div className="relative w-full">
        {isVideo ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="block w-full">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={item.title || ""}
                className="w-full object-contain"
              />
            ) : (
              <div className="size-full bg-omega-surface flex items-center justify-center">
                <span className="text-omega-muted text-xs">Video</span>
              </div>
            )}
            {/* Play icon */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="size-10 rounded-full bg-omega-purple/90 flex items-center justify-center">
                <ChevronRight className="size-5 text-white" />
              </div>
            </div>
          </a>
        ) : (
          <img
            src={item.url}
            alt={item.title || ""}
            className="w-full rounded-t-2xl"
          />
        )}

        {/* Title overlay */}
        {item.title && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
            <p className="text-xs font-bold text-white truncate">{item.title}</p>
          </div>
        )}

        {/* Nav arrows (only if multiple) */}
        {items.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-1 top-1/2 -translate-y-1/2 size-7 rounded-full bg-black/40 flex items-center justify-center text-white/80 hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-1 top-1/2 -translate-y-1/2 size-7 rounded-full bg-black/40 flex items-center justify-center text-white/80 hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2 bg-omega-card">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`size-1.5 rounded-full transition-all ${
                i === current ? "bg-omega-gold w-4" : "bg-omega-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getYtThumb(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}
