import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/domain/types";

const STYLES: Record<string, string> = {
  accepted: "bg-success/15 text-success border-success/30",
  checked_in: "bg-success/15 text-success border-success/30",
  checked_out: "bg-info/15 text-info border-info/30",
  pending: "bg-warning/20 text-foreground border-warning/40",
  reschedule: "bg-warning/20 text-foreground border-warning/40",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  vip: "bg-vip/20 text-foreground border-vip/40",
  regular: "bg-muted text-muted-foreground border-border",
  service_utility: "bg-info/15 text-info border-info/30",
};

const LABELS: Record<string, string> = {
  accepted: "Accepted",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  pending: "Pending",
  reschedule: "Reschedule",
  rejected: "Rejected",
  cancelled: "Cancelled",
  vip: "VIP",
  regular: "Regular",
  service_utility: "Service & Utility",
};

export function StatusBadge({
  status,
  className,
}: {
  status: BookingStatus | "vip" | "regular" | "service_utility";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[status] ?? STYLES.pending,
        className,
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
