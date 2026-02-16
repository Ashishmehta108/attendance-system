"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, User, ArrowRight, VideoPlay, InfoCircle } from "iconsax-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface Classroom {
    id: string;
    name: string;
    description: string | null;
    createdBy: string;
}

export default function StudentClassesPage() {
    const { data: classrooms, isLoading } = useQuery({
        queryKey: ["student", "classes"],
        queryFn: () => api<Classroom[]>("/api/classrooms"),
    });

    return (
        <DashboardLayout requiredRole="student">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Classrooms</h1>
                    <p className="text-muted-foreground mt-1">
                        View and access all the classrooms you are enrolled in.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : classrooms && classrooms.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {classrooms.map((classroom) => (
                            <Card key={classroom.id} className="group border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white">
                                <div className="h-2 bg-indigo-500 transition-all group-hover:h-3" />
                                <CardHeader className="pb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2 group-hover:scale-110 transition-transform duration-300">
                                        <Book size="24" variant="Bold" />
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                                        {classroom.name}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                                        {classroom.description || "No description provided."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                        <User size="16" className="text-gray-400" />
                                        <span>Instructor: Dr. Smith (Sample)</span>
                                    </div>

                                    <Button className="w-full rounded-full h-11 bg-gray-900 hover:bg-black font-semibold mt-4 group/btn" asChild>
                                        <Link href={`/student/classes/${classroom.id}`}>
                                            Enter Classroom
                                            <ArrowRight size="18" className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-gray-100 py-32 bg-transparent text-center">
                        <CardContent className="space-y-6">
                            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mx-auto">
                                <Book size="32" variant="Outline" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-gray-900">Not enrolled in any classes</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    You haven't joined any classrooms yet. Check your invitations or contact your teacher for an invite.
                                </p>
                            </div>
                            <Button variant="outline" className="rounded-full px-8 h-12" asChild>
                                <Link href="/student/invites">View Invitations</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
