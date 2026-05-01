import { appStorage } from "./storage";

const COIN_KEY = "shansi_coins";
const CASH_KEY = "shansi_cash";

export async function getCoinBalance(): Promise<number> {
  const val = await appStorage.get(COIN_KEY);
  return val ? parseFloat(val) : 0;
}

export async function getCashBalance(): Promise<number> {
  const val = await appStorage.get(CASH_KEY);
  return val ? parseFloat(val) : 0;
}

export async function syncFromServer(coinsRemaining: number, cashWon?: number) {
  await setCoinBalance(coinsRemaining);
  if (cashWon !== undefined) await setCashBalance(cashWon);
}

export async function setCoinBalance(amount: number) {
  await appStorage.set(COIN_KEY, String(amount));
}

export async function setCashBalance(amount: number) {
  await appStorage.set(CASH_KEY, String(Math.round(amount * 100) / 100));
}

export function formatCash(amount: number): string {
  return amount.toFixed(2);
}

export async function spendCoins(amount: number): Promise<boolean> {
  const coins = await getCoinBalance();
  if (amount <= 0 || amount > coins) return false;
  await setCoinBalance(coins - amount);
  return true;
}

export async function creditCashWinnings(amount: number) {
  if (amount <= 0) return;
  const current = await getCashBalance();
  await setCashBalance(current + amount);
}

export async function exchange(cashAmount: number): Promise<boolean> {
  const cash = await getCashBalance();
  if (cashAmount <= 0 || cashAmount > cash) return false;
  await setCashBalance(cash - cashAmount);
  const coins = await getCoinBalance();
  await setCoinBalance(coins + cashAmount * 100);
  return true;
}
