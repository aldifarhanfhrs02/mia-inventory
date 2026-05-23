import "server-only";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth/session";
import { computeAlertSeverity, computeStockStatus } from "@/lib/utils/stock";
import type {
  ActivityFeedItem,
  AlertStockItem,
  DashboardData,
  MovementTrend,
  MovementTrendPoint,
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
  price: number | null;
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
  if (!session) redirect("/login");

  const partRowsRaw = await db.execute(sql`
    SELECT
      p.id,
      p.type,
      p.status,
      p.part_name  AS "partName",
      p.part_code  AS "partCode",
      p.min_stock  AS "minStock",
      p.price      AS "price",
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
    price: r.price == null ? null : Number(r.price),
    currentStock: Number(r.currentStock),
  }));

  // Inactive parts are excluded from KPIs, health, distribution, breakdown.
  const visible = parts.filter((p) => p.status !== "inactive");

  let available = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let unassigned = 0;
  let totalAsset = 0;
  const perType: Record<PartType, TypeBreakdown> = {
    Electrical: { ...emptyBreakdown("Electrical"), totalAsset: 0 },
    Mechanical: { ...emptyBreakdown("Mechanical"), totalAsset: 0 },
    Fabrication: { ...emptyBreakdown("Fabrication"), totalAsset: 0 },
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
    // Asset value = price × currentStock (skip rows with no price).
    if (p.price != null && p.currentStock > 0) {
      const asset = p.price * p.currentStock;
      totalAsset += asset;
      bucket.totalAsset = (bucket.totalAsset ?? 0) + asset;
    }
  }

  const stockHealth = [
    { name: "Available", value: available, color: CHART_COLOR.available },
    { name: "Low Stock", value: lowStock, color: CHART_COLOR.low_stock },
    { name: "Out of Stock", value: outOfStock, color: CHART_COLOR.out_of_stock },
    { name: "Unassigned", value: unassigned, color: CHART_COLOR.unassigned },
  ];

  const TYPE_LABEL: Record<PartType, string> = {
    Electrical: "Electrical",
    Mechanical: "Mechanical",
    Fabrication: "Fabrication",
  };
  const TYPE_COLOR: Record<PartType, string> = {
    Electrical: "hsl(var(--chart-1))",
    Mechanical: "hsl(var(--chart-5))",
    Fabrication: "hsl(var(--chart-2))",
  };

  const typeDistribution = (
    ["Electrical", "Mechanical", "Fabrication"] as PartType[]
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

  const movementTrend = await loadMovementTrend();

  return {
    kpi: {
      totalParts: visible.length,
      available,
      lowStock,
      outOfStock,
      unassigned,
      totalAsset,
    },
    stockHealth,
    typeDistribution,
    perType,
    alertStock,
    recentActivity,
    movementTrend,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Movement-trend aggregation (Stock IN / Stock OUT over time)
// ─────────────────────────────────────────────────────────────────────────────

interface MovementBucketRow {
  bucket: string;
  type: "IN" | "OUT";
  qty: string | number;
  count: string | number;
}

const MONTH_LABEL = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** ISO week number (1-53). */
function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

/** Build an array of empty buckets stepping back from "today". */
function emptyBuckets(
  unit: "day" | "week" | "month",
  count: number,
): MovementTrendPoint[] {
  const now = new Date();
  const points: MovementTrendPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (unit === "day") {
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      points.push({
        iso: d.toISOString().slice(0, 10),
        label: `${String(d.getDate()).padStart(2, "0")} ${MONTH_LABEL[d.getMonth()]}`,
        in: { qty: 0, count: 0 },
        out: { qty: 0, count: 0 },
      });
    } else if (unit === "week") {
      d.setDate(now.getDate() - i * 7);
      // Snap to Monday of that week (UTC ISO week start).
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1);
      d.setHours(0, 0, 0, 0);
      points.push({
        iso: d.toISOString().slice(0, 10),
        label: `W${isoWeek(d)}`,
        in: { qty: 0, count: 0 },
        out: { qty: 0, count: 0 },
      });
    } else {
      d.setMonth(now.getMonth() - i, 1);
      d.setHours(0, 0, 0, 0);
      points.push({
        iso: d.toISOString().slice(0, 10),
        label: `${MONTH_LABEL[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        in: { qty: 0, count: 0 },
        out: { qty: 0, count: 0 },
      });
    }
  }
  return points;
}

/** Run the SQL for one granularity and fold the rows into pre-built buckets. */
async function bucketize(
  unit: "day" | "week" | "month",
  count: number,
): Promise<MovementTrendPoint[]> {
  const buckets = emptyBuckets(unit, count);
  const earliest = buckets[0].iso;

  const raw = await db.execute(sql`
    SELECT
      to_char(date_trunc(${unit}, created_at), 'YYYY-MM-DD') AS bucket,
      type,
      SUM(quantity)::int AS qty,
      COUNT(*)::int AS count
    FROM stock_movements
    WHERE type IN ('IN','OUT')
      AND created_at >= ${earliest}::date
    GROUP BY 1, 2
  `);

  // Index buckets by iso key for O(1) lookup.
  const byIso = new Map(buckets.map((b) => [b.iso, b]));
  for (const r of raw.rows as unknown as MovementBucketRow[]) {
    const target = byIso.get(r.bucket);
    if (!target) continue;
    const qty = Number(r.qty);
    const cnt = Number(r.count);
    if (r.type === "IN") target.in = { qty, count: cnt };
    else target.out = { qty, count: cnt };
  }
  return buckets;
}

/** Build the 3 granularities for the Stock Movement chart. */
async function loadMovementTrend(): Promise<MovementTrend> {
  const [daily, weekly, monthly] = await Promise.all([
    bucketize("day", 7),
    bucketize("week", 8),
    bucketize("month", 6),
  ]);
  return { daily, weekly, monthly };
}
