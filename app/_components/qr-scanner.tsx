"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, X, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function QrScannerButton() {
  const [scanning, setScanning] = useState(false);

  return (
    <>
      <button
        onClick={() => setScanning(true)}
        className="group flex flex-col omega-card-elevated !bg-gradient-to-br !from-omega-blue/25 !to-omega-purple/10 p-5 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors shadow-sm">
          <ScanLine className="size-6 text-white" />
        </div>
        <p className="font-bold text-white text-sm">Escanear QR</p>
        <p className="text-xs text-white/60 mt-0.5">Inscribirme a torneo</p>
      </button>

      {scanning && <QrScannerModal onClose={() => setScanning(false)} />}
    </>
  );
}

function QrScannerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;
        scanner = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Prevent double processing
            if (processedRef.current) return;
            processedRef.current = true;

            // Accept any URL that points to a tournament registration
            if (decodedText.includes("/tournaments/") && decodedText.includes("/register")) {
              html5QrCode.stop().then(() => {
                toast.success("QR escaneado! Redirigiendo...");
                try {
                  const url = new URL(decodedText);
                  router.push(url.pathname);
                } catch {
                  router.push(decodedText);
                }
                onClose();
              }).catch(() => {
                onClose();
              });
            } else {
              // Not a tournament QR — let user try again
              processedRef.current = false;
              toast.error("Ese QR no es de un torneo. Probá con otro.");
            }
          },
          () => {
            // Per-frame scan miss — normal, not an error
          }
        );

        setStatus("scanning");
      } catch (err) {
        console.error("Scanner error:", err);
        const msg = err instanceof Error ? err.message : String(err);

        if (msg.includes("NotAllowed") || msg.includes("Permission")) {
          setErrorMsg("Necesitás dar permiso de cámara para escanear el QR.");
        } else if (msg.includes("NotFound") || msg.includes("no camera")) {
          setErrorMsg("No se encontró una cámara en este dispositivo.");
        } else {
          setErrorMsg("No se pudo abrir la cámara. Intentá de nuevo.");
        }
        setStatus("error");
      }
    }

    startScanner();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {}).then(() => scanner?.clear());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-omega-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-omega-border/20">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-omega-blue/20 ring-2 ring-omega-blue/30 shadow-sm">
            <Camera className="size-4 text-omega-blue" />
          </div>
          <span className="text-sm font-bold text-omega-text">Escanear QR del torneo</span>
        </div>
        <button
          onClick={onClose}
          className="omega-btn omega-btn-secondary size-10 !p-0 !rounded-xl shadow-sm hover:shadow-md"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="size-8 animate-spin text-omega-blue" />
              <p className="text-sm text-omega-muted">Abriendo cámara...</p>
            </div>
          )}

          <div
            id="qr-reader"
            ref={scannerRef}
            className={`rounded-2xl overflow-hidden shadow-lg ${status === "error" ? "hidden" : ""}`}
          />

          {status === "scanning" && (
            <div className="text-center space-y-1">
              <p className="text-sm text-omega-text font-bold">
                Apuntá la cámara al código QR
              </p>
              <p className="text-xs text-omega-muted">
                El QR lo genera el admin del torneo
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="omega-card p-6 text-center space-y-4">
              <Camera className="size-10 text-omega-red/40 mx-auto" />
              <p className="text-sm text-omega-red font-bold">{errorMsg}</p>
              <button
                onClick={onClose}
                className="omega-btn omega-btn-secondary text-sm"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
