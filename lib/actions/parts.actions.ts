"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  activityLogs,
  parts,
  purchaseRecords,
  stockMovements,
  users,
} from "@/lib/db/schema";
import { getServerSession, isAdmin } from "@/lib/auth/session";
import { CreatePartSchema, UpdatePartSchema } from "@/lib/validations/parts.schema";
import { generateBarcode, formatStorageAddr } from "@/lib/utils/barcode";
import { computeStockStatus } from "@/lib/utils/stock";
import type {
  ActionResult,
  ActivityAction,
  CreatePartInput,
  PartWithStock,
  PurchaseRecord,
  StockMovement,
  UpdatePartInput,
} from "@/lib/types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface GetPartsParams {
  search?: string;
  /** Multi-select filter values. Empty array = no filter. */
  type?: string[];
  status?: string[];
  maker?: string[];
  category?: string[];
  /** Source / partClass filter — e.g. ["consumable", "existing_project"]. */
  partClass?: string[];
  /** ISO date strings (YYYY-MM-DD) — inclusive range on `updatedAt`. */
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  sort?: string;
  dir?: "asc" | "desc";
}

const PAGE_SIZE = 15;

/** A parts-table row — computed stock fields plus the updater's display name. */
export type PartTableRow = PartWithStock & { updatedByName: string };

/** Fetch part rows decorated with computed current stock, status, updater. */
async function loadPartsWithStock(): Promise<PartTableRow[]> {
  const rows = await db.execute(sql`
    SELECT
      p.*,
      u.full_name AS updated_by_name,
      COALESCE(SUM(CASE WHEN sm.type IN ('INITIAL','IN') THEN sm.quantity ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0)
        AS current_stock
    FROM parts p
    LEFT JOIN stock_movements sm ON sm.part_id = p.id
    LEFT JOIN users u ON u.id = p.updated_by
    WHERE p.deleted_at IS NULL
    GROUP BY p.id, u.full_name
  `);

  return (rows.rows as unknown as Record<string, unknown>[]).map((r) => {
    const currentStock = Number(r.current_stock ?? 0);
    const minStock = Number(r.min_stock ?? 0);
    const status = r.status as PartWithStock["status"];
    return {
      id: String(r.id),
      partCode: String(r.part_code),
      partName: String(r.part_name),
      maker: String(r.maker),
      type: r.type as PartWithStock["type"],
      category: String(r.category),
      partClass:
        (r.part_class as PartWithStock["partClass"]) ?? "consumable",
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
      status,
      deletedAt: null,
      createdBy: (r.created_by as string | null) ?? null,
      updatedBy: (r.updated_by as string | null) ?? null,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
      currentStock,
      stockStatus: computeStockStatus(status, currentStock, minStock),
      storageAddr: formatStorageAddr(
        (r.storage_type as string | null) ?? null,
        (r.storage_number as number | null) ?? null,
        (r.storage_box as number | null) ?? null,
        (r.storage_box_kecil as number | null) ?? null,
      ),
      updatedByName: (r.updated_by_name as string | null) ?? "—",
    };
  });
}

/** Server-side filtered, sorted, paginated parts list. */
export async function getParts(params: GetPartsParams): Promise<{
  rows: PartTableRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const session = await getServerSession();
  if (!session) redirect("/login");

  let rows = await loadPartsWithStock();
  const {
    search = "",
    type = [],
    status = [],
    maker = [],
    category = [],
    partClass = [],
    updatedFrom = "",
    updatedTo = "",
    page = 1,
    sort = "partName",
    dir = "asc",
  } = params;

  // Inactive parts are hidden unless the status filter explicitly includes them.
  if (!status.includes("inactive")) {
    rows = rows.filter((p) => p.status !== "inactive");
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    // A numeric query targets the barcode; otherwise name / code / maker.
    if (/^\d+$/.test(q)) {
      rows = rows.filter((p) => (p.barcode ?? "").includes(q));
    } else {
      rows = rows.filter((p) =>
        [p.partName, p.partCode, p.maker, p.storageAddr, p.category]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
  }
  if (type.length) rows = rows.filter((p) => type.includes(p.type));
  if (maker.length) rows = rows.filter((p) => maker.includes(p.maker));
  if (category.length)
    rows = rows.filter((p) => category.includes(p.category));
  if (partClass.length)
    rows = rows.filter((p) => partClass.includes(p.partClass));
  if (status.length) {
    rows = rows.filter((p) =>
      status.some((s) =>
        s === "inactive" ? p.status === "inactive" : p.stockStatus === s,
      ),
    );
  }
  if (updatedFrom) {
    const from = new Date(updatedFrom);
    from.setHours(0, 0, 0, 0);
    rows = rows.filter((p) => new Date(p.updatedAt) >= from);
  }
  if (updatedTo) {
    const to = new Date(updatedTo);
    to.setHours(23, 59, 59, 999);
    rows = rows.filter((p) => new Date(p.updatedAt) <= to);
  }

  rows.sort((a, b) => {
    const av = a[sort as keyof PartWithStock];
    const bv = b[sort as keyof PartWithStock];
    let cmp = 0;
    if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv));
    return dir === "asc" ? cmp : -cmp;
  });

  const total = rows.length;
  const start = (page - 1) * PAGE_SIZE;
  return {
    rows: rows.slice(start, start + PAGE_SIZE),
    total,
    page,
    pageSize: PAGE_SIZE,
  };
}

/** Filter options + the storage addresses / barcodes already in use. */
export async function getFilterOptions(): Promise<{
  makers: string[];
  categories: string[];
  units: string[];
  usedBarcodes: string[];
  usedAddresses: string[];
}> {
  const rows = await loadPartsWithStock();
  const active = rows.filter((r) => r.status === "active");

  // Units list = default 8 units (always present) ∪ distinct values already in DB.
  // CreatableSelect lets users add new units inline; they persist via parts.unit.
  const DEFAULT_UNITS = ["pcs", "set", "mtr", "kg", "lbr", "btg", "rol", "pak"];
  const distinctUnits = rows.map((r) => r.unit).filter(Boolean);

  return {
    makers: [...new Set(rows.map((r) => r.maker))].sort(),
    categories: [...new Set(rows.map((r) => r.category))].sort(),
    units: [...new Set([...DEFAULT_UNITS, ...distinctUnits])].sort(),
    usedBarcodes: active
      .map((r) => r.barcode)
      .filter((b): b is string => !!b),
    usedAddresses: active
      .map((r) => r.storageAddr)
      .filter((a) => a !== "—"),
  };
}

/** Part detail with its purchase records, movement history, and updater name. */
export async function getPartDetail(id: string): Promise<{
  part: PartWithStock;
  purchases: PurchaseRecord[];
  movements: StockMovement[];
  updatedByName: string;
} | null> {
  const all = await loadPartsWithStock();
  const part = all.find((p) => p.id === id);
  if (!part) return null;

  const purchases = (await db
    .select()
    .from(purchaseRecords)
    .where(eq(purchaseRecords.partId, id))) as unknown as PurchaseRecord[];
  const movements = (await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.partId, id))) as unknown as StockMovement[];

  let updatedByName = "—";
  if (part.updatedBy) {
    const u = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, part.updatedBy));
    updatedByName = u[0]?.fullName ?? "—";
  }

  return { part, purchases, movements, updatedByName };
}

/** Insert an activity-log row. Call inside the mutation's transaction. */
async function logActivity(
  tx: Tx,
  userId: string,
  action: ActivityAction,
  entityId: string,
  changes: Record<string, unknown>,
) {
  await tx.insert(activityLogs).values({
    userId,
    action,
    entityType: "Part",
    entityId,
    changes,
  });
}

/** Create a part (+ INITIAL movement if initial stock > 0). Admin only. */
export async function createPart(
  input: CreatePartInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const parsed = CreatePartSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const dup = await db
    .select({ id: parts.id })
    .from(parts)
    .where(eq(parts.partCode, v.partCode));
  if (dup.length > 0) {
    return { ok: false, error: "Part Code already exists" };
  }

  const hasLocation = !!v.storageType;
  const barcode = hasLocation
    ? generateBarcode(
        v.storageType!,
        v.storageNumber!,
        v.storageBox!,
        v.storageBoxKecil!,
      )
    : null;

  try {
    const id = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(parts)
        .values({
          partCode: v.partCode,
          partName: v.partName,
          maker: v.maker,
          type: v.type,
          category: v.category,
          partClass: v.partClass,
          unit: v.unit as never,
          description: v.description ?? null,
          remarks: v.remarks ?? null,
          storageType: v.storageType ?? null,
          storageNumber: v.storageNumber ?? null,
          storageBox: v.storageBox ?? null,
          storageBoxKecil: v.storageBoxKecil ?? null,
          barcode,
          minStock: v.minStock,
          stdStock: v.stdStock ?? null,
          maxStock: v.maxStock ?? null,
          price: v.price ?? null,
          status: hasLocation ? "active" : "unassigned",
          createdBy: session.user.id,
          updatedBy: session.user.id,
        })
        .returning({ id: parts.id });

      if (v.initialStock > 0) {
        await tx.insert(stockMovements).values({
          partId: created.id,
          type: "INITIAL",
          quantity: v.initialStock,
          stockBefore: 0,
          stockAfter: v.initialStock,
          requestor: session.user.fullName,
          inputerNik: session.user.nik,
        });
      }
      await logActivity(tx, session.user.id, "CREATE", created.id, {
        after: { partCode: v.partCode, partName: v.partName },
      });
      return created.id;
    });
    revalidatePath("/parts");
    return { ok: true, data: { id } };
  } catch {
    return { ok: false, error: "Failed to save part" };
  }
}

/** Update a part's identity/stock/location fields. Admin only. */
export async function updatePart(
  id: string,
  input: UpdatePartInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const parsed = UpdatePartSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const existing = await db.select().from(parts).where(eq(parts.id, id));
  if (existing.length === 0) return { ok: false, error: "Part not found" };

  const dup = await db
    .select({ id: parts.id })
    .from(parts)
    .where(eq(parts.partCode, v.partCode));
  if (dup.some((d) => d.id !== id)) {
    return { ok: false, error: "Part Code is already used by another part" };
  }

  // Edit does NOT touch storage/barcode — location is managed by assignLocation.
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(parts)
        .set({
          partCode: v.partCode,
          partName: v.partName,
          maker: v.maker,
          type: v.type,
          category: v.category,
          partClass: v.partClass,
          unit: v.unit as never,
          description: v.description ?? null,
          remarks: v.remarks ?? null,
          minStock: v.minStock,
          stdStock: v.stdStock ?? null,
          maxStock: v.maxStock ?? null,
          price: v.price ?? null,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(parts.id, id));
      await logActivity(tx, session.user.id, "UPDATE", id, {
        after: { partCode: v.partCode, partName: v.partName },
      });
    });
    revalidatePath("/parts");
    return { ok: true, data: { id } };
  } catch {
    return { ok: false, error: "Failed to update part" };
  }
}

/** Toggle a part between active and inactive (soft, reversible). Admin only. */
export async function setPartActive(
  id: string,
  active: boolean,
): Promise<ActionResult<null>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const existing = await db.select().from(parts).where(eq(parts.id, id));
  if (existing.length === 0) return { ok: false, error: "Part not found" };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(parts)
        .set({
          status: active
            ? existing[0].storageType
              ? "active"
              : "unassigned"
            : "inactive",
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(parts.id, id));
      await logActivity(
        tx,
        session.user.id,
        active ? "REACTIVATE" : "DEACTIVATE",
        id,
        { before: { partCode: existing[0].partCode } },
      );
    });
    revalidatePath("/parts");
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Failed to change part status" };
  }
}

/** Soft-delete a part (deleted_at = now). Admin only. */
export async function deletePart(id: string): Promise<ActionResult<null>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const existing = await db
    .select()
    .from(parts)
    .where(and(eq(parts.id, id), isNull(parts.deletedAt)));
  if (existing.length === 0) return { ok: false, error: "Part not found" };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(parts)
        .set({ deletedAt: new Date(), updatedBy: session.user.id })
        .where(eq(parts.id, id));
      await logActivity(tx, session.user.id, "DELETE", id, {
        before: { partCode: existing[0].partCode, partName: existing[0].partName },
      });
    });
    revalidatePath("/parts");
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Failed to delete part" };
  }
}

/** Assign a storage location to an unassigned part. Admin only. */
export async function assignLocation(
  id: string,
  input: {
    storageType: string;
    storageNumber: number;
    storageBox: number;
    storageBoxKecil: number;
  },
): Promise<ActionResult<{ barcode: string }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const { storageType, storageNumber, storageBox, storageBoxKecil } = input;
  if (
    !storageType ||
    !(storageNumber > 0) ||
    !(storageBox > 0) ||
    !(storageBoxKecil > 0)
  ) {
    return { ok: false, error: "Fill in all location fields" };
  }

  const existing = await db.select().from(parts).where(eq(parts.id, id));
  if (existing.length === 0) return { ok: false, error: "Part not found" };

  const barcode = generateBarcode(
    storageType,
    storageNumber,
    storageBox,
    storageBoxKecil,
  );

  // Barcode must be unique among active, non-deleted parts.
  const clash = await db
    .select({ id: parts.id })
    .from(parts)
    .where(
      and(
        eq(parts.barcode, barcode),
        eq(parts.status, "active"),
        isNull(parts.deletedAt),
      ),
    );
  if (clash.some((c) => c.id !== id)) {
    return {
      ok: false,
      error: "Storage location is already used by another active part",
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(parts)
        .set({
          storageType: storageType as never,
          storageNumber,
          storageBox,
          storageBoxKecil,
          barcode,
          status: "active",
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(parts.id, id));
      await logActivity(tx, session.user.id, "ASSIGN_LOCATION", id, {
        after: { partCode: existing[0].partCode, barcode },
      });
    });
    revalidatePath("/parts");
    return { ok: true, data: { barcode } };
  } catch {
    return { ok: false, error: "Failed to assign location" };
  }
}

export interface ImportRow {
  partCode: string;
  partName: string;
  maker: string;
  type?: string;
  partClass?: string;
  category?: string;
  unit?: string;
  price?: number | null;
  initialStock?: number | null;
  minStock?: number | null;
  stdStock?: number | null;
  maxStock?: number | null;
  description?: string;
  remarks?: string;
  /** Optional storage location — all 4 must be present together. */
  storageType?: string;
  storageNumber?: number | null;
  storageBox?: number | null;
  storageBoxKecil?: number | null;
}

const VALID_TYPES = ["Electrical", "Mechanical", "Fabrication"] as const;
const VALID_CLASSES = ["consumable", "existing_project"] as const;
const VALID_UNITS = [
  "pcs",
  "set",
  "mtr",
  "kg",
  "lbr",
  "btg",
  "rol",
  "pak",
] as const;

/**
 * Bulk-import parts. Each row may include a storage location (all four fields)
 * and an `initialStock` — when present, an INITIAL movement is recorded so the
 * computed current_stock matches. Duplicate part codes are skipped. Admin only.
 */
export async function importParts(
  rows: ImportRow[],
): Promise<ActionResult<{ created: number; skipped: number }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const existing = await db
    .select({
      partCode: parts.partCode,
      barcode: parts.barcode,
      status: parts.status,
    })
    .from(parts)
    .where(isNull(parts.deletedAt));
  const taken = new Set(existing.map((e) => e.partCode.toUpperCase()));
  const usedBarcodes = new Set(
    existing
      .filter((e) => e.status === "active" && e.barcode)
      .map((e) => e.barcode as string),
  );

  let created = 0;
  let skipped = 0;
  try {
    await db.transaction(async (tx) => {
      for (const r of rows) {
        const code = r.partCode.trim();
        if (!code || !r.partName.trim() || taken.has(code.toUpperCase())) {
          skipped++;
          continue;
        }
        taken.add(code.toUpperCase());

        const type = VALID_TYPES.includes(
          r.type as (typeof VALID_TYPES)[number],
        )
          ? r.type
          : "Electrical";
        const partClass = VALID_CLASSES.includes(
          r.partClass as (typeof VALID_CLASSES)[number],
        )
          ? r.partClass
          : "consumable";
        const unit = VALID_UNITS.includes(
          (r.unit ?? "") as (typeof VALID_UNITS)[number],
        )
          ? r.unit
          : "pcs";
        const minStock = Math.max(0, Number(r.minStock ?? 0) || 0);
        const stdStock =
          r.stdStock != null
            ? Math.max(0, Number(r.stdStock) || 0)
            : null;
        const maxStock =
          r.maxStock != null
            ? Math.max(0, Number(r.maxStock) || 0)
            : null;
        // Price defaults to 0 when not provided (per spec).
        const price =
          r.price != null ? Math.max(0, Number(r.price) || 0) : 0;
        const initialStock = Math.max(0, Number(r.initialStock ?? 0) || 0);

        // Optional storage location — assign only when all four fields present
        // AND the resulting barcode isn't already in use.
        const sType = r.storageType?.trim();
        const sNum = r.storageNumber;
        const sBox = r.storageBox;
        const sBK = r.storageBoxKecil;
        const hasLoc =
          !!sType &&
          sNum != null &&
          sNum > 0 &&
          sBox != null &&
          sBox > 0 &&
          sBK != null &&
          sBK > 0;
        const barcode = hasLoc
          ? generateBarcode(sType, sNum, sBox, sBK)
          : null;
        const locAvailable = barcode == null || !usedBarcodes.has(barcode);

        const [row] = await tx
          .insert(parts)
          .values({
            partCode: code,
            partName: r.partName.trim(),
            maker: r.maker.trim() || "—",
            type: type as never,
            category: r.category?.trim() || "Uncategorized",
            partClass: partClass as never,
            unit: unit as never,
            description: r.description?.trim() || null,
            remarks: r.remarks?.trim() || null,
            minStock,
            stdStock,
            maxStock,
            price,
            storageType: hasLoc && locAvailable ? (sType as never) : null,
            storageNumber: hasLoc && locAvailable ? sNum : null,
            storageBox: hasLoc && locAvailable ? sBox : null,
            storageBoxKecil: hasLoc && locAvailable ? sBK : null,
            barcode: hasLoc && locAvailable ? barcode : null,
            status: hasLoc && locAvailable ? "active" : "unassigned",
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })
          .returning({ id: parts.id });

        if (hasLoc && locAvailable && barcode) {
          usedBarcodes.add(barcode);
        }

        // Initial stock movement so computed current_stock matches.
        if (initialStock > 0) {
          await tx.insert(stockMovements).values({
            partId: row.id,
            type: "INITIAL",
            quantity: initialStock,
            stockBefore: 0,
            stockAfter: initialStock,
            requestor: session.user.fullName,
            inputerNik: session.user.nik,
          });
        }

        await logActivity(tx, session.user.id, "IMPORT", row.id, {
          after: { partCode: code, initialStock },
        });
        created++;
      }
    });
    revalidatePath("/parts");
    return { ok: true, data: { created, skipped } };
  } catch {
    return { ok: false, error: "Failed to import parts" };
  }
}

/**
 * Every non-deleted part with computed stock — used by the export dialog when
 * the user picks the "Semua part" scope (ignoring active table filters).
 */
export async function getAllPartsForExport(): Promise<PartTableRow[]> {
  const session = await getServerSession();
  if (!session) return [];
  return loadPartsWithStock();
}

/**
 * Snapshot used by the import dialog for client-side validation:
 *   • existingCodes  — every non-deleted part code, to flag duplicates
 *   • usedBarcodes   — barcodes already held by active parts (block conflicts)
 *   • usedAddresses  — storage addresses already held by active parts
 */
export async function getImportContext(): Promise<{
  existingCodes: string[];
  usedBarcodes: string[];
  usedAddresses: string[];
}> {
  const session = await getServerSession();
  if (!session)
    return { existingCodes: [], usedBarcodes: [], usedAddresses: [] };

  const rows = await db
    .select({
      partCode: parts.partCode,
      barcode: parts.barcode,
      status: parts.status,
      storageType: parts.storageType,
      storageNumber: parts.storageNumber,
      storageBox: parts.storageBox,
      storageBoxKecil: parts.storageBoxKecil,
    })
    .from(parts)
    .where(isNull(parts.deletedAt));

  const active = rows.filter((r) => r.status === "active");
  return {
    existingCodes: rows.map((r) => r.partCode),
    usedBarcodes: active
      .map((r) => r.barcode)
      .filter((b): b is string => !!b),
    usedAddresses: active
      .map((r) =>
        formatStorageAddr(
          r.storageType,
          r.storageNumber,
          r.storageBox,
          r.storageBoxKecil,
        ),
      )
      .filter((a) => a !== "—"),
  };
}

/** Look up the display name for a user id (detail-sheet metadata). */
export async function getUserName(userId: string | null): Promise<string> {
  if (!userId) return "—";
  const rows = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId));
  return rows[0]?.fullName ?? "—";
}
