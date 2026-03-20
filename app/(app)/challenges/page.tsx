import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChallengesClient from "./_components/challenges-client";

export default async function ChallengesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: player } = await supabase
    .from("players")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return <ChallengesClient userId={user.id} isAdmin={player?.is_admin ?? false} />;
}
