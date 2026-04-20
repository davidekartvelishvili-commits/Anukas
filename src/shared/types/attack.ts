// ============================================================================
// ATTACK SYSTEM — shared types (frontend ↔ backend contracts)
// ============================================================================

export interface VillageItem {
  position: number; // 1-5
  stars: number;     // 0-4
  name: string;
}

export interface AttackInitResponse {
  success: boolean;
  attackSessionId: string;
  defenderUsername: string;
  defenderVillageLevel: number;
  defenderShieldActive: boolean;
  villageItems: VillageItem[];
}

export interface AttackAttemptResponse {
  success: boolean;
  outcome: "coins_stolen" | "empty_burn" | "shield_blocked";
  coinsTransferred: number;
  shieldConsumed: boolean;
  itemBurned: boolean;
  attacksRemaining: number;
  newStarCount: number | null;
}

export interface AttackAttemptSummary {
  attemptNumber: number;
  pickedPosition: number;
  outcome: "coins_stolen" | "empty_burn" | "shield_blocked";
  coinsTransferred: number;
  shieldConsumed: boolean;
  itemBurned: boolean;
}

export interface AttackSummaryResponse {
  success: boolean;
  session: {
    id: string;
    status: string;
    attacksUsed: number;
    coinsHiddenTotal: number;
    createdAt: string;
    completedAt: string | null;
  };
  attempts: AttackAttemptSummary[];
  totals: {
    coinsStolen: number;
    itemsBurned: number;
  };
}

export interface AttackNotification {
  attackerName: string;
  outcome: "coins_stolen" | "empty_burn" | "shield_blocked";
  coinsLost: number;
  itemBurned: boolean;
  pickedPosition: number;
  createdAt: string;
}

export type AttackSequenceState =
  | "IDLE"
  | "CLOUDS_CLOSING"
  | "TRAVELING"
  | "CLOUDS_OPENING"
  | "ATTACK_SELECT"
  | "ATTACK_IMPACT"
  | "SUMMARY"
  | "RETURNING";
