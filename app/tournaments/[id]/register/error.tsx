"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Register page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="omega-card p-8 max-w-sm w-full text-center space-y-4">
        <AlertTriangle className="size-12 text-omega-red mx-auto" />
        <h2 className="text-lg font-black text-omega-text">Error en registro</h2>
        <p className="text-sm text-omega-muted">
          {error.message || "Error desconocido"}
        </p>
        {error.digest && (
          <p className="text-xs text-omega-muted/50 font-mono">
            Digest: {error.digest}
          </p>
        )}
        <button onClick={reset} className="omega-btn omega-btn-purple w-full">
          <RotateCcw className="size-4" />
          Reintentar
        </button>
      </div>
    </div>
  );
}
