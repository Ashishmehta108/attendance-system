import { Router, type Response } from "express";
import { db, classSessions, realtimeFeedback, postClassFeedback } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import { realtimeFeedbackSchema, postClassFeedbackSchema } from "@attendance-app/shared";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";

const router = Router({ mergeParams: true });

router.use(requireSession);

router.post("/:sessionId/feedback/realtime", requireRole("admin", "instructor", "student"), async (req: SessionRequest, res: Response) => {
  const { sessionId } = req.params;
  const parsed = realtimeFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const [session] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
  if (!session || session.status !== "active") {
    res.status(404).json({ error: "Session not found or not active" });
    return;
  }
  const userId = req.session!.user!.id;
  await db.insert(realtimeFeedback).values({
    sessionId,
    userId,
    value: parsed.data.value,
  });
  res.status(201).json({ ok: true });
});

router.post("/:sessionId/feedback/post", requireRole("admin", "instructor", "student"), async (req: SessionRequest, res: Response) => {
  const { sessionId } = req.params;
  const parsed = postClassFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const [session] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const userId = req.session!.user!.id;
  await db.insert(postClassFeedback).values({
    sessionId,
    userId,
    understandingLevel: parsed.data.understandingLevel,
    comment: parsed.data.comment ?? null,
  });
  res.status(201).json({ ok: true });
});

export const feedbackRoutes = router;
