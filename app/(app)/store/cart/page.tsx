"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  Loader2,
  ImageOff,
  Banknote,
  CreditCard,
  Upload,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "../_components/cart-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type PaymentMethod = "cash" | "transfer";

export default function CartPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items, updateQuantity, removeItem, clearCart, totalPrice } =
    useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState<string | null>(null);

  function handleProofSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imagenes");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo excede 10MB");
      return;
    }

    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  function removeProof() {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleConfirm() {
    if (items.length === 0) {
      toast.error("El carrito esta vacio");
      return;
    }

    if (paymentMethod === "transfer" && !proofFile) {
      toast.error("Subi el comprobante de transferencia");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      let paymentProofUrl: string | null = null;

      if (paymentMethod === "transfer" && proofFile) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("No estas autenticado");
          setLoading(false);
          return;
        }

        const ext = proofFile.name.split(".").pop() || "jpg";
        const fileName = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("payments")
          .upload(fileName, proofFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          toast.error(
            `Error subiendo comprobante: ${uploadError.message}`
          );
          setLoading(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("payments").getPublicUrl(fileName);

        paymentProofUrl = publicUrl;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
          payment_method: paymentMethod,
          payment_proof_url: paymentProofUrl,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al crear pedido");
        setLoading(false);
        return;
      }

      clearCart();
      setOrderCreated(data.id);
      toast.success("Pedido creado!");
    } catch {
      toast.error("Error al crear el pedido");
      setLoading(false);
    }
  }

  // Order success screen
  if (orderCreated) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="omega-card-elevated p-8 text-center space-y-4 mt-10">
          <div className="size-16 rounded-full bg-omega-green/10 border border-omega-green/30 flex items-center justify-center mx-auto">
            <CheckCircle className="size-8 text-omega-green" />
          </div>
          <h2 className="text-xl font-black text-omega-text">
            Pedido creado!
          </h2>
          <p className="text-sm text-omega-muted">
            Tu pedido <span className="font-bold text-omega-gold">#{orderCreated.slice(0, 8)}</span> fue
            registrado. Te avisaremos cuando cambie de estado.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/store"
              className="omega-btn omega-btn-primary w-full px-4 py-3 text-sm"
            >
              <ShoppingBag className="size-4" />
              Seguir comprando
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-omega-muted hover:text-omega-text transition-colors"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/store"
          className="omega-btn omega-btn-secondary size-10 !p-0"
          aria-label="Volver a la tienda"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-omega-purple" />
          <h1 className="text-2xl font-black neon-purple">CARRITO</h1>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="omega-card p-8 text-center space-y-3">
          <ShoppingCart className="size-10 text-omega-muted/20 mx-auto" />
          <p className="text-omega-muted text-sm">Tu carrito esta vacio</p>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-sm text-omega-purple hover:underline font-medium"
          >
            <ShoppingBag className="size-4" />
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Cart items */}
          <div className="omega-card">
            <div className="omega-section-header">
              {items.length} {items.length === 1 ? "producto" : "productos"}
            </div>

            <div>
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="omega-row"
                >
                  {/* Image */}
                  <div className="size-14 rounded-xl bg-omega-dark border border-omega-border/30 overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <ImageOff className="size-5 text-omega-muted/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-omega-text truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-omega-muted mt-0.5">
                      ${Number(item.price).toFixed(2)} c/u
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.quantity - 1)
                      }
                      className="omega-btn omega-btn-secondary size-8 !p-0 !rounded-lg"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-omega-text">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.quantity + 1)
                      }
                      className="omega-btn omega-btn-secondary size-8 !p-0 !rounded-lg"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  {/* Subtotal & remove */}
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-sm font-black text-omega-gold">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-omega-red/60 hover:text-omega-red transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="omega-section-header justify-between">
              <span>Total</span>
              <span className="text-xl font-black text-omega-gold">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment method */}
          <div className="omega-card p-4 space-y-3">
            <p className="text-xs font-bold text-omega-muted uppercase tracking-wider">
              Metodo de pago
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-center gap-2 omega-card p-3 transition-all cursor-pointer ${
                  paymentMethod === "cash"
                    ? "!border-omega-green/50 aura-gold"
                    : "hover:bg-omega-card-hover"
                }`}
              >
                <Banknote
                  className={`size-5 ${
                    paymentMethod === "cash"
                      ? "text-omega-green"
                      : "text-omega-muted"
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    paymentMethod === "cash"
                      ? "text-omega-green"
                      : "text-omega-text"
                  }`}
                >
                  Efectivo
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`flex items-center gap-2 omega-card p-3 transition-all cursor-pointer ${
                  paymentMethod === "transfer"
                    ? "!border-omega-blue/50 aura-silver"
                    : "hover:bg-omega-card-hover"
                }`}
              >
                <CreditCard
                  className={`size-5 ${
                    paymentMethod === "transfer"
                      ? "text-omega-blue"
                      : "text-omega-muted"
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    paymentMethod === "transfer"
                      ? "text-omega-blue"
                      : "text-omega-text"
                  }`}
                >
                  Transferencia
                </span>
              </button>
            </div>

            {/* Transfer proof upload */}
            {paymentMethod === "transfer" && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-omega-muted">
                  Subi el comprobante de la transferencia
                </p>

                {proofPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-omega-blue/30 bg-omega-dark">
                    <img
                      src={proofPreview}
                      alt="Comprobante"
                      className="w-full max-h-48 object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeProof}
                      className="absolute top-2 right-2 size-7 rounded-full bg-omega-red/90 flex items-center justify-center text-white hover:bg-omega-red transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="omega-btn omega-btn-secondary w-full px-4 py-5 border-dashed !border-2"
                  >
                    <Upload className="size-5" />
                    <span>Subir comprobante</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProofSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="omega-card p-4 space-y-2">
            <label
              htmlFor="notes"
              className="text-xs font-bold text-omega-muted uppercase tracking-wider"
            >
              Notas{" "}
              <span className="text-omega-muted/50 normal-case font-normal">
                (opcional)
              </span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones especiales, aclaraciones..."
              maxLength={500}
              rows={2}
              className="omega-input resize-none"
            />
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={
              loading ||
              items.length === 0 ||
              (paymentMethod === "transfer" && !proofFile)
            }
            className="omega-btn omega-btn-green w-full px-4 py-3.5 text-base"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="size-5" />
                Confirmar pedido -- ${totalPrice.toFixed(2)}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
