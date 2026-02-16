"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Teacher, Book, ChartCircle, People } from "iconsax-react";

export default function AdminDashboard() {
    return (
        <DashboardLayout requiredRole="admin">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, Administrator.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-sm bg-blue-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600">Total Teachers</CardTitle>
                            <Teacher size="20" className="text-blue-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-muted-foreground">+2 from last month</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-purple-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-purple-600">Total Students</CardTitle>
                            <People size="20" className="text-purple-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">450</div>
                            <p className="text-xs text-muted-foreground">+12% from last term</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-orange-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600">Active Classes</CardTitle>
                            <Book size="20" className="text-orange-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">24</div>
                            <p className="text-xs text-muted-foreground">Current ongoing sessions</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-green-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Overall Attendance</CardTitle>
                            <ChartCircle size="20" className="text-green-600" variant="Bold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">92%</div>
                            <p className="text-xs text-muted-foreground">+4% improvement</p>
                        </CardContent>
                    </Card>
                </div>

                {/* More components like charts will be added in Phase 5 */}
                <Card className="border-none shadow-sm min-h-[400px] flex items-center justify-center text-muted-foreground bg-white">
                    Analytics charts coming soon in Phase 5
                </Card>
            </div>
        </DashboardLayout>
    );
}
