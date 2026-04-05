import { apiFetch } from "./api";

export interface ChickenRushServerResult {
  maxSafeStep: number;
  trapStep: number;
  cashoutUnlockStep: number;
  totalSteps: number;
  stepValues: number[];
  trapMap: number[];
  cols: number;
  minWin: number;
  totalWin: number;
  bonusWin: number;
  won: boolean;
  coinsRemaining: number;
  newBalance: number;
}

export async function startChickenRush(
  betAmount: number,
  difficulty: "easy" | "medium" | "hard" | "extreme"
): Promise<ChickenRushServerResult> {
  const data = await apiFetch<{ result: ChickenRushServerResult }>("/games/chicken-rush", {
    method: "POST",
    body: JSON.stringify({ betAmount, difficulty }),
  });
  return data.result;
}
