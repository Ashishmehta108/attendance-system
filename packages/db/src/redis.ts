import { Redis } from "ioredis";

const REDIS_URL = "redis://default:b4E3vRPrHoiclI7ElStJIwcUvUjtfdJe@redis-17794.crce182.ap-south-1-1.ec2.cloud.redislabs.com:17794";

let connection: Redis | null = null;

/** BullMQ-compatible Redis connection */
export function getRedisConnection(options?: { maxRetriesPerRequest: number | null }): Redis {
  if (!connection) {
    connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: options?.maxRetriesPerRequest ?? undefined,
    });
  }
  return connection;
}

/** For BullMQ Worker: always returns a fresh connection with maxRetriesPerRequest: null */
export function getWorkerRedisConnection(): Redis {
  return new Redis(REDIS_URL, { maxRetriesPerRequest: null });
}