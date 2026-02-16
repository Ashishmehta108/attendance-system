"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { ChevronLeft, Plus, Play, ExternalLink, Calendar, MessageSquare, FileText, Badge, Clock } from "lucide-react";

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
  const isTeacher = role === "admin" || role === "teacher";

  if (loadingClass || !classroom) return <div className="min-h-screen flex items-center justify-center">Loading classroom…</div>;

  const activeSession = sessions.find((s) => s.status === "active");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card h-16 flex items-center mb-8 sticky top-0 z-10 backdrop-blur-md">
        <div className="container max-w-4xl flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href={isTeacher ? "/teacher" : "/sessions"}><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-grow">
            <h1 className="text-xl font-bold truncate">{classroom.name}</h1>
          </div>
          {isTeacher && !activeSession && (
            <Button onClick={() => startSession.mutate()} disabled={startSession.isPending} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Session</span>
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-4xl space-y-8 pb-20">
        <section className="bg-card border-2 rounded-2xl p-8 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight">{classroom.name}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            {classroom.description || "Manage your classroom sessions and view real-time feedback from students."}
          </p>

          {activeSession && (
            <div className="pt-4">
              <div className="bg-green-500/10 border-2 border-green-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <p className="font-semibold text-green-700">Active session in progress</p>
                </div>
                <Button size="sm" asChild className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                  <Link href={`/session/${activeSession.id}/live`} className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Join Live View
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent History
            </h3>
          </div>

          <div className="space-y-4">
            {loadingSessions ? (
              [1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)
            ) : sessions.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No sessions recorded yet.</p>
                {isTeacher && <p className="text-sm text-muted-foreground mt-1">Click "New Session" to get started.</p>}
              </div>
            ) : (
              sessions.map((s) => (
                <Card key={s.id} className="group hover:border-primary/20 transition-all rounded-xl overflow-hidden shadow-sm">
                  <CardContent className="p-0 flex flex-col sm:flex-row items-stretch sm:items-center">
                    <div className="flex-grow p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                        {s.status === 'active' ? <Play className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{new Date(s.startedAt).toLocaleDateString()}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${s.status === 'active' ? 'border-green-500 bg-green-50 text-green-700' : 'border-muted-foreground/20 text-muted-foreground'}`}>
                            {s.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Started at {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>

                    <div className="bg-muted/30 sm:bg-transparent border-t sm:border-t-0 sm:border-l p-4 sm:px-6 flex items-center gap-2 sm:gap-4 ml-auto">
                      {s.status === "active" ? (
                        <Button size="sm" asChild className="w-full sm:w-auto">
                          <Link href={`/session/${s.id}/live`}>Join</Link>
                        </Button>
                      ) : (
                        <>
                          {!isTeacher && (
                            <Button variant="outline" size="sm" asChild className="gap-2">
                              <Link href={`/session/${s.id}/feedback`}>
                                <MessageSquare className="w-4 h-4" />
                                Feedback
                              </Link>
                            </Button>
                          )}
                          {isTeacher && (
                            <Button variant="ghost" size="sm" asChild className="gap-2 group-hover:bg-primary/5">
                              <Link href={`/session/${s.id}/summary`}>
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="group-hover:text-primary transition-colors">Summary</span>
                              </Link>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="rounded-full" asChild>
                            <Link href={`/session/${s.id}/live`}><ExternalLink className="w-4 h-4 text-muted-foreground" /></Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
