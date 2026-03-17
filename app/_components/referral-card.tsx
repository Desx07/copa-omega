"use client";

import { Users, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ReferralCardProps {
  referralCode: string;
}

export default function ReferralCard({ referralCode }: ReferralCardProps) {
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth/register?ref=${referralCode}`
    : "";

  async function handleCopy() {
    const text = `Unite a Copa Omega Star! Registrate con mi codigo ${referralCode.toUpperCase()} y ganamos 2 estrellas extra cada uno: ${shareUrl}`;
    await navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles!");
  }

  async function handleShare() {
    const text = `Unite a Copa Omega Star! Registrate con mi codigo ${referralCode.toUpperCase()} y ganamos 2 estrellas extra cada uno.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Copa Omega Star", text, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="omega-card p-4 space-y-3 border-l-4 border-l-omega-blue">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-omega-blue" />
        <h3 className="text-sm font-bold text-omega-text">Invita un blader</h3>
      </div>
      <p className="text-[11px] text-omega-muted">
        Comparti tu codigo. Cuando tu invitado juegue su primera partida, ambos ganan +2 estrellas.
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-omega-dark rounded-lg px-3 py-2 text-center">
          <span className="text-lg font-black text-omega-gold tracking-widest">
            {referralCode.toUpperCase()}
          </span>
        </div>
        <button onClick={handleCopy} className="omega-btn omega-btn-secondary size-10 !p-0 !rounded-lg" title="Copiar">
          <Copy className="size-4" />
        </button>
        <button onClick={handleShare} className="omega-btn omega-btn-blue size-10 !p-0 !rounded-lg" title="Compartir">
          <Share2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
