"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
}

export default function SessionsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms"],
    queryFn: () => api<Classroom[]>("/api/classrooms"),
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (session === null || (session && !session.user)) router.push("/login");
  }, [session, router]);

  if (!session?.user) return null;

  const activeSessions: { session: ClassSession; classroom: Classroom }[] = [];
  // Flatten: for each classroom fetch sessions and collect active ones
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Button variant="outline" onClick={() => authClient.signOut().then(() => router.push("/login"))}>
          Sign out
        </Button>
      </div>
      <SessionsList classrooms={classrooms} />
    </div>
  );
}

function SessionsList({ classrooms }: { classrooms: Classroom[] }) {
  return (
    <div className="grid gap-4">
      {classrooms.map((c) => (
        <Card key={c.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{c.name}</CardTitle>
            <Link href={`/classrooms/${c.id}`}>
              <Button variant="outline" size="sm">
                View sessions
              </Button>
            </Link>
          </CardHeader>
        </Card>
      ))}
      {classrooms.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-muted-foreground">
            No classrooms available. Ask an instructor to add you.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
