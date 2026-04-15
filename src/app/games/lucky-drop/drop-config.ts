// ============================================
// Shansi Lucky Drop — Configuration
// ============================================

export type RiskLevel = "low";

export const BET_COST = 5;

// 11 slots: 3 WIN slots alternating in the middle (visual only — win logic unchanged)
//                    0   1   2   3      4   5      6   7      8   9   10
//                    LOSE LOSE LOSE WIN  LOSE WIN  LOSE WIN  LOSE LOSE LOSE
export const MULTIPLIERS: Record<RiskLevel, number[]> = {
  low: [0, 0, 0, 2, 0, 5, 0, 2, 0, 0, 0],
};

// Red for 0 slots, green for win slots
export const SLOT_COLORS: Record<RiskLevel, string[]> = {
  low: ["#EF4444", "#EF4444", "#EF4444", "#22C55E", "#EF4444", "#22C55E", "#EF4444", "#22C55E", "#EF4444", "#EF4444", "#EF4444"],
};

export interface DropResult {
  slotIndex: number;
  multiplier: number;
  winAmount: number;
  risk: RiskLevel;
}
