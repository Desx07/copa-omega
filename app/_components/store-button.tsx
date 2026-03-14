"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function StoreButton() {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings/store")
      .then((r) => r.json())
      .then((d) => setVisible(d.status !== "hidden"))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !visible) return null;

  return (
    <Link
      href="/store"
      className="group flex flex-col omega-card-elevated !bg-gradient-to-br !from-omega-red/25 !to-omega-red/5 p-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
        <ShoppingBag className="size-6 text-white" />
      </div>
      <p className="font-bold text-white text-sm">Tienda</p>
      <p className="text-xs text-white/60 mt-0.5">Productos y pedidos</p>
    </Link>
  );
}
