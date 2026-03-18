"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, X } from "lucide-react";
import { CHANGELOG, getLatestVersion } from "@/lib/changelog";

export default function UpdateBanner() {
  const [show, setShow] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const router = useRouter();

  const latestEntry = CHANGELOG[0];

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const latest = getLatestVersion();
        if (!data.seen_versions.includes(latest)) {
          setLatestVersion(latest);
          setShow(true);
        }
      })
      .catch(() => {});
  }, []);

  async function markSeen() {
    if (!latestVersion) return;
    try {
      await fetch("/api/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: latestVersion }),
      });
    } catch {
      // silent
    }
  }

  async function handleView() {
    await markSeen();
    setShow(false);
    router.push("/updates");
  }

  async function handleDismiss() {
    await markSeen();
    setShow(false);
  }

  if (!show || !latestVersion) return null;

  return (
    <div className="omega-card overflow-hidden border-omega-purple/30">
      <div className="bg-gradient-to-r from-omega-purple/30 via-omega-blue/20 to-omega-purple/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-omega-purple/30 flex items-center justify-center shrink-0">
            <Megaphone className="size-4 text-omega-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-omega-text truncate">
              Nueva actualizacion v{latestVersion}
            </p>
            <p className="text-[11px] text-omega-muted truncate">
              {latestEntry?.name}
            </p>
          </div>
          <button
            onClick={handleView}
            className="shrink-0 text-xs font-bold text-omega-purple bg-omega-purple/20 hover:bg-omega-purple/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Ver novedades
          </button>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-omega-muted hover:text-omega-text transition-colors p-1"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
