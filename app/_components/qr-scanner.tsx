"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, X, Camera } from "lucide-react";
import { toast } from "sonner";

export function QrScannerButton() {
  const [scanning, setScanning] = useState(false);

  return (
    <>
      <button
        onClick={() => setScanning(true)}
        className="group flex flex-col omega-card-elevated !bg-gradient-to-br !from-omega-blue/25 !to-omega-purple/10 p-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
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
            if (decodedText.includes("/tournaments/") && decodedText.includes("/register")) {
              html5QrCode.stop().then(() => {
                toast.success("QR escaneado!");
                try {
                  const url = new URL(decodedText);
                  router.push(url.pathname);
                } catch {
                  router.push(decodedText);
                }
                onClose();
              });
            } else {
              toast.error("QR no valido para un torneo");
            }
          },
          () => {
            // Ignore scan errors
          }
        );
      } catch (err) {
        console.error("Scanner error:", err);
        toast.error("No se pudo acceder a la camara");
        onClose();
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
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Camera className="size-5 text-omega-blue" />
          <span className="text-sm font-bold text-omega-text">Escanear QR del torneo</span>
        </div>
        <button
          onClick={onClose}
          className="omega-btn omega-btn-secondary size-10 !p-0 !rounded-xl"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="rounded-2xl overflow-hidden"
          />
          <p className="text-center text-xs text-omega-muted mt-4">
            Apunta la camara al codigo QR del torneo
          </p>
        </div>
      </div>
    </div>
  );
}
