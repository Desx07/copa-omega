"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButtonFull() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 rounded-xl border border-omega-border/30 bg-omega-card/20 py-3 text-sm font-medium text-omega-muted hover:text-omega-red hover:border-omega-red/30 transition-all"
    >
      <LogOut className="size-4" />
      Cerrar sesión
    </button>
  );
}
