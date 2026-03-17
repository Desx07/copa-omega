"use client";

import { useState, useEffect } from "react";
import { Zap, Clock } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  type: string;
  ends_at: string;
}

export default function EventBanner() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents)
      .catch(() => {});
  }, []);

  if (events.length === 0) return null;

  const event = events[0]; // Show most recent active event
  const endsAt = new Date(event.ends_at);
  const now = new Date();
  const hoursLeft = Math.max(
    0,
    Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60))
  );

  const typeColors: Record<string, string> = {
    general: "border-l-omega-purple bg-omega-purple/10",
    combo_challenge: "border-l-omega-green bg-omega-green/10",
    prediction_master: "border-l-omega-blue bg-omega-blue/10",
    weekend_warrior: "border-l-omega-gold bg-omega-gold/10",
  };

  return (
    <div
      className={`omega-card p-3 border-l-4 ${typeColors[event.type] || typeColors.general}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-omega-gold" />
          <span className="text-xs font-black text-omega-text">
            {event.title}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-omega-muted">
          <Clock className="size-3" />
          {hoursLeft > 24
            ? `${Math.ceil(hoursLeft / 24)}d`
            : `${hoursLeft}h`}
        </div>
      </div>
      {event.description && (
        <p className="text-[11px] text-omega-muted mt-1">
          {event.description}
        </p>
      )}
    </div>
  );
}
