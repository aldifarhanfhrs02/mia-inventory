import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/lib/types";

type StatusKey = StockStatus | "inactive";

const MAP: Record<
  StatusKey,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  available: { label: "Available", variant: "success" },
  low_stock: { label: "Low Stock", variant: "warning" },
  out_of_stock: { label: "Out of Stock", variant: "destructive" },
  unassigned: { label: "Unassigned", variant: "outlineDashed" },
  inactive: { label: "Inactive", variant: "secondary" },
};

/** Stock-status pill used across Master Part, Stock Taking, and the dashboard. */
export function StatusBadge({ status }: { status: StatusKey }) {
  const m = MAP[status] ?? MAP.unassigned;
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
