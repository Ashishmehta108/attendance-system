"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    User,
    Lock,
    Notification,
    ShieldTick,
    Palette,
    Setting2,
    LogoutCurve
} from "iconsax-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function TeacherSettingsPage() {
    const router = useRouter();
    const { data: user, isLoading } = useQuery({
        queryKey: ["me"],
        queryFn: () => api<any>("/api/me"),
    });

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/login");
    };

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="teacher">
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-primary/20" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="space-y-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                        <Setting2 size="32" variant="Bold" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Account Settings</h1>
                        <p className="text-muted-foreground mt-1">Manage your professional profile and preferences.</p>
                    </div>
                </div>

                <div className="grid gap-8">
                    {/* Profile Section */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                        <CardHeader className="bg-gray-50/50 pb-6">
                            <CardTitle className="flex items-center gap-2">
                                <User size="20" variant="Bold" className="text-primary" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>Update your name and primary email address.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 grid gap-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</Label>
                                    <Input defaultValue={user?.user?.name} className="h-11 rounded-xl border-gray-100 focus:ring-primary/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</Label>
                                    <Input defaultValue={user?.user?.email} disabled className="h-11 rounded-xl border-gray-100 bg-gray-50/50" />
                                </div>
                            </div>
                            <Button className="w-fit px-8 h-11 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800">
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Security & Notifications */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="border-none shadow-sm bg-white rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Lock size="20" color="#FF8A65" variant="Bold" />
                                    Security
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Change Password</p>
                                        <p className="text-[10px] text-gray-500">Update your account credential</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-primary font-bold">Update</Button>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Two-Factor Auth</p>
                                        <p className="text-[10px] text-gray-500">Add an extra layer of security</p>
                                    </div>
                                    <div className="w-10 h-5 bg-gray-200 rounded-full cursor-not-allowed" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white rounded-2xl text-red-600">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <LogoutCurve size="20" variant="Bold" />
                                    Logout Session
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Closing your session will remove access from this browser. You'll need to login again to access your dashboard.
                                </p>
                                <Button onClick={handleSignOut} variant="outline" className="w-full h-11 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl font-bold">
                                    Sign Out of All Devices
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Appearance */}
                    <Card className="border-none shadow-sm bg-white rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Palette size="20" className="text-purple-500" variant="Bold" />
                                Appearance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <div className="flex-1 p-4 rounded-2xl bg-gray-900 text-white flex flex-col items-center justify-center gap-2 border-2 border-primary">
                                <div className="w-8 h-8 rounded-full bg-white/20" />
                                <span className="text-xs font-bold">Dark Mode</span>
                                <span className="text-[8px] opacity-70">Current theme</span>
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-gray-50 text-gray-400 flex flex-col items-center justify-center gap-2 border-2 border-transparent">
                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                                <span className="text-xs font-bold">Light Mode</span>
                                <span className="text-[8px] opacity-0">-</span>
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-gray-50 text-gray-400 flex flex-col items-center justify-center gap-2 border-2 border-transparent">
                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                                <span className="text-xs font-bold">System</span>
                                <span className="text-[8px] opacity-0">-</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
