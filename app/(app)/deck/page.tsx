"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Save,
  Swords,
  ShieldHalf,
  Timer,
  Scale,
  ChevronDown,
  Check,
  Layers,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  BLADES,
  RATCHETS,
  BITS,
  type BladeEntry,
  type RatchetEntry,
  type BitEntry,
} from "@/lib/encyclopedia";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeckSlot {
  blade: string;
  ratchet: string;
  bit: string;
}

type SlotIndex = 0 | 1 | 2;

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Swords; color: string; border: string; bg: string }
> = {
  attack: { label: "ATK", icon: Swords, color: "text-omega-red", border: "border-omega-red/40", bg: "bg-omega-red/10" },
  defense: { label: "DEF", icon: ShieldHalf, color: "text-omega-blue", border: "border-omega-blue/40", bg: "bg-omega-blue/10" },
  stamina: { label: "STA", icon: Timer, color: "text-omega-green", border: "border-omega-green/40", bg: "bg-omega-green/10" },
  balance: { label: "BAL", icon: Scale, color: "text-omega-purple", border: "border-omega-purple/40", bg: "bg-omega-purple/10" },
};

const TIER_COLORS: Record<string, string> = {
  S: "text-omega-gold",
  A: "text-omega-purple",
  B: "text-omega-blue",
  C: "text-omega-muted",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeckPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<DeckSlot[]>([
    { blade: "", ratchet: "", bit: "" },
    { blade: "", ratchet: "", bit: "" },
    { blade: "", ratchet: "", bit: "" },
  ]);
  const [activeDropdown, setActiveDropdown] = useState<{
    slot: SlotIndex;
    field: "blade" | "ratchet" | "bit";
  } | null>(null);
  const [search, setSearch] = useState("");

  const fetchDeck = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deck");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSlots([
            { blade: data.slot1_blade, ratchet: data.slot1_ratchet, bit: data.slot1_bit },
            { blade: data.slot2_blade, ratchet: data.slot2_ratchet, bit: data.slot2_bit },
            { blade: data.slot3_blade, ratchet: data.slot3_ratchet, bit: data.slot3_bit },
          ]);
        }
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick() {
      if (activeDropdown) setActiveDropdown(null);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [activeDropdown]);

  function updateSlot(slotIdx: SlotIndex, field: keyof DeckSlot, value: string) {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], [field]: value };
      return next;
    });
    setActiveDropdown(null);
    setSearch("");
  }

  function toggleDropdown(
    e: React.MouseEvent,
    slot: SlotIndex,
    field: "blade" | "ratchet" | "bit"
  ) {
    e.stopPropagation();
    setSearch("");
    if (activeDropdown?.slot === slot && activeDropdown?.field === field) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown({ slot, field });
    }
  }

  async function handleSave() {
    // Validaciones basicas
    for (let i = 0; i < 3; i++) {
      if (!slots[i].blade || !slots[i].ratchet || !slots[i].bit) {
        toast.error(`Slot ${i + 1} esta incompleto`);
        return;
      }
    }

    const bladeNames = slots.map((s) => s.blade);
    if (new Set(bladeNames).size !== 3) {
      toast.error("Los 3 blades deben ser diferentes");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot1_blade: slots[0].blade, slot1_ratchet: slots[0].ratchet, slot1_bit: slots[0].bit,
          slot2_blade: slots[1].blade, slot2_ratchet: slots[1].ratchet, slot2_bit: slots[1].bit,
          slot3_blade: slots[2].blade, slot3_ratchet: slots[2].ratchet, slot3_bit: slots[2].bit,
        }),
      });

      if (res.ok) {
        toast.success("Deck guardado");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Error al guardar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  }

  // Check duplicates
  const bladeNames = slots.map((s) => s.blade).filter(Boolean);
  const hasDuplicateBlades = bladeNames.length !== new Set(bladeNames).size;
  const isComplete = slots.every((s) => s.blade && s.ratchet && s.bit);

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="px-4 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-omega-purple/20 border border-omega-purple/30 flex items-center justify-center">
            <Layers className="size-5 text-omega-purple" />
          </div>
          <div>
            <h1 className="text-xl font-black text-omega-text">Mi Deck</h1>
            <p className="text-xs text-omega-muted">
              Arma tu equipo de 3 beyblades para Deck Battles
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="px-4">
        <div className="rounded-xl bg-omega-purple/10 border border-omega-purple/20 p-3 flex items-start gap-2.5">
          <Sparkles className="size-4 text-omega-purple shrink-0 mt-0.5" />
          <p className="text-xs text-omega-muted leading-relaxed">
            Elegi 3 blades <span className="text-omega-text font-semibold">diferentes</span> con su ratchet y bit.
            Tu deck se congela al iniciar una batalla.
            Estrategia: pensa en que orden los vas a jugar.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="px-4">
          <div className="omega-card p-10 text-center">
            <Loader2 className="size-6 text-omega-muted animate-spin mx-auto" />
          </div>
        </div>
      ) : (
        <>
          {/* Deck slots */}
          <div className="px-4 space-y-4">
            {slots.map((slot, idx) => {
              const slotIdx = idx as SlotIndex;
              const blade = BLADES.find((b) => b.name === slot.blade);
              const typeInfo = blade ? TYPE_CONFIG[blade.type] : null;
              const isBladeInUse = slot.blade && bladeNames.filter((n) => n === slot.blade).length > 1;

              return (
                <div
                  key={idx}
                  className="omega-card p-4 space-y-3"
                >
                  {/* Slot header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-7 rounded-lg bg-omega-surface flex items-center justify-center text-xs font-black text-omega-gold">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-omega-text">
                        Round {idx + 1}
                      </span>
                    </div>
                    {typeInfo && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${typeInfo.bg} ${typeInfo.border} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    )}
                  </div>

                  {/* Blade selector */}
                  <div className="relative">
                    <label className="block text-[10px] font-bold uppercase text-omega-muted mb-1 tracking-wider">
                      Blade
                    </label>
                    <button
                      onClick={(e) => toggleDropdown(e, slotIdx, "blade")}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                        slot.blade
                          ? `bg-omega-dark border-omega-border/50 text-omega-text ${isBladeInUse ? "border-omega-red/60 ring-1 ring-omega-red/30" : ""}`
                          : "bg-omega-dark/60 border-dashed border-omega-border/30 text-omega-muted"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {blade && typeInfo && (
                          <typeInfo.icon className={`size-3.5 ${typeInfo.color}`} />
                        )}
                        {slot.blade || "Seleccionar blade..."}
                        {blade && (
                          <span className={`text-[10px] font-bold ${TIER_COLORS[blade.tier]}`}>
                            {blade.tier}
                          </span>
                        )}
                      </span>
                      <ChevronDown className="size-4 text-omega-muted" />
                    </button>
                    {activeDropdown?.slot === slotIdx && activeDropdown?.field === "blade" && (
                      <DropdownList
                        items={BLADES}
                        selected={slot.blade}
                        usedBlades={bladeNames.filter((_, i) => i !== idx)}
                        onSelect={(name) => updateSlot(slotIdx, "blade", name)}
                        search={search}
                        onSearch={setSearch}
                        type="blade"
                      />
                    )}
                  </div>

                  {/* Ratchet + Bit row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Ratchet */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold uppercase text-omega-muted mb-1 tracking-wider">
                        Ratchet
                      </label>
                      <button
                        onClick={(e) => toggleDropdown(e, slotIdx, "ratchet")}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                          slot.ratchet
                            ? "bg-omega-dark border-omega-border/50 text-omega-text"
                            : "bg-omega-dark/60 border-dashed border-omega-border/30 text-omega-muted"
                        }`}
                      >
                        <span>{slot.ratchet || "Ratchet..."}</span>
                        <ChevronDown className="size-3.5 text-omega-muted" />
                      </button>
                      {activeDropdown?.slot === slotIdx && activeDropdown?.field === "ratchet" && (
                        <DropdownList
                          items={RATCHETS}
                          selected={slot.ratchet}
                          onSelect={(name) => updateSlot(slotIdx, "ratchet", name)}
                          search={search}
                          onSearch={setSearch}
                          type="ratchet"
                        />
                      )}
                    </div>

                    {/* Bit */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold uppercase text-omega-muted mb-1 tracking-wider">
                        Bit
                      </label>
                      <button
                        onClick={(e) => toggleDropdown(e, slotIdx, "bit")}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm font-semibold ${
                          slot.bit
                            ? "bg-omega-dark border-omega-border/50 text-omega-text"
                            : "bg-omega-dark/60 border-dashed border-omega-border/30 text-omega-muted"
                        }`}
                      >
                        <span>{slot.bit || "Bit..."}</span>
                        <ChevronDown className="size-3.5 text-omega-muted" />
                      </button>
                      {activeDropdown?.slot === slotIdx && activeDropdown?.field === "bit" && (
                        <DropdownList
                          items={BITS}
                          selected={slot.bit}
                          onSelect={(name) => updateSlot(slotIdx, "bit", name)}
                          search={search}
                          onSearch={setSearch}
                          type="bit"
                        />
                      )}
                    </div>
                  </div>

                  {/* Combo display */}
                  {slot.blade && slot.ratchet && slot.bit && (
                    <div className="rounded-lg bg-omega-surface/60 border border-white/[0.04] px-3 py-2">
                      <p className="text-xs font-bold text-omega-gold">
                        {slot.blade} {slot.ratchet} {slot.bit}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Warnings */}
          {hasDuplicateBlades && (
            <div className="px-4">
              <div className="rounded-xl bg-omega-red/10 border border-omega-red/20 p-3 flex items-center gap-2">
                <AlertTriangle className="size-4 text-omega-red shrink-0" />
                <p className="text-xs text-omega-red font-semibold">
                  Los 3 blades deben ser diferentes
                </p>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="px-4">
            <button
              onClick={handleSave}
              disabled={saving || !isComplete || hasDuplicateBlades}
              className="omega-btn omega-btn-purple w-full py-3 text-sm"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saving ? "Guardando..." : "Guardar Deck"}
            </button>
          </div>

          {/* Link to deck battles */}
          <div className="px-4">
            <Link
              href="/deck-battles"
              className="omega-btn omega-btn-gold w-full py-3 text-sm justify-center"
            >
              <Swords className="size-4" />
              Ir a Deck Battles
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dropdown component
// ---------------------------------------------------------------------------

function DropdownList({
  items,
  selected,
  usedBlades,
  onSelect,
  search,
  onSearch,
  type,
}: {
  items: (BladeEntry | RatchetEntry | BitEntry)[];
  selected: string;
  usedBlades?: string[];
  onSelect: (name: string) => void;
  search: string;
  onSearch: (s: string) => void;
  type: "blade" | "ratchet" | "bit";
}) {
  const getName = (item: BladeEntry | RatchetEntry | BitEntry) => {
    if (type === "ratchet") return (item as RatchetEntry).number;
    return (item as BladeEntry | BitEntry).name;
  };

  const normalizedSearch = search.toLowerCase().trim();
  const filtered = normalizedSearch
    ? items.filter((item) => getName(item).toLowerCase().includes(normalizedSearch))
    : items;

  // Sort by tier: S > A > B > C
  const tierOrder = { S: 0, A: 1, B: 2, C: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const ta = tierOrder[a.tier as keyof typeof tierOrder] ?? 9;
    const tb = tierOrder[b.tier as keyof typeof tierOrder] ?? 9;
    return ta - tb;
  });

  return (
    <div
      className="absolute z-50 top-full mt-1 left-0 right-0 max-h-60 overflow-y-auto rounded-xl bg-omega-card border border-omega-border/40 shadow-xl shadow-black/40"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search */}
      <div className="sticky top-0 bg-omega-card p-2 border-b border-white/[0.06]">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={`Buscar ${type}...`}
          className="w-full px-2.5 py-1.5 text-xs bg-omega-dark rounded-lg border border-omega-border/30 text-omega-text placeholder:text-omega-muted/60 focus:outline-none focus:ring-1 focus:ring-omega-purple/40"
          autoFocus
        />
      </div>

      {sorted.length === 0 ? (
        <div className="p-3 text-center text-xs text-omega-muted">
          No se encontraron resultados
        </div>
      ) : (
        sorted.map((item) => {
          const name = getName(item);
          const isSelected = name === selected;
          const isUsed = usedBlades?.includes(name) && !isSelected;
          const tierColor = TIER_COLORS[item.tier] ?? "text-omega-muted";

          let typeIcon = null;
          if (type === "blade") {
            const bladeItem = item as BladeEntry;
            const tc = TYPE_CONFIG[bladeItem.type];
            if (tc) {
              const Icon = tc.icon;
              typeIcon = <Icon className={`size-3 ${tc.color} shrink-0`} />;
            }
          }
          if (type === "bit") {
            const bitItem = item as BitEntry;
            const tc = TYPE_CONFIG[bitItem.category];
            if (tc) {
              const Icon = tc.icon;
              typeIcon = <Icon className={`size-3 ${tc.color} shrink-0`} />;
            }
          }

          return (
            <button
              key={name}
              onClick={() => {
                if (!isUsed) onSelect(name);
              }}
              disabled={!!isUsed}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors border-b border-white/[0.03] last:border-b-0 ${
                isUsed
                  ? "opacity-30 cursor-not-allowed"
                  : isSelected
                    ? "bg-omega-purple/20 text-omega-text"
                    : "hover:bg-omega-surface text-omega-text"
              }`}
            >
              {typeIcon}
              <span className="font-semibold flex-1 truncate">{name}</span>
              <span className={`text-[10px] font-black ${tierColor}`}>{item.tier}</span>
              {isSelected && <Check className="size-3 text-omega-green" />}
              {isUsed && (
                <span className="text-[9px] text-omega-red font-bold">EN USO</span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
