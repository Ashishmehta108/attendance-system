const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function api<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const { params, ...init } = options ?? {};
  const url = params ? `${API_URL}${path}?${new URLSearchParams(params)}` : `${API_URL}${path}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function wsUrl(sessionId: string): string {
  const base = (typeof window !== "undefined" ? window.location : { origin: "" }).origin;
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const wsProtocol = apiOrigin.startsWith("https") ? "wss" : "ws";
  const host = apiOrigin.replace(/^https?:\/\//, "");
  return `${wsProtocol}://${host}/?sessionId=${encodeURIComponent(sessionId)}`;
}
