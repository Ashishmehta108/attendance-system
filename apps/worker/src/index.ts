import { Worker } from "bullmq";
import { getWorkerRedisConnection } from "@attendance-app/db";
import { processSummarizationJob } from "./summarize.js";

const QUEUE_NAME = "feedback-summarization";

const connection = getWorkerRedisConnection();

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { sessionId } = job.data as { sessionId: string };
    await processSummarizationJob(sessionId);
    return { sessionId, ok: true };
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed for session ${job.data.sessionId}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log("Feedback summarization worker started.");
