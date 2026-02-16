"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Book,
    VideoPlay,
    Profile2User,
    Flash,
    FavoriteChart,
    Calendar,
    ArrowRight,
    Information
} from "iconsax-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface Classroom {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
}

interface Session {
    id: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
}

export default function StudentClassroomDetailPage() {
    const { id } = useParams() as { id: string };

    const { data: classroom, isLoading: isLoadingClass } = useQuery({
        queryKey: ["student", "classroom", id],
        queryFn: () => api<Classroom>(`/api/classrooms/${id}`),
    });

    const { data: sessions, isLoading: isLoadingSessions } = useQuery({
        queryKey: ["student", "classroom", id, "sessions"],
        queryFn: () => api<Session[]>(`/api/classrooms/${id}/sessions`),
        refetchInterval: 30000, // Check for new active sessions every 30s
    });

    if (isLoadingClass) {
        return (
            <DashboardLayout requiredRole="student">
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!classroom) return <div>Classroom not found</div>;

    const activeSession = sessions?.find(s => s.status === "active");

    return (
        <DashboardLayout requiredRole="student">
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full" asChild>
                        <Link href="/student/classes">
                            <ArrowLeft size="24" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{classroom.name}</h1>
                        <p className="text-muted-foreground">{classroom.description || "No description provided"}</p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Active Session Callout */}
                        {activeSession ? (
                            <Card className="border-none shadow-lg shadow-primary/10 bg-gradient-to-br from-primary to-indigo-600 text-white overflow-hidden relative">
                                <CardHeader className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-white/80">Live Now</span>
                                    </div>
                                    <CardTitle className="text-2xl">Class is in Session!</CardTitle>
                                    <CardDescription className="text-white/80">
                                        Join now to participate in live feedback and polls.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <Button className="w-full md:w-auto bg-white text-primary hover:bg-gray-50 border-none rounded-full font-bold h-12 px-8" asChild>
                                        <Link href={`/student/sessions/${activeSession.id}`}>
                                            Join Live Session
                                        </Link>
                                    </Button>
                                </CardContent>
                                <div className="absolute right-[-30px] bottom-[-30px] opacity-10">
                                    <VideoPlay size="180" variant="Bold" />
                                </div>
                            </Card>
                        ) : (
                            <Card className="border-none shadow-sm bg-white p-8 text-center flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                                    <VideoPlay size="32" variant="Outline" />
                                </div>
                                <h3 className="font-bold text-lg">No active session</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                                    Your teacher hasn't started a session for this class yet. We'll show it here as soon as they do.
                                </p>
                            </Card>
                        )}

                        {/* Session History */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar size="20" className="text-primary" />
                                Past Sessions
                            </h3>
                            {isLoadingSessions ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                            ) : sessions && sessions.length > 0 ? (
                                <div className="space-y-3">
                                    {sessions.filter(s => s.status !== "active").map((session) => (
                                        <Card key={session.id} className="border-none shadow-sm bg-white hover:bg-gray-50 transition-colors">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <VideoPlay size="20" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {new Date(session.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Duration: 45 mins (Sample)
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right mr-4 hidden md:block">
                                                        <p className="text-xs font-bold text-green-600">Present</p>
                                                        <p className="text-[10px] text-gray-400">Checked out 11:45 AM</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="rounded-full">
                                                        <ArrowRight size="20" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    Empty history. Participation records will appear here.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Instructor Info */}
                        <Card className="border-none shadow-sm bg-white p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Profile2User size="20" className="text-primary" />
                                Instructor
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    S
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Dr. Smith</p>
                                    <p className="text-xs text-muted-foreground">smith@university.edu</p>
                                </div>
                            </div>
                        </Card>

                        {/* My Progress */}
                        <Card className="border-none shadow-sm bg-gray-900 text-white p-6 overflow-hidden relative">
                            <div className="relative z-10">
                                <h3 className="font-bold mb-6 flex items-center gap-2">
                                    <FavoriteChart size="20" className="text-primary" />
                                    My Progress
                                </h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400 uppercase tracking-wider">Attendance</span>
                                            <span className="font-bold">100%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full">
                                            <div className="h-full bg-primary w-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400 uppercase tracking-wider">Poll Response</span>
                                            <span className="font-bold">85%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full">
                                            <div className="h-full bg-indigo-500 w-[85%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                                <FavoriteChart size="120" variant="Bold" />
                            </div>
                        </Card>

                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex gap-4">
                            <Information size="24" className="text-primary shrink-0" />
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Tip: High participation in polls and live feedback sessions helps your instructor better tailor the class materials.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
