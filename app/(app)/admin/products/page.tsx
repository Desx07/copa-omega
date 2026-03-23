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
  Pencil,
  Trash2,
  Check,
  X,
  PackageOpen,
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

interface EditState {
  name: string;
  price: string;
  stock: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    name: "",
    price: "",
    stock: "",
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Bulk stock
  const [bulkStock, setBulkStock] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

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

  function startEditing(product: Product) {
    setEditingId(product.id);
    setEditState({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
    });
    // Cerrar confirmacion de borrado si estaba abierta
    setConfirmDeleteId(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditState({ name: "", price: "", stock: "" });
  }

  async function saveEdit(product: Product) {
    const trimmedName = editState.name.trim();
    if (!trimmedName) {
      toast.error("El nombre no puede estar vacio");
      return;
    }

    const price = parseFloat(editState.price);
    if (isNaN(price) || price < 0) {
      toast.error("El precio debe ser un numero >= 0");
      return;
    }

    const stock = parseInt(editState.stock, 10);
    if (isNaN(stock) || stock < 0) {
      toast.error("El stock debe ser un entero >= 0");
      return;
    }

    // Solo enviar campos que cambiaron
    const updates: Record<string, unknown> = {};
    if (trimmedName !== product.name) updates.name = trimmedName;
    if (price !== product.price) updates.price = price;
    if (stock !== product.stock) updates.stock = stock;

    if (Object.keys(updates).length === 0) {
      cancelEditing();
      return;
    }

    setSavingId(product.id);

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al guardar");
        setSavingId(null);
        return;
      }

      const updated = await res.json();

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                name: updated.name,
                price: updated.price,
                stock: updated.stock,
                images: (updated.images ?? []).sort(
                  (a: ProductImage, b: ProductImage) =>
                    a.sort_order - b.sort_order
                ),
              }
            : p
        )
      );

      toast.success("Producto actualizado");
      setEditingId(null);
      setEditState({ name: "", price: "", stock: "" });
    } catch {
      toast.error("Error de conexion");
    }

    setSavingId(null);
  }

  async function deleteProduct(productId: string) {
    setDeletingId(productId);

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar");
        setDeletingId(null);
        setConfirmDeleteId(null);
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Producto eliminado");
      setConfirmDeleteId(null);
    } catch {
      toast.error("Error de conexion");
    }

    setDeletingId(null);
  }

  async function bulkUpdateStock() {
    const stockVal = parseInt(bulkStock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      toast.error("El stock debe ser un entero >= 0");
      return;
    }

    setBulkLoading(true);

    try {
      const res = await fetch("/api/admin/products/bulk-stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: stockVal }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al actualizar stock");
        setBulkLoading(false);
        setShowBulkConfirm(false);
        return;
      }

      // Actualizar localmente todos los productos activos
      setProducts((prev) =>
        prev.map((p) => (p.is_active ? { ...p, stock: stockVal } : p))
      );

      toast.success(
        `Stock actualizado a ${stockVal} en todos los productos activos`
      );
      setBulkStock("");
      setShowBulkConfirm(false);
    } catch {
      toast.error("Error de conexion");
    }

    setBulkLoading(false);
  }

  const activeProducts = products.filter((p) => p.is_active);
  const inactiveProducts = products.filter((p) => !p.is_active);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-blue/20 via-omega-purple/10 to-omega-dark shadow-lg shadow-omega-blue/10 mb-6">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-omega-blue/20 flex items-center justify-center">
                <Package className="size-5 text-omega-blue" />
              </div>
              <h1 className="text-2xl font-black neon-blue">PRODUCTOS</h1>
            </div>
            <Link
              href="/admin/products/new"
              className="omega-btn omega-btn-primary px-4 py-2.5 text-sm"
            >
              <Plus className="size-4" />
              Nuevo producto
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-omega-blue/15 to-omega-blue/5 p-4 text-center shadow-sm border border-omega-blue/20">
            <Package className="size-4 text-omega-blue mx-auto mb-1" />
            <p className="text-xl font-black text-omega-blue">
              {products.length}
            </p>
            <p className="text-[11px] text-omega-muted">total</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-omega-green/15 to-omega-green/5 p-4 text-center shadow-sm border border-omega-green/20">
            <ToggleRight className="size-4 text-omega-green mx-auto mb-1" />
            <p className="text-xl font-black text-omega-green">
              {activeProducts.length}
            </p>
            <p className="text-[11px] text-omega-muted">activos</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-omega-red/15 to-omega-red/5 p-4 text-center shadow-sm border border-omega-red/20">
            <ToggleLeft className="size-4 text-omega-red mx-auto mb-1" />
            <p className="text-xl font-black text-omega-red">
              {inactiveProducts.length}
            </p>
            <p className="text-[11px] text-omega-muted">inactivos</p>
          </div>
        </div>

        {/* Bulk stock update */}
        <div className="rounded-2xl bg-gradient-to-br from-omega-card to-omega-surface border border-omega-border/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <PackageOpen className="size-4 text-omega-purple" />
            <span className="text-xs font-bold uppercase tracking-wider text-omega-text">
              Stock masivo
            </span>
            <span className="omega-badge omega-badge-purple">
              {activeProducts.length} activos
            </span>
          </div>
          <p className="text-[11px] text-omega-muted">
            Actualizar el stock de todos los productos activos a un mismo valor.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              placeholder="Cantidad de stock..."
              className="omega-input py-2 text-sm flex-1"
            />
            {!showBulkConfirm ? (
              <button
                onClick={() => {
                  if (!bulkStock || parseInt(bulkStock, 10) < 0) {
                    toast.error("Ingresa un valor de stock valido");
                    return;
                  }
                  setShowBulkConfirm(true);
                }}
                disabled={!bulkStock}
                className="omega-btn omega-btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                Aplicar
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={bulkUpdateStock}
                  disabled={bulkLoading}
                  className="omega-btn omega-btn-primary px-3 py-2 text-xs disabled:opacity-50"
                >
                  {bulkLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Confirmar"
                  )}
                </button>
                <button
                  onClick={() => setShowBulkConfirm(false)}
                  disabled={bulkLoading}
                  className="omega-btn omega-btn-secondary px-3 py-2 text-xs"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-omega-blue" />
            <span className="text-xs font-bold uppercase tracking-wider text-omega-text">
              Catalogo
            </span>
            <span className="omega-badge omega-badge-blue">
              {products.length}
            </span>
          </div>
          <Link
            href="/admin/products/new"
            className="text-xs text-omega-blue hover:text-omega-purple transition-colors font-medium"
          >
            + Nuevo
          </Link>
        </div>

        {/* Products list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 text-omega-purple animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="omega-card p-8 text-center space-y-3">
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
          <div className="space-y-2">
            {products.map((product) => {
              const mainImage = product.images[0]?.image_url;
              const isToggling = togglingId === product.id;
              const isEditing = editingId === product.id;
              const isSaving = savingId === product.id;
              const isDeleting = deletingId === product.id;
              const isConfirmingDelete = confirmDeleteId === product.id;

              return (
                <div
                  key={product.id}
                  className={`rounded-xl border-l-4 ${
                    product.is_active
                      ? "border-l-omega-green"
                      : "border-l-omega-red"
                  } bg-omega-card px-4 py-3 shadow-sm transition-all ${
                    !product.is_active ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
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

                    {/* Info / Edit mode */}
                    {isEditing ? (
                      <div className="flex-1 min-w-0 space-y-2">
                        <input
                          type="text"
                          value={editState.name}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              name: e.target.value,
                            }))
                          }
                          className="omega-input py-1.5 text-sm w-full"
                          placeholder="Nombre del producto"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-omega-muted">
                              $
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={editState.price}
                              onChange={(e) =>
                                setEditState((s) => ({
                                  ...s,
                                  price: e.target.value,
                                }))
                              }
                              className="omega-input py-1.5 text-sm pl-6 w-full"
                              placeholder="Precio"
                            />
                          </div>
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-omega-muted">
                              Stock
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={editState.stock}
                              onChange={(e) =>
                                setEditState((s) => ({
                                  ...s,
                                  stock: e.target.value,
                                }))
                              }
                              className="omega-input py-1.5 text-sm pl-12 w-full"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-omega-text truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-black text-omega-gold">
                            ${Number(product.price).toFixed(2)}
                          </span>
                          <span
                            className={
                              product.stock > 0
                                ? "omega-badge omega-badge-green"
                                : "omega-badge omega-badge-red"
                            }
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
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(product)}
                            disabled={isSaving}
                            className="omega-btn omega-btn-primary size-9 !rounded-lg !p-0 disabled:opacity-50"
                            title="Guardar cambios"
                          >
                            {isSaving ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isSaving}
                            className="omega-btn omega-btn-secondary size-9 !rounded-lg !p-0"
                            title="Cancelar edicion"
                          >
                            <X className="size-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(product)}
                            className="omega-btn omega-btn-secondary size-9 !rounded-lg !p-0"
                            title="Editar producto"
                          >
                            <Pencil className="size-3.5 text-omega-blue" />
                          </button>
                          <button
                            onClick={() => toggleActive(product)}
                            disabled={isToggling}
                            className="omega-btn omega-btn-secondary size-9 !rounded-lg !p-0 disabled:opacity-50"
                            title={
                              product.is_active
                                ? "Desactivar producto"
                                : "Activar producto"
                            }
                          >
                            {isToggling ? (
                              <Loader2 className="size-4 animate-spin text-omega-muted" />
                            ) : product.is_active ? (
                              <ToggleRight className="size-4 text-omega-green" />
                            ) : (
                              <ToggleLeft className="size-4 text-omega-red" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDeleteId(
                                isConfirmingDelete ? null : product.id
                              )
                            }
                            className="omega-btn omega-btn-secondary size-9 !rounded-lg !p-0"
                            title="Eliminar producto"
                          >
                            <Trash2 className="size-3.5 text-omega-red" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete confirmation row */}
                  {isConfirmingDelete && (
                    <div className="mt-3 pt-3 border-t border-omega-border/20 flex items-center justify-between">
                      <p className="text-xs text-omega-red font-medium">
                        Eliminar &quot;{product.name}&quot;?
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={isDeleting}
                          className="omega-btn px-3 py-1.5 text-xs bg-omega-red/20 text-omega-red border border-omega-red/30 hover:bg-omega-red/30 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Si, eliminar"
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                          className="omega-btn omega-btn-secondary px-3 py-1.5 text-xs"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
