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

interface Session {
  id: string;
  status: string;
}

interface Aggregate {
  counts: Record<number, number>;
  total: number;
}

export default function SessionLivePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { data: session } = authClient.useSession();
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
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
      } catch {}
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
  const isInstructor = role === "admin" || role === "instructor";

  async function sendFeedback(value: number) {
    await api(`/api/sessions/${sessionId}/feedback/realtime`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
  }

  if (!sessionData) return <div className="container py-8">Loading…</div>;
  if (sessionData.status !== "active") {
    return (
      <div className="container py-8">
        <p>This session has ended.</p>
        {isInstructor && (
          <Button asChild>
            <Link href={`/session/${sessionId}/summary`}>View summary</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sessions">Back</Link>
        </Button>
        <h1 className="text-xl font-bold">Live session</h1>
      </div>

      {isInstructor ? (
        <Card>
          <CardHeader>
            <CardTitle>Real-time aggregate (anonymous)</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregate ? (
              <div className="space-y-2">
                <p>Total responses: {aggregate.total}</p>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="text-center">
                      <div className="text-2xl font-bold">{aggregate.counts[level] ?? 0}</div>
                      <div className="text-sm text-muted-foreground">Level {level}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>Waiting for feedback…</p>
            )}
            <Button className="mt-4" asChild>
              <Link href={`/session/${sessionId}/end`}>End session</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>How well do you understand? (1–5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button key={value} variant="outline" onClick={() => sendFeedback(value)}>
                  {value}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
