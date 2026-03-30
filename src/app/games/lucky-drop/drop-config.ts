// ============================================
// Covrd Lucky Drop — Configuration
// File: app/lucky-drop/drop-config.ts
// ============================================

export type RiskLevel = "low" | "mid" | "high";

export const BET_COST = 5;

// Multipliers for each slot at the bottom (11 slots)
export const MULTIPLIERS: Record<RiskLevel, number[]> = {
  low:  [0, 0.5, 1, 1.5, 2, 5, 2, 1.5, 1, 0.5, 0],
  mid:  [0, 0,   0.5, 2, 5, 15, 5, 2, 0.5, 0,   0],
  high: [0, 0,   0,   1, 5, 40, 5, 1, 0,   0,   0],
};

export const SLOT_COLORS: Record<RiskLevel, string[]> = {
  low:  ["#ff3d00","#ff6d00","#ff9800","#ffc107","#00e676","#00e5ff","#00e676","#ffc107","#ff9800","#ff6d00","#ff3d00"],
  mid:  ["#ff3d00","#ff3d00","#ff6d00","#ffc107","#00e676","#7c4dff","#00e676","#ffc107","#ff6d00","#ff3d00","#ff3d00"],
  high: ["#ff3d00","#ff3d00","#ff3d00","#ff6d00","#00e676","#FFD700","#00e676","#ff6d00","#ff3d00","#ff3d00","#ff3d00"],
};

export interface DropResult {
  slotIndex: number;   // Which slot (0-10) the ball lands in
  multiplier: number;  // The multiplier for that slot
  winAmount: number;   // BET_COST * multiplier
  risk: RiskLevel;
}
