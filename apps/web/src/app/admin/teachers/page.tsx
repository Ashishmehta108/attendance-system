"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTeacherSchema, type CreateTeacherInput } from "@attendance-app/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Teacher, Add, Edit2, Trash, CloseCircle } from "iconsax-react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface TeacherUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function AdminTeachersPage() {
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data: teachers, isLoading } = useQuery({
        queryKey: ["admin", "teachers"],
        queryFn: () => api<TeacherUser[]>("/api/teachers"),
    });

    const addForm = useForm<CreateTeacherInput>({
        resolver: zodResolver(createTeacherSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const addMutation = useMutation({
        mutationFn: (data: CreateTeacherInput) =>
            api("/api/teachers", { method: "POST", body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "teachers"] });
            addForm.reset();
            setShowAddForm(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api(`/api/teachers/${id}`, { method: "DELETE" }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "teachers"] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, name, email }: { id: string; name: string; email: string }) =>
            api(`/api/teachers/${id}`, { method: "PATCH", body: JSON.stringify({ name, email }) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "teachers"] });
            setEditingId(null);
        },
    });

    function onAddSubmit(data: CreateTeacherInput) {
        addMutation.mutate(data);
    }

    return (
        <DashboardLayout requiredRole="admin">
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
                        <p className="text-muted-foreground mt-1">
                            Add and manage teacher accounts.
                        </p>
                    </div>
                    {!showAddForm && (
                        <Button
                            className="rounded-full gap-2 shadow-md"
                            onClick={() => setShowAddForm(true)}
                        >
                            <Add size="20" variant="Bold" />
                            Add Teacher
                        </Button>
                    )}
                </div>

                {showAddForm && (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-lg">Add new teacher</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={() => {
                                    setShowAddForm(false);
                                    addForm.reset();
                                }}
                            >
                                <CloseCircle size="22" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Form {...addForm}>
                                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <FormField
                                            control={addForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Dr. Jane Smith" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={addForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="jane@school.edu" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={addForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="Min 6 characters" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {addMutation.isError && (
                                        <p className="text-sm text-red-500">{(addMutation.error as Error).message}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={addMutation.isPending}>
                                            {addMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                "Create Teacher"
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowAddForm(false);
                                                addForm.reset();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Teacher size="22" className="text-primary" />
                            All Teachers
                        </CardTitle>
                        <CardDescription>
                            {teachers?.length ?? 0} teacher{teachers?.length !== 1 ? "s" : ""} in the system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : teachers && teachers.length > 0 ? (
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50/80 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Email</th>
                                            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {teachers.map((t) => (
                                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                                {editingId === t.id ? (
                                                    <EditRow
                                                        teacher={t}
                                                        onSave={(name, email) => {
                                                            updateMutation.mutate({ id: t.id, name, email });
                                                        }}
                                                        onCancel={() => setEditingId(null)}
                                                        isPending={updateMutation.isPending}
                                                    />
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                                                        <td className="px-4 py-3 text-gray-600">{t.email}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="rounded-full h-9 w-9"
                                                                    onClick={() => setEditingId(t.id)}
                                                                >
                                                                    <Edit2 size="18" variant="Outline" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="rounded-full h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                    onClick={() => {
                                                                        if (confirm(`Remove ${t.name}? This cannot be undone.`)) {
                                                                            deleteMutation.mutate(t.id);
                                                                        }
                                                                    }}
                                                                    disabled={deleteMutation.isPending}
                                                                >
                                                                    <Trash size="18" variant="Outline" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
                                <Teacher size="40" className="mx-auto text-gray-300 mb-4" variant="Outline" />
                                <p className="text-muted-foreground font-medium">No teachers yet</p>
                                <p className="text-sm text-muted-foreground mt-1">Add your first teacher above.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

function EditRow({
    teacher,
    onSave,
    onCancel,
    isPending,
}: {
    teacher: TeacherUser;
    onSave: (name: string, email: string) => void;
    onCancel: () => void;
    isPending: boolean;
}) {
    const [name, setName] = useState(teacher.name);
    const [email, setEmail] = useState(teacher.email);

    return (
        <>
            <td className="px-4 py-2" colSpan={3}>
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        className="max-w-[180px] h-9"
                    />
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="max-w-[220px] h-9"
                    />
                    <Button
                        size="sm"
                        className="h-9"
                        onClick={() => onSave(name, email)}
                        disabled={isPending || !name.trim() || !email.trim()}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </td>
        </>
    );
}
