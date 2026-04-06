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

export async function getUsers(page = 1, search?: string, status?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return adminFetch(`/admin/users?${params}`);
}

export async function getUser(id: string) {
  return adminFetch(`/admin/users/${id}`);
}

export async function adjustBalance(userId: string, type: "coin" | "cash", action: "add" | "subtract", amount: number, reason: string) {
  return adminFetch(`/admin/users/${userId}/adjust-balance`, {
    method: "POST",
    body: JSON.stringify({ type, action, amount, reason }),
  });
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  return adminFetch(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

// ── Promo Codes ──

export async function getPromoCodes() {
  return adminFetch("/admin/promo-codes");
}

export async function createPromoCode(data: {
  code: string; description?: string; coin_reward_for_user: number;
  coin_reward_for_creator?: number; max_uses?: number | null;
  max_uses_per_user?: number; starts_at: string; expires_at: string;
}) {
  return adminFetch("/admin/promo-codes", { method: "POST", body: JSON.stringify(data) });
}

export async function updatePromoCode(id: string, data: Record<string, any>) {
  return adminFetch(`/admin/promo-codes/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deletePromoCode(id: string) {
  return adminFetch(`/admin/promo-codes/${id}`, { method: "DELETE" });
}

export async function getPromoCodeUses(id: string) {
  return adminFetch(`/admin/promo-codes/${id}/uses`);
}

// ── Referrals ──

export async function getReferralConfig() {
  return adminFetch("/admin/referral-config");
}

export async function updateReferralConfig(data: { referrer_reward_coins?: number; referred_reward_coins?: number; is_active?: boolean }) {
  return adminFetch("/admin/referral-config", { method: "PATCH", body: JSON.stringify(data) });
}

export async function getReferrals(page = 1) {
  return adminFetch(`/admin/referrals?page=${page}`);
}

export async function getDashboardGameHistory(limit = 20) {
  return adminFetch(`/admin/game-history?limit=${limit}`);
}

export async function getPoolHistory(days = 7) {
  return adminFetch(`/admin/pool/history?days=${days}`);
}

export async function getGameHistory(filters?: {
  page?: number; limit?: number; game_type?: string; user_id?: string;
  date_from?: string; date_to?: string; search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.game_type) params.set("game_type", filters.game_type);
  if (filters?.user_id) params.set("user_id", filters.user_id);
  if (filters?.date_from) params.set("date_from", filters.date_from);
  if (filters?.date_to) params.set("date_to", filters.date_to);
  if (filters?.search) params.set("search", filters.search);
  return adminFetch(`/admin/game-history?${params}`);
}

export async function getMasterSwitch() {
  return adminFetch("/admin/master-switch");
}

export async function setMasterSwitch(enabled: boolean) {
  return adminFetch("/admin/master-switch", { method: "PATCH", body: JSON.stringify({ enabled }) });
}

// ── Merchants ──

export async function getMerchants(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  if (status && status !== "all") params.set("status", status);
  return adminFetch(`/admin/merchants?${params}`);
}

export async function getMerchant(id: string) {
  return adminFetch(`/admin/merchants/${id}`);
}

export async function updateMerchant(id: string, data: Record<string, any>) {
  return adminFetch(`/admin/merchants/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function simulatePayment(userPhone: string, merchantId: string, amount: number) {
  return adminFetch("/admin/simulate-payment", {
    method: "POST",
    body: JSON.stringify({ user_phone: userPhone, merchant_id: merchantId, amount }),
  });
}

export async function getPaymentTransactions(page = 1) {
  return adminFetch(`/admin/transactions/payments?page=${page}`);
}

export async function getFinance() {
  return adminFetch("/admin/finance");
}

// ── Withdrawals ──

export async function getWithdrawals(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  return adminFetch(`/admin/withdrawals?${params}`);
}

export async function updateWithdrawal(id: string, status: string, adminNote?: string) {
  return adminFetch(`/admin/withdrawals/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, admin_note: adminNote }),
  });
}

export function logoutAdmin() {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin/login";
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("adminToken");
}
