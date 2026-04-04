import { apiFetch } from "./api";
import { setCoinBalance, setCashBalance } from "./balance";

export interface User {
  id: string;
  phone: string;
  name: string | null;
  balance: number;
  coinBalance?: number;
  referralCode?: string;
  hasPin: boolean;
}

// Sync balance localStorage from server user data
function syncBalances(user: User) {
  if (user.coinBalance !== undefined) setCoinBalance(user.coinBalance);
  if (user.balance !== undefined) setCashBalance(user.balance);
}

interface VerifyOtpResponse {
  success: boolean;
  token: string;
  user: User;
  isNewUser: boolean;
}

export async function checkPhone(phone: string): Promise<{ exists: boolean; hasPin: boolean }> {
  const formatted = phone.startsWith("+995") ? phone : `+995${phone}`;
  return apiFetch("/auth/check-phone", {
    method: "POST",
    body: JSON.stringify({ phone: formatted }),
  });
}

export async function sendOtp(phone: string) {
  // Ensure E.164 format
  const formatted = phone.startsWith("+995") ? phone : `+995${phone}`;
  return apiFetch("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone: formatted }),
  });
}

export async function verifyOtp(phone: string, code: string, referralCode?: string): Promise<VerifyOtpResponse> {
  const formatted = phone.startsWith("+995") ? phone : `+995${phone}`;
  const body: Record<string, string> = { phone: formatted, code };
  if (referralCode) body.referralCode = referralCode;
  const data = await apiFetch<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });

  // Store token, user, and phone for PIN login
  if (data.success && data.token) {
    localStorage.setItem("shansi_token", data.token);
    localStorage.setItem("shansi_user", JSON.stringify(data.user));
    localStorage.setItem("shansi_phone", formatted);
    syncBalances(data.user);
  }

  return data;
}

export async function setupPin(pin: string) {
  return apiFetch("/auth/pin/setup", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function pinLogin(phone: string, pin: string) {
  const formatted = phone.startsWith("+995") ? phone : `+995${phone}`;
  const data = await apiFetch<{ token: string; user: User }>("/auth/pin/login", {
    method: "POST",
    body: JSON.stringify({ phone: formatted, pin }),
  });
  if (data.success && data.token) {
    localStorage.setItem("shansi_token", data.token);
    localStorage.setItem("shansi_user", JSON.stringify(data.user));
    localStorage.setItem("shansi_phone", formatted);
    syncBalances(data.user);
  }
  return data;
}

export async function verifyPin(pin: string) {
  return apiFetch("/auth/pin/verify", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function verifyBiometric() {
  return apiFetch("/auth/biometric/verify", {
    method: "POST",
  });
}

export async function getMe() {
  const data = await apiFetch<{ user: User }>("/auth/me");
  if (data.success && data.user) {
    localStorage.setItem("shansi_user", JSON.stringify(data.user));
    syncBalances(data.user);
  }
  return data;
}

export async function logout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Ignore errors — we're logging out anyway
  }
  localStorage.removeItem("shansi_token");
  localStorage.removeItem("shansi_user");
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shansi_token");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("shansi_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
