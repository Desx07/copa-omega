import { notFound } from "next/navigation";
import { TournamentModeToggle } from "@/app/_components/tournament-mode-toggle";

// ── Preview solo-dev de la card de modalidades del dashboard admin ──
// Uso: http://localhost:3000/dev-preview/admin-toggles
// Sin sesión el GET de app-config da 401 y el componente cae a los defaults
// (Copa on, Ascenso/Liga off), que es justo el estado a verificar visualmente.
export default function AdminTogglesPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-omega-black text-omega-text bg-noise">
      <div className="max-w-lg mx-auto px-4 py-10">
        <TournamentModeToggle />
      </div>
    </div>
  );
}
