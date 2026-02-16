"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notification, Book, Check, CloseCircle, User, Calendar } from "iconsax-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface Teacher {
    id: string;
    name: string;
    email: string;
}

interface Classroom {
    id: string;
    name: string;
    description: string | null;
}

interface Invite {
    id: string;
    classroomId: string;
    teacherId: string;
    status: string;
    createdAt: string;
    classroom: Classroom;
    teacher: Teacher;
}

export default function StudentInvitesPage() {
    const queryClient = useQueryClient();
    const { data: invites, isLoading } = useQuery({
        queryKey: ["student", "invites"],
        queryFn: () => api<Invite[]>("/api/invites"),
    });

    const respondMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: "accepted" | "declined" }) =>
            api(`/api/invites/${id}/respond`, {
                method: "POST",
                body: JSON.stringify({ status }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["student", "invites"] });
            queryClient.invalidateQueries({ queryKey: ["student", "classes"] });
        }
    });

    return (
        <DashboardLayout requiredRole="student">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classroom Invitations</h1>
                    <p className="text-muted-foreground mt-1">
                        Respond to invitations from your teachers to join their classes.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : invites && invites.length > 0 ? (
                    <div className="space-y-4">
                        {invites.map((invite) => (
                            <Card key={invite.id} className="border-none shadow-sm bg-white overflow-hidden group">
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-1 md:w-2 bg-primary group-hover:w-3 transition-all" />
                                    <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                <Book size="24" variant="Bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg leading-none">{invite.classroom.name}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-1">{invite.classroom.description || "No description available"}</p>
                                                <div className="flex flex-wrap gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <User size="14" />
                                                        <span>By {invite.teacher.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <Calendar size="14" />
                                                        <span>Received {new Date(invite.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                className="rounded-full border-gray-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 px-6 h-11"
                                                onClick={() => respondMutation.mutate({ id: invite.id, status: "declined" })}
                                                disabled={respondMutation.isPending}
                                            >
                                                <CloseCircle size="18" className="mr-2" />
                                                Decline
                                            </Button>
                                            <Button
                                                className="rounded-full px-8 h-11 shadow-lg shadow-primary/20"
                                                onClick={() => respondMutation.mutate({ id: invite.id, status: "accepted" })}
                                                disabled={respondMutation.isPending}
                                            >
                                                <Check size="18" className="mr-2" />
                                                Accept Invite
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-2 border-dashed border-gray-100 py-32 bg-transparent">
                        <CardContent className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                <Notification size="40" variant="Outline" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold text-gray-900">All caught up!</h3>
                                <p className="text-muted-foreground">You don't have any pending classroom invitations at the moment.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
