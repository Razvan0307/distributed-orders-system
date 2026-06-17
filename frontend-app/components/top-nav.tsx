"use client";

import { useRouter } from "next/navigation";
import { Boxes, RefreshCw, ShieldCheck, Store } from "lucide-react";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/notifications-bell";
import { cn } from "@/lib/utils";

type TopNavProps = {
  mode: "buyer" | "admin";
  onRefresh: () => void;
  isRefreshing: boolean;
  notifications: Notification[];
  unreadCount: number;
  notificationsOpen: boolean;
  onNotificationsOpenChange: (open: boolean) => void;
};

export function TopNav({
  mode,
  onRefresh,
  isRefreshing,
  notifications,
  unreadCount,
  notificationsOpen,
  onNotificationsOpenChange,
}: TopNavProps) {
  const isAdmin = mode === "admin";
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-xl text-brand-foreground shadow-sm",
              isAdmin ? "bg-foreground text-background" : "bg-brand",
            )}
          >
            {isAdmin ? (
              <ShieldCheck className="size-5" aria-hidden="true" />
            ) : (
              <Boxes className="size-5" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              {isAdmin
                ? "Consolă de Administrare"
                : "Sistem Distribuit de Comenzi"}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {isAdmin
                ? "Gestionare catalog · Inventar"
                : "Magazin · API Gateway"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={() => router.push(isAdmin ? "/" : "/admin")}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isAdmin ? (
              <Store className="size-4" aria-hidden="true" />
            ) : (
              <ShieldCheck className="size-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {isAdmin ? "Vezi magazinul" : "Mod Admin"}
            </span>
          </Button>

          <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 md:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Servicii Active
            </span>
          </div>

          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw
              className={cn("size-4", isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {isRefreshing ? "Se actualizează…" : "Reîmprospătează"}
            </span>
          </Button>

          <NotificationsBell
            notifications={notifications}
            unreadCount={unreadCount}
            open={notificationsOpen}
            onOpenChange={onNotificationsOpenChange}
          />
        </div>
      </div>
    </header>
  );
}
