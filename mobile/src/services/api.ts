import { API_BASE } from "../config/env";
import { secureStorage } from "./storage";

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T & ApiResponse> {
  const token = await secureStorage.get("shansi_token");

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
    await secureStorage.delete("shansi_token");
    await secureStorage.delete("shansi_user");
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
