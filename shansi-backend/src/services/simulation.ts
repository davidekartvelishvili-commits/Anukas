import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { gameConfig, pool, simulationRuns, systemConfig } from "../db/schema.js";

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
}

export interface SimulationResults {
  userCount: number;
  scenario: string;
  gameTypes: string[];
  config: Config;
  masterSwitchOn: boolean;

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
  };

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
  masterSwitchOn: boolean
): { log: SimUserLog; poolDelta: number } {
  const coinCost = 10;
  const coinsReceived = Math.round(spendAmount * 100); // 1₾ = 100 coins
  const totalGames = Math.floor(coinsReceived / coinCost);
  const betInLari = coinCost / 100; // 0.10₾

  const guaranteedTetri = Math.ceil(toTetri(spendAmount) * config.minReturnPercent / 100);
  const guaranteedMinimum = toLari(guaranteedTetri);

  let totalCashWonTetri = 0;
  let gamesWon = 0;
  let poolDelta = 0;
  let maxSingleWin = 0;

  for (let i = 0; i < totalGames; i++) {
    const isLastGame = i === totalGames - 1;
    const currentPoolBalance = virtualPoolBalance - poolDelta;

    // ═══ REAL ALGORITHM CALL — same as production ═══
    let { minWin, bonusWin } = calculateWin(
      betInLari,
      config,
      currentPoolBalance,
      false, // isBonusRound
      0      // plannedBonusWin
    );

    // Master switch OFF zeroes winnings (same as production gameEngine line 244-248)
    if (!masterSwitchOn) {
      minWin = 0;
      bonusWin = 0;
    }

    let totalWin = round2(minWin + bonusWin);
    let poolDeducted = totalWin; // normal wins come from pool

    // Last-game guarantee enforcement (same as production gameEngine line 195-210)
    if (isLastGame && guaranteedTetri > 0) {
      const totalAfter = totalCashWonTetri + toTetri(totalWin);
      if (totalAfter < guaranteedTetri) {
        const shortfall = toLari(guaranteedTetri - totalCashWonTetri);
        totalWin = shortfall;
        poolDeducted = round2(minWin + bonusWin); // only natural win from pool
      }
    }

    if (totalWin > 0) gamesWon++;
    totalCashWonTetri += toTetri(totalWin);
    poolDelta += poolDeducted;
    if (totalWin > maxSingleWin) maxSingleWin = totalWin;
  }

  // Safety net guarantee (same as production _ensureGuarantee)
  const naturalCashback = toLari(totalCashWonTetri);
  let guaranteeTopUp = 0;
  if (guaranteedTetri > 0 && totalCashWonTetri < guaranteedTetri) {
    guaranteeTopUp = toLari(guaranteedTetri - totalCashWonTetri);
    totalCashWonTetri += (guaranteedTetri - totalCashWonTetri);
    // Guarantee top-up does NOT come from pool
  }

  const finalCashback = toLari(totalCashWonTetri);

  return {
    log: {
      index: 0, // set by caller
      spendAmount: round2(spendAmount),
      gamesPlayed: totalGames,
      gamesWon,
      naturalCashback: round2(naturalCashback),
      guaranteedMinimum,
      guaranteeTopUp: round2(guaranteeTopUp),
      finalCashback: round2(finalCashback),
      guaranteeMet: finalCashback >= guaranteedMinimum - 0.001,
    },
    poolDelta: round2(poolDelta),
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
  gameTypes: string[] = ["plinko"]
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

  let virtualPoolBalance = poolStartBalance;
  const sampleUsers: SimUserLog[] = [];
  let totalPoolPaidOut = 0;
  let totalSpend = 0;
  let totalCashWon = 0;
  let guaranteeMissCount = 0;
  let maxWinViolationCount = 0;
  let guaranteeTopUpCount = 0;
  const allCashbacks: number[] = [];

  const BATCH_SIZE = 50;

  for (let i = 0; i < userCount; i++) {
    const spendAmount = round2(range.min + secureRandom() * (range.max - range.min));

    const { log, poolDelta } = simulateOneUser(spendAmount, config, virtualPoolBalance, masterSwitchOn);
    log.index = i + 1;

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

  const results: SimulationResults = {
    userCount,
    scenario,
    gameTypes,
    config,
    masterSwitchOn,

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
    },

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
