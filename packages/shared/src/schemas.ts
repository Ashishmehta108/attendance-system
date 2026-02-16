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

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Role is always "student" for self-registration
});

// Admin creates teachers
export const createTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Classroom invitations
export const createInviteSchema = z.object({
  classroomId: z.string().uuid(),
  studentEmail: z.string().email().optional(),
  studentId: z.string().optional(),
}).refine(data => data.studentEmail || data.studentId, {
  message: "Either studentEmail or studentId must be provided",
});

export const respondInviteSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

// Polls
export const createPollSchema = z.object({
  classroomId: z.string().uuid(),
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
});

export const respondPollSchema = z.object({
  selectedOption: z.string().min(1),
});

// Attendance
export const checkInSchema = z.object({
  sessionId: z.string().uuid(),
});

export const checkOutSchema = z.object({
  attendanceId: z.string().uuid(),
});

// Teacher reports (anonymous feedback)
export const createTeacherReportSchema = z.object({
  teacherId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type RespondInviteInput = z.infer<typeof respondInviteSchema>;
export type CreatePollInput = z.infer<typeof createPollSchema>;
export type RespondPollInput = z.infer<typeof respondPollSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type CreateTeacherReportInput = z.infer<typeof createTeacherReportSchema>;
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type RealtimeFeedbackInput = z.infer<typeof realtimeFeedbackSchema>;
export type PostClassFeedbackInput = z.infer<typeof postClassFeedbackSchema>;
