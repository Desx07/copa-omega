import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, ImageIcon } from "lucide-react";
import VideoEmbed from "@/app/_components/video-embed";

interface PageProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function TournamentGalleryPage({ params }: PageProps) {
  const { tournamentId } = await params;
  const supabase = await createClient();

  const [tournamentResult, mediaResult] = await Promise.all([
    supabase
      .from("tournaments")
      .select("id, name, logo_url, status")
      .eq("id", tournamentId)
      .single(),
    supabase
      .from("tournament_media")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("sort_order", { ascending: true }),
  ]);

  if (!tournamentResult.data) {
    notFound();
  }

  const tournament = tournamentResult.data;
  const media = mediaResult.data ?? [];
  const photos = media.filter((m) => m.type === "photo");
  const videos = media.filter((m) => m.type === "video");

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-purple/20 via-omega-surface to-omega-blue/10 shadow-lg shadow-omega-purple/10 mb-6">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/galeria"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Galeria
          </Link>
          <div className="flex items-center gap-3">
            {tournament.logo_url && (
              <img
                src={tournament.logo_url}
                alt=""
                className="size-12 rounded-xl object-cover border border-omega-border shadow-sm shrink-0"
              />
            )}
            <div>
              <h1 className="text-xl font-black text-omega-text">
                {tournament.name}
              </h1>
              <p className="text-[11px] text-omega-muted mt-0.5">
                {media.length} {media.length === 1 ? "archivo" : "archivos"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {media.length === 0 ? (
          <div className="omega-card p-10 text-center space-y-3">
            <ImageIcon className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">
              No hay fotos ni videos todavia
            </p>
          </div>
        ) : (
          <>
            {/* Photos grid */}
            {photos.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-omega-purple" />
                  <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">
                    Fotos
                  </h2>
                  <span className="omega-badge omega-badge-purple">
                    {photos.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-xl overflow-hidden bg-omega-surface border border-omega-border shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption ?? ""}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                          <p className="text-[10px] text-white/90 truncate">
                            {photo.caption}
                          </p>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-omega-blue" />
                  <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">
                    Videos
                  </h2>
                  <span className="omega-badge omega-badge-blue">
                    {videos.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {videos.map((video) => (
                    <div key={video.id} className="space-y-1.5">
                      <VideoEmbed url={video.url} />
                      {video.caption && (
                        <p className="text-xs text-omega-muted px-1">
                          {video.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Link to tournament */}
        <div className="text-center pt-2">
          <Link
            href={`/tournaments/${tournament.id}`}
            className="text-xs text-omega-muted hover:text-omega-blue transition-colors"
          >
            Ver torneo &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
