const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T & ApiResponse> {
  const token = typeof window !== "undefined" ? localStorage.getItem("shansi_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("shansi_token");
      localStorage.removeItem("shansi_user");
      // Don't redirect here — let the calling code handle it
    }
  }

  if (!res.ok) {
    throw new ApiError(data.message || "Request failed", res.status, data);
  }

  return data;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
