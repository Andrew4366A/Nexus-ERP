import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { createFileRoute } from "@tanstack/react-router";

import { API_BASE_URL, useAuth } from "@/lib/auth";
import { inventoryListQueryKey } from "@/lib/inventory-query";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Map,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { CreateShipmentSheet, type SkuOption } from "@/components/create-shipment-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { LogisticsDeleteDialog } from "@/components/logistics-delete-dialog";

import { LogisticsEditSheet } from "@/components/logistics-edit-sheet";

import { usePermissions } from "@/lib/usePermissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/logistics")({
  component: LogisticsPage,
});

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
  completedAt?: string;
}

type ApiInventoryRow = {
  _id: string;
  name: string;
  sku: string;
};

function skuOptionFromInventory(row: ApiInventoryRow): SkuOption {
  return {
    sku: row.sku,
    label: row.name,
  };
}

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
    <Badge className={cn("font-medium shadow-none", styles[status])}>{statusLabel(status)}</Badge>
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

const MOCK_SHIPMENTS: ShipmentRow[] = [];

function LogisticsPage() {
  const { can } = usePermissions();
  const { token } = useAuth();

  const [shipments, setShipments] = useState<ShipmentRow[]>(MOCK_SHIPMENTS);
  const [loadingShipments, setLoadingShipments] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatusUi | "all">("all");

  const [deleteTarget, setDeleteTarget] = useState<ShipmentRow | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      try {
        setLoadingShipments(true);

        const res = await fetch(`${API_BASE_URL}/api/logistics/`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(payload?.message || "Failed to load shipments");
        }

        const apiShipments = ((payload?.shipments ?? payload?.shipment) || []) as Array<{
          _id: string;
          reference: string;
          origin: string;
          destination: string;
          status: ShipmentStatusUi;
          carrier?: string;
        }>;

        const mapped: ShipmentRow[] = apiShipments.map((s) => ({
          id: s._id,
          trackingId: s.reference,
          origin: s.origin,
          destination: s.destination,
          driverName: "Unassigned",
          status: (s.status as ShipmentStatusUi) ?? "pending",
          sku: "",
          carrier: s.carrier,
          completedAt: s.status === "delivered" ? new Date().toISOString() : undefined,
        }));

        if (!cancelled) setShipments(mapped);
      } catch (e) {
        if (!cancelled) setShipments([]);
        const message = e instanceof Error ? e.message : "Unknown error";
        toast.error("Failed to load shipments", { description: message });
      } finally {
        if (!cancelled) setLoadingShipments(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const { data: inventoryItems = [] } = useQuery({
    queryKey: inventoryListQueryKey,
    queryFn: async () => {
      if (!token) return [];
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load inventory");
      }
      return (payload?.items ?? []) as ApiInventoryRow[];
    },
    enabled: Boolean(token),
  });

  const skuOptions: SkuOption[] = useMemo(
    () => inventoryItems.map((i) => skuOptionFromInventory(i)),
    [inventoryItems],
  );

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
        helper: "Delivered in today window",
        icon: CheckCircle2,
        tone: "emerald",
      },
    ];
  }, [shipments]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter((s) => {
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const hay =
        `${s.trackingId} ${s.origin} ${s.destination} ${s.driverName} ${s.sku}`.toLowerCase();
      return matchesStatus && (!q || hay.includes(q));
    });
  }, [shipments, query, statusFilter]);

  const toneRing: Record<SummarySpec["tone"], string> = {
    indigo: "bg-indigo-600/10 text-indigo-700 dark:text-indigo-300",
    amber: "bg-amber-500/12 text-amber-800 dark:text-amber-200",
    rose: "bg-rose-600/12 text-rose-800 dark:text-rose-200",
    emerald: "bg-emerald-600/12 text-emerald-800 dark:text-emerald-200",
  };

  const canCreateShipment = can("Logistics", "create");
  const canDeleteShipment = can("Logistics", "delete");
  const canEditShipment = can("Logistics", "edit");

  const handleCreate = async (values: { sku: string; destination: string; carrier: string }) => {
    if (!token) return;

    try {
      const payload = {
        reference: values.sku ? `SHIP-${values.sku}` : `SHIP-${crypto.randomUUID().slice(0, 8)}`,
        origin: DEFAULT_ORIGIN,
        destination: values.destination.trim(),
        carrier: values.carrier.trim(),
        status: "planned",
      };

      const res = await fetch(`${API_BASE_URL}/api/logistics/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to create shipment");

      toast.success("Shipment created", {
        description: data?.shipment?.reference || payload.reference,
      });

      const res2 = await fetch(`${API_BASE_URL}/api/logistics/`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const payload2 = await res2.json().catch(() => null);

      type ApiShipment = {
        _id: string;
        reference: string;
        origin: string;
        destination: string;
        status: ShipmentStatusUi;
        carrier?: string;
      };

      const mapped = ((payload2 as { shipments?: ApiShipment[] } | null)?.shipments ??
        []) as ApiShipment[];

      setShipments(
        mapped.map((s) => ({
          id: s._id,
          trackingId: s.reference,
          origin: s.origin,
          destination: s.destination,
          driverName: "Unassigned",
          status: (s.status as ShipmentStatusUi) ?? "planned",
          sku: "",
          carrier: s.carrier,
          completedAt: s.status === "delivered" ? new Date().toISOString() : undefined,
        })),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Failed to create shipment", { description: message });
    }
  };

  const confirmDeleteShipment = async () => {
    if (!deleteTarget) return;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/logistics/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());

      toast.success("Shipment deleted");
      setDeleteTarget(null);

      const res2 = await fetch(`${API_BASE_URL}/api/logistics/`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const payload2 = await res2.json().catch(() => null);

      const apiShipments = (payload2?.shipments ?? payload2?.shipment ?? []) as Array<{
        _id: string;
        reference: string;
        origin: string;
        destination: string;
        status: ShipmentStatusUi;
        carrier?: string;
      }>;

      setShipments(
        apiShipments.map((s) => ({
          id: s._id,
          trackingId: s.reference,
          origin: s.origin,
          destination: s.destination,
          driverName: "Unassigned",
          status: (s.status as ShipmentStatusUi) ?? "pending",
          sku: "",
          carrier: s.carrier,
          completedAt: s.status === "delivered" ? new Date().toISOString() : undefined,
        })),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Failed to delete shipment", { description: message });
    }
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
            skuOptions={skuOptions}
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
                  Wire Mapbox, Google Maps, or your TMS polyline service here. Coordinates will
                  render over this panel.
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
                    <TableHead className="w-10 text-right" />
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
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {canEditShipment && (
                            <LogisticsEditSheet
                              trigger={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <span aria-hidden>✎</span>
                                </Button>
                              }
                              shipment={row}
                              onUpdated={(next) => {
                                // The edit sheet may return a different shape (ShipmentLike).
                                setShipments((prev): ShipmentRow[] =>
                                  prev.map((s): ShipmentRow => {
                                    if (s.id !== row.id) return s;
                                    const n = next as ShipmentRow & Record<string, unknown>;
                                    return {
                                      ...s,
                                      id: n.id ?? n._id ?? s.id,
                                      trackingId: n.trackingId ?? n.reference ?? s.trackingId,
                                      origin: n.origin ?? s.origin,
                                      destination: n.destination ?? s.destination,
                                      driverName: n.driverName ?? s.driverName,
                                      status: (n.status as ShipmentStatusUi) ?? s.status,
                                      sku: n.sku ?? s.sku,
                                      carrier: n.carrier ?? s.carrier,
                                      completedAt: n.completedAt ?? s.completedAt,
                                    };
                                  }),
                                );
                              }}
                            />
                          )}

                          {canDeleteShipment && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-600 hover:text-rose-600"
                              onClick={() => setDeleteTarget(row)}
                              aria-label={`Delete shipment ${row.trackingId}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
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

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove shipment?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  This will permanently delete shipment{" "}
                  <span className="font-medium text-foreground">{deleteTarget.trackingId}</span>.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteShipment}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default LogisticsPage;
