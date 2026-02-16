"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronLeft, Send, CheckCircle2 } from "lucide-react";

interface Session {
  id: string;
  status: string;
}

const FEEDBACK_OPTIONS = [
  { value: 1, emoji: "😟", label: "Confused", color: "text-red-600" },
  { value: 2, emoji: "🤨", label: "Tough", color: "text-orange-600" },
  { value: 3, emoji: "😐", label: "Okay", color: "text-yellow-600" },
  { value: 4, emoji: "🙂", label: "Good", color: "text-lime-600" },
  { value: 5, emoji: "🤩", label: "Great", color: "text-green-600" },
];

export default function PostClassFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [level, setLevel] = useState<number>(3);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
      setSubmitted(true);
      setTimeout(() => router.push("/sessions"), 2000);
    },
  });

  if (session && !session.user) router.push("/login");
  if (!session?.user) return null;

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-500/20 bg-green-500/5">
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully. Redirecting...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card h-16 flex items-center mb-8 sticky top-0 z-10 backdrop-blur-md">
        <div className="container max-w-2xl flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/sessions"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Share Your Feedback</h1>
        </div>
      </header>

      <main className="container max-w-2xl pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-2">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg">How well did you understand today's session?</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-5 gap-3">
              {FEEDBACK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLevel(opt.value)}
                  className={`relative p-4 rounded-2xl border-2 transition-all group overflow-hidden
                    ${level === opt.value
                      ? 'border-primary bg-primary/10 scale-95'
                      : 'border-transparent bg-card hover:border-primary/20 hover:bg-muted shadow-sm'}
                  `}
                >
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <span className={`text-3xl transition-transform group-hover:scale-110 duration-300 ${level === opt.value ? 'animate-bounce' : ''}`}>
                      {opt.emoji}
                    </span>
                    <span className={`font-semibold text-xs ${level === opt.value ? opt.color : 'text-muted-foreground'}`}>
                      {opt.label}
                    </span>
                  </div>
                  {level === opt.value && (
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                Additional Comments
                <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What went well? What could be improved? Any suggestions for future sessions?"
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/500 characters
              </p>
            </div>

            <Button 
              onClick={() => submit.mutate()} 
              disabled={submit.isPending}
              className="w-full h-12 text-lg gap-2"
              size="lg"
            >
              {submit.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="bg-muted/30 border-2 border-dashed rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Your feedback is anonymous and helps instructors improve future sessions. Thank you for taking the time to share your thoughts!
          </p>
        </div>
      </main>
    </div>
  );
}
