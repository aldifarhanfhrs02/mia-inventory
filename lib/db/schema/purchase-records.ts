import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import type { PurchaseStatus } from "@/lib/types";
import { parts } from "./parts";
import { users } from "./users";

/** Purchase records — append-only history of orders for a part. */
export const purchaseRecords = pgTable(
  "purchase_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    partId: varchar("part_id", { length: 36 })
      .notNull()
      .references(() => parts.id),
    requestDate: date("request_date", { mode: "date" }).notNull(),
    status: varchar("status", { length: 20 })
      .$type<PurchaseStatus>()
      .notNull()
      .default("requested"),
    supplier: varchar("supplier", { length: 200 }),
    poNumber: varchar("po_number", { length: 100 }),
    qtyOrdered: integer("qty_ordered").notNull(),
    expectedArrival: date("expected_arrival", { mode: "date" }),
    receivedDate: date("received_date", { mode: "date" }),
    notes: text("notes"),
    createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("qty_ordered_positive", sql`${t.qtyOrdered} > 0`),
    index("idx_purchase_status_eta").on(t.status, t.expectedArrival),
  ],
);

export type PurchaseRecordRow = typeof purchaseRecords.$inferSelect;
export type NewPurchaseRecordRow = typeof purchaseRecords.$inferInsert;
