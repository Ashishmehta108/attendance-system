"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Summary {
  id: string;
  sessionId: string;
  summaryText: string;
  insights: Record<string, unknown>;
  processedAt: string;
}

export default function SessionSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { data: session } = authClient.useSession();

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ["summary", sessionId],
    queryFn: () => api<Summary>(`/api/sessions/${sessionId}/summary`),
    enabled: !!sessionId && !!session?.user,
    refetchInterval: (data) => (data ? false : 3000),
  });

  if (session && !session.user) router.push("/login");
  if (session?.user && (session.user as { role?: string }).role === "student") router.push("/sessions");

  if (!session?.user) return null;

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <h1 className="text-xl font-bold">Session summary</h1>
      </div>

      {isLoading && !summary && <p>Loading summary…</p>}
      {error && !summary && (
        <Card>
          <CardContent className="pt-6">
            <p>Summary not ready yet. It may still be processing.</p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap">{summary.summaryText}</p>
            {summary.insights && Object.keys(summary.insights).length > 0 && (
              <div className="text-sm text-muted-foreground">
                <pre className="overflow-auto">{JSON.stringify(summary.insights, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
