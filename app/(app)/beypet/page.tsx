"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getBeastImage } from "@/lib/beast-images";

// Busca la imagen de la bestia basándose en el beast_type del beypet
function getBeastImageUrl(beastType: string): string {
  // Intentar match directo
  const direct = getBeastImage(beastType);
  if (direct) return direct;
  // Intentar con la primera palabra (nombre del blade)
  const firstName = beastType.split(/[\s-]/)[0];
  const partial = getBeastImage(firstName);
  if (partial) return partial;
  // Intentar variantes comunes
  const cleaned = beastType.replace(/\s+/g, "").replace(/[-_]/g, "").split(/\d/)[0];
  const cleanMatch = getBeastImage(cleaned);
  if (cleanMatch) return cleanMatch;
  return "/beasts/dran-lockchip.png"; // fallback
}
import {
  ArrowLeft,
  Loader2,
  Heart,
  Swords,
  Shield,
  Timer,
  Zap,
  Star,
  Sparkles,
  Trophy,
  X,
  ChevronRight,
  Coins,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ============================================
// Tipos
// ============================================

interface BeyPet {
  id: string;
  player_id: string;
  name: string;
  beast_type: string;
  level: number;
  xp: number;
  energy: number;
  atk: number;
  def: number;
  sta: number;
  last_fed: string | null;
  last_battle: string | null;
  created_at: string;
}

interface Bey {
  id: string;
  name: string;
  type: "attack" | "defense" | "stamina" | "balance";
}

interface Opponent {
  id: string;
  alias: string;
  avatar_url: string | null;
  beypet: {
    name: string;
    beast_type: string;
    level: number;
    energy: number;
  } | null;
}

interface BattleResult {
  result: "win" | "lose";
  winner_id: string;
  attacker_roll: number;
  defender_roll: number;
  omega_coins_transferred: number;
  my_pet: BeyPet;
  op_pet: BeyPet;
  my_leveled_up: boolean;
  op_leveled_up: boolean;
}

// ============================================
// Constantes
// ============================================

const LEVEL_NAMES: Record<number, string> = {
  1: "Rookie",
  2: "Champion",
  3: "Ultimate",
};

const LEVEL_COLORS: Record<number, { text: string; bg: string; glow: string; border: string }> = {
  1: {
    text: "text-omega-blue",
    bg: "bg-omega-blue/20",
    glow: "shadow-omega-blue/30",
    border: "border-omega-blue/40",
  },
  2: {
    text: "text-omega-purple",
    bg: "bg-omega-purple/20",
    glow: "shadow-omega-purple/40",
    border: "border-omega-purple/40",
  },
  3: {
    text: "text-omega-gold",
    bg: "bg-omega-gold/20",
    glow: "shadow-omega-gold/50",
    border: "border-omega-gold/40",
  },
};

const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
};

function getXpProgress(xp: number, level: number): number {
  if (level >= 3) return 100;
  const current = XP_THRESHOLDS[level];
  const next = XP_THRESHOLDS[level + 1];
  return Math.round(((xp - current) / (next - current)) * 100);
}

function canFeedToday(lastFed: string | null): boolean {
  if (!lastFed) return true;
  const fed = new Date(lastFed);
  const now = new Date();
  return (
    fed.getUTCFullYear() !== now.getUTCFullYear() ||
    fed.getUTCMonth() !== now.getUTCMonth() ||
    fed.getUTCDate() !== now.getUTCDate()
  );
}

// ============================================
// Componente principal
// ============================================

export default function BeyPetPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [beypet, setBeypet] = useState<BeyPet | null>(null);
  const [omegaCoins, setOmegaCoins] = useState(100);
  const [userId, setUserId] = useState<string | null>(null);

  // Creacion
  const [beys, setBeys] = useState<Bey[]>([]);
  const [selectedBey, setSelectedBey] = useState<Bey | null>(null);
  const [petName, setPetName] = useState("");
  const [creating, setCreating] = useState(false);

  // Alimentar
  const [feeding, setFeeding] = useState(false);
  const [feedPulse, setFeedPulse] = useState(false);

  // Batalla
  const [showOpponentSelector, setShowOpponentSelector] = useState(false);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loadingOpponents, setLoadingOpponents] = useState(false);
  const [opponentSearch, setOpponentSearch] = useState("");
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [coinsBet, setCoinsBet] = useState(10);
  const [battling, setBattling] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showBattleAnimation, setShowBattleAnimation] = useState(false);

  // ============================================
  // Carga inicial
  // ============================================

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const res = await fetch("/api/beypets");
    if (res.ok) {
      const data = await res.json();
      setBeypet(data.beypet);
      setOmegaCoins(data.omega_coins);
    }

    // Cargar beys del jugador (para creacion)
    const { data: playerBeys } = await supabase
      .from("beys")
      .select("id, name, type")
      .eq("player_id", user.id)
      .order("created_at", { ascending: true });

    if (playerBeys) {
      setBeys(playerBeys as Bey[]);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // Crear BeyPet
  // ============================================

  async function handleCreate() {
    if (!selectedBey || !petName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/beypets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: petName.trim(),
          beast_type: selectedBey.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error creando BeyPet");
        return;
      }

      setBeypet(data);
      toast.success(`${data.name} nacio!`);
    } catch {
      toast.error("Error de conexion");
    } finally {
      setCreating(false);
    }
  }

  // ============================================
  // Alimentar
  // ============================================

  async function handleFeed() {
    if (!beypet || !canFeedToday(beypet.last_fed)) return;
    setFeeding(true);

    try {
      const res = await fetch("/api/beypets/feed", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error alimentando");
        return;
      }

      setBeypet(data.beypet);
      setFeedPulse(true);
      toast.success(data.message);
      setTimeout(() => setFeedPulse(false), 1500);
    } catch {
      toast.error("Error de conexion");
    } finally {
      setFeeding(false);
    }
  }

  // ============================================
  // Buscar oponentes
  // ============================================

  async function loadOpponents() {
    setLoadingOpponents(true);
    setShowOpponentSelector(true);

    try {
      // Traer todos los beypets con info del jugador
      const { data } = await supabase
        .from("beypets")
        .select("player_id, name, beast_type, level, energy, player:players!player_id(id, alias, avatar_url)")
        .neq("player_id", userId ?? "");

      if (data) {
        const mapped: Opponent[] = data
          .filter((d) => d.player)
          .map((d) => {
            const p = d.player as unknown as { id: string; alias: string; avatar_url: string | null };
            return {
              id: p.id,
              alias: p.alias,
              avatar_url: p.avatar_url,
              beypet: {
                name: d.name,
                beast_type: d.beast_type,
                level: d.level,
                energy: d.energy,
              },
            };
          });
        setOpponents(mapped);
      }
    } catch {
      toast.error("Error cargando oponentes");
    } finally {
      setLoadingOpponents(false);
    }
  }

  // ============================================
  // Batalla
  // ============================================

  async function handleBattle() {
    if (!selectedOpponent || battling) return;
    setBattling(true);
    setShowBattleAnimation(true);
    setBattleResult(null);

    try {
      const res = await fetch("/api/beypets/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponent_id: selectedOpponent.id,
          omega_coins_bet: coinsBet,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error en la batalla");
        setShowBattleAnimation(false);
        return;
      }

      // Esperar un poco para el efecto de batalla
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setBattleResult(data);
      setBeypet(data.my_pet);

      if (data.result === "win") {
        setOmegaCoins((prev) => prev + data.omega_coins_transferred);
        toast.success(
          `Victoria! +${data.omega_coins_transferred} OC${data.my_leveled_up ? " -- LEVEL UP!" : ""}`
        );
      } else {
        setOmegaCoins((prev) => prev - data.omega_coins_transferred);
        toast.error(`Derrota... -${data.omega_coins_transferred} OC`);
      }
    } catch {
      toast.error("Error de conexion");
      setShowBattleAnimation(false);
    } finally {
      setBattling(false);
    }
  }

  function closeBattleResult() {
    setBattleResult(null);
    setShowBattleAnimation(false);
    setSelectedOpponent(null);
    setShowOpponentSelector(false);
  }

  // ============================================
  // Filtro de oponentes
  // ============================================

  const filteredOpponents = opponents.filter((o) =>
    o.alias.toLowerCase().includes(opponentSearch.toLowerCase())
  );

  // ============================================
  // Renders
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 text-omega-purple animate-spin" />
      </div>
    );
  }

  // ---- FLUJO DE CREACION ----
  if (!beypet) {
    return (
      <div className="max-w-lg mx-auto pb-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-6">
          <Link href="/dashboard" className="size-10 rounded-xl bg-omega-card flex items-center justify-center hover:bg-omega-card-hover transition-colors">
            <ArrowLeft className="size-5 text-omega-muted" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-omega-text">Crear BeyPet</h1>
            <p className="text-xs text-omega-muted">Elegí tu bestia y dale un nombre</p>
          </div>
        </div>

        {/* Intro visual */}
        <div className="px-4">
          <div className="omega-card p-6 text-center space-y-4">
            <div className="relative mx-auto size-24 rounded-full bg-gradient-to-br from-omega-purple/30 to-omega-blue/20 flex items-center justify-center">
              <Sparkles className="size-12 text-omega-purple animate-pulse" />
              <div className="absolute inset-0 rounded-full animate-ping bg-omega-purple/10" />
            </div>
            <h2 className="text-lg font-black neon-purple">Tu BeyPet te espera</h2>
            <p className="text-sm text-omega-muted leading-relaxed">
              Elegí uno de tus beyblades como bestia base. Tu BeyPet heredara las stats
              segun el tipo de bey. Alimentalo, entrenalo y desafia a otros!
            </p>
          </div>
        </div>

        {beys.length === 0 ? (
          <div className="px-4">
            <div className="omega-card p-6 text-center space-y-3">
              <p className="text-sm text-omega-muted">
                Necesitas registrar al menos un bey en tu perfil para crear un BeyPet.
              </p>
              <Link
                href="/profile"
                className="omega-btn omega-btn-primary px-6 py-2.5 text-sm"
              >
                Ir a Mi Perfil
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-4">
            {/* Seleccionar bey */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                Elegí tu bestia
              </label>
              <div className="grid grid-cols-1 gap-2">
                {beys.map((bey) => {
                  const isSelected = selectedBey?.id === bey.id;
                  const typeColors: Record<string, string> = {
                    attack: "border-omega-red/50 bg-omega-red/10",
                    defense: "border-omega-blue/50 bg-omega-blue/10",
                    stamina: "border-omega-green/50 bg-omega-green/10",
                    balance: "border-omega-purple/50 bg-omega-purple/10",
                  };
                  const typeIcons: Record<string, typeof Swords> = {
                    attack: Swords,
                    defense: Shield,
                    stamina: Timer,
                    balance: Star,
                  };
                  const TypeIcon = typeIcons[bey.type] ?? Star;

                  return (
                    <button
                      key={bey.id}
                      onClick={() => setSelectedBey(bey)}
                      className={`omega-card p-4 flex items-center gap-3 transition-all ${
                        isSelected
                          ? `${typeColors[bey.type]} ring-2 ring-omega-purple scale-[1.02]`
                          : "hover:bg-omega-card-hover"
                      }`}
                    >
                      <div className={`size-10 rounded-xl flex items-center justify-center ${typeColors[bey.type]}`}>
                        <TypeIcon className="size-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-omega-text">{bey.name}</p>
                        <p className="text-xs text-omega-muted capitalize">{bey.type}</p>
                      </div>
                      {isSelected && (
                        <div className="size-6 rounded-full bg-omega-purple flex items-center justify-center">
                          <Zap className="size-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nombre del pet */}
            {selectedBey && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                  Nombre de tu BeyPet
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Ej: Dragón Omega"
                  maxLength={20}
                  className="omega-input"
                />
                <p className="text-[10px] text-omega-muted">{petName.length}/20 caracteres</p>
              </div>
            )}

            {/* Stats preview */}
            {selectedBey && (
              <div className="omega-card p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                  Stats iniciales ({selectedBey.type})
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <StatPreview
                    label="ATK"
                    value={selectedBey.type === "attack" ? 15 : selectedBey.type === "balance" ? 10 : selectedBey.type === "defense" ? 7 : 7}
                    color="text-omega-red"
                    bg="bg-omega-red"
                  />
                  <StatPreview
                    label="DEF"
                    value={selectedBey.type === "defense" ? 15 : selectedBey.type === "balance" ? 10 : selectedBey.type === "attack" ? 8 : 8}
                    color="text-omega-blue"
                    bg="bg-omega-blue"
                  />
                  <StatPreview
                    label="STA"
                    value={selectedBey.type === "stamina" ? 15 : selectedBey.type === "balance" ? 10 : selectedBey.type === "attack" ? 7 : selectedBey.type === "defense" ? 8 : 10}
                    color="text-omega-green"
                    bg="bg-omega-green"
                  />
                </div>
              </div>
            )}

            {/* Boton crear */}
            <button
              onClick={handleCreate}
              disabled={!selectedBey || petName.trim().length < 2 || creating}
              className="omega-btn omega-btn-primary w-full py-3.5 text-sm"
            >
              {creating ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="size-5" />
                  Crear BeyPet
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- VISTA PRINCIPAL DEL BEYPET ----
  const levelConfig = LEVEL_COLORS[beypet.level] ?? LEVEL_COLORS[1];
  const canFeed = canFeedToday(beypet.last_fed);
  const xpProgress = getXpProgress(beypet.xp, beypet.level);

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="size-10 rounded-xl bg-omega-card flex items-center justify-center hover:bg-omega-card-hover transition-colors">
            <ArrowLeft className="size-5 text-omega-muted" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-omega-text">Mi BeyPet</h1>
            <p className="text-xs text-omega-muted">{beypet.beast_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-omega-gold/15 border border-omega-gold/30">
          <Coins className="size-4 text-omega-gold" />
          <span className="text-sm font-black text-omega-gold">{omegaCoins}</span>
          <span className="text-[10px] text-omega-gold/70">OC</span>
        </div>
      </div>

      {/* ============================================ */}
      {/* PET DISPLAY -- el corazon visual */}
      {/* ============================================ */}
      <div className="px-4">
        <div className={`omega-card relative overflow-visible p-6 ${feedPulse ? "beypet-feed-pulse" : ""}`}>
          {/* Background glow segun nivel */}
          <div className={`absolute inset-0 rounded-xl ${
            beypet.level === 3
              ? "bg-gradient-to-br from-omega-gold/10 via-transparent to-omega-purple/10"
              : beypet.level === 2
              ? "bg-gradient-to-br from-omega-purple/10 via-transparent to-omega-blue/5"
              : ""
          }`} />

          {/* Particles para Ultimate */}
          {beypet.level === 3 && (
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              <div className="beypet-particle beypet-particle-1" />
              <div className="beypet-particle beypet-particle-2" />
              <div className="beypet-particle beypet-particle-3" />
              <div className="beypet-particle beypet-particle-4" />
              <div className="beypet-particle beypet-particle-5" />
              <div className="beypet-particle beypet-particle-6" />
            </div>
          )}

          {/* Pet visual */}
          <div className="relative flex flex-col items-center gap-4">
            {/* Avatar del pet */}
            <div
              className={`relative beypet-float ${
                beypet.level === 1
                  ? "size-24"
                  : beypet.level === 2
                  ? "size-32"
                  : "size-40"
              }`}
            >
              {/* Glow ring */}
              <div
                className={`absolute inset-0 rounded-full ${
                  beypet.level >= 2 ? "beypet-glow" : ""
                } ${
                  beypet.level === 3
                    ? "shadow-[0_0_40px_rgba(255,214,10,0.4),0_0_80px_rgba(255,214,10,0.15)]"
                    : beypet.level === 2
                    ? "shadow-[0_0_25px_rgba(123,47,247,0.35),0_0_50px_rgba(123,47,247,0.1)]"
                    : ""
                }`}
              />

              {/* Main circle */}
              <div
                className={`relative size-full rounded-full border-2 ${levelConfig.border} overflow-hidden ${
                  beypet.level === 3
                    ? "bg-gradient-to-br from-omega-gold/25 via-omega-card to-omega-purple/20"
                    : beypet.level === 2
                    ? "bg-gradient-to-br from-omega-purple/20 via-omega-card to-omega-blue/15"
                    : "bg-gradient-to-br from-omega-blue/15 via-omega-card to-omega-surface"
                } beypet-breathe`}
              >
                <img
                  src={getBeastImageUrl(beypet.beast_type)}
                  alt={beypet.beast_type}
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).parentElement!.innerHTML += `<span class="${
                      beypet.level === 1 ? "text-3xl" : beypet.level === 2 ? "text-4xl" : "text-5xl"
                    } select-none flex items-center justify-center size-full">\u{1F95A}</span>`;
                  }}
                />
              </div>

              {/* Level badge */}
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${levelConfig.bg} ${levelConfig.text} border ${levelConfig.border}`}>
                {LEVEL_NAMES[beypet.level]}
              </div>
            </div>

            {/* Name */}
            <div className="text-center mt-2">
              <h2 className={`text-2xl font-black ${levelConfig.text}`}>
                {beypet.name}
              </h2>
              <p className="text-xs text-omega-muted mt-0.5">Lv.{beypet.level} {LEVEL_NAMES[beypet.level]}</p>
            </div>
          </div>

          {/* Energy bar */}
          <div className="relative mt-5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-omega-muted flex items-center gap-1">
                <Zap className="size-3.5 text-omega-green" />
                Energia
              </span>
              <span className={`font-bold ${
                beypet.energy > 60 ? "text-omega-green" : beypet.energy > 30 ? "text-omega-gold" : "text-omega-red"
              }`}>
                {beypet.energy}/100
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-omega-dark overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  beypet.energy > 60
                    ? "bg-gradient-to-r from-omega-green to-omega-green/80"
                    : beypet.energy > 30
                    ? "bg-gradient-to-r from-omega-gold to-omega-gold/80"
                    : "bg-gradient-to-r from-omega-red to-omega-red/80"
                }`}
                style={{ width: `${beypet.energy}%` }}
              />
            </div>
          </div>

          {/* XP bar */}
          <div className="relative mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-omega-muted flex items-center gap-1">
                <Star className="size-3.5 text-omega-purple" />
                Experiencia
              </span>
              <span className="font-bold text-omega-purple">
                {beypet.xp} XP
                {beypet.level < 3 && (
                  <span className="text-omega-muted font-normal"> / {XP_THRESHOLDS[beypet.level + 1]}</span>
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-omega-dark overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-omega-purple to-omega-purple-glow transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            {beypet.level < 3 && (
              <p className="text-[10px] text-omega-muted text-right">
                {XP_THRESHOLDS[beypet.level + 1] - beypet.xp} XP para {LEVEL_NAMES[beypet.level + 1]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATS */}
      {/* ============================================ */}
      <div className="px-4">
        <div className="omega-card p-4">
          <div className="omega-section-header -mx-4 -mt-4 mb-4">
            <Swords className="size-4 text-omega-red" />
            Stats de Combate
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatDisplay
              label="ATK"
              value={beypet.atk}
              icon={<Swords className="size-4 text-omega-red" />}
              color="text-omega-red"
              bg="bg-omega-red"
            />
            <StatDisplay
              label="DEF"
              value={beypet.def}
              icon={<Shield className="size-4 text-omega-blue" />}
              color="text-omega-blue"
              bg="bg-omega-blue"
            />
            <StatDisplay
              label="STA"
              value={beypet.sta}
              icon={<Timer className="size-4 text-omega-green" />}
              color="text-omega-green"
              bg="bg-omega-green"
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ACCIONES */}
      {/* ============================================ */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {/* Alimentar */}
        <button
          onClick={handleFeed}
          disabled={!canFeed || feeding}
          className={`omega-btn ${
            canFeed ? "omega-btn-green" : "omega-btn-secondary opacity-50"
          } py-3.5 text-sm flex-col gap-1`}
        >
          {feeding ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Heart className={`size-5 ${canFeed ? "" : "text-omega-muted"}`} />
          )}
          <span className="text-xs font-bold">
            {canFeed ? "Alimentar" : "Ya comio hoy"}
          </span>
        </button>

        {/* Buscar pelea */}
        <button
          onClick={loadOpponents}
          disabled={beypet.energy < 20}
          className={`omega-btn ${
            beypet.energy >= 20 ? "omega-btn-red" : "omega-btn-secondary opacity-50"
          } py-3.5 text-sm flex-col gap-1`}
        >
          <Swords className="size-5" />
          <span className="text-xs font-bold">
            {beypet.energy >= 20 ? "Buscar pelea" : "Sin energia"}
          </span>
        </button>
      </div>

      {/* ============================================ */}
      {/* INFO */}
      {/* ============================================ */}
      <div className="px-4">
        <div className="omega-card p-4 space-y-2">
          <h3 className="text-xs font-bold text-omega-muted uppercase tracking-wider">Sistema de evolucion</h3>
          <div className="space-y-1.5">
            <EvolutionStep level={1} label="Rookie" xp="0 XP" active={beypet.level === 1} unlocked={beypet.level >= 1} />
            <EvolutionStep level={2} label="Champion" xp="100 XP" active={beypet.level === 2} unlocked={beypet.level >= 2} />
            <EvolutionStep level={3} label="Ultimate" xp="300 XP" active={beypet.level === 3} unlocked={beypet.level >= 3} />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL: Selector de oponentes */}
      {/* ============================================ */}
      {showOpponentSelector && !showBattleAnimation && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-omega-dark rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col border border-omega-border/30">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-omega-border/20">
              <h3 className="text-lg font-black text-omega-text">Elegí rival</h3>
              <button
                onClick={() => {
                  setShowOpponentSelector(false);
                  setSelectedOpponent(null);
                }}
                className="size-8 rounded-lg bg-omega-card flex items-center justify-center hover:bg-omega-card-hover"
              >
                <X className="size-4 text-omega-muted" />
              </button>
            </div>

            {/* Busqueda */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-omega-muted" />
                <input
                  type="text"
                  value={opponentSearch}
                  onChange={(e) => setOpponentSearch(e.target.value)}
                  placeholder="Buscar blader..."
                  className="omega-input pl-10"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2">
              {loadingOpponents ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 text-omega-purple animate-spin" />
                </div>
              ) : filteredOpponents.length === 0 ? (
                <p className="text-center text-sm text-omega-muted py-8">
                  No hay bladers con BeyPet para pelear
                </p>
              ) : (
                filteredOpponents.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setSelectedOpponent(op)}
                    className={`w-full omega-card p-3 flex items-center gap-3 transition-all ${
                      selectedOpponent?.id === op.id
                        ? "ring-2 ring-omega-red bg-omega-red/10"
                        : "hover:bg-omega-card-hover"
                    }`}
                  >
                    <div className="size-10 rounded-full bg-omega-surface flex items-center justify-center overflow-hidden shrink-0">
                      {op.avatar_url ? (
                        <img src={op.avatar_url} alt={op.alias} className="size-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-omega-purple">
                          {op.alias.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">{op.alias}</p>
                      {op.beypet && (
                        <p className="text-xs text-omega-muted truncate">
                          {op.beypet.name} - Lv.{op.beypet.level} {LEVEL_NAMES[op.beypet.level]}
                        </p>
                      )}
                    </div>
                    {op.beypet && (
                      <div className="shrink-0 text-right">
                        <p className={`text-xs font-bold ${LEVEL_COLORS[op.beypet.level]?.text ?? "text-omega-blue"}`}>
                          Lv.{op.beypet.level}
                        </p>
                        <p className="text-[10px] text-omega-muted">
                          {op.beypet.energy >= 20 ? (
                            <span className="text-omega-green">{op.beypet.energy}E</span>
                          ) : (
                            <span className="text-omega-red">Sin energia</span>
                          )}
                        </p>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Apuesta y boton */}
            {selectedOpponent && (
              <div className="p-4 border-t border-omega-border/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                    Apuesta
                  </span>
                  <div className="flex items-center gap-2">
                    {[0, 5, 10, 20, 50].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCoinsBet(amount)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          coinsBet === amount
                            ? "bg-omega-gold/20 text-omega-gold border border-omega-gold/40"
                            : "bg-omega-card text-omega-muted hover:text-omega-text"
                        }`}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleBattle}
                  disabled={battling || (selectedOpponent.beypet?.energy ?? 0) < 20}
                  className="omega-btn omega-btn-red w-full py-3 text-sm"
                >
                  {battling ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      <Swords className="size-5" />
                      Pelear contra {selectedOpponent.alias}
                      {coinsBet > 0 && <span className="text-omega-gold ml-1">({coinsBet} OC)</span>}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Animacion de batalla + resultado */}
      {/* ============================================ */}
      {showBattleAnimation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
          {!battleResult ? (
            // Animacion de pelea
            <div className="text-center space-y-6 animate-in fade-in">
              <div className="flex items-center justify-center gap-8">
                <div className="beypet-battle-left">
                  <div className="size-20 rounded-full bg-gradient-to-br from-omega-blue/30 to-omega-card border-2 border-omega-blue/40 flex items-center justify-center">
                    <span className="text-3xl">{beypet.level === 3 ? "\u{1F432}" : beypet.level === 2 ? "\u{1F525}" : "\u{1F95A}"}</span>
                  </div>
                  <p className="text-xs font-bold text-omega-text mt-2">{beypet.name}</p>
                </div>

                <div className="beypet-vs">
                  <Swords className="size-10 text-omega-red animate-pulse" />
                </div>

                <div className="beypet-battle-right">
                  <div className="size-20 rounded-full bg-gradient-to-br from-omega-red/30 to-omega-card border-2 border-omega-red/40 flex items-center justify-center">
                    <span className="text-3xl">
                      {(selectedOpponent?.beypet?.level ?? 1) === 3
                        ? "\u{1F432}"
                        : (selectedOpponent?.beypet?.level ?? 1) === 2
                        ? "\u{1F525}"
                        : "\u{1F95A}"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-omega-text mt-2">
                    {selectedOpponent?.beypet?.name ?? "???"}
                  </p>
                </div>
              </div>

              <p className="text-lg font-black text-omega-gold animate-pulse neon-gold">
                Peleando...
              </p>
            </div>
          ) : (
            // Resultado
            <div
              className={`text-center space-y-6 p-8 max-w-sm mx-4 rounded-2xl ${
                battleResult.result === "win"
                  ? "beypet-win bg-gradient-to-br from-omega-gold/20 via-omega-card to-omega-green/10 border border-omega-gold/30"
                  : "beypet-lose bg-gradient-to-br from-omega-red/20 via-omega-card to-omega-dark border border-omega-red/30"
              }`}
            >
              {battleResult.result === "win" ? (
                <>
                  <div className="relative">
                    <Trophy className="size-16 text-omega-gold mx-auto star-glow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="beypet-confetti-container">
                        <div className="beypet-confetti beypet-confetti-1" />
                        <div className="beypet-confetti beypet-confetti-2" />
                        <div className="beypet-confetti beypet-confetti-3" />
                        <div className="beypet-confetti beypet-confetti-4" />
                        <div className="beypet-confetti beypet-confetti-5" />
                        <div className="beypet-confetti beypet-confetti-6" />
                        <div className="beypet-confetti beypet-confetti-7" />
                        <div className="beypet-confetti beypet-confetti-8" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-3xl font-black neon-gold">VICTORIA!</h2>
                </>
              ) : (
                <>
                  <div className="size-16 mx-auto flex items-center justify-center">
                    <X className="size-16 text-omega-red" />
                  </div>
                  <h2 className="text-3xl font-black text-omega-red">DERROTA</h2>
                </>
              )}

              {/* Rolls */}
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="text-center">
                  <p className="text-omega-muted text-xs">Tu roll</p>
                  <p className="text-xl font-black text-omega-blue">{battleResult.attacker_roll}</p>
                </div>
                <span className="text-omega-muted">vs</span>
                <div className="text-center">
                  <p className="text-omega-muted text-xs">Rival</p>
                  <p className="text-xl font-black text-omega-red">{battleResult.defender_roll}</p>
                </div>
              </div>

              {/* OC ganados/perdidos */}
              {battleResult.omega_coins_transferred > 0 && (
                <p className={`text-sm font-bold ${
                  battleResult.result === "win" ? "text-omega-gold" : "text-omega-red"
                }`}>
                  {battleResult.result === "win" ? "+" : "-"}{battleResult.omega_coins_transferred} Omega Coins
                </p>
              )}

              {/* Level up */}
              {battleResult.my_leveled_up && (
                <div className="px-4 py-2 rounded-xl bg-omega-purple/20 border border-omega-purple/40">
                  <p className="text-sm font-black text-omega-purple animate-pulse">
                    LEVEL UP! Tu BeyPet evoluciono a {LEVEL_NAMES[battleResult.my_pet.level]}!
                  </p>
                </div>
              )}

              <button
                onClick={closeBattleResult}
                className="omega-btn omega-btn-primary px-8 py-2.5 text-sm"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-componentes
// ============================================

function StatDisplay({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="text-center space-y-1.5">
      <div className={`mx-auto size-10 rounded-xl ${bg}/15 flex items-center justify-center`}>
        {icon}
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-omega-muted uppercase tracking-wider">{label}</p>
    </div>
  );
}

function StatPreview({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-omega-muted uppercase">{label}</p>
      <div className="mt-1 h-1.5 rounded-full bg-omega-dark overflow-hidden">
        <div
          className={`h-full rounded-full ${bg}`}
          style={{ width: `${(value / 15) * 100}%` }}
        />
      </div>
      <p className={`text-sm font-black ${color} mt-1`}>{value}</p>
    </div>
  );
}

function EvolutionStep({
  level,
  label,
  xp,
  active,
  unlocked,
}: {
  level: number;
  label: string;
  xp: string;
  active: boolean;
  unlocked: boolean;
}) {
  const config = LEVEL_COLORS[level];
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
      active ? `${config.bg} border ${config.border}` : unlocked ? "opacity-60" : "opacity-30"
    }`}>
      <div className={`size-8 rounded-full flex items-center justify-center text-sm ${
        active ? `${config.bg} ${config.text}` : "bg-omega-dark text-omega-muted"
      }`}>
        {level === 1 ? "\u{1F95A}" : level === 2 ? "\u{1F525}" : "\u{1F432}"}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-bold ${active ? config.text : "text-omega-muted"}`}>
          {label}
        </p>
        <p className="text-[10px] text-omega-muted">{xp}</p>
      </div>
      {active && (
        <span className={`text-[10px] font-bold ${config.text} uppercase`}>Actual</span>
      )}
      {unlocked && !active && (
        <span className="text-[10px] font-bold text-omega-green uppercase">Desbloqueado</span>
      )}
    </div>
  );
}
