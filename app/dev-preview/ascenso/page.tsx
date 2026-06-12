import { notFound } from "next/navigation";
import AscensoPage from "@/app/(app)/ascenso/page";

// ── Preview solo-dev de /ascenso sin sesión ──
// Uso: http://localhost:3000/dev-preview/ascenso?demo=1|2|3
//   1: progreso medio · 2: ticket lleno esperando combate · 3: combate de ascenso creado
// En producción no existe (404). La página real sigue siendo /ascenso (con sesión).
export default function AscensoPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-omega-black text-omega-text bg-noise">
      <AscensoPage />
    </div>
  );
}
