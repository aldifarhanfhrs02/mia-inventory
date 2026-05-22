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
  if (status.length) {
    rows = rows.filter((p) =>
      status.some((s) =>
        s === "inactive" ? p.status === "inactive" : p.stockStatus === s,
      ),
    );
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
  usedBarcodes: string[];
  usedAddresses: string[];
}> {
  const rows = await loadPartsWithStock();
  const active = rows.filter((r) => r.status === "active");
  return {
    makers: [...new Set(rows.map((r) => r.maker))].sort(),
    categories: [...new Set(rows.map((r) => r.category))].sort(),
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
    return { ok: false, error: "Part Code sudah ada di database" };
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
    return { ok: false, error: "Gagal menyimpan part" };
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
  if (existing.length === 0) return { ok: false, error: "Part tidak ditemukan" };

  const dup = await db
    .select({ id: parts.id })
    .from(parts)
    .where(eq(parts.partCode, v.partCode));
  if (dup.some((d) => d.id !== id)) {
    return { ok: false, error: "Part Code sudah dipakai part lain" };
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
    return { ok: false, error: "Gagal memperbarui part" };
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
  if (existing.length === 0) return { ok: false, error: "Part tidak ditemukan" };

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
    return { ok: false, error: "Gagal mengubah status part" };
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
  if (existing.length === 0) return { ok: false, error: "Part tidak ditemukan" };

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
    return { ok: false, error: "Gagal menghapus part" };
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
    return { ok: false, error: "Lengkapi semua field lokasi" };
  }

  const existing = await db.select().from(parts).where(eq(parts.id, id));
  if (existing.length === 0) return { ok: false, error: "Part tidak ditemukan" };

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
      error: "Lokasi storage sudah digunakan part aktif lain",
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
    return { ok: false, error: "Gagal assign lokasi" };
  }
}

export interface ImportRow {
  partCode: string;
  partName: string;
  maker: string;
  type?: string;
  category?: string;
  unit?: string;
}

/** Bulk-import parts. Duplicate part codes are skipped. Admin only. */
export async function importParts(
  rows: ImportRow[],
): Promise<ActionResult<{ created: number; skipped: number }>> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(session)) return { ok: false, error: "Forbidden" };

  const existing = await db.select({ partCode: parts.partCode }).from(parts);
  const taken = new Set(existing.map((e) => e.partCode.toUpperCase()));
  const TYPES = ["electrical", "mechanical", "fabrication"];

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
        const [row] = await tx
          .insert(parts)
          .values({
            partCode: code,
            partName: r.partName.trim(),
            maker: r.maker.trim() || "—",
            type: (TYPES.includes(r.type ?? "")
              ? r.type
              : "electrical") as never,
            category: r.category?.trim() || "Uncategorized",
            unit: (r.unit?.trim() || "PCS") as never,
            minStock: 0,
            status: "unassigned",
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })
          .returning({ id: parts.id });
        await logActivity(tx, session.user.id, "IMPORT", row.id, {
          after: { partCode: code },
        });
        created++;
      }
    });
    revalidatePath("/parts");
    return { ok: true, data: { created, skipped } };
  } catch {
    return { ok: false, error: "Gagal mengimpor part" };
  }
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
