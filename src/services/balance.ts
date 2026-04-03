const COIN_KEY = "shansi_coins";
const CASH_KEY = "shansi_cash";

export function getCoinBalance(): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(COIN_KEY);
  return val ? parseFloat(val) : 0;
}

export function getCashBalance(): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(CASH_KEY);
  return val ? parseFloat(val) : 0;
}

// Sync balances from server transaction data
export function syncFromServer(coinsRemaining: number, cashWon?: number) {
  setCoinBalance(coinsRemaining);
  if (cashWon !== undefined) setCashBalance(cashWon);
}

// Seed test user (temporary)
export function seedTestUser() {
  if (typeof window === "undefined") return;
  const phone = localStorage.getItem("shansi_phone");
  if (phone?.includes("599474491")) {
    // Only seed if no coins set yet
    const existing = localStorage.getItem(COIN_KEY);
    if (!existing || existing === "0") {
      localStorage.setItem(COIN_KEY, "100");
    }
  }
}

export function setCoinBalance(amount: number) {
  localStorage.setItem(COIN_KEY, String(amount));
}

export function setCashBalance(amount: number) {
  localStorage.setItem(CASH_KEY, String(Math.round(amount * 100) / 100));
}

export function formatCash(amount: number): string {
  return amount.toFixed(2);
}

export function spendCoins(amount: number): boolean {
  const coins = getCoinBalance();
  if (amount <= 0 || amount > coins) return false;
  setCoinBalance(coins - amount);
  return true;
}

export function creditCashWinnings(amount: number) {
  if (amount <= 0) return;
  setCashBalance(getCashBalance() + amount);
}

export function exchange(cashAmount: number): boolean {
  const cash = getCashBalance();
  if (cashAmount <= 0 || cashAmount > cash) return false;
  setCashBalance(cash - cashAmount);
  setCoinBalance(getCoinBalance() + cashAmount * 100);
  return true;
}
