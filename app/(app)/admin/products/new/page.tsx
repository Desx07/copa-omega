"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ArrowLeft,
  Loader2,
  Plus,
  Upload,
  X,
  ImagePlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ImagePreview {
  file: File;
  previewUrl: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImagePreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} no es una imagen`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} excede 5MB`);
        continue;
      }
      newImages.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setImages((prev) => [...prev, ...newImages]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("El precio debe ser un número >= 0");
      return;
    }

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("El stock debe ser un entero >= 0");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const imageUrls: string[] = [];

      if (images.length > 0) {
        setUploadProgress("Subiendo imagenes...");

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const ext = img.file.name.split(".").pop() || "jpg";
          const fileName = `${Date.now()}-${i}.${ext}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("products")
            .upload(filePath, img.file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            toast.error(`Error subiendo imagen ${i + 1}: ${uploadError.message}`);
            setLoading(false);
            setUploadProgress("");
            return;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("products").getPublicUrl(filePath);

          imageUrls.push(publicUrl);
        }
      }

      setUploadProgress("Creando producto...");

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          price: priceNum,
          stock: stockNum,
          image_urls: imageUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al crear producto");
        setLoading(false);
        setUploadProgress("");
        return;
      }

      toast.success("Producto creado!");
      router.push("/admin/products");
    } catch {
      toast.error("Error al crear el producto");
      setLoading(false);
      setUploadProgress("");
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-blue/20 via-omega-purple/10 to-omega-dark shadow-lg shadow-omega-blue/10 mb-8">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/admin/products"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Productos
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-omega-blue/20 flex items-center justify-center">
              <Package className="size-5 text-omega-blue" />
            </div>
            <h1 className="text-2xl font-black neon-blue">NUEVO PRODUCTO</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-xs font-bold text-omega-muted uppercase tracking-wider"
            >
              Nombre del producto
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Beyblade X Dran Sword"
              maxLength={200}
              className="omega-input"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-xs font-bold text-omega-muted uppercase tracking-wider"
            >
              Descripcion{" "}
              <span className="text-omega-muted/50 normal-case font-normal">
                (opcional)
              </span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del producto, estado, incluye..."
              maxLength={1000}
              rows={3}
              className="omega-input resize-none"
            />
          </div>

          {/* Price & Stock row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="price"
                className="text-xs font-bold text-omega-muted uppercase tracking-wider"
              >
                Precio ($)
              </label>
              <input
                id="price"
                type="number"
                required
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="omega-input"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="stock"
                className="text-xs font-bold text-omega-muted uppercase tracking-wider"
              >
                Stock
              </label>
              <input
                id="stock"
                type="number"
                required
                min={0}
                step={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="omega-input"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
              Imagenes{" "}
              <span className="text-omega-muted/50 normal-case font-normal">
                (max 5MB c/u)
              </span>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-omega-border bg-omega-dark group shadow-sm"
                  >
                    <img
                      src={img.previewUrl}
                      alt={`Preview ${idx + 1}`}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 size-6 rounded-full bg-omega-red/90 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 omega-badge omega-badge-blue !text-[10px]">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="omega-btn omega-btn-secondary w-full px-4 py-6 border-dashed !border-2"
            >
              <ImagePlus className="size-5" />
              <span>Agregar imagenes</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Preview card */}
          <div className="rounded-2xl bg-gradient-to-br from-omega-card to-omega-surface border border-white/10 p-4 space-y-2 shadow-sm">
            <p className="text-xs text-omega-muted text-center">Vista previa</p>
            <div className="flex items-center gap-3">
              {images.length > 0 ? (
                <div className="size-14 rounded-xl overflow-hidden shrink-0 shadow-sm">
                  <img
                    src={images[0].previewUrl}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="size-14 rounded-xl bg-omega-dark flex items-center justify-center shrink-0">
                  <Package className="size-6 text-omega-muted/30" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-omega-text truncate">
                  {name || "Nombre del producto"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-black text-omega-gold">
                    ${price ? parseFloat(price).toFixed(2) : "0.00"}
                  </span>
                  <span className="text-[11px] text-omega-muted">
                    Stock: {stock || "0"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim() || !price}
            className="omega-btn omega-btn-blue w-full px-4 py-3 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>{uploadProgress || "Creando..."}</span>
              </>
            ) : (
              <>
                <Plus className="size-5" />
                Crear producto
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
