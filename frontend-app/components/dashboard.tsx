"use client";

import { useState } from "react";
import { PackageSearch, Boxes, AlertTriangle, Plus } from "lucide-react";
import type { Product, Notification, OrderPayload } from "@/lib/types";
import { initialProducts, initialNotifications } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";
import { OrderDialog } from "@/components/order-dialog";
import { EditStockDialog } from "@/components/edit-stock-dialog";
import { AddProductDialog } from "@/components/add-product-dialog";
import { Button } from "@/components/ui/button";

type DashboardProps = {
  isAdmin: boolean;
};

export function Dashboard({ isAdmin }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const addNotification = (notification: Omit<Notification, "id">) => {
    setNotifications((prev) => [
      {
        ...notification,
        id: prev.length ? Math.max(...prev.map((n) => n.id)) + 1 : 1,
      },
      ...prev,
    ]);
    setUnreadCount((c) => c + 1);
  };

  const handleBuy = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleSubmitOrder = (payload: OrderPayload) => {
    const product = products.find((p) => p.id === payload.product_id);
    if (!product) return;

    // Simulate sending the order to the orders microservice
    console.log("[v0] Order submitted:", payload);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === payload.product_id
          ? { ...p, stock: p.stock - payload.quantity }
          : p,
      ),
    );

    addNotification({
      event: "ORDER_CREATED",
      message: `Comandă nouă de la ${payload.customer_name} pentru ${payload.quantity}x ${product.name}`,
      timestamp: new Date().toISOString(),
    });

    setDialogOpen(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate fetching new data from the API Gateway
    console.log("[v0] Refreshing data from API Gateway…");
    setTimeout(() => {
      addNotification({
        event: "SYSTEM_SYNC",
        message: "API Gateway sincronizat · catalog și inventar actualizate",
        timestamp: new Date().toISOString(),
      });
      setIsRefreshing(false);
    }, 900);
  };

  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open);
    if (open) setUnreadCount(0);
  };

  const handleEditStock = (product: Product) => {
    setEditProduct(product);
    setEditOpen(true);
  };

  const handleStockSaved = (updated: Product) => {
    console.log("[v0] Stock updated:", updated);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    addNotification({
      event: "SYSTEM_SYNC",
      message: `Stoc actualizat pentru ${updated.name} · ${updated.stock} unități`,
      timestamp: new Date().toISOString(),
    });
  };

  const handleDelete = async (product: Product) => {
    console.log("[v0] Deleting product:", product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.log("[v0] Delete failed:", res.status);
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      addNotification({
        event: "STOCK_OUT",
        message: `Produs eliminat din catalog · ${product.name}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.log("[v0] Delete error:", error);
    }
  };

  const handleProductCreated = (product: Product) => {
    console.log("[v0] Product created:", product);
    setProducts((prev) => [...prev, product]);
    addNotification({
      event: "SYSTEM_SYNC",
      message: `Produs nou adăugat în catalog · ${product.name}`,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-brand">Catalog Distribuit</p>
            <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
              Gestionează comenzile în timp real
            </h1>
            <p className="max-w-xl text-pretty text-sm text-muted-foreground">
              Plasează comenzi către serviciul de comenzi și urmărește
              evenimentele sistemului direct din clopoțelul de notificări.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={Boxes}
              label="Produse în catalog"
              value={products.length}
              tone="brand"
            />
            <StatCard
              icon={AlertTriangle}
              label="Stoc redus"
              value={lowStock}
              tone="amber"
            />
            <StatCard
              icon={PackageSearch}
              label="Stoc epuizat"
              value={outOfStock}
              tone="destructive"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onBuy={handleBuy}
              adminMode={isAdmin}
              onEditStock={handleEditStock}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </main>

      <OrderDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmitOrder}
      />

      <EditStockDialog
        product={editProduct}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleStockSaved}
      />

      <AddProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={handleProductCreated}
      />

      {isAdmin && (
        <Button
          onClick={() => setAddOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 z-40 h-14 gap-2 rounded-full bg-brand px-6 text-brand-foreground shadow-lg shadow-brand/30 hover:bg-brand/90"
        >
          <Plus className="size-5" aria-hidden="true" />
          <span className="font-semibold">Adaugă produs</span>
        </Button>
      )}
    </div>
  );
}

const toneMap = {
  brand: "bg-brand/10 text-brand",
  amber: "bg-amber-500/10 text-amber-500",
  destructive: "bg-destructive/10 text-destructive",
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Boxes;
  label: string;
  value: number;
  tone: keyof typeof toneMap;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneMap[tone]}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col">
        <span className="text-2xl font-bold leading-none tracking-tight">
          {value}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
