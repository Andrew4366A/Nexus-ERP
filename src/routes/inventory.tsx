import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  Plus,
  Search,
  SlidersHorizontal,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { AddInventorySheet } from "@/components/add-inventory-sheet";
import { cn } from "@/lib/utils";

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

const SUMMARY: SummaryCard[] = [
  {
    label: "Total Stock Value",
    value: "$1.28M",
    helper: "across 4 warehouses",
    icon: Wallet,
    tone: "primary",
  },
  {
    label: "Low Stock Items",
    value: "12",
    helper: "below threshold of 10 units",
    icon: AlertTriangle,
    tone: "amber",
  },
  {
    label: "Incoming Shipments",
    value: "8",
    helper: "arriving in next 7 days",
    icon: Truck,
    tone: "sky",
  },
];

interface Item {
  id: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  hue: number;
}

const ITEMS: Item[] = [
  { id: 1, name: "Aurora Wireless Headset", sku: "AUD-1024", category: "Electronics", quantity: 142, unitPrice: 189.0, hue: 220 },
  { id: 2, name: "Nimbus Office Chair", sku: "FUR-2210", category: "Furniture", quantity: 8, unitPrice: 329.5, hue: 28 },
  { id: 3, name: "Halcyon Desk Lamp", sku: "LIT-0455", category: "Lighting", quantity: 64, unitPrice: 79.99, hue: 48 },
  { id: 4, name: "Forge Mechanical Keyboard", sku: "ACC-3088", category: "Accessories", quantity: 5, unitPrice: 149.0, hue: 270 },
  { id: 5, name: "Polaris USB-C Hub", sku: "ACC-3120", category: "Accessories", quantity: 220, unitPrice: 39.0, hue: 200 },
  { id: 6, name: "Atlas Standing Desk", sku: "FUR-2245", category: "Furniture", quantity: 17, unitPrice: 549.0, hue: 12 },
  { id: 7, name: "Echo Studio Monitor", sku: "AUD-1107", category: "Electronics", quantity: 9, unitPrice: 219.0, hue: 340 },
  { id: 8, name: "Quartz Notebook A5", sku: "STA-0044", category: "Stationery", quantity: 412, unitPrice: 12.5, hue: 160 },
  { id: 9, name: "Vertex 4K Webcam", sku: "ACC-3175", category: "Accessories", quantity: 33, unitPrice: 119.0, hue: 290 },
  { id: 10, name: "Lumen LED Panel", sku: "LIT-0488", category: "Lighting", quantity: 6, unitPrice: 89.0, hue: 56 },
  { id: 11, name: "Cobalt Ergonomic Mouse", sku: "ACC-3201", category: "Accessories", quantity: 178, unitPrice: 49.0, hue: 230 },
  { id: 12, name: "Pulse Smart Speaker", sku: "AUD-1188", category: "Electronics", quantity: 24, unitPrice: 159.0, hue: 320 },
];

const CATEGORIES = Array.from(new Set(ITEMS.map((i) => i.category)));

type SortKey = "name" | "quantity" | "unitPrice";

function InventoryPage() {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = ITEMS.filter((i) => {
      const matchesQ =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q);
      const matchesCat =
        activeCategories.length === 0 || activeCategories.includes(i.category);
      return matchesQ && matchesCat;
    });
    return filtered.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
      return asc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [query, activeCategories, sortKey, asc]);

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
        <AddInventorySheet
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add New Inventory
            </Button>
          }
        />
      </header>

      {/* Top summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUMMARY.map((s) => {
          const Icon = s.icon;
          const tones: Record<SummaryCard["tone"], string> = {
            primary: "bg-primary/10 text-primary",
            amber: "bg-amber-500/10 text-amber-600",
            sky: "bg-sky-500/10 text-sky-600",
          };
          return (
            <Card
              key={s.label}
              className="p-5 shadow-[var(--shadow-card)] border-border/60"
            >
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

      {/* Products table */}
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
                {CATEGORIES.map((c) => (
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
                <DropdownMenuItem onClick={() => { setSortKey("name"); setAsc(true); }}>
                  Name (A–Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortKey("quantity"); setAsc(true); }}>
                  Quantity (low → high)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortKey("quantity"); setAsc(false); }}>
                  Quantity (high → low)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortKey("unitPrice"); setAsc(false); }}>
                  Unit price (high → low)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity in Stock</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => {
                const isLow = item.quantity < 10;
                const initials = item.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("");
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
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No products match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
