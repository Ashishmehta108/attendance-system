/** Understanding/attention level 1-5 for real-time and post-class feedback */
export const FEEDBACK_LEVELS = [1, 2, 3, 4, 5] as const;
export type FeedbackLevel = (typeof FEEDBACK_LEVELS)[number];

/** Session status */
export const SESSION_STATUS = ["active", "ended"] as const;
export type SessionStatus = (typeof SESSION_STATUS)[number];

/** RBAC roles */
export const ROLES = ["admin", "teacher", "student"] as const;
export type Role = (typeof ROLES)[number];
