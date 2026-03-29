// ============================================
// Covrd Slot Machine — Symbol Configuration
// Shared between client (animation) and server (result calculation)
// ============================================

export interface SlotSymbol {
  name: string;
  emoji: string;
  color: string;
  glowColor: string;
  multiplier: number;
  weight: number; // Higher = more common
}

export const SYMBOLS: SlotSymbol[] = [
  { name: "Cherry",  emoji: "🍒", color: "#FF3B3B", glowColor: "#ff1744", multiplier: 10,   weight: 18 },
  { name: "Melon",   emoji: "🍉", color: "#4CAF50", glowColor: "#00e676", multiplier: 10,   weight: 18 },
  { name: "Banana",  emoji: "🍌", color: "#FFEB3B", glowColor: "#ffd600", multiplier: 10,   weight: 16 },
  { name: "Clover",  emoji: "🍀", color: "#00E676", glowColor: "#00e676", multiplier: 15,   weight: 14 },
  { name: "Bell",    emoji: "🔔", color: "#FF9800", glowColor: "#ff9100", multiplier: 15,   weight: 14 },
  { name: "Diamond", emoji: "💎", color: "#00BCD4", glowColor: "#00e5ff", multiplier: 25,   weight: 10 },
  { name: "Crown",   emoji: "👑", color: "#FFD700", glowColor: "#ffd600", multiplier: 40,   weight: 6  },
  { name: "Seven",   emoji: "7",  color: "#FF5722", glowColor: "#ff3d00", multiplier: 100,  weight: 3  },
  { name: "Covrd",   emoji: "C",  color: "#FFC107", glowColor: "#ff6d00", multiplier: 1000, weight: 1  },
];

export const TOTAL_WEIGHT = SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
export const BET_COST = 5;

export interface SpinResult {
  symbols: [string, string, string];
  winType: "triple" | "double" | "none";
  winAmount: number;
  multiplier: number;
  winSymbol?: string;
}
