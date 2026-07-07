import { notFound } from "next/navigation";
import { PlayerActions } from "@/app/(app)/admin/players/_components/player-actions";

// ── Preview solo-dev de las acciones de admin de un jugador ──
// Uso: http://localhost:3000/dev-preview/player-actions
// Sirve para ver el control de cambio de rango (chip + selector + confirmar)
// sin necesitar una sesión de admin en el navegador headless. El PATCH real
// responde 403 sin sesión, lo que valida el manejo de error (toast con el body).
// En producción no existe (404).
export default function PlayerActionsPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  // Jugadores mock con distintos rangos para ver los colores del chip.
  const mock = [
    { id: "mock-c", alias: "ShadowBurst", rank: "C" },
    { id: "mock-f", alias: "NovatoDemo", rank: "F" },
    { id: "mock-s", alias: "OmegaKing", rank: "S" },
  ];

  return (
    <div className="min-h-screen bg-omega-black text-omega-text bg-noise p-8">
      <h1 className="text-lg font-black neon-blue mb-6">PREVIEW · Acciones de jugador</h1>
      <div className="max-w-2xl space-y-3">
        {mock.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-xl bg-omega-card px-4 py-3"
          >
            <div>
              <p className="font-bold">{m.alias}</p>
              <p className="text-xs text-omega-muted">Rango {m.rank}</p>
            </div>
            <PlayerActions
              playerId={m.id}
              isHidden={false}
              isJudge={false}
              ascensoEnabled={false}
              rankLetter={m.rank}
              alias={m.alias}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
