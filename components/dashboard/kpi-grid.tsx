"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Package,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { KpiCard } from "@/components/shared/kpi-card";
import { useAssetsVisible } from "@/lib/hooks/use-assets-visible";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";
import type { DashboardKpi } from "@/lib/types";

interface CardDef {
  key: Exclude<keyof DashboardKpi, "totalAsset">;
  title: string;
  Icon: LucideIcon;
  accentClass: string;
  borderClass: string;
  iconBgClass: string;
  /** Filter applied to the Master Part page when the card is clicked. */
  filter?: string;
}

const CARDS: CardDef[] = [
  {
    key: "totalParts",
    title: "Total Parts",
    Icon: Package,
    accentClass: "text-chart-1",
    borderClass: "border-l-chart-1",
    iconBgClass: "bg-chart-1/15",
  },
  {
    key: "available",
    title: "Available",
    Icon: CheckCircle2,
    accentClass: "text-chart-2",
    borderClass: "border-l-chart-2",
    iconBgClass: "bg-chart-2/15",
    filter: "available",
  },
  {
    key: "lowStock",
    title: "Low Stock",
    Icon: AlertTriangle,
    accentClass: "text-chart-3",
    borderClass: "border-l-chart-3",
    iconBgClass: "bg-chart-3/15",
    filter: "low_stock",
  },
  {
    key: "outOfStock",
    title: "Out of Stock",
    Icon: XCircle,
    accentClass: "text-chart-4",
    borderClass: "border-l-chart-4",
    iconBgClass: "bg-chart-4/15",
    filter: "out_of_stock",
  },
  {
    key: "unassigned",
    title: "Unassigned",
    Icon: HelpCircle,
    accentClass: "text-chart-5",
    borderClass: "border-l-chart-5",
    iconBgClass: "bg-chart-5/15",
    filter: "unassigned",
  },
];

/** Special-case the Total Asset card: Rp format + eye toggle for sensitivity. */
function TotalAssetCard({ value }: { value: number | null }) {
  const { visible, toggle, mounted } = useAssetsVisible();
  const display =
    value == null ? "—" : visible || !mounted ? formatPrice(value) : "Rp •••";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-l-4 border-l-primary bg-card p-4 text-left shadow-sm">
      <div className="rounded-md bg-primary/15 p-2">
        <Wallet className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">
          Total Asset
        </p>
        <p
          className={cn(
            "truncate text-lg font-semibold tabular-nums text-foreground",
            !visible && mounted && "tracking-widest",
          )}
        >
          {display}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        title={visible ? "Sembunyikan nilai aset" : "Tampilkan nilai aset"}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {visible ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

/** Row of 6 KPI cards. Clicking a card opens Master Part with a filter. */
export function KpiGrid({ kpi }: { kpi: DashboardKpi }) {
  const router = useRouter();
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {CARDS.map((c) => (
        <KpiCard
          key={c.key}
          title={c.title}
          rawValue={kpi[c.key]}
          Icon={c.Icon}
          accentClass={c.accentClass}
          borderClass={c.borderClass}
          iconBgClass={c.iconBgClass}
          onClick={
            c.key === "totalParts" || c.filter
              ? () =>
                  router.push(
                    c.filter ? `/parts?status=${c.filter}` : "/parts",
                  )
              : undefined
          }
        />
      ))}
      <TotalAssetCard value={kpi.totalAsset} />
    </div>
  );
}
