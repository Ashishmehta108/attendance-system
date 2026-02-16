"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Book, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClassroomSchema, type CreateClassroomInput } from "@attendance-app/shared";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

export default function NewClassroomPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [serverError, setServerError] = useState("");

    const form = useForm<CreateClassroomInput>({
        resolver: zodResolver(createClassroomSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateClassroomInput) => api("/api/classrooms", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacher", "classrooms"] });
            router.push("/teacher/classrooms");
        },
        onError: (error: any) => {
            setServerError(error.message || "Failed to create classroom");
        }
    });

    async function onSubmit(data: CreateClassroomInput) {
        setServerError("");
        createMutation.mutate(data);
    }

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="max-w-2xl mx-auto space-y-8">
                <Button variant="ghost" asChild className="rounded-full pl-2 pr-4 hover:bg-gray-100/50">
                    <Link href="/teacher/classrooms">
                        <ArrowLeft size="18" className="mr-2" />
                        Back to Classrooms
                    </Link>
                </Button>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        Create a New Classroom
                        <Sparkles className="text-primary w-6 h-6 animate-pulse" />
                    </h1>
                    <p className="text-muted-foreground">
                        Set up a space for your students to join and track their feedback.
                    </p>
                </div>

                <Card className="border-none shadow-xl shadow-gray-200/50 bg-white overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary/50 to-primary" />
                    <CardHeader className="pb-2 pt-8 px-8">
                        <CardTitle className="text-xl">Classroom Details</CardTitle>
                        <CardDescription>
                            Provide a name and an optional description for your classroom.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-gray-700 font-semibold flex items-center gap-2">
                                                <Book size="16" className="text-primary" />
                                                Classroom Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Advanced Mathematics 101"
                                                    {...field}
                                                    className="h-12 border-gray-200 focus:border-primary focus:ring-primary/10 transition-all rounded-xl"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-gray-700 font-semibold flex items-center gap-2">
                                                <Info size="16" className="text-primary" />
                                                Description
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="A brief overview of the course subjects..."
                                                    {...field}
                                                    value={field.value || ""} // Handle potentially null/undefined
                                                    className="h-12 border-gray-200 focus:border-primary focus:ring-primary/10 transition-all rounded-xl"
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Optional. This will be visible to students when they join.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {serverError && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                                        {serverError}
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                        className="rounded-full h-12 flex-1 border-gray-200"
                                    >
                                        <Link href="/teacher/classrooms">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="rounded-full h-12 flex-1 shadow-lg shadow-primary/20"
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending ? "Creating Space..." : "Create Classroom"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
