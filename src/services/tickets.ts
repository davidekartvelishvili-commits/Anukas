import { apiFetch } from "./api";

// User-side ticket API helpers.
//
// `/user/tickets/:id/activate` — idempotent. First call creates a
// user_ticket row and returns a unique QR payload; subsequent calls
// (for the same ticket template, while unredeemed) return the same row.
//
// `/user/tickets/my` — the user's currently-active tickets (unredeemed
// OR within the 5-hour post-redemption grace window).

export interface UserTicket {
  id: string;
  userId: string;
  ticketId: string;
  qrCode: string;
  activatedAt: string;
  redeemedAt: string | null;
  redeemedByMerchantId: string | null;
  expiresAt: string | null;
  createdAt: string;
  redeemed?: boolean;
  ticket?: any; // enriched template fields on /my
}

export async function activateTicket(ticketId: string) {
  return apiFetch<{ userTicket: UserTicket }>(`/user/tickets/${ticketId}/activate`, {
    method: "POST",
  });
}

export async function getMyTickets() {
  return apiFetch<{ tickets: UserTicket[] }>(`/user/tickets/my`);
}
