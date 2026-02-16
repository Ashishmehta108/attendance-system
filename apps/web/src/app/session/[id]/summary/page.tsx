"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronLeft, FileText, Lightbulb, PieChart, RefreshCcw } from "lucide-react";

interface Summary {
  id: string;
  sessionId: string;
  summaryText: string;
  insights: Record<string, string>;
  processedAt: string;
}

export default function SessionSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { data: session } = authClient.useSession();

  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ["summary", sessionId],
    queryFn: () => api<Summary>(`/api/sessions/${sessionId}/summary`),
    enabled: !!sessionId && !!session?.user,
    refetchInterval: (query) => (query.state.data ? false : 5000),
  });

  if (session && !session.user) router.push("/login");
  if (session?.user && (session.user as { role?: string }).role === "student") router.push("/sessions");

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card h-16 flex items-center mb-8">
        <div className="container max-w-4xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" asChild>
              <Link href="/dashboard"><ChevronLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-xl font-bold">Session Review</h1>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {sessionId.slice(0, 8)}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl space-y-8">
        {isLoading && !summary && (
          <Card className="border-dashed border-2 py-20">
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <RefreshCcw className="w-10 h-10 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Generating Summary</h3>
                <p className="text-muted-foreground">Our AI engine is processing student feedback...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && !summary && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6 text-center space-y-4">
              <p className="font-medium">Summary generation is taking longer than expected.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCcw className="w-4 h-4" />
                Retry connection
              </Button>
            </CardContent>
          </Card>
        )}

        {summary && (
          <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="overflow-hidden border-2">
              <CardHeader className="bg-primary/5 border-b py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Key Takeaways
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap first-letter:text-4xl first-letter:font-bold first-letter:mr-1 first-letter:float-left">
                  {summary.summaryText}
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Actionable Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {summary.insights && Object.entries(summary.insights).length > 0 ? (
                      Object.entries(summary.insights).map(([key, val], idx) => (
                        <div key={idx} className="bg-muted/50 p-4 rounded-xl border">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{key}</h4>
                          <p className="text-sm font-medium">{String(val)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">No specific insights detected.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-primary" />
                    Technical Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Processed On</span>
                    <span className="text-sm font-medium">{new Date(summary.processedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Session Status</span>
                    <span className="text-sm font-medium text-green-600">COMPLETED</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">Analysis Mode</span>
                    <span className="text-sm font-medium">GPT-4 Turbo</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
