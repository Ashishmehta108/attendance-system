"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TickSquare, Book, Calendar, ArrowRight } from "iconsax-react";
import Link from "next/link";
import { AttendanceChart } from "@/components/charts/AttendanceChart";

const sampleAttendanceData = [
    { name: "Mon", attendance: 100 },
    { name: "Tue", attendance: 80 },
    { name: "Wed", attendance: 100 },
    { name: "Thu", attendance: 0 },
    { name: "Fri", attendance: 100 },
];

export default function StudentAttendancePage() {
    return (
        <DashboardLayout requiredRole="student">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
                    <p className="text-muted-foreground mt-1">
                        View your attendance history and trends across enrolled classes.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-none shadow-sm bg-green-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Overall Rate</CardTitle>
                            <TickSquare size="20" className="text-green-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">94%</div>
                            <p className="text-xs text-muted-foreground">Highly consistent!</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Sessions Attended</CardTitle>
                            <Calendar size="20" className="text-gray-500" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">47</div>
                            <p className="text-xs text-muted-foreground">Out of 50 total sessions</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-sm bg-white p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <TickSquare size="22" className="text-primary" />
                            Weekly Attendance Trend
                        </CardTitle>
                        <CardDescription>Your participation over the last week.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                        <AttendanceChart data={sampleAttendanceData} />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Book size="22" className="text-primary" />
                            By Class
                        </CardTitle>
                        <CardDescription>Attendance breakdown per classroom.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/50">
                                <span className="font-medium text-gray-700">Class</span>
                                <span className="font-medium text-gray-700">Rate</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <span className="text-gray-900">Introduction to CS</span>
                                    <span className="font-semibold text-green-600">100%</span>
                                </div>
                                <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <span className="text-gray-900">Data Structures</span>
                                    <span className="font-semibold text-green-600">95%</span>
                                </div>
                                <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <span className="text-gray-900">Algorithms</span>
                                    <span className="font-semibold text-yellow-600">85%</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-center">
                    <Button variant="outline" className="rounded-full" asChild>
                        <Link href="/student/classes">
                            View My Classes
                            <ArrowRight size="18" className="ml-2" />
                        </Link>
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
