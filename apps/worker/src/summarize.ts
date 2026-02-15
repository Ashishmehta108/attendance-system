import { db, postClassFeedback, feedbackSummaries, realtimeFeedback } from "@attendance-app/db";
import { eq } from "drizzle-orm";
import type { FeedbackLevel } from "@attendance-app/shared";

export async function processSummarizationJob(sessionId: string): Promise<void> {
  const allPost = await db
    .select()
    .from(postClassFeedback)
    .where(eq(postClassFeedback.sessionId, sessionId));

  const realtimeRows = await db
    .select({ value: realtimeFeedback.value })
    .from(realtimeFeedback)
    .where(eq(realtimeFeedback.sessionId, sessionId));

  const levelCounts: Record<FeedbackLevel, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const r of realtimeRows) {
    if (r.value >= 1 && r.value <= 5) {
      levelCounts[r.value as FeedbackLevel]++;
    }
  }
  for (const f of allPost) {
    if (f.understandingLevel >= 1 && f.understandingLevel <= 5) {
      levelCounts[f.understandingLevel as FeedbackLevel]++;
    }
  }

  const comments = allPost
    .map((f) => f.comment)
    .filter((c): c is string => typeof c === "string" && c.length > 0);

  // Stub summarization: concatenate themes; in production replace with LLM
  const summaryText =
    comments.length > 0
      ? `Post-class themes: ${comments.join(" | ")}. Aggregate levels: ${JSON.stringify(levelCounts)}.`
      : `No written comments. Aggregate understanding levels: ${JSON.stringify(levelCounts)}.`;

  const insights: Record<string, unknown> = {
    levelCounts,
    postClassCount: allPost.length,
    realtimeCount: realtimeRows.length,
  };

  await db
    .insert(feedbackSummaries)
    .values({
      sessionId,
      summaryText,
      insights,
      jobId: null,
    })
    .onConflictDoUpdate({
      target: feedbackSummaries.sessionId,
      set: {
        summaryText,
        insights,
        processedAt: new Date(),
      },
    });
}
