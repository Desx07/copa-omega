"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  ArrowLeft,
  Loader2,
  Package,
  Plus,
  ImageOff,
} from "lucide-react";
import { useCart } from "./_components/cart-context";
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
  images: ProductImage[];
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeEnabled, setStoreEnabled] = useState(true);
  const { addItem, totalItems } = useCart();

  const fetchProducts = useCallback(async () => {
    try {
      // Check store toggle
      const settingsRes = await fetch("/api/settings/store");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setStoreEnabled(settingsData.enabled);
        if (!settingsData.enabled) {
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(data);
    } catch {
      toast.error("Error cargando productos");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleAdd(product: Product) {
    if (product.stock <= 0) {
      toast.error("Producto agotado");
      return;
    }
    const mainImage = product.images[0]?.image_url ?? null;
    addItem({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: mainImage,
    });
    toast.success(`${product.name} agregado al carrito`);
  }

  if (!storeEnabled) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-4">
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
        <div className="rounded-2xl border border-omega-border bg-omega-card/40 p-10 text-center space-y-3 mt-4">
          <Package className="size-12 text-omega-muted/30 mx-auto" />
          <h2 className="text-xl font-black text-omega-text">Tienda cerrada</h2>
          <p className="text-sm text-omega-muted">La tienda está en mantenimiento. Volvé pronto!</p>
        </div>
      </div>
    );
  }

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
          <Package className="size-5 text-omega-purple" />
          <h1 className="text-2xl font-black neon-purple">TIENDA</h1>
        </div>
        <Link
          href="/store/cart"
          className="relative flex items-center gap-2 rounded-xl bg-omega-card border border-omega-border px-4 py-2.5 text-sm font-bold text-omega-text hover:border-omega-purple/50 hover:text-omega-purple transition-all"
        >
          <ShoppingCart className="size-4" />
          Carrito
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 size-5 rounded-full bg-omega-purple text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-omega-purple/30">
              {totalItems}
            </span>
          )}
        </Link>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 text-omega-purple animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl bg-omega-card border border-omega-border p-8 text-center space-y-3">
          <Package className="size-10 text-omega-muted/20 mx-auto" />
          <p className="text-omega-muted text-sm">
            No hay productos disponibles todavia
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const mainImage = product.images[0]?.image_url;
            const inStock = product.stock > 0;

            return (
              <div
                key={product.id}
                className="group rounded-2xl border border-omega-border/50 bg-omega-card/40 backdrop-blur-sm overflow-hidden shadow-md hover:shadow-lg hover:shadow-omega-purple/10 hover:border-omega-purple/30 transition-all hover:-translate-y-0.5"
              >
                {/* Image */}
                <div className="relative aspect-square bg-omega-dark overflow-hidden">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center">
                      <ImageOff className="size-12 text-omega-muted/20" />
                    </div>
                  )}

                  {/* Stock badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm ${
                        inStock
                          ? "bg-omega-green/20 text-omega-green border border-omega-green/30"
                          : "bg-omega-red/20 text-omega-red border border-omega-red/30"
                      }`}
                    >
                      {inStock ? "En stock" : "Agotado"}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-sm font-bold text-omega-text truncate">
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="text-[11px] text-omega-muted mt-0.5 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-omega-gold">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAdd(product)}
                      disabled={!inStock}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        inStock
                          ? "bg-gradient-to-r from-omega-purple to-omega-blue text-white shadow-lg shadow-omega-purple/20 hover:scale-[1.05] active:scale-[0.95]"
                          : "bg-omega-dark/50 text-omega-muted/50 cursor-not-allowed"
                      }`}
                    >
                      <Plus className="size-3.5" />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
