import { createClient } from "@/lib/supabase/server";
import { Play } from "lucide-react";

interface CarouselItem {
  id: string;
  type: "photo" | "video";
  url: string;
  thumbnail_url: string | null;
  title: string | null;
  sort_order: number;
}

export async function LandingCarousel() {
  const supabase = await createClient();

  // Check if carousel is enabled
  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "carousel_enabled")
    .single();

  if (setting?.value !== "true") {
    return null;
  }

  // Fetch active carousel items
  const { data: items } = await supabase
    .from("carousel_items")
    .select("id, type, url, thumbnail_url, title, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="relative py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-omega-blue font-bold mb-3 text-center">
          Galeria
        </p>
        <h2 className="text-2xl md:text-3xl font-black text-center mb-8">
          Momentos de batalla
        </h2>

        {/* Scroll-snap carousel */}
        <div
          className="flex gap-4 overflow-x-auto pb-4 carousel-scroll"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {items.map((item: CarouselItem) => (
            <CarouselCard key={item.id} item={item} />
          ))}
        </div>

        {/* Scroll hint dots */}
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {items.map((item: CarouselItem, i: number) => (
              <div
                key={item.id}
                className={`size-1.5 rounded-full ${
                  i === 0 ? "bg-omega-blue" : "bg-omega-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CarouselCard({ item }: { item: CarouselItem }) {
  const isVideo = item.type === "video";

  // For videos, use thumbnail or generate one from YouTube/TikTok
  const thumbnailSrc = isVideo
    ? item.thumbnail_url || getVideoThumbnail(item.url)
    : null;

  const content = isVideo ? (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full h-full"
    >
      {thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt={item.title || "Video"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-omega-surface flex items-center justify-center">
          <Play className="size-12 text-omega-muted/40" />
        </div>
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
        <div className="flex size-14 items-center justify-center rounded-full bg-omega-purple/90 shadow-[0_0_20px_rgba(123,47,247,0.4)] group-hover:shadow-[0_0_30px_rgba(123,47,247,0.6)] group-hover:scale-110 transition-all">
          <Play className="size-6 text-white ml-0.5" fill="white" />
        </div>
      </div>
    </a>
  ) : (
    <img
      src={item.url}
      alt={item.title || "Foto"}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );

  return (
    <div
      className="relative shrink-0 w-[280px] sm:w-[320px] md:w-[360px] h-[200px] sm:h-[220px] md:h-[240px] rounded-xl overflow-hidden border border-omega-border/30 bg-omega-card shadow-md hover:shadow-lg transition-shadow"
      style={{ scrollSnapAlign: "start" }}
    >
      {content}
      {item.title && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
          <p className="text-sm font-bold text-white truncate">{item.title}</p>
        </div>
      )}
    </div>
  );
}

function getVideoThumbnail(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  return null;
}
