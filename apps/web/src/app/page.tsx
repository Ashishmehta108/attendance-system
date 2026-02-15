"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    const role = (session.user as { role?: string }).role ?? "student";
    if (role === "admin" || role === "instructor") router.push("/dashboard");
    else router.push("/sessions");
  }, [session, isPending, router]);

  return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
}
