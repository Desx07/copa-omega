import { createClient } from "@/lib/supabase/server";

// ── GET /api/ascenso/ranking ──
// Ranking público del modo ascenso: jugadores activos ordenados por rango
// (S primero, F último) y dentro de cada rango por puntos de ticket desc.

// Escalera de rangos de mejor a peor. Determina el orden del ranking sin
// depender de la semántica de la columna `sort` de ascenso_ranks.
const ORDEN_RANGOS = ["S", "A", "B", "C", "D", "E", "F"] as const;

// Posición de un rango en la escalera (rangos desconocidos van al final)
function posicionRango(letter: string | null): number {
  const idx = ORDEN_RANGOS.indexOf((letter ?? "F") as (typeof ORDEN_RANGOS)[number]);
  return idx === -1 ? ORDEN_RANGOS.length : idx;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: players, error } = await supabase
      .from("players")
      .select("id, alias, avatar_url, rank_letter, ticket_points, wins, losses")
      .eq("is_eliminated", false);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const ranking = (players ?? [])
      .map((p) => ({
        id: p.id as string,
        alias: p.alias as string,
        avatar_url: (p.avatar_url ?? null) as string | null,
        rank_letter: (p.rank_letter ?? "F") as string,
        ticket_points: (p.ticket_points ?? 0) as number,
        wins: (p.wins ?? 0) as number,
        losses: (p.losses ?? 0) as number,
      }))
      .sort((a, b) => {
        // Primero por rango (S arriba), después por puntos de ticket desc
        const porRango = posicionRango(a.rank_letter) - posicionRango(b.rank_letter);
        if (porRango !== 0) return porRango;
        return b.ticket_points - a.ticket_points;
      });

    return Response.json(ranking);
  } catch (err) {
    console.error("GET /api/ascenso/ranking error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
