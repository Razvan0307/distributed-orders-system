"use client";

import { useEffect, useState, useRef } from "react";
import {
  ScrollText,
  Loader2,
  AlertCircle,
  PackageOpen,
  RefreshCw,
  Hash,
  User,
  ShoppingCart,
  CalendarClock,
  TrendingUp,
  Users,
  Package,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/config";

type Order = {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  customer_name: string;
  created_at?: string;
  total_price?: number;
};

type OrdersHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrdersHistoryDialog({
  open,
  onOpenChange,
}: OrdersHistoryDialogProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      if (!res.ok) throw new Error(`Eroare ${res.status}`);
      const data = await res.json();
      console.log("[OrdersHistory] date primite:", data);
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchOrders();
  }, [open]);

  useEffect(() => {
    if (!loading && orders.length > 0 && scrollRef.current) {
      const el = scrollRef.current;
      console.log(
        "[OrdersHistory] scrollHeight:",
        el.scrollHeight,
        "clientHeight:",
        el.clientHeight,
      );
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop = 1;
      }
    }
  }, [loading, orders]);

  const formatDate = (iso?: string): string => {
    if (!iso) return "fără dată";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "fără dată";
    return new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const totalCustomers = new Set(orders.map((o) => o.customer_name)).size;
  const totalProducts = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-background/95 backdrop-blur">
        {/* Header cu gradient */}
        <div className="shrink-0 px-6 pt-6 pb-4 bg-linear-to-r from-primary/10 via-primary/5 to-transparent border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ScrollText className="size-5 text-muted-foreground" />
              Istoric Comenzi
              <Badge variant="secondary" className="ml-2">
                {orders.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-muted-foreground">
              Toate comenzile înregistrate în sistem
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchOrders}
              disabled={loading}
              className="size-8"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>

          {/* Statistici */}
          {!loading && !error && orders.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <TrendingUp className="size-4 text-emerald-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Comenzi</div>
                  <div className="text-sm font-semibold">{orders.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <Users className="size-4 text-sky-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Clienți</div>
                  <div className="text-sm font-semibold">{totalCustomers}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <DollarSign className="size-4 text-amber-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Venituri</div>
                  <div className="text-sm font-semibold">
                    {totalRevenue.toFixed(0)} RON
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Conținut scrollabil */}
        <div
          ref={scrollRef}
          className="flex-1 px-6 pb-6"
          style={{ overflowY: "auto", maxHeight: "calc(90vh - 230px)" }}
        >
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">Se încarcă istoricul...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-destructive">
              <AlertCircle className="size-6" />
              <span className="text-sm font-medium">Eroare</span>
              <span className="text-xs">{error}</span>
              <Button variant="outline" size="sm" onClick={fetchOrders}>
                Reîncearcă
              </Button>
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <PackageOpen className="size-10" />
              <span className="text-sm font-medium">
                Nicio comandă înregistrată
              </span>
              <span className="text-xs">
                Plasați o comandă pentru a o vedea aici.
              </span>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="grid gap-3 mt-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-border bg-background/60 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-all hover:bg-muted/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                        {order.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Hash className="size-3.5 text-muted-foreground" />
                          <span className="font-semibold text-sm">
                            #{order.id}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {order.customer_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs gap-1">
                        <CalendarClock className="size-3" />
                        {formatDate(order.created_at)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm ml-13">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <PackageOpen className="size-3.5" />
                      <span>
                        {order.product_name ?? `Produs #${order.product_id}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShoppingCart className="size-3.5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">
                        {order.quantity} buc
                      </Badge>
                    </div>
                    {order.total_price != null && (
                      <div className="flex items-center gap-1.5 ml-auto text-sm font-medium">
                        <DollarSign className="size-3.5 text-muted-foreground" />
                        {order.total_price} RON
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
