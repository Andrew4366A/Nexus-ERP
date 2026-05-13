import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

const data = [
  { month: "Jan", value: 2400 },
  { month: "Feb", value: 1980 },
  { month: "Mar", value: 3100 },
  { month: "Apr", value: 2780 },
  { month: "May", value: 3890 },
  { month: "Jun", value: 3490 },
  { month: "Jul", value: 4200 },
  { month: "Aug", value: 3800 },
  { month: "Sep", value: 4600 },
  { month: "Oct", value: 5100 },
  { month: "Nov", value: 4780 },
  { month: "Dec", value: 5640 },
];

export function StockChart() {
  return (
    <Card className="p-6 shadow-[var(--shadow-card)] border-border/60">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold">Monthly Stock Issued</h3>
          <p className="text-sm text-muted-foreground mt-1">Units released from warehouse</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">46,290</p>
          <p className="text-xs text-emerald-600 font-medium">+12.4% vs last year</p>
        </div>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.546 0.215 262.881)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="oklch(0.546 0.215 262.881)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.929 0.013 255.508)" vertical={false} />
            <XAxis dataKey="month" stroke="oklch(0.554 0.046 257.417)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.554 0.046 257.417)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                boxShadow: "var(--shadow-card)",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="oklch(0.546 0.215 262.881)"
              strokeWidth={2.5}
              fill="url(#stockFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
