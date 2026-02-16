"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageQuestion, Flash, Book, TickCircle, Clock } from "iconsax-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Poll {
    id: string;
    question: string;
    options: string[];
    expiresAt: string;
    createdAt: string;
    classroomId: string;
    classroom: {
        name: string;
    };
}

export default function StudentPollsPage() {
    const queryClient = useQueryClient();
    const [respondingTo, setRespondingTo] = useState<string | null>(null);

    const { data: activePolls, isLoading } = useQuery({
        queryKey: ["student", "active-polls"],
        queryFn: () => api<Poll[]>("/api/polls/active/all"),
    });

    const respondMutation = useMutation({
        mutationFn: ({ pollId, option }: { pollId: string, option: string }) =>
            api(`/api/polls/${pollId}/respond`, {
                method: "POST",
                body: JSON.stringify({ selectedOption: option }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["student", "active-polls"] });
            setRespondingTo(null);
        },
    });

    return (
        <DashboardLayout requiredRole="student">
            <div className="space-y-8 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Active Polls</h1>
                        <p className="text-muted-foreground mt-1">
                            Your instructors are waiting for your feedback.
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-gray-500 mt-4">Checking for active polls...</p>
                    </div>
                ) : activePolls && activePolls.length > 0 ? (
                    <div className="grid gap-6">
                        {activePolls.map((poll) => (
                            <Card key={poll.id} className="border-none shadow-xl shadow-primary/5 bg-white overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider">
                                            <Clock size="14" variant="Bold" />
                                            Expires {new Date(poll.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                            {poll.classroom.name}
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl mt-4 font-bold text-gray-900 leading-tight">
                                        {poll.question}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid gap-3">
                                        {poll.options.map((option) => (
                                            <Button
                                                key={option}
                                                variant="outline"
                                                className="h-14 justify-start text-left px-6 rounded-2xl border-gray-100 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 font-semibold group/btn relative overflow-hidden"
                                                disabled={respondMutation.isPending}
                                                onClick={() => {
                                                    setRespondingTo(poll.id);
                                                    respondMutation.mutate({ pollId: poll.id, option });
                                                }}
                                            >
                                                <div className="flex items-center gap-4 w-full relative z-10">
                                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 group-hover/btn:bg-primary/10 group-hover/btn:text-primary transition-colors">
                                                        {option.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="flex-1 truncate">{option}</span>
                                                    {respondMutation.isPending && respondingTo === poll.id && (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    )}
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-gray-100 py-24 bg-transparent">
                        <CardContent className="flex flex-col items-center text-center space-y-6">
                            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                <MessageQuestion size="48" variant="Outline" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-gray-900">No active polls</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    When your instructor runs a poll during a live session, it will show up here.
                                </p>
                            </div>
                            <Button variant="outline" className="rounded-full px-8 h-12 font-bold" asChild>
                                <Link href="/student/classes">
                                    <Book size="18" className="mr-2" />
                                    Check My Classes
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-none shadow-sm bg-primary/5 p-6 rounded-3xl flex gap-5 items-start">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Flash size="28" variant="Bold" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">How polls work</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            During a live session, your teacher can launch quick polls. Your responses are anonymous and help shape the lesson in real time. Make sure to respond before the timer runs out!
                        </p>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
