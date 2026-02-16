"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    UserAdd,
    SearchNormal1,
    TickCircle,
    ProfileCircle,
    Notification,
    Flash,
    Book
} from "iconsax-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

interface Classroom {
    id: string;
    name: string;
}

interface Student {
    id: string;
    name: string;
    email: string;
    image: string | null;
}

export default function TeacherInvitesPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClassroom, setSelectedClassroom] = useState<string>("");
    const [invitingId, setInvitingId] = useState<string | null>(null);

    const { data: classrooms, isLoading: isLoadingClasses } = useQuery({
        queryKey: ["teacher", "classrooms"],
        queryFn: () => api<Classroom[]>("/api/classrooms"),
    });

    const { data: students, isLoading: isLoadingStudents } = useQuery({
        queryKey: ["teacher", "students-to-invite", selectedClassroom],
        queryFn: () => api<Student[]>(`/api/students${selectedClassroom ? `?classroomId=${selectedClassroom}` : ""}`),
    });

    const inviteMutation = useMutation({
        mutationFn: (studentId: string) => api("/api/invites", {
            method: "POST",
            body: JSON.stringify({
                classroomId: selectedClassroom,
                studentId: studentId,
            }),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacher", "students-to-invite", selectedClassroom] });
            setInvitingId(null);
        },
        onError: () => {
            setInvitingId(null);
        }
    });

    const handleInvite = (studentId: string) => {
        if (!selectedClassroom) return;
        setInvitingId(studentId);
        inviteMutation.mutate(studentId);
    };

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="space-y-8 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Student Invitations</h1>
                    <p className="text-muted-foreground mt-1">
                        Connect with students and grow your academic community.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Step 1: Select Classroom</label>
                        <Select onValueChange={setSelectedClassroom} value={selectedClassroom}>
                            <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-white shadow-sm focus:ring-primary/10">
                                <SelectValue placeholder="Which class are you inviting to?" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                {classrooms?.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-[1.5] space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Step 2: Search Students</label>
                        <div className="relative">
                            <SearchNormal1 size="18" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 pl-12 rounded-2xl border-gray-100 bg-white shadow-sm focus:ring-primary/10"
                            />
                        </div>
                    </div>
                </div>

                {!selectedClassroom ? (
                    <Card className="border-none shadow-sm bg-blue-50/50 p-12 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-primary mb-6 shadow-sm border border-blue-100">
                            <Book size="32" variant="Bold" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Start by selecting a class</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            Invitations are classroom-specific. Choose one from the dropdown above to see available students.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <ProfileCircle size="20" className="text-primary" />
                                Available Students
                                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full uppercase tracking-wider font-bold">
                                    {filteredStudents.length} Found
                                </span>
                            </h3>
                        </div>

                        {isLoadingStudents ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                            </div>
                        ) : filteredStudents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredStudents.map((student) => (
                                    <Card key={student.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow group overflow-hidden">
                                        <CardContent className="p-4 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary font-bold text-lg overflow-hidden border border-gray-100">
                                                    {student.image ? (
                                                        <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        student.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail size={12} />
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleInvite(student.id)}
                                                disabled={invitingId === student.id}
                                                className="rounded-xl h-10 px-6 font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
                                            >
                                                {invitingId === student.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <UserAdd size="16" className="mr-2" />
                                                        Invite
                                                    </>
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="border-none shadow-sm bg-gray-50 p-20 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-300 mb-6">
                                    <SearchNormal1 size="32" variant="Outline" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No students found</h3>
                                <p className="text-muted-foreground max-w-xs mt-1">
                                    Try adjusting your search or check if all students are already in this class.
                                </p>
                            </Card>
                        )}
                    </div>
                )}

                <Card className="border-none shadow-sm bg-orange-50/50 p-6 rounded-3xl flex gap-5 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                        <Notification size="24" variant="Bold" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Why invite students?</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Once a student accepts an invitation, they will have access to your classroom's sessions, polls, and reports. Building a focused classroom helps you track their progress better.
                        </p>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
