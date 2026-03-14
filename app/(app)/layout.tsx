import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatBot } from "@/app/_components/chat-bot";
import BadgeNotification from "@/app/_components/badge-notification";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-omega-black text-omega-text">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[20%] w-[500px] h-[500px] rounded-full bg-omega-purple/[0.08] blur-[120px]" />
        <div className="absolute top-[50%] left-[5%] w-[400px] h-[400px] rounded-full bg-omega-blue/[0.05] blur-[100px]" />
        <div className="absolute bottom-[10%] right-[30%] w-[350px] h-[350px] rounded-full bg-omega-gold/[0.04] blur-[110px]" />
        <div className="absolute inset-0 hero-grid opacity-30" />
      </div>

      {children}

      <BadgeNotification />
      <ChatBot />
    </div>
  );
}
