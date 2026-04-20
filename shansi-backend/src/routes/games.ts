import { Hono } from "hono";
import { z } from "zod";
import { eq, desc, and, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { gameConfig, gameHistory, transactions, promoCodes, promoCodeUses, userVillageProfile, villageConfig } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { playGame, playChickenRush, createTransaction } from "../services/gameEngine.js";
import { BadRequestError } from "../utils/errors.js";

const games = new Hono<AppEnv>();
games.use("*", authMiddleware);

const playSchema = z.object({
  gameType: z.enum(["slot", "plinko", "chicken_rush"]),
  betAmount: z.number().positive().optional().default(10),
});

// POST /games/play
games.post("/play", async (c) => {
  const body = await c.req.json();
  const parsed = playSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const userId = c.get("userId") as string;
  const { gameType, betAmount } = parsed.data;

  try {
    const result = await playGame(userId, gameType, betAmount);

    // Plinko milestone rewards: every N drops → shield; every M drops →
    // attack card. Thresholds are admin-configurable via village_config
    // keys `balls_per_shield` and `balls_per_attack_card` (0 = disabled).
    const rewards: { shield?: any; card?: any } = {};
    if (gameType === "plinko") {
      try {
        const milestone = await grantPlinkoMilestoneRewards(userId);
        console.log(`[plinko milestone] userId=${userId} result=`, JSON.stringify(milestone));
        if (milestone.shield) rewards.shield = milestone.shield;
        if (milestone.card) rewards.card = milestone.card;
      } catch (e: any) {
        console.error("[plinko milestone] ERROR:", e?.message, e?.stack?.split("\n")[1]);
      }
    }

    return c.json({
      success: true,
      result: {
        won: result.won,
        minWin: result.minWin,
        bonusWin: result.bonusWin,
        totalWin: result.totalWin,
        newBalance: result.newBalance,
        coinsRemaining: result.coinsRemaining,
        totalCashWon: result.totalCashWon,
        bonusRound: result.bonusRound,
        bonusMessage: result.bonusMessage,
        freeCoins: result.freeCoins,
        bonusGamesLeft: result.bonusGamesLeft,
        transactionComplete: result.transactionComplete,
        rewards, // { shield?, card? } — present only if a milestone fired
      },
    });
  } catch (err: any) {
    throw new BadRequestError(err.message || "Game play failed");
  }
});

// Increment the user's balls_dropped counter and grant shield/card rewards
// when cumulative count hits admin-configured thresholds. Returns whatever
// was granted so the client can show a notification.
async function grantPlinkoMilestoneRewards(userId: string) {
  const db = getDb();
  // Read the three relevant config keys
  const cfg = await db.select().from(villageConfig);
  const cfgMap = new Map(cfg.map((r: any) => [r.key, r.value]));
  const ballsPerShield = parseInt(cfgMap.get("balls_per_shield") || "0", 10);
  const ballsPerCard = parseInt(cfgMap.get("balls_per_attack_card") || "0", 10);
  const shieldHours = parseInt(cfgMap.get("shield_reward_hours") || "24", 10);

  // Ensure profile exists, then atomically increment and fetch new count
  await (db as any).run(
    sql`INSERT OR IGNORE INTO user_village_profile (id, user_id, balls_dropped) VALUES (${nanoid()}, ${userId}, 0)`
  );
  await (db as any).run(
    sql`UPDATE user_village_profile SET balls_dropped = balls_dropped + 1, updated_at = datetime('now') WHERE user_id = ${userId}`
  );
  const [profile] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, userId)).limit(1);
  if (!profile) {
    console.log(`[milestone] no profile found for ${userId} after insert`);
    return {};
  }
  const count = profile.ballsDropped || 0;
  console.log(`[milestone] userId=${userId} balls=${count} perShield=${ballsPerShield} perCard=${ballsPerCard} charges=${profile.attackCharges} shields=${profile.shieldCount}`);

  const out: any = {};

  if (ballsPerShield > 0 && count > 0 && count % ballsPerShield === 0) {
    console.log(`[shield-charge] userId=${userId} milestone hit at ball ${count}, incrementing shield_count`);
    await (db as any).run(
      sql`UPDATE user_village_profile SET shield_count = MIN(shield_count + 1, 3), updated_at = datetime('now') WHERE user_id = ${userId}`
    );
    const [updatedForShield] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, userId)).limit(1);
    const newShields = updatedForShield?.shieldCount ?? 0;
    console.log(`[shield-charge] userId=${userId} incremented to ${newShields}/3`);
    out.shield = { shieldCount: newShields };
  }

  if (ballsPerCard > 0 && count > 0 && count % ballsPerCard === 0) {
    console.log(`[attack-charge] userId=${userId} milestone hit at ball ${count}, incrementing attack_charges`);
    await (db as any).run(
      sql`UPDATE user_village_profile SET attack_charges = MIN(attack_charges + 1, 3), updated_at = datetime('now') WHERE user_id = ${userId}`
    );
    const [updatedProfile] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, userId)).limit(1);
    const newCharges = updatedProfile?.attackCharges ?? 0;
    console.log(`[attack-charge] userId=${userId} incremented to ${newCharges}/3`);
    out.card = { attackCharges: newCharges };
  }

  return out;
}

// POST /games/chicken-rush
const chickenRushSchema = z.object({
  betAmount: z.number().positive().default(10),
  difficulty: z.enum(["easy", "medium", "hard", "extreme"]).default("easy"),
});

const DIFFICULTY_MAP = {
  easy: { cols: 5, rows: 25, multiplierPerStep: 1.2 },
  medium: { cols: 4, rows: 20, multiplierPerStep: 1.3 },
  hard: { cols: 3, rows: 15, multiplierPerStep: 1.45 },
  extreme: { cols: 2, rows: 10, multiplierPerStep: 1.9 },
};

games.post("/chicken-rush", async (c) => {
  const body = await c.req.json();
  const parsed = chickenRushSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const userId = c.get("userId") as string;
  const { betAmount, difficulty } = parsed.data;
  const diffConfig = DIFFICULTY_MAP[difficulty];

  try {
    const result = await playChickenRush(userId, betAmount, diffConfig);

    return c.json({
      success: true,
      result: {
        maxSafeStep: result.maxSafeStep,
        trapStep: result.trapStep,
        cashoutUnlockStep: result.cashoutUnlockStep,
        totalSteps: result.totalSteps,
        stepValues: result.stepValues,
        trapMap: result.trapMap,
        cols: result.cols,
        minWin: result.minWin,
        totalWin: result.totalWin,
        bonusWin: result.bonusWin,
        won: result.won,
        coinsRemaining: result.coinsRemaining,
        newBalance: result.newBalance,
      },
    });
  } catch (err: any) {
    throw new BadRequestError(err.message || "Game failed");
  }
});

// GET /games/history
games.get("/history", async (c) => {
  const userId = c.get("userId") as string;
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const db = getDb();
  const history = await db.select().from(gameHistory)
    .where(eq(gameHistory.userId, userId))
    .orderBy(desc(gameHistory.createdAt))
    .limit(limit)
    .offset(offset);

  const allHistory = await db.select().from(gameHistory).where(eq(gameHistory.userId, userId));

  return c.json({
    success: true,
    history: history.map((h) => ({
      id: h.id,
      gameType: h.gameType,
      betAmount: h.betAmount,
      winAmount: h.winAmount,
      createdAt: h.createdAt,
    })),
    pagination: { page, limit, total: allHistory.length },
  });
});

// GET /games/config
games.get("/config", async (c) => {
  const db = getDb();
  const configs = await db.select().from(gameConfig);

  return c.json({
    success: true,
    games: configs.map((g) => ({
      gameType: g.gameType,
      isActive: g.isActive,
    })),
  });
});

// GET /games/active-transaction
games.get("/active-transaction", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();

  // Get the most recent active transaction with coins remaining
  const activeTxList = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
    .orderBy(desc(transactions.createdAt));

  // Find the one with coins remaining, or the newest
  const activeTx = activeTxList.find(t => t.coinsRemaining > 0) || activeTxList[0] || null;

  if (!activeTx) {
    return c.json({ success: true, hasActiveTransaction: false, coinsRemaining: 0, totalCashWon: 0, guaranteedMinimum: 0, isBonusRound: false, paymentAmount: 0 });
  }

  return c.json({
    success: true,
    hasActiveTransaction: true,
    coinsRemaining: activeTx.coinsRemaining,
    totalCashWon: activeTx.totalCashWon,
    guaranteedMinimum: activeTx.guaranteedMinimum,
    isBonusRound: activeTx.status === "bonus_round",
    paymentAmount: activeTx.paymentAmount,
  });
});

// POST /games/create-transaction (for testing — in production this comes from QR scan)
const createTxSchema = z.object({
  paymentAmount: z.number().min(0),
  coinsReceived: z.number().positive().int(),
});

games.post("/create-transaction", async (c) => {
  const body = await c.req.json();
  const parsed = createTxSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const userId = c.get("userId") as string;
  const db = getDb();

  // Check no active transaction exists
  const [existing] = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.status, "active")))
    .limit(1);
  if (existing) throw new BadRequestError("Active transaction already exists");

  // Read min_return_percent from config
  const [cfg] = await db.select().from(gameConfig).limit(1);
  const minReturnPercent = cfg?.minReturnPercent || 0.5;

  const txId = await createTransaction(userId, parsed.data.paymentAmount, parsed.data.coinsReceived, minReturnPercent);
  return c.json({ success: true, transactionId: txId });
});

// POST /games/use-promo-code
games.post("/use-promo-code", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const code = body.code?.toString().trim().toUpperCase();
  if (!code) throw new BadRequestError("Code is required");

  const db = getDb();

  // Find promo code (case insensitive)
  const allCodes = await db.select().from(promoCodes).where(eq(promoCodes.isActive, true));
  const promo = allCodes.find(p => p.code.toUpperCase() === code);

  if (!promo) throw new BadRequestError("\u10DE\u10E0\u10DD\u10DB\u10DD \u10D9\u10DD\u10D3\u10D8 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0");
  if (!promo.isActive) throw new BadRequestError("\u10DE\u10E0\u10DD\u10DB\u10DD \u10D9\u10DD\u10D3\u10D8 \u10D0\u10E0 \u10D0\u10E0\u10D8\u10E1 \u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D8");

  const now = new Date().toISOString();
  if (now < promo.startsAt || now > promo.expiresAt) {
    throw new BadRequestError("\u10DE\u10E0\u10DD\u10DB\u10DD \u10D9\u10DD\u10D3\u10D8 \u10D5\u10D0\u10D3\u10D0\u10D2\u10D0\u10E1\u10E3\u10DA\u10D8\u10D0");
  }
  if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
    throw new BadRequestError("\u10DE\u10E0\u10DD\u10DB\u10DD \u10D9\u10DD\u10D3\u10D8\u10E1 \u10DA\u10D8\u10DB\u10D8\u10E2\u10D8 \u10D0\u10DB\u10DD\u10D8\u10EC\u10E3\u10E0\u10D0");
  }

  // Check per-user limit
  const userUses = await db.select().from(promoCodeUses)
    .where(and(eq(promoCodeUses.promoCodeId, promo.id), eq(promoCodeUses.userId, userId)));
  if (userUses.length >= promo.maxUsesPerUser) {
    throw new BadRequestError("\u10E3\u10D9\u10D5\u10D4 \u10D2\u10D0\u10DB\u10DD\u10E7\u10D4\u10DC\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D2\u10D0\u10E5\u10D5\u10E1 \u10D4\u10E1 \u10DE\u10E0\u10DD\u10DB\u10DD \u10D9\u10DD\u10D3\u10D8");
  }

  const coinsToGive = promo.coinRewardForUser;

  // Add coins to user's active transaction or create new
  const [activeTx] = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
    .orderBy(desc(transactions.createdAt)).limit(1);

  if (activeTx) {
    await db.update(transactions).set({
      coinsRemaining: activeTx.coinsRemaining + coinsToGive,
      coinsReceived: activeTx.coinsReceived + coinsToGive,
    }).where(eq(transactions.id, activeTx.id));
  } else {
    await db.insert(transactions).values({
      id: nanoid(), userId, paymentAmount: 0,
      coinsReceived: coinsToGive, coinsRemaining: coinsToGive,
      totalCashWon: 0, guaranteedMinimum: 0, status: "active",
    });
  }

  // Record usage
  await db.insert(promoCodeUses).values({
    id: nanoid(), promoCodeId: promo.id, userId, coinsRewarded: coinsToGive,
  });

  // Increment usage count
  await db.update(promoCodes).set({
    currentUses: promo.currentUses + 1,
  }).where(eq(promoCodes.id, promo.id));

  return c.json({
    success: true,
    coinsEarned: coinsToGive,
    message: `\u10DB\u10D8\u10D8\u10E6\u10D4 ${coinsToGive} \u10E5\u10DD\u10D8\u10DC\u10D8! \uD83C\uDF89`,
  });
});

export default games;
