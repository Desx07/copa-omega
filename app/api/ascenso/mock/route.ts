// Control del flujo REAL de ascenso en memoria (SOLO DEV). Maneja el store de
// lib/ascenso-mock para poder correr el flujo completo con 2 jugadores sin base.
// POST /api/ascenso/mock  body { action, ...args }
//   reset                              → reinicia (2 jugadores rango F, ticket 0)
//   addPoints { id, pts }              → suma puntos al ticket (ganar pelea normal)
//   createAscension                    → arma el combate de ascenso entre los 2
//   resolve { winnerId }               → resuelve el combate (sube de rango + rank-up)
// GET → devuelve el estado actual del store (debug)
import {
  mockReset, mockAddPoints, mockCreateAscension, mockResolveAscension, mockMePayload, MOCK_ME_ID,
} from "@/lib/ascenso-mock";

function guard(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function POST(request: Request) {
  if (!guard()) return Response.json({ error: "solo dev" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as {
    action?: string; id?: string; pts?: number; winnerId?: string;
  };
  switch (body.action) {
    case "reset":
      mockReset();
      break;
    case "addPoints":
      mockAddPoints(body.id ?? "p1", body.pts ?? 10);
      break;
    case "createAscension":
      mockCreateAscension();
      break;
    case "resolve":
      mockResolveAscension(body.winnerId ?? "p1");
      break;
    default:
      return Response.json({ error: "acción inválida" }, { status: 400 });
  }
  return Response.json({ ok: true, me: mockMePayload(MOCK_ME_ID) });
}

export async function GET() {
  if (!guard()) return Response.json({ error: "solo dev" }, { status: 404 });
  return Response.json(mockMePayload(MOCK_ME_ID));
}
