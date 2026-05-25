import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Map,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { CreateShipmentSheet, type SkuOption } from "@/components/create-shipment-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "@/lib/usePermissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/logistics")({
  component: LogisticsPage,
});

/** UI status labels aligned with product copy */
export type ShipmentStatusUi = "pending" | "in_transit" | "delivered" | "delayed";

export interface ShipmentRow {
  id: string;
  trackingId: string;
  origin: string;
  destination: string;
  driverName: string;
  status: ShipmentStatusUi;
  sku: string;
  carrier?: string;
  /** ISO date string — used for “Completed today” summary */
  completedAt?: string;
}

/**
 * Mock shipments — swap for API data, e.g.:
 * useEffect(() => {
 *   if (!token) return;
 *   let cancelled = false;
 *   fetch(`${API_BASE_URL}/api/logistics/shipments`, { headers: { Authorization: `Bearer ${token}` } })
 *     .then((r) => r.json())
 *     .then((data) => { if (!cancelled) setShipments(data.shipments); })
 *     .catch(console.error);
 *   return () => { cancelled = true; };
 * }, [token]);
 */
const MOCK_SHIPMENTS: ShipmentRow[] = [
  {
    id: "1",
    trackingId: "NEX-US-20481",
    origin: "Chicago, IL — Nexus DC",
    destination: "Atlanta, GA — Southeast Hub",
    driverName: "Marcus Cole",
    status: "in_transit",
    sku: "AUD-1024",
    carrier: "Nexus Freight LTL",
  },
  {
    id: "2",
    trackingId: "NEX-US-20482",
    origin: "Chicago, IL — Nexus DC",
    destination: "Phoenix, AZ — Desert DC",
    driverName: "Elena Vasquez",
    status: "in_transit",
    sku: "FUR-2210",
    carrier: "BlueLine Express",
  },
  {
    id: "3",
    trackingId: "NEX-US-20470",
    origin: "Chicago, IL — Nexus DC",
    destination: "Seattle, WA — Portside FC",
    driverName: "Unassigned",
    status: "pending",
    sku: "ACC-3088",
    carrier: "Pending assignment",
  },
  {
    id: "4",
    trackingId: "NEX-US-20465",
    origin: "Dallas, TX — South Central",
    destination: "Miami, FL — Coastal DC",
    driverName: "James Okonkwo",
    status: "delayed",
    sku: "LIT-0455",
    carrier: "Coastal Carriers",
  },
  {
    id: "5",
    trackingId: "NEX-US-20460",
    origin: "Chicago, IL — Nexus DC",
    destination: "Denver, CO — Mountain Hub",
    driverName: "Sarah Kim",
    status: "delivered",
    sku: "ACC-3120",
    carrier: "Summit Logistics",
    completedAt: new Date().toISOString(),
  },
  {
    id: "6",
    trackingId: "NEX-US-20458",
    origin: "Memphis, TN — Sort Center",
    destination: "Boston, MA — Northeast Hub",
    driverName: "David Nguyen",
    status: "delivered",
    sku: "STA-0044",
    carrier: "Nexus Freight LTL",
    completedAt: new Date().toISOString(),
  },
  {
    id: "7",
    trackingId: "NEX-US-20455",
    origin: "Chicago, IL — Nexus DC",
    destination: "Portland, OR — Pacific NW",
    driverName: "Unassigned",
    status: "pending",
    sku: "AUD-1188",
    carrier: "Awaiting dock slot",
  },
];

/**
 * Mock SKU list for the create form — replace with inventory API:
 * `inventoryItems.map((i) => ({ sku: i.sku, label: i.name }))`
 */
const MOCK_SKU_OPTIONS: SkuOption[] = [
  { sku: "AUD-1024", label: "Aurora Wireless Headset" },
  { sku: "FUR-2210", label: "Nimbus Office Chair" },
  { sku: "ACC-3088", label: "Forge Mechanical Keyboard" },
  { sku: "LIT-0455", label: "Halcyon Desk Lamp" },
  { sku: "ACC-3120", label: "Polaris USB-C Hub" },
  { sku: "STA-0044", label: "Quartz Notebook A5" },
  { sku: "AUD-1188", label: "Pulse Smart Speaker" },
];

const DEFAULT_ORIGIN = "Chicago, IL — Nexus DC";

function isCompletedToday(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function statusLabel(status: ShipmentStatusUi) {
  switch (status) {
    case "in_transit":
      return "In Transit";
    case "pending":
      return "Pending";
    case "delivered":
      return "Delivered";
    case "delayed":
      return "Delayed";
    default:
      return status;
  }
}

function StatusBadge({ status }: { status: ShipmentStatusUi }) {
  const styles: Record<ShipmentStatusUi, string> = {
    in_transit:
      "border-transparent bg-indigo-600/12 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
    pending:
      "border-transparent bg-amber-500/12 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100",
    delivered:
      "border-transparent bg-emerald-600/12 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100",
    delayed:
      "border-transparent bg-rose-600/12 text-rose-900 dark:bg-rose-500/15 dark:text-rose-100",
  };
  return (
    <Badge className={cn("font-medium shadow-none", styles[status])}>
      {statusLabel(status)}
    </Badge>
  );
}

interface SummarySpec {
  key: string;
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: "indigo" | "amber" | "rose" | "emerald";
}

function LogisticsPage() {
  const { can } = usePermissions();
  const [shipments, setShipments] = useState<ShipmentRow[]>(MOCK_SHIPMENTS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatusUi | "all">("all");

  const summaryCards = useMemo<SummarySpec[]>(() => {
    const active = shipments.filter((s) => s.status === "in_transit").length;
    const pending = shipments.filter((s) => s.status === "pending").length;
    const delayed = shipments.filter((s) => s.status === "delayed").length;
    const completedToday = shipments.filter(
      (s) => s.status === "delivered" && isCompletedToday(s.completedAt),
    ).length;
    return [
      {
        key: "active",
        label: "Active Shipments",
        value: String(active),
        helper: "Currently on the road",
        icon: Truck,
        tone: "indigo",
      },
      {
        key: "pending",
        label: "Pending Dispatches",
        value: String(pending),
        helper: "Awaiting driver & dock",
        icon: Clock,
        tone: "amber",
      },
      {
        key: "delayed",
        label: "Delayed",
        value: String(delayed),
        helper: "SLA attention required",
        icon: AlertTriangle,
        tone: "rose",
      },
      {
        key: "done",
        label: "Completed Today",
        value: String(completedToday),
        helper: "Delivered in last 24h window",
        icon: CheckCircle2,
        tone: "emerald",
      },
    ];
  }, [shipments]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter((s) => {
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const hay = `${s.trackingId} ${s.origin} ${s.destination} ${s.driverName} ${s.sku}`.toLowerCase();
      const matchesQuery = !q || hay.includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [shipments, query, statusFilter]);

  const toneRing: Record<SummarySpec["tone"], string> = {
    indigo: "bg-indigo-600/10 text-indigo-700 dark:text-indigo-300",
    amber: "bg-amber-500/12 text-amber-800 dark:text-amber-200",
    rose: "bg-rose-600/12 text-rose-800 dark:text-rose-200",
    emerald: "bg-emerald-600/12 text-emerald-800 dark:text-emerald-200",
  };
  const canCreateShipment = can("Logistics", "create");

  const handleCreate = (values: { sku: string; destination: string; carrier: string }) => {
    const suffix = Math.floor(10000 + Math.random() * 90000);
    const next: ShipmentRow = {
      id: crypto.randomUUID(),
      trackingId: `NEX-US-${suffix}`,
      origin: DEFAULT_ORIGIN,
      destination: values.destination.trim(),
      driverName: "Unassigned",
      status: "pending",
      sku: values.sku,
      carrier: values.carrier.trim(),
    };
    setShipments((prev) => [next, ...prev]);
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Logistics</h1>
          <p className="text-sm text-muted-foreground">
            Command center for routes, carriers, and live shipment health across Nexus ERP.
          </p>
        </div>
        {canCreateShipment && (
          <CreateShipmentSheet
            skuOptions={MOCK_SKU_OPTIONS}
            onCreate={handleCreate}
            trigger={
              <Button
                size="sm"
                className={cn(
                  "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700",
                  "focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                )}
              >
                <Package className="mr-2 h-4 w-4" />
                Create New Shipment
              </Button>
            }
          />
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.key}
              className="border-border/60 p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                    {s.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    toneRing[s.tone],
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{s.helper}</p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <Card className="relative overflow-hidden border-indigo-200/50 bg-card shadow-[var(--shadow-card)] dark:border-indigo-500/20 lg:col-span-5">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600/[0.07] via-transparent to-sky-600/[0.06]"
            aria-hidden
          />
          <div className="relative flex min-h-[220px] flex-col justify-between p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Route map</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Visual overlay for active lanes (placeholder).
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/12 text-indigo-700 dark:text-indigo-300">
                <Map className="h-6 w-6" aria-hidden />
              </div>
            </div>
            <div className="mt-8 flex flex-1 items-center justify-center">
              <div className="relative w-full max-w-sm rounded-xl border border-dashed border-indigo-300/60 bg-background/80 px-4 py-8 text-center dark:border-indigo-500/30">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-700 dark:text-indigo-300">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">Map integration</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Wire Mapbox, Google Maps, or your TMS polyline service here. Coordinates will render
                  over this panel.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-7">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Shipment tracking
                </h2>
                <p className="text-xs text-muted-foreground">
                  {rows.length} shipment{rows.length === 1 ? "" : "s"} in view
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:min-w-[200px] sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tracking, route, driver…"
                    className="h-9 border-border/80 bg-background pl-9"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 shrink-0 border-border/80">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      {statusFilter === "all" ? "All statuses" : statusLabel(statusFilter)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={statusFilter}
                      onValueChange={(v) => setStatusFilter(v as ShipmentStatusUi | "all")}
                    >
                      <DropdownMenuRadioItem value="all">All statuses</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="in_transit">In Transit</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="delivered">Delivered</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="delayed">Delayed</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="overflow-x-auto p-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tracking ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Origin
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Destination
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Driver
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-border/60 transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-foreground">
                        {row.trackingId}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-foreground/90">
                        {row.origin}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-foreground/90">
                        {row.destination}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-foreground/90">
                        {row.driverName}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        No shipments match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
