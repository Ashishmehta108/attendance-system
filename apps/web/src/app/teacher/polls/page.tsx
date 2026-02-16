"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    MessageQuestion,
    Add,
    Trash,
    TickCircle,
    ChartSquare,
    Flash,
    Book,
    Clock,
    User
} from "iconsax-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPollSchema, type CreatePollInput } from "@attendance-app/shared";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { motion, AnimatePresence } from "framer-motion";

interface Classroom {
    id: string;
    name: string;
}

interface Poll {
    id: string;
    question: string;
    options: string[];
    expiresAt: string;
    createdAt: string;
    classroomId: string;
}

interface PollResult {
    poll: Poll;
    totalResponses: number;
    results: Record<string, number>;
}

export default function TeacherPollsPage() {
    const queryClient = useQueryClient();
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [viewingResults, setViewingResults] = useState<string | null>(null);

    const { data: classrooms, isLoading: isLoadingClasses } = useQuery({
        queryKey: ["teacher", "classrooms"],
        queryFn: () => api<Classroom[]>("/api/classrooms"),
    });

    const { data: polls, isLoading: isLoadingPolls } = useQuery({
        queryKey: ["teacher", "polls", selectedClassId],
        queryFn: () => api<Poll[]>(`/api/polls?classroomId=${selectedClassId}`),
        enabled: !!selectedClassId,
    });

    const { data: pollResults, isLoading: isLoadingResults } = useQuery({
        queryKey: ["teacher", "poll-results", viewingResults],
        queryFn: () => api<PollResult>(`/api/polls/${viewingResults}/results`),
        enabled: !!viewingResults,
    });

    const form = useForm<CreatePollInput>({
        resolver: zodResolver(createPollSchema),
        defaultValues: {
            classroomId: "",
            question: "",
            options: ["", ""],
        },
    });

    // @ts-ignore
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options",
    });

    const createPollMutation = useMutation({
        mutationFn: (data: CreatePollInput) => api("/api/polls", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacher", "polls", selectedClassId] });
            form.reset({
                classroomId: selectedClassId,
                question: "",
                options: ["", ""],
            } as CreatePollInput);
        },
    });

    const onSubmit = (data: CreatePollInput) => {
        createPollMutation.mutate(data);
    };

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="space-y-8 max-w-6xl mx-auto">
                <div className="pb-8 border-b border-gray-50">
                    <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
                    <p className="text-sm text-gray-500 mt-1">Check class understanding in real-time.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Create Poll */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-gray-100 rounded-3xl p-8 sticky top-8">
                            <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Add size="20" className="text-gray-400" />
                                Create New Poll
                            </h2>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="classroomId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider">Classroom</FormLabel>
                                                <Select
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        setSelectedClassId(val);
                                                    }}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-10 rounded-xl border-gray-100 focus:ring-0">
                                                            <SelectValue placeholder="Select class" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl">
                                                        {classrooms?.map((c) => (
                                                            <SelectItem key={c.id} value={c.id}>
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="question"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter your question"
                                                        {...field}
                                                        className="h-10 rounded-xl border-gray-100 focus:ring-0"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Options</Label>
                                        <div className="grid gap-2">
                                            {fields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        placeholder={`Option ${index + 1}`}
                                                                        className="h-10 rounded-xl border-gray-100 focus:ring-0 bg-gray-50/30"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {fields.length > 2 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => remove(index)}
                                                            className="h-10 w-10 text-gray-300 hover:text-red-500"
                                                        >
                                                            <Trash size="16" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {fields.length < 10 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => append("")}
                                                className="w-full text-xs text-primary hover:bg-primary/5 rounded-xl h-8 font-bold"
                                            >
                                                <Add size="14" className="mr-1" />
                                                Add Another Option
                                            </Button>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold transition-all shadow-sm"
                                        disabled={createPollMutation.isPending}
                                    >
                                        {createPollMutation.isPending ? <Loader2 className="animate-spin" /> : "Start Poll"}
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>
                </div>

                {/* Right Column: Poll History */}
                <div className="lg:col-span-8">
                    {!selectedClassId ? (
                        <div className="h-[400px] border border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center p-10 bg-gray-50/20">
                            <Book size="32" variant="Outline" className="text-gray-200 mb-4" />
                            <h3 className="font-semibold text-gray-400">Select a classroom to see history</h3>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-lg font-bold text-gray-900">Poll History</h2>
                            </div>

                            {isLoadingPolls ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary/20" /></div>
                            ) : polls && polls.length > 0 ? (
                                <div className="grid gap-4">
                                    {polls.map((poll) => {
                                        const isActive = new Date(poll.expiresAt) > new Date();
                                        return (
                                            <div
                                                key={poll.id}
                                                className={cn(
                                                    "p-5 rounded-2xl border transition-all cursor-pointer",
                                                    viewingResults === poll.id ? "bg-white border-primary border-2" : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
                                                )}
                                                onClick={() => setViewingResults(poll.id)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {isActive ? (
                                                                <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Ended</span>
                                                            )}
                                                            <span className="text-[10px] text-gray-400 font-medium">
                                                                {new Date(poll.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-gray-900 leading-tight">
                                                            {poll.question}
                                                        </h3>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300">
                                                        <ChartSquare size="18" variant={viewingResults === poll.id ? "Bold" : "Outline"} />
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {viewingResults === poll.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="mt-6 pt-5 border-t border-gray-50 overflow-hidden"
                                                        >
                                                            {isLoadingResults ? (
                                                                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary/20 h-4 w-4" /></div>
                                                            ) : pollResults ? (
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                                        <span>Student Feedback</span>
                                                                        <span>{pollResults.totalResponses} Total</span>
                                                                    </div>
                                                                    <div className="grid gap-3">
                                                                        {poll.options.map((opt) => {
                                                                            const count = pollResults.results[opt] || 0;
                                                                            const percentage = pollResults.totalResponses > 0
                                                                                ? Math.round((count / pollResults.totalResponses) * 100)
                                                                                : 0;
                                                                            return (
                                                                                <div key={opt} className="space-y-1.5">
                                                                                    <div className="flex justify-between text-xs font-semibold text-gray-600">
                                                                                        <span>{opt}</span>
                                                                                        <span>{percentage}%</span>
                                                                                    </div>
                                                                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                                                                        <motion.div
                                                                                            initial={{ width: 0 }}
                                                                                            animate={{ width: `${percentage}%` }}
                                                                                            className="h-full bg-primary"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-64 border border-dashed border-gray-100 rounded-3xl flex items-center justify-center text-gray-400 bg-gray-50/10">
                                    No polls created for this class yet.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

        </DashboardLayout >
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
