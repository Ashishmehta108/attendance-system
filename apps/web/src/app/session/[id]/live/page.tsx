"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { wsUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronLeft, BarChart2, Users, Clock, LogOut } from "lucide-react";

interface Session {
  id: string;
  status: string;
}

interface Aggregate {
  counts: Record<number, number>;
  total: number;
}

const FEEDBACK_OPTIONS = [
  { value: 1, label: "Confused", emoji: "😟", color: "bg-red-500" },
  { value: 2, label: "Tough", emoji: "🤨", color: "bg-orange-500" },
  { value: 3, label: "Okay", emoji: "😐", color: "bg-yellow-500" },
  { value: 4, label: "Good", emoji: "🙂", color: "bg-lime-500" },
  { value: 5, label: "Great", emoji: "🤩", color: "bg-green-500" },
];

export default function SessionLivePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { data: session } = authClient.useSession();
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [lastFeedback, setLastFeedback] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api<Session>(`/api/sessions/${sessionId}`),
    enabled: !!sessionId && !!session?.user,
  });

  useEffect(() => {
    if (!session?.user || !sessionId) return;
    const url = wsUrl(sessionId);
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        if (msg.type === "aggregate" && msg.payload) setAggregate(msg.payload);
      } catch { }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId, session?.user]);

  useEffect(() => {
    if (session === null || (session && !session.user)) router.push("/login");
  }, [session, router]);

  if (!session?.user) return null;

  const role = (session.user as { role?: string }).role ?? "student";
  const isTeacher = role === "admin" || role === "teacher";

  async function sendFeedback(value: number) {
    try {
      setLastFeedback(value);
      await api(`/api/sessions/${sessionId}/feedback/realtime`, {
        method: "POST",
        body: JSON.stringify({ value }),
      });
      // Clear last feedback after 2 seconds to allow re-selection visual feedback
      setTimeout(() => setLastFeedback(null), 2000);
    } catch (err) {
      console.error("Feedback error:", err);
    }
  }

  if (!sessionData) return <div className="min-h-screen flex items-center justify-center">Loading session metadata…</div>;

  if (sessionData.status !== "active") {
    return (
      <div className="container max-w-lg py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Session Ended</h1>
        <p className="text-muted-foreground mb-8">This interaction session is no longer active.</p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/sessions">Back to list</Link>
          </Button>
          {isTeacher && (
            <Button asChild>
              <Link href={`/session/${sessionId}/summary`}>View results</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const averageScore = aggregate?.total && aggregate.total > 0
    ? (Object.entries(aggregate.counts).reduce((acc, [lvl, count]) => acc + parseInt(lvl) * count, 0) / aggregate.total).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container max-w-4xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" asChild>
              <Link href="/sessions"><ChevronLeft className="w-5 h-5" /></Link>
            </Button>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <h1 className="font-semibold text-lg">Live Session</h1>
            </div>
          </div>
          <div className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
            ID: {sessionId.slice(0, 8)}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 space-y-8">
        {isTeacher ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-primary/10">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{aggregate?.total ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unique student entries</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/10">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Avg. Understanding</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{averageScore}</div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= Math.round(parseFloat(averageScore)) ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/10 bg-primary/5">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">Manage</CardTitle>
                  <LogOut className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <Button variant="default" className="w-full" asChild>
                    <Link href={`/session/${sessionId}/end`}>End Interaction</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Live Distribution
                  <span className="text-xs font-normal text-muted-foreground ml-2">Updates in real-time</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {aggregate && aggregate.total > 0 ? (
                  <div className="space-y-6">
                    {FEEDBACK_OPTIONS.slice().reverse().map((opt) => {
                      const count = aggregate.counts[opt.value] ?? 0;
                      const percentage = (count / aggregate.total) * 100;
                      return (
                        <div key={opt.value} className="space-y-2">
                          <div className="flex justify-between text-sm items-center">
                            <span className="flex items-center gap-2">
                              {opt.emoji} {opt.label}
                            </span>
                            <span className="font-mono">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="relative w-full h-8 bg-muted rounded-lg overflow-hidden border">
                            <div
                              className={`absolute h-full ${opt.color} transition-all duration-500 ease-out`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-12 h-12 bg-muted rounded-full mx-auto flex items-center justify-center animate-pulse">
                      <BarChart2 className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Waiting for first student heartbeat…</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 max-w-sm mx-auto">
              <h2 className="text-2xl font-bold">Understanding Level</h2>
              <p className="text-muted-foreground">How are you feeling about the current topic? Your response is anonymous.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              {FEEDBACK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => sendFeedback(opt.value)}
                  className={`relative p-6 rounded-2xl border-2 transition-all group overflow-hidden
                    ${lastFeedback === opt.value
                      ? 'border-primary bg-primary/10 scale-95'
                      : 'border-transparent bg-card hover:border-primary/20 hover:bg-muted shadow-sm'}
                  `}
                >
                  <div className="flex flex-col items-center gap-3 relative z-10">
                    <span className={`text-4xl transition-transform group-hover:scale-110 duration-300 ${lastFeedback === opt.value ? 'animate-bounce' : ''}`}>
                      {opt.emoji}
                    </span>
                    <span className="font-semibold text-sm">{opt.label}</span>
                  </div>
                  {lastFeedback === opt.value && (
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {lastFeedback && (
              <p className="text-center text-sm font-medium text-green-600 animate-in fade-in duration-300">
                Response recorded. Thanks!
              </p>
            )}

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-4 text-center text-xs text-muted-foreground italic">
                You can change your response at any time during the session.
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
