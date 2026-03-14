"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Loader2, ZoomIn, ZoomOut, Check, X } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCropDone: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageSrc, onCropDone, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);

    const canvas = document.createElement("canvas");
    const image = new Image();
    image.crossOrigin = "anonymous";

    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.src = imageSrc;
    });

    const size = 800; // Output 800x800 for crisp display
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      size,
      size
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onCropDone(blob);
        setProcessing(false);
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-omega-black/95 flex flex-col">
      {/* Cropper area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 bg-omega-dark">
        {/* Zoom slider */}
        <div className="flex items-center gap-3 max-w-xs mx-auto">
          <ZoomOut className="size-4 text-omega-muted shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-omega-purple"
          />
          <ZoomIn className="size-4 text-omega-muted shrink-0" />
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-omega-border text-omega-muted hover:text-omega-text transition-all"
          >
            <X className="size-4" />
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue text-white font-bold shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
