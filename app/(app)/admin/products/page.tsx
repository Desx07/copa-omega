"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  ArrowLeft,
  Loader2,
  ImageOff,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ProductImage {
  id: string;
  image_url: string;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  images: ProductImage[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(id, image_url, sort_order)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error cargando productos");
      console.error(error);
    } else {
      const sorted = (data ?? []).map((p: Product) => ({
        ...p,
        images: (p.images ?? []).sort(
          (a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order
        ),
      }));
      setProducts(sorted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function toggleActive(product: Product) {
    setTogglingId(product.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({
        is_active: !product.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      toast.error("Error al cambiar estado");
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: !p.is_active } : p
        )
      );
      toast.success(
        product.is_active ? "Producto desactivado" : "Producto activado"
      );
    }
    setTogglingId(null);
  }

  const activeProducts = products.filter((p) => p.is_active);
  const inactiveProducts = products.filter((p) => !p.is_active);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-4"
      >
        <ArrowLeft className="size-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-omega-blue" />
          <h1 className="text-2xl font-black neon-blue">PRODUCTOS</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Nuevo producto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <Package className="size-4 text-omega-blue mx-auto mb-1" />
          <p className="text-xl font-black text-omega-blue">
            {products.length}
          </p>
          <p className="text-[11px] text-omega-muted">total</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <ToggleRight className="size-4 text-omega-green mx-auto mb-1" />
          <p className="text-xl font-black text-omega-green">
            {activeProducts.length}
          </p>
          <p className="text-[11px] text-omega-muted">activos</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <ToggleLeft className="size-4 text-omega-red mx-auto mb-1" />
          <p className="text-xl font-black text-omega-red">
            {inactiveProducts.length}
          </p>
          <p className="text-[11px] text-omega-muted">inactivos</p>
        </div>
      </div>

      {/* Products list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 text-omega-purple animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl bg-omega-card border border-omega-border p-8 text-center space-y-3">
          <Package className="size-10 text-omega-muted/20 mx-auto" />
          <p className="text-omega-muted text-sm">
            No hay productos creados todavia
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 text-sm text-omega-blue hover:underline font-medium"
          >
            <Plus className="size-4" />
            Crear primer producto
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const mainImage = product.images[0]?.image_url;
            const isToggling = togglingId === product.id;

            return (
              <div
                key={product.id}
                className={`rounded-2xl border bg-omega-card/40 backdrop-blur-sm overflow-hidden shadow-md transition-all ${
                  product.is_active
                    ? "border-omega-border/50"
                    : "border-omega-red/20 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Image */}
                  <div className="size-16 rounded-xl bg-omega-dark border border-omega-border/30 overflow-hidden shrink-0">
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <ImageOff className="size-6 text-omega-muted/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-omega-text truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-black text-omega-gold">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          product.stock > 0
                            ? "bg-omega-green/10 text-omega-green border border-omega-green/20"
                            : "bg-omega-red/10 text-omega-red border border-omega-red/20"
                        }`}
                      >
                        Stock: {product.stock}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-[11px] text-omega-muted mt-1 truncate">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleActive(product)}
                    disabled={isToggling}
                    className="shrink-0 p-2 rounded-xl hover:bg-omega-dark/50 transition-colors disabled:opacity-50"
                    title={
                      product.is_active
                        ? "Desactivar producto"
                        : "Activar producto"
                    }
                  >
                    {isToggling ? (
                      <Loader2 className="size-6 animate-spin text-omega-muted" />
                    ) : product.is_active ? (
                      <ToggleRight className="size-6 text-omega-green" />
                    ) : (
                      <ToggleLeft className="size-6 text-omega-red" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
