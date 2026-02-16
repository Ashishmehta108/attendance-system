"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Book, MoreVertical, Edit2, Trash2, Users,  ArrowRight } from "lucide-react";
import { VideoPlay } from "iconsax-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface Classroom {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
}

export default function TeacherClassroomsPage() {
    const { data: classrooms, isLoading } = useQuery({
        queryKey: ["teacher", "classrooms"],
        queryFn: () => api<Classroom[]>("/api/classrooms"),
    });

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Classrooms</h1>
                        <p className="text-muted-foreground mt-1">
                            Create and manage your learning spaces.
                        </p>
                    </div>
                    <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
                        <Link href="/teacher/classrooms/new">
                            <Plus size="20" className="mr-2" />
                            Create Classroom
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : classrooms && classrooms.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {classrooms.map((classroom) => (
                            <Card key={classroom.id} className="group border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white">
                                <div className="h-2 bg-primary transition-all group-hover:h-3" />
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                                            <Book size="24" />
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-full text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical size="18" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors cursor-pointer">
                                        {classroom.name}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                                        {classroom.description || "No description provided."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Users size="16" className="text-gray-400" />
                                            <span>45 Students</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <VideoPlay size="16" className="text-gray-400" />
                                            <span>12 Sessions</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 rounded-full text-xs font-semibold" asChild>
                                            <Link href={`/teacher/classrooms/${classroom.id}`}>
                                                Manage
                                            </Link>
                                        </Button>
                                        <Button size="sm" className="flex-1 rounded-full text-xs font-semibold shadow-sm hover:translate-y-[-1px] transition-transform" asChild>
                                            <Link href={`/teacher/sessions/new?classroomId=${classroom.id}`}>
                                                Start Session
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-gray-200 py-32 bg-transparent">
                        <CardContent className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                <Plus size="40" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-gray-900">No classrooms yet</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Get started by creating your first classroom to invite students and start live feedback sessions.
                                </p>
                            </div>
                            <Button asChild className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20">
                                <Link href="/teacher/classrooms/new">
                                    Create My First Classroom
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
