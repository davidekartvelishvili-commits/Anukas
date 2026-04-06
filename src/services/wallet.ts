import { apiFetch } from "./api";

export async function requestWithdrawal(amount: number, iban: string, bank_name: string, account_holder_name: string) {
  return apiFetch("/user/withdraw", {
    method: "POST",
    body: JSON.stringify({ amount, iban, bank_name, account_holder_name }),
  });
}

export async function getWithdrawals() {
  return apiFetch("/user/withdrawals");
}

export async function getUserTransactions(page = 1) {
  return apiFetch(`/user/transactions?page=${page}`);
}

export async function scanQR(qr_code: string) {
  return apiFetch("/user/scan-qr", {
    method: "POST",
    body: JSON.stringify({ qr_code }),
  });
}
