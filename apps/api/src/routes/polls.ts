import { Router, type Response } from "express";
import { db, polls, pollResponses, classrooms } from "@attendance-app/db";
import { eq, and, gt, sql } from "drizzle-orm";
import { createPollSchema, respondPollSchema } from "@attendance-app/shared";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";

const router = Router();

router.use(requireSession);

// Teacher creates a poll
router.post("/", requireRole("teacher"), async (req: SessionRequest, res: Response) => {
    const parsed = createPollSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const { classroomId, question, options } = parsed.data;
    const teacherId = req.session!.user!.id;

    // Verify ownership
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, classroomId));
    if (!classroom || classroom.createdBy !== teacherId) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    // Auto-expire in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const [newPoll] = await db.insert(polls).values({
        classroomId,
        createdBy: teacherId,
        question,
        options,
        expiresAt,
    }).returning();

    res.status(201).json(newPoll);
});

// List polls for a classroom
router.get("/", requireRole("teacher", "student"), async (req: SessionRequest, res: Response) => {
    const { classroomId } = req.query;
    if (!classroomId || typeof classroomId !== "string") {
        res.status(400).json({ error: "classroomId is required" });
        return;
    }

    // Basic list of polls
    const list = await db.query.polls.findMany({
        where: eq(polls.classroomId, classroomId),
        orderBy: (polls, { desc }) => [desc(polls.createdAt)],
    });

    res.json(list);
});

// Get active poll for a classroom (if any)
router.get("/active", requireRole("teacher", "student"), async (req: SessionRequest, res: Response) => {
    const { classroomId } = req.query;
    if (!classroomId || typeof classroomId !== "string") {
        res.status(400).json({ error: "classroomId is required" });
        return;
    }

    const [activePoll] = await db.select().from(polls).where(
        and(
            eq(polls.classroomId, classroomId),
            gt(polls.expiresAt, new Date())
        )
    ).orderBy(sql`${polls.createdAt} DESC`).limit(1);

    res.json(activePoll || null);
});

// Get all active polls for a student
router.get("/active/all", requireRole("student"), async (req: SessionRequest, res: Response) => {
    const userId = req.session!.user!.id;

    // Get all classrooms the student is in
    const memberRooms = await db.query.classroomMembers.findMany({
        where: (cm, { eq }) => eq(cm.userId, userId),
        columns: { classroomId: true },
    });

    if (memberRooms.length === 0) {
        res.json([]);
        return;
    }

    const classroomIds = memberRooms.map(r => r.classroomId);

    // Get active polls for these classrooms
    const activePolls = await db.query.polls.findMany({
        where: (p, { and, inArray, gt }) => and(
            inArray(p.classroomId, classroomIds),
            gt(p.expiresAt, new Date())
        ),
        with: {
            classroom: true,
        },
        orderBy: (p, { desc }) => [desc(p.createdAt)],
    });

    res.json(activePolls);
});

// Respond to a poll
router.post("/:id/respond", requireRole("student"), async (req: SessionRequest, res: Response) => {
    const { id } = req.params;
    const parsed = respondPollSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const userId = req.session!.user!.id;
    const { selectedOption } = parsed.data;

    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    if (!poll) {
        res.status(404).json({ error: "Poll not found" });
        return;
    }

    if (new Date() > poll.expiresAt) {
        res.status(400).json({ error: "Poll has expired" });
        return;
    }

    // Check if already responded
    const [existingResponse] = await db.select().from(pollResponses).where(
        and(
            eq(pollResponses.pollId, id),
            eq(pollResponses.userId, userId)
        )
    );

    if (existingResponse) {
        res.status(400).json({ error: "You have already responded to this poll" });
        return;
    }

    const [response] = await db.insert(pollResponses).values({
        pollId: id,
        userId,
        selectedOption,
    }).returning();

    res.status(201).json(response);
});

// Get poll results
router.get("/:id/results", requireRole("teacher", "admin"), async (req: SessionRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.session!.user!.id;
    const role = (req.session!.user as any).role;

    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    if (!poll) {
        res.status(404).json({ error: "Poll not found" });
        return;
    }

    // Verify ownership if teacher
    if (role === "teacher" && poll.createdBy !== userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    const responses = await db.select().from(pollResponses).where(eq(pollResponses.pollId, id));

    // Aggregate results
    const results: Record<string, number> = {};
    poll.options.forEach(opt => results[opt] = 0);
    responses.forEach(resp => {
        if (results[resp.selectedOption] !== undefined) {
            results[resp.selectedOption]++;
        }
    });

    res.json({
        poll,
        totalResponses: responses.length,
        results,
    });
});

export const pollRoutes: Router = router;
