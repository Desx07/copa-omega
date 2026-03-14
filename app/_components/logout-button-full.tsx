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
      className="omega-btn omega-btn-secondary w-full py-3 text-sm shadow-sm hover:shadow-md hover:text-omega-red hover:border-omega-red/30 transition-all"
    >
      <LogOut className="size-4" />
      Cerrar sesión
    </button>
  );
}
