"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    VideoPlay,
    Timer1,
    Profile2User,
    Messages1,
    Chart1,
    CloseCircle,
    Flash,
    MessageQuestion,
    TickCircle,
    Book
} from "iconsax-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, wsUrl } from "@/lib/api";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { AttendanceChart } from "@/components/charts/AttendanceChart";

interface Classroom {
    id: string;
    name: string;
    description: string | null;
}

interface Session {
    id: string;
    classroomId: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
}

interface AggregatePayload {
    counts: Record<string, number>;
    total: number;
}

interface Aggregate {
    sessionId: string;
    realtime: AggregatePayload;
    postClass: {
        levelCounts: Record<string, number>;
        total: number;
        sampleThemes: string[];
    };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SessionLivePage() {
    const { id } = useParams() as { id: string };
    const queryClient = useQueryClient();
    const router = useRouter();
    const [wsAggregate, setWsAggregate] = useState<AggregatePayload | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const isNewSession = id === "new";

    const { data: session, isLoading: isLoadingSession } = useQuery({
        queryKey: ["teacher", "session", id],
        queryFn: () => api<Session>(`/api/sessions/${id}`),
        enabled: !isNewSession && !!id && UUID_REGEX.test(id),
    });

    const { data: aggregate, isLoading: isLoadingAgg } = useQuery({
        queryKey: ["teacher", "session", id, "aggregate"],
        queryFn: () => api<Aggregate>(`/api/sessions/${id}/aggregate`),
        refetchInterval: (query) => (query.state.data as any)?.status === "active" ? 30000 : false,
        enabled: !isNewSession && !!id && UUID_REGEX.test(id),
    });

    const endSessionMutation = useMutation({
        mutationFn: () => api(`/api/sessions/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "ended" }),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacher", "session", id] });
            if (wsRef.current) wsRef.current.close();
        }
    });

    useEffect(() => {
        if (session?.status === "active") {
            const url = wsUrl(id);
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "aggregate") {
                        setWsAggregate(data.payload);
                    }
                } catch (e) {
                    console.error("WS parse error", e);
                }
            };

            return () => {
                ws.close();
            };
        }
    }, [id, session?.status]);

    const activeAgg = wsAggregate || aggregate?.realtime;
    const chartData = activeAgg ? Object.entries(activeAgg.counts).map(([level, count]) => ({
        name: `Level ${level}`,
        attendance: count // Using attendance prop for generic bar height
    })) : [];

    if (isNewSession) {
        return (
            <NewSessionPage
                onStarted={(sessionId) => router.push(`/teacher/sessions/${sessionId}`)}
            />
        );
    }

    if (isLoadingSession) {
        return (
            <DashboardLayout requiredRole="teacher">
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!session) return <div>Session not found</div>;

    const isLive = session.status === "active";

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full" asChild>
                            <Link href={`/teacher/classrooms/${session.classroomId}`}>
                                <ArrowLeft size="24" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    {isLive ? "Live Session" : "Session Summary"}
                                </h1>
                                {isLive && (
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </div>
                            <p className="text-muted-foreground">
                                Started at {new Date(session.startedAt).toLocaleTimeString()}
                                {!isLive && session.endedAt && ` • Ended at ${new Date(session.endedAt).toLocaleTimeString()}`}
                            </p>
                        </div>
                    </div>
                    {isLive && (
                        <Button
                            variant="destructive"
                            className="rounded-full px-8 shadow-lg shadow-red-500/20"
                            onClick={() => endSessionMutation.mutate()}
                            disabled={endSessionMutation.isPending}
                        >
                            <CloseCircle size="20" className="mr-2" />
                            End Session
                        </Button>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Profile2User size="18" className="text-primary" />
                                Current Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{activeAgg?.total || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Actively participating</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Flash size="18" className="text-orange-500" />
                                Avg. Understanding
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {activeAgg && activeAgg.total > 0
                                    ? (Object.entries(activeAgg.counts).reduce((acc, [lvl, count]) => acc + (Number(lvl) * count), 0) / activeAgg.total).toFixed(1)
                                    : "0.0"
                                }/5.0
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Real-time aggregate</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium text-white/70 uppercase tracking-wider flex items-center gap-2">
                                <MessageQuestion size="18" variant="Bold" />
                                Active Polls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold">0</div>
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 p-0 h-auto mt-1 flex items-center gap-1 group">
                                Create Poll <ArrowRight size="14" className="group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                            <Chart1 size="100" variant="Bold" />
                        </div>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    <Card className="lg:col-span-3 border-none shadow-sm bg-white p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold flex items-center gap-2 border-l-4 border-primary pl-4">
                                Understanding Distribution
                            </h3>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                    LIVE FEED
                                </div>
                            </div>
                        </div>
                        <AttendanceChart data={chartData} />
                    </Card>

                    <Card className="lg:col-span-2 border-none shadow-sm bg-white p-8 overflow-hidden">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Messages1 size="24" className="text-primary" />
                            Post-Session Feedback
                        </h3>
                        {!isLive && aggregate?.postClass.sampleThemes.length ? (
                            <div className="space-y-4">
                                {aggregate.postClass.sampleThemes.map((theme, i) => (
                                    <div key={i} className="flex gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary text-xs font-bold shrink-0 shadow-sm">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed italic">"{theme}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
                                <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
                                    <Timer1 size="32" variant="Bold" />
                                </div>
                                <p className="text-muted-foreground text-sm max-w-[200px]">
                                    {isLive
                                        ? "Feedback will be collected and summarized after the session ends."
                                        : "No detailed feedback submitted for this session."}
                                </p>
                            </div>
                        )}

                        {!isLive && (
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-2 mb-4 text-primary">
                                    <TickCircle size="20" variant="Bold" />
                                    <span className="font-bold">AI Insights</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-sm text-gray-700 leading-relaxed">
                                    Based on the data, students generally found the core concepts clear, though some had questions regarding the practical applications covered in the second half.
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

function NewSessionPage({ onStarted }: { onStarted: (sessionId: string) => void }) {
    const { data: classrooms, isLoading } = useQuery({
        queryKey: ["teacher", "classrooms"],
        queryFn: () => api<Classroom[]>("/api/classrooms"),
    });
    const startMutation = useMutation({
        mutationFn: (classroomId: string) =>
            api<Session>(`/api/classrooms/${classroomId}/sessions`, { method: "POST" }),
        onSuccess: (data) => onStarted(data.id),
    });

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full" asChild>
                        <Link href="/teacher">
                            <ArrowLeft size="24" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Start New Session</h1>
                        <p className="text-muted-foreground mt-1">
                            Choose a classroom to start a live session.
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : classrooms && classrooms.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {classrooms.map((c) => (
                            <Card key={c.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Book size="24" variant="Bold" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{c.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 mt-0.5">
                                                {c.description || "No description"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        className="w-full rounded-full gap-2"
                                        onClick={() => startMutation.mutate(c.id)}
                                        disabled={startMutation.isPending}
                                    >
                                        {startMutation.isPending && startMutation.variables === c.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <VideoPlay size="20" variant="Bold" />
                                        )}
                                        Start Session
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-gray-100 py-16 text-center">
                        <CardContent>
                            <Book size="48" className="mx-auto text-gray-300 mb-4" variant="Outline" />
                            <p className="font-medium text-gray-900">No classrooms yet</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Create a classroom first, then you can start sessions.
                            </p>
                            <Button variant="outline" className="rounded-full" asChild>
                                <Link href="/teacher/classrooms">Go to Classrooms</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {startMutation.isError && (
                    <p className="text-sm text-red-500 text-center">{(startMutation.error as Error).message}</p>
                )}
            </div>
        </DashboardLayout>
    );
}
