import { adminFetch } from "./adminApi";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function loginAdmin(email: string, password: string) {
  const data = await adminFetch<{ token: string; admin: AdminUser }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.success && data.token) {
    localStorage.setItem("adminToken", data.token);
  }
  return data;
}

export async function getDashboard() {
  return adminFetch("/admin/dashboard");
}

export async function getGameConfig() {
  return adminFetch("/admin/game-config");
}

export async function updateGameConfig(gameType: string, params: Record<string, any>) {
  return adminFetch(`/admin/game-config/${gameType}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}

export async function getPool() {
  return adminFetch("/admin/pool");
}

export async function fundPool(amount: number) {
  return adminFetch("/admin/pool/fund", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getUsers(page = 1, search?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  return adminFetch(`/admin/users?${params}`);
}

export async function getUser(id: string) {
  return adminFetch(`/admin/users/${id}`);
}

export async function getGameHistory(filters?: { page?: number; game_type?: string; user_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.game_type) params.set("game_type", filters.game_type);
  if (filters?.user_id) params.set("user_id", filters.user_id);
  return adminFetch(`/admin/game-history?${params}`);
}

export function logoutAdmin() {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin/login";
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("adminToken");
}
