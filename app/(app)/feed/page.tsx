import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedClient from "./_components/feed-client";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <FeedClient userId={user.id} />;
}
