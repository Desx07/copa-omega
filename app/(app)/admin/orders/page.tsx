"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronDown,
  ChevronUp,
  Banknote,
  CreditCard,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: { id: string; name: string } | null;
}

interface Order {
  id: string;
  player_id: string;
  total: number;
  payment_method: "cash" | "transfer";
  payment_proof_url: string | null;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
  player: { id: string; alias: string } | null;
  items: OrderItem[];
}

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-omega-gold/10 text-omega-gold border-omega-gold/20",
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle,
    className: "bg-omega-blue/10 text-omega-blue border-omega-blue/20",
  },
  delivered: {
    label: "Entregado",
    icon: Truck,
    className: "bg-omega-green/10 text-omega-green border-omega-green/20",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-omega-red/10 text-omega-red border-omega-red/20",
  },
} as const;

const NEXT_STATUS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["delivered", "cancelled"],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error("Error cargando pedidos");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al actualizar");
        setUpdatingId(null);
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...data } : o))
      );
      toast.success(
        `Pedido ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label?.toLowerCase() ?? newStatus}`
      );
    } catch {
      toast.error("Error al actualizar pedido");
    }
    setUpdatingId(null);
  }

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

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
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="size-5 text-omega-gold" />
        <h1 className="text-2xl font-black neon-gold">PEDIDOS</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <Clock className="size-4 text-omega-gold mx-auto mb-1" />
          <p className="text-xl font-black text-omega-gold">{pendingCount}</p>
          <p className="text-[11px] text-omega-muted">pendientes</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <CheckCircle className="size-4 text-omega-blue mx-auto mb-1" />
          <p className="text-xl font-black text-omega-blue">
            {confirmedCount}
          </p>
          <p className="text-[11px] text-omega-muted">confirmados</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <Truck className="size-4 text-omega-green mx-auto mb-1" />
          <p className="text-xl font-black text-omega-green">
            {deliveredCount}
          </p>
          <p className="text-[11px] text-omega-muted">entregados</p>
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 text-omega-purple animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-omega-card border border-omega-border p-8 text-center space-y-3">
          <ShoppingBag className="size-10 text-omega-muted/20 mx-auto" />
          <p className="text-omega-muted text-sm">No hay pedidos todavia</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const statusCfg = STATUS_CONFIG[order.status];
            const StatusIcon = statusCfg.icon;
            const nextStatuses = NEXT_STATUS[order.status] ?? [];
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-omega-border/50 bg-omega-card/40 backdrop-blur-sm overflow-hidden shadow-md"
              >
                {/* Order header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : order.id)
                  }
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-omega-card/60 transition-colors"
                >
                  {/* Status badge */}
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${statusCfg.className}`}
                  >
                    <StatusIcon className="size-4" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-omega-text">
                        #{order.id.slice(0, 8)}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-omega-muted">
                        {order.player?.alias ?? "???"}
                      </span>
                      <span className="text-omega-muted/30">|</span>
                      <span className="text-xs text-omega-muted">
                        {new Date(order.created_at).toLocaleDateString(
                          "es-AR",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Total & payment */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-omega-gold">
                      ${Number(order.total).toFixed(2)}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {order.payment_method === "cash" ? (
                        <Banknote className="size-3 text-omega-green" />
                      ) : (
                        <CreditCard className="size-3 text-omega-blue" />
                      )}
                      <span className="text-[10px] text-omega-muted">
                        {order.payment_method === "cash"
                          ? "Efectivo"
                          : "Transferencia"}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="shrink-0 text-omega-muted">
                    {isExpanded ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-omega-border/30 p-4 space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                        Items
                      </p>
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg bg-omega-dark/40 px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Package className="size-3.5 text-omega-muted shrink-0" />
                              <span className="text-sm text-omega-text truncate">
                                {item.product?.name ?? "Producto eliminado"}
                              </span>
                              <span className="text-xs text-omega-muted shrink-0">
                                x{item.quantity}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-omega-gold shrink-0 ml-2">
                              ${(
                                Number(item.unit_price) * item.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div>
                        <p className="text-xs font-bold text-omega-muted uppercase tracking-wider mb-1">
                          Notas
                        </p>
                        <p className="text-sm text-omega-text/80 italic">
                          {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Payment proof */}
                    {order.payment_proof_url && (
                      <div>
                        <p className="text-xs font-bold text-omega-muted uppercase tracking-wider mb-1">
                          Comprobante
                        </p>
                        <a
                          href={order.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-omega-blue hover:underline"
                        >
                          Ver comprobante de pago
                        </a>
                      </div>
                    )}

                    {/* Status actions */}
                    {nextStatuses.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-omega-border/20">
                        {nextStatuses.map((ns) => {
                          const nsCfg =
                            STATUS_CONFIG[ns as keyof typeof STATUS_CONFIG];
                          const NsIcon = nsCfg.icon;
                          const isCancel = ns === "cancelled";

                          return (
                            <button
                              key={ns}
                              onClick={() => updateStatus(order.id, ns)}
                              disabled={isUpdating}
                              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 ${
                                isCancel
                                  ? "bg-omega-red/10 text-omega-red border border-omega-red/30 hover:bg-omega-red/20"
                                  : "bg-gradient-to-r from-omega-blue/90 to-omega-blue text-white shadow-lg shadow-omega-blue/20"
                              }`}
                            >
                              {isUpdating ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <NsIcon className="size-4" />
                              )}
                              {nsCfg.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
