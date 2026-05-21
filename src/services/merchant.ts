const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function merchantFetch<T = any>(path: string, options: RequestInit = {}): Promise<T & { success: boolean; message?: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("merchantToken") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as Record<string, string> || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("merchantToken");
    window.location.href = "/merchant/login";
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function sendMerchantOtp(phone: string) {
  return merchantFetch("/merchant/send-otp", { method: "POST", body: JSON.stringify({ phone }) });
}

export async function verifyMerchantOtp(phone: string, code: string) {
  return merchantFetch("/merchant/verify-otp", { method: "POST", body: JSON.stringify({ phone, code }) });
}

export async function registerMerchant(data: {
  business_name: string; business_name_ka: string; category: string;
  phone: string; email: string; address: string; contact_person: string;
  otp_code: string;
}) {
  return merchantFetch("/merchant/register", { method: "POST", body: JSON.stringify(data) });
}

export async function setupPin(identifier: string, pin: string) {
  const data = await merchantFetch<{ token: string; merchant: any }>("/merchant/setup-pin", {
    method: "POST", body: JSON.stringify({ identifier, pin }),
  });
  // Auto-login after PIN setup
  if (data.success && data.token) {
    localStorage.setItem("merchantToken", data.token);
    localStorage.setItem("merchantData", JSON.stringify(data.merchant));
  }
  return data;
}

export async function loginMerchant(identifier: string, pin: string) {
  const data = await merchantFetch<{ token: string; merchant: any }>("/merchant/login", {
    method: "POST", body: JSON.stringify({ identifier, pin }),
  });
  if (data.success && data.token) {
    localStorage.setItem("merchantToken", data.token);
    localStorage.setItem("merchantData", JSON.stringify(data.merchant));
  }
  return data;
}

export async function getMerchantProfile() { return merchantFetch("/merchant/profile"); }
export async function getMerchantStats() { return merchantFetch("/merchant/stats"); }
export async function getMerchantTransactions(page = 1) { return merchantFetch(`/merchant/transactions?page=${page}`); }

export async function generateQR(amount: number) {
  return merchantFetch("/merchant/generate-qr", { method: "POST", body: JSON.stringify({ amount }) });
}

export async function getPaymentStatus(paymentId: string) {
  return merchantFetch(`/merchant/payment/${paymentId}/status`);
}

export async function changePin(currentPin: string, newPin: string) {
  return merchantFetch("/merchant/change-pin", { method: "PATCH", body: JSON.stringify({ current_pin: currentPin, new_pin: newPin }) });
}

export function logoutMerchant() {
  localStorage.removeItem("merchantToken");
  localStorage.removeItem("merchantData");
  window.location.href = "/merchant/login";
}

export function isMerchantAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("merchantToken");
}

export function getStoredMerchant(): any {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("merchantData");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Tickets (merchant-side) ──
export async function verifyTicketQR(qrCode: string) {
  return merchantFetch("/merchant/tickets/verify", {
    method: "POST",
    body: JSON.stringify({ qr_code: qrCode }),
  });
}

export async function redeemTicket(userTicketId: string) {
  return merchantFetch("/merchant/tickets/redeem", {
    method: "POST",
    body: JSON.stringify({ user_ticket_id: userTicketId }),
  });
}

export async function getMerchantTicketHistory(page = 1) {
  return merchantFetch(`/merchant/tickets/history?page=${page}`);
}
