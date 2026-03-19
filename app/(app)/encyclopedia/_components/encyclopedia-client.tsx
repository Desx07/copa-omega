"use client";

import { useState } from "react";
import {
  Swords,
  Shield,
  Timer,
  Scale,
  ChevronDown,
} from "lucide-react";
import type { BladeEntry, RatchetEntry, BitEntry } from "@/lib/encyclopedia";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Swords; color: string; bg: string }
> = {
  attack: { label: "Ataque", icon: Swords, color: "text-omega-red", bg: "bg-omega-red/20" },
  defense: { label: "Defensa", icon: Shield, color: "text-omega-blue", bg: "bg-omega-blue/20" },
  stamina: { label: "Stamina", icon: Timer, color: "text-omega-green", bg: "bg-omega-green/20" },
  balance: { label: "Balance", icon: Scale, color: "text-omega-purple", bg: "bg-omega-purple/20" },
};

const TIER_STYLE: Record<string, string> = {
  S: "bg-omega-gold/20 text-omega-gold border-omega-gold/30",
  A: "bg-omega-purple/20 text-omega-purple border-omega-purple/30",
  B: "bg-omega-blue/20 text-omega-blue border-omega-blue/30",
  C: "bg-white/10 text-omega-muted border-white/10",
};

const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3 };

const CATEGORY_HEADER: Record<
  string,
  { label: string; color: string; border: string }
> = {
  attack: { label: "Ataque", color: "text-omega-red", border: "border-omega-red/30" },
  stamina: { label: "Resistencia", color: "text-omega-green", border: "border-omega-green/30" },
  defense: { label: "Defensa", color: "text-omega-blue", border: "border-omega-blue/30" },
  balance: { label: "Equilibrio", color: "text-omega-purple", border: "border-omega-purple/30" },
};

type Tab = "blades" | "ratchets" | "bits" | "guide";

interface EncyclopediaClientProps {
  blades: BladeEntry[];
  ratchets: RatchetEntry[];
  bits: BitEntry[];
  guide: { title: string; content: string }[];
  guideImages: Record<string, string>;
}

export default function EncyclopediaClient({
  blades,
  ratchets,
  bits,
  guide,
  guideImages,
}: EncyclopediaClientProps) {
  const [tab, setTab] = useState<Tab>("blades");

  const tabs: { key: Tab; label: string }[] = [
    { key: "blades", label: "Blades" },
    { key: "ratchets", label: "Ratchets" },
    { key: "bits", label: "Bits" },
    { key: "guide", label: "Guia" },
  ];

  return (
    <>
      <div className="flex gap-1 bg-omega-surface rounded-xl p-1 border border-omega-border/30">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${
              tab === t.key
                ? "bg-omega-purple/20 text-omega-purple border border-omega-purple/30"
                : "text-omega-muted hover:text-omega-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "blades" && <BladesTab blades={blades} guideImages={guideImages} />}
      {tab === "ratchets" && <RatchetsTab ratchets={ratchets} guideImages={guideImages} />}
      {tab === "bits" && <BitsTab bits={bits} guideImages={guideImages} />}
      {tab === "guide" && <GuideTab sections={guide} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Blades
// ---------------------------------------------------------------------------

function BladesTab({ blades, guideImages }: { blades: BladeEntry[]; guideImages: Record<string, string> }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...blades].sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
  );

  // Group images by line
  const catalogImages = [
    { label: "Linea BX", images: [guideImages.blades_bx_1, guideImages.blades_bx_2, guideImages.blades_bx_3].filter(Boolean) },
    { label: "Linea UX", images: [guideImages.blades_ux_1, guideImages.blades_ux_2].filter(Boolean) },
    { label: "Linea CX", images: [guideImages.blades_cx_1, guideImages.blades_cx_2].filter(Boolean) },
  ];

  return (
    <div className="space-y-4">
      {/* Catalog images */}
      {catalogImages.map((group) => (
        <div key={group.label} className="space-y-2">
          <h3 className="text-xs font-bold text-omega-gold uppercase tracking-wider">{group.label}</h3>
          {group.images.map((url, i) => (
            <img key={i} src={url} alt={group.label} className="w-full rounded-xl border border-omega-border/20" />
          ))}
        </div>
      ))}

      {/* Blade cards */}
      <h3 className="text-xs font-bold text-omega-text uppercase tracking-wider pt-2">Detalle por Blade</h3>
      {sorted.map((blade) => {
        const tc = TYPE_CONFIG[blade.type];
        const TypeIcon = tc.icon;
        const isOpen = expanded === blade.name;
        return (
          <button
            key={blade.name}
            onClick={() => setExpanded(isOpen ? null : blade.name)}
            className="omega-card p-3 space-y-2 w-full text-left"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`size-8 rounded-lg ${tc.bg} flex items-center justify-center shrink-0`}>
                  <TypeIcon className={`size-4 ${tc.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-omega-text truncate">{blade.name}</p>
                  {blade.weight && (
                    <p className="text-[10px] text-omega-muted">{blade.weight}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tc.bg} ${tc.color}`}>
                  {tc.label}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLE[blade.tier]}`}>
                  {blade.tier}
                </span>
                <ChevronDown className={`size-3.5 text-omega-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </div>
            <p className="text-xs text-omega-muted leading-relaxed">{blade.description}</p>
            {isOpen && (
              <>
                {blade.details && (
                  <p className="text-xs text-omega-text/80 leading-relaxed bg-omega-surface/50 rounded-lg p-2.5 border border-omega-border/20">
                    {blade.details}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[10px] text-omega-muted font-bold">Combos:</span>
                  {blade.bestCombos.map((combo) => (
                    <span
                      key={combo}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-omega-purple/10 border border-omega-purple/20 text-omega-purple"
                    >
                      {combo}
                    </span>
                  ))}
                </div>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ratchets
// ---------------------------------------------------------------------------

function RatchetsTab({ ratchets, guideImages }: { ratchets: RatchetEntry[]; guideImages: Record<string, string> }) {
  const sorted = [...ratchets].sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
  );

  const catalogImages = [guideImages.ratchets_1, guideImages.ratchets_2, guideImages.ratchets_3].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Catalog images */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-omega-green uppercase tracking-wider">Catalogo de Ratchets</h3>
        {catalogImages.map((url, i) => (
          <img key={i} src={url} alt="Ratchets" className="w-full rounded-xl border border-omega-border/20" />
        ))}
      </div>

      {/* Ratchet cards */}
      <h3 className="text-xs font-bold text-omega-text uppercase tracking-wider pt-2">Detalle por Ratchet</h3>
      {sorted.map((r) => (
        <div key={r.number} className="omega-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-omega-green/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-omega-green">{r.number}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-omega-text">Ratchet {r.number}</p>
                <p className="text-[10px] text-omega-muted">Mejor altura: {r.bestHeight}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLE[r.tier]}`}>
              {r.tier}
            </span>
          </div>
          <p className="text-xs text-omega-muted leading-relaxed">{r.description}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bits
// ---------------------------------------------------------------------------

function BitsTab({ bits, guideImages }: { bits: BitEntry[]; guideImages: Record<string, string> }) {
  const categories: ("attack" | "stamina" | "defense" | "balance")[] = [
    "attack", "stamina", "defense", "balance",
  ];

  const catImageMap: Record<string, string | undefined> = {
    attack: guideImages.bits_attack,
    stamina: guideImages.bits_stamina,
    defense: guideImages.bits_defense,
    balance: guideImages.bits_balance,
  };

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const header = CATEGORY_HEADER[cat];
        const catBits = bits
          .filter((b) => b.category === cat)
          .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

        if (catBits.length === 0) return null;

        const tc = TYPE_CONFIG[cat];
        const CatIcon = tc.icon;
        const catImg = catImageMap[cat];

        return (
          <div key={cat}>
            <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${header.border}`}>
              <CatIcon className={`size-4 ${header.color}`} />
              <h3 className={`text-sm font-bold ${header.color}`}>{header.label}</h3>
              <span className="text-[10px] text-omega-muted">({catBits.length})</span>
            </div>

            {/* Catalog image for this category */}
            {catImg && (
              <img src={catImg} alt={header.label} className="w-full rounded-xl border border-omega-border/20 mb-3" />
            )}

            <div className="space-y-2">
              {catBits.map((bit) => (
                <div key={bit.name} className="omega-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">{bit.name}</p>
                      <p className="text-[10px] text-omega-muted">{bit.weight}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLE[bit.tier]}`}>
                      {bit.tier}
                    </span>
                  </div>
                  <p className="text-xs text-omega-muted leading-relaxed">{bit.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guide
// ---------------------------------------------------------------------------

function GuideTab({ sections }: { sections: { title: string; content: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {sections.map((section, i) => {
        const isOpen = openIndex === i;
        return (
          <button
            key={i}
            onClick={() => setOpenIndex(isOpen ? null : i)}
            className="omega-card p-3 w-full text-left space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-omega-text">{section.title}</p>
              <ChevronDown
                className={`size-4 text-omega-muted shrink-0 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
            {isOpen && (
              <p className="text-xs text-omega-muted leading-relaxed whitespace-pre-line">{section.content}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
