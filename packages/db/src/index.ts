import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/attendance";

const pool = new pg.Pool({ connectionString });

export const db = drizzle(pool, { schema });
export * from "./schema/index.js";
export { getRedisConnection, getWorkerRedisConnection } from "./redis.js";
