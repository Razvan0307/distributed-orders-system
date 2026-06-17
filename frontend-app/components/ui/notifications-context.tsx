"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { Notification } from "@/lib/types";
import { API_BASE_URL } from "@/lib/config";

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  refreshNotifications: () => Promise<void>;
  clearNotifications: () => void;
};

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  refreshNotifications: async () => {},
  clearNotifications: () => {},
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cheia pentru localStorage
  const CLEARED_UP_TO_KEY = "clearedNotificationsUpTo";

  // Funcția care returnează pragul curent (ultimul ID șters)
  const getClearedUpTo = (): number => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem(CLEARED_UP_TO_KEY);
    return stored ? parseInt(stored) : 0;
  };

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`);
      if (res.ok) {
        const all: Notification[] = await res.json();
        // Filtrare persistentă – ascundem notificările șterse anterior
        const clearedUpTo = getClearedUpTo();
        const filtered = all.filter((n) => n.id > clearedUpTo);
        setNotifications(filtered);
      }
    } catch (error) {
      console.error("Eroare fetch notificări:", error);
    }
  }, []);

  // La montare, aducem notificările
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Calculăm necititele pe baza listei curente
  useEffect(() => {
    const lastRead = localStorage.getItem("lastReadNotificationId");
    const lastId = lastRead ? parseInt(lastRead) : 0;
    const count = notifications.filter((n) => n.id > lastId).length;
    setUnreadCount(count);
  }, [notifications]);

  const markAllRead = () => {
    if (notifications.length > 0) {
      const maxId = Math.max(...notifications.map((n) => n.id));
      localStorage.setItem("lastReadNotificationId", maxId.toString());
      setUnreadCount(0);
    }
  };

  // Ștergere „definitivă” – setăm pragul la cel mai mare ID curent
  const clearNotifications = () => {
    if (notifications.length > 0) {
      const maxId = Math.max(...notifications.map((n) => n.id));
      localStorage.setItem(CLEARED_UP_TO_KEY, maxId.toString());
    } else {
      // Dacă lista e deja goală, resetăm tot
      localStorage.removeItem(CLEARED_UP_TO_KEY);
    }
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllRead,
        refreshNotifications,
        clearNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
