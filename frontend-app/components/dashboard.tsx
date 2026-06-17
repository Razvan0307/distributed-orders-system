"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PackageSearch,
  Boxes,
  AlertTriangle,
  Plus,
  ClipboardList,
} from "lucide-react";
import type { Product, OrderPayload } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { OrderDialog } from "@/components/order-dialog";
import { EditStockDialog } from "@/components/edit-stock-dialog";
import { AddProductDialog } from "@/components/add-product-dialog";
import { OrdersHistoryDialog } from "@/components/orders-history-dialog"; // <-- NOU
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/config";
import { useNotifications } from "@/components/ui/notifications-context";

type DashboardProps = {
  isAdmin: boolean;
};

export function Dashboard({ isAdmin }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Istoric comenzi – stocăm doar dacă e deschis dialogul
  const [ordersOpen, setOrdersOpen] = useState(false);

  const { refreshNotifications } = useNotifications();

  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const fetchProducts = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    if (!res.ok) throw new Error(`Eroare ${res.status}`);
    const data = await res.json();
    setProducts(data);
  }, []);

  // La încărcare, luăm produsele + notificările
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchProducts(), refreshNotifications()]);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchProducts, refreshNotifications]);

  const handleBuy = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleSubmitOrder = async (payload: OrderPayload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Eroare ${res.status}`);
      }
      await Promise.all([fetchProducts(), refreshNotifications()]);
      setDialogOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchProducts(), refreshNotifications()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditStock = (product: Product) => {
    setEditProduct(product);
    setEditOpen(true);
  };

  const handleStockSaved = async (updated: Product) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updated.name,
          price: updated.price,
          stock: updated.stock,
        }),
      });
      if (!res.ok) throw new Error(`Eroare ${res.status}`);
      await Promise.all([fetchProducts(), refreshNotifications()]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Ștergi ${product.name}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Eroare ${res.status}`);
      await Promise.all([fetchProducts(), refreshNotifications()]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleProductCreated = async (product: Product) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error(`Eroare ${res.status}`);
      await Promise.all([fetchProducts(), refreshNotifications()]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Se încarcă datele...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">Eroare: {error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reîncearcă
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-6">
          {/* Titlu + buton istoric (admin) */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-brand">
                Catalog Distribuit
              </p>
              <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
                Gestionează comenzile în timp real
              </h1>
              <p className="max-w-xl text-pretty text-sm text-muted-foreground">
                Plasează comenzi către serviciul de comenzi și urmărește
                evenimentele sistemului direct din clopoțelul de notificări.
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => setOrdersOpen(true)}
                className="gap-2 shrink-0"
              >
                <ClipboardList className="size-4" />
                <span className="hidden sm:inline">Istoric comenzi</span>
              </Button>
            )}
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

      {/* Dialog comandă nouă */}
      <OrderDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmitOrder}
      />

      {/* Dialog editare stoc */}
      <EditStockDialog
        product={editProduct}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleStockSaved}
      />

      {/* Dialog adăugare produs */}
      <AddProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={handleProductCreated}
      />

      {/* Dialog istoric comenzi (admin) – componenta modernă */}
      <OrdersHistoryDialog open={ordersOpen} onOpenChange={setOrdersOpen} />

      {/* Buton plutitor Adaugă produs (doar admin) */}
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
