import "server-only";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth/session";
import { formatStorageAddr } from "@/lib/utils/barcode";
import { computeStockStatus } from "@/lib/utils/stock";
import type { PartWithStock } from "@/lib/types";

/**
 * Active parts that have a storage location assigned, with computed current
 * stock — the audit pool for the Stock Taking page. Sorted by storage address.
 */
export async function getStockTakingRows(): Promise<PartWithStock[]> {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const rows = await db.execute(sql`
    SELECT
      p.*,
      COALESCE(SUM(CASE WHEN sm.type IN ('INITIAL','IN') THEN sm.quantity ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0)
        AS current_stock
    FROM parts p
    LEFT JOIN stock_movements sm ON sm.part_id = p.id
    WHERE p.deleted_at IS NULL AND p.status = 'active' AND p.storage_type IS NOT NULL
    GROUP BY p.id
  `);

  const list = (rows.rows as unknown as Record<string, unknown>[]).map((r) => {
    const currentStock = Number(r.current_stock ?? 0);
    const minStock = Number(r.min_stock ?? 0);
    return {
      id: String(r.id),
      partCode: String(r.part_code),
      partName: String(r.part_name),
      maker: String(r.maker),
      type: r.type as PartWithStock["type"],
      category: String(r.category),
      unit: r.unit as PartWithStock["unit"],
      description: (r.description as string | null) ?? null,
      remarks: (r.remarks as string | null) ?? null,
      storageType: (r.storage_type as PartWithStock["storageType"]) ?? null,
      storageNumber: (r.storage_number as number | null) ?? null,
      storageBox: (r.storage_box as number | null) ?? null,
      storageBoxKecil: (r.storage_box_kecil as number | null) ?? null,
      barcode: (r.barcode as string | null) ?? null,
      minStock,
      stdStock: (r.std_stock as number | null) ?? null,
      maxStock: (r.max_stock as number | null) ?? null,
      price: (r.price as number | null) ?? null,
      status: "active" as const,
      deletedAt: null,
      createdBy: (r.created_by as string | null) ?? null,
      updatedBy: (r.updated_by as string | null) ?? null,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
      currentStock,
      stockStatus: computeStockStatus("active", currentStock, minStock),
      storageAddr: formatStorageAddr(
        (r.storage_type as string | null) ?? null,
        (r.storage_number as number | null) ?? null,
        (r.storage_box as number | null) ?? null,
        (r.storage_box_kecil as number | null) ?? null,
      ),
    } satisfies PartWithStock;
  });

  return list.sort((a, b) => a.storageAddr.localeCompare(b.storageAddr));
}
