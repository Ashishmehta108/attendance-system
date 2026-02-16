import { getRedisConnection } from "@attendance-app/db";

const TTL_AGGREGATE = 60;
const TTL_SUMMARY = 300;

function getClient() {
  return getRedisConnection();
}

const AGGREGATE_PREFIX = "agg:";
const SUMMARY_PREFIX = "summary:";

export async function getCachedAggregate(sessionId: string): Promise<unknown | null> {
  const key = AGGREGATE_PREFIX + sessionId;
  const raw = await getClient().get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function cacheAggregate(sessionId: string, data: unknown): Promise<void> {
  const key = AGGREGATE_PREFIX + sessionId;
  await getClient().setex(key, TTL_AGGREGATE, JSON.stringify(data));
}

export async function invalidateAggregate(sessionId: string): Promise<void> {
  await getClient().del(AGGREGATE_PREFIX + sessionId);
}

export async function getCachedSummary(sessionId: string): Promise<unknown | null> {
  const key = SUMMARY_PREFIX + sessionId;
  const raw = await getClient().get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function cacheSummary(sessionId: string, data: unknown): Promise<void> {
  const key = SUMMARY_PREFIX + sessionId;
  await getClient().setex(key, TTL_SUMMARY, JSON.stringify(data));
}

export async function invalidateSummary(sessionId: string): Promise<void> {
  await getClient().del(SUMMARY_PREFIX + sessionId);
}
