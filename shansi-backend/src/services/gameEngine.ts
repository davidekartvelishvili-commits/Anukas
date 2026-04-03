import crypto from "crypto";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { gameConfig, pool, users, gameHistory, transactions } from "../db/schema.js";

export interface GameResult {
  won: boolean;
  winAmount: number;
  minWin: number;
  bonusWin: number;
  totalWin: number;
  newBalance: number;
  poolBalance: number;
  // Transaction info
  coinsRemaining: number;
  totalCashWon: number;
  bonusRound: boolean;
  bonusMessage?: string;
  freeCoins?: number;
  transactionComplete: boolean;
}

export interface ChickenRushResult extends GameResult {
  maxSafeStep: number;
  trapStep: number;
  cashoutUnlockStep: number;
  totalSteps: number;
  stepValues: number[];
  trapMap: number[];
  cols: number;
}

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
  minReturnPercent: number;
  isActive: boolean;
}

function calculateWin(
  betAmountInLari: number,
  config: Config,
  poolBalance: number,
  isBonusRound: boolean,
  shortfall: number
): { minWin: number; bonusWin: number } {
  // BONUS ROUND: rigged to win exactly the shortfall
  if (isBonusRound && shortfall > 0) {
    return { minWin: 0, bonusWin: round2(shortfall) };
  }

  // Normal game: individual games CAN return 0₾
  // No per-game minimum — guarantee is per-transaction

  // Check if bonus wins are possible
  if (!config.isActive) return { minWin: 0, bonusWin: 0 };
  if (poolBalance < config.poolMinimumThreshold) return { minWin: 0, bonusWin: 0 };

  const avgReturnDecimal = config.avgReturnPercent / 100;
  const bonusReturnBudget = avgReturnDecimal;

  if (bonusReturnBudget <= 0) return { minWin: 0, bonusWin: 0 };

  const availablePool = poolBalance - config.poolMinimumThreshold;
  if (availablePool <= 0) return { minWin: 0, bonusWin: 0 };

  // Special case: low amounts get higher chance of 100% return
  if (betAmountInLari <= config.fullReturnThreshold) {
    const roll = secureRandom();
    if (roll < 0.20) {
      let bonusWin = betAmountInLari;
      bonusWin = Math.min(bonusWin, config.maxWinPerUser, availablePool);
      return { minWin: 0, bonusWin: round2(Math.max(0, bonusWin)) };
    }
  }

  // Normal bonus: 10% of games get a bonus win
  const winChance = 0.10;
  const roll = secureRandom();
  if (roll >= winChance) {
    return { minWin: 0, bonusWin: 0 }; // No win this game — that's OK
  }

  // Calculate bonus amount
  const expectedBonus = (bonusReturnBudget / winChance) * betAmountInLari;
  const randomMultiplier = 0.5 + secureRandom();
  let bonusWin = expectedBonus * randomMultiplier;
  bonusWin = Math.min(bonusWin, config.maxWinPerUser);
  bonusWin = Math.min(bonusWin, availablePool);
  bonusWin = round2(Math.max(0, bonusWin));

  return { minWin: 0, bonusWin };
}

// ═══════════════════════════════════════
// MAIN PLAY FUNCTION
// ═══════════════════════════════════════

export async function playGame(
  userId: string,
  gameType: "slot" | "plinko" | "chicken_rush",
  coinCost: number
): Promise<GameResult> {
  const db = getDb();

  // 1. Find active transaction
  const [tx] = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.status, "active")))
    .limit(1);
  const [bonusTx] = !tx ? await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.status, "bonus_round")))
    .limit(1) : [tx];
  const activeTx = tx || bonusTx;

  if (!activeTx) throw new Error("ქოინები არ გაქვს");
  if (activeTx.coinsRemaining < coinCost && activeTx.status !== "bonus_round") {
    throw new Error("არასაკმარისი ქოინები");
  }

  const isBonusRound = activeTx.status === "bonus_round";

  // 2. Read game config
  const [config] = await db.select().from(gameConfig).where(eq(gameConfig.gameType, gameType)).limit(1);
  if (!config) throw new Error("Game not configured");
  if (!config.isActive) throw new Error("თამაში დროებით შეჩერებულია");

  // 3. Read pool
  const [poolRow] = await db.select().from(pool).limit(1);
  if (!poolRow) throw new Error("Pool not initialized");
  const poolBefore = poolRow.balance;

  // 4. Calculate win
  const betInLari = coinCost / 100;
  const shortfall = isBonusRound
    ? round2(activeTx.guaranteedMinimum - activeTx.totalCashWon)
    : 0;

  const { minWin, bonusWin } = calculateWin(betInLari, {
    avgReturnPercent: config.avgReturnPercent,
    maxWinPerUser: config.maxWinPerUser,
    poolMinimumThreshold: config.poolMinimumThreshold,
    fullReturnThreshold: config.fullReturnThreshold,
    minReturnPercent: config.minReturnPercent,
    isActive: config.isActive,
  }, poolBefore, isBonusRound, shortfall);

  const totalWin = round2(minWin + bonusWin);

  // 5. Deduct from pool if bonus win (not from guarantee)
  if (bonusWin > 0 && !isBonusRound) {
    await db.update(pool).set({
      balance: round2(poolRow.balance - bonusWin),
      totalWon: round2(poolRow.totalWon + bonusWin),
      updatedAt: new Date().toISOString(),
    }).where(eq(pool.id, poolRow.id));
  }

  // 6. Update user cash balance
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  const newBalance = round2(user.balance + totalWin);
  if (totalWin > 0) {
    await db.update(users).set({ balance: newBalance, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));
  }

  // 7. Update transaction
  const actualCoinDeduct = isBonusRound ? Math.min(coinCost, activeTx.coinsRemaining) : coinCost;
  const newCoinsRemaining = activeTx.coinsRemaining - actualCoinDeduct;
  const newTotalCashWon = round2(activeTx.totalCashWon + totalWin);

  await db.update(transactions).set({
    coinsRemaining: newCoinsRemaining,
    totalCashWon: newTotalCashWon,
  }).where(eq(transactions.id, activeTx.id));

  // 8. Check if transaction should complete or trigger bonus round
  let bonusRoundTriggered = false;
  let bonusMessage: string | undefined;
  let freeCoins: number | undefined;
  let transactionComplete = false;

  if (newCoinsRemaining <= 0) {
    if (newTotalCashWon >= activeTx.guaranteedMinimum || activeTx.guaranteedMinimum === 0) {
      // Guarantee met or no guarantee (free coins)
      await db.update(transactions).set({
        status: "completed",
        guaranteeMet: true,
        completedAt: new Date().toISOString(),
      }).where(eq(transactions.id, activeTx.id));
      transactionComplete = true;
    } else if (isBonusRound) {
      // Still in bonus round but coins ran out — check if met now
      if (newTotalCashWon >= activeTx.guaranteedMinimum) {
        await db.update(transactions).set({
          status: "completed",
          guaranteeMet: true,
          completedAt: new Date().toISOString(),
        }).where(eq(transactions.id, activeTx.id));
        transactionComplete = true;
      } else {
        // Give more bonus coins
        const bonusCoins = 10;
        await db.update(transactions).set({
          coinsRemaining: bonusCoins,
          bonusGamesGiven: activeTx.bonusGamesGiven + 1,
        }).where(eq(transactions.id, activeTx.id));
        bonusRoundTriggered = true;
        bonusMessage = "შანსმა შანსი მოგცა! 🎉 ითამაშე უფასოდ!";
        freeCoins = bonusCoins;
      }
    } else {
      // Normal coins ran out, guarantee NOT met — trigger bonus round
      const bonusCoins = 10;
      await db.update(transactions).set({
        status: "bonus_round",
        coinsRemaining: bonusCoins,
        bonusGamesGiven: 1,
      }).where(eq(transactions.id, activeTx.id));
      bonusRoundTriggered = true;
      bonusMessage = "შანსმა შანსი მოგცა! 🎉 ითამაშე უფასოდ!";
      freeCoins = bonusCoins;
    }
  }

  // 9. Log game history
  const [poolAfter] = await db.select().from(pool).limit(1);
  await db.insert(gameHistory).values({
    id: nanoid(),
    userId,
    gameType,
    betAmount: betInLari,
    winAmount: totalWin,
    poolBalanceBefore: poolBefore,
    poolBalanceAfter: poolAfter?.balance || poolBefore,
  });

  return {
    won: totalWin > 0,
    winAmount: totalWin,
    minWin,
    bonusWin,
    totalWin,
    newBalance,
    poolBalance: poolAfter?.balance || poolBefore,
    coinsRemaining: bonusRoundTriggered ? (freeCoins || 0) : newCoinsRemaining,
    totalCashWon: newTotalCashWon,
    bonusRound: bonusRoundTriggered,
    bonusMessage,
    freeCoins,
    transactionComplete,
  };
}

// ═══════════════════════════════════════
// CREATE TRANSACTION (when user gets coins)
// ═══════════════════════════════════════

export async function createTransaction(
  userId: string,
  paymentAmount: number,
  coinsReceived: number,
  minReturnPercent: number
): Promise<string> {
  const db = getDb();
  const id = nanoid();
  const guaranteedMinimum = paymentAmount > 0 ? round2(paymentAmount * minReturnPercent / 100) : 0;

  await db.insert(transactions).values({
    id,
    userId,
    paymentAmount,
    coinsReceived,
    coinsRemaining: coinsReceived,
    guaranteedMinimum,
    status: "active",
  });

  return id;
}

// ═══════════════════════════════════════
// CHICKEN RUSH (Lucky Step)
// ═══════════════════════════════════════

export async function playChickenRush(
  userId: string,
  coinCost: number,
  difficulty: { cols: number; rows: number; multiplierPerStep: number }
): Promise<ChickenRushResult> {
  const baseResult = await playGame(userId, "chicken_rush", coinCost);

  const { rows, cols, multiplierPerStep } = difficulty;
  const betInLari = coinCost / 100;

  // Find maxSafeStep based on win
  let maxSafeStep = 0;
  if (baseResult.totalWin > 0) {
    maxSafeStep = Math.min(Math.floor(baseResult.totalWin / (betInLari * 0.001 + 0.001)), rows - 2);
    maxSafeStep = Math.max(maxSafeStep, 3);
    maxSafeStep = Math.min(maxSafeStep, rows - 2);
  } else {
    maxSafeStep = 2 + Math.floor(secureRandom() * 4);
    maxSafeStep = Math.min(maxSafeStep, rows - 2);
  }

  const trapStep = maxSafeStep + 1;
  const cashoutUnlockStep = Math.max(10, Math.floor(maxSafeStep * 0.6));

  const trapMap: number[] = [];
  for (let i = 0; i < rows; i++) {
    trapMap.push(Math.floor(secureRandom() * cols));
  }

  // Step values: linear from 0 to totalWin
  const stepValues: number[] = [];
  for (let i = 0; i < rows; i++) {
    if (i <= maxSafeStep && maxSafeStep > 0) {
      const progress = i / maxSafeStep;
      stepValues.push(round2(baseResult.totalWin * progress));
    } else {
      stepValues.push(round2(baseResult.totalWin * (1 + (i - maxSafeStep) * 0.2)));
    }
  }

  return {
    ...baseResult,
    maxSafeStep,
    trapStep,
    cashoutUnlockStep,
    totalSteps: rows,
    stepValues,
    trapMap,
    cols,
  };
}
