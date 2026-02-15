"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function NewClassroomPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { data: session } = authClient.useSession();

  const create = useMutation({
    mutationFn: () => api<{ id: string }>("/api/classrooms", {
      method: "POST",
      body: JSON.stringify({ name, description: description || null }),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      router.push(`/classrooms/${data.id}`);
    },
  });

  if (session && !session.user) router.push("/login");
  if (session?.user && (session.user as { role?: string }).role === "student") router.push("/sessions");

  return (
    <div className="container max-w-md py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>New classroom</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
