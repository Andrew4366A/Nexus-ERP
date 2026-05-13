import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                active && "border-primary bg-primary text-primary-foreground",
                done && "border-primary bg-primary/10 text-primary",
                !active && !done && "border-border text-muted-foreground",
              )}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-medium truncate",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="mx-1 h-px flex-1 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function StepBody({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}
