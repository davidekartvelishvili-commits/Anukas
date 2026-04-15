// ============================================
// Shansi Lucky Drop — Configuration
// ============================================

export type RiskLevel = "low";

export const BET_COST = 5;

// 11 slots: alternating LOSE / WIN pattern (visual only — server still controls win rate)
//                    0   1   2   3   4   5   6   7   8   9   10
//                    L   W   L   W   L   W   L   W   L   W   L
// Win probability is decided by the server BEFORE a slot is picked. When the server
// says "win", the client picks any green slot at random; when "lose", any red slot.
// More green slots = more visual variety, NOT more wins.
export const MULTIPLIERS: Record<RiskLevel, number[]> = {
  low: [0, 2, 0, 2, 0, 5, 0, 2, 0, 2, 0],
};

// Red for 0 slots, green for win slots
export const SLOT_COLORS: Record<RiskLevel, string[]> = {
  low: ["#EF4444", "#22C55E", "#EF4444", "#22C55E", "#EF4444", "#22C55E", "#EF4444", "#22C55E", "#EF4444", "#22C55E", "#EF4444"],
};

export interface DropResult {
  slotIndex: number;
  multiplier: number;
  winAmount: number;
  risk: RiskLevel;
}
