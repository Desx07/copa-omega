"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Swords,
  Crown,
  ChevronDown,
  Search,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MatchData = {
  id: string;
  status: string;
  stars_bet: number;
  created_at: string;
  completed_at: string | null;
  tournament_id: string | null;
  player1: { alias: string } | null;
  player2: { alias: string } | null;
  winner: { alias: string } | null;
};

type SectionKey = "pending" | "in_progress" | "completed";

// ---------------------------------------------------------------------------
// Section config
// ---------------------------------------------------------------------------

const SECTION_CONFIG: Record<
  SectionKey,
  { label: string; colorClass: string; borderClass: string; bgClass: string }
> = {
  pending: {
    label: "PENDIENTES",
    colorClass: "text-omega-gold",
    borderClass: "border-omega-gold/30",
    bgClass: "border-l-omega-gold",
  },
  in_progress: {
    label: "EN CURSO",
    colorClass: "text-omega-blue",
    borderClass: "border-omega-blue/30",
    bgClass: "border-l-omega-blue",
  },
  completed: {
    label: "COMPLETADAS",
    colorClass: "text-omega-green",
    borderClass: "border-omega-green/30",
    bgClass: "border-l-omega-green",
  },
};

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export default function MatchesClient({
  matches,
  mode,
  linkPrefix,
}: {
  matches: MatchData[];
  mode: "admin" | "public";
  linkPrefix: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    pending: true,
    in_progress: true,
    completed: false,
  });

  // ------- Filtering & grouping -------

  const normalizedSearch = searchQuery.toLowerCase().trim();

  const filtered = matches.filter((m) => {
    if (!normalizedSearch) return true;
    return (
      (m.player1?.alias.toLowerCase().includes(normalizedSearch) ?? false) ||
      (m.player2?.alias.toLowerCase().includes(normalizedSearch) ?? false)
    );
  });

  const pendingMatches = filtered.filter((m) => m.status === "pending");
  const inProgressMatches = filtered.filter((m) => m.status === "in_progress");
  const completedMatches = filtered.filter(
    (m) => m.status === "completed" || m.status === "cancelled"
  );

  const sections: { key: SectionKey; items: MatchData[] }[] = [
    { key: "pending", items: pendingMatches },
    { key: "in_progress", items: inProgressMatches },
    { key: "completed", items: completedMatches },
  ];

  // Hide in_progress section if empty
  const visibleSections = sections.filter(
    (s) => s.key !== "in_progress" || s.items.length > 0
  );

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-omega-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrar por alias de jugador..."
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-omega-surface border border-omega-border/30 rounded-xl text-omega-text placeholder:text-omega-muted/60 focus:outline-none focus:ring-2 focus:ring-omega-purple/40 transition-all"
        />
      </div>

      {/* Sections */}
      {visibleSections.map(({ key, items }) => (
        <MatchSection
          key={key}
          sectionKey={key}
          matches={items}
          isOpen={openSections[key]}
          onToggle={() => toggleSection(key)}
          mode={mode}
          linkPrefix={linkPrefix}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

function MatchSection({
  sectionKey,
  matches,
  isOpen,
  onToggle,
  mode,
  linkPrefix,
}: {
  sectionKey: SectionKey;
  matches: MatchData[];
  isOpen: boolean;
  onToggle: () => void;
  mode: "admin" | "public";
  linkPrefix: string;
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
          ({matches.length})
        </span>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="space-y-2 pt-3">
          {matches.length === 0 ? (
            <div className="omega-card p-6 text-center">
              <Swords className="size-8 text-omega-muted/20 mx-auto mb-2" />
              <p className="text-xs text-omega-muted/70">
                {sectionKey === "pending" && "No hay partidas pendientes"}
                {sectionKey === "in_progress" && "No hay partidas en curso"}
                {sectionKey === "completed" && "No hay partidas completadas"}
              </p>
            </div>
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                mode={mode}
                linkPrefix={linkPrefix}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match card
// ---------------------------------------------------------------------------

function MatchCard({
  match,
  mode,
  linkPrefix,
}: {
  match: MatchData;
  mode: "admin" | "public";
  linkPrefix: string;
}) {
  const isPending = match.status === "pending";
  const isCompleted = match.status === "completed";
  const isCancelled = match.status === "cancelled";
  const isInProgress = match.status === "in_progress";

  const borderColor = isPending
    ? "border-l-omega-gold"
    : isInProgress
      ? "border-l-omega-blue"
      : isCompleted
        ? "border-l-omega-green"
        : "border-l-omega-red";

  const baseClassName = `block rounded-xl border-l-4 ${borderColor} bg-omega-card px-4 py-3 shadow-sm ${isCancelled ? "opacity-50" : ""}`;
  const adminClassName = `${baseClassName} hover:shadow-md hover:scale-[1.01] transition-all`;

  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        {/* Status badge */}
        {isPending && (
          <span className="omega-badge omega-badge-gold">PENDIENTE</span>
        )}
        {isInProgress && (
          <span className="omega-badge omega-badge-blue">EN CURSO</span>
        )}
        {isCompleted && (
          <span className="omega-badge omega-badge-green">COMPLETADA</span>
        )}
        {isCancelled && (
          <span className="omega-badge omega-badge-red">CANCELADA</span>
        )}

        {/* Stars bet */}
        <div className="flex items-center gap-1">
          <Star className="size-3.5 text-omega-gold fill-omega-gold" />
          <span className="text-sm font-black text-omega-gold">
            {match.stars_bet}
          </span>
        </div>
      </div>

      {/* Players */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-center">
          <p
            className={`text-sm font-bold ${
              isCompleted && match.winner?.alias === match.player1?.alias
                ? "text-omega-gold"
                : "text-omega-text"
            }`}
          >
            {isCompleted && match.winner?.alias === match.player1?.alias && (
              <Crown className="size-3.5 text-omega-gold inline mr-1 -mt-0.5" />
            )}
            {match.player1?.alias ?? "???"}
          </p>
        </div>

        <div className="shrink-0">
          <span className="text-xs font-bold text-omega-muted">VS</span>
        </div>

        <div className="flex-1 text-center">
          <p
            className={`text-sm font-bold ${
              isCompleted && match.winner?.alias === match.player2?.alias
                ? "text-omega-gold"
                : "text-omega-text"
            }`}
          >
            {match.player2?.alias ?? "???"}
            {isCompleted && match.winner?.alias === match.player2?.alias && (
              <Crown className="size-3.5 text-omega-gold inline ml-1 -mt-0.5" />
            )}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-omega-border/30">
        <p className="text-[11px] text-omega-muted">
          {new Date(match.created_at).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {mode === "admin" && isPending && (
          <span className="text-xs font-bold text-omega-blue">
            Resolver &rarr;
          </span>
        )}
        {isCompleted && match.winner && (
          <p className="text-[11px] text-omega-green">
            Ganador: <span className="font-bold">{match.winner.alias}</span>
          </p>
        )}
      </div>
    </>
  );

  if (mode === "admin") {
    return (
      <Link href={`${linkPrefix}/${match.id}`} className={adminClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div className={baseClassName}>
      {content}
    </div>
  );
}
