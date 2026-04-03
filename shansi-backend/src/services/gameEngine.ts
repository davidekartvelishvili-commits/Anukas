import crypto from "crypto";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { gameConfig, pool, users, gameHistory } from "../db/schema.js";

export interface GameResult {
  won: boolean;
  winAmount: number;
  minWin: number;
  bonusWin: number;
  totalWin: number;
  newBalance: number;
  poolBalance: number;
}

// Secure random [0, 1) using crypto
function secureRandom(): number {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) / 0x100000000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface Config {
  avgReturnPercent: number;
  maxWinPerUser: number;
  poolMinimumThreshold: number;
  fullReturnThreshold: number;
  isActive: boolean;
}

function calculateWin(
  betAmount: number,
  config: Config,
  poolBalance: number
): { minWin: number; bonusWin: number } {
  // Step 1: Guaranteed minimum — everyone wins 0.5%
  const minWin = round2(betAmount * 0.005);

  // Step 2: Check if bonus wins are possible
  if (!config.isActive) return { minWin, bonusWin: 0 };
  if (poolBalance < config.poolMinimumThreshold) return { minWin, bonusWin: 0 };

  // Step 3: Determine bonus budget
  const avgReturnDecimal = config.avgReturnPercent / 100;
  const minReturnDecimal = 0.005;
  const bonusReturnBudget = avgReturnDecimal - minReturnDecimal;

  if (bonusReturnBudget <= 0) return { minWin, bonusWin: 0 };

  const availablePool = poolBalance - config.poolMinimumThreshold;
  if (availablePool <= 0) return { minWin, bonusWin: 0 };

  // Step 4: Special case — low amounts get higher chance of 100% return
  if (betAmount <= config.fullReturnThreshold) {
    const roll = secureRandom();
    if (roll < 0.20) {
      let bonusWin = betAmount - minWin;
      bonusWin = Math.min(bonusWin, config.maxWinPerUser, availablePool);
      return { minWin, bonusWin: round2(Math.max(0, bonusWin)) };
    }
  }

  // Step 5: Normal bonus — 10% of users get a bonus win
  const winChance = 0.10;
  const roll = secureRandom();
  if (roll >= winChance) {
    return { minWin, bonusWin: 0 };
  }

  // Step 6: Calculate bonus amount
  const expectedBonus = (bonusReturnBudget / winChance) * betAmount;
  const randomMultiplier = 0.5 + secureRandom();
  let bonusWin = expectedBonus * randomMultiplier;

  // Cap at max_win_per_user
  bonusWin = Math.min(bonusWin, config.maxWinPerUser);

  // Cap at available pool
  bonusWin = Math.min(bonusWin, availablePool);

  // Floor at 0, round
  bonusWin = round2(Math.max(0, bonusWin));

  return { minWin, bonusWin };
}

export async function playGame(
  userId: string,
  gameType: "slot" | "plinko" | "chicken_rush",
  betAmount: number
): Promise<GameResult> {
  const db = getDb();

  // 1. Read game config
  const [config] = await db.select().from(gameConfig).where(eq(gameConfig.gameType, gameType)).limit(1);
  if (!config) throw new Error("Game not configured");
  if (!config.isActive) throw new Error("Game is currently disabled");

  // 2. Read pool
  const [poolRow] = await db.select().from(pool).limit(1);
  if (!poolRow) throw new Error("Pool not initialized");
  const poolBefore = poolRow.balance;

  // 3. Calculate win
  const { minWin, bonusWin } = calculateWin(betAmount, {
    avgReturnPercent: config.avgReturnPercent,
    maxWinPerUser: config.maxWinPerUser,
    poolMinimumThreshold: config.poolMinimumThreshold,
    fullReturnThreshold: config.fullReturnThreshold,
    isActive: config.isActive,
  }, poolBefore);

  const totalWin = round2(minWin + bonusWin);

  // 4. If bonus win: deduct from pool
  if (bonusWin > 0) {
    await db.update(pool).set({
      balance: round2(poolRow.balance - bonusWin),
      totalWon: round2(poolRow.totalWon + bonusWin),
      updatedAt: new Date().toISOString(),
    }).where(eq(pool.id, poolRow.id));
  }

  // 5. Update user balance
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  const newBalance = round2(user.balance + totalWin);
  await db.update(users).set({
    balance: newBalance,
    updatedAt: new Date().toISOString(),
  }).where(eq(users.id, userId));

  // 6. Read pool after
  const [poolAfter] = await db.select().from(pool).limit(1);
  const poolBalanceAfter = poolAfter?.balance || poolBefore;

  // 7. Log game history
  await db.insert(gameHistory).values({
    id: nanoid(),
    userId,
    gameType,
    betAmount,
    winAmount: totalWin,
    poolBalanceBefore: poolBefore,
    poolBalanceAfter: poolBalanceAfter,
  });

  return {
    won: bonusWin > 0,
    winAmount: totalWin,
    minWin,
    bonusWin,
    totalWin,
    newBalance,
    poolBalance: poolBalanceAfter,
  };
}
