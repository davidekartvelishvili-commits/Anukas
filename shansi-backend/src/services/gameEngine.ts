import crypto from "crypto";
import { nanoid } from "nanoid";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { gameConfig, pool, users, gameHistory, transactions, systemConfig } from "../db/schema.js";

// ═══════════════════════════════════════
// PER-USER MUTEX — prevents parallel drops from causing race conditions
// ═══════════════════════════════════════
const userLocks = new Map<string, Promise<any>>();

async function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = userLocks.get(userId) || Promise.resolve();
  const current = prev.then(fn, fn); // run fn after previous completes (even if it failed)
  userLocks.set(userId, current);
  // Clean up after completion to avoid memory leak
  current.finally(() => {
    if (userLocks.get(userId) === current) {
      userLocks.delete(userId);
    }
  });
  return current;
}

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
  bonusGamesLeft: number;
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
  plannedBonusWin: number
): { minWin: number; bonusWin: number } {
  // BONUS ROUND: win the pre-planned amount
  if (isBonusRound && plannedBonusWin > 0) {
    return { minWin: 0, bonusWin: round2(plannedBonusWin) };
  }

  // Normal game: individual games CAN return 0₾
  // No per-game minimum — guarantee is per-transaction

  // Check if bonus wins are possible
  if (!config.isActive) return { minWin: 0, bonusWin: 0 };
  if (poolBalance < config.poolMinimumThreshold) return { minWin: 0, bonusWin: 0 };

  // avgReturnPercent is the target AVERAGE return across ALL users
  // e.g. 0.5% means on average users get back 0.5% of their bet
  const avgReturnDecimal = config.avgReturnPercent / 100;

  if (avgReturnDecimal <= 0) return { minWin: 0, bonusWin: 0 };

  const availablePool = poolBalance - config.poolMinimumThreshold;
  if (availablePool <= 0) return { minWin: 0, bonusWin: 0 };

  // Special case: low ORIGINAL payment amounts (not coin bets) get 100% return chance
  // fullReturnThreshold is in ₾ (e.g. 5₾) — compare against the TRANSACTION payment, not per-game bet
  // For coin-based games, individual bets are always small (0.10₾), so we SKIP this path
  // This path only applies to direct ₾ payments (future feature)
  // For now: disabled for coin-based games

  // Win probability: to maintain avgReturnPercent across all users
  // Average win per game = betAmountInLari * avgReturnDecimal
  // We spread this: some games win 0, some win more
  // 10% of games get a bonus win
  const winChance = 0.10;
  const roll = secureRandom();
  if (roll >= winChance) {
    return { minWin: 0, bonusWin: 0 }; // No win this game — that's OK
  }

  // This game is a winner! Calculate amount.
  // Target average per game = betAmountInLari * avgReturnDecimal
  // Since only winChance% of games win: each winner gets avgReturn / winChance
  // e.g. 0.5% avg, 10% chance: each winner gets (0.005 / 0.10) = 5% of bet
  const expectedBonus = (avgReturnDecimal / winChance) * betAmountInLari;

  // Add randomness: 50% to 150% of expected
  const randomMultiplier = 0.5 + secureRandom();
  let bonusWin = expectedBonus * randomMultiplier;

  // Cap at max_win_per_user
  bonusWin = Math.min(bonusWin, config.maxWinPerUser);

  // Cap at available pool
  bonusWin = Math.min(bonusWin, availablePool);

  // Floor at 0, round to 2 decimals
  bonusWin = round2(Math.max(0, bonusWin));

  // LOG for debugging (remove in production)
  console.log(`[GAME ENGINE] bet=${betAmountInLari}₾ avgReturn=${config.avgReturnPercent}% winChance=${winChance} expectedBonus=${expectedBonus} randomMult=${randomMultiplier.toFixed(3)} bonusWin=${bonusWin}`);

  return { minWin: 0, bonusWin };
}

// ═══════════════════════════════════════
// BONUS PLAN GENERATOR
// ═══════════════════════════════════════

function generateBonusPlan(shortfall: number): number[] {
  if (shortfall <= 0) return [];

  // Add noise to make amounts look natural
  const addNoise = (amt: number): number => {
    const noise = (secureRandom() - 0.5) * amt * 0.3; // ±15%
    return round2(Math.max(0.001, amt + noise));
  };

  if (shortfall <= 0.01) {
    // Very small: 1 game
    return [round2(shortfall)];
  }

  if (shortfall <= 0.03) {
    // Medium: 2 games
    const ratio = 0.4 + secureRandom() * 0.2; // 40-60%
    const game1 = addNoise(shortfall * ratio);
    const game2 = round2(shortfall - game1);
    return [Math.max(0.001, game1), Math.max(0.001, game2)];
  }

  // Larger: 3 games
  const ratio1 = 0.2 + secureRandom() * 0.2; // 20-40%
  const game1 = addNoise(shortfall * ratio1);
  const remaining = shortfall - game1;
  const ratio2 = 0.3 + secureRandom() * 0.2; // 30-50% of remaining
  const game2 = addNoise(remaining * ratio2);
  const game3 = round2(shortfall - game1 - game2);
  return [Math.max(0.001, round2(game1)), Math.max(0.001, round2(game2)), Math.max(0.001, game3)];
}

// ═══════════════════════════════════════
// MAIN PLAY FUNCTION
// ═══════════════════════════════════════

export async function playGame(
  userId: string,
  gameType: "slot" | "plinko" | "chicken_rush",
  coinCost: number
): Promise<GameResult> {
  // Serialize all game plays per user to prevent parallel race conditions
  return withUserLock(userId, () => _playGameInner(userId, gameType, coinCost));
}

async function _playGameInner(
  userId: string,
  gameType: "slot" | "plinko" | "chicken_rush",
  coinCost: number
): Promise<GameResult> {
  const db = getDb();

  // 1. Find active transaction
  // Find active transaction with coins remaining (newest first)
  const allActiveTx = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
    .orderBy(desc(transactions.createdAt));
  const activeTx = allActiveTx.find(t => t.coinsRemaining >= coinCost) || allActiveTx.find(t => t.coinsRemaining > 0) || allActiveTx[0] || null;

  if (!activeTx) throw new Error("ქოინები არ გაქვს");
  if (activeTx.coinsRemaining < coinCost && activeTx.status !== "bonus_round") {
    throw new Error("არასაკმარისი ქოინები");
  }

  const isBonusRound = activeTx.status === "bonus_round";

  // 2. Read game config
  const [config] = await db.select().from(gameConfig).where(eq(gameConfig.gameType, gameType)).limit(1);
  if (!config) throw new Error("Game not configured");
  if (!config.isActive) throw new Error("თამაში დროებით შეჩერებულია");

  // 3. Check master switch — if OFF, force 0 cash winnings
  const [masterSwitchRow] = await db.select().from(systemConfig).where(eq(systemConfig.key, "master_switch")).limit(1);
  const masterSwitchOn = masterSwitchRow?.value !== "false";

  // 4. Read pool
  const [poolRow] = await db.select().from(pool).limit(1);
  if (!poolRow) throw new Error("Pool not initialized");
  const poolBefore = poolRow.balance;

  // 5. Calculate win
  const betInLari = coinCost / 100;
  let plannedBonusWin = 0;

  if (isBonusRound && activeTx.bonusWinsPlan) {
    // Pop next planned win from the bonus plan
    const plan: number[] = JSON.parse(activeTx.bonusWinsPlan);
    const played = activeTx.bonusGamesPlayed || 0;
    plannedBonusWin = plan[played] || 0;
  }

  let { minWin, bonusWin } = calculateWin(betInLari, {
    avgReturnPercent: config.avgReturnPercent,
    maxWinPerUser: config.maxWinPerUser,
    poolMinimumThreshold: config.poolMinimumThreshold,
    fullReturnThreshold: config.fullReturnThreshold,
    minReturnPercent: config.minReturnPercent,
    isActive: config.isActive,
  }, poolBefore, isBonusRound, plannedBonusWin);

  // MASTER SWITCH: if OFF, zero out all winnings
  if (!masterSwitchOn) {
    minWin = 0;
    bonusWin = 0;
  }

  const totalWin = round2(minWin + bonusWin);

  console.log(`[PLAY] userId=${userId} game=${gameType} coins=${coinCost} betLari=${betInLari} minWin=${minWin} bonusWin=${bonusWin} totalWin=${totalWin} pool=${poolBefore} isBonusRound=${isBonusRound}`);

  // 5. Deduct from pool if bonus win (not from guarantee) — ATOMIC
  if (bonusWin > 0 && !isBonusRound) {
    await db.update(pool).set({
      balance: sql`ROUND(${pool.balance} - ${bonusWin}, 2)`,
      totalWon: sql`ROUND(${pool.totalWon} + ${bonusWin}, 2)`,
      updatedAt: new Date().toISOString(),
    } as any).where(eq(pool.id, poolRow.id));
  }

  // 6. Update user cash balance — ATOMIC
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  const newBalance = round2(user.balance + totalWin);
  if (totalWin > 0) {
    await db.update(users).set({
      balance: sql`ROUND(${users.balance} + ${totalWin}, 2)`,
      updatedAt: new Date().toISOString(),
    } as any).where(eq(users.id, userId));
  }

  // 7. Update transaction — ATOMIC coin deduction
  const actualCoinDeduct = isBonusRound ? Math.min(coinCost, activeTx.coinsRemaining) : coinCost;
  const newCoinsRemaining = Math.max(0, activeTx.coinsRemaining - actualCoinDeduct);
  const newTotalCashWon = round2(activeTx.totalCashWon + totalWin);

  await db.update(transactions).set({
    coinsRemaining: sql`MAX(0, ${transactions.coinsRemaining} - ${actualCoinDeduct})`,
    totalCashWon: sql`ROUND(${transactions.totalCashWon} + ${totalWin}, 2)`,
    ...(isBonusRound ? { bonusGamesPlayed: sql`COALESCE(${transactions.bonusGamesPlayed}, 0) + 1` } : {}),
  } as any).where(eq(transactions.id, activeTx.id));

  // Re-read the transaction to get accurate values after atomic update
  const [updatedTx] = await db.select().from(transactions).where(eq(transactions.id, activeTx.id)).limit(1);

  // 8. Use ACTUAL values from DB after atomic update
  const actualCoinsRemaining = updatedTx?.coinsRemaining ?? newCoinsRemaining;
  const actualTotalCashWon = updatedTx?.totalCashWon ?? newTotalCashWon;

  // 9. Check if transaction should complete or trigger bonus round
  let bonusRoundTriggered = false;
  let bonusMessage: string | undefined;
  let freeCoins: number | undefined;
  let transactionComplete = false;
  let bonusGamesLeft = 0;
  let totalWinOverride: number | undefined;

  if (isBonusRound) {
    const played = updatedTx?.bonusGamesPlayed || ((activeTx.bonusGamesPlayed || 0) + 1);
    const total = activeTx.bonusGamesTotal || 0;
    bonusGamesLeft = Math.max(0, total - played);

    if (actualTotalCashWon >= activeTx.guaranteedMinimum) {
      // Guarantee met during bonus round
      await db.update(transactions).set({
        status: "completed", guaranteeMet: true, completedAt: new Date().toISOString(),
      }).where(eq(transactions.id, activeTx.id));
      transactionComplete = true;
    } else if (played >= total || actualCoinsRemaining <= 0) {
      // Bonus games exhausted but guarantee still not met — auto-award remaining shortfall
      const shortfall = round2(activeTx.guaranteedMinimum - actualTotalCashWon);
      console.log(`[GUARANTEE-BONUS] Auto-awarding shortfall ${shortfall}₾ to user ${userId} after bonus round.`);

      await db.update(users).set({
        balance: sql`ROUND(${users.balance} + ${shortfall}, 2)`,
        updatedAt: new Date().toISOString(),
      } as any).where(eq(users.id, userId));

      await db.update(transactions).set({
        status: "completed",
        guaranteeMet: true,
        totalCashWon: sql`ROUND(${transactions.totalCashWon} + ${shortfall}, 2)`,
        completedAt: new Date().toISOString(),
      } as any).where(eq(transactions.id, activeTx.id));

      transactionComplete = true;
      totalWinOverride = shortfall;
      bonusMessage = `მინიმალური გარანტია: +${shortfall}₾`;
    }
  } else if (actualCoinsRemaining <= 0) {
    if (actualTotalCashWon >= activeTx.guaranteedMinimum || activeTx.guaranteedMinimum === 0) {
      // Guarantee already met or no guarantee
      await db.update(transactions).set({
        status: "completed", guaranteeMet: true, completedAt: new Date().toISOString(),
      }).where(eq(transactions.id, activeTx.id));
      transactionComplete = true;
    } else {
      // Guarantee NOT met — auto-award the shortfall directly (no bonus games needed)
      const shortfall = round2(activeTx.guaranteedMinimum - actualTotalCashWon);
      console.log(`[GUARANTEE] Auto-awarding shortfall ${shortfall}₾ to user ${userId}. Won ${actualTotalCashWon}, guaranteed ${activeTx.guaranteedMinimum}`);

      // Award shortfall to user's cash balance
      await db.update(users).set({
        balance: sql`ROUND(${users.balance} + ${shortfall}, 2)`,
        updatedAt: new Date().toISOString(),
      } as any).where(eq(users.id, userId));

      // Mark transaction complete with guarantee met
      await db.update(transactions).set({
        status: "completed",
        guaranteeMet: true,
        totalCashWon: sql`ROUND(${transactions.totalCashWon} + ${shortfall}, 2)`,
        completedAt: new Date().toISOString(),
      } as any).where(eq(transactions.id, activeTx.id));

      transactionComplete = true;
      // Report the shortfall as a bonus win so client shows it
      bonusRoundTriggered = true;
      bonusMessage = `მინიმალური გარანტია: +${shortfall}₾`;
      totalWinOverride = shortfall;
    }
  }

  // 10. Log game history
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

  // Re-read user balance for accurate return value
  const [userAfter] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  // Re-read transaction for final totalCashWon (includes auto-awarded shortfall)
  const [finalTx] = await db.select().from(transactions).where(eq(transactions.id, activeTx.id)).limit(1);
  const finalTotalCashWon = finalTx?.totalCashWon ?? actualTotalCashWon;
  const finalCoinsRemaining = finalTx?.coinsRemaining ?? actualCoinsRemaining;

  return {
    won: totalWin > 0 || (totalWinOverride !== undefined && totalWinOverride > 0),
    winAmount: totalWinOverride ?? totalWin,
    minWin,
    bonusWin: totalWinOverride ?? bonusWin,
    totalWin: totalWinOverride ?? totalWin,
    newBalance: userAfter?.balance ?? newBalance,
    poolBalance: poolAfter?.balance || poolBefore,
    coinsRemaining: finalCoinsRemaining,
    totalCashWon: finalTotalCashWon,
    bonusRound: bonusRoundTriggered,
    bonusMessage,
    freeCoins,
    bonusGamesLeft,
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
