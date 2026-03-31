"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Star,
  Trophy,
  Swords,
  Flame,
  Crown,
  Shield,
  Zap,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLevel } from "@/lib/xp";

// ─── Types ───────────────────────────────────────────────────

interface BladerCard {
  id: string;
  alias: string;
  avatar_url: string | null;
  stars: number;
  wins: number;
  losses: number;
  accent_color: string;
  badge: string | null;
  xp: number;
  tagline: string | null;
  // Computed
  rank: number;
  winRate: number;
}

interface CardBackData {
  bestCombo: string | null;
  longestStreak: number;
  tournamentWins: number;
}

// ─── Constants ───────────────────────────────────────────────

const BADGE_EMOJIS: Record<string, string> = {
  fire: "\u{1F525}",
  lightning: "\u26A1",
  skull: "\u{1F480}",
  crown: "\u{1F451}",
  sword: "\u2694\uFE0F",
  star: "\u2B50",
  dragon: "\u{1F409}",
  wolf: "\u{1F43A}",
  ice: "\u2744\uFE0F",
  boom: "\u{1F4A5}",
};

function getBorderStyle(rank: number): { border: string; glow: string; label: string } {
  if (rank === 1) return { border: "border-omega-gold", glow: "shadow-[0_0_25px_rgba(255,214,10,0.3),0_0_50px_rgba(255,214,10,0.1)]", label: "Campeon" };
  if (rank === 2) return { border: "border-gray-300", glow: "shadow-[0_0_20px_rgba(192,192,192,0.25)]", label: "Subcampeon" };
  if (rank === 3) return { border: "border-amber-600", glow: "shadow-[0_0_20px_rgba(205,127,50,0.25)]", label: "Tercero" };
  if (rank <= 10) return { border: "border-omega-purple", glow: "shadow-[0_0_15px_rgba(123,47,247,0.2)]", label: `Top ${rank}` };
  return { border: "border-omega-blue/50", glow: "", label: `#${rank}` };
}

// ─── Blader Card Component ───────────────────────────────────

function BladerCardItem({
  card,
  isMe,
  backData,
  onRequestBack,
}: {
  card: BladerCard;
  isMe: boolean;
  backData: CardBackData | null;
  onRequestBack: (id: string) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const borderStyle = getBorderStyle(card.rank);
  const level = getLevel(card.xp ?? 0);

  function handleFlip() {
    if (!flipped && !backData) {
      onRequestBack(card.id);
    }
    setFlipped(!flipped);
  }

  return (
    <div
      className="relative cursor-pointer group"
      style={{ perspective: "1000px" }}
      onClick={handleFlip}
    >
      <div
        className="relative w-full transition-transform duration-600 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ═══ FRONT ═══ */}
        <div
          className={`relative w-full rounded-2xl border-2 ${borderStyle.border} ${borderStyle.glow} overflow-hidden ${isMe ? "ring-2 ring-omega-gold/40 ring-offset-2 ring-offset-omega-black" : ""}`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Holographic gradient overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, rgba(255,214,10,0.08) 0%, rgba(123,47,247,0.08) 25%, rgba(0,180,216,0.08) 50%, rgba(255,214,10,0.08) 75%, rgba(123,47,247,0.08) 100%)",
                backgroundSize: "200% 200%",
                animation: "holoShine 3s ease infinite",
              }}
            />
          </div>

          {/* Card background */}
          <div className="bg-gradient-to-b from-omega-surface to-omega-card p-3 space-y-2.5">
            {/* Top: rank badge + stars */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${card.rank <= 3 ? "text-omega-gold" : card.rank <= 10 ? "text-omega-purple" : "text-omega-muted"}`}>
                {borderStyle.label}
              </span>
              <div className="flex items-center gap-1">
                <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                <span className="text-sm font-black text-omega-gold">{card.stars}</span>
              </div>
            </div>

            {/* Avatar */}
            <div className="relative mx-auto w-20 h-20">
              <div className={`size-20 rounded-full border-2 ${borderStyle.border} overflow-hidden bg-omega-dark mx-auto`}>
                {card.avatar_url ? (
                  <img
                    src={card.avatar_url}
                    alt={card.alias}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-2xl font-black text-omega-purple">
                    {card.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Level badge */}
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black ${level.bg} ${level.color} border border-omega-border/30 whitespace-nowrap`}>
                {level.name}
              </div>
            </div>

            {/* Name */}
            <div className="text-center">
              <p className="text-sm font-black text-omega-text truncate">
                {card.badge && <span className="mr-0.5">{BADGE_EMOJIS[card.badge] ?? ""}</span>}
                {card.alias}
              </p>
              {card.tagline && (
                <p className="text-[10px] text-omega-muted/70 italic truncate">&ldquo;{card.tagline}&rdquo;</p>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-around rounded-lg bg-omega-dark/60 border border-white/[0.04] py-1.5 px-1">
              <div className="text-center">
                <p className="text-xs font-black text-omega-green">{card.wins}</p>
                <p className="text-[8px] text-omega-muted uppercase font-bold">Wins</p>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="text-center">
                <p className="text-xs font-black text-omega-red">{card.losses}</p>
                <p className="text-[8px] text-omega-muted uppercase font-bold">Loss</p>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="text-center">
                <p className={`text-xs font-black ${card.winRate >= 60 ? "text-omega-gold" : card.winRate >= 45 ? "text-omega-blue" : "text-omega-muted"}`}>
                  {card.winRate}%
                </p>
                <p className="text-[8px] text-omega-muted uppercase font-bold">Rate</p>
              </div>
            </div>

            {/* Tap hint */}
            <p className="text-[9px] text-omega-muted/40 text-center">Toca para voltear</p>
          </div>
        </div>

        {/* ═══ BACK ═══ */}
        <div
          className={`absolute inset-0 w-full rounded-2xl border-2 ${borderStyle.border} ${borderStyle.glow} overflow-hidden`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="bg-gradient-to-b from-omega-card to-omega-surface p-3 space-y-3 h-full">
            {/* Header */}
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold text-omega-purple uppercase tracking-[0.2em]">Estadisticas</p>
              <p className="text-sm font-black text-omega-text">{card.alias}</p>
            </div>

            <div className="energy-line" />

            {backData ? (
              <div className="space-y-3">
                {/* Best combo */}
                <div className="flex items-center gap-2">
                  <Swords className="size-4 text-omega-green shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-omega-muted uppercase font-bold">Mejor combo</p>
                    <p className="text-xs font-bold text-omega-text truncate">
                      {backData.bestCombo ?? "Sin combo registrado"}
                    </p>
                  </div>
                </div>

                {/* Longest streak */}
                <div className="flex items-center gap-2">
                  <Flame className="size-4 text-orange-400 shrink-0" />
                  <div>
                    <p className="text-[9px] text-omega-muted uppercase font-bold">Mejor racha</p>
                    <p className="text-xs font-bold text-omega-text">
                      {backData.longestStreak} {backData.longestStreak === 1 ? "victoria" : "victorias"} seguidas
                    </p>
                  </div>
                </div>

                {/* Tournament wins */}
                <div className="flex items-center gap-2">
                  <Crown className="size-4 text-omega-gold shrink-0" />
                  <div>
                    <p className="text-[9px] text-omega-muted uppercase font-bold">Torneos ganados</p>
                    <p className="text-xs font-bold text-omega-text">
                      {backData.tournamentWins} {backData.tournamentWins === 1 ? "torneo" : "torneos"}
                    </p>
                  </div>
                </div>

                {/* XP */}
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-omega-purple shrink-0" />
                  <div>
                    <p className="text-[9px] text-omega-muted uppercase font-bold">Experiencia</p>
                    <p className="text-xs font-bold text-omega-text">{card.xp ?? 0} XP</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="size-5 animate-spin text-omega-purple" />
              </div>
            )}

            {/* Link to profile */}
            <div className="pt-1">
              <Link
                href={`/blader/${card.id}`}
                className="block text-center text-[10px] font-bold text-omega-purple hover:text-omega-purple-glow transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Ver perfil completo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function CardsPage() {
  const [cards, setCards] = useState<BladerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [backDataMap, setBackDataMap] = useState<Record<string, CardBackData>>({});
  const [sortBy, setSortBy] = useState<"rank" | "stars" | "winrate">("rank");

  const fetchCards = useCallback(async () => {
    const supabase = createClient();

    const [userResult, playersResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("players")
        .select("id, alias, avatar_url, stars, wins, losses, accent_color, badge, xp, tagline")
        .eq("is_hidden", false)
        .order("stars", { ascending: false })
        .order("wins", { ascending: false })
        .order("created_at", { ascending: true }),
    ]);

    if (userResult.data.user) {
      setMyId(userResult.data.user.id);
    }

    if (playersResult.data) {
      const ranked: BladerCard[] = playersResult.data.map((p, i) => ({
        ...p,
        xp: p.xp ?? 0,
        rank: i + 1,
        winRate: p.wins + p.losses > 0
          ? Math.round((p.wins / (p.wins + p.losses)) * 100)
          : 0,
      }));
      setCards(ranked);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function fetchBackData(playerId: string) {
    if (backDataMap[playerId]) return;

    const supabase = createClient();

    const [comboResult, streakResult, tournamentResult] = await Promise.all([
      // Mejor combo (mas upvotes)
      supabase
        .from("combos")
        .select("blade, ratchet, bit")
        .eq("player_id", playerId)
        .order("upvotes", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Calcular longest streak de matches
      supabase
        .from("matches")
        .select("winner_id")
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(50),
      // Torneos ganados (posicion 1)
      supabase
        .from("tournament_badges")
        .select("id", { count: "exact", head: true })
        .eq("player_id", playerId)
        .eq("position", 1),
    ]);

    // Calcular streak
    let longestStreak = 0;
    let currentStreak = 0;
    if (streakResult.data) {
      for (const m of streakResult.data) {
        if (m.winner_id === playerId) {
          currentStreak++;
          if (currentStreak > longestStreak) longestStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      }
    }

    const bestCombo = comboResult.data
      ? `${comboResult.data.blade} ${comboResult.data.ratchet} ${comboResult.data.bit}`
      : null;

    setBackDataMap((prev) => ({
      ...prev,
      [playerId]: {
        bestCombo,
        longestStreak,
        tournamentWins: tournamentResult.count ?? 0,
      },
    }));
  }

  // Sort cards
  const sortedCards = [...cards].sort((a, b) => {
    if (sortBy === "stars") return b.stars - a.stars;
    if (sortBy === "winrate") return b.winRate - a.winRate;
    return a.rank - b.rank;
  });

  // Separate "my card" to show at top
  const myCard = myId ? cards.find((c) => c.id === myId) : null;
  const otherCards = sortedCards.filter((c) => c.id !== myId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-omega-purple" />
      </div>
    );
  }

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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-omega-gold/30 to-omega-purple/20 flex items-center justify-center border border-omega-gold/30">
              <Trophy className="size-6 text-omega-gold" />
            </div>
            <div>
              <h1 className="text-xl font-black text-omega-text">Blader Cards</h1>
              <p className="text-xs text-omega-muted">{cards.length} bladers registrados</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Sort Controls ═══ */}
      <div className="px-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-omega-muted uppercase tracking-wider">Ordenar:</span>
          <div className="flex gap-1.5">
            {[
              { key: "rank" as const, label: "Ranking" },
              { key: "stars" as const, label: "Estrellas" },
              { key: "winrate" as const, label: "Win Rate" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  sortBy === opt.key
                    ? "bg-omega-purple text-white shadow-md shadow-omega-purple/30"
                    : "bg-omega-surface text-omega-muted border border-omega-border/30 hover:border-omega-purple/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ My Card — Highlighted ═══ */}
      {myCard && (
        <div className="px-4 space-y-2">
          <div className="flex items-center gap-2">
            <Star className="size-3.5 text-omega-gold fill-omega-gold star-glow" />
            <span className="text-[10px] font-bold text-omega-gold uppercase tracking-[0.15em]">Mi Carta</span>
          </div>
          <div className="max-w-[200px] mx-auto">
            <BladerCardItem
              card={myCard}
              isMe={true}
              backData={backDataMap[myCard.id] ?? null}
              onRequestBack={fetchBackData}
            />
          </div>
        </div>
      )}

      {/* ═══ Separator ═══ */}
      <div className="px-4">
        <div className="energy-line" />
      </div>

      {/* ═══ All Cards Grid ═══ */}
      <div className="px-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="size-3.5 text-omega-purple" />
          <span className="text-[10px] font-bold text-omega-muted uppercase tracking-[0.15em]">Galeria de bladers</span>
          <ChevronDown className="size-3 text-omega-muted" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {otherCards.map((card) => (
            <BladerCardItem
              key={card.id}
              card={card}
              isMe={false}
              backData={backDataMap[card.id] ?? null}
              onRequestBack={fetchBackData}
            />
          ))}
        </div>

        {otherCards.length === 0 && (
          <div className="omega-card p-8 text-center">
            <p className="text-sm text-omega-muted">No hay otros bladers registrados aun</p>
          </div>
        )}
      </div>
    </div>
  );
}
