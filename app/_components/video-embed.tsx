"use client";

interface VideoEmbedProps {
  url: string;
  className?: string;
}

/**
 * Detects YouTube or TikTok URLs and renders the appropriate iframe embed.
 * Falls back to a clickable link for unsupported platforms.
 */
export default function VideoEmbed({ url, className = "" }: VideoEmbedProps) {
  const youtubeId = extractYouTubeId(url);
  const tiktokId = extractTikTokId(url);

  if (youtubeId) {
    return (
      <div className={`relative w-full aspect-video rounded-xl overflow-hidden ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  if (tiktokId) {
    return (
      <div className={`relative w-full rounded-xl overflow-hidden ${className}`} style={{ maxWidth: 325 }}>
        <iframe
          src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
          title="TikTok video"
          allowFullScreen
          className="w-full border-0"
          style={{ height: 578 }}
        />
      </div>
    );
  }

  // Fallback: generic video link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block omega-card p-4 text-center text-sm text-omega-blue hover:text-omega-purple transition-colors ${className}`}
    >
      Ver video &rarr;
    </a>
  );
}

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://youtube.com/live/VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      // /watch?v=ID
      const v = u.searchParams.get("v");
      if (v) return v;

      // /embed/ID, /shorts/ID, /live/ID
      const pathMatch = u.pathname.match(/^\/(embed|shorts|live)\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) return pathMatch[2];
    }

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      if (id) return id;
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Extract TikTok video ID from URL:
 * - https://www.tiktok.com/@user/video/VIDEO_ID
 * - https://vm.tiktok.com/SHORTCODE/
 */
function extractTikTokId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    if (host === "tiktok.com" || host === "m.tiktok.com") {
      const match = u.pathname.match(/\/video\/(\d+)/);
      if (match) return match[1];
    }

    // Short URLs (vm.tiktok.com) don't have the ID directly
    // We return null and let it fall through to the link fallback
  } catch {
    // Invalid URL
  }
  return null;
}
