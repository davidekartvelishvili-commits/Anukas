import { apiFetch } from "./api";

export interface GameResult {
  won: boolean;
  minWin: number;
  bonusWin: number;
  totalWin: number;
  newBalance: number;
  coinsRemaining: number;
  totalCashWon: number;
  bonusRound: boolean;
  bonusMessage?: string;
  freeCoins?: number;
  transactionComplete: boolean;
}

export async function getActiveTransaction() {
  return apiFetch("/games/active-transaction");
}

export async function createTransaction(paymentAmount: number, coinsReceived: number) {
  return apiFetch("/games/create-transaction", {
    method: "POST",
    body: JSON.stringify({ paymentAmount, coinsReceived }),
  });
}

export async function playGame(gameType: "slot" | "plinko" | "chicken_rush"): Promise<GameResult> {
  const data = await apiFetch<{ result: GameResult }>("/games/play", {
    method: "POST",
    body: JSON.stringify({ gameType }),
  });
  return data.result;
}

export async function getGameHistory(page = 1) {
  return apiFetch(`/games/history?page=${page}`);
}

export async function getActiveGames() {
  return apiFetch("/games/config");
}
