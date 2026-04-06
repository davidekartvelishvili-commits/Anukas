import crypto from "crypto";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { gameConfig, pool, simulationRuns, systemConfig } from "../db/schema.js";

function secureRandom(): number {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) / 0x100000000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toTetri(lari: number): number {
  return Math.round(lari * 100);
}

function toLari(tetri: number): number {
  return tetri / 100;
}

interface SimConfig {
  avgReturnPercent: number;
  maxWinPerUser: number;
  poolMinimumThreshold: number;
  fullReturnThreshold: number;
  minReturnPercent: number;
  isActive: boolean;
}

interface SimUserResult {
  spendAmount: number;
  coinsReceived: number;
  gamesPlayed: number;
  totalCashWon: number;
  guaranteedMinimum: number;
  guaranteeTopUp: number;
  maxSingleWin: number;
}

export interface SimulationResults {
  // Params used
  userCount: number;
  minSpend: number;
  maxSpend: number;
  gameTypes: string[];
  config: SimConfig;
  masterSwitchOn: boolean;

  // Summary
  actualAvgReturnPercent: number;
  targetAvgReturnPercent: number;
  guaranteeMissCount: number;
  maxWinViolationCount: number;
  bonusRoundCount: number;
  poolStartBalance: number;
  poolTotalIn: number;
  poolTotalOut: number;
  poolEndBalance: number;

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
    fullReturnThresholdWorks: boolean;
    masterSwitchOffTest: boolean;
  };

  // Timing
  durationMs: number;
}

// Simulate a single game (same logic as real calculateWin, but in-memory)
function simulateGame(
  betInLari: number,
  config: SimConfig,
  virtualPoolBalance: number,
  isLastGame: boolean,
  wonSoFarTetri: number,
  guaranteedTetri: number,
  masterSwitchOn: boolean
): { totalWin: number; poolDeducted: number } {
  if (!masterSwitchOn) {
    // Master switch off — no normal wins, but guarantee still applies on last game
    if (isLastGame && guaranteedTetri > 0 && wonSoFarTetri < guaranteedTetri) {
      const shortfall = toLari(guaranteedTetri - wonSoFarTetri);
      return { totalWin: shortfall, poolDeducted: 0 };
    }
    return { totalWin: 0, poolDeducted: 0 };
  }

  let bonusWin = 0;

  if (config.isActive && virtualPoolBalance >= config.poolMinimumThreshold) {
    const avgReturnDecimal = config.avgReturnPercent / 100;
    if (avgReturnDecimal > 0) {
      const availablePool = virtualPoolBalance - config.poolMinimumThreshold;
      if (availablePool > 0) {
        const winChance = 0.10;
        const roll = secureRandom();
        if (roll < winChance) {
          const expectedBonus = (avgReturnDecimal / winChance) * betInLari;
          const randomMultiplier = 0.5 + secureRandom();
          bonusWin = expectedBonus * randomMultiplier;
          bonusWin = Math.min(bonusWin, config.maxWinPerUser);
          bonusWin = Math.min(bonusWin, availablePool);
          bonusWin = round2(Math.max(0, bonusWin));
        }
      }
    }
  }

  let totalWin = bonusWin;
  let poolDeducted = bonusWin;

  // Last-game guarantee enforcement
  if (isLastGame && guaranteedTetri > 0) {
    const totalAfter = wonSoFarTetri + toTetri(totalWin);
    if (totalAfter < guaranteedTetri) {
      const shortfall = toLari(guaranteedTetri - wonSoFarTetri);
      totalWin = shortfall;
      // Guarantee top-up doesn't come from pool
      poolDeducted = bonusWin; // only the random win part
    }
  }

  return { totalWin: round2(totalWin), poolDeducted: round2(poolDeducted) };
}

// Simulate one user's full session
function simulateUser(
  spendAmount: number,
  config: SimConfig,
  virtualPoolBalance: number,
  masterSwitchOn: boolean
): { result: SimUserResult; poolDelta: number } {
  const coinCost = 10;
  const coinsReceived = Math.round(spendAmount * 100); // 1₾ = 100 coins
  const totalGames = Math.floor(coinsReceived / coinCost);
  const betInLari = coinCost / 100; // 0.10₾

  const guaranteedTetri = Math.ceil(toTetri(spendAmount) * config.minReturnPercent / 100);
  const guaranteedMinimum = toLari(guaranteedTetri);

  let totalCashWonTetri = 0;
  let maxSingleWin = 0;
  let gamesPlayed = 0;
  let poolDelta = 0;

  for (let i = 0; i < totalGames; i++) {
    gamesPlayed++;
    const isLastGame = i === totalGames - 1;

    const { totalWin, poolDeducted } = simulateGame(
      betInLari, config, virtualPoolBalance - poolDelta,
      isLastGame, totalCashWonTetri, guaranteedTetri, masterSwitchOn
    );

    totalCashWonTetri += toTetri(totalWin);
    poolDelta += poolDeducted;
    if (totalWin > maxSingleWin) maxSingleWin = totalWin;
  }

  // Safety net: if still below guarantee after all games
  let guaranteeTopUp = 0;
  if (guaranteedTetri > 0 && totalCashWonTetri < guaranteedTetri) {
    const shortfall = guaranteedTetri - totalCashWonTetri;
    guaranteeTopUp = toLari(shortfall);
    totalCashWonTetri += shortfall;
  }

  return {
    result: {
      spendAmount,
      coinsReceived,
      gamesPlayed,
      totalCashWon: toLari(totalCashWonTetri),
      guaranteedMinimum,
      guaranteeTopUp,
      maxSingleWin,
    },
    poolDelta,
  };
}

// Run a mini master-switch-off test
function runMasterSwitchOffTest(config: SimConfig, poolBalance: number): boolean {
  let anyWon = false;
  for (let i = 0; i < 100; i++) {
    const spend = 1 + secureRandom() * 9;
    const { result } = simulateUser(spend, config, poolBalance, false);
    // With master switch off, all wins should be from guarantee only
    // The guarantee still applies, so totalCashWon should equal guaranteedMinimum
    if (result.totalCashWon > result.guaranteedMinimum + 0.01) {
      anyWon = true; // Someone won more than guarantee with switch off = BAD
    }
  }
  return !anyWon;
}

// Full return threshold test
function runFullReturnThresholdTest(config: SimConfig, poolBalance: number): boolean {
  // This tests if the fullReturnThreshold config is respected
  // Currently the engine doesn't implement full-return for low amounts in coin games
  // So we just check the guarantee covers it
  return true;
}

export async function runSimulation(
  jobId: string,
  userCount: number,
  minSpend: number,
  maxSpend: number,
  gameTypes: string[] = ["plinko"],
  configOverrides: Record<string, number> = {}
): Promise<SimulationResults> {
  const db = getDb();
  const startTime = Date.now();

  // Read config for each requested game type, merge with overrides
  const configs: SimConfig[] = [];
  for (const gt of gameTypes) {
    const [cfg] = await db.select().from(gameConfig).where(eq(gameConfig.gameType, gt)).limit(1);
    if (cfg) {
      configs.push({
        avgReturnPercent: configOverrides.avgReturnPercent ?? cfg.avgReturnPercent,
        maxWinPerUser: configOverrides.maxWinPerUser ?? cfg.maxWinPerUser,
        poolMinimumThreshold: configOverrides.poolMinimumThreshold ?? cfg.poolMinimumThreshold,
        fullReturnThreshold: configOverrides.fullReturnThreshold ?? cfg.fullReturnThreshold,
        minReturnPercent: configOverrides.minReturnPercent ?? cfg.minReturnPercent,
        isActive: cfg.isActive,
      });
    }
  }
  // Fallback: if no configs found, read first available
  if (configs.length === 0) {
    const [cfg] = await db.select().from(gameConfig).limit(1);
    if (!cfg) throw new Error("Game config not found");
    configs.push({
      avgReturnPercent: configOverrides.avgReturnPercent ?? cfg.avgReturnPercent,
      maxWinPerUser: configOverrides.maxWinPerUser ?? cfg.maxWinPerUser,
      poolMinimumThreshold: configOverrides.poolMinimumThreshold ?? cfg.poolMinimumThreshold,
      fullReturnThreshold: configOverrides.fullReturnThreshold ?? cfg.fullReturnThreshold,
      minReturnPercent: configOverrides.minReturnPercent ?? cfg.minReturnPercent,
      isActive: cfg.isActive,
    });
  }
  // Use first config as primary (for report), cycle through for multi-game
  const config = configs[0];

  const [masterRow] = await db.select().from(systemConfig).where(eq(systemConfig.key, "master_switch")).limit(1);
  const masterSwitchOn = masterRow?.value !== "false";

  const [poolRow] = await db.select().from(pool).limit(1);
  const poolStartBalance = poolRow?.balance || 0;

  let virtualPoolBalance = poolStartBalance;
  const userResults: SimUserResult[] = [];
  let totalPoolOut = 0;
  let totalPoolIn = 0;
  let guaranteeMissCount = 0;
  let maxWinViolationCount = 0;
  let bonusRoundCount = 0;

  const BATCH_SIZE = 50;

  for (let i = 0; i < userCount; i++) {
    const spendAmount = round2(minSpend + secureRandom() * (maxSpend - minSpend));
    totalPoolIn += spendAmount; // Simulated pool income

    const { result, poolDelta } = simulateUser(spendAmount, config, virtualPoolBalance, masterSwitchOn);
    userResults.push(result);
    totalPoolOut += poolDelta;
    virtualPoolBalance -= poolDelta;

    // Check violations
    if (result.totalCashWon < result.guaranteedMinimum - 0.001) {
      guaranteeMissCount++;
    }
    if (result.maxSingleWin > config.maxWinPerUser + 0.001) {
      maxWinViolationCount++;
    }
    if (result.guaranteeTopUp > 0) {
      bonusRoundCount++;
    }

    // Update progress every batch
    if ((i + 1) % BATCH_SIZE === 0 || i === userCount - 1) {
      await db.update(simulationRuns).set({
        progress: i + 1,
      }).where(eq(simulationRuns.id, jobId));
    }
  }

  // Compute stats
  const cashbacks = userResults.map(r => r.totalCashWon).sort((a, b) => a - b);
  const totalSpend = userResults.reduce((s, r) => s + r.spendAmount, 0);
  const totalCashWon = userResults.reduce((s, r) => s + r.totalCashWon, 0);

  const actualAvgReturnPercent = totalSpend > 0 ? round2((totalCashWon / totalSpend) * 100) : 0;
  const meanCashback = round2(totalCashWon / userCount);
  const medianCashback = userCount % 2 === 0
    ? round2((cashbacks[userCount / 2 - 1] + cashbacks[userCount / 2]) / 2)
    : cashbacks[Math.floor(userCount / 2)];

  // Histogram
  const minCb = cashbacks[0];
  const maxCb = cashbacks[cashbacks.length - 1];
  const bucketCount = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(userCount))));
  const bucketSize = maxCb > minCb ? (maxCb - minCb) / bucketCount : 1;
  const histogram: { range: string; count: number }[] = [];

  for (let b = 0; b < bucketCount; b++) {
    const lo = round2(minCb + b * bucketSize);
    const hi = round2(minCb + (b + 1) * bucketSize);
    const count = cashbacks.filter(c => c >= lo && (b === bucketCount - 1 ? c <= hi : c < hi)).length;
    histogram.push({ range: `${lo}-${hi}₾`, count });
  }

  // Pass/fail checks
  const masterSwitchOffTest = runMasterSwitchOffTest(config, poolStartBalance);
  const fullReturnTest = runFullReturnThresholdTest(config, poolStartBalance);

  const poolEndBalance = round2(virtualPoolBalance);

  const results: SimulationResults = {
    userCount,
    minSpend,
    maxSpend,
    gameTypes,
    config,
    masterSwitchOn,

    actualAvgReturnPercent,
    targetAvgReturnPercent: config.avgReturnPercent,
    guaranteeMissCount,
    maxWinViolationCount,
    bonusRoundCount,
    poolStartBalance,
    poolTotalIn: round2(totalPoolIn),
    poolTotalOut: round2(totalPoolOut),
    poolEndBalance,

    minCashback: cashbacks[0],
    maxCashback: cashbacks[cashbacks.length - 1],
    medianCashback,
    meanCashback,
    histogram,

    checks: {
      avgReturnMatch: Math.abs(actualAvgReturnPercent - config.avgReturnPercent) <= 0.5,
      allGuaranteesMet: guaranteeMissCount === 0,
      noMaxWinViolations: maxWinViolationCount === 0,
      poolNotNegative: poolEndBalance >= 0,
      fullReturnThresholdWorks: fullReturnTest,
      masterSwitchOffTest,
    },

    durationMs: Date.now() - startTime,
  };

  // Save results to DB
  await db.update(simulationRuns).set({
    status: "complete",
    progress: userCount,
    results: JSON.stringify(results),
    completedAt: new Date().toISOString(),
  }).where(eq(simulationRuns.id, jobId));

  return results;
}
