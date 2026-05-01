import { apiFetch } from "./api";
import { secureStorage } from "./storage";

export interface User {
  id: string;
  phone: string;
  name: string | null;
  balance: number;
  coinBalance?: number;
  referralCode?: string;
  hasPin: boolean;
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

  if (data.success && data.token) {
    await secureStorage.set("shansi_token", data.token);
    await secureStorage.set("shansi_user", JSON.stringify(data.user));
    await secureStorage.set("shansi_phone", formatted);
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
    await secureStorage.set("shansi_token", data.token);
    await secureStorage.set("shansi_user", JSON.stringify(data.user));
    await secureStorage.set("shansi_phone", formatted);
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

export async function getUserActivity(limit = 50) {
  return apiFetch(`/user/activity?limit=${limit}`);
}

export async function getMe() {
  return apiFetch<{ user: User }>("/auth/me");
}

export async function logout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Ignore errors — we're logging out anyway
  }
  await secureStorage.delete("shansi_token");
  await secureStorage.delete("shansi_user");
}

export async function getStoredToken(): Promise<string | null> {
  return secureStorage.get("shansi_token");
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await secureStorage.get("shansi_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
