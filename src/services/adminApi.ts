const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function adminFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T & { success: boolean; message?: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin/login";
    }
  }

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
