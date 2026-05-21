"use client";

import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Package,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { KpiCard } from "@/components/shared/kpi-card";
import type { DashboardKpi } from "@/lib/types";

interface CardDef {
  key: keyof DashboardKpi;
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
  {
    key: "totalAsset",
    title: "Total Asset",
    Icon: Wallet,
    accentClass: "text-primary",
    borderClass: "border-l-primary",
    iconBgClass: "bg-primary/15",
  },
];

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
    </div>
  );
}
