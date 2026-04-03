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
  let plannedBonusWin = 0;

  if (isBonusRound && activeTx.bonusWinsPlan) {
    // Pop next planned win from the bonus plan
    const plan: number[] = JSON.parse(activeTx.bonusWinsPlan);
    const played = activeTx.bonusGamesPlayed || 0;
    plannedBonusWin = plan[played] || 0;
  }

  const { minWin, bonusWin } = calculateWin(betInLari, {
    avgReturnPercent: config.avgReturnPercent,
    maxWinPerUser: config.maxWinPerUser,
    poolMinimumThreshold: config.poolMinimumThreshold,
    fullReturnThreshold: config.fullReturnThreshold,
    minReturnPercent: config.minReturnPercent,
    isActive: config.isActive,
  }, poolBefore, isBonusRound, plannedBonusWin);

  const totalWin = round2(minWin + bonusWin);

  console.log(`[PLAY] userId=${userId} game=${gameType} coins=${coinCost} betLari=${betInLari} minWin=${minWin} bonusWin=${bonusWin} totalWin=${totalWin} pool=${poolBefore} isBonusRound=${isBonusRound}`);

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
  const newCoinsRemaining = Math.max(0, activeTx.coinsRemaining - actualCoinDeduct);
  const newTotalCashWon = round2(activeTx.totalCashWon + totalWin);

  const txUpdates: Record<string, any> = {
    coinsRemaining: newCoinsRemaining,
    totalCashWon: newTotalCashWon,
  };

  // Track bonus games played
  if (isBonusRound) {
    txUpdates.bonusGamesPlayed = (activeTx.bonusGamesPlayed || 0) + 1;
  }

  await db.update(transactions).set(txUpdates).where(eq(transactions.id, activeTx.id));

  // 8. Check if transaction should complete or trigger bonus round
  let bonusRoundTriggered = false;
  let bonusMessage: string | undefined;
  let freeCoins: number | undefined;
  let transactionComplete = false;
  let bonusGamesLeft = 0;

  if (isBonusRound) {
    const played = (activeTx.bonusGamesPlayed || 0) + 1;
    const total = activeTx.bonusGamesTotal || 0;
    bonusGamesLeft = Math.max(0, total - played);

    if (newTotalCashWon >= activeTx.guaranteedMinimum || played >= total) {
      // All bonus games played or guarantee met
      await db.update(transactions).set({
        status: "completed", guaranteeMet: true, completedAt: new Date().toISOString(),
      }).where(eq(transactions.id, activeTx.id));
      transactionComplete = true;
    } else if (newCoinsRemaining <= 0) {
      // Need more coins for remaining bonus games
      const coinsPerGame = 10;
      const remainingGames = total - played;
      const bonusCoins = coinsPerGame * remainingGames;
      await db.update(transactions).set({ coinsRemaining: bonusCoins }).where(eq(transactions.id, activeTx.id));
      bonusRoundTriggered = true;
      bonusMessage = `კიდევ ${remainingGames} უფასო თამაში დარჩა`;
      freeCoins = bonusCoins;
      bonusGamesLeft = remainingGames;
    }
  } else if (newCoinsRemaining <= 0) {
    if (newTotalCashWon >= activeTx.guaranteedMinimum || activeTx.guaranteedMinimum === 0) {
      // Guarantee met or free coins (no guarantee)
      await db.update(transactions).set({
        status: "completed", guaranteeMet: true, completedAt: new Date().toISOString(),
      }).where(eq(transactions.id, activeTx.id));
      transactionComplete = true;
    } else {
      // Normal coins ran out, guarantee NOT met — generate bonus plan
      const shortfall = round2(activeTx.guaranteedMinimum - newTotalCashWon);
      const plan = generateBonusPlan(shortfall);
      const totalBonusGames = plan.length;
      const bonusCoins = 10 * totalBonusGames;

      await db.update(transactions).set({
        status: "bonus_round",
        coinsRemaining: bonusCoins,
        bonusGamesGiven: totalBonusGames,
        bonusWinsPlan: JSON.stringify(plan),
        bonusGamesPlayed: 0,
        bonusGamesTotal: totalBonusGames,
      }).where(eq(transactions.id, activeTx.id));

      bonusRoundTriggered = true;
      bonusMessage = "შენ მიიღე ბონუს შანსი! 🎉 ითამაშე უფასოდ!";
      freeCoins = bonusCoins;
      bonusGamesLeft = totalBonusGames;
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
