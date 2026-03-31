import Link from "next/link";
import { ArrowLeft, Dices } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getGachaStats } from "@/lib/gacha";
import GachaClient from "./_components/gacha-client";

export default async function GachaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Obtener datos del jugador
  const { data: player } = await supabase
    .from("players")
    .select("id, alias, omega_coins")
    .eq("id", user.id)
    .single();

  // Obtener historial de pulls
  const { data: pulls } = await supabase
    .from("gacha_pulls")
    .select("id, blade, ratchet, bit, tier_result, tournament_id, pulled_at")
    .eq("player_id", user.id)
    .order("pulled_at", { ascending: false })
    .limit(50);

  const stats = getGachaStats();

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
            <Dices className="size-5 text-omega-purple" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-omega-text neon-purple">
              BeyGacha
            </h1>
            <p className="text-xs text-omega-muted">Combo Random Tournament</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-omega-gold/10 border border-omega-gold/20">
          <span className="text-sm font-bold text-omega-gold">
            {player?.omega_coins ?? 0}
          </span>
          <span className="text-xs text-omega-gold/70">OC</span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-4">
        <div className="flex items-center justify-around rounded-xl bg-omega-surface border border-omega-border/30 py-2 px-2">
          <div className="text-center">
            <p className="text-sm font-bold text-omega-purple">
              {stats.totalBlades}
            </p>
            <p className="text-[10px] text-omega-muted">Blades</p>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="text-center">
            <p className="text-sm font-bold text-omega-gold">
              {stats.totalRatchets}
            </p>
            <p className="text-[10px] text-omega-muted">Ratchets</p>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="text-center">
            <p className="text-sm font-bold text-omega-blue">
              {stats.totalBits}
            </p>
            <p className="text-[10px] text-omega-muted">Bits</p>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="text-center">
            <p className="text-sm font-bold text-omega-gold">30</p>
            <p className="text-[10px] text-omega-muted">OC/Pull</p>
          </div>
        </div>
      </div>

      {/* Client component con la maquina gacha */}
      <div className="px-4">
        <GachaClient
          initialCoins={player?.omega_coins ?? 0}
          initialPulls={pulls ?? []}
        />
      </div>
    </div>
  );
}
