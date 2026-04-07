import crypto from "crypto";
import { nanoid } from "nanoid";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { gameConfig, pool, users, gameHistory, transactions, systemConfig, userVillageProfile, villageLevels, bigWinConfig, bigWinPrizes, bigWinHistory } from "../db/schema.js";

// ═══════════════════════════════════════
// PER-USER MUTEX — prevents parallel drops from causing race conditions
// ═══════════════════════════════════════
const userLocks = new Map<string, Promise<any>>();

async function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = userLocks.get(userId) || Promise.resolve();
  const current = prev.then(fn, fn);
  userLocks.set(userId, current);
  current.finally(() => {
    if (userLocks.get(userId) === current) {
      userLocks.delete(userId);
    }
  });
  return current;
}

// ═══════════════════════════════════════
// INTEGER MATH HELPERS — all currency in tetri (1/100 GEL) to avoid float drift
// ═══════════════════════════════════════
export function toTetri(lari: number): number {
  return Math.round(lari * 100);
}

export function toLari(tetri: number): number {
  return tetri / 100;
}

export interface GameResult {
  won: boolean;
  winAmount: number;
  minWin: number;
  bonusWin: number;
  totalWin: number;
  newBalance: number;
  poolBalance: number;
  coinsRemaining: number;
  totalCashWon: number;
  bonusRound: boolean;
  bonusMessage?: string;
  freeCoins?: number;
  bonusGamesLeft: number;
  transactionComplete: boolean;
  // BIG WIN
  bigWin?: boolean;
  bigWinAmount?: number;
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

export function secureRandom(): number {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) / 0x100000000;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface Config {
  avgReturnPercent: number;
  maxWinPerUser: number;
  poolMinimumThreshold: number;
  fullReturnThreshold: number;
  minReturnPercent: number;
  isActive: boolean;
}

// EXPORTED for simulation — this is the SINGLE source of truth for win calculation
export function calculateWin(
  betAmountInLari: number,
  config: Config,
  poolBalance: number,
  isBonusRound: boolean,
  plannedBonusWin: number
): { minWin: number; bonusWin: number } {
  if (isBonusRound && plannedBonusWin > 0) {
    return { minWin: 0, bonusWin: round2(plannedBonusWin) };
  }

  if (!config.isActive) return { minWin: 0, bonusWin: 0 };
  if (poolBalance < config.poolMinimumThreshold) return { minWin: 0, bonusWin: 0 };

  const avgReturnDecimal = config.avgReturnPercent / 100;
  if (avgReturnDecimal <= 0) return { minWin: 0, bonusWin: 0 };

  const availablePool = poolBalance - config.poolMinimumThreshold;
  if (availablePool <= 0) return { minWin: 0, bonusWin: 0 };

  const winChance = 0.10;
  const roll = secureRandom();
  if (roll >= winChance) {
    return { minWin: 0, bonusWin: 0 };
  }

  const expectedBonus = (avgReturnDecimal / winChance) * betAmountInLari;
  const randomMultiplier = 0.5 + secureRandom();
  let bonusWin = expectedBonus * randomMultiplier;

  bonusWin = Math.min(bonusWin, config.maxWinPerUser);
  bonusWin = Math.min(bonusWin, availablePool);
  bonusWin = round2(Math.max(0, bonusWin));

  console.log(`[GAME ENGINE] bet=${betAmountInLari}₾ avgReturn=${config.avgReturnPercent}% winChance=${winChance} expectedBonus=${expectedBonus} randomMult=${randomMultiplier.toFixed(3)} bonusWin=${bonusWin}`);

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
  return withUserLock(userId, () => _playGameInner(userId, gameType, coinCost));
}

async function _playGameInner(
  userId: string,
  gameType: "slot" | "plinko" | "chicken_rush",
  coinCost: number
): Promise<GameResult> {
  const db = getDb();

  // 1. Find active transaction (newest first)
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

  // 3. Check master switch
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
    const plan: number[] = JSON.parse(activeTx.bonusWinsPlan);
    const played = activeTx.bonusGamesPlayed || 0;
    plannedBonusWin = plan[played] || 0;
  }

  // ═══════════════════════════════════════
  // VILLAGE LEVEL CAP — user's level overrides global maxWin
  // ═══════════════════════════════════════
  let userMaxWin = config.maxWinPerUser;
  try {
    let [profile] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, userId)).limit(1);
    if (!profile) {
      // Auto-create at Level 1 with 0 stars
      await db.insert(userVillageProfile).values({
        id: nanoid(), userId, currentLevel: 1, totalStars: 0,
      });
      [profile] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, userId)).limit(1);
    }
    if (profile) {
      const [lvl] = await db.select().from(villageLevels).where(eq(villageLevels.levelNumber, profile.currentLevel)).limit(1);
      if (lvl) {
        userMaxWin = Math.min(config.maxWinPerUser, lvl.maxWinAmount);
      }
    }
  } catch (e: any) {
    console.error("[village level cap]", e.message);
    // fall back to global cap
  }

  // ═══════════════════════════════════════
  // BIG WIN CHECK — distributes admin-created prizes across expected game plays
  // No fixed trigger %; rarity is controlled by quantity of prizes vs expected plays
  // chance_per_game = remainingBigWins / expectedPlaysRemaining
  //   where expectedPlaysRemaining = bigWinBudget / avgBet
  // Naturally adapts: fewer prizes = rarer; more prizes = more frequent.
  // Skipped if master switch OFF or in bonus round.
  // ═══════════════════════════════════════
  let bigWinAmount = 0;
  let bigWinPrizeId: string | null = null;
  if (masterSwitchOn && !isBonusRound) {
    try {
      const [bwCfg] = await db.select().from(bigWinConfig).limit(1);
      if (bwCfg) {
        const available = Math.max(0, poolBefore - config.poolMinimumThreshold);
        const bigWinBudget = available * bwCfg.budgetPercent / 100;

        if (bigWinBudget > 0 && betInLari > 0) {
          const activePrizes = await db.select().from(bigWinPrizes)
            .where(eq(bigWinPrizes.isActive, true));
          // Eligible = has remaining + fits level cap + fits budget
          const eligible = activePrizes
            .filter(p => p.quantity - p.wonCount > 0 && p.amount <= userMaxWin && p.amount <= bigWinBudget);

          if (eligible.length > 0) {
            const remainingBigWins = eligible.reduce((s, p) => s + (p.quantity - p.wonCount), 0);
            // Expected games the budget covers (1 bet per game)
            const expectedPlays = bigWinBudget / betInLari;
            const chance = expectedPlays > 0 ? Math.min(1, remainingBigWins / expectedPlays) : 0;

            if (secureRandom() < chance) {
              // Pick a random eligible prize, weighted by remaining quantity
              const totalRemaining = remainingBigWins;
              let pick = secureRandom() * totalRemaining;
              let chosen = eligible[0];
              for (const p of eligible) {
                pick -= (p.quantity - p.wonCount);
                if (pick <= 0) { chosen = p; break; }
              }
              bigWinAmount = chosen.amount;
              bigWinPrizeId = chosen.id;
              console.log(`[BIG WIN] userId=${userId} prize=${chosen.amount}₾ chance=${(chance * 100).toFixed(3)}% remaining=${remainingBigWins} expected=${expectedPlays.toFixed(0)}`);
            }
          }
        }
      }
    } catch (e: any) {
      console.error("[big win check]", e.message);
    }
  }

  let { minWin, bonusWin } = calculateWin(betInLari, {
    avgReturnPercent: config.avgReturnPercent,
    maxWinPerUser: userMaxWin, // VILLAGE-CAPPED max win for this user
    poolMinimumThreshold: config.poolMinimumThreshold,
    fullReturnThreshold: config.fullReturnThreshold,
    minReturnPercent: config.minReturnPercent,
    isActive: config.isActive,
  }, poolBefore, isBonusRound, plannedBonusWin);

  // MASTER SWITCH: if OFF, zero out normal winnings (but guarantee still applies below)
  if (!masterSwitchOn) {
    minWin = 0;
    bonusWin = 0;
  }

  let totalWin = round2(minWin + bonusWin + bigWinAmount);

  // ═══════════════════════════════════════
  // GUARANTEE CHECK — on the LAST game, force win to cover shortfall
  // ═══════════════════════════════════════
  const actualCoinDeduct = isBonusRound ? Math.min(coinCost, activeTx.coinsRemaining) : coinCost;
  const willHaveCoinsLeft = activeTx.coinsRemaining - actualCoinDeduct;
  const isLastGame = willHaveCoinsLeft <= 0;

  if (isLastGame && activeTx.guaranteedMinimum > 0) {
    // Use integer math (tetri) to calculate guarantee precisely
    const guaranteedTetri = toTetri(activeTx.guaranteedMinimum);
    const wonSoFarTetri = toTetri(activeTx.totalCashWon);
    const thisWinTetri = toTetri(totalWin);
    const totalAfterThisGame = wonSoFarTetri + thisWinTetri;
    // VILLAGE LEVEL CAP — session total can never exceed user level max win
    const levelCapTetri = toTetri(userMaxWin);

    if (totalAfterThisGame < guaranteedTetri) {
      // Shortfall exists — force this game's win to cover it BUT respect level cap
      const targetTetri = Math.min(guaranteedTetri, levelCapTetri);
      const shortfallTetri = Math.max(0, targetTetri - wonSoFarTetri);
      const shortfallLari = toLari(shortfallTetri);

      console.log(`[GUARANTEE] Last game! Won=${toLari(wonSoFarTetri)}₾ guaranteed=${activeTx.guaranteedMinimum}₾ levelCap=${userMaxWin}₾ → topup=${shortfallLari}₾`);

      totalWin = shortfallLari;
      bonusWin = shortfallLari;
      minWin = 0;
    } else {
      // Already met guarantee — but make sure this game's win doesn't push past level cap
      const remainingRoom = Math.max(0, levelCapTetri - wonSoFarTetri);
      if (thisWinTetri > remainingRoom) {
        totalWin = toLari(remainingRoom);
        bonusWin = totalWin;
        minWin = 0;
      }
    }
  } else {
    // Non-last game: also enforce level cap on cumulative session
    const levelCapTetri = toTetri(userMaxWin);
    const wonSoFarTetri = toTetri(activeTx.totalCashWon);
    const thisWinTetri = toTetri(totalWin);
    if (wonSoFarTetri + thisWinTetri > levelCapTetri) {
      const remainingRoom = Math.max(0, levelCapTetri - wonSoFarTetri);
      totalWin = toLari(remainingRoom);
      bonusWin = totalWin;
      minWin = 0;
    }
  }

  // If level-cap truncation killed the big win, cancel it
  if (bigWinPrizeId && totalWin < bigWinAmount) {
    console.log(`[BIG WIN] cancelled — level cap truncated win`);
    bigWinPrizeId = null;
    bigWinAmount = 0;
  }

  console.log(`[PLAY] userId=${userId} game=${gameType} coins=${coinCost} betLari=${betInLari} minWin=${minWin} bonusWin=${bonusWin} bigWin=${bigWinAmount} totalWin=${totalWin} pool=${poolBefore} isBonusRound=${isBonusRound} isLastGame=${isLastGame}`);

  // 6a. Deduct from pool if bonus win (not from guarantee on last game)
  if (bonusWin > 0 && !isBonusRound && !isLastGame) {
    await db.update(pool).set({
      balance: sql`ROUND(${pool.balance} - ${bonusWin}, 2)`,
      totalWon: sql`ROUND(${pool.totalWon} + ${bonusWin}, 2)`,
      updatedAt: new Date().toISOString(),
    } as any).where(eq(pool.id, poolRow.id));
  }

  // 6b. BIG WIN — deduct from pool, increment prize won_count, log to history
  if (bigWinPrizeId && bigWinAmount > 0) {
    await db.update(pool).set({
      balance: sql`ROUND(${pool.balance} - ${bigWinAmount}, 2)`,
      totalWon: sql`ROUND(${pool.totalWon} + ${bigWinAmount}, 2)`,
      updatedAt: new Date().toISOString(),
    } as any).where(eq(pool.id, poolRow.id));
    await (db as any).run(sql`UPDATE big_win_prizes SET won_count = won_count + 1, updated_at = datetime('now') WHERE id = ${bigWinPrizeId}`);
    await db.insert(bigWinHistory).values({
      id: nanoid(), prizeId: bigWinPrizeId, userId, amount: bigWinAmount,
    });
  }

  // 7. Update user cash balance — ATOMIC
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  const newBalance = round2(user.balance + totalWin);
  if (totalWin > 0) {
    await db.update(users).set({
      balance: sql`ROUND(${users.balance} + ${totalWin}, 2)`,
      updatedAt: new Date().toISOString(),
    } as any).where(eq(users.id, userId));
  }

  // 8. Update transaction — ATOMIC coin deduction
  const newCoinsRemaining = Math.max(0, activeTx.coinsRemaining - actualCoinDeduct);
  const newTotalCashWon = round2(activeTx.totalCashWon + totalWin);

  await db.update(transactions).set({
    coinsRemaining: sql`MAX(0, ${transactions.coinsRemaining} - ${actualCoinDeduct})`,
    totalCashWon: sql`ROUND(${transactions.totalCashWon} + ${totalWin}, 2)`,
    ...(isBonusRound ? { bonusGamesPlayed: sql`COALESCE(${transactions.bonusGamesPlayed}, 0) + 1` } : {}),
  } as any).where(eq(transactions.id, activeTx.id));

  // Re-read the transaction to get accurate values after atomic update
  const [updatedTx] = await db.select().from(transactions).where(eq(transactions.id, activeTx.id)).limit(1);

  const actualCoinsRemaining = updatedTx?.coinsRemaining ?? newCoinsRemaining;
  const actualTotalCashWon = updatedTx?.totalCashWon ?? newTotalCashWon;

  // ═══════════════════════════════════════
  // SESSION COMPLETION CHECK
  // ═══════════════════════════════════════
  let bonusRoundTriggered = false;
  let bonusMessage: string | undefined;
  let freeCoins: number | undefined;
  let transactionComplete = false;
  let bonusGamesLeft = 0;

  if (isBonusRound) {
    const played = updatedTx?.bonusGamesPlayed || ((activeTx.bonusGamesPlayed || 0) + 1);
    const total = activeTx.bonusGamesTotal || 0;
    bonusGamesLeft = Math.max(0, total - played);

    if (played >= total || actualCoinsRemaining <= 0) {
      // Bonus round ending — run safety net
      await _ensureGuarantee(db, activeTx.id, userId);
      transactionComplete = true;
    } else if (actualTotalCashWon >= activeTx.guaranteedMinimum) {
      await db.update(transactions).set({
        status: "completed", guaranteeMet: true, completedAt: new Date().toISOString(),
      }).where(eq(transactions.id, activeTx.id));
      transactionComplete = true;
    }
  } else if (actualCoinsRemaining <= 0) {
    // Normal coins exhausted — run safety net guarantee check
    await _ensureGuarantee(db, activeTx.id, userId);
    transactionComplete = true;
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
    // Link this game to the source payment for accurate finance reporting
    paymentTransactionId: (activeTx as any).paymentTransactionId || null,
  });

  // Re-read for accurate return values
  const [userAfter] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [finalTx] = await db.select().from(transactions).where(eq(transactions.id, activeTx.id)).limit(1);

  return {
    won: totalWin > 0,
    winAmount: totalWin,
    minWin,
    bonusWin,
    totalWin,
    bigWin: bigWinAmount > 0,
    bigWinAmount,
    newBalance: userAfter?.balance ?? newBalance,
    poolBalance: poolAfter?.balance || poolBefore,
    coinsRemaining: finalTx?.coinsRemaining ?? actualCoinsRemaining,
    totalCashWon: finalTx?.totalCashWon ?? actualTotalCashWon,
    bonusRound: bonusRoundTriggered,
    bonusMessage,
    freeCoins,
    bonusGamesLeft,
    transactionComplete,
  };
}

// ═══════════════════════════════════════
// SAFETY NET — ensures guarantee is NEVER violated
// Called when a transaction is about to complete (coins exhausted)
// Uses integer math (tetri) to avoid any float drift
// ═══════════════════════════════════════
async function _ensureGuarantee(db: ReturnType<typeof getDb>, txId: string, userId: string) {
  // Re-read fresh from DB
  const [tx] = await db.select().from(transactions).where(eq(transactions.id, txId)).limit(1);
  if (!tx) return;

  // VILLAGE LEVEL CAP — read user's level max win (absolute ceiling)
  let levelCap = Number.MAX_SAFE_INTEGER;
  try {
    const [profile] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, userId)).limit(1);
    if (profile) {
      const [lvl] = await db.select().from(villageLevels).where(eq(villageLevels.levelNumber, profile.currentLevel)).limit(1);
      if (lvl) levelCap = lvl.maxWinAmount;
    }
  } catch {}

  const guaranteedTetri = toTetri(tx.guaranteedMinimum);
  const wonTetri = toTetri(tx.totalCashWon);
  const levelCapTetri = toTetri(levelCap);

  // Target = min(guarantee, level cap) — never exceed level cap
  const targetTetri = Math.min(guaranteedTetri, levelCapTetri);

  if (targetTetri > 0 && wonTetri < targetTetri) {
    const shortfallTetri = targetTetri - wonTetri;
    const shortfallLari = toLari(shortfallTetri);

    console.log(`[GUARANTEE SAFETY NET] userId=${userId} won=${toLari(wonTetri)}₾ guaranteed=${tx.guaranteedMinimum}₾ levelCap=${levelCap}₾ → topup=${shortfallLari}₾`);

    await db.update(users).set({
      balance: sql`ROUND(${users.balance} + ${shortfallLari}, 2)`,
      updatedAt: new Date().toISOString(),
    } as any).where(eq(users.id, userId));

    await db.update(transactions).set({
      status: "completed",
      guaranteeMet: true,
      totalCashWon: sql`ROUND(${transactions.totalCashWon} + ${shortfallLari}, 2)`,
      completedAt: new Date().toISOString(),
    } as any).where(eq(transactions.id, txId));
  } else {
    // Already at or above target (could be capped) — just complete
    await db.update(transactions).set({
      status: "completed",
      guaranteeMet: true,
      completedAt: new Date().toISOString(),
    }).where(eq(transactions.id, txId));
  }
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
  // Use integer math: guaranteedMinimum = paymentAmount * percent / 100
  // e.g. 10₾ * 1% = 0.10₾ → in tetri: 1000 * 1 / 100 = 10 tetri = 0.10₾
  const guaranteedTetri = Math.ceil(toTetri(paymentAmount) * minReturnPercent / 100);
  const guaranteedMinimum = toLari(guaranteedTetri);

  console.log(`[CREATE TX] userId=${userId} payment=${paymentAmount}₾ coins=${coinsReceived} minReturn=${minReturnPercent}% guaranteed=${guaranteedMinimum}₾ (${guaranteedTetri} tetri)`);

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
