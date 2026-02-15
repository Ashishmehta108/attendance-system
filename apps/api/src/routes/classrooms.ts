import { Router, type Response } from "express";
import { db, classrooms, classSessions } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import { createClassroomSchema, updateClassroomSchema } from "@attendance-app/shared";
import type { SessionRequest } from "../middleware/session.js";
import { requireSession, requireRole } from "../middleware/session.js";

const router = Router({ mergeParams: true });

router.use(requireSession);

router.get("/", requireRole("admin", "instructor", "student"), async (req: SessionRequest, res: Response) => {
  const userId = req.session!.user!.id;
  const role = (req.session!.user as { role?: string }).role ?? "student";
  try {
    const list =
      role === "admin"
        ? await db.select().from(classrooms)
        : role === "instructor"
          ? await db.select().from(classrooms).where(eq(classrooms.createdBy, userId))
          : await db.select().from(classrooms);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Failed to list classrooms" });
  }
});

router.post("/", requireRole("admin", "instructor"), async (req: SessionRequest, res: Response) => {
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

router.get("/:id", requireRole("admin", "instructor", "student"), async (req: SessionRequest, res: Response) => {
  const [row] = await db.select().from(classrooms).where(eq(classrooms.id, req.params.id));
  if (!row) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  res.json(row);
});

router.patch("/:id", requireRole("admin", "instructor"), async (req: SessionRequest, res: Response) => {
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
    .where(eq(classrooms.id, req.params.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  res.json(row);
});

router.delete("/:id", requireRole("admin", "instructor"), async (req: SessionRequest, res: Response) => {
  const role = (req.session!.user as { role?: string }).role ?? "student";
  const [existing] = await db.select().from(classrooms).where(eq(classrooms.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  if (role === "instructor" && existing.createdBy !== req.session!.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(classrooms).where(eq(classrooms.id, req.params.id));
  res.status(204).send();
});

// Nested: list and create sessions for a classroom
router.get("/:id/sessions", requireRole("admin", "instructor", "student"), async (req: SessionRequest, res: Response) => {
  const classroomId = req.params.id;
  const list = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.classroomId, classroomId));
  res.json(list);
});

router.post("/:id/sessions", requireRole("admin", "instructor"), async (req: SessionRequest, res: Response) => {
  const classroomId = req.params.id;
  const [existing] = await db.select().from(classrooms).where(eq(classrooms.id, classroomId));
  if (!existing) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  const role = (req.session!.user as { role?: string }).role ?? "student";
  if (role === "instructor" && existing.createdBy !== req.session!.user!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [row] = await db
    .insert(classSessions)
    .values({ classroomId, status: "active" })
    .returning();
  res.status(201).json(row);
});

export const classroomRoutes = router;
