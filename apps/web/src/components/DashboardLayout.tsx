import { Sidebar } from "./Sidebar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
    children: React.ReactNode;
    requiredRole?: "admin" | "teacher" | "student";
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    const rawRole = (session?.user as { role?: string } | undefined)?.role;
    const userRole = (rawRole === "admin" || rawRole === "teacher" || rawRole === "student"
        ? rawRole
        : (requiredRole ?? "student")) as "admin" | "teacher" | "student";

    // Who is allowed to see this page: admin-only, teacher+admin, or student+teacher+admin
    const canAccess =
        !requiredRole ||
        userRole === requiredRole ||
        (requiredRole === "teacher" && userRole === "admin") ||
        (requiredRole === "student" && (userRole === "admin" || userRole === "teacher"));

    useEffect(() => {
        if (!isPending && session && requiredRole && !canAccess) {
            if (userRole === "admin") router.push("/admin");
            else if (userRole === "teacher") router.push("/teacher");
            else router.push("/student");
        }
    }, [session, isPending, requiredRole, userRole, canAccess, router]);

    if (isPending) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="flex min-h-screen bg-gray-50/30">
            <Sidebar role={userRole} />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
