// ============================================
// Shansi Lucky Drop — Configuration
// ============================================

export type RiskLevel = "low";

export const BET_COST = 5;

// 11 slots: 3 center are WIN (green), rest are LOSE (red, show 0)
export const MULTIPLIERS: Record<RiskLevel, number[]> = {
  low: [0, 0, 0, 0, 2, 5, 2, 0, 0, 0, 0],
};

// Red for 0 slots, green for win slots
export const SLOT_COLORS: Record<RiskLevel, string[]> = {
  low: ["#EF4444", "#EF4444", "#EF4444", "#EF4444", "#22C55E", "#22C55E", "#22C55E", "#EF4444", "#EF4444", "#EF4444", "#EF4444"],
};

export interface DropResult {
  slotIndex: number;
  multiplier: number;
  winAmount: number;
  risk: RiskLevel;
}
