"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Users, Zap, ChevronRight } from "lucide-react";

interface TournamentCountdownProps {
  tournament: {
    id: string;
    name: string;
    event_date: string;
    status: string;
    participant_count: number;
    max_participants: number;
  };
}

export default function TournamentCountdown({ tournament }: TournamentCountdownProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const eventDate = new Date(tournament.event_date + "T14:00:00");
  const diff = eventDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const isToday = days === 0 && diff > 0;
  const isTomorrow = days === 1;
  const isLive = tournament.status === "in_progress";
  const isPast = diff <= 0 && !isLive;
  const isFull = tournament.participant_count >= tournament.max_participants;

  if (isPast) return null;

  const countdownText = isLive
    ? "EN VIVO"
    : isToday
    ? "HOY"
    : isTomorrow
    ? "MANANA"
    : days < 7
    ? `${days}d ${hours}h`
    : `${days} dias`;

  const href = isLive
    ? `/tournaments/${tournament.id}`
    : `/tournaments/${tournament.id}/register`;

  return (
    <Link
      href={href}
      className={`omega-card flex items-center gap-3 px-4 py-3 transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border-l-4 ${
        isLive
          ? "border-l-omega-red"
          : isToday
          ? "border-l-omega-gold"
          : "border-l-omega-purple"
      }`}
    >
      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
        isLive ? "bg-omega-red/20" : "bg-omega-gold/20"
      }`}>
        {isLive ? <Zap className="size-5 text-omega-red" /> : <Trophy className="size-5 text-omega-gold" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-omega-text truncate">{tournament.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-[10px] text-omega-muted">
            <Users className="size-3" />
            {tournament.participant_count}/{tournament.max_participants}
            {isFull && <span className="text-omega-red font-bold ml-1">LLENO</span>}
          </span>
        </div>
      </div>

      <div className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-black ${
        isLive
          ? "bg-omega-red/20 text-omega-red animate-pulse"
          : isToday
          ? "bg-omega-gold/20 text-omega-gold"
          : "bg-omega-purple/20 text-omega-purple"
      }`}>
        {countdownText}
      </div>

      <ChevronRight className="size-4 text-omega-muted shrink-0" />
    </Link>
  );
}
