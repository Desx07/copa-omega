"use client";

import { useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy, Check, QrCode } from "lucide-react";
import { toast } from "sonner";

interface QrDisplayProps {
  url: string;
  tournamentName: string;
  size?: number;
}

export default function QrDisplay({
  url,
  tournamentName,
  size = 200,
}: QrDisplayProps) {
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el link");
    }
  }, [url]);

  const handleDownload = useCallback(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current.querySelector("svg");
    if (!svg) return;

    // Clone SVG and add background
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", "#1a1a2e");
    clone.insertBefore(rect, clone.firstChild);

    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Convert to PNG via canvas
    const canvas = document.createElement("canvas");
    const scale = 3; // High-res
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `qr-${tournamentName.toLowerCase().replace(/\s+/g, "-")}.png`;
        link.href = pngUrl;
        link.click();
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(svgUrl);
        toast.success("QR descargado!");
      }, "image/png");
    };
    img.src = svgUrl;
  }, [size, tournamentName]);

  return (
    <div className="rounded-2xl border border-omega-border/50 bg-omega-card/40 backdrop-blur-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-bold text-omega-text/80 uppercase tracking-wider">
        <QrCode className="size-4 text-omega-purple" />
        QR de inscripcion
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div
          ref={svgRef}
          className="rounded-xl bg-omega-dark p-4 border border-omega-border/30"
        >
          <QRCodeSVG
            value={url}
            size={size}
            bgColor="transparent"
            fgColor="#e8e8f0"
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      {/* URL preview */}
      <div className="rounded-lg bg-omega-dark/60 border border-omega-border/30 px-3 py-2">
        <p className="text-[11px] text-omega-muted truncate font-mono">{url}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="size-4" />
          Descargar PNG
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 rounded-xl border border-omega-border bg-omega-card/60 px-4 py-2.5 text-sm font-medium text-omega-muted hover:text-omega-blue hover:border-omega-blue/50 transition-all"
        >
          {copied ? (
            <Check className="size-4 text-omega-green" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
