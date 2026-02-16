import { Router, type Response } from "express";
import { db, user, classroomMembers } from "@attendance-app/db";
import { eq, and, notInArray } from "drizzle-orm";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";

const router = Router();

router.use(requireSession);

// List all students (for teachers to invite)
router.get("/", requireRole("teacher", "admin"), async (req: SessionRequest, res: Response) => {
    const { classroomId } = req.query;

    let students;

    // If classroomId provided, optionally filter out students already in that classroom
    if (classroomId && typeof classroomId === "string") {
        const members = await db.query.classroomMembers.findMany({
            where: eq(classroomMembers.classroomId, classroomId),
            columns: { userId: true },
        });

        const memberIds = members.map(m => m.userId);

        if (memberIds.length > 0) {
            students = await db.query.user.findMany({
                where: and(
                    eq(user.role, "student"),
                    notInArray(user.id, memberIds)
                ),
                columns: {
                    password: false,
                },
            });
        } else {
            students = await db.query.user.findMany({
                where: eq(user.role, "student"),
                columns: {
                    password: false,
                },
            });
        }
    } else {
        students = await db.query.user.findMany({
            where: eq(user.role, "student"),
            columns: {
                password: false,
            },
        });
    }

    res.json(students);
});

export const studentRoutes: Router = router;
