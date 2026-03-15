import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Trophy, Film } from "lucide-react";

export default async function GaleriaPage() {
  const supabase = await createClient();

  // Fetch tournaments that have media, with media count
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select(
      "id, name, logo_url, status, created_at, media:tournament_media(id)"
    )
    .order("created_at", { ascending: false });

  // Filter to only tournaments with media
  const tournamentsWithMedia = (tournaments ?? [])
    .map((t) => ({
      ...t,
      media_count: (t.media as unknown as { id: string }[])?.length ?? 0,
    }))
    .filter((t) => t.media_count > 0);

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-purple/20 via-omega-surface to-omega-blue/10 shadow-lg shadow-omega-purple/10 mb-6">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-omega-purple/20 flex items-center justify-center">
              <ImageIcon className="size-5 text-omega-purple" />
            </div>
            <h1 className="text-2xl font-black text-omega-text">GALERIA</h1>
          </div>
          <p className="text-xs text-omega-muted mt-2">
            Fotos y videos de los torneos Copa Omega Star
          </p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {tournamentsWithMedia.length === 0 ? (
          <div className="omega-card p-10 text-center space-y-3">
            <Film className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">
              Todavia no hay fotos ni videos
            </p>
          </div>
        ) : (
          tournamentsWithMedia.map((t) => (
            <Link
              key={t.id}
              href={`/galeria/${t.id}`}
              className="group block rounded-xl border-l-4 border-l-omega-purple bg-omega-card px-4 py-4 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                {/* Tournament logo or fallback */}
                <div className="size-12 rounded-xl overflow-hidden bg-omega-surface border border-omega-border flex items-center justify-center shrink-0">
                  {t.logo_url ? (
                    <img
                      src={t.logo_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Trophy className="size-5 text-omega-purple" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-omega-text truncate group-hover:text-omega-purple transition-colors">
                    {t.name}
                  </p>
                  <p className="text-[11px] text-omega-muted mt-0.5">
                    {new Date(t.created_at).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <ImageIcon className="size-3.5 text-omega-purple" />
                  <span className="text-sm font-bold text-omega-purple">
                    {t.media_count}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
