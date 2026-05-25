import { createFileRoute } from "@tanstack/react-router";
import { Bell, Package, Search, TrendingUp, Users } from "lucide-react";

import { KpiCard } from "@/components/kpi-card";
import { StockChart } from "@/components/stock-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminNotifications } from "@/lib/admin-notifications";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { clearNotifications, notifications, unreadCount } = useAdminNotifications();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        </div>
        <div className="relative hidden w-72 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders, SKUs..."
            className="bg-card pl-9 shadow-[var(--shadow-soft)]"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative" onClick={clearNotifications}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </header>

      <main className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "User"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Monitor operations and live user changes from one place."
              : "Here's how your operations are performing this month."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Total Inventory Value"
            value="$1.28M"
            delta={8.2}
            helper="vs last month"
            icon={Package}
          />
          <KpiCard
            label="Active Workforce"
            value="1,482"
            delta={3.1}
            helper="new hires this quarter"
            icon={Users}
          />
          <KpiCard
            label="Logistics Efficiency"
            value="94.6%"
            delta={-1.4}
            helper="on-time deliveries"
            icon={TrendingUp}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StockChart />
          </div>
          {isAdmin ? <AdminNotificationPanel notifications={notifications} /> : <RecentActivity />}
        </div>
      </main>
    </div>
  );
}

function AdminNotificationPanel({
  notifications,
}: {
  notifications: ReturnType<typeof useAdminNotifications>["notifications"];
}) {
  return (
    <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Admin Notifications</h3>
          <p className="mt-1 text-sm text-muted-foreground">Live user changes</p>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          {notifications.length} events
        </span>
      </div>
      <ul className="mt-5 space-y-4">
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            User changes will appear here in real time.
          </li>
        )}
      </ul>
    </Card>
  );
}

function RecentActivity() {
  return (
    <Card className="border-border/60 p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-base font-semibold">Recent Activity</h3>
      <p className="mt-1 text-sm text-muted-foreground">Latest operational events</p>
      <ul className="mt-5 space-y-4">
        {[
          { t: "PO #4821 received", s: "Warehouse A - 2m ago", c: "bg-emerald-500" },
          { t: "Payroll processed", s: "December cycle - 1h ago", c: "bg-primary" },
          { t: "Shipment delayed", s: "Route SF-LA - 3h ago", c: "bg-amber-500" },
          { t: "Stock low: SKU-2210", s: "Restock advised - 5h ago", c: "bg-rose-500" },
          { t: "New vendor onboarded", s: "Acme Supplies - 1d ago", c: "bg-sky-500" },
        ].map((item) => (
          <li key={item.t} className="flex items-start gap-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.c}`} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.t}</p>
              <p className="text-xs text-muted-foreground">{item.s}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
