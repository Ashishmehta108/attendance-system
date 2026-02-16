import { Router, type Response } from "express";
import { db, attendance, classSessions, classroomMembers, user } from "@attendance-app/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { checkInSchema, checkOutSchema } from "@attendance-app/shared";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";

const router = Router();

router.use(requireSession);

// Student check-in
router.post("/check-in", requireRole("student"), async (req: SessionRequest, res: Response) => {
    const parsed = checkInSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const { sessionId } = parsed.data;
    const userId = req.session!.user!.id;

    // Verify session is active
    const [session] = await db.select().from(classSessions).where(eq(classSessions.id, sessionId));
    if (!session || session.status !== "active") {
        res.status(400).json({ error: "Session is not active or not found" });
        return;
    }

    // Verify student is a member of the classroom
    const [membership] = await db.select().from(classroomMembers).where(
        and(
            eq(classroomMembers.classroomId, session.classroomId),
            eq(classroomMembers.userId, userId)
        )
    );
    if (!membership) {
        res.status(403).json({ error: "Forbidden: You are not a member of this classroom" });
        return;
    }

    // Check if already checked in
    const [existing] = await db.select().from(attendance).where(
        and(
            eq(attendance.sessionId, sessionId),
            eq(attendance.userId, userId),
            isNull(attendance.checkOutAt)
        )
    );

    if (existing) {
        res.status(400).json({ error: "You are already checked in to this session" });
        return;
    }

    const [record] = await db.insert(attendance).values({
        sessionId,
        userId,
    }).returning();

    res.status(201).json(record);
});

// Student check-out
router.post("/check-out", requireRole("student"), async (req: SessionRequest, res: Response) => {
    const parsed = checkOutSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const { attendanceId } = parsed.data;
    const userId = req.session!.user!.id;

    const [record] = await db.select().from(attendance).where(
        and(
            eq(attendance.id, attendanceId),
            eq(attendance.userId, userId)
        )
    );

    if (!record) {
        res.status(404).json({ error: "Attendance record not found" });
        return;
    }

    if (record.checkOutAt) {
        res.status(400).json({ error: "Already checked out" });
        return;
    }

    const [updated] = await db.update(attendance).set({
        checkOutAt: new Date(),
    }).where(eq(attendance.id, attendanceId)).returning();

    res.json(updated);
});

// Get session attendance (for teachers/admins)
router.get("/session/:sessionId", requireRole("teacher", "admin"), async (req: SessionRequest, res: Response) => {
    const { sessionId } = req.params;

    const list = await db.query.attendance.findMany({
        where: eq(attendance.sessionId, sessionId),
        with: {
            user: {
                columns: {
                    password: false,
                }
            }
        }
    });

    res.json(list);
});

// Get my attendance history
router.get("/me", requireRole("student"), async (req: SessionRequest, res: Response) => {
    const userId = req.session!.user!.id;

    const list = await db.query.attendance.findMany({
        where: eq(attendance.userId, userId),
        orderBy: [desc(attendance.checkInAt)],
        with: {
            session: {
                with: {
                    classroom: true
                }
            }
        }
    });

    res.json(list);
});

export const attendanceRoutes: Router = router;
