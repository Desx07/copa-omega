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

  return <ChallengesClient userId={user.id} />;
}
