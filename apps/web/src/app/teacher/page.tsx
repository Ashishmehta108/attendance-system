"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, VideoPlay, MessageQuestion, People, Notification as NotificationIcon } from "iconsax-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EngagementChart } from "@/components/charts/EngagementChart";

const sampleEngagementData = [
    { time: "10:00", engagement: 4.2 },
    { time: "10:15", engagement: 3.8 },
    { time: "10:30", engagement: 4.5 },
    { time: "10:45", engagement: 4.0 },
    { time: "11:00", engagement: 4.8 },
];

export default function TeacherDashboard() {
    return (
        <DashboardLayout requiredRole="teacher">
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
                        <p className="text-muted-foreground">Manage your classes and sessions.</p>
                    </div>
                    <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
                        <Link href="/teacher/sessions/new">
                            <VideoPlay size="20" className="mr-2" variant="Bold" />
                            Start New Session
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-sm bg-blue-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600">My Classrooms</CardTitle>
                            <Book size="20" className="text-blue-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">5</div>
                            <p className="text-xs text-muted-foreground">Active classrooms</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-green-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Total Students</CardTitle>
                            <People size="20" className="text-green-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">128</div>
                            <p className="text-xs text-muted-foreground">Across all classes</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-purple-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-purple-600">Active Polls</CardTitle>
                            <MessageQuestion size="20" className="text-purple-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1</div>
                            <p className="text-xs text-muted-foreground">Expires in 3 mins</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-orange-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600">Avg. Attendance</CardTitle>
                            <People size="20" className="text-orange-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">88%</div>
                            <p className="text-xs text-muted-foreground">This week</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-7">
                    <Card className="col-span-4 border-none shadow-sm bg-white p-6">
                        <h3 className="font-semibold mb-6">Recent Session Engagement</h3>
                        <EngagementChart data={sampleEngagementData} />
                    </Card>
                    <Card className="col-span-3 border-none shadow-sm bg-white p-6">
                        <h3 className="font-semibold mb-4">Upcoming Classes</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                                <div>
                                    <p className="font-medium">Intro to Physics</p>
                                    <p className="text-xs text-muted-foreground">Today, 2:00 PM</p>
                                </div>
                                <Button size="sm" variant="outline" className="rounded-full">Prepare</Button>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                                <div>
                                    <p className="font-medium">Calculus II</p>
                                    <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
                                </div>
                                <Button size="sm" variant="outline" className="rounded-full">Prepare</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
