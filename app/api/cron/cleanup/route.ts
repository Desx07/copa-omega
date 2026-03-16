import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const errors: string[] = [];

    // 1. Expire challenges
    const { data: expiredChallengesData, error: challengeError } = await supabase
      .from("challenges")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (challengeError) {
      console.error("[cron] Error expiring challenges:", challengeError);
      errors.push("challenges: " + challengeError.message);
    }

    // 2. Deactivate expired polls
    const { data: expiredPollsData, error: pollError } = await supabase
      .from("polls")
      .update({ is_active: false })
      .eq("is_active", true)
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (pollError) {
      console.error("[cron] Error expiring polls:", pollError);
      errors.push("polls: " + pollError.message);
    }

    return Response.json({
      expired_challenges: expiredChallengesData?.length ?? 0,
      expired_polls: expiredPollsData?.length ?? 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("POST /api/cron/cleanup error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
