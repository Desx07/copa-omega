"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  playerId: string;
  alias: string;
}

export default function ShareButton({ playerId, alias }: ShareButtonProps) {
  async function handleShare() {
    const shareUrl = `${window.location.origin}/player/${playerId}`;
    const shareText = `Mira mi perfil de blader en Copa Omega Star: ${alias}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${alias} - Copa Omega Star`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled share - not an error
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Link copiado al portapapeles");
    }
  }

  return (
    <button
      onClick={handleShare}
      className="omega-btn omega-btn-purple text-xs gap-1.5"
    >
      <Share2 className="size-3.5" />
      Compartir
    </button>
  );
}
