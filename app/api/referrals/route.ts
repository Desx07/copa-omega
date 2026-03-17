import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Get my referral info
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const { data: player } = await supabase
      .from("players")
      .select("referral_code, referred_by")
      .eq("id", user.id)
      .single();

    // Get referral stats
    const { data: referrals } = await supabase
      .from("referrals")
      .select("id, status, referred_id, referred:players!referred_id(alias)")
      .eq("referrer_id", user.id);

    return Response.json({
      referral_code: player?.referral_code,
      referred_by: player?.referred_by,
      referrals: referrals ?? [],
      completed_count: referrals?.filter(r => r.status === "completed").length ?? 0,
    });
  } catch (err) {
    console.error("GET /api/referrals error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Apply a referral code (called during or after registration)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code || typeof referral_code !== "string") {
      return Response.json({ error: "Se requiere referral_code" }, { status: 400 });
    }

    // Check if player already has a referrer
    const { data: currentPlayer } = await supabase
      .from("players")
      .select("referred_by")
      .eq("id", user.id)
      .single();

    if (currentPlayer?.referred_by) {
      return Response.json({ error: "Ya tenes un referente" }, { status: 400 });
    }

    // Find referrer by code
    const adminSupabase = createAdminClient();
    const { data: referrer } = await adminSupabase
      .from("players")
      .select("id, alias")
      .eq("referral_code", referral_code.toLowerCase().trim())
      .single();

    if (!referrer) {
      return Response.json({ error: "Codigo no valido" }, { status: 404 });
    }

    if (referrer.id === user.id) {
      return Response.json({ error: "No podes usar tu propio codigo" }, { status: 400 });
    }

    // Set referred_by and create referral record
    await adminSupabase
      .from("players")
      .update({ referred_by: referrer.id })
      .eq("id", user.id);

    await adminSupabase
      .from("referrals")
      .insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        status: "pending",
      });

    return Response.json({
      success: true,
      referrer_alias: referrer.alias,
    });
  } catch (err) {
    console.error("POST /api/referrals error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
