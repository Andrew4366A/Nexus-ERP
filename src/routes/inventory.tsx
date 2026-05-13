import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

type Status = "In Stock" | "Low Stock" | "Out of Stock";

type Item = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  status: Status;
};

const ITEMS: Item[] = [
  { id: "1", name: "Industrial Bearing 6204", sku: "BR-6204-ZZ", category: "Components", stock: 82, status: "In Stock" },
  { id: "2", name: "Hydraulic Hose 1/2\"", sku: "HH-0500-BR", category: "Hydraulics", stock: 24, status: "Low Stock" },
  { id: "3", name: "Steel Sheet 2mm", sku: "SS-2000-CR", category: "Raw Materials", stock: 0, status: "Out of Stock" },
  { id: "4", name: "PLC Controller V2", sku: "PLC-V2-INX", category: "Electronics", stock: 65, status: "In Stock" },
  { id: "5", name: "Conveyor Belt 3m", sku: "CB-3000-RB", category: "Machinery", stock: 18, status: "Low Stock" },
  { id: "6", name: "Safety Helmet Pro", sku: "SH-PRO-YEL", category: "Safety Gear", stock: 91, status: "In Stock" },
  { id: "7", name: "Lubricant Oil 5L", sku: "LO-5000-SY", category: "Consumables", stock: 47, status: "In Stock" },
  { id: "8", name: "Welding Rod E6013", sku: "WR-6013-32", category: "Consumables", stock: 12, status: "Low Stock" },
  { id: "9", name: "Aluminum Bar 25mm", sku: "AB-2500-AL", category: "Raw Materials", stock: 0, status: "Out of Stock" },
  { id: "10", name: "Servo Motor 750W", sku: "SM-0750-AC", category: "Electronics", stock: 33, status: "In Stock" },
];

const CATEGORIES = Array.from(new Set(ITEMS.map((i) => i.category)));

const statusStyles: Record<Status, string> = {
  "In Stock": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-transparent",
  "Low Stock": "bg-amber-100 text-amber-700 hover:bg-amber-100 border-transparent",
  "Out of Stock": "bg-rose-100 text-rose-700 hover:bg-rose-100 border-transparent",
};

function InventoryPage() {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return ITEMS.filter((i) => {
      const matchesQuery =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q);
      const matchesCat =
        activeCategories.length === 0 || activeCategories.includes(i.category);
      return matchesQuery && matchesCat;
    });
  }, [query, activeCategories]);

  const toggleCategory = (cat: string) =>
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
          <SidebarTrigger />
          <div>
            <h1 className="text-base font-semibold tracking-tight">Inventory</h1>
            <p className="text-xs text-muted-foreground">
              Track stock levels across all warehouses
            </p>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Items</CardTitle>
                <CardDescription>
                  {filtered.length} of {ITEMS.length} items shown
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search items, SKU…"
                    className="h-9 w-full pl-8 sm:w-64"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filter
                      {activeCategories.length > 0 && (
                        <span className="ml-1 rounded bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                          {activeCategories.length}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {CATEGORIES.map((cat) => (
                      <DropdownMenuCheckboxItem
                        key={cat}
                        checked={activeCategories.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                      >
                        {cat}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="h-9 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="px-4">Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-[220px]">Stock Level</TableHead>
                      <TableHead className="px-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.sku}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Progress value={item.stock} className="h-2" />
                            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                              {item.stock}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge className={statusStyles[item.status]}>{item.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No items match your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
