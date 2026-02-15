"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EndSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const endSession = useMutation({
    mutationFn: () =>
      api(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ended" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["classroom-sessions"] });
      router.push(`/session/${sessionId}/summary`);
    },
  });

  if (session && !session.user) router.push("/login");

  return (
    <div className="container max-w-md py-8">
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4">End this session? Summary will be generated shortly after.</p>
          <div className="flex gap-2">
            <Button onClick={() => endSession.mutate()} disabled={endSession.isPending}>
              {endSession.isPending ? "Ending…" : "End session"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/session/${sessionId}/live`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
