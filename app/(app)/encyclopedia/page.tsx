import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { BLADES, RATCHETS, BITS, BEGINNER_GUIDE, GUIDE_IMAGES } from "@/lib/encyclopedia";
import EncyclopediaClient from "./_components/encyclopedia-client";

export default function EncyclopediaPage() {
  return (
    <div className="max-w-lg mx-auto pb-10 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link
          href="/dashboard"
          className="size-9 rounded-xl bg-omega-surface border border-omega-border/30 flex items-center justify-center hover:bg-omega-card-hover transition-colors"
        >
          <ArrowLeft className="size-4 text-omega-muted" />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="size-9 rounded-xl bg-omega-purple/20 flex items-center justify-center shrink-0">
            <BookOpen className="size-5 text-omega-purple" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-omega-text">Xciclopedia</h1>
            <p className="text-xs text-omega-muted">Guia completa de Beyblade X</p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-4">
        <div className="flex items-center justify-around rounded-xl bg-omega-surface border border-omega-border/30 py-2 px-2">
          <div className="text-center">
            <p className="text-sm font-bold text-omega-purple">{BLADES.length}</p>
            <p className="text-[10px] text-omega-muted">Blades</p>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="text-center">
            <p className="text-sm font-bold text-omega-gold">{RATCHETS.length}</p>
            <p className="text-[10px] text-omega-muted">Ratchets</p>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="text-center">
            <p className="text-sm font-bold text-omega-blue">{BITS.length}</p>
            <p className="text-[10px] text-omega-muted">Bits</p>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="text-center">
            <p className="text-sm font-bold text-omega-green">{BEGINNER_GUIDE.sections.length}</p>
            <p className="text-[10px] text-omega-muted">Temas</p>
          </div>
        </div>
      </div>

      {/* Client: tabs + content */}
      <div className="px-4 space-y-3">
        <EncyclopediaClient
          blades={BLADES}
          ratchets={RATCHETS}
          bits={BITS}
          guide={BEGINNER_GUIDE.sections}
          guideImages={GUIDE_IMAGES}
        />
      </div>
    </div>
  );
}
