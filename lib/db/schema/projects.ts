import { pgTable, varchar } from "drizzle-orm/pg-core";

/** Project names referenced by stock movements (CreatableSelect source). */
export const projects = pgTable("projects", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 200 }).notNull().unique(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
