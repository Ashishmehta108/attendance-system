import { Queue } from "bullmq";
import { getRedisConnection } from "@attendance-app/db";

const QUEUE_NAME = "feedback-summarization";

const connection = getRedisConnection();

export const summarizationQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 100 },
  },
});

export async function addSummarizationJob(sessionId: string, delayMs = 60_000): Promise<void> {
  await summarizationQueue.add("summarize", { sessionId }, { delay: delayMs });
}
