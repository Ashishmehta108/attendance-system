"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home2,
    Teacher,
    Book,
    ChartCircle,
    VideoPlay,
    People,
    TickSquare,
    MessageQuestion,
    Setting2,
    LogoutCurve,
    Notification
} from "iconsax-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface SidebarProps {
    role: "admin" | "teacher" | "student";
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const menuItems = {
        admin: [
            { name: "Dashboard", href: "/admin", icon: Home2 },
            { name: "Teachers", href: "/admin/teachers", icon: Teacher },
            { name: "Classrooms", href: "/admin/classrooms", icon: Book },
            { name: "Reports", href: "/admin/reports", icon: ChartCircle },
            { name: "Settings", href: "/admin/settings", icon: Setting2 },
        ],
        teacher: [
            { name: "Dashboard", href: "/teacher", icon: Home2 },
            { name: "Classrooms", href: "/teacher/classrooms", icon: Book },
            { name: "Sessions", href: "/teacher/sessions", icon: VideoPlay },
            { name: "Polls", href: "/teacher/polls", icon: MessageQuestion },
            { name: "Invites", href: "/teacher/invites", icon: Notification },
            { name: "Settings", href: "/teacher/settings", icon: Setting2 },
        ],
        student: [
            { name: "Dashboard", href: "/student", icon: Home2 },
            { name: "My Classes", href: "/student/classes", icon: Book },
            { name: "Attendance", href: "/student/attendance", icon: TickSquare },
            { name: "Active Polls", href: "/student/polls", icon: MessageQuestion },
            { name: "Invites", href: "/student/invites", icon: Notification },
        ],
    };

    const validRole = role && (role === "admin" || role === "teacher" || role === "student") ? role : "student";
    const items = menuItems[validRole] ?? menuItems.student;

    const isItemActive = (href: string) => {
        if (pathname === href) return true;
        // Nested routes: e.g. /student/classes/123 should highlight "My Classes"
        if (href !== `/${validRole}` && pathname.startsWith(href + "/")) return true;
        return false;
    };

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/login");
    };

    return (
        <aside className="w-64 h-screen border-r border-gray-200 bg-white sticky top-0 flex flex-col">
            <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-2xl text-primary">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        <ChartCircle size="20" variant="Bold" />
                    </div>
                    <span>Attendly</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const isActive = isItemActive(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Icon
                                size="22"
                                variant={isActive ? "Bold" : "Outline"}
                                className={cn(
                                    "transition-colors",
                                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-900"
                                )}
                            />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                >
                    <LogoutCurve
                        size="22"
                        className="group-hover:rotate-12 transition-transform"
                    />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
