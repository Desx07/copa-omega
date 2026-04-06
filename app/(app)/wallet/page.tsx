"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Coins,
  Ticket,
  ShoppingBag,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  Tag,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Voucher {
  id: string;
  type: string;
  discount_percent: number;
  cost_omega_coins: number;
  is_used: boolean;
  used_at: string | null;
  purchased_at: string;
}

interface GoldenTicket {
  id: string;
  is_used: boolean;
  used_at: string | null;
  used_on_tournament_id: string | null;
  purchased_at: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

const VOUCHER_CATALOG = [
  { type: "discount_5", discount: 5, cost: 50, label: "5% Descuento", image: "/vouchers/voucher_5.png" },
  { type: "discount_10", discount: 10, cost: 100, label: "10% Descuento", image: "/vouchers/voucher_10.png" },
  { type: "discount_15", discount: 15, cost: 200, label: "15% Descuento", image: "/vouchers/voucher_15.png" },
  { type: "discount_20", discount: 20, cost: 350, label: "20% Descuento", image: "/vouchers/voucher_20.png" },
];

const GOLDEN_TICKET_COST = 500;

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const startVal = value;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- value se excluye intencionalmente para evitar loops infinitos: el efecto anima DESDE el valor actual HACIA el target, si value estuviera en deps se re-dispararía en cada frame
  }, [target, duration]);

  return value;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [tickets, setTickets] = useState<GoldenTicket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [tab, setTab] = useState<"tienda" | "mis-items" | "historial">("tienda");

  const animatedBalance = useAnimatedCounter(balance);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBalance(data.balance);
      setVouchers(data.vouchers);
      setTickets(data.tickets);
      setTransactions(data.transactions);
    } catch {
      toast.error("Error cargando wallet");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  async function handlePurchase(itemType: string) {
    setPurchasing(itemType);
    try {
      const res = await fetch("/api/wallet/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: itemType }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error en la compra");
        return;
      }

      setBalance(data.new_balance);
      toast.success("Compra exitosa");
      await fetchWallet();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setPurchasing(null);
    }
  }

  const [usingTicket, setUsingTicket] = useState<string | null>(null);

  async function handleUseTicket(ticketId: string) {
    setUsingTicket(ticketId);
    try {
      const res = await fetch("/api/wallet/use-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Error al usar el ticket");
        return;
      }

      toast.success("Golden Ticket usado");
      await fetchWallet();
      router.push("/tournaments");
    } catch {
      toast.error("Error de conexion");
    } finally {
      setUsingTicket(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 text-omega-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-6">
      {/* ═══ HERO — Balance ═══ */}
      <div className="relative -mx-4 overflow-hidden rounded-b-[2rem] shadow-lg shadow-omega-gold/20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-omega-gold/20 via-omega-surface to-omega-purple/10" />
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-omega-gold/15 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-8 w-24 h-24 bg-omega-purple/10 rounded-full blur-[40px] pointer-events-none" />
        {/* Floating coins decoration */}
        <div className="absolute top-6 right-12 animate-float opacity-20">
          <Coins className="size-8 text-omega-gold" />
        </div>
        <div className="absolute bottom-8 right-8 animate-float-d1 opacity-15">
          <Sparkles className="size-6 text-omega-gold" />
        </div>

        <div className="relative px-6 pt-8 pb-10">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-text transition-colors inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>

          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-omega-gold/15 ring-2 ring-omega-gold/30 mx-auto">
              <Coins className="size-8 text-omega-gold" />
            </div>
            <p className="text-xs text-omega-muted uppercase tracking-widest font-bold">
              Omega Coins
            </p>
            <p className="text-5xl font-black neon-gold tabular-nums">
              {animatedBalance.toLocaleString("es-AR")}
            </p>
            <p className="text-sm text-omega-muted">
              Tu balance actual
            </p>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="px-4">
        <div className="flex bg-omega-surface rounded-xl p-1 gap-1">
          {[
            { key: "tienda" as const, label: "Tienda", icon: ShoppingBag },
            { key: "mis-items" as const, label: "Mis Items", icon: Tag },
            { key: "historial" as const, label: "Historial", icon: Clock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                tab === key
                  ? "bg-omega-gold/20 text-omega-gold border border-omega-gold/30"
                  : "text-omega-muted hover:text-omega-text"
              }`}
              data-testid={`wallet-tab-${key}`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      {tab === "tienda" && (
        <div className="px-4 space-y-4">
          {/* Voucher cards */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
              <Tag className="size-4 text-omega-purple" />
              Vouchers de Descuento
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {VOUCHER_CATALOG.map((item) => {
                const canAfford = balance >= item.cost;
                const isBuying = purchasing === item.type;

                return (
                  <div
                    key={item.type}
                    className="group omega-card overflow-hidden transition-all hover:shadow-lg"
                  >
                    {/* Voucher image */}
                    <div className="border-b border-omega-border/20">
                      <img
                        src={item.image}
                        alt={item.label}
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="px-3 py-3 space-y-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <Coins className="size-3.5 text-omega-gold" />
                        <span className="text-sm font-black text-omega-gold">
                          {item.cost}
                        </span>
                      </div>
                      <button
                        onClick={() => handlePurchase(item.type)}
                        disabled={!canAfford || !!purchasing}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                          canAfford
                            ? "omega-btn omega-btn-purple"
                            : "bg-omega-surface text-omega-muted/50 cursor-not-allowed border border-omega-border/20"
                        }`}
                        data-testid={`buy-${item.type}`}
                      >
                        {isBuying ? (
                          <Loader2 className="size-3.5 animate-spin mx-auto" />
                        ) : canAfford ? (
                          "Comprar"
                        ) : (
                          "Insuficiente"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Golden Ticket — special card */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
              <Ticket className="size-4 text-omega-gold" />
              Item Especial
            </h2>
            <div
              className="relative overflow-hidden rounded-2xl border-2 border-omega-gold/40 shadow-lg shadow-omega-gold/10"
              style={{
                background: "linear-gradient(135deg, rgba(255,214,10,0.15) 0%, rgba(255,195,0,0.05) 50%, rgba(123,47,247,0.08) 100%)",
              }}
            >
              {/* Animated gold shimmer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-omega-gold/10 rounded-full blur-[40px] animate-float" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-omega-gold/8 rounded-full blur-[30px] animate-float-d2" />
              </div>

              <div className="relative flex flex-col gap-3">
                <img
                  src="/vouchers/golden_ticket.png"
                  alt="Golden Ticket"
                  className="w-full h-auto rounded-t-xl"
                />
                <div className="px-5 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="size-3.5 text-omega-gold" />
                    <span className="text-sm font-black text-omega-gold">
                      {GOLDEN_TICKET_COST}
                    </span>
                  </div>
                <button
                  onClick={() => handlePurchase("golden_ticket")}
                  disabled={balance < GOLDEN_TICKET_COST || !!purchasing}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    balance >= GOLDEN_TICKET_COST
                      ? "omega-btn omega-btn-gold"
                      : "bg-omega-surface text-omega-muted/50 cursor-not-allowed border border-omega-border/20"
                  }`}
                  data-testid="buy-golden-ticket"
                >
                  {purchasing === "golden_ticket" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : balance >= GOLDEN_TICKET_COST ? (
                    "Comprar"
                  ) : (
                    "Insuficiente"
                  )}
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "mis-items" && (
        <div className="px-4 space-y-4">
          {/* Golden Tickets */}
          {tickets.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
                <Ticket className="size-4 text-omega-gold" />
                Golden Tickets
              </h2>
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`omega-card px-4 py-3 flex items-center gap-3 ${
                    ticket.is_used ? "opacity-50" : "border-l-4 border-l-omega-gold"
                  }`}
                >
                  <Ticket className={`size-5 ${ticket.is_used ? "text-omega-muted" : "text-omega-gold"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${ticket.is_used ? "text-omega-muted" : "text-omega-gold"}`}>
                      Golden Ticket
                    </p>
                    <p className="text-[10px] text-omega-muted">
                      {new Date(ticket.purchased_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                      {ticket.is_used && ticket.used_at && (
                        <> - Usado el {new Date(ticket.used_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</>
                      )}
                    </p>
                  </div>
                  {ticket.is_used ? (
                    <span className="omega-badge omega-badge-green text-[9px]">Usado</span>
                  ) : (
                    <button
                      onClick={() => handleUseTicket(ticket.id)}
                      disabled={usingTicket === ticket.id}
                      className="omega-btn omega-btn-gold px-3 py-1.5 text-[10px] gap-1"
                    >
                      {usingTicket === ticket.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Trophy className="size-3" />
                      )}
                      Usar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Vouchers */}
          {vouchers.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
                <Tag className="size-4 text-omega-purple" />
                Mis Vouchers
              </h2>
              {vouchers.map((v) => (
                <div
                  key={v.id}
                  className={`omega-card px-4 py-3 flex items-center gap-3 ${
                    v.is_used ? "opacity-50" : "border-l-4 border-l-omega-purple"
                  }`}
                >
                  <div className={`flex items-center justify-center size-10 rounded-lg ${
                    v.is_used ? "bg-omega-surface" : "bg-omega-purple/15"
                  }`}>
                    <span className={`text-sm font-black ${v.is_used ? "text-omega-muted" : "text-omega-purple"}`}>
                      {v.discount_percent}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${v.is_used ? "text-omega-muted" : "text-omega-text"}`}>
                      {v.discount_percent}% Descuento
                    </p>
                    <p className="text-[10px] text-omega-muted">
                      {new Date(v.purchased_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {v.is_used ? (
                    <CheckCircle2 className="size-4 text-omega-green" />
                  ) : (
                    <span className="omega-badge omega-badge-purple text-[9px]">Disponible</span>
                  )}
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="omega-card p-8 text-center space-y-3">
              <ShoppingBag className="size-10 text-omega-muted/20 mx-auto" />
              <p className="text-sm text-omega-muted">No tenes items todavia</p>
              <button
                onClick={() => setTab("tienda")}
                className="text-sm text-omega-purple hover:underline font-bold"
              >
                Ir a la tienda
              </button>
            </div>
          ) : null}
        </div>
      )}

      {tab === "historial" && (
        <div className="px-4 space-y-3">
          <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
            <Clock className="size-4" />
            Movimientos Recientes
          </h2>
          {transactions.length === 0 ? (
            <div className="omega-card p-8 text-center">
              <Clock className="size-10 text-omega-muted/20 mx-auto mb-2" />
              <p className="text-sm text-omega-muted">Sin movimientos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isEarned = tx.amount > 0;
                const isSpent = tx.amount < 0;

                return (
                  <div
                    key={tx.id}
                    className="omega-card px-4 py-3 flex items-center gap-3"
                  >
                    <div className={`flex items-center justify-center size-8 rounded-lg ${
                      isEarned ? "bg-omega-green/15" : isSpent ? "bg-omega-red/15" : "bg-omega-blue/15"
                    }`}>
                      {isEarned ? (
                        <ArrowDownCircle className="size-4 text-omega-green" />
                      ) : isSpent ? (
                        <ArrowUpCircle className="size-4 text-omega-red" />
                      ) : (
                        <XCircle className="size-4 text-omega-blue" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-omega-muted">
                        {new Date(tx.created_at).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={`text-sm font-black ${
                      isEarned ? "text-omega-green" : isSpent ? "text-omega-red" : "text-omega-muted"
                    }`}>
                      {isEarned ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
