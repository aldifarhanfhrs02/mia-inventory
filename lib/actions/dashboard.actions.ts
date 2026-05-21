import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth/session";
import { computeAlertSeverity, computeStockStatus } from "@/lib/utils/stock";
import type {
  ActivityFeedItem,
  AlertStockItem,
  DashboardData,
  PartType,
  StockStatus,
  TypeBreakdown,
} from "@/lib/types";

const CHART_COLOR: Record<StockStatus, string> = {
  available: "hsl(var(--chart-2))",
  low_stock: "hsl(var(--chart-3))",
  out_of_stock: "hsl(var(--chart-4))",
  unassigned: "hsl(var(--chart-5))",
};

interface PartStockRow {
  id: string;
  type: PartType;
  status: "active" | "inactive" | "unassigned";
  partName: string;
  partCode: string;
  minStock: number;
  currentStock: number;
}

interface ActivityRow {
  id: string;
  action: string;
  createdAt: Date;
  userName: string;
  partName: string | null;
  partCode: string | null;
  changes: Record<string, unknown> | null;
}

const emptyBreakdown = (type: PartType): TypeBreakdown => ({
  type,
  total: 0,
  available: 0,
  lowStock: 0,
  outOfStock: 0,
  unassigned: 0,
  totalAsset: null,
});

/**
 * Aggregate every dashboard widget in one pass. `current_stock` is computed
 * from stock_movements (never stored) — see PRD-BACKEND §3.1.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  const partRowsRaw = await db.execute(sql`
    SELECT
      p.id,
      p.type,
      p.status,
      p.part_name  AS "partName",
      p.part_code  AS "partCode",
      p.min_stock  AS "minStock",
      COALESCE(SUM(CASE WHEN sm.type IN ('INITIAL','IN') THEN sm.quantity ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0)
        AS "currentStock"
    FROM parts p
    LEFT JOIN stock_movements sm ON sm.part_id = p.id
    WHERE p.deleted_at IS NULL
    GROUP BY p.id
  `);

  // pg returns SUM/min_stock as strings — coerce to numbers.
  const parts = (partRowsRaw.rows as unknown as PartStockRow[]).map((r) => ({
    ...r,
    minStock: Number(r.minStock),
    currentStock: Number(r.currentStock),
  }));

  // Inactive parts are excluded from KPIs, health, distribution, breakdown.
  const visible = parts.filter((p) => p.status !== "inactive");

  let available = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let unassigned = 0;
  const perType: Record<PartType, TypeBreakdown> = {
    electrical: emptyBreakdown("electrical"),
    mechanical: emptyBreakdown("mechanical"),
    fabrication: emptyBreakdown("fabrication"),
  };

  for (const p of visible) {
    const status = computeStockStatus(p.status, p.currentStock, p.minStock);
    const bucket = perType[p.type];
    bucket.total++;
    if (status === "available") {
      available++;
      bucket.available++;
    } else if (status === "low_stock") {
      lowStock++;
      bucket.lowStock++;
    } else if (status === "out_of_stock") {
      outOfStock++;
      bucket.outOfStock++;
    } else {
      unassigned++;
      bucket.unassigned++;
    }
  }

  const stockHealth = [
    { name: "Available", value: available, color: CHART_COLOR.available },
    { name: "Low Stock", value: lowStock, color: CHART_COLOR.low_stock },
    { name: "Out of Stock", value: outOfStock, color: CHART_COLOR.out_of_stock },
    { name: "Unassigned", value: unassigned, color: CHART_COLOR.unassigned },
  ];

  const TYPE_LABEL: Record<PartType, string> = {
    electrical: "Electrical",
    mechanical: "Mechanical",
    fabrication: "Fabrication",
  };
  const TYPE_COLOR: Record<PartType, string> = {
    electrical: "hsl(var(--chart-1))",
    mechanical: "hsl(var(--chart-5))",
    fabrication: "hsl(var(--chart-2))",
  };

  const typeDistribution = (
    ["electrical", "mechanical", "fabrication"] as PartType[]
  ).map((type) => {
    const b = perType[type];
    const seg = (n: number) => (b.total > 0 ? Math.round((n / b.total) * 100) : 0);
    return {
      type: TYPE_LABEL[type],
      count: b.total,
      color: TYPE_COLOR[type],
      segments: [
        { pct: seg(b.available), color: CHART_COLOR.available },
        { pct: seg(b.lowStock), color: CHART_COLOR.low_stock },
        { pct: seg(b.outOfStock), color: CHART_COLOR.out_of_stock },
        { pct: seg(b.unassigned), color: CHART_COLOR.unassigned },
      ],
    };
  });

  const alertStock: AlertStockItem[] = visible
    .filter(
      (p) => p.status === "active" && p.currentStock < p.minStock,
    )
    .map((p) => ({
      id: p.id,
      partName: p.partName,
      partCode: p.partCode,
      type: p.type,
      currentStock: p.currentStock,
      minStock: p.minStock,
      severity: computeAlertSeverity(p.currentStock, p.minStock),
    }))
    .sort((a, b) => {
      const rank = { empty: 0, critical: 1, low: 2 };
      return (
        rank[a.severity] - rank[b.severity] ||
        a.currentStock - b.currentStock
      );
    });

  const activityRaw = await db.execute(sql`
    SELECT
      a.id,
      a.action,
      a.created_at AS "createdAt",
      u.full_name  AS "userName",
      p.part_name  AS "partName",
      p.part_code  AS "partCode",
      a.changes
    FROM activity_logs a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN parts p ON p.id = a.entity_id
    WHERE a.action IN ('STOCK_IN','STOCK_OUT','UPDATE','CREATE')
    ORDER BY a.created_at DESC
    LIMIT 10
  `);

  const recentActivity: ActivityFeedItem[] = (
    activityRaw.rows as unknown as ActivityRow[]
  ).map((r) => {
    const created = new Date(r.createdAt);
    const qty = Number(
      (r.changes as { quantity?: number } | null)?.quantity ?? 0,
    );
    return {
      id: r.id,
      type: r.action as ActivityFeedItem["type"],
      userName: r.userName,
      partName: r.partName ?? "—",
      partCode: r.partCode ?? "—",
      quantity: qty,
      time: created.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: created.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  });

  return {
    kpi: {
      totalParts: visible.length,
      available,
      lowStock,
      outOfStock,
      unassigned,
      totalAsset: null,
    },
    stockHealth,
    typeDistribution,
    perType,
    alertStock,
    recentActivity,
  };
}
