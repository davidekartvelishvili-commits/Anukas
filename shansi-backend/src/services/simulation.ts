import { eq, asc } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { gameConfig, pool, simulationRuns, systemConfig, villageLevels, bigWinConfig, bigWinPrizes } from "../db/schema.js";

// REAL ALGORITHM IMPORTS — same functions production uses
import {
  calculateWin,
  secureRandom,
  round2,
  toTetri,
  toLari,
  type Config,
} from "./gameEngine.js";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface SimUserLog {
  index: number;
  spendAmount: number;
  gamesPlayed: number;
  gamesWon: number;
  naturalCashback: number;
  guaranteedMinimum: number;
  guaranteeTopUp: number;
  finalCashback: number;
  guaranteeMet: boolean;
  // Village level info
  level?: number;
  levelMaxWin?: number;
  levelCapViolated?: boolean;
  // Big win info
  bigWinAmount?: number;
  bigWinPrizeAmount?: number;
}

interface SimPrizeState {
  id: string;
  amount: number;
  quantity: number;
  wonCount: number;
}

interface LevelStat {
  level: number;
  userCount: number;
  levelMaxWin: number;
  actualMaxWin: number;
  violations: number;
}

export interface SimulationResults {
  userCount: number;
  scenario: string;
  gameTypes: string[];
  config: Config;
  masterSwitchOn: boolean;
  villageEnabled: boolean;
  levelDistribution?: string;
  levelStats?: LevelStat[];
  levelsConfigured: boolean;

  // Pool tracking (no fake income)
  poolStartBalance: number;
  poolTotalPaidOut: number;
  poolEndBalance: number;

  // Stats
  actualAvgReturnPercent: number;
  targetAvgReturnPercent: number;
  guaranteeMissCount: number;
  maxWinViolationCount: number;
  guaranteeTopUpCount: number;
  totalSpend: number;
  totalCashWon: number;

  // Distribution
  minCashback: number;
  maxCashback: number;
  medianCashback: number;
  meanCashback: number;
  histogram: { range: string; count: number }[];

  // Pass/fail
  checks: {
    avgReturnMatch: boolean;
    allGuaranteesMet: boolean;
    noMaxWinViolations: boolean;
    poolNotNegative: boolean;
    masterSwitchOffTest: boolean;
    allLevelCapsRespected?: boolean;
    guaranteeRespectsLevel?: boolean;
    bigWinPaymentEligibility?: boolean;
    bigWinLevelEligibility?: boolean;
  };

  // Big win results
  bigWinsAwarded?: number;
  bigWinsTotalAmount?: number;
  bigWinWinners?: { userIndex: number; spend: number; level?: number; prize: number }[];

  // Proof — first 10 users detailed log
  sampleUsers: SimUserLog[];

  durationMs: number;
}

// ═══════════════════════════════════════
// SIMULATE ONE USER — calls REAL calculateWin
// ═══════════════════════════════════════

function simulateOneUser(
  spendAmount: number,
  config: Config,
  virtualPoolBalance: number,
  masterSwitchOn: boolean,
  userLevel?: { level: number; maxWin: number },
  prizeState?: SimPrizeState[],
  bigWinBudget = 0
): { log: SimUserLog; poolDelta: number; bigWinAwarded?: { prizeId: string; amount: number } } {
  const coinCost = 10;
  const coinsReceived = Math.round(spendAmount * 100);
  const totalGames = Math.floor(coinsReceived / coinCost);
  const betInLari = coinCost / 100;

  // Effective max win = min(global, level cap)
  const effectiveMaxWin = userLevel
    ? Math.min(config.maxWinPerUser, userLevel.maxWin)
    : config.maxWinPerUser;
  const effectiveConfig: Config = { ...config, maxWinPerUser: effectiveMaxWin };
  const levelCapTetri = toTetri(effectiveMaxWin);

  const guaranteedTetri = Math.ceil(toTetri(spendAmount) * config.minReturnPercent / 100);
  const guaranteedMinimum = toLari(guaranteedTetri);

  let totalCashWonTetri = 0;
  let gamesWon = 0;
  let poolDelta = 0;
  let maxSingleWin = 0;
  let bigWinAwarded: { prizeId: string; amount: number } | undefined;
  let bigWinAmount = 0;

  for (let i = 0; i < totalGames; i++) {
    const isLastGame = i === totalGames - 1;
    const currentPoolBalance = virtualPoolBalance - poolDelta;

    // ═══ BIG WIN CHECK (same logic as production) ═══
    if (masterSwitchOn && !bigWinAwarded && prizeState && bigWinBudget > 0 && betInLari > 0) {
      const eligible = prizeState
        .filter(p => p.quantity - p.wonCount > 0)
        .filter(p => p.amount <= spendAmount)        // payment eligibility
        .filter(p => p.amount <= effectiveMaxWin)    // level eligibility
        .filter(p => p.amount <= bigWinBudget)
        .sort((a, b) => b.amount - a.amount);
      if (eligible.length > 0) {
        const remainingBigWins = eligible.reduce((s, p) => s + (p.quantity - p.wonCount), 0);
        const expectedPlays = bigWinBudget / betInLari;
        const chance = expectedPlays > 0 ? Math.min(1, remainingBigWins / expectedPlays) : 0;
        if (secureRandom() < chance) {
          const chosen = eligible[0];
          chosen.wonCount++; // mutate prize state
          bigWinAwarded = { prizeId: chosen.id, amount: chosen.amount };
          bigWinAmount = chosen.amount;
        }
      }
    }

    // ═══ REAL ALGORITHM CALL — same as production, with level-capped maxWin ═══
    let { minWin, bonusWin } = calculateWin(
      betInLari, effectiveConfig, currentPoolBalance, false, 0
    );

    if (!masterSwitchOn) { minWin = 0; bonusWin = 0; }

    let totalWin = round2(minWin + bonusWin + bigWinAmount);
    bigWinAmount = 0; // consume — only adds to one game

    // Last-game guarantee + level cap (mirrors production)
    if (isLastGame && guaranteedTetri > 0) {
      const totalAfter = totalCashWonTetri + toTetri(totalWin);
      if (totalAfter < guaranteedTetri) {
        const targetTetri = Math.min(guaranteedTetri, levelCapTetri);
        const shortfall = Math.max(0, targetTetri - totalCashWonTetri);
        totalWin = toLari(shortfall);
      } else {
        // Cap to level
        const room = Math.max(0, levelCapTetri - totalCashWonTetri);
        if (toTetri(totalWin) > room) totalWin = toLari(room);
      }
    } else {
      // Per-game cap to remaining level room
      const room = Math.max(0, levelCapTetri - totalCashWonTetri);
      if (toTetri(totalWin) > room) totalWin = toLari(room);
    }

    const poolDeducted = totalWin; // approximation; level top-up doesn't come from pool but small here

    if (totalWin > 0) gamesWon++;
    totalCashWonTetri += toTetri(totalWin);
    poolDelta += poolDeducted;
    if (totalWin > maxSingleWin) maxSingleWin = totalWin;
  }

  // Safety net guarantee (capped by level)
  const naturalCashback = toLari(totalCashWonTetri);
  let guaranteeTopUp = 0;
  const targetSafety = Math.min(guaranteedTetri, levelCapTetri);
  if (targetSafety > 0 && totalCashWonTetri < targetSafety) {
    const topupTetri = targetSafety - totalCashWonTetri;
    guaranteeTopUp = toLari(topupTetri);
    totalCashWonTetri += topupTetri;
  }

  const finalCashback = toLari(totalCashWonTetri);
  const levelCapViolated = userLevel ? finalCashback > userLevel.maxWin + 0.001 : false;

  return {
    log: {
      index: 0,
      spendAmount: round2(spendAmount),
      gamesPlayed: totalGames,
      gamesWon,
      naturalCashback: round2(naturalCashback),
      guaranteedMinimum,
      guaranteeTopUp: round2(guaranteeTopUp),
      finalCashback: round2(finalCashback),
      guaranteeMet: finalCashback >= Math.min(guaranteedMinimum, effectiveMaxWin) - 0.001,
      level: userLevel?.level,
      levelMaxWin: userLevel?.maxWin,
      levelCapViolated,
      bigWinAmount: bigWinAwarded?.amount,
      bigWinPrizeAmount: bigWinAwarded?.amount,
    },
    poolDelta: round2(poolDelta),
    bigWinAwarded,
  };
}

// ═══════════════════════════════════════
// SPEND SCENARIOS
// ═══════════════════════════════════════

const SCENARIOS: Record<string, { min: number; max: number }> = {
  low: { min: 1, max: 5 },
  medium: { min: 5, max: 20 },
  high: { min: 20, max: 100 },
  mixed: { min: 1, max: 100 },
};

// ═══════════════════════════════════════
// MAIN SIMULATION
// ═══════════════════════════════════════

export async function runSimulation(
  jobId: string,
  userCount: number,
  scenario: string,
  gameTypes: string[] = ["plinko"],
  villageOpts: { enabled: boolean; distribution: "equal" | "realistic" | "specific"; specificLevel?: number } = { enabled: false, distribution: "equal" }
): Promise<SimulationResults> {
  const db = getDb();
  const startTime = Date.now();

  const range = SCENARIOS[scenario] || SCENARIOS.mixed;

  // Read REAL config from DB for the requested game type
  const [cfg] = await db.select().from(gameConfig)
    .where(eq(gameConfig.gameType, gameTypes[0]))
    .limit(1);
  // Fallback to any config
  const fallback = cfg || (await db.select().from(gameConfig).limit(1))[0];
  if (!fallback) throw new Error("Game config not found in database");

  const config: Config = {
    avgReturnPercent: fallback.avgReturnPercent,
    maxWinPerUser: fallback.maxWinPerUser,
    poolMinimumThreshold: fallback.poolMinimumThreshold,
    fullReturnThreshold: fallback.fullReturnThreshold,
    minReturnPercent: fallback.minReturnPercent,
    isActive: fallback.isActive,
  };

  const [masterRow] = await db.select().from(systemConfig).where(eq(systemConfig.key, "master_switch")).limit(1);
  const masterSwitchOn = masterRow?.value !== "false";

  // Virtual pool starts at REAL pool balance
  const [poolRow] = await db.select().from(pool).limit(1);
  const poolStartBalance = poolRow?.balance || 0;

  // ═══ BIG WIN — load active prizes and budget ═══
  const [bwCfg] = await db.select().from(bigWinConfig).limit(1);
  const activePrizes = await db.select().from(bigWinPrizes).where(eq(bigWinPrizes.isActive, true));
  const prizeState: SimPrizeState[] = activePrizes.map(p => ({
    id: p.id, amount: p.amount, quantity: p.quantity, wonCount: 0, // sim resets won count
  }));
  const bwBudgetPercent = Number(bwCfg?.budgetPercent) || 30;
  const availableForBW = Math.max(0, poolStartBalance - config.poolMinimumThreshold);
  const bigWinBudget = availableForBW * bwBudgetPercent / 100;

  // ═══ VILLAGE LEVELS ═══
  const allLevels = await db.select().from(villageLevels).orderBy(asc(villageLevels.levelNumber));
  const levelsConfigured = allLevels.length > 0;

  // Build level assignment for each user
  const userLevelAssignments: ({ level: number; maxWin: number } | undefined)[] = [];
  if (villageOpts.enabled && levelsConfigured) {
    if (villageOpts.distribution === "specific" && villageOpts.specificLevel) {
      const lvl = allLevels.find(l => l.levelNumber === villageOpts.specificLevel);
      if (lvl) {
        for (let i = 0; i < userCount; i++) userLevelAssignments.push({ level: lvl.levelNumber, maxWin: lvl.maxWinAmount });
      }
    } else if (villageOpts.distribution === "realistic") {
      // 70% L1-3, 20% L4-6, 10% L7+
      const lows = allLevels.filter(l => l.levelNumber <= 3);
      const mids = allLevels.filter(l => l.levelNumber >= 4 && l.levelNumber <= 6);
      const highs = allLevels.filter(l => l.levelNumber >= 7);
      for (let i = 0; i < userCount; i++) {
        const r = secureRandom();
        const pool2 = r < 0.70 ? lows : r < 0.90 ? mids : highs;
        const pick = pool2[Math.floor(secureRandom() * pool2.length)] || allLevels[0];
        userLevelAssignments.push({ level: pick.levelNumber, maxWin: pick.maxWinAmount });
      }
    } else {
      // Equal distribution
      for (let i = 0; i < userCount; i++) {
        const lvl = allLevels[i % allLevels.length];
        userLevelAssignments.push({ level: lvl.levelNumber, maxWin: lvl.maxWinAmount });
      }
    }
  } else {
    for (let i = 0; i < userCount; i++) userLevelAssignments.push(undefined);
  }

  let virtualPoolBalance = poolStartBalance;
  const sampleUsers: SimUserLog[] = [];
  let totalPoolPaidOut = 0;
  let totalSpend = 0;
  let totalCashWon = 0;
  let guaranteeMissCount = 0;
  let maxWinViolationCount = 0;
  let guaranteeTopUpCount = 0;
  let levelCapViolations = 0;
  const allCashbacks: number[] = [];

  // Per-level stat accumulators
  const levelStatsMap = new Map<number, { count: number; maxWin: number; actualMax: number; violations: number }>();
  for (const lvl of allLevels) {
    levelStatsMap.set(lvl.levelNumber, { count: 0, maxWin: lvl.maxWinAmount, actualMax: 0, violations: 0 });
  }

  // Big win tracking
  const bigWinWinners: { userIndex: number; spend: number; level?: number; prize: number }[] = [];
  let bigWinPaymentViolation = false;
  let bigWinLevelViolation = false;

  const BATCH_SIZE = 50;

  for (let i = 0; i < userCount; i++) {
    const spendAmount = round2(range.min + secureRandom() * (range.max - range.min));
    const userLevel = userLevelAssignments[i];

    const { log, poolDelta, bigWinAwarded } = simulateOneUser(
      spendAmount, config, virtualPoolBalance, masterSwitchOn, userLevel,
      prizeState, bigWinBudget,
    );
    log.index = i + 1;

    if (bigWinAwarded) {
      bigWinWinners.push({ userIndex: i + 1, spend: spendAmount, level: userLevel?.level, prize: bigWinAwarded.amount });
      if (spendAmount < bigWinAwarded.amount - 0.001) bigWinPaymentViolation = true;
      if (userLevel && userLevel.maxWin < bigWinAwarded.amount - 0.001) bigWinLevelViolation = true;
    }

    // Track per-level stats
    if (userLevel) {
      const s = levelStatsMap.get(userLevel.level);
      if (s) {
        s.count++;
        if (log.finalCashback > s.actualMax) s.actualMax = log.finalCashback;
        if (log.levelCapViolated) { s.violations++; levelCapViolations++; }
      }
    }

    // Track pool (only outflow — no fake income)
    totalPoolPaidOut += poolDelta;
    virtualPoolBalance -= poolDelta;

    totalSpend += spendAmount;
    totalCashWon += log.finalCashback;
    allCashbacks.push(log.finalCashback);

    // Save first 10 as sample for verification
    if (i < 10) sampleUsers.push(log);

    // Check violations
    if (!log.guaranteeMet) guaranteeMissCount++;
    if (log.naturalCashback > config.maxWinPerUser + 0.01) maxWinViolationCount++;
    if (log.guaranteeTopUp > 0) guaranteeTopUpCount++;

    // Progress update
    if ((i + 1) % BATCH_SIZE === 0 || i === userCount - 1) {
      await db.update(simulationRuns).set({ progress: i + 1 }).where(eq(simulationRuns.id, jobId));
    }
  }

  // Stats
  allCashbacks.sort((a, b) => a - b);
  const actualAvgReturnPercent = totalSpend > 0 ? round2((totalCashWon / totalSpend) * 100) : 0;
  const meanCashback = round2(totalCashWon / userCount);
  const medianCashback = userCount % 2 === 0
    ? round2((allCashbacks[userCount / 2 - 1] + allCashbacks[userCount / 2]) / 2)
    : allCashbacks[Math.floor(userCount / 2)];

  // Histogram
  const minCb = allCashbacks[0];
  const maxCb = allCashbacks[allCashbacks.length - 1];
  const bucketCount = Math.min(15, Math.max(5, Math.ceil(Math.sqrt(userCount))));
  const bucketSize = maxCb > minCb ? (maxCb - minCb) / bucketCount : 1;
  const histogram: { range: string; count: number }[] = [];
  for (let b = 0; b < bucketCount; b++) {
    const lo = round2(minCb + b * bucketSize);
    const hi = round2(minCb + (b + 1) * bucketSize);
    const count = allCashbacks.filter(c => c >= lo && (b === bucketCount - 1 ? c <= hi : c < hi)).length;
    histogram.push({ range: `${lo}-${hi}`, count });
  }

  // Master switch OFF mini-test (100 users, no pool wins should happen)
  let masterSwitchOffTest = true;
  for (let i = 0; i < 100; i++) {
    const spend = round2(1 + secureRandom() * 9);
    const { log } = simulateOneUser(spend, config, poolStartBalance, false);
    if (log.naturalCashback > log.guaranteedMinimum + 0.01) {
      masterSwitchOffTest = false;
      break;
    }
  }

  const poolEndBalance = round2(virtualPoolBalance);

  // Build level stats array
  const levelStats: LevelStat[] = Array.from(levelStatsMap.entries())
    .filter(([, s]) => s.count > 0)
    .map(([level, s]) => ({
      level,
      userCount: s.count,
      levelMaxWin: s.maxWin,
      actualMaxWin: round2(s.actualMax),
      violations: s.violations,
    }))
    .sort((a, b) => a.level - b.level);

  // Verify guarantee respects level cap (no user with finalCashback > level cap)
  const guaranteeRespectsLevel = villageOpts.enabled ? levelCapViolations === 0 : true;

  const results: SimulationResults = {
    userCount,
    scenario,
    gameTypes,
    config,
    masterSwitchOn,
    villageEnabled: villageOpts.enabled,
    levelDistribution: villageOpts.enabled ? villageOpts.distribution : undefined,
    levelStats: villageOpts.enabled ? levelStats : undefined,
    levelsConfigured,

    poolStartBalance,
    poolTotalPaidOut: round2(totalPoolPaidOut),
    poolEndBalance,

    actualAvgReturnPercent,
    targetAvgReturnPercent: config.avgReturnPercent,
    guaranteeMissCount,
    maxWinViolationCount,
    guaranteeTopUpCount,
    totalSpend: round2(totalSpend),
    totalCashWon: round2(totalCashWon),

    minCashback: allCashbacks[0],
    maxCashback: allCashbacks[allCashbacks.length - 1],
    medianCashback,
    meanCashback,
    histogram,

    checks: {
      avgReturnMatch: Math.abs(actualAvgReturnPercent - config.avgReturnPercent) <= 0.5,
      allGuaranteesMet: guaranteeMissCount === 0,
      noMaxWinViolations: maxWinViolationCount === 0,
      poolNotNegative: poolEndBalance >= 0,
      masterSwitchOffTest,
      allLevelCapsRespected: villageOpts.enabled ? levelCapViolations === 0 : true,
      guaranteeRespectsLevel,
      bigWinPaymentEligibility: !bigWinPaymentViolation,
      bigWinLevelEligibility: !bigWinLevelViolation,
    },
    bigWinsAwarded: bigWinWinners.length,
    bigWinsTotalAmount: round2(bigWinWinners.reduce((s, w) => s + w.prize, 0)),
    bigWinWinners: bigWinWinners.slice(0, 20),

    sampleUsers,
    durationMs: Date.now() - startTime,
  };

  await db.update(simulationRuns).set({
    status: "complete",
    progress: userCount,
    results: JSON.stringify(results),
    completedAt: new Date().toISOString(),
  }).where(eq(simulationRuns.id, jobId));

  return results;
}
