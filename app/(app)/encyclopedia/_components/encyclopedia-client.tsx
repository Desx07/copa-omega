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

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Tab = "blades" | "ratchets" | "bits" | "guide";

interface EncyclopediaClientProps {
  blades: BladeEntry[];
  ratchets: RatchetEntry[];
  bits: BitEntry[];
  guide: { title: string; content: string }[];
}

export default function EncyclopediaClient({
  blades,
  ratchets,
  bits,
  guide,
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
      {/* Tab bar */}
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

      {/* Content */}
      {tab === "blades" && <BladesTab blades={blades} />}
      {tab === "ratchets" && <RatchetsTab ratchets={ratchets} />}
      {tab === "bits" && <BitsTab bits={bits} />}
      {tab === "guide" && <GuideTab sections={guide} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Blades
// ---------------------------------------------------------------------------

function BladesTab({ blades }: { blades: BladeEntry[] }) {
  const sorted = [...blades].sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
  );

  return (
    <div className="space-y-2">
      {sorted.map((blade) => {
        const tc = TYPE_CONFIG[blade.type];
        const TypeIcon = tc.icon;
        return (
          <div key={blade.name} className="omega-card p-3 space-y-2">
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
              </div>
            </div>
            <p className="text-xs text-omega-muted leading-relaxed">{blade.description}</p>
            <div className="flex flex-wrap gap-1">
              {blade.bestCombos.map((combo) => (
                <span
                  key={combo}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-omega-surface border border-omega-border/30 text-omega-muted"
                >
                  {combo}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ratchets
// ---------------------------------------------------------------------------

function RatchetsTab({ ratchets }: { ratchets: RatchetEntry[] }) {
  const sorted = [...ratchets].sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
  );

  return (
    <div className="space-y-2">
      {sorted.map((r) => (
        <div key={r.number} className="omega-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-omega-gold/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-omega-gold">{r.number}</span>
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
// Bits — grouped by category
// ---------------------------------------------------------------------------

function BitsTab({ bits }: { bits: BitEntry[] }) {
  const categories: ("attack" | "stamina" | "defense" | "balance")[] = [
    "attack",
    "stamina",
    "defense",
    "balance",
  ];

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

        return (
          <div key={cat}>
            <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${header.border}`}>
              <CatIcon className={`size-4 ${header.color}`} />
              <h3 className={`text-sm font-bold ${header.color}`}>{header.label}</h3>
              <span className="text-[10px] text-omega-muted">({catBits.length})</span>
            </div>
            <div className="space-y-2">
              {catBits.map((bit) => (
                <div key={bit.name} className="omega-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">{bit.name}</p>
                      <p className="text-[10px] text-omega-muted">{bit.weight}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tc.bg} ${tc.color}`}>
                        {header.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLE[bit.tier]}`}>
                        {bit.tier}
                      </span>
                    </div>
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
// Guide — expandable sections
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
              <p className="text-xs text-omega-muted leading-relaxed">{section.content}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
