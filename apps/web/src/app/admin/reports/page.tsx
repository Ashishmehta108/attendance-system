"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartCircle } from "iconsax-react";

export default function AdminReportsPage() {
    return (
        <DashboardLayout requiredRole="admin">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        View platform-wide analytics and reports.
                    </p>
                </div>

                <Card className="border-none shadow-sm min-h-[400px] flex flex-col items-center justify-center bg-white">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-6">
                        <ChartCircle size="40" variant="Outline" />
                    </div>
                    <CardTitle className="text-xl">Reports coming soon</CardTitle>
                    <CardDescription className="mt-2 text-center max-w-sm">
                        Attendance summaries, engagement trends, and export options will be available here.
                    </CardDescription>
                </Card>
            </div>
        </DashboardLayout>
    );
}
