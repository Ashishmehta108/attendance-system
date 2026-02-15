"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect } from "react";

interface Classroom {
  id: string;
  name: string;
  description: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ["classrooms"],
    queryFn: () => api<Classroom[]>("/api/classrooms"),
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (session === null || (session && !session.user)) router.push("/login");
    else if (session?.user) {
      const role = (session.user as { role?: string }).role ?? "student";
      if (role !== "admin" && role !== "instructor") router.push("/sessions");
    }
  }, [session, router]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  if (!session?.user || (session.user as { role?: string }).role === "student") return null;

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Classrooms</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
          <Button asChild>
            <Link href="/classrooms/new">New classroom</Link>
          </Button>
        </div>
      </div>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="grid gap-4">
          {classrooms.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">No classrooms yet. Create one to start sessions.</p>
              </CardContent>
            </Card>
          ) : (
            classrooms.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{c.name}</CardTitle>
                  <Link href={`/classrooms/${c.id}`}>
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </Link>
                </CardHeader>
                {c.description && (
                  <CardContent className="pt-0 text-muted-foreground text-sm">
                    {c.description}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
