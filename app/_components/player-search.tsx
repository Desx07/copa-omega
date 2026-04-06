"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerSearchResult {
  id: string;
  alias: string;
  full_name?: string | null;
  avatar_url?: string | null;
  stars?: number;
}

interface PlayerSearchProps {
  players: PlayerSearchResult[];
  onSelect: (player: PlayerSearchResult) => void;
  placeholder?: string;
  excludeIds?: string[];
  /** Mostrar estrellas en cada resultado */
  showStars?: boolean;
  /** Cantidad maxima de resultados a mostrar */
  maxResults?: number;
  /** Permite limpiar la seleccion */
  clearable?: boolean;
  /** Label del campo */
  label?: string;
  /** Texto mostrado cuando se selecciono un jugador */
  selectedPlayer?: PlayerSearchResult | null;
  /** data-testid para el input */
  testId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlayerSearch({
  players,
  onSelect,
  placeholder = "Buscar blader...",
  excludeIds = [],
  showStars = true,
  maxResults = 8,
  clearable = false,
  label,
  selectedPlayer = null,
  testId = "player-search-input",
}: PlayerSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ---- Filtrado ----
  const excludeSet = new Set(excludeIds);
  const normalizedQuery = query.toLowerCase().trim();

  const filtered =
    normalizedQuery.length >= 1
      ? players
          .filter((p) => {
            if (excludeSet.has(p.id)) return false;
            const aliasMatch = p.alias.toLowerCase().includes(normalizedQuery);
            const nameMatch = p.full_name
              ? p.full_name.toLowerCase().includes(normalizedQuery)
              : false;
            return aliasMatch || nameMatch;
          })
          .slice(0, maxResults)
      : [];

  // ---- Click outside ----
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight cuando cambian los resultados
  useEffect(() => {
    setHighlightIndex(0);
  }, [normalizedQuery]);

  // Scroll al item highlighteado
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-player-item]");
    if (items[highlightIndex]) {
      items[highlightIndex].scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  // ---- Handlers ----
  const handleSelect = useCallback(
    (player: PlayerSearchResult) => {
      onSelect(player);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onSelect]
  );

  function handleClear() {
    setQuery("");
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || filtered.length === 0) {
      if (e.key === "ArrowDown" && filtered.length > 0) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }

  // Si hay un jugador seleccionado, mostrar en modo "seleccionado"
  if (selectedPlayer) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2 omega-input py-2.5">
          {/* Avatar */}
          <div className="size-7 rounded-full overflow-hidden bg-omega-dark border border-omega-border/30 shrink-0">
            {selectedPlayer.avatar_url ? (
              <img
                src={selectedPlayer.avatar_url}
                alt={selectedPlayer.alias}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-[10px] font-black text-omega-purple">
                {selectedPlayer.alias.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-omega-text truncate block">
              {selectedPlayer.alias}
            </span>
          </div>
          {showStars && selectedPlayer.stars !== undefined && (
            <span className="text-xs text-omega-muted shrink-0">
              {selectedPlayer.stars} est.
            </span>
          )}
          {clearable && (
            <button
              type="button"
              onClick={() => {
                onSelect(null as unknown as PlayerSearchResult);
              }}
              className="size-6 rounded-md flex items-center justify-center text-omega-muted hover:text-omega-red hover:bg-omega-red/10 transition-all shrink-0"
              aria-label="Quitar jugador"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {label && (
        <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-omega-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 1) {
              setIsOpen(true);
            } else {
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            if (query.trim().length >= 1 && filtered.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 text-sm bg-omega-surface border border-omega-border/30 rounded-xl text-omega-text placeholder:text-omega-muted/60 focus:outline-none focus:ring-2 focus:ring-omega-purple/40 transition-all"
          role="combobox"
          aria-expanded={isOpen && filtered.length > 0}
          aria-autocomplete="list"
          aria-controls="player-search-listbox"
          data-testid={testId}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 size-5 rounded flex items-center justify-center text-omega-muted hover:text-omega-text transition-colors"
            aria-label="Limpiar busqueda"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          id="player-search-listbox"
          role="listbox"
          className="absolute z-50 left-0 right-0 top-full mt-1 max-h-[280px] overflow-y-auto rounded-xl border border-omega-border/30 bg-omega-card shadow-xl shadow-black/30"
        >
          {filtered.length === 0 && normalizedQuery.length >= 1 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-xs text-omega-muted/70">Sin resultados</p>
            </div>
          ) : (
            filtered.map((player, idx) => (
              <button
                key={player.id}
                type="button"
                data-player-item
                role="option"
                aria-selected={idx === highlightIndex}
                onClick={() => handleSelect(player)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                  idx === highlightIndex
                    ? "bg-omega-purple/15"
                    : "hover:bg-omega-surface/80"
                } ${idx > 0 ? "border-t border-omega-border/10" : ""}`}
              >
                {/* Avatar */}
                <div className="size-8 rounded-full overflow-hidden bg-omega-dark border border-omega-border/30 shrink-0">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.alias}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                      {player.alias.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-omega-text truncate">
                    {player.alias}
                  </p>
                  {player.full_name && (
                    <p className="text-[11px] text-omega-muted truncate">
                      {player.full_name}
                    </p>
                  )}
                </div>

                {/* Stars */}
                {showStars && player.stars !== undefined && (
                  <span className="text-xs text-omega-muted shrink-0">
                    {player.stars} est.
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
