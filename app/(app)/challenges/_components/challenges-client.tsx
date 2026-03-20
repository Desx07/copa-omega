"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Swords,
  Star,
  Clock,
  Check,
  X,
  Loader2,
  ArrowLeft,
  Zap,
  Search,
  Trash2,
  ChevronDown,
} from "lucide-react";
import ChallengeButton from "@/app/_components/challenge-button";
import ChallengeComments from "./challenge-comments";
import Link from "next/link";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  created_at: string;
  responded_at: string | null;
  challenger: PlayerInfo;
  challenged: PlayerInfo;
};

type SectionKey = "pending" | "accepted" | "completed";

// ---------------------------------------------------------------------------
// Section config
// ---------------------------------------------------------------------------

const SECTION_CONFIG: Record<
  SectionKey,
  { label: string; colorClass: string; borderClass: string }
> = {
  pending: {
    label: "PENDIENTES",
    colorClass: "text-omega-gold",
    borderClass: "border-omega-gold/30",
  },
  accepted: {
    label: "ACEPTADOS",
    colorClass: "text-omega-green",
    borderClass: "border-omega-green/30",
  },
  completed: {
    label: "COMPLETADOS",
    colorClass: "text-omega-muted",
    borderClass: "border-white/10",
  },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ChallengesClient({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sections: pending and accepted open by default, completed closed
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(
    {
      pending: true,
      accepted: true,
      completed: false,
    }
  );

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/challenges?filter=all");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // ------- Actions -------

  async function handleAction(
    challengeId: string,
    action: "accept" | "decline"
  ) {
    setActioning(challengeId);
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        // Refetch to get updated statuses
        await fetchChallenges();
        toast.success(
          action === "accept" ? "Reto aceptado" : "Reto rechazado"
        );
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Error al procesar el reto");
      }
    } catch {
      toast.error("Error de conexion");
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
        toast.success("Reto eliminado");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setActioning(null);
  }

  // ------- Filtering & grouping -------

  const normalizedSearch = searchQuery.toLowerCase().trim();

  const filtered = challenges.filter((c) => {
    if (!normalizedSearch) return true;
    return (
      c.challenger.alias.toLowerCase().includes(normalizedSearch) ||
      c.challenged.alias.toLowerCase().includes(normalizedSearch)
    );
  });

  const pendingChallenges = filtered.filter((c) => c.status === "pending");
  const acceptedChallenges = filtered.filter((c) => c.status === "accepted");
  const completedChallenges = filtered.filter(
    (c) =>
      c.status === "completed" ||
      c.status === "declined"
  );

  const sections: { key: SectionKey; items: Challenge[] }[] = [
    { key: "pending", items: pendingChallenges },
    { key: "accepted", items: acceptedChallenges },
    { key: "completed", items: completedChallenges },
  ];

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
            <p className="text-xs text-omega-muted">
              Busca un rival y desafialo
            </p>
          </div>
        </div>

        {/* Search blader to challenge */}
        <div className="mt-4">
          <SearchAndChallenge
            userId={userId}
            pendingChallenges={challenges.filter(
              (c) => c.status === "pending"
            )}
            onChallengeCreated={fetchChallenges}
          />
        </div>
      </div>

      {/* Search bar for filtering existing challenges */}
      <div className="px-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-omega-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar retos por blader..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-omega-surface border border-omega-border/30 rounded-xl text-omega-text placeholder:text-omega-muted/60 focus:outline-none focus:ring-2 focus:ring-omega-purple/40 transition-all"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="omega-card p-10 text-center">
            <Loader2 className="size-6 text-omega-muted animate-spin mx-auto" />
          </div>
        ) : (
          sections.map(({ key, items }) => (
            <ChallengeSection
              key={key}
              sectionKey={key}
              challenges={items}
              isOpen={openSections[key]}
              onToggle={() => toggleSection(key)}
              userId={userId}
              isAdmin={isAdmin}
              actioning={actioning}
              onAction={handleAction}
              onDelete={handleDeleteChallenge}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

function ChallengeSection({
  sectionKey,
  challenges,
  isOpen,
  onToggle,
  userId,
  isAdmin,
  actioning,
  onAction,
  onDelete,
}: {
  sectionKey: SectionKey;
  challenges: Challenge[];
  isOpen: boolean;
  onToggle: () => void;
  userId: string;
  isAdmin: boolean;
  actioning: string | null;
  onAction: (id: string, action: "accept" | "decline") => void;
  onDelete: (id: string) => void;
}) {
  const config = SECTION_CONFIG[sectionKey];

  return (
    <div>
      {/* Collapsible header */}
      <button
        onClick={onToggle}
        className={`sticky top-0 z-10 flex items-center gap-2 py-2.5 px-3 w-full text-left bg-omega-black/90 backdrop-blur-sm border-b ${config.borderClass} transition-colors`}
        aria-expanded={isOpen}
      >
        <ChevronDown
          className={`size-4 ${config.colorClass} transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
        <span
          className={`text-[11px] font-black tracking-widest ${config.colorClass}`}
        >
          {config.label}
        </span>
        <span className="text-[10px] text-omega-muted">
          ({challenges.length})
        </span>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="space-y-3 pt-3">
          {challenges.length === 0 ? (
            <div className="omega-card p-6 text-center">
              <Swords className="size-8 text-omega-muted/20 mx-auto mb-2" />
              <p className="text-xs text-omega-muted/70">
                {sectionKey === "pending" && "No hay retos pendientes"}
                {sectionKey === "accepted" && "No hay retos aceptados"}
                {sectionKey === "completed" && "No hay retos completados"}
              </p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userId={userId}
                isAdmin={isAdmin}
                actioning={actioning}
                onAction={onAction}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Challenge card
// ---------------------------------------------------------------------------

function ChallengeCard({
  challenge,
  userId,
  isAdmin,
  actioning,
  onAction,
  onDelete,
}: {
  challenge: Challenge;
  userId: string;
  isAdmin: boolean;
  actioning: string | null;
  onAction: (id: string, action: "accept" | "decline") => void;
  onDelete: (id: string) => void;
}) {
  const isMyPending =
    challenge.challenged_id === userId && challenge.status === "pending";

  return (
    <div className="omega-card overflow-hidden">
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
        </div>

        <div className="flex items-center gap-2">
          {/* Admin delete button */}
          {isAdmin && (
            <button
              onClick={() => onDelete(challenge.id)}
              disabled={actioning === challenge.id}
              className="size-7 rounded-lg bg-omega-red/10 border border-omega-red/20 flex items-center justify-center text-omega-muted hover:text-omega-red hover:bg-omega-red/20 transition-all"
              title="Eliminar reto (admin)"
            >
              {actioning === challenge.id ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
            </button>
          )}

          {isMyPending ? (
            <>
              <button
                onClick={() => onAction(challenge.id, "decline")}
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
                onClick={() => onAction(challenge.id, "accept")}
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
            </>
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
            </span>
          )}
        </div>
      </div>

      {/* Comments */}
      <ChallengeComments challengeId={challenge.id} userId={userId} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search and challenge (create new challenge)
// ---------------------------------------------------------------------------

function SearchAndChallenge({
  userId,
  pendingChallenges,
  onChallengeCreated,
}: {
  userId: string;
  pendingChallenges: Challenge[];
  onChallengeCreated: () => void;
}) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; alias: string; avatar_url: string | null; stars: number }[]
  >([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("players")
      .select("id, alias, avatar_url, stars")
      .or(
        `alias.ilike.%${query.trim()}%,full_name.ilike.%${query.trim()}%`
      )
      .eq("is_hidden", false)
      .eq("is_admin", false)
      .limit(8);
    setResults(data ?? []);
    setSearching(false);
  }

  function hasPendingWith(targetId: string): boolean {
    return pendingChallenges.some(
      (c) =>
        (c.challenger_id === userId && c.challenged_id === targetId) ||
        (c.challenger_id === targetId && c.challenged_id === userId)
    );
  }

  function handleChallengeClick(targetId: string) {
    if (hasPendingWith(targetId)) {
      toast.error("Ya tenes un reto pendiente con este blader");
      return false;
    }
    return true;
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
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="omega-btn omega-btn-primary px-4 py-2"
        >
          {searching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
        </button>
      </div>
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-omega-surface"
            >
              <div className="size-8 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
                {player.avatar_url ? (
                  <img
                    src={player.avatar_url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                    {player.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-omega-text truncate">
                  {player.alias}
                </p>
                <p className="text-xs text-omega-muted">
                  <Star className="size-3 text-omega-gold fill-omega-gold inline -mt-0.5 mr-0.5" />
                  {player.stars}
                </p>
              </div>
              <ChallengeButton
                targetId={player.id}
                targetAlias={player.alias}
                onBeforeOpen={() => handleChallengeClick(player.id)}
                onSuccess={onChallengeCreated}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

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

