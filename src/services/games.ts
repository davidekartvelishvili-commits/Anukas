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
  bonusGamesLeft: number;
  transactionComplete: boolean;
  rewards?: {
    shield?: { until: string; hours: number };
    card?: { attackCharges?: number; id?: string; name?: string };
  };
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

export async function ensureActiveTransaction(): Promise<{ coinsRemaining: number; totalCoins?: number }> {
  const data = await getActiveTransaction() as any;
  if (data.hasActiveTransaction) {
    return { coinsRemaining: data.coinsRemaining, totalCoins: data.totalCoins };
  }
  // No active transaction — user has 0 coins, must purchase to play
  return { coinsRemaining: 0, totalCoins: 0 };
}

export async function playGame(gameType: "slot" | "plinko" | "chicken_rush", betAmount?: number): Promise<GameResult> {
  const data = await apiFetch<{ result: GameResult }>("/games/play", {
    method: "POST",
    body: JSON.stringify({ gameType, betAmount }),
  });
  return data.result;
}

export async function getGameHistory(page = 1) {
  return apiFetch(`/games/history?page=${page}`);
}

export async function getActiveGames() {
  return apiFetch("/games/config");
}
