import { Router, type Response } from "express";
import { db, classSessions, realtimeFeedback, postClassFeedback } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";
import { addSummarizationJob } from "../queues/summarization.js";
import { getCachedAggregate, cacheAggregate } from "../lib/cache.js";

const router = Router({ mergeParams: true });

router.use(requireSession);

router.get("/:sessionId", requireRole("admin", "teacher", "student"), async (req: SessionRequest, res: Response) => {
  const { sessionId } = req.params;
  if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const [row] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
  res.json(row);
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.patch("/:sessionId", requireRole("admin", "teacher"), async (req: SessionRequest, res: Response) => {
  const { sessionId } = req.params;
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const [existing] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
  if (!existing) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const status = req.body?.status;
  if (status === "ended") {
    await db
      .update(classSessions)
      .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
      .where(eq(classSessions.id, sessionId));
    await addSummarizationJob(sessionId);
  }
  const [row] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
  res.json(row!);
});

router.get("/:sessionId/aggregate", requireRole("admin", "teacher"), async (req: SessionRequest, res: Response) => {
  const { sessionId } = req.params;
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const cached = await getCachedAggregate(sessionId);
  if (cached) {
    res.json(cached);
    return;
  }
  const [session] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const realtimeRows = await db
    .select({ value: realtimeFeedback.value })
    .from(realtimeFeedback)
    .where(eq(realtimeFeedback.sessionId, sessionId));
  const postRows = await db
    .select({ understandingLevel: postClassFeedback.understandingLevel, description: postClassFeedback.description })
    .from(postClassFeedback)
    .where(eq(postClassFeedback.sessionId, sessionId));

  const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of realtimeRows) {
    if (r.value >= 1 && r.value <= 5) levelCounts[r.value as 1 | 2 | 3 | 4 | 5]++;
  }
  for (const p of postRows) {
    if (p.understandingLevel >= 1 && p.understandingLevel <= 5)
      levelCounts[p.understandingLevel as 1 | 2 | 3 | 4 | 5]++;
  }
  const sampleThemes = postRows
    .map((p) => p.description)
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .slice(0, 10);

  const aggregate = {
    sessionId,
    realtime: { counts: levelCounts, total: realtimeRows.length },
    postClass: { levelCounts, total: postRows.length, sampleThemes },
  };
  await cacheAggregate(sessionId, aggregate);
  res.json(aggregate);
});

export const sessionRoutes = router;
