import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Drizzle client backed by a pg Pool. The pool is cached on globalThis so
 * Next.js HMR in development does not open a new pool on every reload.
 */
const globalForDb = globalThis as unknown as { __miaPool?: Pool };

const pool =
  globalForDb.__miaPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__miaPool = pool;
}

export const db = drizzle(pool, { schema });

export { schema };
