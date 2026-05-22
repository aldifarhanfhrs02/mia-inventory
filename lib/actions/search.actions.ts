"use server";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { searchLogs } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { SearchUploadSchema } from "@/lib/validations/search.schema";
import { formatStorageAddr } from "@/lib/utils/barcode";
import { computeStockStatus } from "@/lib/utils/stock";
import type {
  ActionResult,
  PartWithStock,
  SearchInputRow,
  SearchResult,
  SearchSummary,
} from "@/lib/types";

/** Load active, non-deleted parts decorated with computed current stock. */
async function loadActiveParts(): Promise<PartWithStock[]> {
  const rows = await db.execute(sql`
    SELECT
      p.*,
      COALESCE(SUM(CASE WHEN sm.type IN ('INITIAL','IN') THEN sm.quantity ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0)
        AS current_stock
    FROM parts p
    LEFT JOIN stock_movements sm ON sm.part_id = p.id
    WHERE p.deleted_at IS NULL AND p.status = 'active'
    GROUP BY p.id
  `);

  return (rows.rows as unknown as Record<string, unknown>[]).map((r) => {
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
      status: "active",
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
    };
  });
}

/**
 * Match uploaded rows against the active parts pool — PRD-BACKEND §7.5.
 * L1: exact part-code → exact / shortage. L2: fuzzy name+maker → possible.
 * L3: not found.
 */
export async function searchParts(
  fileName: string,
  rows: SearchInputRow[],
): Promise<ActionResult<{ results: SearchResult[]; summary: SearchSummary }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const parsed = SearchUploadSchema.safeParse({ fileName, rows });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "File tidak valid",
    };
  }

  const active = await loadActiveParts();

  const results: SearchResult[] = parsed.data.rows.map((sr) => {
    // Level 1 — exact part-code match.
    if (sr.partCode.trim()) {
      const codeNorm = sr.partCode.trim().toUpperCase();
      const match = active.find(
        (p) => p.partCode.toUpperCase() === codeNorm,
      );
      if (match) {
        const shortage = sr.qtyNeeded > match.currentStock;
        return {
          ...sr,
          status: shortage ? "shortage" : "exact",
          matchedPart: match,
          candidates: [],
          note: shortage
            ? `Stok tersedia ${match.currentStock} ${match.unit}, dibutuhkan ${sr.qtyNeeded}`
            : `Stok cukup: ${match.currentStock} ${match.unit}`,
        };
      }
    }

    // Level 2 — fuzzy name + maker match (up to 3 candidates).
    const words = sr.partName.toLowerCase().split(/\s+/);
    const makerLower = sr.maker.trim().toLowerCase();
    const candidates = active
      .filter((p) => {
        const name = p.partName.toLowerCase();
        const nameHit = words.some((w) => w.length > 2 && name.includes(w));
        const makerHit =
          !makerLower || p.maker.toLowerCase().includes(makerLower);
        return nameHit && makerHit;
      })
      .slice(0, 3);

    if (candidates.length > 0) {
      return {
        ...sr,
        status: "possible",
        matchedPart: null,
        candidates,
        note: `${candidates.length} kemungkinan cocok ditemukan`,
      };
    }

    // Level 3 — not found.
    return {
      ...sr,
      status: "not_found",
      matchedPart: null,
      candidates: [],
      note: "Tidak ditemukan di database",
    };
  });

  const summary: SearchSummary = {
    exact: results.filter((r) => r.status === "exact").length,
    possible: results.filter((r) => r.status === "possible").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    shortage: results.filter((r) => r.status === "shortage").length,
    total: results.length,
  };

  await db.insert(searchLogs).values({
    userId: session.user.id,
    fileName: parsed.data.fileName,
    rowCount: results.length,
    summary,
  });

  return { ok: true, data: { results, summary } };
}
