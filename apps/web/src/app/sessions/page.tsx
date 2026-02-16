"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { BookOpen, LogOut, Search, GraduationCap, ChevronRight } from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  description?: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ["classrooms"],
    queryFn: () => api<Classroom[]>("/api/classrooms"),
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (session === null || (session && !session.user)) router.push("/login");
  }, [session, router]);

  if (!session?.user) return null;

  const userName = session.user.name || "Student";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container max-w-5xl h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-primary text-primary-foreground p-1 rounded">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span>Attendance</span>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={() => authClient.signOut().then(() => router.push("/login"))}>
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl py-12 px-4 space-y-12">
        <section className="space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase">
            Student Dashboard
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Welcome back, <br className="sm:hidden" />
            <span className="text-primary">{userName}!</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Select a classroom below to view active sessions or join your live interaction.
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Your Classrooms
            </h2>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((c) => (
                <Link key={c.id} href={`/classrooms/${c.id}`}>
                  <Card className="group border-2 border-transparent hover:border-primary/20 transition-all cursor-pointer overflow-hidden rounded-2xl h-full flex flex-col">
                    <CardHeader className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{c.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0 flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {c.description || "No description available for this classroom."}
                      </p>
                    </CardContent>
                    <div className="px-6 py-4 bg-muted/30 border-t flex justify-between items-center group-hover:bg-primary/5 transition-colors mt-auto">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Explore</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              ))}

              {classrooms.length === 0 && (
                <Card className="col-span-full border-dashed border-2 py-16 flex flex-col items-center justify-center bg-transparent">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="text-muted-foreground w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium">No classrooms assigned</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-2">
                    You haven't been added to any classrooms yet. Please contact your instructor to get started.
                  </p>
                </Card>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
