import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Ashish_m@123",
  database: "attendance",
});

if (process.env.NODE_ENV === "development") {
  console.log(`[db] Connecting to localhost:5432/attendance`);
}

export const db = drizzle(pool, { schema });
export * from "./schema/index.js";
export { getRedisConnection, getWorkerRedisConnection } from "./redis.js";