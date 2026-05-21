import { integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import type { SearchSummary } from "@/lib/types";
import { users } from "./users";

/** Optional audit of Part Search uploads — stores only the summary, not results. */
export const searchLogs = pgTable("search_logs", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  rowCount: integer("row_count").notNull(),
  summary: jsonb("summary").$type<SearchSummary>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SearchLogRow = typeof searchLogs.$inferSelect;
export type NewSearchLogRow = typeof searchLogs.$inferInsert;
