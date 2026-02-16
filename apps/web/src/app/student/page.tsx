"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, TickSquare, MessageQuestion, Notification as NotificationIcon } from "iconsax-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AttendanceChart } from "@/components/charts/AttendanceChart";

const sampleAttendanceData = [
    { name: "Mon", attendance: 100 },
    { name: "Tue", attendance: 80 },
    { name: "Wed", attendance: 100 },
    { name: "Thu", attendance: 0 },
    { name: "Fri", attendance: 100 },
];

export default function StudentDashboard() {
    return (
        <DashboardLayout requiredRole="student">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
                    <p className="text-muted-foreground">Keep track of your sessions and attendance.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-sm bg-blue-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600">Enrolled Classes</CardTitle>
                            <Book size="20" className="text-blue-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">6</div>
                            <p className="text-xs text-muted-foreground">Active classrooms</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-green-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">My Attendance</CardTitle>
                            <TickSquare size="20" className="text-green-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">94%</div>
                            <p className="text-xs text-muted-foreground">Highly consistent!</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-purple-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-purple-600">Pending Invites</CardTitle>
                            <NotificationIcon size="20" className="text-purple-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">2</div>
                            <p className="text-xs text-muted-foreground">Awaiting your response</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-orange-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600">Active Polls</CardTitle>
                            <MessageQuestion size="20" className="text-orange-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">No active polls right now</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-none shadow-sm bg-white p-6">
                        <h3 className="font-semibold mb-6">Weekly Attendance Trend</h3>
                        <AttendanceChart data={sampleAttendanceData} />
                    </Card>

                    <Card className="border-none shadow-sm bg-white p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                            <NotificationIcon size="24" variant="Bold" />
                        </div>
                        <h3 className="font-semibold">Class Invitations</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            You have 2 new invitations to join classrooms.
                        </p>
                        <Button variant="outline" className="rounded-full" asChild>
                            <Link href="/student/invites">Review Invites</Link>
                        </Button>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
