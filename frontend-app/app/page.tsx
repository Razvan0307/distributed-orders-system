"use client";

import { useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { TopNav } from "@/components/top-nav";
import { initialNotifications } from "@/lib/mock-data";
import type { Notification } from "@/lib/types";

export default function BuyerPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      addNotification({
        event: "SYSTEM_SYNC",
        message: "API Gateway sincronizat · catalog actualizat",
        timestamp: new Date().toISOString(),
      });
      setIsRefreshing(false);
    }, 900);
  };

  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open);
    if (open) setUnreadCount(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        mode="buyer"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        notifications={notifications}
        unreadCount={unreadCount}
        notificationsOpen={notificationsOpen}
        onNotificationsOpenChange={handleNotificationsOpenChange}
      />
      <Dashboard isAdmin={false} />
    </div>
  );
}
