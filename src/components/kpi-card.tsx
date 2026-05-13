import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta: number;
  helper: string;
  icon: LucideIcon;
}

export function KpiCard({ label, value, delta, helper, icon: Icon }: KpiCardProps) {
  const positive = delta >= 0;
  return (
    <Card className="p-6 shadow-[var(--shadow-card)] border-border/60">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
            positive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600",
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta)}%
        </span>
        <span className="text-muted-foreground">{helper}</span>
      </div>
    </Card>
  );
}
