import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  Edit,
  Plus,
  Search,
  SlidersHorizontal,
  Trash,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { AddInventorySheet } from "@/components/add-inventory-sheet";
import { EditInventorySheet } from "@/components/edit-inventory-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { API_BASE_URL, useAuth } from "@/lib/auth";
import { inventoryListQueryKey } from "@/lib/inventory-query";
import { usePermissions } from "@/lib/usePermissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

interface SummaryCard {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: "primary" | "amber" | "sky";
}

interface Item {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  hue: number;
}

interface ApiInventoryRow {
  _id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

async function fetchInventoryItems(token: string): Promise<Item[]> {
  const response = await fetch(`${API_BASE_URL}/api/inventory`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to load inventory");
  }
  const rows = (payload?.items ?? []) as ApiInventoryRow[];
  return rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    sku: row.sku,
    category: row.category,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    hue: hueFromString(row.sku),
  }));
}

type SortKey = "name" | "quantity" | "unitPrice";

function InventoryPage() {
  const { token } = useAuth();
  const { can } = usePermissions();
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [asc, setAsc] = useState(true);

  const canCreateInventory = can("Inventory", "create");
  const canEditInventory = can("Inventory", "edit");
  const canDeleteInventory = can("Inventory", "delete");

  const deleteInventoryItem = async (id: string, name: string) => {
    if (!token) {
      toast.error("You must be signed in to delete an inventory item.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to delete inventory item");
      }

      await refetch();
      toast.success("Inventory item deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete inventory item";
      toast.error(message);
    }
  };

  const {
    data: items = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: inventoryListQueryKey,
    queryFn: () => fetchInventoryItems(token!),
    enabled: Boolean(token),
  });

  const summaryCards = useMemo<SummaryCard[]>(() => {
    const totalValue = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const lowStock = items.filter((i) => i.quantity < 10).length;
    return [
      
      {
        label: "Low Stock Items",
        value: String(lowStock),
        helper: "below threshold of 10 units",
        icon: AlertTriangle,
        tone: "amber",
      },
      {
        label: "Incoming Shipments",
        value: "—",
        helper: "Connect logistics module for live counts",
        icon: Truck,
        tone: "sky",
      },
    ];
  }, [items]);

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((i) => {
      const matchesQ =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q);
      const matchesCat = activeCategories.length === 0 || activeCategories.includes(i.category);
      return matchesQ && matchesCat;
    });
    return filtered.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [items, query, activeCategories, sortKey, asc]);

  const toggleCategory = (cat: string) =>
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Track stock levels, value, and incoming shipments across warehouses.
          </p>
        </div>
        {canCreateInventory && (
          <AddInventorySheet
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add New Inventory
              </Button>
            }
          />
        )}
      </header>

      #Summary cards
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((s) => {
          const Icon = s.icon;
          const tones: Record<SummaryCard["tone"], string> = {
            primary: "bg-primary/10 text-primary",
            amber: "bg-amber-500/10 text-amber-600",
            sky: "bg-sky-500/10 text-sky-600",
          };
          return (
            <Card key={s.label} className="p-5 shadow-[var(--shadow-card)] border-border/60">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
                </div>
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    tones[s.tone],
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{s.helper}</p>
            </Card>
          );
        })}
      </section>

      <Card className="shadow-[var(--shadow-card)] border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Products</h3>
            <span className="text-xs text-muted-foreground">({rows.length})</span>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, SKU, category..."
                className="pl-9"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                  {activeCategories.length > 0 && (
                    <span className="ml-1 rounded bg-primary/10 px-1.5 text-xs text-primary">
                      {activeCategories.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c}
                    checked={activeCategories.includes(c)}
                    onCheckedChange={() => toggleCategory(c)}
                  >
                    {c}
                  </DropdownMenuCheckboxItem>
                ))}
                {activeCategories.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveCategories([])}>
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSortKey("name");
                    setAsc(true);
                  }}
                >
                  Name (A–Z)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortKey("quantity");
                    setAsc(true);
                  }}
                >
                  Quantity (low → high)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortKey("quantity");
                    setAsc(false);
                  }}
                >
                  Quantity (high → low)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSortKey("unitPrice");
                    setAsc(false);
                  }}
                >
                  Unit price (high → low)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-2">
          {isPending && (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading inventory…</p>
          )}
          {isError && (
            <div className="py-10 text-center text-sm">
              <p className="text-destructive">
                {error instanceof Error ? error.message : "Failed to load"}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          )}
          {!isPending && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity in Stock</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => {
                  const isLow = item.quantity < 10;
                  const initials =
                    item.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("") || "?";
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold text-white shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, oklch(0.72 0.14 ${item.hue}), oklch(0.55 0.18 ${item.hue}))`,
                          }}
                          aria-hidden
                        >
                          {initials}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {isLow && (
                            <Badge className="border-transparent bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          isLow && "text-amber-700 font-semibold",
                        )}
                      >
                        {item.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {currency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {canEditInventory && (
                            <EditInventorySheet
                              item={{
                                id: item.id,
                                name: item.name,
                                sku: item.sku,
                                category: item.category,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                              }}
                              trigger={
                                <Button size="xs" variant="ghost" className="h-8 w-8 rounded-md">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              }
                              onItemUpdated={() => void refetch()}
                            />
                          )}
                          {canDeleteInventory && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="xs" variant="ghost" className="h-8 w-8 rounded-md">
                                  <Trash className="h-3 w-3 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete inventory item?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove "{item.name}" from inventory list.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="justify-end gap-2">
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction asChild>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      onClick={() => void deleteInventoryItem(item.id, item.name)}
                                    >
                                      Delete item
                                    </Button>
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      {items.length === 0
                        ? "No products yet. Add your first item to get started."
                        : "No products match your filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
