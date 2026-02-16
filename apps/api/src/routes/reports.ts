import { Router, type Response } from "express";
import { db, teacherReports, user } from "@attendance-app/db";
import { eq, desc } from "drizzle-orm";
import { createTeacherReportSchema } from "@attendance-app/shared";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";

const router = Router();

router.use(requireSession);

// Student submits a report
router.post("/", requireRole("student"), async (req: SessionRequest, res: Response) => {
    const parsed = createTeacherReportSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const studentId = req.session!.user!.id;
    const { teacherId, rating, comment } = parsed.data;

    // Verify teacher exists
    const targetTeacher = await db.query.user.findFirst({
        where: eq(user.id, teacherId),
    });

    if (!targetTeacher || targetTeacher.role !== "teacher") {
        res.status(404).json({ error: "Teacher not found" });
        return;
    }

    const [report] = await db.insert(teacherReports).values({
        teacherId,
        studentId,
        rating,
        comment: comment ?? null,
    }).returning();

    if (!report) {
        res.status(500).json({ error: "Failed to submit report" });
        return;
    }

    res.status(201).json({ success: true, id: report.id });
});

// Admin lists all reports
router.get("/", requireRole("admin"), async (_req: SessionRequest, res: Response) => {
    const list = await db.query.teacherReports.findMany({
        orderBy: [desc(teacherReports.createdAt)],
        with: {
            teacher: {
                columns: {
                    password: false,
                }
            },
        }
    });

    res.json(list);
});

// Admin views stats for a teacher
router.get("/teacher/:teacherId", requireRole("admin"), async (req: SessionRequest, res: Response) => {
    const { teacherId } = req.params;
    if (!teacherId) {
        res.status(400).json({ error: "teacherId is required" });
        return;
    }

    const reports = await db.query.teacherReports.findMany({
        where: eq(teacherReports.teacherId, teacherId),
        orderBy: [desc(teacherReports.createdAt)],
    });

    if (reports.length === 0) {
        res.json({ averageRating: 0, count: 0, reports: [] });
        return;
    }

    const totalRating = reports.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = totalRating / reports.length;

    res.json({
        averageRating,
        count: reports.length,
        reports,
    });
});

export const reportRoutes: Router = router;
