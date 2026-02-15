"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect } from "react";

interface ClassSession {
  id: string;
  classroomId: string;
  status: string;
  startedAt: string;
}

interface Classroom {
  id: string;
  name: string;
  description: string | null;
}

export default function ClassroomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { data: classroom, isLoading: loadingClass } = useQuery({
    queryKey: ["classroom", id],
    queryFn: () => api<Classroom>(`/api/classrooms/${id}`),
    enabled: !!id && !!session?.user,
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["classroom-sessions", id],
    queryFn: () => api<ClassSession[]>(`/api/classrooms/${id}/sessions`),
    enabled: !!id && !!session?.user,
  });

  const startSession = useMutation({
    mutationFn: () => api<ClassSession>(`/api/classrooms/${id}/sessions`, { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classroom-sessions", id] });
      router.push(`/session/${data.id}/live`);
    },
  });

  useEffect(() => {
    if (session === null || (session && !session.user)) router.push("/login");
  }, [session, router]);

  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role ?? "student";
  const isInstructor = role === "admin" || role === "instructor";

  if (loadingClass || !classroom) return <div className="container py-8">Loading…</div>;

  const activeSession = sessions.find((s) => s.status === "active");
  const endedSessions = sessions.filter((s) => s.status === "ended");

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={isInstructor ? "/dashboard" : "/sessions"}>{isInstructor ? "Dashboard" : "Sessions"}</Link>
          </Button>
          <h1 className="text-2xl font-bold mt-2">{classroom.name}</h1>
        </div>
      </div>
      {classroom.description && (
        <p className="text-muted-foreground mb-6">{classroom.description}</p>
      )}

      {isInstructor && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            {activeSession ? (
              <div className="flex items-center justify-between">
                <p>Active session in progress.</p>
                <Button asChild>
                  <Link href={`/session/${activeSession.id}/live`}>Open live view</Link>
                </Button>
              </div>
            ) : (
              <Button onClick={() => startSession.mutate()} disabled={startSession.isPending}>
                {startSession.isPending ? "Starting…" : "Start session"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <h2 className="font-semibold mb-2">Sessions</h2>
      {loadingSessions ? (
        <p>Loading sessions…</p>
      ) : (
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground">No sessions yet.</p>
          ) : (
            sessions.map((s) => (
              <Card key={s.id}>
                <CardContent className="py-4 flex flex-row items-center justify-between">
                  <span className={s.status === "active" ? "text-green-600 font-medium" : ""}>
                    {s.status === "active" ? "Active" : "Ended"} — {new Date(s.startedAt).toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/session/${s.id}/live`}>
                        {s.status === "active" ? "Join" : "View"}
                      </Link>
                    </Button>
                    {s.status === "ended" && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/session/${s.id}/feedback`}>Give feedback</Link>
                      </Button>
                    )}
                    {isInstructor && s.status === "ended" && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/session/${s.id}/summary`}>Summary</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
