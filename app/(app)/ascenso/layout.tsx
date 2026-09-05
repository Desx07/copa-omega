import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCapabilities } from "@/lib/capabilities";

// Guard de modalidad para la ruta /ascenso. La página es un Client Component,
// así que el chequeo vive en este layout server: si el Torneo de Ascenso está
// apagado, la ruta no debe ser accesible ni por URL directa ni por bookmark →
// redirige al dashboard con gracia. Con el ascenso encendido (caso normal)
// deja pasar sin tocar nada del render del cliente.
export default async function AscensoLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const caps = await getCapabilities(supabase);
  if (!caps.canViewAscenso) redirect("/dashboard");

  return <>{children}</>;
}
