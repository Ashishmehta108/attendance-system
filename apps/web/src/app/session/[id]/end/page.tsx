"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AlertTriangle, ChevronLeft } from "lucide-react";

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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card h-16 flex items-center">
        <div className="container max-w-lg flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href={`/session/${sessionId}/live`}><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-xl font-bold">End Session</h1>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/20 border-2">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Are you absolutely sure?</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            Ending this session will stop all live student heartbeats and trigger the AI summary generation. This action cannot be undone.
          </CardContent>
          <CardFooter className="flex flex-col gap-3 p-6 pt-0">
            <Button
              className="w-full h-12 text-lg"
              variant="destructive"
              onClick={() => endSession.mutate()}
              disabled={endSession.isPending}
            >
              {endSession.isPending ? "Terminating..." : "Yes, end session"}
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href={`/session/${sessionId}/live`}>Return to live session</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
