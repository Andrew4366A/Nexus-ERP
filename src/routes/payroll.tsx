import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Coins,
  Pencil,
  Plus,
  Receipt,
  SlidersHorizontal,
  Trash2,
  Wallet,
  ArrowUpDown,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalaryDefinitionSheet } from "@/components/salary-definition-sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/payroll")({
  component: PayrollPage,
});

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

interface SummaryCard {
  label: string;
  value: number;
  delta: number;
  helper: string;
  icon: LucideIcon;
}

const SUMMARY: SummaryCard[] = [
  { label: "Gross Salary", value: 482_500, delta: 4.2, helper: "vs last month", icon: Wallet },
  { label: "Net Salary", value: 361_900, delta: 3.1, helper: "vs last month", icon: Banknote },
  { label: "Total Tax", value: 92_400, delta: -1.6, helper: "vs last month", icon: Receipt },
  { label: "Total Loan", value: 28_200, delta: 2.4, helper: "outstanding", icon: Coins },
];

const CHART_DATA = [
  { month: "Jan", net: 320, tax: 70, loan: 22 },
  { month: "Feb", net: 332, tax: 74, loan: 21 },
  { month: "Mar", net: 340, tax: 78, loan: 24 },
  { month: "Apr", net: 348, tax: 82, loan: 23 },
  { month: "May", net: 352, tax: 84, loan: 25 },
  { month: "Jun", net: 360, tax: 88, loan: 26 },
  { month: "Jul", net: 358, tax: 86, loan: 27 },
  { month: "Aug", net: 365, tax: 90, loan: 28 },
  { month: "Sep", net: 361, tax: 92, loan: 28 },
  { month: "Oct", net: 370, tax: 94, loan: 29 },
  { month: "Nov", net: 375, tax: 96, loan: 30 },
  { month: "Dec", net: 380, tax: 98, loan: 31 },
];

interface Row {
  id: number;
  title: string;
  level: string;
  basic: number;
  allowance: number;
  gross: number;
  deductions: number;
  net: number;
}

const ROWS: Row[] = [
  { id: 1, title: "Operations Lead", level: "L5", basic: 5200, allowance: 1100, gross: 6300, deductions: 980, net: 5320 },
  { id: 2, title: "Warehouse Manager", level: "L4", basic: 4400, allowance: 900, gross: 5300, deductions: 820, net: 4480 },
  { id: 3, title: "Logistics Analyst", level: "L3", basic: 3600, allowance: 700, gross: 4300, deductions: 640, net: 3660 },
  { id: 4, title: "Inventory Officer", level: "L3", basic: 3400, allowance: 650, gross: 4050, deductions: 600, net: 3450 },
  { id: 5, title: "Procurement Specialist", level: "L4", basic: 4200, allowance: 850, gross: 5050, deductions: 770, net: 4280 },
  { id: 6, title: "Fleet Coordinator", level: "L3", basic: 3500, allowance: 680, gross: 4180, deductions: 620, net: 3560 },
  { id: 7, title: "HR Business Partner", level: "L4", basic: 4300, allowance: 880, gross: 5180, deductions: 790, net: 4390 },
  { id: 8, title: "Finance Controller", level: "L5", basic: 5400, allowance: 1150, gross: 6550, deductions: 1010, net: 5540 },
];

type SortKey = "title" | "level" | "net" | "gross";

function PayrollPage() {
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const sorted = [...ROWS].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
      return asc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [sortKey, asc]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
          <p className="text-sm text-muted-foreground">
            Manage salary structures, taxes, and monthly payslips.
          </p>
        </div>
      </header>

      {/* Top section: summary cards + chart */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-1">
          {SUMMARY.map((s) => {
            const positive = s.delta >= 0;
            const Icon = s.icon;
            return (
              <Card
                key={s.label}
                className="p-5 shadow-[var(--shadow-card)] border-border/60"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-semibold tracking-tight">{currency(s.value)}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                      positive
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-rose-500/10 text-rose-600",
                    )}
                  >
                    {positive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(s.delta)}%
                  </span>
                  <span className="text-muted-foreground">{s.helper}</span>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-5 shadow-[var(--shadow-card)] border-border/60 xl:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold">Annual payroll summary</h2>
              <p className="text-xs text-muted-foreground">
                Net pay, tax, and loans across the year (in thousands)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <LegendDot color="var(--primary)" label="Net" />
              <LegendDot color="oklch(0.769 0.188 70.08)" label="Tax" />
              <LegendDot color="oklch(0.6 0.118 184.704)" label="Loan" />
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA} barCategoryGap={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "oklch(0.968 0.007 247.896 / 0.6)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-card)",
                    fontSize: 12,
                  }}
                />
                
                <Bar dataKey="net" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="tax" stackId="a" fill="oklch(0.769 0.188 70.08)" />
                <Bar dataKey="loan" stackId="a" fill="oklch(0.6 0.118 184.704)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* Tabs section */}
      <Tabs defaultValue="salary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="salary">Salary breakdown</TabsTrigger>
          <TabsTrigger value="tax">Tax definitions</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="salary" className="space-y-4">
          <Card className="shadow-[var(--shadow-card)] border-border/60">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div>
                <h3 className="text-sm font-semibold">Salary definitions</h3>
                <p className="text-xs text-muted-foreground">
                  Configure earnings and deductions per role.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by level</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {["L3", "L4", "L5"].map((l) => (
                      <DropdownMenuItem key={l}>{l}</DropdownMenuItem>
                    ))}
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
                    <DropdownMenuItem onClick={() => { setSortKey("title"); setAsc(true); }}>Title (A–Z)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortKey("level"); setAsc(true); }}>Level</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortKey("gross"); setAsc(false); }}>Gross (high → low)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortKey("net"); setAsc(false); }}>Net (high → low)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <SalaryDefinitionSheet
                  trigger={
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                      Create salary definition
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S/N</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Basic Salary</TableHead>
                    <TableHead className="text-right">Allowance</TableHead>
                    <TableHead className="text-right">Gross Salary</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {r.level}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{currency(r.basic)}</TableCell>
                      <TableCell className="text-right tabular-nums">{currency(r.allowance)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{currency(r.gross)}</TableCell>
                      <TableCell className="text-right tabular-nums text-rose-600">
                        −{currency(r.deductions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{currency(r.net)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card className="p-10 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)] border-border/60">
            Tax definitions will appear here.
          </Card>
        </TabsContent>
        <TabsContent value="payslips">
          <Card className="p-10 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)] border-border/60">
            Generated payslips will appear here.
          </Card>
        </TabsContent>
        <TabsContent value="payroll">
          <Card className="p-10 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)] border-border/60">
            Run and review payroll cycles here.
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
