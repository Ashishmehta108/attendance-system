"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Book,

    VideoPlay,
    Add,
    MoreCircle,
    ProfileCircle,
    Copy,
    TickCircle,
    Calendar,
    ArrowRight,
    MessageQuestion
} from "iconsax-react";
import { Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInviteSchema, type CreateInviteInput } from "@attendance-app/shared";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";

interface Classroom {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
}

interface Member {
    id: string;
    name: string;
    email: string;
    image: string | null;
    joinedAt: string;
}

interface Session {
    id: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
}

export default function ClassroomDetailPage() {
    const { id } = useParams() as { id: string };
    const queryClient = useQueryClient();
    const [inviteError, setInviteError] = useState("");
    const [inviteSuccess, setInviteSuccess] = useState(false);

    const { data: classroom, isLoading: isLoadingClass } = useQuery({
        queryKey: ["teacher", "classroom", id],
        queryFn: () => api<Classroom>(`/api/classrooms/${id}`),
    });

    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["teacher", "classroom", id, "members"],
        queryFn: () => api<Member[]>(`/api/classrooms/${id}/members`),
    });

    const { data: sessions, isLoading: isLoadingSessions } = useQuery({
        queryKey: ["teacher", "classroom", id, "sessions"],
        queryFn: () => api<Session[]>(`/api/classrooms/${id}/sessions`),
    });

    const inviteForm = useForm<CreateInviteInput>({
        resolver: zodResolver(createInviteSchema),
        defaultValues: {
            classroomId: id,
            studentEmail: "",
        },
    });

    const inviteMutation = useMutation({
        mutationFn: (data: CreateInviteInput) => api("/api/invites", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            setInviteSuccess(true);
            inviteForm.reset();
            setTimeout(() => setInviteSuccess(false), 3000);
        },
        onError: (error: any) => {
            setInviteError(error.message || "Failed to send invite");
        }
    });

    const onInvite = (data: CreateInviteInput) => {
        setInviteError("");
        inviteMutation.mutate(data);
    };

    if (isLoadingClass) {
        return (
            <DashboardLayout requiredRole="teacher">
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!classroom) return <div>Classroom not found</div>;

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full" asChild>
                        <Link href="/teacher/classrooms">
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
                        {/* Quick Actions */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
                                <CardHeader className="relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                                        <VideoPlay size="24" variant="Bold" />
                                    </div>
                                    <CardTitle>Launch Live Session</CardTitle>
                                    <CardDescription className="text-white/70">
                                        Start a new session for students to join and track performance.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <Button className="w-full bg-white text-primary hover:bg-gray-50 border-none rounded-full font-bold h-11" asChild>
                                        <Link href={`/teacher/sessions/new?classroomId=${id}`}>
                                            Start Now
                                        </Link>
                                    </Button>
                                </CardContent>
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                                    <VideoPlay size="140" variant="Bold" />
                                </div>
                            </Card>

                            <Card className="border-none shadow-sm bg-white overflow-hidden relative border-l-4 border-l-green-500">
                                <CardHeader>
                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-2 text-green-500">
                                        <Users size="24" />
                                    </div>
                                    <CardTitle>Invite Students</CardTitle>
                                    <CardDescription>
                                        Add students to your classroom via email.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...inviteForm}>
                                        <form onSubmit={inviteForm.handleSubmit(onInvite)} className="flex gap-2">
                                            <FormField
                                                control={inviteForm.control}
                                                name="studentEmail"
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                <Input
                                                                    placeholder="student@example.com"
                                                                    {...field}
                                                                    className="pl-10 h-11 rounded-full border-gray-200 focus:ring-green-500/10 focus:border-green-500"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="submit"
                                                className="bg-green-600 hover:bg-green-700 h-11 rounded-full px-6"
                                                disabled={inviteMutation.isPending}
                                            >
                                                {inviteMutation.isPending ? "..." : "Invite"}
                                            </Button>
                                        </form>
                                    </Form>
                                    {inviteSuccess && (
                                        <div className="mt-2 text-xs font-semibold text-green-600 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                            <TickCircle size="14" variant="Bold" />
                                            Invite sent successfully!
                                        </div>
                                    )}
                                    {inviteError && (
                                        <div className="mt-2 text-xs font-semibold text-red-500 animate-in fade-in slide-in-from-top-1">
                                            {inviteError}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white overflow-hidden relative border-l-4 border-l-orange-500 md:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div>
                                        <CardTitle className="text-xl">Quick Polls</CardTitle>
                                        <CardDescription>Launch interactive polls to engage students during live sessions.</CardDescription>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                        <MessageQuestion size="24" variant="Bold" />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        Polls are a great way to check understanding and keep students engaged. View results in real-time.
                                    </p>
                                    <Button className="bg-orange-600 hover:bg-orange-700 rounded-full px-8" asChild>
                                        <Link href={`/teacher/polls?classroomId=${id}`}>
                                            Manage Polls
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Session History */}
                        <Card className="border-none shadow-sm bg-white p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Calendar size="20" className="text-primary" />
                                    Session History
                                </h3>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/teacher/classrooms/${id}/sessions`} className="text-primary font-semibold">View All</Link>
                                </Button>
                            </div>

                            {isLoadingSessions ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                            ) : sessions && sessions.length > 0 ? (
                                <div className="space-y-4">
                                    {sessions.slice(0, 5).map((session) => (
                                        <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    <VideoPlay size="20" variant={session.status === 'active' ? 'Bold' : 'Outline'} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {new Date(session.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(session.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        {session.status === 'active' ? ' • Live Now' : ` • ${session.endedAt ? 'Ended' : 'Completed'}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="rounded-full" asChild>
                                                <Link href={`/teacher/sessions/${session.id}`}>
                                                    <ArrowRight size="20" />
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground italic">
                                    No sessions recorded yet. Start your first session above!
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-8">
                        {/* Students List */}
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Users size="22" className="text-primary" />
                                    Enrolled Students
                                    <span className="ml-auto text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                                        {members?.length || 0}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-0">
                                {isLoadingMembers ? (
                                    <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                                ) : members && members.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {members.map((member) => (
                                            <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                        {member.image ? (
                                                            <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            member.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{member.name}</p>
                                                        <p className="text-[10px] text-gray-400">{member.email}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                                                    <MoreCircle size="18" className="text-gray-400" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-6 py-10 text-center text-muted-foreground italic text-sm">
                                        No students enrolled yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Classroom Stats */}
                        <Card className="border-none shadow-sm bg-gray-900 text-white p-6">
                            <h3 className="font-bold mb-4">Classroom Insights</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Avg. Attendance</span>
                                    <span className="font-bold">92%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[92%]" />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Engagement</span>
                                    <span className="font-bold">8.4/10</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[84%]" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
