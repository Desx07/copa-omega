import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Wrench,
  Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CHANGELOG } from "@/lib/changelog";

const CATEGORY_ICONS = {
  Sparkles,
  TrendingUp,
  Wrench,
} as const;

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export default async function UpdatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get which versions user has seen
  const { data: seen } = await supabase
    .from("changelog_seen")
    .select("version")
    .eq("player_id", user.id);

  const seenVersions = new Set((seen ?? []).map((s) => s.version));

  // Mark all versions as seen now that the user is viewing the page
  const unseenVersions = CHANGELOG
    .map((entry) => entry.version)
    .filter((v) => !seenVersions.has(v));

  if (unseenVersions.length > 0) {
    await supabase.from("changelog_seen").upsert(
      unseenVersions.map((version) => ({
        player_id: user.id,
        version,
        seen_at: new Date().toISOString(),
      })),
      { onConflict: "player_id,version" }
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="px-4 pt-6 space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-omega-purple/20 flex items-center justify-center">
            <Megaphone className="size-6 text-omega-purple" />
          </div>
          <div>
            <h1 className="text-xl font-black text-omega-text">Actualizaciones</h1>
            <p className="text-xs text-omega-muted">Novedades de Copa Omega Star</p>
          </div>
        </div>
      </div>

      {/* Version list */}
      <div className="px-4 space-y-4">
        {CHANGELOG.map((entry) => {
          const isNew = !seenVersions.has(entry.version);

          return (
            <div key={entry.version} className="omega-card p-4 space-y-4">
              {/* Version header */}
              <div className="flex items-center gap-3">
                <span className="omega-badge-purple text-xs font-black px-2.5 py-1 rounded-lg">
                  v{entry.version}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-omega-text truncate">
                    {entry.name}
                  </p>
                  <p className="text-[11px] text-omega-muted">
                    {formatDate(entry.date)}
                  </p>
                </div>
                {isNew && (
                  <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-omega-gold bg-omega-gold/15 border border-omega-gold/30 px-2 py-0.5 rounded-full animate-pulse">
                    Nuevo
                  </span>
                )}
              </div>

              {/* Categories */}
              {entry.categories.map((cat) => {
                const IconComponent =
                  CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS] ?? Sparkles;

                return (
                  <div key={cat.label} className="space-y-2">
                    {/* Category header */}
                    <div className="flex items-center gap-2">
                      <IconComponent className={`size-4 ${cat.color}`} />
                      <span className={`text-xs font-black uppercase tracking-wider ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>

                    {/* Items */}
                    <ul className="space-y-1.5 pl-1">
                      {cat.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[13px] text-omega-muted leading-snug"
                        >
                          <span className={`size-1.5 rounded-full ${cat.color.replace("text-", "bg-")} mt-1.5 shrink-0`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
