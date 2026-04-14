import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

export interface AppNotification {
  id: number;
  type: 'warning' | 'limit_reached' | 'info';
  title: string;
  message: string;
  is_dismissed: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  activeNotifications: AppNotification[];  // not dismissed
  unreadCount: number;
  dismissNotification: (id: number) => Promise<void>;
  dismissAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch {
      // fail silently — don't disrupt the app
    }
  }, [isLoggedIn]);

  // Poll every 30 seconds when logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      return;
    }
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn, refresh]);

  const dismissNotification = async (id: number) => {
    try {
      await api.dismissNotification(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_dismissed: true } : n)
      );
    } catch (e) {
      console.error('Failed to dismiss notification', e);
    }
  };

  const dismissAll = async () => {
    const active = notifications.filter(n => !n.is_dismissed);
    await Promise.all(active.map(n => dismissNotification(n.id)));
  };

  const activeNotifications = notifications.filter(n => !n.is_dismissed);
  const unreadCount = activeNotifications.length;

  return (
    <NotificationContext.Provider
      value={{ notifications, activeNotifications, unreadCount, dismissNotification, dismissAll, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
