import { apiFetch } from "./api";

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
  ticket?: any;
}

export async function activateTicket(ticketId: string) {
  return apiFetch<{ userTicket: UserTicket }>(`/user/tickets/${ticketId}/activate`, {
    method: "POST",
  });
}

export async function getMyTickets() {
  return apiFetch<{ tickets: UserTicket[] }>(`/user/tickets/my`);
}
