export type Difficulty = "easy" | "medium" | "hard" | "extreme";

export interface DifficultyConfig {
  cols: number;
  rows: number;
  multiplierPerStep: number;
  label: string;
  color: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy:    { cols: 5, rows: 25, multiplierPerStep: 1.2, label: "Easy", color: "#00E676" },
  medium:  { cols: 4, rows: 20, multiplierPerStep: 1.3, label: "Medium", color: "#FFC107" },
  hard:    { cols: 3, rows: 15, multiplierPerStep: 1.45, label: "Hard", color: "#FF9800" },
  extreme: { cols: 2, rows: 10, multiplierPerStep: 1.9, label: "Extreme", color: "#FF3D00" },
};

export const BET_COST = 5;

export interface StartResult { roundId: string; rows: number; cols: number }
export interface StepResult { safe: boolean; multiplier: number; nextRow: number; trapColumn?: number }
export interface CashoutResult { winAmount: number }
