"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Book, User } from "iconsax-react";
import { Loader2 } from "lucide-react";

interface Classroom {
    id: string;
    name: string;
    description: string | null;
    createdBy: string;
}

export default function AdminClassroomsPage() {
    const { data: classrooms, isLoading } = useQuery({
        queryKey: ["admin", "classrooms"],
        queryFn: () => api<Classroom[]>("/api/classrooms"),
    });

    return (
        <DashboardLayout requiredRole="admin">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classrooms</h1>
                    <p className="text-muted-foreground mt-1">
                        View all classrooms across the platform.
                    </p>
                </div>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Book size="22" className="text-primary" />
                            All Classrooms
                        </CardTitle>
                        <CardDescription>
                            {classrooms?.length ?? 0} classroom{classrooms?.length !== 1 ? "s" : ""}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : classrooms && classrooms.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {classrooms.map((c) => (
                                    <Card key={c.id} className="border-none shadow-sm bg-gray-50/50 hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg">{c.name}</CardTitle>
                                            <CardDescription className="line-clamp-2">
                                                {c.description || "No description"}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <User size="14" />
                                                <span>Creator ID: {c.createdBy.slice(0, 8)}…</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
                                <Book size="40" className="mx-auto text-gray-300 mb-4" variant="Outline" />
                                <p className="text-muted-foreground font-medium">No classrooms yet</p>
                                <p className="text-sm text-muted-foreground mt-1">Classrooms are created by teachers.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
