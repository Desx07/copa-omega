"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Trophy,
  Crown,
  Flame,
  Swords,
  Medal,
  ChevronDown,
} from "lucide-react";
import { OnlineDot } from "@/app/_components/online-dot";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface LeaderboardPlayer {
  id: string;
  alias: string;
  full_name: string | null;
  stars: number;
  wins: number;
  losses: number;
  is_eliminated: boolean;
  avatar_url: string | null;
}

interface MatchEntry {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  stars_bet: number;
  completed_at: string | null;
  player1: { alias: string } | null;
  player2: { alias: string } | null;
  winner: { alias: string } | null;
}

interface TournamentEntry {
  id: string;
  alias: string;
  avatar_url: string | null;
  total: number;
}

interface RankingTabsProps {
  leaderboard: LeaderboardPlayer[];
  streaks: Record<string, number>;
  tournamentRanking: TournamentEntry[];
  matches: MatchEntry[];
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function RankingTabs({
  leaderboard,
  streaks,
  tournamentRanking,
  matches,
}: RankingTabsProps) {
  const [activeTab, setActiveTab] = useState<"estrellas" | "torneos">(
    "estrellas"
  );
  const [matchesOpen, setMatchesOpen] = useState(false);

  return (
    <>
      {/* ═══ TAB BAR ═══ */}
      <div className="px-4">
        <div className="flex rounded-xl bg-omega-dark/60 border border-white/[0.06] p-1">
          <button
            onClick={() => setActiveTab("estrellas")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold transition-all ${
              activeTab === "estrellas"
                ? "bg-omega-card text-omega-gold shadow-sm"
                : "text-omega-muted hover:text-omega-text"
            }`}
          >
            <Star
              className={`size-3.5 ${activeTab === "estrellas" ? "text-omega-gold fill-omega-gold" : ""}`}
            />
            Estrellas
          </button>
          <button
            onClick={() => setActiveTab("torneos")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold transition-all ${
              activeTab === "torneos"
                ? "bg-omega-card text-omega-purple shadow-sm"
                : "text-omega-muted hover:text-omega-text"
            }`}
          >
            <Trophy
              className={`size-3.5 ${activeTab === "torneos" ? "text-omega-purple" : ""}`}
            />
            Torneos
          </button>
        </div>
      </div>

      {/* ═══ TAB CONTENT: ESTRELLAS ═══ */}
      <div className={activeTab === "estrellas" ? "space-y-5" : "hidden"}>
        {/* Empty state */}
        {leaderboard.length === 0 && (
          <div className="mx-4 omega-card p-12 text-center space-y-4">
            <Trophy className="size-16 text-omega-muted/30 mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-bold text-omega-muted">
                No hay jugadores todavia
              </p>
              <p className="text-sm text-omega-muted/70">
                Registrate para ser el primero en la tabla
              </p>
            </div>
            <Link
              href="/auth/register"
              className="omega-btn omega-btn-primary px-6 py-3"
            >
              <Star className="size-4" />
              Registrarme
            </Link>
          </div>
        )}

        {/* Top 3 podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 px-4">
            <PodiumCard
              player={leaderboard[1]}
              rank={2}
              streak={streaks[leaderboard[1].id]}
            />
            <PodiumCard
              player={leaderboard[0]}
              rank={1}
              streak={streaks[leaderboard[0].id]}
            />
            <PodiumCard
              player={leaderboard[2]}
              rank={3}
              streak={streaks[leaderboard[2].id]}
            />
          </div>
        )}

        {/* If only 1 or 2 players, show them inline */}
        {leaderboard.length > 0 && leaderboard.length < 3 && (
          <div className="flex justify-center gap-4 px-4">
            {leaderboard.slice(0, 3).map((player, i) => (
              <div key={player.id} className="w-48">
                <PodiumCard
                  player={player}
                  rank={(i + 1) as 1 | 2 | 3}
                  streak={streaks[player.id]}
                />
              </div>
            ))}
          </div>
        )}

        {/* Full leaderboard table */}
        {leaderboard.length > 0 &&
          (() => {
            const hasPodium = leaderboard.length >= 3;
            const tableStart = hasPodium ? 3 : 0;
            const tablePlayers = leaderboard.slice(tableStart);
            if (tablePlayers.length === 0) return null;

            return (
              <div className="px-4 space-y-3">
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-omega-purple" />
                    <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">
                      Tabla completa
                    </h2>
                  </div>
                  <span className="omega-badge omega-badge-purple">
                    {tablePlayers.length}
                  </span>
                </div>

                {/* List rows with border-l-4 */}
                <div className="space-y-2">
                  {tablePlayers.map((player, index) => {
                    const rank = tableStart + index + 1;
                    const streak = streaks[player.id];
                    const isTop16 = rank <= 16;
                    return (
                      <Link
                        href={`/player/${player.id}`}
                        key={player.id}
                        className={`rounded-xl border-l-4 ${isTop16 ? "border-l-omega-purple" : "border-l-omega-border"} bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3 ${player.is_eliminated ? "opacity-60" : ""}`}
                      >
                        {/* Rank */}
                        <span className="text-sm font-black text-omega-muted/70 w-6 text-center shrink-0">
                          {rank}
                        </span>

                        {/* Avatar */}
                        <div className="size-9 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
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

                        {/* Player info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-sm font-bold truncate ${player.is_eliminated ? "text-omega-muted line-through" : "text-omega-text"}`}
                            >
                              {player.alias}
                            </span>
                            <OnlineDot playerId={player.id} />
                            {player.is_eliminated && (
                              <span className="size-1.5 rounded-full bg-omega-red shrink-0" />
                            )}
                            {streak && (
                              <span className="flex items-center gap-0.5 text-omega-green shrink-0">
                                <Flame className="size-3" />
                                <span className="text-[10px] font-bold">
                                  {streak}
                                </span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-omega-muted">
                            <span className="text-omega-green">
                              {player.wins}W
                            </span>
                            <span className="text-omega-muted/40"> / </span>
                            <span className="text-omega-red">
                              {player.losses}L
                            </span>
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                          <span className="text-sm font-black text-omega-gold">
                            {player.stars}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}
      </div>

      {/* ═══ TAB CONTENT: TORNEOS ═══ */}
      <div className={activeTab === "torneos" ? "space-y-5" : "hidden"}>
        {tournamentRanking.length === 0 && (
          <div className="mx-4 omega-card p-12 text-center space-y-4">
            <Medal className="size-16 text-omega-muted/30 mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-bold text-omega-muted">
                No hay puntos de torneo todavia
              </p>
              <p className="text-sm text-omega-muted/70">
                Los puntos se asignan al participar en torneos oficiales
              </p>
            </div>
          </div>
        )}

        {/* Top 3 podium for tournaments */}
        {tournamentRanking.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 px-4">
            <TournamentPodiumCard entry={tournamentRanking[1]} rank={2} />
            <TournamentPodiumCard entry={tournamentRanking[0]} rank={1} />
            <TournamentPodiumCard entry={tournamentRanking[2]} rank={3} />
          </div>
        )}

        {tournamentRanking.length > 0 && (
          <div className="px-4 space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Medal className="size-4 text-omega-gold" />
                <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">
                  Ranking de Torneos
                </h2>
              </div>
              <span className="omega-badge omega-badge-gold">
                {tournamentRanking.length}
              </span>
            </div>

            {/* List rows (skip top 3 if podium shown) */}
            <div className="space-y-2">
              {tournamentRanking.slice(tournamentRanking.length >= 3 ? 3 : 0).map((entry, index) => {
                const rank = (tournamentRanking.length >= 3 ? index + 3 : index) + 1;
                return (
                  <Link
                    key={entry.id}
                    href={`/player/${entry.id}`}
                    className="rounded-xl border-l-4 border-l-omega-border bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3"
                  >
                    {/* Rank */}
                    <span className="text-sm font-black w-6 text-center shrink-0 text-omega-muted/70">
                      {rank}
                    </span>

                    {/* Avatar */}
                    <div className="size-9 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                          {entry.alias.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Alias */}
                    <span className="text-sm font-bold text-omega-text flex-1 truncate">
                      {entry.alias}
                    </span>

                    {/* Points */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-black text-omega-gold">
                        {entry.total}
                      </span>
                      <span className="text-[10px] text-omega-muted">pts</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ COLLAPSIBLE RECENT MATCHES (always visible, below tabs) ═══ */}
      {matches.length > 0 && (
        <div className="px-4 space-y-3">
          {/* Collapsible header */}
          <button
            onClick={() => setMatchesOpen((prev) => !prev)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Swords className="size-4 text-omega-blue" />
              <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">
                Ultimas partidas
              </h2>
              <span className="omega-badge omega-badge-blue">
                {matches.length}
              </span>
            </div>
            <ChevronDown
              className={`size-4 text-omega-muted transition-transform duration-200 ${
                matchesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Collapsible content */}
          {matchesOpen && (
            <div className="space-y-2">
              {matches.map((match) => {
                const p1 = match.player1 as { alias: string } | null;
                const p2 = match.player2 as { alias: string } | null;
                const p1Won = match.winner_id === match.player1_id;

                return (
                  <div
                    key={match.id}
                    className="rounded-xl border-l-4 border-l-omega-blue bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3"
                  >
                    {/* Player 1 */}
                    <span
                      className={`text-sm font-bold truncate flex-1 text-right ${p1Won ? "text-omega-green" : "text-omega-muted"}`}
                    >
                      {p1Won && (
                        <Crown className="size-3 text-omega-gold inline mr-1" />
                      )}
                      {p1?.alias ?? "???"}
                    </span>

                    {/* VS + stars */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="omega-badge omega-badge-gold">
                        <Star className="size-3 text-omega-gold fill-omega-gold mr-0.5" />
                        {match.stars_bet}
                      </span>
                    </div>

                    {/* Player 2 */}
                    <span
                      className={`text-sm font-bold truncate flex-1 ${!p1Won ? "text-omega-green" : "text-omega-muted"}`}
                    >
                      {p2?.alias ?? "???"}
                      {!p1Won && (
                        <Crown className="size-3 text-omega-gold inline ml-1" />
                      )}
                    </span>

                    {/* Date */}
                    <span className="text-[10px] text-omega-muted/60 shrink-0">
                      {match.completed_at
                        ? new Date(match.completed_at).toLocaleDateString(
                            "es-AR",
                            { day: "numeric", month: "short" }
                          )
                        : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Podium helper (client-side, uses OnlineDot which needs client context)     */
/* -------------------------------------------------------------------------- */

interface PodiumPlayer {
  id: string;
  alias: string;
  stars: number;
  wins: number;
  losses: number;
  is_eliminated: boolean;
  avatar_url: string | null;
}

interface PodiumCardProps {
  player: PodiumPlayer;
  rank: 1 | 2 | 3;
  streak?: number;
}

const podiumConfig = {
  1: {
    aura: "aura-gold",
    starClass: "text-omega-gold",
    label: "neon-gold",
    height: "pt-2",
    avatarBorder: "border-omega-gold",
    gradient: "from-omega-gold/20 to-omega-gold/5",
    crownClass: "size-6 text-omega-gold fill-omega-gold/30",
  },
  2: {
    aura: "aura-silver",
    starClass: "text-omega-muted",
    label: "text-omega-muted",
    height: "pt-6",
    avatarBorder: "border-omega-muted/50",
    gradient: "from-gray-400/15 to-gray-500/5",
    crownClass: "size-5 text-omega-muted/70",
  },
  3: {
    aura: "aura-bronze",
    starClass: "text-orange-500",
    label: "text-orange-500",
    height: "pt-8",
    avatarBorder: "border-orange-500/50",
    gradient: "from-orange-500/15 to-orange-600/5",
    crownClass: "size-5 text-orange-500/70",
  },
} as const;

function PodiumCard({ player, rank, streak }: PodiumCardProps) {
  const config = podiumConfig[rank];

  return (
    <div
      className={`${config.height} ${rank === 1 ? "order-2 -mt-2" : rank === 2 ? "order-1 mt-2" : "order-3 mt-2"}`}
    >
      <Link
        href={`/player/${player.id}`}
        className={`group rounded-2xl bg-gradient-to-br ${config.gradient} ${config.aura} p-4 block text-center space-y-2 shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
      >
        {/* Crown */}
        <div className="flex justify-center">
          <Crown className={config.crownClass} />
        </div>

        {/* Avatar */}
        <div
          className={`size-14 rounded-full border-2 ${config.avatarBorder} overflow-hidden bg-omega-dark mx-auto`}
        >
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full flex items-center justify-center text-lg font-black text-omega-purple">
              {player.alias.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Alias */}
        <div className="flex items-center justify-center gap-1.5">
          <p
            className={`text-sm font-black truncate ${player.is_eliminated ? "text-omega-muted line-through" : "text-omega-text"}`}
          >
            {player.alias}
          </p>
          <OnlineDot playerId={player.id} />
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-1">
          <Star
            className={`size-4 ${config.starClass} ${rank === 1 ? "star-glow fill-omega-gold" : ""}`}
          />
          <span className={`text-xl font-black ${config.label}`}>
            {player.stars}
          </span>
        </div>

        {/* W/L + streak */}
        <div className="space-y-1">
          <p className="text-[11px] text-omega-muted">
            <span className="text-omega-green font-bold">{player.wins}W</span>{" "}
            <span className="text-omega-red font-bold">{player.losses}L</span>
          </p>
          {streak && (
            <p className="flex items-center justify-center gap-1 text-[10px] text-omega-green font-bold">
              <Flame className="size-3" />
              {streak} racha
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tournament Podium Card                                                     */
/* -------------------------------------------------------------------------- */

function TournamentPodiumCard({
  entry,
  rank,
}: {
  entry: TournamentEntry;
  rank: 1 | 2 | 3;
}) {
  const config = podiumConfig[rank];

  return (
    <div
      className={`${config.height} ${rank === 1 ? "order-2 -mt-2" : rank === 2 ? "order-1 mt-2" : "order-3 mt-2"}`}
    >
      <Link
        href={`/player/${entry.id}`}
        className={`group rounded-2xl bg-gradient-to-br ${config.gradient} ${config.aura} p-4 block text-center space-y-2 shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
      >
        <div className="flex justify-center">
          <Crown className={config.crownClass} />
        </div>

        <div
          className={`size-14 rounded-full border-2 ${config.avatarBorder} overflow-hidden bg-omega-dark mx-auto`}
        >
          {entry.avatar_url ? (
            <img src={entry.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center text-lg font-black text-omega-purple">
              {entry.alias.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <p className="text-sm font-black truncate text-omega-text">
          {entry.alias}
        </p>

        <div className="flex items-center justify-center gap-1">
          <Trophy className={`size-4 ${config.starClass}`} />
          <span className={`text-xl font-black ${config.label}`}>
            {entry.total}
          </span>
          <span className="text-[10px] text-omega-muted">pts</span>
        </div>
      </Link>
    </div>
  );
}
