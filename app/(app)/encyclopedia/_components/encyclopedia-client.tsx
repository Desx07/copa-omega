"use client";

import { useState, useCallback, useRef } from "react";
import {
  Swords,
  Shield,
  Timer,
  Scale,
  ChevronDown,
  Search,
  Crown,
  BookOpen,
  Zap,
  RotateCcw,
  Wrench,
  ChevronsUpDown,
  CircleDot,
  Rocket,
  Brain,
  Image as ImageIcon,
} from "lucide-react";
import type { BladeEntry, RatchetEntry, BitEntry } from "@/lib/encyclopedia";

// ---------------------------------------------------------------------------
// Config constants
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

const TIER_CARD_BORDER: Record<string, string> = {
  S: "border-l-2 border-l-omega-gold shadow-[inset_0_0_12px_rgba(245,158,11,0.08)]",
  A: "border-l-2 border-l-omega-purple",
  B: "",
  C: "opacity-80",
};

const TIER_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3 };
const TIERS = ["S", "A", "B", "C"] as const;

const TIER_HEADER_STYLE: Record<string, { label: string; color: string; border: string }> = {
  S: { label: "S TIER", color: "text-omega-gold", border: "border-omega-gold/30" },
  A: { label: "A TIER", color: "text-omega-purple", border: "border-omega-purple/30" },
  B: { label: "B TIER", color: "text-omega-blue", border: "border-omega-blue/30" },
  C: { label: "C TIER", color: "text-omega-muted", border: "border-white/10" },
};

const CATEGORY_HEADER: Record<
  string,
  { label: string; shortLabel: string; color: string; border: string }
> = {
  attack: { label: "Ataque", shortLabel: "ATK", color: "text-omega-red", border: "border-omega-red/30" },
  stamina: { label: "Resistencia", shortLabel: "STA", color: "text-omega-green", border: "border-omega-green/30" },
  defense: { label: "Defensa", shortLabel: "DEF", color: "text-omega-blue", border: "border-omega-blue/30" },
  balance: { label: "Equilibrio", shortLabel: "BAL", color: "text-omega-purple", border: "border-omega-purple/30" },
};

const GUIDE_ICONS = [
  Rocket,
  BookOpen,
  Swords,
  ChevronsUpDown,
  CircleDot,
  Brain,
  Wrench,
  Zap,
] as const;

type Tab = "guide" | "blades" | "ratchets" | "bits";

interface EncyclopediaClientProps {
  blades: BladeEntry[];
  ratchets: RatchetEntry[];
  bits: BitEntry[];
  guide: { title: string; content: string }[];
  guideImages: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Shared: Search bar
// ---------------------------------------------------------------------------

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-omega-muted pointer-events-none" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 text-sm bg-omega-surface border border-omega-border/30 rounded-xl text-omega-text placeholder:text-omega-muted/60 focus:outline-none focus:ring-2 focus:ring-omega-purple/40 transition-all"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Tier filter chips
// ---------------------------------------------------------------------------

function TierFilterChips({
  active,
  onToggle,
}: {
  active: Set<string>;
  onToggle: (tier: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {TIERS.map((tier) => {
        const isActive = active.has(tier);
        return (
          <button
            key={tier}
            onClick={() => onToggle(tier)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
              isActive
                ? TIER_STYLE[tier]
                : "bg-omega-surface border-omega-border/20 text-omega-muted"
            }`}
            aria-label={`Filtrar tier ${tier}`}
            aria-pressed={isActive}
          >
            {tier === "S" && <Crown className="size-3 inline mr-0.5 -mt-0.5" aria-hidden="true" />}
            {tier}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Result count
// ---------------------------------------------------------------------------

function ResultCount({ shown, total }: { shown: number; total: number }) {
  return (
    <p className="text-[11px] text-omega-muted">
      Mostrando {shown} de {total}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Shared: Collapsible catalog images
// ---------------------------------------------------------------------------

function CatalogCollapsible({
  images,
}: {
  images: { label: string; urls: string[] }[];
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const validGroups = images.filter((g) => g.urls.length > 0);

  if (validGroups.length === 0) return null;

  return (
    <div className="space-y-2">
      {validGroups.map((group) => {
        const isOpen = openGroup === group.label;
        return (
          <div key={group.label} className="omega-card overflow-hidden">
            <button
              onClick={() => setOpenGroup(isOpen ? null : group.label)}
              className="flex items-center justify-between w-full p-3 text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-omega-gold" aria-hidden="true" />
                <span className="text-xs font-bold text-omega-text">{group.label}</span>
                <span className="text-[10px] text-omega-muted">({group.urls.length} imgs)</span>
              </div>
              <ChevronDown
                className={`size-4 text-omega-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div className="px-3 pb-3 space-y-2">
                {group.urls.map((url, i) => (
                  <SafeImage
                    key={i}
                    src={url}
                    alt={group.label}
                    className="w-full rounded-xl border border-omega-border/20"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Safe image with lazy loading + error handling
// ---------------------------------------------------------------------------

function SafeImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={className}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared: Sticky tier section header
// ---------------------------------------------------------------------------

function TierSection({ tier, count, children }: { tier: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const style = TIER_HEADER_STYLE[tier];
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`sticky top-0 z-10 flex items-center gap-2 py-2 px-2 w-full text-left bg-omega-black/90 backdrop-blur-sm border-b ${style.border}`}
      >
        {tier === "S" && <Crown className="size-3.5 text-omega-gold" aria-hidden="true" />}
        <span className={`text-[11px] font-black tracking-widest ${style.color}`}>
          {style.label}
        </span>
        <span className="text-[10px] text-omega-muted">({count})</span>
        <ChevronDown
          className={`size-3.5 text-omega-muted ml-auto transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="space-y-2 pt-2">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hook: tier filter + search
// ---------------------------------------------------------------------------

function useTierFilter() {
  const [activeTiers, setActiveTiers] = useState<string[]>([...TIERS]);
  const activeSet = new Set(activeTiers);
  const toggle = useCallback((tier: string) => {
    setActiveTiers((prev) => {
      const has = prev.includes(tier);
      // If tapping the only active tier, show all
      if (prev.length === 1 && has) {
        return [...TIERS];
      }
      // If all are active, switch to just this one
      if (prev.length === TIERS.length) {
        return [tier];
      }
      // Otherwise toggle
      if (has) {
        return prev.filter((t) => t !== tier);
      }
      return [...prev, tier];
    });
  }, []);
  return { activeTiers: activeSet, toggle };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EncyclopediaClient({
  blades,
  ratchets,
  bits,
  guide,
  guideImages,
}: EncyclopediaClientProps) {
  const [tab, setTab] = useState<Tab>("guide");

  const tabs: { key: Tab; label: string }[] = [
    { key: "guide", label: "Empeza Aca" },
    { key: "blades", label: "Blades" },
    { key: "ratchets", label: "Ratchets" },
    { key: "bits", label: "Bits" },
  ];

  return (
    <>
      {/* Sticky tab bar with backdrop-blur */}
      <div className="sticky top-0 z-20 bg-omega-black/80 backdrop-blur-md pb-2 pt-1 -mx-4 px-4">
        <div className="flex gap-1 bg-omega-surface rounded-xl p-1 border border-omega-border/30">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all ${
                tab === t.key
                  ? "bg-omega-purple/20 text-omega-purple border border-omega-purple/30"
                  : "text-omega-muted hover:text-omega-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "guide" && <GuideTab sections={guide} />}
      {tab === "blades" && <BladesTab blades={blades} guideImages={guideImages} />}
      {tab === "ratchets" && <RatchetsTab ratchets={ratchets} guideImages={guideImages} />}
      {tab === "bits" && <BitsTab bits={bits} guideImages={guideImages} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Guide tab (Empeza Aca)
// ---------------------------------------------------------------------------

function GuideTab({ sections }: { sections: { title: string; content: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {sections.map((section, i) => {
        const isOpen = openIndex === i;
        const StepIcon = GUIDE_ICONS[i % GUIDE_ICONS.length];
        const bullets = section.content
          .split(". ")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((s) => (s.endsWith(".") ? s : s + "."));

        return (
          <button
            key={i}
            onClick={() => setOpenIndex(isOpen ? null : i)}
            className="omega-card p-3 w-full text-left space-y-2"
            aria-expanded={isOpen}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-lg bg-omega-purple/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-omega-purple">{i + 1}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <StepIcon className="size-4 text-omega-purple shrink-0" aria-hidden="true" />
                  <p className="text-sm font-bold text-omega-text truncate">{section.title}</p>
                </div>
              </div>
              <ChevronDown
                className={`size-4 text-omega-muted shrink-0 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </div>
            {isOpen && (
              <ul className="space-y-1.5 pt-1 pl-1">
                {bullets.map((bullet, bi) => (
                  <li key={bi} className="flex gap-2 text-xs text-omega-muted leading-relaxed">
                    <span className="text-omega-purple/60 shrink-0 mt-0.5">-</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blades tab
// ---------------------------------------------------------------------------

function BladesTab({
  blades,
  guideImages,
}: {
  blades: BladeEntry[];
  guideImages: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { activeTiers, toggle } = useTierFilter();

  const catalogImages = [
    {
      label: "Linea BX",
      urls: [guideImages.blades_bx_1, guideImages.blades_bx_2, guideImages.blades_bx_3].filter(Boolean),
    },
    {
      label: "Linea UX",
      urls: [guideImages.blades_ux_1, guideImages.blades_ux_2].filter(Boolean),
    },
    {
      label: "Linea CX",
      urls: [guideImages.blades_cx_1, guideImages.blades_cx_2].filter(Boolean),
    },
  ];

  const sorted = [...blades].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
  const filtered = sorted.filter(
    (b) =>
      activeTiers.has(b.tier) &&
      b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by tier for sticky headers
  const grouped = TIERS.map((tier) => ({
    tier,
    items: filtered.filter((b) => b.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-3">
      <CatalogCollapsible images={catalogImages} />

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar blade..." />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <TierFilterChips active={activeTiers} onToggle={toggle} />
        <ResultCount shown={filtered.length} total={blades.length} />
      </div>

      {grouped.map(({ tier, items }) => (
        <TierSection key={tier} tier={tier} count={items.length}>
            {items.map((blade) => {
              const tc = TYPE_CONFIG[blade.type];
              const TypeIcon = tc.icon;
              const isOpen = expanded === blade.name;
              return (
                <button
                  key={blade.name}
                  onClick={() => setExpanded(isOpen ? null : blade.name)}
                  className={`omega-card p-3 w-full text-left space-y-0 ${TIER_CARD_BORDER[blade.tier]}`}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`size-8 rounded-lg ${tc.bg} flex items-center justify-center shrink-0`}
                      >
                        <TypeIcon className={`size-4 ${tc.color}`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          {blade.tier === "S" && (
                            <Crown className="size-3 text-omega-gold shrink-0" aria-hidden="true" />
                          )}
                          <p className="text-sm font-bold text-omega-text truncate">{blade.name}</p>
                        </div>
                        {blade.weight && (
                          <p className="text-[10px] text-omega-muted">{blade.weight}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tc.bg} ${tc.color}`}
                      >
                        {tc.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLE[blade.tier]}`}
                      >
                        {blade.tier}
                      </span>
                      <ChevronDown
                        className={`size-3.5 text-omega-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs text-omega-muted leading-relaxed">
                        {blade.description}
                      </p>
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
                    </div>
                  )}
                </button>
              );
            })}
        </TierSection>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-omega-muted text-center py-6">
          No se encontraron blades con ese filtro.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ratchets tab
// ---------------------------------------------------------------------------

function RatchetsTab({
  ratchets,
  guideImages,
}: {
  ratchets: RatchetEntry[];
  guideImages: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { activeTiers, toggle } = useTierFilter();

  const catalogImages = [
    {
      label: "Catalogo de Ratchets",
      urls: [guideImages.ratchets_1, guideImages.ratchets_2, guideImages.ratchets_3].filter(Boolean),
    },
  ];

  const sorted = [...ratchets].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
  const filtered = sorted.filter(
    (r) =>
      activeTiers.has(r.tier) &&
      r.number.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = TIERS.map((tier) => ({
    tier,
    items: filtered.filter((r) => r.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-3">
      <CatalogCollapsible images={catalogImages} />

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar ratchet..." />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <TierFilterChips active={activeTiers} onToggle={toggle} />
        <ResultCount shown={filtered.length} total={ratchets.length} />
      </div>

      {grouped.map(({ tier, items }) => (
        <TierSection key={tier} tier={tier} count={items.length}>
            {items.map((r) => {
              const isOpen = expanded === r.number;
              return (
                <button
                  key={r.number}
                  onClick={() => setExpanded(isOpen ? null : r.number)}
                  className={`omega-card p-3 w-full text-left space-y-0 ${TIER_CARD_BORDER[r.tier]}`}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-omega-green/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-omega-green">{r.number}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          {r.tier === "S" && (
                            <Crown className="size-3 text-omega-gold shrink-0" aria-hidden="true" />
                          )}
                          <p className="text-sm font-bold text-omega-text">Ratchet {r.number}</p>
                        </div>
                        <p className="text-[10px] text-omega-muted">Mejor altura: {r.bestHeight}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLE[r.tier]}`}
                      >
                        {r.tier}
                      </span>
                      <ChevronDown
                        className={`size-3.5 text-omega-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs text-omega-muted leading-relaxed">{r.description}</p>
                      {r.details && (
                        <p className="text-xs text-omega-text/80 leading-relaxed bg-omega-surface/50 rounded-lg p-2.5 border border-omega-border/20">
                          {r.details}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
        </TierSection>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-omega-muted text-center py-6">
          No se encontraron ratchets con ese filtro.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bits tab
// ---------------------------------------------------------------------------

function BitsTab({
  bits,
  guideImages,
}: {
  bits: BitEntry[];
  guideImages: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { activeTiers, toggle } = useTierFilter();

  const categories: ("attack" | "stamina" | "defense" | "balance")[] = [
    "attack",
    "stamina",
    "defense",
    "balance",
  ];

  const catImageMap: Record<string, string | undefined> = {
    attack: guideImages.bits_attack,
    stamina: guideImages.bits_stamina,
    defense: guideImages.bits_defense,
    balance: guideImages.bits_balance,
  };

  const catalogImages = categories
    .map((cat) => ({
      label: CATEGORY_HEADER[cat].label,
      urls: catImageMap[cat] ? [catImageMap[cat]!] : [],
    }))
    .filter((g) => g.urls.length > 0);

  const allFiltered = bits.filter(
    (b) =>
      activeTiers.has(b.tier) &&
      b.name.toLowerCase().includes(search.toLowerCase())
  );

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToCategory = (cat: string) => {
    sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-3">
      <CatalogCollapsible images={catalogImages} />

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar bit..." />

      {/* Jump navigation */}
      <div className="flex gap-1.5">
        {categories.map((cat) => {
          const header = CATEGORY_HEADER[cat];
          const CatIcon = TYPE_CONFIG[cat].icon;
          return (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-omega-border/20 bg-omega-surface transition-colors hover:bg-omega-card-hover ${header.color}`}
              aria-label={`Ir a ${header.label}`}
            >
              <CatIcon className="size-3" aria-hidden="true" />
              {header.shortLabel}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <TierFilterChips active={activeTiers} onToggle={toggle} />
        <ResultCount shown={allFiltered.length} total={bits.length} />
      </div>

      {categories.map((cat) => {
        const header = CATEGORY_HEADER[cat];
        const tc = TYPE_CONFIG[cat];
        const CatIcon = tc.icon;

        const catBits = allFiltered
          .filter((b) => b.category === cat)
          .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

        if (catBits.length === 0) return null;

        // Group by tier within category
        const tierGroups = TIERS.map((tier) => ({
          tier,
          items: catBits.filter((b) => b.tier === tier),
        })).filter((g) => g.items.length > 0);

        return (
          <div
            key={cat}
            ref={(el) => {
              sectionRefs.current[cat] = el;
            }}
          >
            {/* Sticky category header */}
            <div
              className={`sticky top-12 z-10 flex items-center gap-2 py-2 px-2 bg-omega-black/90 backdrop-blur-sm border-b ${header.border}`}
            >
              <CatIcon className={`size-4 ${header.color}`} aria-hidden="true" />
              <h3 className={`text-sm font-bold ${header.color}`}>{header.label}</h3>
              <span className="text-[10px] text-omega-muted">({catBits.length})</span>
            </div>

            {tierGroups.map(({ tier, items }) => (
              <div key={tier} className="pt-2">
                <div className="flex items-center gap-1.5 px-1 pb-1">
                  {tier === "S" && <Crown className="size-3 text-omega-gold" aria-hidden="true" />}
                  <span
                    className={`text-[10px] font-black tracking-wider ${TIER_HEADER_STYLE[tier].color}`}
                  >
                    {TIER_HEADER_STYLE[tier].label}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((bit) => {
                    const isOpen = expanded === bit.name;
                    return (
                      <button
                        key={bit.name}
                        onClick={() => setExpanded(isOpen ? null : bit.name)}
                        className={`omega-card p-3 w-full text-left space-y-0 ${TIER_CARD_BORDER[bit.tier]}`}
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              {bit.tier === "S" && (
                                <Crown className="size-3 text-omega-gold shrink-0" aria-hidden="true" />
                              )}
                              <p className="text-sm font-bold text-omega-text truncate">
                                {bit.name}
                              </p>
                            </div>
                            <p className="text-[10px] text-omega-muted">{bit.weight}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLE[bit.tier]}`}
                            >
                              {bit.tier}
                            </span>
                            <ChevronDown
                              className={`size-3.5 text-omega-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </div>
                        </div>

                        {isOpen && (
                          <div className="space-y-2 pt-2">
                            <p className="text-xs text-omega-muted leading-relaxed">
                              {bit.description}
                            </p>
                            {bit.details && (
                              <p className="text-xs text-omega-text/80 leading-relaxed bg-omega-surface/50 rounded-lg p-2.5 border border-omega-border/20">
                                {bit.details}
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {allFiltered.length === 0 && (
        <p className="text-sm text-omega-muted text-center py-6">
          No se encontraron bits con ese filtro.
        </p>
      )}
    </div>
  );
}
