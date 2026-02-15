import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let connection: Redis | null = null;

/** BullMQ-compatible Redis connection (use maxRetriesPerRequest: null in workers) */
export function getRedisConnection(options?: { maxRetriesPerRequest: number | null }): Redis {
  if (!connection) {
    connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: options?.maxRetriesPerRequest ?? undefined,
    });
  }
  return connection;
}

/** For BullMQ Worker: use maxRetriesPerRequest: null */
export function getWorkerRedisConnection(): Redis {
  return new Redis(REDIS_URL, { maxRetriesPerRequest: null });
}
