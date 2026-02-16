"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    VideoPlay,
    Flash,
    EmojiNormal,
    EmojiHappy,
    EmojiSad,
    Send,
    MessageQuestion,
    TickCircle
} from "iconsax-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, wsUrl } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Session {
    id: string;
    classroomId: string;
    status: string;
    startedAt: string;
}

export default function StudentLiveSessionPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [lastSubmitted, setLastSubmitted] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const { data: session, isLoading: isLoadingSession } = useQuery({
        queryKey: ["student", "session", id],
        queryFn: () => api<Session>(`/api/sessions/${id}`),
    });

    useEffect(() => {
        if (session?.status === "active") {
            const url = wsUrl(id);
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => console.log("WS Connected");
            ws.onclose = () => {
                console.log("WS Closed");
                // If session ended, redirect back to classroom
                router.push(`/student/classes/${session.classroomId}`);
            };

            return () => {
                ws.close();
            };
        }
    }, [id, session?.status]);

    const submitFeedback = (value: number) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        setIsSubmitting(true);
        setSelectedLevel(value);

        wsRef.current.send(JSON.stringify({ value }));

        setTimeout(() => {
            setLastSubmitted(value);
            setIsSubmitting(false);
        }, 300);
    };

    if (isLoadingSession) {
        return (
            <DashboardLayout requiredRole="student">
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!session || session.status !== "active") {
        return (
            <DashboardLayout requiredRole="student">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
                        <VideoPlay size="40" />
                    </div>
                    <h1 className="text-2xl font-bold">Session is not live</h1>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        This session hasn't started yet or has already ended.
                    </p>
                    <Button variant="ghost" className="mt-6 rounded-full" asChild>
                        <Link href="/student/classes">Go back to classes</Link>
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const feedbackLevels = [
        { value: 1, label: "Confused", icon: EmojiSad, color: "bg-red-50 text-red-500 border-red-100" },
        { value: 2, label: "A bit lost", icon: EmojiSad, color: "bg-orange-50 text-orange-500 border-orange-100" },
        { value: 3, label: "Okay", icon: EmojiNormal, color: "bg-yellow-50 text-yellow-600 border-yellow-100" },
        { value: 4, label: "Good", icon: EmojiHappy, color: "bg-blue-50 text-blue-500 border-blue-100" },
        { value: 5, label: "Clear!", icon: EmojiHappy, color: "bg-green-50 text-green-600 border-green-100" },
    ];

    return (
        <DashboardLayout requiredRole="student">
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="rounded-full" asChild>
                        <Link href={`/student/classes/${session.classroomId}`}>
                            <ArrowLeft size="24" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Live</span>
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">How's the pacing?</h1>
                    <p className="text-muted-foreground">
                        Your feedback is aggregate and anonymous to the instructor.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {feedbackLevels.map((level) => (
                        <motion.button
                            key={level.value}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => submitFeedback(level.value)}
                            disabled={isSubmitting}
                            className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 ${lastSubmitted === level.value
                                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                                    : "border-gray-100 bg-white hover:border-primary/20"
                                }`}
                        >
                            <level.icon
                                size="32"
                                variant={lastSubmitted === level.value ? "Bold" : "Outline"}
                                className={lastSubmitted === level.value ? "text-primary" : "text-gray-400"}
                            />
                            <span className={`mt-3 text-sm font-bold ${lastSubmitted === level.value ? "text-primary" : "text-gray-500"}`}>
                                {level.label}
                            </span>
                            {lastSubmitted === level.value && (
                                <motion.div
                                    layoutId="check"
                                    className="mt-2 bg-primary rounded-full p-0.5 text-white"
                                >
                                    <TickCircle size="12" variant="Bold" />
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </div>

                <Card className="border-none shadow-sm bg-white p-8">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MessageQuestion size="24" className="text-primary" />
                            Active Polls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        <div className="bg-gray-50 rounded-2xl p-8 border border-dashed border-gray-200 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-300 mb-4 shadow-sm">
                                <Flash size="24" />
                            </div>
                            <p className="text-sm text-gray-500 italic">
                                No active polls at the moment. Your instructor will push polls here during the session.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Bar */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 md:px-0">
                    <div className="bg-gray-900 text-white rounded-full p-2 pl-6 flex items-center justify-between shadow-2xl overflow-hidden group">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold tracking-wide">CONNECTED</span>
                        </div>
                        <div className="flex gap-1 h-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-1 bg-white/10 rounded-full overflow-hidden self-end mb-1" style={{ height: `${i * 20}%` }}>
                                    <div className="w-full bg-primary h-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
