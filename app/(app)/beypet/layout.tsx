import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCapabilities } from "@/lib/capabilities";

// Guard de modalidad para la ruta /beypet. La página es un Client Component,
// así que el chequeo vive en este layout server: los BeyPets son parte de la
// economía de coins (apuestan Omega Coins), por lo que si la wallet está
// apagada la ruta no debe ser accesible ni por URL directa ni por bookmark →
// redirige al dashboard. Con la wallet encendida (caso normal) deja pasar sin
// tocar nada del render del cliente.
export default async function BeyPetLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const caps = await getCapabilities(supabase);
  if (!caps.walletEnabled) redirect("/dashboard");

  return <>{children}</>;
}
