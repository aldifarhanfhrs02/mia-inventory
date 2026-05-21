import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import type { UserRole, UserStatus } from "@/lib/types";

/** Application users. NIK is the login identifier — no email, no self-signup. */
export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nik: varchar("nik", { length: 20 }).notNull().unique(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 })
    .$type<UserRole>()
    .notNull()
    .default("user"),
  status: varchar("status", { length: 20 })
    .$type<UserStatus>()
    .notNull()
    .default("active"),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
