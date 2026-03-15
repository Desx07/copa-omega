"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Swords,
  ShieldHalf,
  Timer,
  Scale,
  X,
} from "lucide-react";

interface ComboPlayer {
  alias: string;
  avatar_url: string | null;
}

interface Combo {
  id: string;
  player_id: string;
  blade: string;
  ratchet: string;
  bit: string;
  type: string;
  description: string | null;
  context: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  player: ComboPlayer;
}

const typeConfig: Record<string, { label: string; icon: typeof Swords; color: string; bg: string }> = {
  attack: { label: "Ataque", icon: Swords, color: "text-omega-red", bg: "bg-omega-red/10 border-omega-red/30" },
  defense: { label: "Defensa", icon: ShieldHalf, color: "text-omega-blue", bg: "bg-omega-blue/10 border-omega-blue/30" },
  stamina: { label: "Stamina", icon: Timer, color: "text-omega-green", bg: "bg-omega-green/10 border-omega-green/30" },
  balance: { label: "Balance", icon: Scale, color: "text-omega-purple", bg: "bg-omega-purple/10 border-omega-purple/30" },
};

const contextLabels: Record<string, string> = {
  next_tournament: "Proximo torneo",
  general: "General",
  counter: "Counter",
};

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [blade, setBlade] = useState("");
  const [ratchet, setRatchet] = useState("");
  const [bit, setBit] = useState("");
  const [type, setType] = useState("attack");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("general");

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const res = await fetch("/api/combos");
      if (res.ok) {
        const data = await res.json();
        setCombos(data.combos);
        setMyVotes(data.my_votes);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!blade.trim() || !ratchet.trim() || !bit.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blade: blade.trim(),
          ratchet: ratchet.trim(),
          bit: bit.trim(),
          type,
          description: description.trim() || null,
          context,
        }),
      });

      if (res.ok) {
        const newCombo = await res.json();
        setCombos((prev) => [newCombo, ...prev]);
        setBlade("");
        setRatchet("");
        setBit("");
        setType("attack");
        setDescription("");
        setContext("general");
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(comboId: string, vote: "up" | "down") {
    setVotingId(comboId);
    try {
      const res = await fetch(`/api/combos/${comboId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCombos((prev) =>
          prev.map((c) =>
            c.id === comboId
              ? { ...c, upvotes: updated.upvotes, downvotes: updated.downvotes }
              : c
          )
        );

        // Update my votes
        setMyVotes((prev) => {
          const next = { ...prev };
          if (prev[comboId] === vote) {
            delete next[comboId]; // Toggle off
          } else {
            next[comboId] = vote;
          }
          return next;
        });
      }
    } finally {
      setVotingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-omega-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
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
            <div className="size-12 rounded-2xl bg-omega-green/20 flex items-center justify-center">
              <Swords className="size-6 text-omega-green" />
            </div>
            <div>
              <h1 className="text-xl font-black text-omega-text">Combos</h1>
              <p className="text-xs text-omega-muted">Compartidos por la comunidad</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="omega-btn omega-btn-sm bg-omega-purple text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-1.5 hover:bg-omega-purple-glow transition-colors"
          >
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {showForm ? "Cerrar" : "Compartir"}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="px-4">
          <form onSubmit={handleSubmit} className="omega-card p-4 space-y-3">
            <h3 className="text-sm font-bold text-omega-text">Compartir combo</h3>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-omega-muted font-bold uppercase tracking-wider">Blade</label>
                <input
                  type="text"
                  value={blade}
                  onChange={(e) => setBlade(e.target.value)}
                  placeholder="Ej: Dran Sword"
                  className="omega-input w-full mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-omega-muted font-bold uppercase tracking-wider">Ratchet</label>
                <input
                  type="text"
                  value={ratchet}
                  onChange={(e) => setRatchet(e.target.value)}
                  placeholder="Ej: 3-60"
                  className="omega-input w-full mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-omega-muted font-bold uppercase tracking-wider">Bit</label>
                <input
                  type="text"
                  value={bit}
                  onChange={(e) => setBit(e.target.value)}
                  placeholder="Ej: Flat"
                  className="omega-input w-full mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-omega-muted font-bold uppercase tracking-wider">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="omega-input w-full mt-1"
                >
                  <option value="attack">Ataque</option>
                  <option value="defense">Defensa</option>
                  <option value="stamina">Stamina</option>
                  <option value="balance">Balance</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-omega-muted font-bold uppercase tracking-wider">Contexto</label>
                <select
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="omega-input w-full mt-1"
                >
                  <option value="general">General</option>
                  <option value="next_tournament">Proximo torneo</option>
                  <option value="counter">Counter</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-omega-muted font-bold uppercase tracking-wider">Descripcion (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Para que sirve, contra que es bueno..."
                maxLength={200}
                rows={2}
                className="omega-input w-full mt-1 resize-none"
              />
              <p className="text-[10px] text-omega-muted text-right mt-0.5">{description.length}/200</p>
            </div>

            <button
              type="submit"
              disabled={submitting || !blade.trim() || !ratchet.trim() || !bit.trim()}
              className="omega-btn w-full bg-omega-purple text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-omega-purple-glow transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Compartir combo
            </button>
          </form>
        </div>
      )}

      {/* Combos list */}
      <div className="px-4 space-y-3">
        {combos.length === 0 ? (
          <div className="omega-card p-10 text-center space-y-3">
            <Swords className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">Todavia no hay combos compartidos</p>
            <p className="text-xs text-omega-muted/50">Se el primero en compartir tu combo favorito</p>
          </div>
        ) : (
          combos.map((combo) => {
            const config = typeConfig[combo.type] || typeConfig.attack;
            const Icon = config.icon;
            const myVote = myVotes[combo.id];
            const netVotes = combo.upvotes - combo.downvotes;
            const isOwn = combo.player_id === userId;

            return (
              <div key={combo.id} className="omega-card p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-omega-dark overflow-hidden border border-white/10">
                      {combo.player.avatar_url ? (
                        <img src={combo.player.avatar_url} alt={combo.player.alias} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-[10px] font-black text-omega-purple">
                          {combo.player.alias.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-omega-text">{combo.player.alias}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {combo.context && (
                      <span className="text-[10px] text-omega-muted bg-omega-dark/60 px-2 py-0.5 rounded-full">
                        {contextLabels[combo.context] || combo.context}
                      </span>
                    )}
                    <span className={`omega-badge text-[10px] border ${config.bg}`}>
                      <Icon className={`size-3 ${config.color}`} />
                      <span className={config.color}>{config.label}</span>
                    </span>
                  </div>
                </div>

                {/* Combo parts */}
                <div className="flex items-center gap-2">
                  <span className="bg-omega-dark/80 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-omega-text">
                    {combo.blade}
                  </span>
                  <span className="text-omega-muted/30 text-xs">+</span>
                  <span className="bg-omega-dark/80 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-omega-text">
                    {combo.ratchet}
                  </span>
                  <span className="text-omega-muted/30 text-xs">+</span>
                  <span className="bg-omega-dark/80 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-omega-text">
                    {combo.bit}
                  </span>
                </div>

                {/* Description */}
                {combo.description && (
                  <p className="text-xs text-omega-muted/80 italic">{combo.description}</p>
                )}

                {/* Votes */}
                <div className="flex items-center gap-3 pt-1 border-t border-white/5">
                  <button
                    onClick={() => handleVote(combo.id, "up")}
                    disabled={votingId === combo.id || isOwn}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      myVote === "up"
                        ? "bg-omega-green/20 text-omega-green border border-omega-green/40"
                        : "bg-omega-dark/50 text-omega-muted hover:text-omega-green border border-white/5 hover:border-omega-green/30"
                    } disabled:opacity-40`}
                  >
                    <ThumbsUp className="size-3.5" />
                    {combo.upvotes}
                  </button>
                  <button
                    onClick={() => handleVote(combo.id, "down")}
                    disabled={votingId === combo.id || isOwn}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      myVote === "down"
                        ? "bg-omega-red/20 text-omega-red border border-omega-red/40"
                        : "bg-omega-dark/50 text-omega-muted hover:text-omega-red border border-white/5 hover:border-omega-red/30"
                    } disabled:opacity-40`}
                  >
                    <ThumbsDown className="size-3.5" />
                    {combo.downvotes}
                  </button>
                  <span className={`ml-auto text-sm font-black ${netVotes > 0 ? "text-omega-green" : netVotes < 0 ? "text-omega-red" : "text-omega-muted"}`}>
                    {netVotes > 0 ? "+" : ""}{netVotes}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
