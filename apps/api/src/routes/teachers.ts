import { Router, type Response } from "express";
import { db, user } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { createTeacherSchema } from "@attendance-app/shared";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";

const router = Router({ mergeParams: true });

router.use(requireSession);

// Admin creates a teacher
router.post("/", requireRole("admin"), async (req: SessionRequest, res: Response) => {
    const parsed = createTeacherSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
        where: eq(user.email, email),
    });

    if (existingUser) {
        res.status(400).json({ error: "User with this email already exists" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    const [newTeacher] = await db.insert(user).values({
        id: userId,
        email,
        name,
        password: hashedPassword,
        role: "teacher",
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning();

    if (!newTeacher) {
        res.status(500).json({ error: "Failed to create teacher" });
        return;
    }

    res.status(201).json({
        id: newTeacher.id,
        email: newTeacher.email,
        name: newTeacher.name,
        role: newTeacher.role,
    });
});

// Admin lists all teachers
router.get("/", requireRole("admin"), async (_req: SessionRequest, res: Response) => {
    const teachers = await db.query.user.findMany({
        where: eq(user.role, "teacher"),
        columns: {
            password: false,
        },
    });

    res.json(teachers);
});

// Admin deletes a teacher
router.delete("/:id", requireRole("admin"), async (req: SessionRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: "ID is required" });
        return;
    }

    const existingUser = await db.query.user.findFirst({
        where: eq(user.id, id),
    });

    if (!existingUser || existingUser.role !== "teacher") {
        res.status(404).json({ error: "Teacher not found" });
        return;
    }

    await db.delete(user).where(eq(user.id, id));
    res.status(204).send();
});

// Admin updates teacher info
router.patch("/:id", requireRole("admin"), async (req: SessionRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    const { name, email } = req.body;

    const existingUser = await db.query.user.findFirst({
        where: eq(user.id, id),
    });

    if (!existingUser || existingUser.role !== "teacher") {
        res.status(404).json({ error: "Teacher not found" });
        return;
    }

    const [updated] = await db.update(user)
        .set({
            ...(name && { name }),
            ...(email && { email }),
            updatedAt: new Date(),
        })
        .where(eq(user.id, id))
        .returning({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });

    res.json(updated);
});

export const teacherRoutes: Router = router;
