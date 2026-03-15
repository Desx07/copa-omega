"use client";

import { usePresence } from "./presence-provider";

interface OnlineDotProps {
  playerId: string;
}

export function OnlineDot({ playerId }: OnlineDotProps) {
  const { isOnline } = usePresence();

  if (!isOnline(playerId)) {
    return null;
  }

  return (
    <span
      className="size-2.5 rounded-full bg-omega-green shadow-[0_0_6px_rgba(46,213,115,0.6)] shrink-0"
      title="En linea"
    />
  );
}
