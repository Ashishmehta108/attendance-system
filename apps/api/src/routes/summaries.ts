import { Router, type Response } from "express";
import { db, feedbackSummaries, classSessions } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";
import { getCachedSummary, cacheSummary } from "../lib/cache.js";

const router = Router({ mergeParams: true });

router.use(requireSession);

router.get("/:sessionId/summary", requireRole("admin", "teacher"), async (req: SessionRequest, res: Response) => {
  const { sessionId } = req.params;
  const cached = await getCachedSummary(sessionId);
  if (cached) {
    res.json(cached);
    return;
  }
  const [summary] = await db
    .select()
    .from(feedbackSummaries)
    .where(eq(feedbackSummaries.sessionId, sessionId));
  if (!summary) {
    const [session] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.status(404).json({ error: "Summary not ready yet" });
    return;
  }
  await cacheSummary(sessionId, summary);
  res.json(summary);
});

export const summaryRoutes = router;
