import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import type { MovementType } from "@/lib/types";
import { parts } from "./parts";
import { users } from "./users";

/**
 * Stock movements — IMMUTABLE. Never updated, never deleted. Corrections are
 * recorded as new reversal rows. stock_before/stock_after are snapshots taken
 * at transaction time.
 */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    partId: varchar("part_id", { length: 36 })
      .notNull()
      .references(() => parts.id),
    type: varchar("type", { length: 10 }).$type<MovementType>().notNull(),
    quantity: integer("quantity").notNull(),
    stockBefore: integer("stock_before").notNull(),
    stockAfter: integer("stock_after").notNull(),
    requestor: varchar("requestor", { length: 100 }).notNull(),
    inputerNik: varchar("inputer_nik", { length: 20 })
      .notNull()
      .references(() => users.nik),
    project: varchar("project", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("quantity_positive", sql`${t.quantity} > 0`),
    index("idx_movements_part_created").on(t.partId, t.createdAt),
    index("idx_movements_created_type").on(t.createdAt, t.type),
  ],
);

export type StockMovementRow = typeof stockMovements.$inferSelect;
export type NewStockMovementRow = typeof stockMovements.$inferInsert;
