import { z } from "zod";
import { FEEDBACK_LEVELS } from "./constants.js";

const feedbackLevelSchema = z.number().int().min(1).max(5);

export const createClassroomSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
});

export const updateClassroomSchema = createClassroomSchema.partial();

export const createSessionSchema = z.object({
  classroomId: z.string().uuid(),
});

export const updateSessionSchema = z.object({
  status: z.enum(["active", "ended"]).optional(),
});

export const realtimeFeedbackSchema = z.object({
  value: feedbackLevelSchema.refine((n) => FEEDBACK_LEVELS.includes(n as 1 | 2 | 3 | 4 | 5)),
});

export const postClassFeedbackSchema = z.object({
  understandingLevel: feedbackLevelSchema.refine((n) =>
    FEEDBACK_LEVELS.includes(n as 1 | 2 | 3 | 4 | 5)
  ),
  comment: z.string().max(2000).optional(),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type RealtimeFeedbackInput = z.infer<typeof realtimeFeedbackSchema>;
export type PostClassFeedbackInput = z.infer<typeof postClassFeedbackSchema>;
