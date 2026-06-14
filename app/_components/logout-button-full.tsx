"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function LogoutButtonFull() {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        // signOut falló: logueamos y avisamos, pero forzamos el redirect igual
        // para que el usuario no quede atrapado en una sesión a medias.
        console.error("Error cerrando sesión:", error);
        toast.error("Hubo un problema cerrando la sesión. Te redirigimos igual.");
      }
    } catch (err) {
      console.error("Error inesperado cerrando sesión:", err);
      toast.error("Hubo un problema cerrando la sesión. Te redirigimos igual.");
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="omega-btn omega-btn-secondary w-full py-3 text-sm shadow-sm hover:shadow-md hover:text-omega-red hover:border-omega-red/30 transition-all disabled:opacity-60"
    >
      {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      Cerrar sesión
    </button>
  );
}
