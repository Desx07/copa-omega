"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  User,
  LayoutDashboard,
  Shield,
} from "lucide-react";

interface AppNavbarProps {
  isAdmin?: boolean;
}

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/profile", label: "Perfil", icon: User },
];

export function AppNavbar({ isAdmin }: AppNavbarProps) {
  const pathname = usePathname();

  const items = isAdmin
    ? [...navItems, { href: "/admin/matches", label: "Admin", icon: Shield }]
    : navItems;

  return (
    <>
      {/* Desktop — top bar */}
      <header className="hidden md:flex sticky top-0 z-50 items-center justify-between h-14 px-6 border-b border-omega-border/30 bg-omega-black/80 backdrop-blur-xl">
        <Link href="/dashboard" className="text-sm font-black neon-gold tracking-tight">
          COPA OMEGA STAR
        </Link>
        <nav className="flex items-center gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-omega-purple/15 text-omega-purple"
                    : "text-omega-muted hover:text-omega-text hover:bg-omega-card/50"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Mobile — bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-omega-black/95 backdrop-blur-xl border-t border-omega-border/30 flex items-center justify-around h-16 safe-area-bottom">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                active ? "text-omega-purple" : "text-omega-muted"
              }`}
            >
              <item.icon className={`size-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
