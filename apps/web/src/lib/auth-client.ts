import { QueryClient, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Create a query client (this should ideally be at the app root, but we can reuse it or create a specific one for auth)
const queryClient = new QueryClient();

async function fetcher(url: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
    credentials: "include", // Important for cookies
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  // Handle 204 No Content
  if (res.status === 204) return null;

  return res.json().catch(() => null);
}

export const authClient = {
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      try {
        const data = await fetcher("/api/auth/sign-in", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        if (data.token && typeof window !== "undefined") {
          localStorage.setItem("token", data.token);
        }
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
  },
  signUp: {
    email: async ({ email, password, name, role }: { email: string; password: string; name: string; role?: string }) => {
      try {
        const data = await fetcher("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, name, role }),
        });
        if (data.token && typeof window !== "undefined") {
          localStorage.setItem("token", data.token);
        }
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    }
  },
  signOut: async () => {
    try {
      await fetcher("/api/auth/sign-out", { method: "POST" });
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },
  useSession: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, isLoading, error } = useQuery({
      queryKey: ["session"],
      queryFn: () => fetcher("/api/me"),
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
      data: data ? { user: data.user, session: data.session } : null,
      isPending: isLoading,
      error,
    };
  },
};