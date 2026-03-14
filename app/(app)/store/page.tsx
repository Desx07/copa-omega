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
  const [storeStatus, setStoreStatus] = useState<string>("open");
  const { addItem, totalItems } = useCart();

  const fetchProducts = useCallback(async () => {
    try {
      const settingsRes = await fetch("/api/settings/store");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setStoreStatus(settingsData.status || "open");
        if (settingsData.status !== "open") {
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

  if (storeStatus !== "open") {
    return (
      <div className="min-h-screen">
        <div className="relative bg-gradient-to-b from-omega-red/15 via-omega-surface to-omega-black rounded-b-3xl shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative px-4 pt-6 pb-8 max-w-2xl mx-auto">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-6">
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
            <div className="text-center space-y-3 py-8">
              <Package className="size-16 text-omega-muted/30 mx-auto" />
              <h2 className="text-xl font-black text-omega-text">Tienda cerrada</h2>
              <p className="text-sm text-omega-muted">La tienda está en mantenimiento. Volvé pronto!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <div className="relative bg-gradient-to-b from-omega-purple/20 via-omega-surface to-omega-black rounded-b-3xl shadow-lg shadow-omega-purple/5 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative px-4 pt-6 pb-8 max-w-2xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-omega-purple/15 ring-2 ring-omega-purple/30">
                <Package className="size-6 text-omega-purple" />
              </div>
              <div>
                <h1 className="text-2xl font-black neon-purple">TIENDA</h1>
                <p className="text-xs text-omega-muted">Productos disponibles</p>
              </div>
            </div>
            <Link
              href="/store/cart"
              className="relative omega-btn omega-btn-secondary px-4 py-2.5 text-sm shadow-sm hover:shadow-md"
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
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Products grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 text-omega-purple animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="omega-card shadow-sm p-8 text-center space-y-3">
            <Package className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-omega-muted text-sm">
              No hay productos disponibles todavía
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
                  className="group omega-card shadow-sm transition-all hover:shadow-md hover:scale-[1.01]"
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
                        className={
                          inStock
                            ? "omega-badge omega-badge-green"
                            : "omega-badge omega-badge-red"
                        }
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
                        className={
                          inStock
                            ? "omega-btn omega-btn-primary px-3 py-2 text-xs shadow-sm hover:shadow-md"
                            : "omega-btn omega-btn-secondary px-3 py-2 text-xs opacity-50 cursor-not-allowed"
                        }
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
    </div>
  );
}
