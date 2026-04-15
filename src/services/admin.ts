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

// ── Offers ──
export async function getOffers(params: { type?: string; active?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (params.type) qs.set("type", params.type);
  if (params.active !== undefined) qs.set("active", String(params.active));
  const q = qs.toString();
  return adminFetch(`/admin/offers${q ? `?${q}` : ""}`);
}

export async function createOffer(data: {
  merchant_id: string;
  offer_type: "featured" | "flash" | "partner";
  boosted_rate: number;
  normal_rate?: number;
  title?: string;
  description?: string;
  sort_order?: number;
  starts_at: string;
  ends_at: string;
  is_active?: boolean;
}) {
  return adminFetch("/admin/offers", { method: "POST", body: JSON.stringify(data) });
}

export async function updateOffer(id: string, data: Record<string, any>) {
  return adminFetch(`/admin/offers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteOffer(id: string) {
  return adminFetch(`/admin/offers/${id}`, { method: "DELETE" });
}

export async function resetUserVillage(userId: string) {
  return adminFetch(`/admin/users/${userId}/reset-village`, {
    method: "POST",
  });
}

export async function deleteUser(userId: string) {
  return adminFetch(`/admin/users/${userId}`, {
    method: "DELETE",
  });
}

// ── Tickets ──
export interface AdminTicket {
  id: string;
  emoji: string;
  logoUrl: string | null;
  category: string;
  title: string;
  titleKa: string;
  brand: string;
  validity: string;
  type: string;
  price: string;
  bonus: string;
  personName: string;
  screen: string | null;
  row: string | null;
  seat: string | null;
  serial: string;
  social: string | null;
  terms: string[];
  website: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export async function getTicketsAdmin() {
  return adminFetch<{ tickets: AdminTicket[] }>("/admin/tickets");
}

export async function createTicket(data: Record<string, any>) {
  return adminFetch("/admin/tickets", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTicket(id: string, data: Record<string, any>) {
  return adminFetch(`/admin/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteTicket(id: string) {
  return adminFetch(`/admin/tickets/${id}`, { method: "DELETE" });
}

// Mystery box feature toggle
export async function getMysteryBoxEnabled() {
  return adminFetch<{ enabled: boolean }>("/admin/mystery-box-enabled");
}

export async function setMysteryBoxEnabled(enabled: boolean) {
  return adminFetch("/admin/mystery-box-enabled", {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
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

export async function updateReferralConfig(data: { referrer_reward_coins?: number; referred_reward_coins?: number; bonus_every_n?: number; bonus_reward_coins?: number; signup_reward_lari?: number; share_message_template?: string; share_image_url?: string | null; is_active?: boolean }) {
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

// Finance
export async function getFinanceData(from?: string, to?: string, page = 1, q?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (q) params.set("q", q);
  return adminFetch(`/admin/finance?${params}`);
}
export async function getPoolFundingHistory() {
  return adminFetch("/admin/finance/pool-history");
}
export async function resetLegacyCommissions() {
  return adminFetch("/admin/finance/reset-legacy-commissions", { method: "POST" });
}
export async function fundPoolWithNote(amount: number, note?: string) {
  return adminFetch("/admin/finance/fund-pool", {
    method: "POST",
    body: JSON.stringify({ amount, note }),
  });
}
export async function getUserFinance(userId: string) {
  return adminFetch(`/admin/finance/user/${userId}`);
}

// Big Win
export const getBigWinConfig = () => adminFetch("/admin/big-win/config");
export const updateBigWinConfig = (data: any) => adminFetch("/admin/big-win/config", { method: "PUT", body: JSON.stringify(data) });
export const getBigWinPrizes = () => adminFetch("/admin/big-win/prizes");
export const createBigWinPrize = (data: any) => adminFetch("/admin/big-win/prizes", { method: "POST", body: JSON.stringify(data) });
export const updateBigWinPrize = (id: string, data: any) => adminFetch(`/admin/big-win/prizes/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteBigWinPrize = (id: string) => adminFetch(`/admin/big-win/prizes/${id}`, { method: "DELETE" });
export const getBigWinHistory = () => adminFetch("/admin/big-win/history");

// Villages (NEW system)
export async function createMerchant(data: {
  business_name: string;
  business_name_ka?: string;
  category?: string;
  phone: string;
  email?: string;
  address?: string;
  contact_person?: string;
  commission_percent?: number;
  logo_url?: string;
}) {
  return adminFetch("/admin/merchants", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export const getVillagesList = () => adminFetch("/admin/villages");
export const getVillageDetail = (id: string) => adminFetch(`/admin/villages/${id}`);
export const createVillage = (data: any) => adminFetch("/admin/villages", { method: "POST", body: JSON.stringify(data) });
export const updateVillage = (id: string, data: any) => adminFetch(`/admin/villages/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteVillage = (id: string) => adminFetch(`/admin/villages/${id}`, { method: "DELETE" });
export const updateVillageBuilding = (vid: string, bid: string, data: any) =>
  adminFetch(`/admin/villages/${vid}/buildings/${bid}`, { method: "PUT", body: JSON.stringify(data) });

// Village (legacy/levels/config — still used)
export const getVillageLevels = () => adminFetch("/admin/village/levels");
export const createVillageLevel = (data: any) => adminFetch("/admin/village/levels", { method: "POST", body: JSON.stringify(data) });
export const updateVillageLevel = (id: string, data: any) => adminFetch(`/admin/village/levels/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteVillageLevel = (id: string) => adminFetch(`/admin/village/levels/${id}`, { method: "DELETE" });
export const getVillageCards = () => adminFetch("/admin/village/cards");
export const createVillageCard = (data: any) => adminFetch("/admin/village/cards", { method: "POST", body: JSON.stringify(data) });
export const updateVillageCard = (id: string, data: any) => adminFetch(`/admin/village/cards/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteVillageCard = (id: string) => adminFetch(`/admin/village/cards/${id}`, { method: "DELETE" });
export const getVillageConfig = () => adminFetch("/admin/village/config");
export const updateVillageConfig = (data: any) => adminFetch("/admin/village/config", { method: "PUT", body: JSON.stringify(data) });
export const getVillageAttacks = (page = 1) => adminFetch(`/admin/village/attacks?page=${page}`);
export const getVillageStats = () => adminFetch("/admin/village/stats");

// Algorithm simulation
export async function startSimulation(params: {
  userCount: number;
  scenario: string;
  gameTypes?: string[];
  villageEnabled?: boolean;
  levelDistribution?: "equal" | "realistic" | "specific";
  specificLevel?: number;
}) {
  return adminFetch("/admin/algorithm/simulate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function pollSimulation(jobId: string) {
  return adminFetch(`/admin/algorithm/simulate/${jobId}`);
}

export async function getSimulationHistory() {
  return adminFetch("/admin/algorithm/simulate-history");
}
