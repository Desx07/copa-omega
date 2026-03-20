"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Swords,
  Star,
  Clock,
  Check,
  X,
  Send,
  Loader2,
  ArrowLeft,
  Zap,
  Search,
  Trash2,
} from "lucide-react";
import ChallengeButton from "@/app/_components/challenge-button";
import ChallengeComments from "./challenge-comments";
import Link from "next/link";

type PlayerInfo = {
  id: string;
  alias: string;
  avatar_url: string | null;
  stars: number;
};

type Challenge = {
  id: string;
  challenger_id: string;
  challenged_id: string;
  stars_bet: number;
  message: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  responded_at: string | null;
  challenger: PlayerInfo;
  challenged: PlayerInfo;
};

type Tab = "pending_for_me" | "my_sent" | "all_active";

export default function ChallengesClient({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>("pending_for_me");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges?filter=${tab}`);
      if (res.ok) {
        const data = await res.json();
        setChallenges(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  async function handleAction(challengeId: string, action: "accept" | "decline") {
    setActioning(challengeId);
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      }
    } catch {
      // ignore
    }
    setActioning(null);
  }

  async function handleDeleteChallenge(challengeId: string) {
    if (!confirm("Eliminar este reto?")) return;
    setActioning(challengeId);
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      }
    } catch {
      // ignore
    }
    setActioning(null);
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }

  function timeLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expirado";
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m restantes`;
    }
    return `${hours}h restantes`;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending_for_me", label: "Mis retos pendientes" },
    { key: "my_sent", label: "Retos enviados" },
    { key: "all_active", label: "Retos activos" },
  ];

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
          <div className="size-10 rounded-xl bg-omega-red/20 border border-omega-red/30 flex items-center justify-center">
            <Swords className="size-5 text-omega-red" />
          </div>
          <div>
            <h1 className="text-xl font-black text-omega-text">Retos</h1>
            <p className="text-xs text-omega-muted">Buscá un rival y desafialo</p>
          </div>
        </div>

        {/* Search blader to challenge */}
        <div className="mt-4">
          <SearchAndChallenge />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`omega-btn text-xs px-3 py-2 whitespace-nowrap ${
              tab === t.key
                ? "omega-btn-primary"
                : "omega-btn-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Challenges list */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="omega-card p-10 text-center">
            <Loader2 className="size-6 text-omega-muted animate-spin mx-auto" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="omega-card p-10 text-center space-y-3">
            <Swords className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">
              {tab === "pending_for_me"
                ? "No tenes retos pendientes"
                : tab === "my_sent"
                ? "No enviaste ningun reto"
                : "No hay retos activos"}
            </p>
          </div>
        ) : (
          challenges.map((challenge) => {
            const isMyPending =
              tab === "pending_for_me" &&
              challenge.challenged_id === userId &&
              challenge.status === "pending";

            return (
              <div key={challenge.id} className="omega-card overflow-hidden">
                {/* Match header */}
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* Challenger */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="size-9 rounded-full bg-omega-dark overflow-hidden shrink-0 border border-omega-border/30">
                      {challenge.challenger.avatar_url ? (
                        <img
                          src={challenge.challenger.avatar_url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-sm font-black text-omega-purple">
                          {challenge.challenger.alias.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">
                        {challenge.challenger.alias}
                      </p>
                      <p className="text-[11px] text-omega-muted flex items-center gap-1">
                        <Star className="size-3 text-omega-gold fill-omega-gold" />
                        {challenge.challenger.stars}
                      </p>
                    </div>
                  </div>

                  {/* VS badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="size-8 rounded-lg bg-omega-red/20 border border-omega-red/30 flex items-center justify-center">
                      <Zap className="size-4 text-omega-red" />
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      <span className="text-xs font-black text-omega-gold">
                        {challenge.stars_bet}
                      </span>
                      <Star className="size-3 text-omega-gold fill-omega-gold" />
                    </div>
                  </div>

                  {/* Challenged */}
                  <div className="flex-1 min-w-0 flex items-center gap-2 justify-end">
                    <div className="min-w-0 text-right">
                      <p className="text-sm font-bold text-omega-text truncate">
                        {challenge.challenged.alias}
                      </p>
                      <p className="text-[11px] text-omega-muted flex items-center gap-1 justify-end">
                        <Star className="size-3 text-omega-gold fill-omega-gold" />
                        {challenge.challenged.stars}
                      </p>
                    </div>
                    <div className="size-9 rounded-full bg-omega-dark overflow-hidden shrink-0 border border-omega-border/30">
                      {challenge.challenged.avatar_url ? (
                        <img
                          src={challenge.challenged.avatar_url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-sm font-black text-omega-purple">
                          {challenge.challenged.alias.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                {challenge.message && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-omega-muted/80 italic bg-omega-dark/50 rounded-lg px-3 py-2">
                      &ldquo;{challenge.message}&rdquo;
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-2 bg-omega-surface/50 border-t border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-omega-muted">
                    <Clock className="size-3" />
                    <span>{timeAgo(challenge.created_at)}</span>
                    {challenge.status === "pending" && (
                      <>
                        <span className="text-omega-muted/30">|</span>
                        <span className="text-omega-gold">
                          {timeLeft(challenge.expires_at)}
                        </span>
                      </>
                    )}
                  </div>

                  {isMyPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(challenge.id, "decline")}
                        disabled={actioning === challenge.id}
                        className="omega-btn omega-btn-red text-xs px-3 py-1.5"
                      >
                        {actioning === challenge.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <>
                            <X className="size-3" />
                            Rechazar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(challenge.id, "accept")}
                        disabled={actioning === challenge.id}
                        className="omega-btn omega-btn-green text-xs px-3 py-1.5"
                      >
                        {actioning === challenge.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="size-3" />
                            Aceptar
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`omega-badge ${
                        challenge.status === "pending"
                          ? "omega-badge-gold"
                          : challenge.status === "accepted"
                          ? "omega-badge-green"
                          : challenge.status === "declined"
                          ? "omega-badge-red"
                          : "omega-badge-purple"
                      }`}
                    >
                      {challenge.status === "pending" && "Pendiente"}
                      {challenge.status === "accepted" && "Aceptado"}
                      {challenge.status === "declined" && "Rechazado"}
                      {challenge.status === "completed" && "Completado"}
                      {challenge.status === "expired" && "Expirado"}
                    </span>
                  )}
                </div>

                {/* Admin delete */}
                {isAdmin && (
                  <div className="px-4 py-1.5 bg-omega-surface/30 border-t border-white/[0.04] flex items-center justify-end">
                    <button
                      onClick={() => handleDeleteChallenge(challenge.id)}
                      disabled={actioning === challenge.id}
                      className="text-[11px] text-omega-muted hover:text-omega-red transition-colors flex items-center gap-1"
                    >
                      {actioning === challenge.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="size-3" />
                          Eliminar reto
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Comments */}
                <ChallengeComments challengeId={challenge.id} userId={userId} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SearchAndChallenge() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; alias: string; avatar_url: string | null; stars: number }[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("players")
      .select("id, alias, avatar_url, stars")
      .or(`alias.ilike.%${query.trim()}%,full_name.ilike.%${query.trim()}%`)
      .eq("is_hidden", false)
      .eq("is_admin", false)
      .limit(8);
    setResults(data ?? []);
    setSearching(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar blader por alias o nombre..."
          className="omega-input flex-1"
        />
        <button onClick={handleSearch} disabled={searching || !query.trim()} className="omega-btn omega-btn-primary px-4 py-2">
          {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </button>
      </div>
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((player) => (
            <div key={player.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-omega-surface">
              <div className="size-8 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                    {player.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-omega-text truncate">{player.alias}</p>
                <p className="text-xs text-omega-muted">★ {player.stars}</p>
              </div>
              <ChallengeButton targetId={player.id} targetAlias={player.alias} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
