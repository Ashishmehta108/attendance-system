"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Setting2 } from "iconsax-react";

export default function AdminSettingsPage() {
    return (
        <DashboardLayout requiredRole="admin">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage platform settings and preferences.
                    </p>
                </div>

                <Card className="border-none shadow-sm min-h-[300px] flex flex-col items-center justify-center bg-white">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-6">
                        <Setting2 size="40" variant="Outline" />
                    </div>
                    <CardTitle className="text-xl">Settings coming soon</CardTitle>
                    <CardDescription className="mt-2 text-center max-w-sm">
                        Organization and system configuration options will appear here.
                    </CardDescription>
                </Card>
            </div>
        </DashboardLayout>
    );
}
