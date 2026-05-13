import { createFileRoute } from "@tanstack/react-router";
import { Bell, Package, Search, TrendingUp, Users } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { KpiCard } from "@/components/kpi-card";
import { StockChart } from "@/components/stock-chart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
            </div>
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search orders, SKUs..." className="pl-9 bg-card shadow-[var(--shadow-soft)]" />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60" />
          </header>

          <main className="flex-1 p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Welcome back, Alex</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Here's how your operations are performing this month.
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
              <Card className="p-6 shadow-[var(--shadow-card)] border-border/60">
                <h3 className="text-base font-semibold">Recent Activity</h3>
                <p className="text-sm text-muted-foreground mt-1">Latest operational events</p>
                <ul className="mt-5 space-y-4">
                  {[
                    { t: "PO #4821 received", s: "Warehouse A · 2m ago", c: "bg-emerald-500" },
                    { t: "Payroll processed", s: "December cycle · 1h ago", c: "bg-primary" },
                    { t: "Shipment delayed", s: "Route SF-LA · 3h ago", c: "bg-amber-500" },
                    { t: "Stock low: SKU-2210", s: "Restock advised · 5h ago", c: "bg-rose-500" },
                    { t: "New vendor onboarded", s: "Acme Supplies · 1d ago", c: "bg-sky-500" },
                  ].map((item) => (
                    <li key={item.t} className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.c}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.t}</p>
                        <p className="text-xs text-muted-foreground">{item.s}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
