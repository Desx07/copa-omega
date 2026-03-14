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

    const clone = svg.cloneNode(true) as SVGSVGElement;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("fill", "#1a1a2e");
    clone.insertBefore(rect, clone.firstChild);

    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const canvas = document.createElement("canvas");
    const scale = 3;
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
    <div className="omega-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="omega-section-header">
        <QrCode className="size-4 text-omega-purple" />
        QR de inscripcion
      </div>

      <div className="p-5 space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          <div
            ref={svgRef}
            className="rounded-xl bg-omega-dark p-4 border border-omega-border/30 shadow-sm"
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
            className="omega-btn omega-btn-primary flex-1 px-4 py-2.5 text-sm shadow-sm hover:shadow-md"
          >
            <Download className="size-4" />
            Descargar PNG
          </button>
          <button
            onClick={handleCopyLink}
            className="omega-btn omega-btn-secondary px-4 py-2.5 text-sm shadow-sm hover:shadow-md"
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
    </div>
  );
}
