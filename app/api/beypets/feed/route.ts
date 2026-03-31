import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el beypet del jugador
    const { data: beypet, error: fetchError } = await supabase
      .from("beypets")
      .select("*")
      .eq("player_id", user.id)
      .single();

    if (fetchError || !beypet) {
      return Response.json(
        { error: "No tenes un BeyPet" },
        { status: 404 }
      );
    }

    // Verificar si ya fue alimentado hoy
    if (beypet.last_fed) {
      const lastFed = new Date(beypet.last_fed);
      const now = new Date();
      const sameDay =
        lastFed.getUTCFullYear() === now.getUTCFullYear() &&
        lastFed.getUTCMonth() === now.getUTCMonth() &&
        lastFed.getUTCDate() === now.getUTCDate();

      if (sameDay) {
        return Response.json(
          { error: "Ya alimentaste a tu BeyPet hoy", next_feed: getNextFeedTime() },
          { status: 429 }
        );
      }
    }

    // Alimentar: +10 energia (max 100)
    const newEnergy = Math.min(100, beypet.energy + 10);

    const { data: updated, error: updateError } = await supabase
      .from("beypets")
      .update({
        energy: newEnergy,
        last_fed: new Date().toISOString(),
      })
      .eq("id", beypet.id)
      .select()
      .single();

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      beypet: updated,
      message: `${beypet.name} fue alimentado! Energia: ${newEnergy}`,
      energy_gained: newEnergy - beypet.energy,
    });
  } catch (err) {
    console.error("POST /api/beypets/feed error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function getNextFeedTime(): string {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow.toISOString();
}
