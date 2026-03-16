import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. Expire challenges
  const { data: expiredChallengesData } = await supabase
    .from("challenges")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  const expiredChallenges = expiredChallengesData?.length ?? 0;

  // 2. Deactivate expired polls
  const { data: expiredPollsData } = await supabase
    .from("polls")
    .update({ is_active: false })
    .eq("is_active", true)
    .not("expires_at", "is", null)
    .lt("expires_at", new Date().toISOString())
    .select("id");

  const expiredPolls = expiredPollsData?.length ?? 0;

  return Response.json({
    expired_challenges: expiredChallenges ?? 0,
    expired_polls: expiredPolls ?? 0,
    timestamp: new Date().toISOString(),
  });
}
