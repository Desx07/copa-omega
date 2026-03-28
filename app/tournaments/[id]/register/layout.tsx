import { Toaster } from "sonner";

export default function TournamentRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-omega-black text-omega-text bg-noise">
      {/* Ambient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="orb-1 absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-omega-purple/[0.15] blur-[100px]" />
        <div className="orb-2 absolute top-[50%] left-[5%] w-[400px] h-[400px] rounded-full bg-omega-blue/[0.10] blur-[90px]" />
        <div className="orb-3 absolute bottom-[10%] right-[25%] w-[350px] h-[350px] rounded-full bg-omega-gold/[0.06] blur-[100px]" />
        <div className="absolute inset-0 bg-grid opacity-60" />
      </div>

      {children}
      <Toaster position="top-center" richColors />
    </div>
  );
}
