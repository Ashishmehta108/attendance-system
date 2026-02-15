"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Session {
  id: string;
  status: string;
}

export default function PostClassFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [level, setLevel] = useState<number>(3);
  const [comment, setComment] = useState("");

  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api<Session>(`/api/sessions/${sessionId}`),
    enabled: !!sessionId && !!session?.user,
  });

  const submit = useMutation({
    mutationFn: () =>
      api(`/api/sessions/${sessionId}/feedback/post`, {
        method: "POST",
        body: JSON.stringify({ understandingLevel: level, comment: comment || undefined }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      router.push("/sessions");
    },
  });

  if (session && !session.user) router.push("/login");
  if (!session?.user) return null;

  if (!sessionData) return <div className="container py-8">Loading…</div>;

  return (
    <div className="container max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle>Post-class feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">Understanding (1–5)</label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={level === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLevel(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Comment (optional)</label>
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What could be improved?"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? "Submitting…" : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Button variant="ghost" className="mt-4" asChild>
        <Link href="/sessions">Back to sessions</Link>
      </Button>
    </div>
  );
}
