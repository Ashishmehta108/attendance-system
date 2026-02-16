import { Router, type Response } from "express";
import { db, classroomInvites, classroomMembers, user, classrooms } from "@attendance-app/db";
import { eq, and, or } from "drizzle-orm";
import { createInviteSchema, respondInviteSchema } from "@attendance-app/shared";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";

const router = Router();

router.use(requireSession);

// Teacher sends an invite
router.post("/", requireRole("teacher"), async (req: SessionRequest, res: Response) => {
    const parsed = createInviteSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const { classroomId, studentEmail, studentId } = parsed.data;
    const teacherId = req.session!.user!.id;

    // Verify classroom ownership
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, classroomId));
    if (!classroom || classroom.createdBy !== teacherId) {
        res.status(403).json({ error: "Forbidden: You don't own this classroom" });
        return;
    }

    // Find student by email or ID
    let targetStudent;
    if (studentId) {
        targetStudent = await db.query.user.findFirst({
            where: eq(user.id, studentId),
        });
    } else if (studentEmail) {
        targetStudent = await db.query.user.findFirst({
            where: eq(user.email, studentEmail),
        });
    }

    if (!targetStudent || targetStudent.role !== "student") {
        res.status(404).json({ error: "Student not found" });
        return;
    }

    // Check if already a member
    const [existingMember] = await db.select().from(classroomMembers).where(
        and(
            eq(classroomMembers.classroomId, classroomId),
            eq(classroomMembers.userId, targetStudent.id)
        )
    );
    if (existingMember) {
        res.status(400).json({ error: "User is already a member of this classroom" });
        return;
    }

    // Check if already invited
    const [existingInvite] = await db.select().from(classroomInvites).where(
        and(
            eq(classroomInvites.classroomId, classroomId),
            eq(classroomInvites.studentId, targetStudent.id),
            eq(classroomInvites.status, "pending")
        )
    );
    if (existingInvite) {
        res.status(400).json({ error: "An invite is already pending for this student" });
        return;
    }

    const [newInvite] = await db.insert(classroomInvites).values({
        classroomId,
        studentId: targetStudent.id,
        teacherId,
        status: "pending",
    }).returning();

    res.status(201).json(newInvite);
});

// List invites
// For student: list pending invites
// For teacher: list invites for a specific classroom (if classroomId provided)
router.get("/", requireRole("teacher", "student"), async (req: SessionRequest, res: Response) => {
    const userId = req.session!.user!.id;
    const role = (req.session!.user as any).role;
    const { classroomId } = req.query;

    if (role === "student") {
        const invites = await db.query.classroomInvites.findMany({
            where: and(
                eq(classroomInvites.studentId, userId),
                eq(classroomInvites.status, "pending")
            ),
            with: {
                classroom: true,
                teacher: {
                    columns: {
                        password: false,
                    }
                }
            }
        });
        res.json(invites);
    } else if (role === "teacher") {
        if (!classroomId || typeof classroomId !== "string") {
            res.status(400).json({ error: "classroomId is required for teachers" });
            return;
        }

        // Verify ownership
        const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, classroomId));
        if (!classroom || classroom.createdBy !== userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        const invites = await db.query.classroomInvites.findMany({
            where: eq(classroomInvites.classroomId, classroomId),
            with: {
                student: {
                    columns: {
                        password: false,
                    }
                }
            }
        });
        res.json(invites);
    }
});

// Respond to an invite
router.post("/:id/respond", requireRole("student"), async (req: SessionRequest, res: Response) => {
    const { id } = req.params;
    const parsed = respondInviteSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const userId = req.session!.user!.id;
    const { status } = parsed.data;

    const [invite] = await db.select().from(classroomInvites).where(
        and(
            eq(classroomInvites.id, id),
            eq(classroomInvites.studentId, userId),
            eq(classroomInvites.status, "pending")
        )
    );

    if (!invite) {
        res.status(404).json({ error: "Invite not found or already processed" });
        return;
    }

    await db.update(classroomInvites).set({
        status,
        respondedAt: new Date(),
    }).where(eq(classroomInvites.id, id));

    if (status === "accepted") {
        await db.insert(classroomMembers).values({
            classroomId: invite.classroomId,
            userId: userId,
        });
    }

    res.json({ success: true, status });
});

export const inviteRoutes: Router = router;
