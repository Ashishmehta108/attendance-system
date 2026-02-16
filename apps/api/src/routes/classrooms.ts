import { Router, type Response } from "express";
import { db, classrooms, classSessions, classroomMembers, user } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import { createClassroomSchema, updateClassroomSchema } from "@attendance-app/shared";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";

const router = Router({ mergeParams: true });

router.use(requireSession);

router.get("/", requireRole("admin", "teacher", "student"), async (req: SessionRequest, res: Response) => {
  const userId = req.session!.user!.id;
  const role = (req.session!.user as { role?: string }).role ?? "student";
  try {
    let list;
    if (role === "admin") {
      list = await db.select().from(classrooms);
    } else if (role === "teacher") {
      list = await db.select().from(classrooms).where(eq(classrooms.createdBy, userId));
    } else {
      // Students see classrooms they're members of
      const memberships = await db
        .select({ classroom: classrooms })
        .from(classroomMembers)
        .innerJoin(classrooms, eq(classroomMembers.classroomId, classrooms.id))
        .where(eq(classroomMembers.userId, userId));
      list = memberships.map(m => m.classroom);
    }
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Failed to list classrooms" });
  }
});

router.post("/", requireRole("teacher"), async (req: SessionRequest, res: Response) => {
  const parsed = createClassroomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const userId = req.session!.user!.id;
  try {
    const [row] = await db
      .insert(classrooms)
      .values({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        createdBy: userId,
      })
      .returning();
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to create classroom" });
  }
});

router.get("/:id", requireRole("admin", "teacher", "student"), async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  const [row] = await db.select().from(classrooms).where(eq(classrooms.id, id));
  if (!row) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  res.json(row);
});

router.patch("/:id", requireRole("admin", "teacher"), async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  const parsed = updateClassroomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const [row] = await db
    .update(classrooms)
    .set({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      updatedAt: new Date(),
    })
    .where(eq(classrooms.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  res.json(row);
});

router.delete("/:id", requireRole("admin", "teacher"), async (req: SessionRequest, res: Response) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  const role = (req.session!.user as { role?: string }).role ?? "student";
  const [existing] = await db.select().from(classrooms).where(eq(classrooms.id, id));
  if (!existing) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  if (role === "teacher" && existing.createdBy !== req.session!.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(classrooms).where(eq(classrooms.id, id));
  res.status(204).send();
});

// Nested: list and create sessions for a classroom
router.get("/:id/sessions", requireRole("admin", "teacher", "student"), async (req: SessionRequest, res: Response) => {
  const classroomId = req.params.id;
  if (!classroomId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classroomId)) {
    res.json([]);
    return;
  }
  const list = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.classroomId, classroomId));
  res.json(list);
});

router.post("/:id/sessions", requireRole("admin", "teacher"), async (req: SessionRequest, res: Response) => {
  const classroomId = req.params.id;
  if (!classroomId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classroomId)) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  const [existing] = await db.select().from(classrooms).where(eq(classrooms.id, classroomId));
  if (!existing) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  const role = (req.session!.user as { role?: string }).role ?? "student";
  const userId = req.session!.user!.id;
  if (role === "teacher" && existing.createdBy !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [row] = await db
    .insert(classSessions)
    .values({
      classroomId,
      status: "active",
      teacherId: userId
    })
    .returning();
  res.status(201).json(row);
});

// List members of a classroom
router.get("/:id/members", requireRole("admin", "teacher"), async (req: SessionRequest, res: Response) => {
  const classroomId = req.params.id;
  if (!classroomId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classroomId)) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }

  // Verify ownership
  const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, classroomId));
  if (!classroom) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  const role = (req.session!.user as any).role;
  const userId = req.session!.user!.id;
  if (role === "teacher" && classroom.createdBy !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const members = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(classroomMembers)
    .innerJoin(user, eq(classroomMembers.userId, user.id))
    .where(eq(classroomMembers.classroomId, classroomId));

  res.json(members);
});

export const classroomRoutes: Router = router;
