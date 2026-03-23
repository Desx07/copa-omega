"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// --- Tipos ---

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

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
}

interface ProductAnalytics {
  productId: string;
  name: string;
  price: number;
  cost: number;
  profitPerUnit: number;
  quantitySold: number;
  totalRevenue: number;
  totalProfit: number;
}

// --- Constantes ---

const COST_BASIS = 16000;

const STATUS_CONFIG = {
  pending: { label: "Pendiente", icon: Clock, badgeClass: "omega-badge omega-badge-gold" },
  confirmed: { label: "Confirmado", icon: CheckCircle, badgeClass: "omega-badge omega-badge-blue" },
  delivered: { label: "Entregado", icon: Truck, badgeClass: "omega-badge omega-badge-green" },
  cancelled: { label: "Cancelado", icon: XCircle, badgeClass: "omega-badge omega-badge-red" },
} as const;

type StatusFilter = "all" | "pending" | "confirmed" | "delivered" | "cancelled";

// --- Helpers ---

function formatARS(value: number): string {
  return "$" + Math.round(value).toLocaleString("es-AR");
}

// --- Componente principal ---

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Verificar acceso admin (no jueces)
  const checkAdmin = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const { data: player } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    setIsAdmin(player?.is_admin === true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
      ]);

      if (!ordersRes.ok) throw new Error("Error cargando pedidos");
      if (!productsRes.ok) throw new Error("Error cargando productos");

      const [ordersData, productsData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
      ]);

      setOrders(ordersData);
      setProducts(productsData);
    } catch {
      toast.error("Error cargando datos de analytics");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, [checkAdmin, fetchData]);

  // Ordenes completadas (confirmed + delivered) para calculos de ventas
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "confirmed" || o.status === "delivered"),
    [orders]
  );

  // Metricas de resumen
  const summary = useMemo(() => {
    const totalSales = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalItemsSold = completedOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const totalCost = totalItemsSold * COST_BASIS;
    const netProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { totalSales, totalRevenue, totalItemsSold, totalCost, netProfit, avgMargin };
  }, [completedOrders]);

  // Desglose por producto
  const productBreakdown = useMemo(() => {
    const map = new Map<string, ProductAnalytics>();

    for (const order of completedOrders) {
      for (const item of order.items) {
        const key = item.product_id;
        const existing = map.get(key);
        const unitPrice = Number(item.unit_price);
        const qty = item.quantity;

        if (existing) {
          existing.quantitySold += qty;
          existing.totalRevenue += unitPrice * qty;
          existing.totalProfit += (unitPrice - COST_BASIS) * qty;
        } else {
          map.set(key, {
            productId: key,
            name: item.product?.name ?? "Producto eliminado",
            price: unitPrice,
            cost: COST_BASIS,
            profitPerUnit: unitPrice - COST_BASIS,
            quantitySold: qty,
            totalRevenue: unitPrice * qty,
            totalProfit: (unitPrice - COST_BASIS) * qty,
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [completedOrders]);

  // Top 10 mas vendidos (por cantidad)
  const topSold = useMemo(
    () => [...productBreakdown].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10),
    [productBreakdown]
  );

  // Top 10 por revenue
  const topRevenue = useMemo(
    () => [...productBreakdown].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10),
    [productBreakdown]
  );

  // Ordenes filtradas para historial
  const filteredOrders = useMemo(
    () => statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  );

  const displayedOrders = showAllHistory ? filteredOrders : filteredOrders.slice(0, 20);

  // Max values para barras
  const maxQuantity = topSold.length > 0 ? topSold[0].quantitySold : 1;
  const maxRevenue = topRevenue.length > 0 ? topRevenue[0].totalRevenue : 1;

  // --- Render ---

  if (isAdmin === false) {
    return (
      <div className="max-w-2xl mx-auto pb-8">
        <div className="px-4 pt-20 text-center space-y-4">
          <TrendingUp className="size-12 text-omega-muted/30 mx-auto" />
          <p className="text-omega-muted text-sm">Solo administradores pueden ver analytics.</p>
          <Link href="/dashboard" className="text-sm text-omega-purple hover:underline">
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-gold/20 via-omega-purple/10 to-omega-dark shadow-lg shadow-omega-gold/10 mb-6">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-omega-gold/20 flex items-center justify-center">
              <TrendingUp className="size-5 text-omega-gold" />
            </div>
            <h1 className="text-2xl font-black neon-gold">ANALYTICS DE VENTAS</h1>
          </div>
{/* Costo base removido - se calcula internamente */}
        </div>
      </div>

      {loading || isAdmin === null ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 text-omega-purple animate-spin" />
        </div>
      ) : (
        <div className="px-4 space-y-8">

          {/* ====== SUMMARY CARDS ====== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total ventas */}
            <div className="rounded-2xl bg-gradient-to-br from-omega-blue/15 to-omega-blue/5 p-4 text-center shadow-sm border border-omega-blue/20">
              <ShoppingCart className="size-4 text-omega-blue mx-auto mb-1" />
              <p className="text-2xl font-black text-omega-blue">{summary.totalSales}</p>
              <p className="text-[11px] text-omega-muted">ventas</p>
            </div>

            {/* Ingresos totales */}
            <div className="rounded-2xl bg-gradient-to-br from-omega-gold/15 to-omega-gold/5 p-4 text-center shadow-sm border border-omega-gold/20">
              <DollarSign className="size-4 text-omega-gold mx-auto mb-1" />
              <p className="text-lg font-black text-omega-gold leading-tight">{formatARS(summary.totalRevenue)}</p>
              <p className="text-[11px] text-omega-muted">ingresos</p>
            </div>

            {/* Costo total */}
            <div className="rounded-2xl bg-gradient-to-br from-omega-red/15 to-omega-red/5 p-4 text-center shadow-sm border border-omega-red/20">
              <Package className="size-4 text-omega-red mx-auto mb-1" />
              <p className="text-lg font-black text-omega-red leading-tight">{formatARS(summary.totalCost)}</p>
              <p className="text-[11px] text-omega-muted">costo ({summary.totalItemsSold} unidades)</p>
            </div>

            {/* Ganancia neta */}
            <div className={`rounded-2xl bg-gradient-to-br p-4 text-center shadow-sm border ${
              summary.netProfit >= 0
                ? "from-omega-green/15 to-omega-green/5 border-omega-green/20"
                : "from-omega-red/15 to-omega-red/5 border-omega-red/20"
            }`}>
              <TrendingUp className={`size-4 mx-auto mb-1 ${
                summary.netProfit >= 0 ? "text-omega-green" : "text-omega-red"
              }`} />
              <p className={`text-lg font-black leading-tight ${
                summary.netProfit >= 0 ? "text-omega-green" : "text-omega-red"
              }`}>
                {formatARS(summary.netProfit)}
              </p>
              <p className="text-[11px] text-omega-muted">ganancia neta</p>
            </div>

            {/* Margen promedio */}
            <div className={`rounded-2xl bg-gradient-to-br p-4 text-center shadow-sm border ${
              summary.avgMargin >= 0
                ? "from-omega-green/15 to-omega-green/5 border-omega-green/20"
                : "from-omega-red/15 to-omega-red/5 border-omega-red/20"
            }`}>
              <BarChart3 className={`size-4 mx-auto mb-1 ${
                summary.avgMargin >= 0 ? "text-omega-green" : "text-omega-red"
              }`} />
              <p className={`text-2xl font-black ${
                summary.avgMargin >= 0 ? "text-omega-green" : "text-omega-red"
              }`}>
                {summary.avgMargin.toFixed(1)}%
              </p>
              <p className="text-[11px] text-omega-muted">margen</p>
            </div>
          </div>

          {/* ====== PRODUCT BREAKDOWN TABLE ====== */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Package className="size-4 text-omega-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-omega-text">
                Desglose por producto
              </span>
              <span className="omega-badge omega-badge-gold">{productBreakdown.length}</span>
            </div>

            {productBreakdown.length === 0 ? (
              <div className="omega-card p-8 text-center">
                <Package className="size-8 text-omega-muted/20 mx-auto mb-2" />
                <p className="text-omega-muted text-sm">No hay ventas completadas todavia</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-omega-border/30">
                      <th className="text-left py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Producto</th>
                      <th className="text-right py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Precio</th>
                      <th className="text-right py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Costo</th>
                      <th className="text-right py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Ganancia/ud</th>
                      <th className="text-right py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Vendidos</th>
                      <th className="text-right py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Ganancia total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productBreakdown.map((p) => (
                      <tr key={p.productId} className="border-b border-omega-border/10 hover:bg-omega-surface/30 transition-colors">
                        <td className="py-2.5 px-2 text-omega-text font-medium truncate max-w-[200px]">{p.name}</td>
                        <td className="py-2.5 px-2 text-right text-omega-gold font-bold">{formatARS(p.price)}</td>
                        <td className="py-2.5 px-2 text-right text-omega-muted">{formatARS(p.cost)}</td>
                        <td className={`py-2.5 px-2 text-right font-bold ${p.profitPerUnit >= 0 ? "text-omega-green" : "text-omega-red"}`}>
                          {formatARS(p.profitPerUnit)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-omega-text font-bold">{p.quantitySold}</td>
                        <td className={`py-2.5 px-2 text-right font-black ${p.totalProfit >= 0 ? "text-omega-green" : "text-omega-red"}`}>
                          {formatARS(p.totalProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-omega-border/40">
                      <td className="py-3 px-2 text-omega-text font-black">TOTAL</td>
                      <td className="py-3 px-2" />
                      <td className="py-3 px-2 text-right text-omega-muted font-bold">{formatARS(summary.totalCost)}</td>
                      <td className="py-3 px-2" />
                      <td className="py-3 px-2 text-right text-omega-text font-black">{summary.totalItemsSold}</td>
                      <td className={`py-3 px-2 text-right font-black ${summary.netProfit >= 0 ? "text-omega-green" : "text-omega-red"}`}>
                        {formatARS(summary.netProfit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {/* ====== BAR CHARTS ====== */}
          {productBreakdown.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 10 mas vendidos */}
              <section className="omega-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-omega-purple" />
                  <span className="text-xs font-bold uppercase tracking-wider text-omega-text">
                    Top {topSold.length} mas vendidos
                  </span>
                </div>
                <div className="space-y-2.5">
                  {topSold.map((p) => (
                    <div key={p.productId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-omega-text truncate max-w-[70%] font-medium">{p.name}</span>
                        <span className="text-omega-purple font-bold shrink-0 ml-2">{p.quantitySold} uds</span>
                      </div>
                      <div className="h-3 bg-omega-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-omega-purple to-omega-purple-glow rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, (p.quantitySold / maxQuantity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Top 10 por revenue */}
              <section className="omega-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-omega-gold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-omega-text">
                    Top {topRevenue.length} por ingresos
                  </span>
                </div>
                <div className="space-y-2.5">
                  {topRevenue.map((p) => (
                    <div key={p.productId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-omega-text truncate max-w-[70%] font-medium">{p.name}</span>
                        <span className="text-omega-gold font-bold shrink-0 ml-2">{formatARS(p.totalRevenue)}</span>
                      </div>
                      <div className="h-3 bg-omega-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-omega-gold to-omega-gold-glow rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, (p.totalRevenue / maxRevenue) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ====== ORDER HISTORY ====== */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-4 text-omega-blue" />
                <span className="text-xs font-bold uppercase tracking-wider text-omega-text">
                  Historial de pedidos
                </span>
                <span className="omega-badge omega-badge-blue">{filteredOrders.length}</span>
              </div>

              {/* Filtro de estado */}
              <div className="flex items-center gap-1.5">
                <Filter className="size-3.5 text-omega-muted" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setShowAllHistory(false);
                  }}
                  className="bg-omega-dark border border-omega-border/30 rounded-lg px-2.5 py-1.5 text-xs text-omega-text focus:outline-none focus:border-omega-purple/50"
                >
                  <option value="all">Todos ({orders.length})</option>
                  <option value="pending">Pendientes ({orders.filter((o) => o.status === "pending").length})</option>
                  <option value="confirmed">Confirmados ({orders.filter((o) => o.status === "confirmed").length})</option>
                  <option value="delivered">Entregados ({orders.filter((o) => o.status === "delivered").length})</option>
                  <option value="cancelled">Cancelados ({orders.filter((o) => o.status === "cancelled").length})</option>
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="omega-card p-8 text-center">
                <ShoppingCart className="size-8 text-omega-muted/20 mx-auto mb-2" />
                <p className="text-omega-muted text-sm">
                  {statusFilter === "all" ? "No hay pedidos todavia" : "No hay pedidos con este estado"}
                </p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-omega-border/30">
                        <th className="text-left py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Fecha</th>
                        <th className="text-left py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Comprador</th>
                        <th className="text-left py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Items</th>
                        <th className="text-right py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Total</th>
                        <th className="text-center py-2 px-2 text-[11px] font-bold text-omega-muted uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedOrders.map((order) => {
                        const statusCfg = STATUS_CONFIG[order.status];
                        return (
                          <tr key={order.id} className="border-b border-omega-border/10 hover:bg-omega-surface/30 transition-colors">
                            <td className="py-2.5 px-2 text-omega-muted text-xs whitespace-nowrap">
                              {new Date(order.created_at).toLocaleDateString("es-AR", {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              })}
                            </td>
                            <td className="py-2.5 px-2 text-omega-text font-medium truncate max-w-[120px]">
                              {order.player?.alias ?? "???"}
                            </td>
                            <td className="py-2.5 px-2 text-omega-muted text-xs truncate max-w-[200px]">
                              {order.items.map((i) =>
                                `${i.product?.name ?? "?"} x${i.quantity}`
                              ).join(", ")}
                            </td>
                            <td className="py-2.5 px-2 text-right text-omega-gold font-bold whitespace-nowrap">
                              {formatARS(Number(order.total))}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={statusCfg.badgeClass}>{statusCfg.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Ver mas / menos */}
                {filteredOrders.length > 20 && (
                  <button
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs text-omega-muted hover:text-omega-purple transition-colors py-2"
                  >
                    {showAllHistory ? (
                      <>
                        <ChevronUp className="size-3.5" />
                        Mostrar menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3.5" />
                        Ver todos ({filteredOrders.length - 20} mas)
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
