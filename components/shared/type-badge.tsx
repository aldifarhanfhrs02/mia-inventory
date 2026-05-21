import { cn } from "@/lib/utils";
import type { PartType } from "@/lib/types";

const MAP: Record<PartType, { label: string; className: string }> = {
  electrical: {
    label: "Electrical",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  },
  mechanical: {
    label: "Mechanical",
    className: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
  },
  fabrication: {
    label: "Fabrication",
    className: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  },
};

/** Part-type pill — Electrical (blue), Mechanical (purple), Fabrication (teal). */
export function TypeBadge({ type }: { type: PartType }) {
  const m = MAP[type];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
        m.className,
      )}
    >
      {m.label}
    </span>
  );
}
