import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import type { PartStatus, PartType, StorageType, UnitType } from "@/lib/types";
import { users } from "./users";

/**
 * Master parts table. `current_stock` is intentionally absent — it is always
 * computed from stock_movements. Deletes are soft (deleted_at).
 */
export const parts = pgTable(
  "parts",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    partCode: varchar("part_code", { length: 50 }).notNull().unique(),
    partName: varchar("part_name", { length: 200 }).notNull(),
    maker: varchar("maker", { length: 100 }).notNull(),
    type: varchar("type", { length: 20 }).$type<PartType>().notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    unit: varchar("unit", { length: 20 }).$type<UnitType>().notNull(),
    description: text("description"),
    remarks: text("remarks"),

    // Storage location — all four null when unassigned.
    storageType: varchar("storage_type", { length: 5 }).$type<StorageType>(),
    storageNumber: integer("storage_number"),
    storageBox: integer("storage_box"),
    storageBoxKecil: integer("storage_box_kecil"),
    barcode: varchar("barcode", { length: 10 }),

    // Stock thresholds — current stock is computed, never stored here.
    minStock: integer("min_stock").notNull().default(0),
    stdStock: integer("std_stock"),
    maxStock: integer("max_stock"),

    // Unit price in Rupiah (used by the table, forms, and purchase estimate).
    price: integer("price"),

    status: varchar("status", { length: 20 })
      .$type<PartStatus>()
      .notNull()
      .default("unassigned"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
    updatedBy: varchar("updated_by", { length: 36 }).references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Barcode is unique only among active, non-deleted parts.
    uniqueIndex("idx_parts_barcode_active")
      .on(t.barcode)
      .where(sql`${t.status} = 'active' AND ${t.deletedAt} IS NULL`),
    index("idx_parts_status_deleted")
      .on(t.status, t.deletedAt)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_parts_part_name")
      .on(t.partName)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_parts_maker").on(t.maker).where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type PartRow = typeof parts.$inferSelect;
export type NewPartRow = typeof parts.$inferInsert;
