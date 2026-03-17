"use client";

import { Trophy, Clock } from "lucide-react";

interface SeasonBannerProps {
  name: string;
  number: number;
  endsAt: string;
}

export default function SeasonBanner({ name, number, endsAt }: SeasonBannerProps) {
  const endDate = new Date(endsAt);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="omega-card p-3 border-l-4 border-l-omega-gold bg-gradient-to-r from-omega-gold/10 to-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-omega-gold" />
          <span className="text-xs font-black text-omega-gold uppercase tracking-wider">
            Temporada {number}: {name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-omega-muted">
          <Clock className="size-3" />
          {daysLeft > 0 ? `${daysLeft} dias restantes` : "Ultima semana!"}
        </div>
      </div>
    </div>
  );
}
