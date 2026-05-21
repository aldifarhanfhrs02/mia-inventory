"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  rawValue: number | null;
  /** Tailwind text-color class for the accent, e.g. "text-chart-1". */
  accentClass: string;
  /** Tailwind border-left-color class, e.g. "border-l-chart-1". */
  borderClass: string;
  /** Tailwind background class for the icon chip, e.g. "bg-chart-1/15". */
  iconBgClass: string;
  Icon: LucideIcon;
  onClick?: () => void;
}

/** Count a value up from 0 over ~900ms once the card mounts. */
function useCountUp(target: number | null, duration = 900): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (target === null) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

/** Dashboard metric card with an animated count-up and a colored left border. */
export function KpiCard({
  title,
  rawValue,
  accentClass,
  borderClass,
  iconBgClass,
  Icon,
  onClick,
}: KpiCardProps) {
  const display = useCountUp(rawValue);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-l-4 bg-card p-4 text-left shadow-sm transition-colors",
        borderClass,
        onClick && "hover:bg-accent/40",
      )}
    >
      <div className={cn("rounded-md p-2", iconBgClass)}>
        <Icon className={cn("h-5 w-5", accentClass)} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {title}
        </p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {rawValue === null ? "—" : display.toLocaleString("id-ID")}
        </p>
      </div>
    </button>
  );
}
