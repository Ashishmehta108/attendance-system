"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { BookOpen, Plus, LogOut, GraduationCap, ChevronRight, Sparkles } from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  description: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
        return;
      }

      const role = (session.user as any).role;
      if (role === "admin") router.push("/admin");
      else if (role === "teacher") router.push("/teacher");
      else router.push("/student");
    }
  }, [session, isPending, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse text-primary font-medium">Redirecting...</div>
    </div>
  );
}

