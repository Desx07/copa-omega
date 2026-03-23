"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  ArrowLeft,
  Loader2,
  Package,
  Plus,
  ImageOff,
  Search,
  ArrowUpDown,
  Check,
  X,
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

type SortOption = "newest" | "price-asc" | "price-desc" | "name";

/** Formatea precio argentino: $25.000 (sin decimales para enteros) */
function formatPrice(price: number): string {
  const num = Number(price);
  if (Number.isInteger(num)) {
    return `\$${num.toLocaleString("es-AR")}`;
  }
  return `\$${num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeStatus, setStoreStatus] = useState<string>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
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

  // Filtrado y ordenamiento
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filtro por busqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Ordenamiento
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name, "es"));
        break;
      case "newest":
      default:
        // Ya viene ordenado por created_at desc desde la API
        break;
    }

    return result;
  }, [products, searchQuery, sortBy]);

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

    // Feedback visual: mostrar check por 1.5s
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);

    toast.success(`${product.name} agregado al carrito`);
  }

  const sortLabels: Record<SortOption, string> = {
    newest: "Mas recientes",
    "price-asc": "Menor precio",
    "price-desc": "Mayor precio",
    name: "Nombre A-Z",
  };

  if (storeStatus !== "open") {
    return (
      <div className="min-h-screen">
        <div className="relative bg-gradient-to-b from-omega-red/15 via-omega-surface to-omega-black rounded-b-3xl shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative px-4 pt-6 pb-8 max-w-2xl mx-auto">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-6"
            >
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
            <div className="text-center space-y-3 py-8">
              <Package className="size-16 text-omega-muted/30 mx-auto" />
              <h2 className="text-xl font-black text-omega-text">
                Tienda cerrada
              </h2>
              <p className="text-sm text-omega-muted">
                La tienda esta en mantenimiento. Volve pronto!
              </p>
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
        <div className="relative px-4 pt-6 pb-6 max-w-2xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-4"
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
                {!loading && (
                  <p className="text-xs text-omega-muted">
                    {products.length} productos disponibles
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/store/cart"
              className="relative omega-btn omega-btn-secondary px-4 py-2.5 text-sm shadow-sm hover:shadow-md"
              aria-label={`Carrito con ${totalItems} productos`}
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

      <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        {/* Barra de busqueda y ordenamiento */}
        {!loading && products.length > 0 && (
          <div className="flex gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-omega-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto..."
                className="omega-input w-full pl-9 pr-8 py-2.5 text-sm"
                aria-label="Buscar productos"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full bg-omega-muted/20 flex items-center justify-center hover:bg-omega-muted/30 transition-colors"
                  aria-label="Limpiar busqueda"
                >
                  <X className="size-3 text-omega-muted" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="omega-btn omega-btn-secondary px-3 py-2.5 text-sm shadow-sm whitespace-nowrap"
                aria-label="Ordenar productos"
                aria-expanded={showSortMenu}
              >
                <ArrowUpDown className="size-4" />
                <span className="hidden sm:inline">{sortLabels[sortBy]}</span>
              </button>

              {showSortMenu && (
                <>
                  {/* Overlay para cerrar */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 omega-card shadow-lg min-w-[180px] py-1">
                    {(Object.entries(sortLabels) as [SortOption, string][]).map(
                      ([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSortBy(key);
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                            sortBy === key
                              ? "text-omega-purple font-bold bg-omega-purple/10"
                              : "text-omega-text hover:bg-omega-surface"
                          }`}
                        >
                          {label}
                          {sortBy === key && (
                            <Check className="size-3.5 text-omega-purple" />
                          )}
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 text-omega-purple animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="omega-card shadow-sm p-8 text-center space-y-3">
            <Package className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-omega-muted text-sm">
              No hay productos disponibles todavia
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="omega-card shadow-sm p-8 text-center space-y-3">
            <Search className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-omega-muted text-sm">
              No se encontraron productos para &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-omega-purple hover:underline font-medium"
            >
              Limpiar busqueda
            </button>
          </div>
        ) : (
          <>
            {/* Contador de resultados cuando hay filtro activo */}
            {searchQuery && (
              <p className="text-xs text-omega-muted">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "resultado" : "resultados"}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map((product) => {
                const mainImage = product.images[0]?.image_url;
                const inStock = product.stock > 0;
                const justAdded = addedIds.has(product.id);

                return (
                  <div
                    key={product.id}
                    className={`group omega-card shadow-sm transition-all hover:shadow-md ${
                      !inStock ? "opacity-60" : ""
                    }`}
                  >
                    {/* Imagen grande - catalog images ya contienen nombre/precio/branding */}
                    <div className="relative aspect-square bg-omega-dark overflow-hidden">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="size-full flex flex-col items-center justify-center gap-2 p-4">
                          <ImageOff className="size-10 text-omega-muted/20" />
                          <p className="text-xs text-omega-muted/40 text-center leading-tight">
                            {product.name}
                          </p>
                        </div>
                      )}

                      {/* Badge agotado - overlay oscuro sobre toda la imagen */}
                      {!inStock && (
                        <div className="absolute inset-0 bg-omega-black/60 flex items-center justify-center">
                          <span className="omega-badge omega-badge-red text-xs font-black uppercase tracking-wider">
                            Agotado
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer compacto: solo precio + boton agregar */}
                    <div className="p-2.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-omega-gold truncate">
                        {formatPrice(product.price)}
                      </span>

                      <button
                        onClick={() => handleAdd(product)}
                        disabled={!inStock}
                        aria-label={`Agregar ${product.name} al carrito`}
                        className={`shrink-0 omega-btn text-xs font-bold transition-all ${
                          justAdded
                            ? "omega-btn-green px-3 py-2 shadow-md shadow-omega-green/30"
                            : inStock
                              ? "omega-btn-primary px-3 py-2 shadow-sm hover:shadow-md"
                              : "omega-btn-secondary px-3 py-2 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {justAdded ? (
                          <>
                            <Check className="size-3.5" />
                            Listo
                          </>
                        ) : (
                          <>
                            <Plus className="size-3.5" />
                            Agregar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
