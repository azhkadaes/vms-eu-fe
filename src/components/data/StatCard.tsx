import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  hint,
  accent = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  accent?: "default" | "primary" | "success" | "warning" | "destructive" | "info" | "vip";
  className?: string;
}) {
  const accentBg: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-foreground",
    destructive: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
    vip: "bg-vip/20 text-foreground",
  };
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", accentBg[accent])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
