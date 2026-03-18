"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-omega-black flex items-center justify-center px-4">
      <div className="omega-card p-8 max-w-sm w-full text-center space-y-4">
        <AlertTriangle className="size-12 text-omega-red mx-auto" />
        <h2 className="text-lg font-black text-omega-text">Error inesperado</h2>
        <p className="text-sm text-omega-muted">
          Algo salio mal. Intenta de nuevo o volve al inicio.
        </p>
        <div className="flex gap-2">
          <button onClick={reset} className="omega-btn omega-btn-purple flex-1">
            <RotateCcw className="size-4" />
            Reintentar
          </button>
          <Link href="/dashboard" className="omega-btn omega-btn-secondary flex-1">
            <Home className="size-4" />
            Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
