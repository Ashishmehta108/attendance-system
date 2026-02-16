import { relations } from "drizzle-orm";
import { user } from "./user";
import {
    classrooms,
    classSessions,
    classroomMembers,
    classroomInvites,
    attendance,
    polls,
    pollResponses,
    teacherReports,
    realtimeFeedback,
    postClassFeedback,
    feedbackSummaries,
} from "./app";

// User relations
export const userRelations = relations(user, ({ many }) => ({
    createdClassrooms: many(classrooms),
    teachingSessions: many(classSessions),
    classroomMemberships: many(classroomMembers),
    sentInvites: many(classroomInvites, { relationName: "teacherInvites" }),
    receivedInvites: many(classroomInvites, { relationName: "studentInvites" }),
    attendance: many(attendance),
    createdPolls: many(polls),
    pollResponses: many(pollResponses),
    givenReports: many(teacherReports, { relationName: "studentReports" }),
    receivedReports: many(teacherReports, { relationName: "teacherReports" }),
    realtimeFeedback: many(realtimeFeedback),
    postClassFeedback: many(postClassFeedback),
}));

// Classroom relations
export const classroomRelations = relations(classrooms, ({ one, many }) => ({
    creator: one(user, {
        fields: [classrooms.createdBy],
        references: [user.id],
    }),
    sessions: many(classSessions),
    members: many(classroomMembers),
    invites: many(classroomInvites),
    polls: many(polls),
}));

// Class session relations
export const classSessionRelations = relations(classSessions, ({ one, many }) => ({
    classroom: one(classrooms, {
        fields: [classSessions.classroomId],
        references: [classrooms.id],
    }),
    teacher: one(user, {
        fields: [classSessions.teacherId],
        references: [user.id],
    }),
    attendance: many(attendance),
    realtimeFeedback: many(realtimeFeedback),
    postClassFeedback: many(postClassFeedback),
    summary: one(feedbackSummaries),
}));

// Classroom member relations
export const classroomMemberRelations = relations(classroomMembers, ({ one }) => ({
    classroom: one(classrooms, {
        fields: [classroomMembers.classroomId],
        references: [classrooms.id],
    }),
    user: one(user, {
        fields: [classroomMembers.userId],
        references: [user.id],
    }),
}));

// Classroom invite relations
export const classroomInviteRelations = relations(classroomInvites, ({ one }) => ({
    classroom: one(classrooms, {
        fields: [classroomInvites.classroomId],
        references: [classrooms.id],
    }),
    student: one(user, {
        fields: [classroomInvites.studentId],
        references: [user.id],
        relationName: "studentInvites",
    }),
    teacher: one(user, {
        fields: [classroomInvites.teacherId],
        references: [user.id],
        relationName: "teacherInvites",
    }),
}));

// Attendance relations
export const attendanceRelations = relations(attendance, ({ one }) => ({
    session: one(classSessions, {
        fields: [attendance.sessionId],
        references: [classSessions.id],
    }),
    user: one(user, {
        fields: [attendance.userId],
        references: [user.id],
    }),
}));

// Poll relations
export const pollRelations = relations(polls, ({ one, many }) => ({
    classroom: one(classrooms, {
        fields: [polls.classroomId],
        references: [classrooms.id],
    }),
    creator: one(user, {
        fields: [polls.createdBy],
        references: [user.id],
    }),
    responses: many(pollResponses),
}));

// Poll response relations
export const pollResponseRelations = relations(pollResponses, ({ one }) => ({
    poll: one(polls, {
        fields: [pollResponses.pollId],
        references: [polls.id],
    }),
    user: one(user, {
        fields: [pollResponses.userId],
        references: [user.id],
    }),
}));

// Teacher report relations
export const teacherReportRelations = relations(teacherReports, ({ one }) => ({
    teacher: one(user, {
        fields: [teacherReports.teacherId],
        references: [user.id],
        relationName: "teacherReports",
    }),
    student: one(user, {
        fields: [teacherReports.studentId],
        references: [user.id],
        relationName: "studentReports",
    }),
}));

// Realtime feedback relations
export const realtimeFeedbackRelations = relations(realtimeFeedback, ({ one }) => ({
    session: one(classSessions, {
        fields: [realtimeFeedback.sessionId],
        references: [classSessions.id],
    }),
    user: one(user, {
        fields: [realtimeFeedback.userId],
        references: [user.id],
    }),
}));

// Post-class feedback relations
export const postClassFeedbackRelations = relations(postClassFeedback, ({ one }) => ({
    session: one(classSessions, {
        fields: [postClassFeedback.sessionId],
        references: [classSessions.id],
    }),
    user: one(user, {
        fields: [postClassFeedback.userId],
        references: [user.id],
    }),
}));

// Feedback summary relations
export const feedbackSummaryRelations = relations(feedbackSummaries, ({ one }) => ({
    session: one(classSessions, {
        fields: [feedbackSummaries.sessionId],
        references: [classSessions.id],
    }),
}));
