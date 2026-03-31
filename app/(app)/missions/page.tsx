import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MissionsClient from "./_components/missions-client";

export default async function MissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <MissionsClient userId={user.id} />;
}
