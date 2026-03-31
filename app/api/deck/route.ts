import { createClient } from "@/lib/supabase/server";
import { BLADES } from "@/lib/encyclopedia";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: deck, error } = await supabase
      .from("player_decks")
      .select("*")
      .eq("player_id", user.id)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(deck);
  } catch (err) {
    console.error("GET /api/deck error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      slot1_blade, slot1_ratchet, slot1_bit,
      slot2_blade, slot2_ratchet, slot2_bit,
      slot3_blade, slot3_ratchet, slot3_bit,
    } = body;

    // Validar que todos los campos estan presentes
    const slots = [
      { blade: slot1_blade, ratchet: slot1_ratchet, bit: slot1_bit },
      { blade: slot2_blade, ratchet: slot2_ratchet, bit: slot2_bit },
      { blade: slot3_blade, ratchet: slot3_ratchet, bit: slot3_bit },
    ];

    for (const slot of slots) {
      if (!slot.blade || !slot.ratchet || !slot.bit) {
        return Response.json(
          { error: "Cada slot necesita blade, ratchet y bit" },
          { status: 400 }
        );
      }
    }

    // Validar que los 3 blades sean diferentes
    const bladeNames = [slot1_blade, slot2_blade, slot3_blade];
    const uniqueBlades = new Set(bladeNames);
    if (uniqueBlades.size !== 3) {
      return Response.json(
        { error: "Los 3 blades deben ser diferentes" },
        { status: 400 }
      );
    }

    // Validar que los blades existan en la Xciclopedia
    const validBladeNames = BLADES.map((b) => b.name);
    for (const blade of bladeNames) {
      if (!validBladeNames.includes(blade)) {
        return Response.json(
          { error: `Blade "${blade}" no existe en la Xciclopedia` },
          { status: 400 }
        );
      }
    }

    const deckData = {
      player_id: user.id,
      slot1_blade, slot1_ratchet, slot1_bit,
      slot2_blade, slot2_ratchet, slot2_bit,
      slot3_blade, slot3_ratchet, slot3_bit,
      updated_at: new Date().toISOString(),
    };

    // Upsert: crear o actualizar
    const { data: deck, error } = await supabase
      .from("player_decks")
      .upsert(deckData, { onConflict: "player_id" })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(deck, { status: 201 });
  } catch (err) {
    console.error("POST /api/deck error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  // PATCH es equivalente a POST para deck (upsert)
  return POST(request);
}
