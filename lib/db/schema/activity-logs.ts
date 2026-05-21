import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import type { ActivityAction, EntityType } from "@/lib/types";
import { users } from "./users";

/** Audit trail — one row per data mutation, written inside the same txn. */
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    action: varchar("action", { length: 50 }).$type<ActivityAction>().notNull(),
    entityType: varchar("entity_type", { length: 50 })
      .$type<EntityType>()
      .notNull(),
    entityId: varchar("entity_id", { length: 36 }),
    changes: jsonb("changes").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_activity_logs_created_at").on(t.createdAt),
    index("idx_activity_logs_action").on(t.action, t.createdAt),
  ],
);

export type ActivityLogRow = typeof activityLogs.$inferSelect;
export type NewActivityLogRow = typeof activityLogs.$inferInsert;
