import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import { SalaryDefinitionEditSheet } from "@/components/salary-definition-edit-sheet";

import { usePermissions } from "@/lib/usePermissions";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

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
  /** Mongo id for persisted SalaryDefinition */
  id: string;

  /** Convenience copy of `_id` */
  mongoId?: string;
  title: string;
  level: "L1" | "L2" | "L3" | "L4" | "L5";
  basic: number;
  allowance: number;
  gross: number;
  deductions: number;
  net: number;
}

const SEED_SALARY_ROWS: Row[] = [
  {
    id: "1",

    title: "Operations Lead",
    level: "L5",
    basic: 5200,
    allowance: 1100,
    gross: 6300,
    deductions: 980,
    net: 5320,
  },
  {
    id: "2",

    title: "Warehouse Manager",
    level: "L4",
    basic: 4400,
    allowance: 900,
    gross: 5300,
    deductions: 820,
    net: 4480,
  },
  {
    id: "3",

    title: "Logistics Analyst",
    level: "L3",
    basic: 3600,
    allowance: 700,
    gross: 4300,
    deductions: 640,
    net: 3660,
  },
  {
    id: "4",

    title: "Inventory Officer",
    level: "L3",
    basic: 3400,
    allowance: 650,
    gross: 4050,
    deductions: 600,
    net: 3450,
  },
  {
    id: "5",

    title: "Procurement Specialist",
    level: "L4",
    basic: 4200,
    allowance: 850,
    gross: 5050,
    deductions: 770,
    net: 4280,
  },
  {
    id: "6",

    title: "Fleet Coordinator",
    level: "L3",
    basic: 3500,
    allowance: 680,
    gross: 4180,
    deductions: 620,
    net: 3560,
  },
  {
    id: "7",

    title: "HR Business Partner",
    level: "L4",
    basic: 4300,
    allowance: 880,
    gross: 5180,
    deductions: 790,
    net: 4390,
  },
  {
    id: "8",

    title: "Finance Controller",
    level: "L5",
    basic: 5400,
    allowance: 1150,
    gross: 6550,
    deductions: 1010,
    net: 5540,
  },
];

type SortKey = "title" | "level" | "net" | "gross";

function PayrollPage() {
  const { can } = usePermissions();
  const [salaryRows, setSalaryRows] = useState<Row[]>([]);
  const [loadingSalaryRows, setLoadingSalaryRows] = useState(false);

  // Use the shared API base URL from auth module (matches the rest of the app)
  const { token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [editTarget, setEditTarget] = useState<Row | null>(null);

  const setEditTargetFromRow = (row: Row) => {
    setEditTarget(row);
  };

  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [asc, setAsc] = useState(true);

  const canCreatePayroll = can("Payroll", "create");
  const canEditPayroll = can("Payroll", "edit");
  const canDeletePayroll = can("Payroll", "delete");

  const rows = useMemo(() => {
    const sorted = [...salaryRows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [salaryRows, sortKey, asc]);

  const fetchSalaryDefinitions = async () => {
    try {
      setLoadingSalaryRows(true);
      const res = await fetch(`${API_BASE_URL}/api/payroll/salary-definitions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const definitions = (data?.salaryDefinitions ?? []) as Array<{
        _id?: string;
        title?: string;
        level?: string;
        basic?: number;
        allowance?: number;
        deductions?: number;
        net?: number;
      }>;

      const mapped: Row[] = definitions
        .map((d): Row => {
          const basic = d.basic ?? 0;
          const allowance = d.allowance ?? 0;
          const deductions = d.deductions ?? 0;
          const gross = basic + allowance;
          const net = gross - deductions;

          return {
            // Use mongo id as table key/id (option A)
            id: d._id ?? "",
            mongoId: d._id,
            title: d.title ?? "Untitled",
            level: (d.level as Row["level"] | undefined) ?? "L3",
            basic,
            allowance,
            gross,
            deductions,
            net,
          };
        })
        .filter((r) => r.id !== "");

      setSalaryRows(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Failed to load salary definitions", {
        description: message,
      });
      setSalaryRows([]);
    } finally {
      setLoadingSalaryRows(false);
    }
  };

  useEffect(() => {
    fetchSalaryDefinitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmDeleteSalaryRow = async () => {
    if (!deleteTarget?.mongoId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payroll/salary-definitions/${deleteTarget.mongoId}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        },
      );

      if (!res.ok) throw new Error(await res.text());
      toast.success("Salary definition removed", {
        description: deleteTarget.title,
      });
      setDeleteTarget(null);
      await fetchSalaryDefinitions();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Failed to delete salary definition", {
        description: message,
      });
    }
  };

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
      {loadingSalaryRows && (
        <div className="text-sm text-muted-foreground">Loading salary definitions...</div>
      )}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-1">
          {SUMMARY.map((s) => {
            const positive = s.delta >= 0;
            const Icon = s.icon;
            return (
              <Card key={s.label} className="p-5 shadow-[var(--shadow-card)] border-border/60">
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
                <Bar
                  dataKey="loan"
                  stackId="a"
                  fill="oklch(0.6 0.118 184.704)"
                  radius={[6, 6, 0, 0]}
                />
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
                    <DropdownMenuItem
                      onClick={() => {
                        setSortKey("title");
                        setAsc(true);
                      }}
                    >
                      Title (A–Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortKey("level");
                        setAsc(true);
                      }}
                    >
                      Level
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortKey("gross");
                        setAsc(false);
                      }}
                    >
                      Gross (high → low)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortKey("net");
                        setAsc(false);
                      }}
                    >
                      Net (high → low)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {canCreatePayroll && (
                  <SalaryDefinitionSheet
                    onDefinitionCreated={async (v) => {
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/payroll/salary-definitions`, {
                          method: "POST",
                          credentials: "include",
                          headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify(v),
                        });

                        if (!res.ok) throw new Error(await res.text());

                        toast.success("Salary definition created", {
                          description: `${v.title} (${v.level})`,
                        });

                        await fetchSalaryDefinitions();
                      } catch (e) {
                        const message = e instanceof Error ? e.message : "Unknown error";
                        toast.error("Failed to create salary definition", {
                          description: message,
                        });
                      }
                    }}
                    trigger={
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                        Create salary definition
                      </Button>
                    }
                  />
                )}
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
                      <TableCell className="text-right tabular-nums">
                        {currency(r.allowance)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {currency(r.gross)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-rose-600">
                        −{currency(r.deductions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {currency(r.net)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {canEditPayroll && (
                            <SalaryDefinitionEditSheet
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  type="button"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                              definition={
                                editTarget?.id === r.id
                                  ? {
                                      id: editTarget?.mongoId ?? r.id,
                                      title: r.title,
                                      level: r.level,
                                      basic: r.basic,
                                      allowance: r.allowance,
                                      deductions: r.deductions,
                                    }
                                  : {
                                      id: r.mongoId ?? r.id,
                                      title: r.title,
                                      level: r.level,
                                      basic: r.basic,
                                      allowance: r.allowance,
                                      deductions: r.deductions,
                                    }
                              }
                              onUpdated={(next) => {
                                setSalaryRows((prev) =>
                                  prev.map((row) =>
                                    row.id === r.id
                                      ? {
                                          ...row,
                                          title: next.title,
                                          level: next.level,
                                          basic: next.basic,
                                          allowance: next.allowance,
                                          deductions: next.deductions,
                                          gross: next.basic + next.allowance,
                                          net: next.basic + next.allowance - next.deductions,
                                        }
                                      : row,
                                  ),
                                );
                                setEditTarget(null);
                              }}
                            />
                          )}

                          {canDeletePayroll && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-600 hover:text-rose-600"
                              onClick={() => setDeleteTarget(r)}
                              aria-label={`Delete ${r.title}`}
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
                        colSpan={9}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No salary definitions yet. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
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

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove salary definition?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  This removes{" "}
                  <span className="font-medium text-foreground">{deleteTarget.title}</span> (
                  {deleteTarget.level}) from this list. This does not affect historical payroll
                  runs.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteSalaryRow}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
