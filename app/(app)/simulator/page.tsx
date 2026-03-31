"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Swords,
  ShieldHalf,
  Timer,
  Scale,
  Zap,
  Star,
  Trophy,
  Cpu,
  ChevronDown,
  Sparkles,
  Weight,
  Target,
  Shield,
  Save,
  Info,
} from "lucide-react";
import {
  BLADE_DATA,
  RATCHET_DATA,
  BIT_DATA,
  calculateComboStats,
  type BladeStats,
  type RatchetStats,
  type BitStats,
  type ComboStats,
} from "@/lib/simulator-data";

// ─── Helpers ──────────────────────────────────────────────────

const typeConfig = {
  attack:  { label: "ATK", icon: Swords,    color: "text-omega-red",    bg: "bg-omega-red/15",    border: "border-omega-red/40" },
  defense: { label: "DEF", icon: ShieldHalf, color: "text-omega-blue",   bg: "bg-omega-blue/15",   border: "border-omega-blue/40" },
  stamina: { label: "STA", icon: Timer,      color: "text-omega-green",  bg: "bg-omega-green/15",  border: "border-omega-green/40" },
  balance: { label: "BAL", icon: Scale,      color: "text-omega-purple", bg: "bg-omega-purple/15", border: "border-omega-purple/40" },
};

const tierColors: Record<string, string> = {
  S: "text-omega-gold neon-gold",
  A: "text-omega-purple neon-purple",
  B: "text-omega-blue neon-blue",
  C: "text-omega-muted",
};

const tierBg: Record<string, string> = {
  S: "bg-omega-gold/15 border-omega-gold/40",
  A: "bg-omega-purple/15 border-omega-purple/40",
  B: "bg-omega-blue/15 border-omega-blue/40",
  C: "bg-omega-muted/15 border-omega-muted/40",
};

// ─── Radar Chart (CSS Pentagon) ──────────────────────────────

function RadarChart({ stats }: { stats: ComboStats }) {
  const labels = [
    { key: "atk", label: "ATK", val: stats.atk, color: "#ff4757" },
    { key: "def", label: "DEF", val: stats.def, color: "#00b4d8" },
    { key: "sta", label: "STA", val: stats.sta, color: "#2ed573" },
    { key: "wgt", label: "WGT", val: stats.wgt, color: "#ffd60a" },
    { key: "bst", label: "BST", val: stats.bst, color: "#7b2ff7" },
  ];

  // Pentagon math: 5 points, first at top (-90deg)
  const cx = 120;
  const cy = 120;
  const maxR = 90;

  function getPoint(index: number, value: number): { x: number; y: number } {
    const angle = ((2 * Math.PI) / 5) * index - Math.PI / 2;
    const r = (value / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  // Grid pentagons
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPaths = gridLevels.map((level) => {
    const points = labels.map((_, i) => getPoint(i, level));
    return points.map((p) => `${p.x},${p.y}`).join(" ");
  });

  // Data polygon
  const dataPoints = labels.map((l, i) => getPoint(i, l.val));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Label positions (slightly outside)
  const labelPositions = labels.map((_, i) => getPoint(i, 115));

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <svg viewBox="0 0 240 240" className="w-full h-auto">
        {/* Grid lines */}
        {gridPaths.map((path, i) => (
          <polygon
            key={i}
            points={path}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines */}
        {labels.map((_, i) => {
          const p = getPoint(i, 100);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPath}
          fill="rgba(123,47,247,0.2)"
          stroke="url(#radarGradient)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={labels[i].color}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1.5"
          />
        ))}

        {/* Labels */}
        {labelPositions.map((p, i) => (
          <text
            key={`label-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={labels[i].color}
            fontSize="10"
            fontWeight="800"
            fontFamily="Inter, sans-serif"
          >
            {labels[i].label}
          </text>
        ))}

        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7b2ff7" />
            <stop offset="50%" stopColor="#00b4d8" />
            <stop offset="100%" stopColor="#ffd60a" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Stat Bar ────────────────────────────────────────────────

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-omega-muted w-8 text-right">{label}</span>
      <div className="flex-1 h-2 bg-omega-dark rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-black text-omega-text w-7 text-right">{value}</span>
    </div>
  );
}

// ─── Dropdown Component ──────────────────────────────────────

function getDisplayName(item: unknown): string {
  const obj = item as Record<string, unknown>;
  if (typeof obj.name === "string") return obj.name;
  if (typeof obj.label === "string") return obj.label;
  return "";
}

function PieceDropdown<T>({
  items,
  value,
  onChange,
  placeholder,
  renderItem,
}: {
  items: T[];
  value: T | null;
  onChange: (item: T) => void;
  placeholder: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    return getDisplayName(item).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="omega-input flex items-center justify-between gap-2 cursor-pointer hover:border-omega-purple/40 transition-colors"
      >
        <span className={value ? "text-omega-text" : "text-omega-muted/50"}>
          {value ? getDisplayName(value) : placeholder}
        </span>
        <ChevronDown className={`size-4 text-omega-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-omega-surface border border-omega-border/40 rounded-xl shadow-xl max-h-60 overflow-hidden">
          <div className="p-2 border-b border-omega-border/20">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-omega-dark rounded-lg px-3 py-1.5 text-sm text-omega-text outline-none border border-omega-border/20 focus:border-omega-purple/40"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full px-3 py-2 text-left hover:bg-omega-card-hover transition-colors flex items-center gap-2"
              >
                {renderItem(item)}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-omega-muted">
                Sin resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function SimulatorPage() {
  const [selectedBlade, setSelectedBlade] = useState<BladeStats | null>(null);
  const [selectedRatchet, setSelectedRatchet] = useState<RatchetStats | null>(null);
  const [selectedBit, setSelectedBit] = useState<BitStats | null>(null);

  const comboStats = useMemo<ComboStats | null>(() => {
    if (!selectedBlade || !selectedRatchet || !selectedBit) return null;
    return calculateComboStats(selectedBlade, selectedRatchet, selectedBit);
  }, [selectedBlade, selectedRatchet, selectedBit]);

  const comboName = selectedBlade && selectedRatchet && selectedBit
    ? `${selectedBlade.name} ${selectedRatchet.label} ${selectedBit.name}`
    : null;

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* ═══ Header ═══ */}
      <div className="px-4 pt-6 space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-omega-purple/30 to-omega-blue/20 flex items-center justify-center border border-omega-purple/30">
            <Cpu className="size-6 text-omega-purple" />
          </div>
          <div>
            <h1 className="text-xl font-black text-omega-text">Combo Simulator</h1>
            <p className="text-xs text-omega-muted">Arma, analiza y optimiza tu combo</p>
          </div>
        </div>
      </div>

      {/* ═══ HUD Frame ═══ */}
      <div className="px-4">
        <div className="relative overflow-hidden rounded-2xl border border-omega-purple/20 bg-gradient-to-b from-omega-surface/80 to-omega-card/80 backdrop-blur-sm">
          {/* HUD scan line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-omega-purple/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-omega-blue/30 to-transparent" />

          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-omega-purple/40 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-omega-purple/40 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-omega-blue/30 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-omega-blue/30 rounded-br-lg" />

          <div className="p-4 space-y-4">
            {/* Section title */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-omega-purple/30 to-transparent" />
              <span className="text-[10px] font-bold text-omega-purple uppercase tracking-[0.2em]">Seleccion de piezas</span>
              <div className="h-px flex-1 bg-gradient-to-l from-omega-purple/30 to-transparent" />
            </div>

            {/* ─── Blade Selector ─── */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-omega-muted uppercase tracking-wider">
                <Swords className="size-3.5 text-omega-red" />
                Blade
              </label>
              <PieceDropdown
                items={BLADE_DATA}
                value={selectedBlade}
                onChange={setSelectedBlade}
                placeholder="Selecciona un Blade..."
                renderItem={(blade) => {
                  const cfg = typeConfig[blade.type];
                  return (
                    <>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-omega-text flex-1">{blade.name}</span>
                      <span className={`text-xs font-black ${tierColors[blade.tier]}`}>{blade.tier}</span>
                    </>
                  );
                }}
              />
              {selectedBlade && (
                <div className="flex items-center gap-2 text-[10px] text-omega-muted">
                  <span className={`${typeConfig[selectedBlade.type].color} font-bold`}>
                    {typeConfig[selectedBlade.type].label}
                  </span>
                  <span>|</span>
                  <span>{selectedBlade.weight > 0 ? `${selectedBlade.weight}g` : "Peso N/D"}</span>
                  <span>|</span>
                  <span className={tierColors[selectedBlade.tier]}>Tier {selectedBlade.tier}</span>
                </div>
              )}
            </div>

            {/* ─── Ratchet Selector ─── */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-omega-muted uppercase tracking-wider">
                <Weight className="size-3.5 text-omega-gold" />
                Ratchet
              </label>
              <PieceDropdown
                items={RATCHET_DATA}
                value={selectedRatchet}
                onChange={setSelectedRatchet}
                placeholder="Selecciona un Ratchet..."
                renderItem={(ratchet) => (
                  <>
                    <span className="text-sm font-bold text-omega-text flex-1">{ratchet.label}</span>
                    <span className="text-[10px] text-omega-muted">{ratchet.weight}g</span>
                    <span className={`text-xs font-black ${tierColors[ratchet.tier]}`}>{ratchet.tier}</span>
                  </>
                )}
              />
              {selectedRatchet && (
                <div className="flex items-center gap-2 text-[10px] text-omega-muted">
                  <span>{selectedRatchet.weight}g</span>
                  <span>|</span>
                  <span>Altura: {selectedRatchet.height}mm</span>
                  <span>|</span>
                  <span className={tierColors[selectedRatchet.tier]}>Tier {selectedRatchet.tier}</span>
                </div>
              )}
            </div>

            {/* ─── Bit Selector ─── */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-omega-muted uppercase tracking-wider">
                <Target className="size-3.5 text-omega-green" />
                Bit
              </label>
              <PieceDropdown
                items={BIT_DATA}
                value={selectedBit}
                onChange={setSelectedBit}
                placeholder="Selecciona un Bit..."
                renderItem={(bit) => {
                  const cfg = typeConfig[bit.category];
                  return (
                    <>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-omega-text flex-1">{bit.name}</span>
                      <span className="text-[10px] text-omega-muted">{bit.weight}g</span>
                      <span className={`text-xs font-black ${tierColors[bit.tier]}`}>{bit.tier}</span>
                    </>
                  );
                }}
              />
              {selectedBit && (
                <div className="flex items-center gap-2 text-[10px] text-omega-muted">
                  <span className={`${typeConfig[selectedBit.category].color} font-bold`}>
                    {typeConfig[selectedBit.category].label}
                  </span>
                  <span>|</span>
                  <span>{selectedBit.weight}g</span>
                  <span>|</span>
                  <span className={tierColors[selectedBit.tier]}>Tier {selectedBit.tier}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Results Panel ═══ */}
      {comboStats && comboName && (
        <>
          {/* Combo Name Banner */}
          <div className="px-4">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-omega-purple/20 via-omega-card to-omega-blue/20 border border-omega-purple/20 p-4">
              {/* Animated scan line */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-omega-gold/50 to-transparent animate-pulse" />

              <div className="text-center space-y-2">
                <p className="text-[10px] font-bold text-omega-muted uppercase tracking-[0.3em]">Combo analizado</p>
                <h2 className="text-lg font-black text-omega-text tracking-wide">{comboName}</h2>
                <div className="flex items-center justify-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-black ${tierBg[comboStats.tier]} ${tierColors[comboStats.tier]}`}>
                    <Sparkles className="size-3.5" />
                    Tier {comboStats.tier}
                  </span>
                  <span className="text-sm text-omega-muted font-bold">
                    {comboStats.totalWeight.toFixed(1)}g total
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="px-4">
            <div className="omega-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-omega-purple/30 to-transparent" />
                <span className="text-[10px] font-bold text-omega-purple uppercase tracking-[0.15em]">Radar de stats</span>
                <div className="h-px flex-1 bg-gradient-to-l from-omega-purple/30 to-transparent" />
              </div>
              <RadarChart stats={comboStats} />
            </div>
          </div>

          {/* Stat Bars */}
          <div className="px-4">
            <div className="omega-card p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1 bg-gradient-to-r from-omega-blue/30 to-transparent" />
                <span className="text-[10px] font-bold text-omega-blue uppercase tracking-[0.15em]">Detalle de stats</span>
                <div className="h-px flex-1 bg-gradient-to-l from-omega-blue/30 to-transparent" />
              </div>
              <StatBar label="ATK" value={comboStats.atk} color="bg-gradient-to-r from-omega-red to-omega-red/60" />
              <StatBar label="DEF" value={comboStats.def} color="bg-gradient-to-r from-omega-blue to-omega-blue/60" />
              <StatBar label="STA" value={comboStats.sta} color="bg-gradient-to-r from-omega-green to-omega-green/60" />
              <StatBar label="WGT" value={comboStats.wgt} color="bg-gradient-to-r from-omega-gold to-omega-gold/60" />
              <StatBar label="BST" value={comboStats.bst} color="bg-gradient-to-r from-omega-purple to-omega-purple/60" />
            </div>
          </div>

          {/* Win Rate & Suggestion */}
          <div className="px-4 space-y-3">
            {/* Win rate */}
            <div className="omega-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="size-5 text-omega-gold" />
                  <div>
                    <p className="text-xs font-bold text-omega-muted uppercase tracking-wider">Win rate en la comunidad</p>
                    <p className="text-2xl font-black text-omega-gold">{comboStats.winRate}%</p>
                  </div>
                </div>
                <div className="size-14 rounded-full border-[3px] border-omega-gold/30 flex items-center justify-center">
                  <Star className="size-6 text-omega-gold fill-omega-gold star-glow" />
                </div>
              </div>
            </div>

            {/* Suggestion */}
            <div className="omega-card p-4 border-l-2 border-l-omega-blue">
              <div className="flex gap-3">
                <Info className="size-5 text-omega-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-omega-blue uppercase tracking-wider mb-1">Sugerencia</p>
                  <p className="text-sm text-omega-text leading-relaxed">{comboStats.suggestion}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save combo link */}
          <div className="px-4">
            <Link
              href="/combos"
              className="omega-btn omega-btn-primary w-full py-3.5 text-sm rounded-xl flex items-center justify-center gap-2"
            >
              <Save className="size-4" />
              Compartir combo en la comunidad
            </Link>
          </div>
        </>
      )}

      {/* ═══ Empty State ═══ */}
      {!comboStats && (
        <div className="px-4">
          <div className="omega-card p-8 text-center space-y-3">
            <div className="size-16 rounded-full bg-omega-purple/15 flex items-center justify-center mx-auto">
              <Zap className="size-8 text-omega-purple/50" />
            </div>
            <p className="text-sm font-bold text-omega-muted">
              Selecciona las 3 piezas para analizar tu combo
            </p>
            <p className="text-xs text-omega-muted/60">
              Blade + Ratchet + Bit = combo completo
            </p>
          </div>
        </div>
      )}

      {/* ═══ Quick Info ═══ */}
      <div className="px-4">
        <div className="omega-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-omega-muted" />
            <p className="text-xs font-bold text-omega-muted uppercase tracking-wider">Guia rapida de stats</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-omega-red" />
              <span className="text-omega-muted"><span className="font-bold text-omega-red">ATK</span> - Poder de ataque</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-omega-blue" />
              <span className="text-omega-muted"><span className="font-bold text-omega-blue">DEF</span> - Defensa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-omega-green" />
              <span className="text-omega-muted"><span className="font-bold text-omega-green">STA</span> - Stamina</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-omega-gold" />
              <span className="text-omega-muted"><span className="font-bold text-omega-gold">WGT</span> - Peso</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <div className="size-2 rounded-full bg-omega-purple" />
              <span className="text-omega-muted"><span className="font-bold text-omega-purple">BST</span> - Resistencia a burst</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
