/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Package, X } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "sonner";

import { API_BASE_URL, useAuth } from "@/lib/auth";
import { inventoryListQueryKey } from "@/lib/inventory-query";

export interface InventoryCreatedDetails {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    role: string;
  };
  resource?: {
    id: string;
    module: string;
  };
  inventory?: InventoryCreatedDetails;
}

interface AdminNotificationsContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  clearNotifications: () => void;
}

const AdminNotificationsContext = createContext<AdminNotificationsContextValue | null>(null);

function formatRelativeTime(dateValue: string, now = Date.now()) {
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return "just now";

  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}sec ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

function InventoryCreatedPopup({
  notifications,
  onConfirm,
  onClose,
}: {
  notifications: AdminNotification[];
  onConfirm: (notificationId: string) => void;
  onClose: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="inventory-popup relative w-[min(92vw,460px)] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white text-slate-950 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.48),0_14px_30px_-20px_rgba(15,23,42,0.32)]">
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          onClick={onClose}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex gap-3 px-5 pb-4 pt-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Package className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pr-8">
            <p className="text-sm font-semibold text-slate-950">Pending product confirmations</p>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {notifications.length} product{notifications.length === 1 ? "" : "s"} waiting for
              confirmation.
            </p>
          </div>
        </div>

        <div className="max-h-[min(60vh,520px)] space-y-3 overflow-y-auto border-t border-slate-100 px-5 py-4">
          {notifications.map((notification) => {
            const actorName = notification.actor?.name || "A user";
            const itemName = notification.inventory?.name || "an item";
            const inventoryDetails = notification.inventory
              ? [
                  ["Product", notification.inventory.name],
                  ["SKU", notification.inventory.sku],
                  ["Category", notification.inventory.category],
                  ["Quantity", notification.inventory.quantity.toLocaleString()],
                  ["Unit Price", currency(notification.inventory.unitPrice)],
                ]
              : [];

            return (
              <div
                key={notification.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      <span>{formatRelativeTime(notification.createdAt, now)}</span>
                      <span aria-hidden>/</span>
                      <span className="truncate">{actorName}</span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-600">
                      <span className="font-semibold text-slate-950">{itemName}</span> added to
                      the inventory.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                    onClick={() => onConfirm(notification.id)}
                  >
                    Confirm
                  </button>
                </div>

                {inventoryDetails.length > 0 && (
                  <div className="mt-3 grid gap-2">
                    {inventoryDetails.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-xs font-medium text-slate-500">{label}</span>
                        <span className="min-w-0 truncate text-right font-medium text-slate-900">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAdmin, token } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inventoryPopups, setInventoryPopups] = useState<AdminNotification[]>([]);

  useEffect(() => {
    if (!isAdmin || !token || typeof window === "undefined") return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("admin:notification", (notification: AdminNotification) => {
      setNotifications((current) => [notification, ...current].slice(0, 20));
      setUnreadCount((current) => current + 1);
      if (notification.type === "inventory.created") {
        void queryClient.invalidateQueries({ queryKey: inventoryListQueryKey });
        setInventoryPopups((current) => [...current, notification].slice(-20));
      } else {
        toast(notification.title, {
          description: notification.message,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isAdmin, token, queryClient]);

  const clearNotifications = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const value = useMemo<AdminNotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      clearNotifications,
    }),
    [clearNotifications, notifications, unreadCount],
  );

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
      {inventoryPopups.length > 0 && (
        <InventoryCreatedPopup
          notifications={inventoryPopups}
          onConfirm={(notificationId) =>
            setInventoryPopups((current) =>
              current.filter((notification) => notification.id !== notificationId),
            )
          }
          onClose={() => setInventoryPopups([])}
        />
      )}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context) {
    throw new Error("useAdminNotifications must be used within AdminNotificationsProvider.");
  }

  return context;
}
