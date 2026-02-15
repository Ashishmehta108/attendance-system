import type { FeedbackLevel, Role, SessionStatus } from "./constants.js";

export interface Classroom {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassSession {
  id: string;
  classroomId: string;
  startedAt: Date;
  endedAt: Date | null;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RealtimeFeedbackAggregate {
  sessionId: string;
  counts: Record<FeedbackLevel, number>;
  total: number;
  updatedAt: string;
}

export interface PostClassFeedbackAggregate {
  sessionId: string;
  levelCounts: Record<FeedbackLevel, number>;
  total: number;
  sampleThemes: string[];
}

export interface FeedbackSummary {
  id: string;
  sessionId: string;
  summaryText: string;
  insights: Record<string, unknown>;
  processedAt: Date;
  jobId: string | null;
}

export type { FeedbackLevel, Role, SessionStatus };
