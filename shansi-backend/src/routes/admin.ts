import { Hono } from "hono";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, desc, like, or, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AdminEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { admins, gameConfig, pool, gameHistory, adminLogs, users, otpRateLimits, transactions, referrals, referralConfig, promoCodes, promoCodeUses, merchants, paymentTransactions, withdrawals, systemConfig, pendingPayments, simulationRuns, poolFundings, villageLevels, villageCards, userVillageProfile, userCards, villageAttacks, villageConfig, bigWinConfig, bigWinPrizes, bigWinHistory, villages, villageBuildings, userVillageProgress, offers, tickets } from "../db/schema.js";
import { adminMiddleware } from "../middleware/admin.js";
import { getEnv } from "../utils/env.js";
import { BadRequestError, UnauthorizedError, RateLimitError } from "../utils/errors.js";
import { runSimulation } from "../services/simulation.js";

const admin = new Hono<AdminEnv>();

const ALL_PERMISSIONS = ["dashboard", "algorithm", "users", "merchants", "transactions", "games", "village", "notifications", "analytics", "system"];

// ── Schemas ──
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const gameConfigUpdateSchema = z.object({
  avgReturnPercent: z.number().min(0).max(100).optional(),
  maxWinPerUser: z.number().min(0).optional(),
  poolMinimumThreshold: z.number().min(0).optional(),
  fullReturnThreshold: z.number().min(0).optional(),
  minReturnPercent: z.number().min(0.1).max(5).optional(),
  isActive: z.boolean().optional(),
});

// Helper: log admin action
async function logAction(adminId: string, action: string, details?: string) {
  const db = getDb();
  await db.insert(adminLogs).values({ id: nanoid(), adminId, action, details: details || null });
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const adjustBalanceSchema = z.object({
  type: z.enum(["coin", "cash"]),
  action: z.enum(["add", "subtract"]),
  amount: z.number().positive(),
  reason: z.string().min(1),
});

// ══════════════════════════════════════
// AUTH (no middleware)
// ══════════════════════════════════════

// POST /admin/auth/setup — first admin only
admin.post("/auth/setup", async (c) => {
  try {
  const body = await c.req.json();
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const existing = await db.select().from(admins).limit(1);
  if (existing.length > 0) throw new BadRequestError("Admin already exists. Setup disabled.");

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const id = nanoid();
  await db.insert(admins).values({
    id, email: parsed.data.email, passwordHash: hash, name: parsed.data.name, role: "super_admin",
  });

  // Seed pool if empty
  const poolRows = await db.select().from(pool).limit(1);
  if (poolRows.length === 0) {
    await db.insert(pool).values({ id: nanoid(), balance: 0, totalFunded: 0, totalWon: 0 });
  }

  // Seed game configs if empty
  const configRows = await db.select().from(gameConfig).limit(1);
  if (configRows.length === 0) {
    for (const gt of ["slot", "plinko", "chicken_rush"]) {
      await db.insert(gameConfig).values({ id: nanoid(), gameType: gt });
    }
  }

  // Seed referral config if empty
  const refConfigRows = await db.select().from(referralConfig).limit(1);
  if (refConfigRows.length === 0) {
    await db.insert(referralConfig).values({ id: "default", referrerRewardCoins: 200, referredRewardCoins: 100 });
  }

  return c.json({ success: true, admin: { id, email: parsed.data.email, name: parsed.data.name } });
  } catch (err: any) {
    console.error("Setup error:", err);
    return c.json({ success: false, message: err.message || "Setup failed", detail: String(err) }, 500);
  }
});

// POST /admin/auth/login
admin.post("/auth/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const { email, password } = parsed.data;
  const db = getDb();

  // Rate limit
  const rlKey = `admin:${email}`;
  const [rl] = await db.select().from(otpRateLimits).where(eq(otpRateLimits.phone, rlKey)).limit(1);
  const now = new Date();
  const windowMs = 15 * 60 * 1000;

  if (rl) {
    const ws = new Date(rl.windowStart);
    if (now.getTime() - ws.getTime() < windowMs && rl.attempts >= 5) {
      throw new RateLimitError("Too many login attempts. Try again in 15 minutes.");
    }
  }

  const [a] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  if (!a || !a.isActive) {
    // Increment rate limit
    if (rl) {
      const ws = new Date(rl.windowStart);
      if (now.getTime() - ws.getTime() < windowMs) {
        await db.update(otpRateLimits).set({ attempts: rl.attempts + 1 }).where(eq(otpRateLimits.id, rl.id));
      } else {
        await db.update(otpRateLimits).set({ attempts: 1, windowStart: now.toISOString() }).where(eq(otpRateLimits.id, rl.id));
      }
    } else {
      await db.insert(otpRateLimits).values({ id: nanoid(), phone: rlKey, attempts: 1, windowStart: now.toISOString() });
    }
    throw new UnauthorizedError("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, a.passwordHash);
  if (!valid) {
    if (rl) {
      const ws = new Date(rl.windowStart);
      if (now.getTime() - ws.getTime() < windowMs) {
        await db.update(otpRateLimits).set({ attempts: rl.attempts + 1 }).where(eq(otpRateLimits.id, rl.id));
      } else {
        await db.update(otpRateLimits).set({ attempts: 1, windowStart: now.toISOString() }).where(eq(otpRateLimits.id, rl.id));
      }
    } else {
      await db.insert(otpRateLimits).values({ id: nanoid(), phone: rlKey, attempts: 1, windowStart: now.toISOString() });
    }
    throw new UnauthorizedError("Invalid credentials");
  }

  // Reset rate limit
  if (rl) await db.update(otpRateLimits).set({ attempts: 0 }).where(eq(otpRateLimits.id, rl.id));

  const token = jwt.sign({ adminId: a.id, role: a.role }, getEnv().JWT_SECRET, { expiresIn: "8h" });
  await logAction(a.id, "login");

  return c.json({
    success: true,
    token,
    admin: { id: a.id, email: a.email, name: a.name, role: a.role, permissions: a.permissions ? JSON.parse(a.permissions) : ALL_PERMISSIONS },
  });
});

// ══════════════════════════════════════
// PROTECTED ROUTES
// ══════════════════════════════════════

// GET /admin/dashboard
admin.get("/dashboard", adminMiddleware, async (c) => {
  const db = getDb();
  const allUsers = await db.select().from(users);
  const [poolData] = await db.select().from(pool).limit(1);
  const allGames = await db.select().from(gameHistory);

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const todayGames = allGames.filter((g) => g.createdAt >= today);
  const weekGames = allGames.filter((g) => g.createdAt >= weekAgo);
  const todayWinnings = todayGames.reduce((s, g) => s + g.winAmount, 0);

  return c.json({
    success: true,
    dashboard: {
      totalUsers: allUsers.length,
      gamesToday: todayGames.length,
      gamesThisWeek: weekGames.length,
      totalCashbackPaid: todayWinnings,
      poolBalance: poolData?.balance || 0,
      poolTotalFunded: poolData?.totalFunded || 0,
      poolTotalWon: poolData?.totalWon || 0,
    },
  });
});

// GET /admin/logs — admin action history (real, from adminLogs table)
admin.get("/logs", adminMiddleware, async (c) => {
  const db = getDb();
  const limit = parseInt(c.req.query("limit") || "100");
  const logs = await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(limit);
  const enriched = await Promise.all(logs.map(async (l) => {
    const [adm] = await db.select({ name: admins.name, email: admins.email }).from(admins).where(eq(admins.id, l.adminId)).limit(1);
    return { ...l, adminName: adm?.name || adm?.email || l.adminId };
  }));
  return c.json({ success: true, logs: enriched });
});

// GET /admin/game-config — includes real-time stats per game type
admin.get("/game-config", adminMiddleware, async (c) => {
  const db = getDb();
  const configs = await db.select().from(gameConfig);

  // Real stats from gameHistory
  const today = new Date().toISOString().slice(0, 10);
  const enriched = await Promise.all(configs.map(async (cfg) => {
    const [todayRow] = await db.select({ c: sql<number>`count(*)` })
      .from(gameHistory)
      .where(and(eq(gameHistory.gameType, cfg.gameType), sql`${gameHistory.createdAt} >= ${today}`));
    const [totalRow] = await db.select({
      c: sql<number>`count(*)`,
      won: sql<number>`coalesce(sum(${gameHistory.winAmount}), 0)`,
    }).from(gameHistory).where(eq(gameHistory.gameType, cfg.gameType));
    const playsTotal = Number(totalRow?.c) || 0;
    const totalWon = Number(totalRow?.won) || 0;
    return {
      ...cfg,
      stats: {
        playsToday: Number(todayRow?.c) || 0,
        playsTotal,
        totalWon: Math.round(totalWon * 100) / 100,
        avgWin: playsTotal > 0 ? Math.round((totalWon / playsTotal) * 10000) / 10000 : 0,
      },
    };
  }));

  return c.json({ success: true, configs: enriched });
});

// PATCH /admin/game-config/:gameType
admin.patch("/game-config/:gameType", adminMiddleware, async (c) => {
  const gameType = c.req.param("gameType") as string;
  const body = await c.req.json();
  const parsed = gameConfigUpdateSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const [existing] = await db.select().from(gameConfig).where(eq(gameConfig.gameType, gameType)).limit(1);
  if (!existing) throw new BadRequestError("Game type not found");

  const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
  if (parsed.data.avgReturnPercent !== undefined) updates.avgReturnPercent = parsed.data.avgReturnPercent;
  if (parsed.data.maxWinPerUser !== undefined) updates.maxWinPerUser = parsed.data.maxWinPerUser;
  if (parsed.data.poolMinimumThreshold !== undefined) updates.poolMinimumThreshold = parsed.data.poolMinimumThreshold;
  if (parsed.data.fullReturnThreshold !== undefined) updates.fullReturnThreshold = parsed.data.fullReturnThreshold;
  if (parsed.data.minReturnPercent !== undefined) updates.minReturnPercent = parsed.data.minReturnPercent;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

  await db.update(gameConfig).set(updates).where(eq(gameConfig.id, existing.id));

  const adminId = c.get("adminId") as string;
  await logAction(adminId, `update_game_config:${gameType}`, JSON.stringify(parsed.data));

  const [updated] = await db.select().from(gameConfig).where(eq(gameConfig.id, existing.id)).limit(1);
  return c.json({ success: true, config: updated });
});

// GET /admin/pool
admin.get("/pool", adminMiddleware, async (c) => {
  const db = getDb();
  const [p] = await db.select().from(pool).limit(1);
  return c.json({ success: true, pool: p || { balance: 0, totalFunded: 0, totalWon: 0 } });
});

// POST /admin/pool/fund
admin.post("/pool/fund", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const amount = z.number().positive().parse(body.amount);

  const db = getDb();
  const [p] = await db.select().from(pool).limit(1);
  if (!p) throw new BadRequestError("Pool not initialized");

  await db.update(pool).set({
    balance: p.balance + amount,
    totalFunded: p.totalFunded + amount,
    updatedAt: new Date().toISOString(),
  }).where(eq(pool.id, p.id));

  const adminId = c.get("adminId") as string;
  await logAction(adminId, "pool_fund", `Added ${amount} to pool`);

  return c.json({ success: true, newBalance: p.balance + amount });
});

// GET /admin/master-switch
admin.get("/master-switch", adminMiddleware, async (c) => {
  const db = getDb();
  const [row] = await db.select().from(systemConfig).where(eq(systemConfig.key, "master_switch")).limit(1);
  return c.json({ success: true, enabled: row?.value !== "false" });
});

// PATCH /admin/master-switch
admin.patch("/master-switch", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const enabled = body.enabled === true;
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [existing] = await db.select().from(systemConfig).where(eq(systemConfig.key, "master_switch")).limit(1);
  if (existing) {
    await db.update(systemConfig).set({ value: String(enabled), updatedAt: new Date().toISOString() }).where(eq(systemConfig.key, "master_switch"));
  } else {
    await db.insert(systemConfig).values({ key: "master_switch", value: String(enabled) });
  }

  await logAction(adminId, "master_switch_toggle", JSON.stringify({ enabled }));
  return c.json({ success: true, enabled });
});

// GET /admin/mystery-box-enabled
admin.get("/mystery-box-enabled", adminMiddleware, async (c) => {
  const db = getDb();
  const [row] = await db.select().from(systemConfig).where(eq(systemConfig.key, "mystery_box_enabled")).limit(1);
  // Default: enabled
  return c.json({ success: true, enabled: row?.value !== "false" });
});

// PATCH /admin/mystery-box-enabled
admin.patch("/mystery-box-enabled", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const enabled = body.enabled === true;
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [existing] = await db.select().from(systemConfig).where(eq(systemConfig.key, "mystery_box_enabled")).limit(1);
  if (existing) {
    await db.update(systemConfig).set({ value: String(enabled), updatedAt: new Date().toISOString() }).where(eq(systemConfig.key, "mystery_box_enabled"));
  } else {
    await db.insert(systemConfig).values({ key: "mystery_box_enabled", value: String(enabled) });
  }

  await logAction(adminId, "mystery_box_toggle", JSON.stringify({ enabled }));
  return c.json({ success: true, enabled });
});

// GET /admin/users
admin.get("/users", adminMiddleware, async (c) => {
  const db = getDb();
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;
  const search = c.req.query("search");
  const status = c.req.query("status");

  const conditions: ReturnType<typeof eq>[] = [];
  if (search) {
    const searchCondition = or(
      like(users.phone, `%${search}%`),
      like(users.name, `%${search}%`)
    );
    if (searchCondition) conditions.push(searchCondition as any);
  }
  if (status === "active") conditions.push(eq(users.isActive, true) as any);
  if (status === "blocked") conditions.push(eq(users.isActive, false) as any);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const userList = await db.select().from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
  const total = Number(totalResult?.count) || 0;

  const enrichedUsers = await Promise.all(
    userList.map(async (u) => {
      const [stats] = await db.select({
        totalGames: sql<number>`count(*)`,
        totalCashWon: sql<number>`coalesce(sum(${gameHistory.winAmount}), 0)`,
        totalCoinsSpent: sql<number>`coalesce(sum(${gameHistory.betAmount}), 0)`,
        lastActive: sql<string>`max(${gameHistory.createdAt})`,
      }).from(gameHistory).where(eq(gameHistory.userId, u.id));

      const userActiveTxs = await db.select().from(transactions)
        .where(and(eq(transactions.userId, u.id), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))));
      const userCoinBalance = userActiveTxs.reduce((sum, t) => sum + (t.coinsRemaining || 0), 0);

      return {
        id: u.id,
        phone: u.phone,
        name: u.name,
        coin_balance: userCoinBalance,
        cash_balance: u.balance,
        is_active: u.isActive,
        created_at: u.createdAt,
        total_games_played: Number(stats?.totalGames) || 0,
        total_cash_won: Number(stats?.totalCashWon) || 0,
        total_coins_spent: Number(stats?.totalCoinsSpent) || 0,
        last_active: stats?.lastActive || null,
      };
    })
  );

  return c.json({
    success: true,
    users: enrichedUsers,
    pagination: { page, limit, total },
  });
});

// GET /admin/users/:id
admin.get("/users/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return c.json({ success: false, message: "User not found" }, 404);

  const [stats] = await db.select({
    totalGames: sql<number>`count(*)`,
    totalCashWon: sql<number>`coalesce(sum(${gameHistory.winAmount}), 0)`,
    totalCoinsSpent: sql<number>`coalesce(sum(${gameHistory.betAmount}), 0)`,
    lastActive: sql<string>`max(${gameHistory.createdAt})`,
  }).from(gameHistory).where(eq(gameHistory.userId, id));

  const history = await db.select().from(gameHistory)
    .where(eq(gameHistory.userId, id))
    .orderBy(desc(gameHistory.createdAt)).limit(50);

  const allActiveTx = await db.select().from(transactions)
    .where(and(eq(transactions.userId, id), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
    .orderBy(desc(transactions.createdAt));
  const detailCoinBalance = allActiveTx.reduce((sum, t) => sum + (t.coinsRemaining || 0), 0);
  const activeTx = allActiveTx[0] || null;

  // Get referral info
  const userReferrals = await db.select().from(referrals).where(eq(referrals.referrerId, id)).orderBy(desc(referrals.createdAt));
  const enrichedReferrals = await Promise.all(
    userReferrals.map(async (r) => {
      const [referred] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, r.referredId)).limit(1);
      return { ...r, referredPhone: referred?.phone, referredName: referred?.name };
    })
  );

  // Who referred this user
  let referredByUser = null;
  if (user.referredBy) {
    const [rb] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, user.referredBy)).limit(1);
    if (rb) referredByUser = rb;
  }

  return c.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      coin_balance: detailCoinBalance,
      cash_balance: user.balance,
      is_active: user.isActive,
      created_at: user.createdAt,
      total_games_played: Number(stats?.totalGames) || 0,
      total_cash_won: Number(stats?.totalCashWon) || 0,
      total_coins_spent: Number(stats?.totalCoinsSpent) || 0,
      last_active: stats?.lastActive || null,
      referral_code: user.referralCode,
      referred_by: user.referredBy,
      total_referrals: user.totalReferrals || 0,
    },
    gameHistory: history,
    activeTransaction: activeTx ? {
      coins_remaining: activeTx.coinsRemaining,
      total_cash_won: activeTx.totalCashWon,
      guaranteed_minimum: activeTx.guaranteedMinimum,
    } : null,
    referredByUser,
    userReferrals: enrichedReferrals,
  });
});

// POST /admin/users/:id/adjust-balance
admin.post("/users/:id/adjust-balance", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();
  const parsed = adjustBalanceSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const { type, action, amount, reason } = parsed.data;
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return c.json({ success: false, message: "User not found" }, 404);

  if (type === "cash") {
    const balanceBefore = user.balance;
    const newBalance = action === "add" ? round2(balanceBefore + amount) : round2(balanceBefore - amount);
    if (newBalance < 0) throw new BadRequestError("Insufficient cash balance");

    await db.update(users).set({ balance: newBalance, updatedAt: new Date().toISOString() }).where(eq(users.id, id));

    await logAction(adminId, "balance_adjustment", JSON.stringify({
      target_user_id: id, type, action, amount, reason,
      balance_before: balanceBefore, balance_after: newBalance,
    }));

    const [activeTx] = await db.select().from(transactions)
      .where(and(eq(transactions.userId, id), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
      .orderBy(desc(transactions.createdAt)).limit(1);

    return c.json({ success: true, newCoinBalance: activeTx?.coinsRemaining || 0, newCashBalance: newBalance });
  } else {
    const [activeTx] = await db.select().from(transactions)
      .where(and(eq(transactions.userId, id), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
      .orderBy(desc(transactions.createdAt)).limit(1);

    const coinsBefore = activeTx?.coinsRemaining || 0;
    const newCoins = action === "add" ? coinsBefore + amount : coinsBefore - amount;
    if (newCoins < 0) throw new BadRequestError("Insufficient coin balance");

    if (activeTx) {
      await db.update(transactions).set({ coinsRemaining: newCoins }).where(eq(transactions.id, activeTx.id));
    } else if (action === "add") {
      await db.insert(transactions).values({
        id: nanoid(),
        userId: id,
        paymentAmount: 0,
        coinsReceived: amount,
        coinsRemaining: amount,
        totalCashWon: 0,
        guaranteedMinimum: 0,
        status: "active",
      });
    } else {
      throw new BadRequestError("No active transaction to subtract coins from");
    }

    await logAction(adminId, "balance_adjustment", JSON.stringify({
      target_user_id: id, type, action, amount, reason,
      balance_before: coinsBefore, balance_after: Math.max(0, newCoins),
    }));

    return c.json({ success: true, newCoinBalance: Math.max(0, newCoins), newCashBalance: user.balance });
  }
});

// POST /admin/users/:id/reset-village — reset village progress (for testing)
admin.post("/users/:id/reset-village", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new BadRequestError("User not found");

  // Delete all active village progress rows so getOrCreateProgress creates fresh
  await db.delete(userVillageProgress).where(eq(userVillageProgress.userId, id));

  // Reset village profile totals + level
  await (db as any).run(sql`
    UPDATE user_village_profile
       SET total_stars = 0,
           current_level = 1,
           updated_at = datetime('now')
     WHERE user_id = ${id}
  `);

  // Also clear legacy card collection for completeness
  await (db as any).run(sql`DELETE FROM user_cards WHERE user_id = ${id}`);

  await logAction(adminId, "reset_village", JSON.stringify({ userId: id, phone: user.phone }));
  return c.json({ success: true, message: "Village progress reset" });
});

// PATCH /admin/users/:id/status
admin.patch("/users/:id/status", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();
  const { is_active } = body;
  if (typeof is_active !== "boolean") throw new BadRequestError("is_active must be a boolean");

  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return c.json({ success: false, message: "User not found" }, 404);

  await db.update(users).set({ isActive: is_active, updatedAt: new Date().toISOString() }).where(eq(users.id, id));

  await logAction(adminId, is_active ? "unblock_user" : "block_user", JSON.stringify({ target_user_id: id, user_phone: user.phone }));

  return c.json({ success: true, user: { id: user.id, phone: user.phone, name: user.name, isActive: is_active } });
});

// DELETE /admin/users/:id — hard delete user + all related rows (for testing)
admin.delete("/users/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return c.json({ success: false, message: "Not found" }, 404);

  // Decrement totalReferrals on referrer (if this user was referred by someone)
  if (user.referredBy) {
    await (db as any).run(sql`UPDATE users SET total_referrals = MAX(0, total_referrals - 1) WHERE id = ${user.referredBy}`);
  }

  // Cascade delete in dependency order
  await (db as any).run(sql`DELETE FROM user_cards WHERE user_id = ${id}`);
  await (db as any).run(sql`DELETE FROM user_village_progress WHERE user_id = ${id}`);
  await (db as any).run(sql`DELETE FROM user_village_profile WHERE user_id = ${id}`);
  await (db as any).run(sql`DELETE FROM payment_transactions WHERE user_id = ${id}`);
  await (db as any).run(sql`DELETE FROM transactions WHERE user_id = ${id}`);
  await (db as any).run(sql`DELETE FROM withdrawals WHERE user_id = ${id}`);
  await (db as any).run(sql`DELETE FROM sessions WHERE user_id = ${id}`);
  await (db as any).run(sql`DELETE FROM promo_code_uses WHERE user_id = ${id}`);
  await (db as any).run(sql`DELETE FROM game_history WHERE user_id = ${id}`);
  await (db as any).run(sql`DELETE FROM referrals WHERE referrer_id = ${id} OR referred_id = ${id}`);

  // Finally delete the user
  await db.delete(users).where(eq(users.id, id));

  await logAction(adminId, "delete_user", JSON.stringify({ userId: id, phone: user.phone }));
  return c.json({ success: true, message: "User deleted" });
});

// GET /admin/game-history
admin.get("/game-history", adminMiddleware, async (c) => {
  const db = getDb();
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;
  const gameType = c.req.query("game_type");
  const userId = c.req.query("user_id");
  const dateFrom = c.req.query("date_from");
  const dateTo = c.req.query("date_to");
  const search = c.req.query("search");

  // Build conditions
  const conditions: any[] = [];
  if (gameType) conditions.push(eq(gameHistory.gameType, gameType));
  if (userId) conditions.push(eq(gameHistory.userId, userId));
  if (dateFrom) conditions.push(sql`${gameHistory.createdAt} >= ${dateFrom}`);
  if (dateTo) conditions.push(sql`${gameHistory.createdAt} <= ${dateTo + "T23:59:59"}`);

  // If search, find matching user IDs first
  let searchUserIds: string[] | null = null;
  if (search) {
    const matchingUsers = await db.select({ id: users.id }).from(users)
      .where(or(like(users.phone, `%${search}%`), like(users.name, `%${search}%`)));
    searchUserIds = matchingUsers.map(u => u.id);
    if (searchUserIds.length === 0) {
      return c.json({ success: true, history: [], pagination: { page, limit, total: 0 } });
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Query with conditions
  let historyQuery = db.select().from(gameHistory);
  if (whereClause) historyQuery = historyQuery.where(whereClause) as any;

  let allRows = await historyQuery.orderBy(desc(gameHistory.createdAt));

  // Filter by search user IDs in application layer (simpler than dynamic IN clause)
  if (searchUserIds) {
    const idSet = new Set(searchUserIds);
    allRows = allRows.filter(r => idSet.has(r.userId));
  }

  const total = allRows.length;
  const paginated = allRows.slice(offset, offset + limit);

  // Enrich with user info
  const enriched = await Promise.all(
    paginated.map(async (h) => {
      const [user] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, h.userId)).limit(1);
      return { ...h, userPhone: user?.phone || null, userName: user?.name || null };
    })
  );

  return c.json({
    success: true,
    history: enriched,
    pagination: { page, limit, total },
  });
});

// GET /admin/pool/history
admin.get("/pool/history", adminMiddleware, async (c) => {
  const db = getDb();
  const days = parseInt(c.req.query("days") || "7");

  // Get daily game stats for last N days
  const results: { date: string; totalWon: number; totalGames: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const [dayStats] = await db.select({
      totalWon: sql<number>`coalesce(sum(${gameHistory.winAmount}), 0)`,
      totalGames: sql<number>`count(*)`,
    }).from(gameHistory).where(sql`date(${gameHistory.createdAt}) = ${dateStr}`);

    results.push({
      date: dateStr,
      totalWon: Number(dayStats?.totalWon) || 0,
      totalGames: Number(dayStats?.totalGames) || 0,
    });
  }

  // Current pool balance
  const [poolData] = await db.select().from(pool).limit(1);

  return c.json({
    success: true,
    history: results,
    currentPoolBalance: poolData?.balance || 0,
  });
});

// ══════════════════════════════════════
// PROMO CODES
// ══════════════════════════════════════

const promoCodeCreateSchema = z.object({
  code: z.string().min(1).max(30),
  description: z.string().optional(),
  coin_reward_for_user: z.number().int().positive(),
  coin_reward_for_creator: z.number().int().min(0).optional().default(0),
  max_uses: z.number().int().positive().nullable().optional(),
  max_uses_per_user: z.number().int().positive().optional().default(1),
  starts_at: z.string(),
  expires_at: z.string(),
});

// GET /admin/promo-codes
admin.get("/promo-codes", adminMiddleware, async (c) => {
  const db = getDb();
  const codes = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  return c.json({ success: true, promoCodes: codes });
});

// POST /admin/promo-codes
admin.post("/promo-codes", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = promoCodeCreateSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const adminId = c.get("adminId") as string;

  const existing = await db.select().from(promoCodes).where(eq(promoCodes.code, parsed.data.code.toUpperCase()));
  if (existing.length > 0) throw new BadRequestError("Code already exists");

  const id = nanoid();
  await db.insert(promoCodes).values({
    id,
    code: parsed.data.code.toUpperCase(),
    description: parsed.data.description || null,
    coinRewardForUser: parsed.data.coin_reward_for_user,
    coinRewardForCreator: parsed.data.coin_reward_for_creator || 0,
    maxUses: parsed.data.max_uses ?? null,
    currentUses: 0,
    maxUsesPerUser: parsed.data.max_uses_per_user || 1,
    startsAt: parsed.data.starts_at,
    expiresAt: parsed.data.expires_at,
    createdBy: adminId,
  });

  await logAction(adminId, "create_promo_code", JSON.stringify({ code: parsed.data.code }));

  const [created] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  return c.json({ success: true, promoCode: created });
});

// PATCH /admin/promo-codes/:id
admin.patch("/promo-codes/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [existing] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  if (!existing) return c.json({ success: false, message: "Not found" }, 404);

  const updates: Record<string, any> = {};
  if (body.description !== undefined) updates.description = body.description;
  if (body.coin_reward_for_user !== undefined) updates.coinRewardForUser = body.coin_reward_for_user;
  if (body.coin_reward_for_creator !== undefined) updates.coinRewardForCreator = body.coin_reward_for_creator;
  if (body.max_uses !== undefined) updates.maxUses = body.max_uses;
  if (body.max_uses_per_user !== undefined) updates.maxUsesPerUser = body.max_uses_per_user;
  if (body.starts_at !== undefined) updates.startsAt = body.starts_at;
  if (body.expires_at !== undefined) updates.expiresAt = body.expires_at;
  if (body.is_active !== undefined) updates.isActive = body.is_active;

  if (Object.keys(updates).length > 0) {
    await db.update(promoCodes).set(updates).where(eq(promoCodes.id, id));
  }

  await logAction(adminId, "update_promo_code", JSON.stringify({ id, updates }));
  const [updated] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  return c.json({ success: true, promoCode: updated });
});

// DELETE /admin/promo-codes/:id (soft delete)
admin.delete("/promo-codes/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const db = getDb();
  const adminId = c.get("adminId") as string;
  await db.update(promoCodes).set({ isActive: false }).where(eq(promoCodes.id, id));
  await logAction(adminId, "deactivate_promo_code", JSON.stringify({ id }));
  return c.json({ success: true });
});

// GET /admin/promo-codes/:id/uses
admin.get("/promo-codes/:id/uses", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const db = getDb();
  const uses = await db.select().from(promoCodeUses).where(eq(promoCodeUses.promoCodeId, id)).orderBy(desc(promoCodeUses.usedAt));
  const enriched = await Promise.all(
    uses.map(async (u) => {
      const [user] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, u.userId)).limit(1);
      return { ...u, userPhone: user?.phone, userName: user?.name };
    })
  );
  return c.json({ success: true, uses: enriched });
});

// ══════════════════════════════════════
// REFERRALS
// ══════════════════════════════════════

// GET /admin/referral-config
admin.get("/referral-config", adminMiddleware, async (c) => {
  const db = getDb();
  const [config] = await db.select().from(referralConfig).limit(1);
  return c.json({
    success: true,
    config: config || {
      id: "default",
      referrerRewardCoins: 200,
      referredRewardCoins: 100,
      bonusEveryN: 5,
      bonusRewardCoins: 500,
      signupRewardLari: 10,
      shareMessageTemplate: "Join me on Shansi! Use my referral code: {code} to get _ ₾",
      shareImageUrl: null,
      isActive: true,
    },
  });
});

// PATCH /admin/referral-config
admin.patch("/referral-config", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [existing] = await db.select().from(referralConfig).limit(1);
  if (!existing) {
    await db.insert(referralConfig).values({
      id: "default",
      referrerRewardCoins: body.referrer_reward_coins ?? 200,
      referredRewardCoins: body.referred_reward_coins ?? 100,
      bonusEveryN: body.bonus_every_n ?? 5,
      bonusRewardCoins: body.bonus_reward_coins ?? 500,
      signupRewardLari: body.signup_reward_lari ?? 10,
      shareMessageTemplate: body.share_message_template ?? null,
      shareImageUrl: body.share_image_url ?? null,
      isActive: body.is_active ?? true,
    });
  } else {
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (body.referrer_reward_coins !== undefined) updates.referrerRewardCoins = body.referrer_reward_coins;
    if (body.referred_reward_coins !== undefined) updates.referredRewardCoins = body.referred_reward_coins;
    if (body.bonus_every_n !== undefined) updates.bonusEveryN = body.bonus_every_n;
    if (body.bonus_reward_coins !== undefined) updates.bonusRewardCoins = body.bonus_reward_coins;
    if (body.signup_reward_lari !== undefined) updates.signupRewardLari = body.signup_reward_lari;
    if (body.share_message_template !== undefined) updates.shareMessageTemplate = body.share_message_template;
    if (body.share_image_url !== undefined) updates.shareImageUrl = body.share_image_url;
    if (body.is_active !== undefined) updates.isActive = body.is_active;
    await db.update(referralConfig).set(updates).where(eq(referralConfig.id, existing.id));
  }

  await logAction(adminId, "update_referral_config", JSON.stringify(body));
  const [config] = await db.select().from(referralConfig).limit(1);
  return c.json({ success: true, config });
});

// GET /admin/referrals
admin.get("/referrals", adminMiddleware, async (c) => {
  const db = getDb();
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const allReferrals = await db.select().from(referrals).orderBy(desc(referrals.createdAt)).limit(limit).offset(offset);
  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(referrals);
  const total = Number(totalResult?.count) || 0;

  const enriched = await Promise.all(
    allReferrals.map(async (r) => {
      const [referrer] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, r.referrerId)).limit(1);
      const [referred] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, r.referredId)).limit(1);
      return { ...r, referrerPhone: referrer?.phone, referrerName: referrer?.name, referredPhone: referred?.phone, referredName: referred?.name };
    })
  );

  const [statsResult] = await db.select({
    totalReferrals: sql<number>`count(*)`,
    totalCoinsGiven: sql<number>`coalesce(sum(${referrals.referrerCoinsRewarded} + ${referrals.referredCoinsRewarded}), 0)`,
  }).from(referrals);

  const topReferrers = await db.select({
    userId: users.id, phone: users.phone, name: users.name, totalReferrals: users.totalReferrals,
  }).from(users).where(sql`${users.totalReferrals} > 0`).orderBy(desc(users.totalReferrals)).limit(10);

  return c.json({
    success: true,
    referrals: enriched,
    pagination: { page, limit, total },
    stats: { totalReferrals: Number(statsResult?.totalReferrals) || 0, totalCoinsGiven: Number(statsResult?.totalCoinsGiven) || 0 },
    topReferrers,
  });
});

// ══════════════════════════════════════
// MERCHANTS
// ══════════════════════════════════════

// POST /admin/merchants — admin creates merchant directly (auto-approved)
admin.post("/merchants", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const adminId = c.get("adminId") as string;
  const db = getDb();

  const businessName = (body.business_name || "").trim();
  const phone = (body.phone || "").trim();
  if (!businessName) throw new BadRequestError("Business name required");
  if (!phone) throw new BadRequestError("Phone required");

  // Check for duplicate phone
  const [existing] = await db.select().from(merchants).where(eq(merchants.phone, phone)).limit(1);
  if (existing) throw new BadRequestError("Phone already registered");

  // Generate next merchant code SH-00001, SH-00002, ...
  const allMerchants = await db.select({ merchantCode: merchants.merchantCode }).from(merchants);
  const maxNum = allMerchants.reduce((max, m) => {
    if (!m.merchantCode) return max;
    const num = parseInt(m.merchantCode.replace("SH-", ""));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const merchantCode = `SH-${String(maxNum + 1).padStart(5, "0")}`;

  const id = nanoid();
  await db.insert(merchants).values({
    id,
    merchantCode,
    businessName,
    businessNameKa: body.business_name_ka || null,
    category: body.category || "other",
    phone,
    email: body.email || null,
    address: body.address || null,
    contactPerson: body.contact_person || null,
    commissionPercent: body.commission_percent ?? 3.0,
    logoUrl: body.logo_url || null,
    isActive: true,
    isVerified: true,
    approvedAt: new Date().toISOString(),
    approvedBy: adminId,
  });

  await logAction(adminId, "create_merchant", JSON.stringify({ merchantId: id, merchantCode, businessName }));
  const [created] = await db.select().from(merchants).where(eq(merchants.id, id)).limit(1);
  return c.json({ success: true, merchant: created });
});

// GET /admin/merchants
admin.get("/merchants", adminMiddleware, async (c) => {
  const db = getDb();
  const status = c.req.query("status") || "all";
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let merchantList;
  if (status === "pending") {
    merchantList = await db.select().from(merchants).where(eq(merchants.isActive, false)).orderBy(desc(merchants.createdAt)).limit(limit).offset(offset);
  } else if (status === "active") {
    merchantList = await db.select().from(merchants).where(eq(merchants.isActive, true)).orderBy(desc(merchants.createdAt)).limit(limit).offset(offset);
  } else {
    merchantList = await db.select().from(merchants).orderBy(desc(merchants.createdAt)).limit(limit).offset(offset);
  }

  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(merchants);

  // Enrich with transaction stats
  const enriched = await Promise.all(
    merchantList.map(async (m) => {
      const [stats] = await db.select({
        totalTx: sql<number>`count(*)`,
        totalAmount: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)`,
        totalCommission: sql<number>`coalesce(sum(${paymentTransactions.commissionAmount}), 0)`,
      }).from(paymentTransactions).where(eq(paymentTransactions.merchantId, m.id));
      return { ...m, totalTransactions: Number(stats?.totalTx) || 0, totalAmount: Number(stats?.totalAmount) || 0, totalCommission: Number(stats?.totalCommission) || 0 };
    })
  );

  return c.json({ success: true, merchants: enriched, pagination: { page, limit, total: Number(totalResult?.count) || 0 } });
});

// GET /admin/merchants/:id
admin.get("/merchants/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const db = getDb();
  const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id)).limit(1);
  if (!merchant) return c.json({ success: false, message: "Not found" }, 404);

  const txHistory = await db.select().from(paymentTransactions).where(eq(paymentTransactions.merchantId, id)).orderBy(desc(paymentTransactions.createdAt)).limit(50);

  const enrichedTx = await Promise.all(txHistory.map(async (tx) => {
    const [user] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, tx.userId)).limit(1);
    return { ...tx, userPhone: user?.phone, userName: user?.name };
  }));

  const [stats] = await db.select({
    totalTx: sql<number>`count(*)`,
    totalAmount: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)`,
    totalCommission: sql<number>`coalesce(sum(${paymentTransactions.commissionAmount}), 0)`,
  }).from(paymentTransactions).where(eq(paymentTransactions.merchantId, id));

  return c.json({ success: true, merchant, transactions: enrichedTx, stats: { totalTransactions: Number(stats?.totalTx) || 0, totalAmount: Number(stats?.totalAmount) || 0, totalCommission: Number(stats?.totalCommission) || 0 } });
});

// PATCH /admin/merchants/:id
admin.patch("/merchants/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [existing] = await db.select().from(merchants).where(eq(merchants.id, id)).limit(1);
  if (!existing) return c.json({ success: false, message: "Not found" }, 404);

  const updates: Record<string, any> = {};
  if (body.is_active !== undefined) {
    updates.isActive = body.is_active;
    if (body.is_active && !existing.approvedAt) {
      updates.approvedAt = new Date().toISOString();
      updates.approvedBy = adminId;
      // Generate sequential merchant code on first approval
      if (!existing.merchantCode) {
        const allMerchants = await db.select({ merchantCode: merchants.merchantCode }).from(merchants);
        const maxNum = allMerchants.reduce((max, m) => {
          if (!m.merchantCode) return max;
          const num = parseInt(m.merchantCode.replace("SH-", ""));
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        updates.merchantCode = `SH-${String(maxNum + 1).padStart(5, "0")}`;
      }
    }
  }
  if (body.is_verified !== undefined) updates.isVerified = body.is_verified;
  if (body.commission_percent !== undefined) updates.commissionPercent = body.commission_percent;
  if (body.commission_enabled !== undefined) updates.commissionEnabled = body.commission_enabled;
  if (body.logo_url !== undefined) updates.logoUrl = body.logo_url;

  if (Object.keys(updates).length > 0) {
    await db.update(merchants).set(updates).where(eq(merchants.id, id));
  }

  await logAction(adminId, "update_merchant", JSON.stringify({ merchantId: id, updates }));
  const [updated] = await db.select().from(merchants).where(eq(merchants.id, id)).limit(1);
  return c.json({ success: true, merchant: updated });
});

// ══════════════════════════════════════
// PAYMENTS & TRANSACTIONS
// ══════════════════════════════════════

// POST /admin/simulate-payment
admin.post("/simulate-payment", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const { user_phone, merchant_id, amount } = body;
  if (!user_phone || !merchant_id || !amount || amount <= 0) throw new BadRequestError("Missing required fields");

  const db = getDb();
  const adminId = c.get("adminId") as string;

  const phone = user_phone.startsWith("+995") ? user_phone : `+995${user_phone}`;
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) throw new BadRequestError("User not found");

  const [merchant] = await db.select().from(merchants).where(eq(merchants.id, merchant_id)).limit(1);
  if (!merchant || !merchant.isActive) throw new BadRequestError("Merchant not found or inactive");

  // Get coins_per_lari from system_config
  const [coinsConfig] = await db.select().from(systemConfig).where(eq(systemConfig.key, "coins_per_lari")).limit(1);
  const coinsPerLari = parseInt(coinsConfig?.value || "100");

  // Get min_return_percent from game config
  const [cfg] = await db.select().from(gameConfig).limit(1);
  const minReturnPercent = cfg?.minReturnPercent || 0.5;

  const commissionEnabled = (merchant as any).commissionEnabled !== false;
  const commissionAmount = commissionEnabled
    ? Math.round(amount * merchant.commissionPercent / 100 * 100) / 100
    : 0;
  const merchantAmount = Math.round((amount - commissionAmount) * 100) / 100;
  const coinsAwarded = Math.round(amount * coinsPerLari);
  const guaranteedMinimum = Math.round(amount * minReturnPercent / 100 * 100) / 100;

  // Create payment transaction
  await db.insert(paymentTransactions).values({
    id: nanoid(), userId: user.id, merchantId: merchant_id,
    amount, commissionAmount, merchantAmount, coinsAwarded,
  });

  // Create coin transaction for user
  await db.insert(transactions).values({
    id: nanoid(), userId: user.id, paymentAmount: amount,
    coinsReceived: coinsAwarded, coinsRemaining: coinsAwarded,
    totalCashWon: 0, guaranteedMinimum, status: "active",
  });

  await logAction(adminId, "simulate_payment", JSON.stringify({ userId: user.id, merchantId: merchant_id, amount, coinsAwarded, commission: commissionAmount }));

  return c.json({ success: true, coinsAwarded, commission: commissionAmount, merchantAmount, guaranteedMinimum });
});

// GET /admin/transactions/payments
admin.get("/transactions/payments", adminMiddleware, async (c) => {
  const db = getDb();
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const txList = await db.select().from(paymentTransactions).orderBy(desc(paymentTransactions.createdAt)).limit(limit).offset(offset);
  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(paymentTransactions);

  const enriched = await Promise.all(txList.map(async (tx) => {
    const [user] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, tx.userId)).limit(1);
    const [merchant] = await db.select({ businessName: merchants.businessName }).from(merchants).where(eq(merchants.id, tx.merchantId)).limit(1);
    return { ...tx, userPhone: user?.phone, userName: user?.name, merchantName: merchant?.businessName };
  }));

  return c.json({ success: true, transactions: enriched, pagination: { page, limit, total: Number(totalResult?.count) || 0 } });
});

// ══════════════════════════════════════
// WITHDRAWALS
// ══════════════════════════════════════

// GET /admin/withdrawals
admin.get("/withdrawals", adminMiddleware, async (c) => {
  const db = getDb();
  const status = c.req.query("status");
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (status) conditions.push(eq(withdrawals.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db.select().from(withdrawals).where(whereClause).orderBy(desc(withdrawals.createdAt)).limit(limit).offset(offset);
  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(withdrawals).where(whereClause);

  const enriched = await Promise.all(list.map(async (w) => {
    const [user] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, w.userId)).limit(1);
    return { ...w, userPhone: user?.phone, userName: user?.name };
  }));

  return c.json({ success: true, withdrawals: enriched, pagination: { page, limit, total: Number(totalResult?.count) || 0 } });
});

// PATCH /admin/withdrawals/:id
admin.patch("/withdrawals/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [w] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
  if (!w) return c.json({ success: false, message: "Not found" }, 404);

  const updates: Record<string, any> = { processedBy: adminId, processedAt: new Date().toISOString() };
  if (body.status === "approved") updates.status = "approved";
  else if (body.status === "completed") { updates.status = "completed"; updates.completedAt = new Date().toISOString(); }
  else if (body.status === "rejected") {
    updates.status = "rejected";
    if (body.admin_note) updates.adminNote = body.admin_note;
    // Refund cash balance
    const [user] = await db.select().from(users).where(eq(users.id, w.userId)).limit(1);
    if (user) {
      await db.update(users).set({ balance: user.balance + w.amount, updatedAt: new Date().toISOString() }).where(eq(users.id, w.userId));
    }
  }

  await db.update(withdrawals).set(updates).where(eq(withdrawals.id, id));
  await logAction(adminId, `withdrawal_${body.status}`, JSON.stringify({ withdrawalId: id, amount: w.amount }));

  return c.json({ success: true });
});

// ══════════════════════════════════════
// FINANCE
// ══════════════════════════════════════

// Auto-create pool_fundings table & ensure all finance-related columns exist
async function ensureFinanceTables() {
  const db = getDb();
  try {
    await (db as any).run(sql`CREATE TABLE IF NOT EXISTS pool_fundings (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      admin_id TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  } catch {}
  try {
    await (db as any).run(sql`ALTER TABLE payment_transactions ADD COLUMN commission_status TEXT NOT NULL DEFAULT 'pending'`);
  } catch {} // already exists
  try {
    await (db as any).run(sql`ALTER TABLE game_history ADD COLUMN payment_transaction_id TEXT`);
  } catch {} // already exists
  try {
    await (db as any).run(sql`ALTER TABLE transactions ADD COLUMN payment_transaction_id TEXT`);
  } catch {} // already exists
}

// GET /admin/finance — full finance dashboard with date filter
admin.get("/finance", adminMiddleware, async (c) => {
  await ensureFinanceTables();
  const db = getDb();

  const from = c.req.query("from"); // YYYY-MM-DD
  const to = c.req.query("to");
  const search = (c.req.query("q") || "").trim();
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;

  // If search looks like a transaction ID (no spaces, length > 6), look up first
  let searchUserIds: string[] = [];
  if (search) {
    const matchedUsers = await db.select({ id: users.id }).from(users)
      .where(or(like(users.phone, `%${search}%`), like(users.name, `%${search}%`)));
    searchUserIds = matchedUsers.map(u => u.id);
  }

  const dateConds: any[] = [];
  if (from) dateConds.push(sql`${paymentTransactions.createdAt} >= ${from}`);
  if (to) dateConds.push(sql`${paymentTransactions.createdAt} <= ${to + "T23:59:59"}`);
  if (search) {
    // Either matches a transaction ID directly OR belongs to a matched user
    const searchConds: any[] = [eq(paymentTransactions.id, search)];
    if (searchUserIds.length > 0) {
      searchConds.push(sql`${paymentTransactions.userId} IN (${sql.join(searchUserIds.map(id => sql`${id}`), sql`, `)})`);
    }
    dateConds.push(or(...searchConds));
  }
  const dateWhere = dateConds.length > 0 ? and(...dateConds) : undefined;

  // Pool current state (real-time, not date-filtered)
  const [poolRow] = await db.select().from(pool).limit(1);
  const poolBalance = Number(poolRow?.balance) || 0;
  // Read threshold from gameConfig (matches Algorithm settings page exactly)
  const [primaryCfg] = await db.select().from(gameConfig).limit(1);
  const poolMinThreshold = Number(primaryCfg?.poolMinimumThreshold) || 1000;
  let poolStatus: "healthy" | "low" | "critical" = "critical";
  if (poolBalance >= poolMinThreshold) poolStatus = "healthy";
  else if (poolBalance > poolMinThreshold * 0.3) poolStatus = "low";

  // Commission stats — date filtered
  const [commissionStats] = await db.select({
    totalCommission: sql<number>`coalesce(sum(${paymentTransactions.commissionAmount}), 0)`,
    totalPayments: sql<number>`count(*)`,
    totalVolume: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)`,
  }).from(paymentTransactions).where(dateWhere);

  // Pending commission (not yet in pool) — across all time
  const [pendingCommission] = await db.select({
    totalPending: sql<number>`coalesce(sum(${paymentTransactions.commissionAmount}), 0)`,
  }).from(paymentTransactions).where(eq(paymentTransactions.commissionStatus, "pending"));

  // Total paid out as cash winnings — date filtered (using gameHistory winAmount)
  const gameDateConds: any[] = [];
  if (from) gameDateConds.push(sql`${gameHistory.createdAt} >= ${from}`);
  if (to) gameDateConds.push(sql`${gameHistory.createdAt} <= ${to + "T23:59:59"}`);
  const [winStats] = await db.select({
    totalPaidOut: sql<number>`coalesce(sum(${gameHistory.winAmount}), 0)`,
  }).from(gameHistory).where(gameDateConds.length > 0 ? and(...gameDateConds) : undefined);

  const totalCommission = Number(commissionStats?.totalCommission) || 0;
  const totalPaidOut = Number(winStats?.totalPaidOut) || 0;

  // Charts — last 30 days, ONE query each (was 60 queries — fixed perf bug)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const since = thirtyDaysAgo.toISOString().slice(0, 10);

  const commissionByDay = await db.select({
    day: sql<string>`substr(${paymentTransactions.createdAt}, 1, 10)`,
    s: sql<number>`coalesce(sum(${paymentTransactions.commissionAmount}), 0)`,
  }).from(paymentTransactions)
    .where(sql`${paymentTransactions.createdAt} >= ${since}`)
    .groupBy(sql`substr(${paymentTransactions.createdAt}, 1, 10)`);

  const winsByDay = await db.select({
    day: sql<string>`substr(${gameHistory.createdAt}, 1, 10)`,
    s: sql<number>`coalesce(sum(${gameHistory.winAmount}), 0)`,
  }).from(gameHistory)
    .where(sql`${gameHistory.createdAt} >= ${since}`)
    .groupBy(sql`substr(${gameHistory.createdAt}, 1, 10)`);

  const commissionMap = new Map(commissionByDay.map(r => [r.day, Number(r.s) || 0]));
  const winsMap = new Map(winsByDay.map(r => [r.day, Number(r.s) || 0]));

  const dailyStats: { date: string; commission: number; paidOut: number }[] = [];
  for (let d = 29; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dStr = date.toISOString().slice(0, 10);
    dailyStats.push({
      date: dStr,
      commission: commissionMap.get(dStr) || 0,
      paidOut: winsMap.get(dStr) || 0,
    });
  }

  // Pie chart — commission by merchant (date filtered)
  const merchantBreakdown = await db.select({
    merchantId: paymentTransactions.merchantId,
    total: sql<number>`coalesce(sum(${paymentTransactions.commissionAmount}), 0)`,
    count: sql<number>`count(*)`,
  }).from(paymentTransactions).where(dateWhere).groupBy(paymentTransactions.merchantId);

  const merchantsBreakdown = await Promise.all(merchantBreakdown.map(async (m) => {
    const [merch] = await db.select({ businessName: merchants.businessName }).from(merchants).where(eq(merchants.id, m.merchantId)).limit(1);
    return { name: merch?.businessName || "—", total: Number(m.total) || 0, count: Number(m.count) || 0 };
  }));
  merchantsBreakdown.sort((a, b) => b.total - a.total);

  // Transactions table — date filtered + paginated
  const txList = await db.select().from(paymentTransactions)
    .where(dateWhere)
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(limit).offset(offset);

  const [totalTxResult] = await db.select({ count: sql<number>`count(*)` }).from(paymentTransactions).where(dateWhere);

  const enriched = await Promise.all(txList.map(async (tx) => {
    const [user] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, tx.userId)).limit(1);
    const [merch] = await db.select({ businessName: merchants.businessName, commissionPercent: merchants.commissionPercent }).from(merchants).where(eq(merchants.id, tx.merchantId)).limit(1);
    // Sum winnings via FK link (accurate, replaces 24h approximation)
    // Falls back to 24h window for legacy rows where paymentTransactionId is null
    const [winRow] = await db.select({ s: sql<number>`coalesce(sum(${gameHistory.winAmount}), 0)` })
      .from(gameHistory)
      .where(eq(gameHistory.paymentTransactionId, tx.id));
    let userWinnings = Number(winRow?.s) || 0;
    if (userWinnings === 0) {
      // Legacy fallback: pre-FK rows
      const txDate = new Date(tx.createdAt);
      const after = new Date(txDate.getTime() + 24 * 3600 * 1000).toISOString();
      const [legacyRow] = await db.select({ s: sql<number>`coalesce(sum(${gameHistory.winAmount}), 0)` })
        .from(gameHistory)
        .where(and(
          eq(gameHistory.userId, tx.userId),
          sql`${gameHistory.paymentTransactionId} IS NULL`,
          sql`${gameHistory.createdAt} >= ${tx.createdAt}`,
          sql`${gameHistory.createdAt} <= ${after}`,
        ));
      userWinnings = Number(legacyRow?.s) || 0;
    }
    return {
      id: tx.id,
      merchantName: merch?.businessName || "—",
      commissionPercent: Number(merch?.commissionPercent) || 0,
      userId: tx.userId,
      userPhone: user?.phone || "",
      userName: user?.name || "",
      amount: tx.amount,
      commissionAmount: tx.commissionAmount,
      coinsAwarded: tx.coinsAwarded,
      userWinnings,
      commissionStatus: tx.commissionStatus,
      createdAt: tx.createdAt,
    };
  }));

  const pendingAmount = Number(pendingCommission?.totalPending) || 0;
  const received = Math.round((totalCommission - pendingAmount) * 100) / 100;
  const profit = Math.round((received - totalPaidOut) * 100) / 100;

  return c.json({
    success: true,
    summary: {
      poolBalance,
      poolStatus,
      poolMinThreshold,
      totalCommission,
      pendingCommission: pendingAmount,
      received, // total commission - pending = actually received
      totalPaidOut,
      profit, // received - totalPaidOut (CAN be negative)
      totalPayments: Number(commissionStats?.totalPayments) || 0,
      totalVolume: Number(commissionStats?.totalVolume) || 0,
    },
    charts: {
      daily: dailyStats,
      merchantBreakdown: merchantsBreakdown,
    },
    transactions: enriched,
    pagination: {
      page, limit,
      total: Number(totalTxResult?.count) || 0,
      totalPages: Math.ceil((Number(totalTxResult?.count) || 0) / limit),
    },
  });
});

// POST /admin/finance/reset-legacy-commissions — one-time fix for pre-tracking pending rows
// Marks all paymentTransactions older than the most recent pool_funding as "in_pool"
// since they were funded via the old endpoint that didn't track commission_status
admin.post("/finance/reset-legacy-commissions", adminMiddleware, async (c) => {
  await ensureFinanceTables();
  const db = getDb();
  const adminId = c.get("adminId") as string;

  // Get total funded from pool table — assume that's what was already covered
  const [poolRow] = await db.select().from(pool).limit(1);
  const totalFunded = Number(poolRow?.totalFunded) || 0;

  // Mark oldest pending commissions as in_pool, FIFO until accumulated >= totalFunded
  const pendingTxs = await db.select().from(paymentTransactions)
    .where(eq(paymentTransactions.commissionStatus, "pending"))
    .orderBy(paymentTransactions.createdAt);

  let consumed = 0;
  let cleared = 0;
  for (const tx of pendingTxs) {
    if (consumed >= totalFunded - 0.001) break;
    await db.update(paymentTransactions).set({ commissionStatus: "in_pool" } as any).where(eq(paymentTransactions.id, tx.id));
    consumed += tx.commissionAmount;
    cleared++;
  }

  await logAction(adminId, "reset_legacy_commissions", `Cleared ${cleared} legacy pending commissions (${consumed.toFixed(2)}₾) against ${totalFunded.toFixed(2)}₾ total funded`);

  return c.json({ success: true, cleared, consumed: Math.round(consumed * 100) / 100, totalFunded });
});

// GET /admin/finance/pool-history — funding history
admin.get("/finance/pool-history", adminMiddleware, async (c) => {
  await ensureFinanceTables();
  const db = getDb();
  const fundings = await db.select().from(poolFundings).orderBy(desc(poolFundings.createdAt)).limit(50);
  const enriched = await Promise.all(fundings.map(async (f) => {
    const [adm] = await db.select({ name: admins.name, email: admins.email }).from(admins).where(eq(admins.id, f.adminId)).limit(1);
    return { ...f, adminName: adm?.name || adm?.email || f.adminId };
  }));
  return c.json({ success: true, fundings: enriched });
});

// POST /admin/finance/fund-pool — add funds and clear pending
const fundPoolSchema = z.object({
  amount: z.number().positive(),
  note: z.string().optional(),
});
admin.post("/finance/fund-pool", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = fundPoolSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const adminId = c.get("adminId") as string;
  const db = getDb();
  const { amount, note } = parsed.data;

  // CRITICAL: Update pool first — must always succeed
  const [poolRow] = await db.select().from(pool).limit(1);
  if (!poolRow) throw new BadRequestError("Pool not initialized");

  await db.update(pool).set({
    balance: poolRow.balance + amount,
    totalFunded: poolRow.totalFunded + amount,
    updatedAt: new Date().toISOString(),
  }).where(eq(pool.id, poolRow.id));

  await logAction(adminId, "pool_fund", `Added ${amount}₾ to pool${note ? ` — ${note}` : ""}`);

  // Clear pending commissions FIFO (mark as in_pool until running total >= amount)
  let clearedCommissions = 0;
  let actuallyConsumed = 0;
  try {
    await ensureFinanceTables();

    const pendingTxs = await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.commissionStatus, "pending"))
      .orderBy(paymentTransactions.createdAt);

    // FIFO: consume pending in order until accumulated >= amount (not exact match)
    for (const tx of pendingTxs) {
      if (actuallyConsumed >= amount - 0.001) break;
      await db.update(paymentTransactions).set({ commissionStatus: "in_pool" } as any).where(eq(paymentTransactions.id, tx.id));
      actuallyConsumed += tx.commissionAmount;
      clearedCommissions++;
    }

    // Log funding
    await db.insert(poolFundings).values({
      id: nanoid(), amount, adminId, note: note || null,
    });
  } catch (err: any) {
    console.error("[fund-pool] non-critical error:", err.message);
  }

  // Return fresh summary so frontend can update everything
  const [updatedPool] = await db.select().from(pool).limit(1);
  const [pendingNow] = await db.select({
    totalPending: sql<number>`coalesce(sum(${paymentTransactions.commissionAmount}), 0)`,
  }).from(paymentTransactions).where(eq(paymentTransactions.commissionStatus, "pending"));

  return c.json({
    success: true,
    newBalance: updatedPool?.balance,
    clearedCommissions,
    actuallyConsumed: Math.round(actuallyConsumed * 100) / 100,
    newPendingCommission: Number(pendingNow?.totalPending) || 0,
  });
});

// GET /admin/finance/user/:userId — user financial breakdown
admin.get("/finance/user/:userId", adminMiddleware, async (c) => {
  const userId = c.req.param("userId")!;
  const db = getDb();

  const [spendRow] = await db.select({
    totalSpend: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)`,
    txCount: sql<number>`count(*)`,
  }).from(paymentTransactions).where(eq(paymentTransactions.userId, userId));

  const [winRow] = await db.select({
    totalWon: sql<number>`coalesce(sum(${gameHistory.winAmount}), 0)`,
    gamesPlayed: sql<number>`count(*)`,
  }).from(gameHistory).where(eq(gameHistory.userId, userId));

  const [bonusRow] = await db.select({
    bonusRounds: sql<number>`count(*)`,
  }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.status, "bonus_round")));

  const totalSpend = Number(spendRow?.totalSpend) || 0;
  const totalWon = Number(winRow?.totalWon) || 0;

  return c.json({
    success: true,
    user: {
      totalSpend,
      totalWon,
      winPercent: totalSpend > 0 ? Math.round((totalWon / totalSpend) * 10000) / 100 : 0,
      gamesPlayed: Number(winRow?.gamesPlayed) || 0,
      bonusRounds: Number(bonusRow?.bonusRounds) || 0,
      txCount: Number(spendRow?.txCount) || 0,
    },
  });
});

// ══════════════════════════════════════
// ADMIN MANAGEMENT (super_admin only)
// ══════════════════════════════════════

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["admin", "super_admin"]),
  permissions: z.array(z.string()).optional(),
});

// POST /admin/admins/create (super_admin only)
admin.post("/admins/create", adminMiddleware, async (c) => {
  const adminRole = c.get("adminRole") as string;
  if (adminRole !== "super_admin") {
    return c.json({ success: false, message: "Only super admins can create new admins" }, 403);
  }

  const body = await c.req.json();
  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();

  // Check email not taken
  const [existing] = await db.select().from(admins).where(eq(admins.email, parsed.data.email)).limit(1);
  if (existing) throw new BadRequestError("Email already in use");

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const id = nanoid();
  const perms = parsed.data.role === "super_admin"
    ? ALL_PERMISSIONS
    : (parsed.data.permissions || ["dashboard"]);

  await db.insert(admins).values({
    id,
    email: parsed.data.email,
    passwordHash: hash,
    name: parsed.data.name,
    role: parsed.data.role,
    permissions: JSON.stringify(perms),
  });

  const adminId = c.get("adminId") as string;
  await logAction(adminId, "create_admin", `Created admin: ${parsed.data.email} (${parsed.data.role})`);

  return c.json({
    success: true,
    admin: { id, email: parsed.data.email, name: parsed.data.name, role: parsed.data.role, permissions: perms },
  });
});

// GET /admin/admins (super_admin only)
admin.get("/admins", adminMiddleware, async (c) => {
  const adminRole = c.get("adminRole") as string;
  if (adminRole !== "super_admin") {
    return c.json({ success: false, message: "Only super admins can view admin list" }, 403);
  }

  const db = getDb();
  const all = await db.select().from(admins).orderBy(desc(admins.createdAt));

  return c.json({
    success: true,
    admins: all.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      permissions: a.permissions ? JSON.parse(a.permissions) : ALL_PERMISSIONS,
      isActive: a.isActive,
      createdAt: a.createdAt,
    })),
  });
});

// PATCH /admin/admins/:id (super_admin only)
admin.patch("/admins/:id", adminMiddleware, async (c) => {
  const adminRole = c.get("adminRole") as string;
  if (adminRole !== "super_admin") {
    return c.json({ success: false, message: "Only super admins can edit admins" }, 403);
  }

  const id = c.req.param("id") as string;
  const body = await c.req.json();
  const db = getDb();

  const [target] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  if (!target) return c.json({ success: false, message: "Admin not found" }, 404);

  const updates: Record<string, any> = {};
  if (body.name) updates.name = body.name;
  if (body.role && ["admin", "super_admin"].includes(body.role)) updates.role = body.role;
  if (body.permissions) updates.permissions = JSON.stringify(body.permissions);
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  if (body.password && body.password.length >= 8) {
    updates.passwordHash = await bcrypt.hash(body.password, 10);
  }

  if (Object.keys(updates).length > 0) {
    await db.update(admins).set(updates).where(eq(admins.id, id));
  }

  const adminId = c.get("adminId") as string;
  await logAction(adminId, "update_admin", `Updated admin: ${target.email}`);

  return c.json({ success: true });
});

// DELETE /admin/admins/:id (super_admin only, can't delete self)
admin.delete("/admins/:id", adminMiddleware, async (c) => {
  const adminRole = c.get("adminRole") as string;
  if (adminRole !== "super_admin") {
    return c.json({ success: false, message: "Only super admins can delete admins" }, 403);
  }

  const id = c.req.param("id") as string;
  const currentAdminId = c.get("adminId") as string;

  if (id === currentAdminId) {
    return c.json({ success: false, message: "Cannot delete yourself" }, 400);
  }

  const db = getDb();
  await db.delete(admins).where(eq(admins.id, id));

  await logAction(currentAdminId, "delete_admin", `Deleted admin: ${id}`);
  return c.json({ success: true });
});

// ── Reset stuck transaction ──
// Completes a stuck active transaction and resets user's coin balance to 0
// so they can start fresh with a new transaction
admin.post("/transactions/:userId/reset", adminMiddleware, async (c) => {
  const userId = c.req.param("userId")!;
  const adminId = c.get("adminId");
  if (!userId) return c.json({ success: false, message: "userId required" }, 400);
  const db = getDb();

  // Find all active/bonus_round transactions for this user
  const activeTxs = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))));

  if (activeTxs.length === 0) {
    return c.json({ success: false, message: "No active transaction found" }, 404);
  }

  // Complete all stuck transactions
  for (const tx of activeTxs) {
    await db.update(transactions).set({
      status: "completed",
      coinsRemaining: 0,
      completedAt: new Date().toISOString(),
      guaranteeMet: tx.totalCashWon >= tx.guaranteedMinimum,
    }).where(eq(transactions.id, tx.id));
  }

  await logAction(adminId, "reset_transaction", `Reset ${activeTxs.length} stuck transaction(s) for user ${userId}. IDs: ${activeTxs.map(t => t.id).join(", ")}`);

  return c.json({
    success: true,
    reset: activeTxs.length,
    details: activeTxs.map(tx => ({
      id: tx.id,
      coinsRemaining: tx.coinsRemaining,
      totalCashWon: tx.totalCashWon,
      guaranteedMinimum: tx.guaranteedMinimum,
      status: tx.status,
    })),
  });
});

// ── Algorithm Simulation ──

const simulateSchema = z.object({
  userCount: z.number().int().min(10).max(10000),
  scenario: z.enum(["low", "medium", "high", "mixed"]),
  gameTypes: z.array(z.string()).min(1).optional(),
  villageEnabled: z.boolean().optional(),
  levelDistribution: z.enum(["equal", "realistic", "specific"]).optional(),
  specificLevel: z.number().int().min(1).optional(),
});

// Auto-create simulation_runs table if it doesn't exist
async function ensureSimulationTable() {
  const db = getDb();
  try {
    await (db as any).run(sql`CREATE TABLE IF NOT EXISTS simulation_runs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      user_count INTEGER NOT NULL,
      min_spend REAL NOT NULL,
      max_spend REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      progress INTEGER NOT NULL DEFAULT 0,
      results TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    )`);
  } catch {}
}

// POST /admin/algorithm/simulate — start a simulation job
admin.post("/algorithm/simulate", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = simulateSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  await ensureSimulationTable();

  const adminId = c.get("adminId");
  const db = getDb();
  const jobId = nanoid();

  const scenarioRanges: Record<string, { min: number; max: number }> = {
    low: { min: 1, max: 5 }, medium: { min: 5, max: 20 },
    high: { min: 20, max: 100 }, mixed: { min: 1, max: 100 },
  };
  const range = scenarioRanges[parsed.data.scenario] || scenarioRanges.mixed;

  await db.insert(simulationRuns).values({
    id: jobId,
    adminId,
    userCount: parsed.data.userCount,
    minSpend: range.min,
    maxSpend: range.max,
    status: "running",
    progress: 0,
  });

  // Run simulation in background — uses REAL calculateWin from gameEngine
  const villageOpts = {
    enabled: parsed.data.villageEnabled || false,
    distribution: parsed.data.levelDistribution || "equal" as const,
    specificLevel: parsed.data.specificLevel,
  };
  runSimulation(jobId, parsed.data.userCount, parsed.data.scenario, parsed.data.gameTypes || ["plinko"], villageOpts).catch(async (err) => {
    await db.update(simulationRuns).set({
      status: "error",
      results: JSON.stringify({ error: err.message }),
      completedAt: new Date().toISOString(),
    }).where(eq(simulationRuns.id, jobId));
  });

  await logAction(adminId, "start_simulation", `Simulation: ${parsed.data.userCount} users, scenario=${parsed.data.scenario}, games=${(parsed.data.gameTypes || ["plinko"]).join(",")}`);
  return c.json({ success: true, jobId });
});

// GET /admin/algorithm/simulate/:jobId — poll for results
admin.get("/algorithm/simulate/:jobId", adminMiddleware, async (c) => {
  const jobId = c.req.param("jobId")!;
  if (!jobId) throw new BadRequestError("jobId required");

  await ensureSimulationTable();
  const db = getDb();
  const [job] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, jobId)).limit(1);
  if (!job) return c.json({ success: false, message: "Job not found" }, 404);

  return c.json({
    success: true,
    status: job.status,
    progress: job.progress,
    total: job.userCount,
    results: job.results ? JSON.parse(job.results) : null,
  });
});

// GET /admin/algorithm/simulate-history — last 10 test runs
admin.get("/algorithm/simulate-history", adminMiddleware, async (c) => {
  await ensureSimulationTable();
  const db = getDb();
  const runs = await db.select().from(simulationRuns)
    .orderBy(desc(simulationRuns.createdAt))
    .limit(10);

  return c.json({
    success: true,
    runs: runs.map(r => ({
      id: r.id,
      userCount: r.userCount,
      minSpend: r.minSpend,
      maxSpend: r.maxSpend,
      status: r.status,
      progress: r.progress,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      results: r.results ? JSON.parse(r.results) : null,
    })),
  });
});

// ══════════════════════════════════════
// VILLAGE — admin endpoints
// ══════════════════════════════════════

// GET /admin/village/levels
admin.get("/village/levels", adminMiddleware, async (c) => {
  const db = getDb();
  const levels = await db.select().from(villageLevels).orderBy(villageLevels.levelNumber);
  return c.json({ success: true, levels });
});

const levelSchema = z.object({
  levelNumber: z.number().int().min(1),
  starsRequired: z.number().int().min(0),
  maxWinAmount: z.number().min(0),
  description: z.string().optional(),
});

// POST /admin/village/levels — create new level
admin.post("/village/levels", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = levelSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);
  const db = getDb();
  const id = "lvl_" + parsed.data.levelNumber;
  await db.insert(villageLevels).values({
    id, levelNumber: parsed.data.levelNumber, starsRequired: parsed.data.starsRequired,
    maxWinAmount: parsed.data.maxWinAmount, description: parsed.data.description || null,
  });
  return c.json({ success: true });
});

// PUT /admin/village/levels/:id
admin.put("/village/levels/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const db = getDb();
  const updates: any = { updatedAt: new Date().toISOString() };
  if (body.starsRequired !== undefined) updates.starsRequired = body.starsRequired;
  if (body.maxWinAmount !== undefined) updates.maxWinAmount = body.maxWinAmount;
  if (body.description !== undefined) updates.description = body.description;
  await db.update(villageLevels).set(updates).where(eq(villageLevels.id, id));
  return c.json({ success: true });
});

// DELETE /admin/village/levels/:id
admin.delete("/village/levels/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const db = getDb();
  await db.delete(villageLevels).where(eq(villageLevels.id, id));
  return c.json({ success: true });
});

// ── NEW VILLAGES SYSTEM (themed villages with 5 buildings each) ──

// GET /admin/villages — all villages with their buildings
admin.get("/villages", adminMiddleware, async (c) => {
  const db = getDb();
  const allVillages = await db.select().from(villages).orderBy(villages.position);
  const enriched = await Promise.all(allVillages.map(async (v) => {
    const buildings = await db.select().from(villageBuildings).where(eq(villageBuildings.villageId, v.id)).orderBy(villageBuildings.position);
    return { ...v, buildings };
  }));
  return c.json({ success: true, villages: enriched });
});

// GET /admin/villages/:id — single village with buildings
admin.get("/villages/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const db = getDb();
  const [v] = await db.select().from(villages).where(eq(villages.id, id)).limit(1);
  if (!v) return c.json({ success: false, message: "Not found" }, 404);
  const buildings = await db.select().from(villageBuildings).where(eq(villageBuildings.villageId, id)).orderBy(villageBuildings.position);
  return c.json({ success: true, village: { ...v, buildings } });
});

// POST /admin/villages — create new village (with 5 default buildings)
const newVillageSchema = z.object({
  name: z.string().min(1),
  theme: z.string().optional(),
  position: z.number().int().min(1).optional(),
});
admin.post("/villages", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = newVillageSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);
  const db = getDb();
  // Auto-position: max + 1
  let position = parsed.data.position;
  if (position === undefined) {
    const all = await db.select().from(villages);
    position = (all.reduce((m, v) => Math.max(m, v.position), 0) || 0) + 1;
  }
  const id = nanoid();
  await db.insert(villages).values({
    id, position, name: parsed.data.name, theme: parsed.data.theme || null,
  });
  // Seed 5 placeholder buildings
  const base = 50 * position;
  for (let i = 1; i <= 5; i++) {
    await db.insert(villageBuildings).values({
      id: nanoid(), villageId: id, position: i, name: `Building ${i}`,
      star1Name: `B${i} ⭐`, star1Cost: base,
      star2Name: `B${i} ⭐⭐`, star2Cost: base * 2,
      star3Name: `B${i} ⭐⭐⭐`, star3Cost: base * 4,
      star4Name: `B${i} ⭐⭐⭐⭐`, star4Cost: base * 8,
    });
  }
  return c.json({ success: true, id });
});

// PUT /admin/villages/:id — update village name/theme
admin.put("/villages/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const db = getDb();
  const updates: any = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.theme !== undefined) updates.theme = body.theme;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  await db.update(villages).set(updates).where(eq(villages.id, id));
  return c.json({ success: true });
});

// DELETE /admin/villages/:id
admin.delete("/villages/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const db = getDb();
  await db.delete(villageBuildings).where(eq(villageBuildings.villageId, id));
  await db.delete(villages).where(eq(villages.id, id));
  return c.json({ success: true });
});

// PUT /admin/villages/:vid/buildings/:bid — update building name, costs, and images
// Body can include: name, star1Name/Cost/Image, star2..., star3..., star4...
admin.put("/villages/:vid/buildings/:bid", adminMiddleware, async (c) => {
  const bid = c.req.param("bid")!;
  const body = await c.req.json();
  const db = getDb();
  const updates: any = {};
  const fields = [
    "name",
    "star1Name", "star1Cost", "star1Image",
    "star2Name", "star2Cost", "star2Image",
    "star3Name", "star3Cost", "star3Image",
    "star4Name", "star4Cost", "star4Image",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  // Server-side image size guard (base64 — limit ~600KB)
  for (const k of ["star1Image", "star2Image", "star3Image", "star4Image"]) {
    if (typeof updates[k] === "string" && updates[k].length > 800000) {
      throw new BadRequestError(`სურათი დიდია (${k}) — მაქს. 600KB`);
    }
  }
  await db.update(villageBuildings).set(updates).where(eq(villageBuildings.id, bid));
  return c.json({ success: true });
});

// GET /admin/village/config
admin.get("/village/config", adminMiddleware, async (c) => {
  const db = getDb();
  const rows = await db.select().from(villageConfig);
  const config: Record<string, string> = {};
  for (const r of rows) config[r.key] = r.value;
  return c.json({ success: true, config });
});

// PUT /admin/village/config
admin.put("/village/config", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const db = getDb();
  for (const [k, v] of Object.entries(body)) {
    const value = String(v);
    const [existing] = await db.select().from(villageConfig).where(eq(villageConfig.key, k)).limit(1);
    if (existing) {
      await db.update(villageConfig).set({ value, updatedAt: new Date().toISOString() }).where(eq(villageConfig.key, k));
    } else {
      await db.insert(villageConfig).values({ key: k, value });
    }
  }
  return c.json({ success: true });
});

// GET /admin/village/attacks — paginated history
admin.get("/village/attacks", adminMiddleware, async (c) => {
  const db = getDb();
  const page = parseInt(c.req.query("page") || "1");
  const limit = 30;
  const offset = (page - 1) * limit;
  const list = await db.select().from(villageAttacks).orderBy(desc(villageAttacks.createdAt)).limit(limit).offset(offset);
  const enriched = await Promise.all(list.map(async (a) => {
    const [att] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, a.attackerId)).limit(1);
    const [vic] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, a.victimId)).limit(1);
    return { ...a, attackerName: att?.name || att?.phone || a.attackerId, victimName: vic?.name || vic?.phone || a.victimId };
  }));
  const [total] = await db.select({ c: sql<number>`count(*)` }).from(villageAttacks);
  return c.json({ success: true, attacks: enriched, total: Number(total?.c) || 0 });
});

// GET /admin/village/stats
admin.get("/village/stats", adminMiddleware, async (c) => {
  const db = getDb();

  // Users per level
  const distRows = await db.select({
    level: userVillageProfile.currentLevel,
    c: sql<number>`count(*)`,
  }).from(userVillageProfile).groupBy(userVillageProfile.currentLevel);

  // Top cards
  const topRows = await db.select({
    cardId: userCards.cardId,
    c: sql<number>`count(*)`,
  }).from(userCards).groupBy(userCards.cardId).orderBy(sql`count(*) desc`).limit(10);
  const topCards = await Promise.all(topRows.map(async (r) => {
    const [card] = await db.select().from(villageCards).where(eq(villageCards.id, r.cardId)).limit(1);
    return { name: card?.name || "—", rarity: card?.rarity || "—", count: Number(r.c) || 0 };
  }));

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [attacksToday] = await db.select({ c: sql<number>`count(*)` }).from(villageAttacks).where(sql`${villageAttacks.createdAt} >= ${todayStr}`);
  const [attacksWeek] = await db.select({ c: sql<number>`count(*)` }).from(villageAttacks).where(sql`${villageAttacks.createdAt} >= ${weekAgo}`);
  const [cardsToday] = await db.select({ c: sql<number>`count(*)` }).from(userCards).where(sql`${userCards.obtainedAt} >= ${todayStr}`);
  const [cardsWeek] = await db.select({ c: sql<number>`count(*)` }).from(userCards).where(sql`${userCards.obtainedAt} >= ${weekAgo}`);

  return c.json({
    success: true,
    stats: {
      usersPerLevel: distRows.map(r => ({ level: r.level, count: Number(r.c) || 0 })),
      topCards,
      attacksToday: Number(attacksToday?.c) || 0,
      attacksWeek: Number(attacksWeek?.c) || 0,
      cardsBoughtToday: Number(cardsToday?.c) || 0,
      cardsBoughtWeek: Number(cardsWeek?.c) || 0,
    },
  });
});

// ══════════════════════════════════════
// BIG WIN — admin endpoints
// ══════════════════════════════════════

async function ensureBigWinConfig() {
  const db = getDb();
  const [existing] = await db.select().from(bigWinConfig).limit(1);
  if (!existing) {
    await db.insert(bigWinConfig).values({ id: "main", budgetPercent: 30 });
  }
}

// GET /admin/big-win/config — returns config + computed budgets
admin.get("/big-win/config", adminMiddleware, async (c) => {
  await ensureBigWinConfig();
  const db = getDb();
  const [cfg] = await db.select().from(bigWinConfig).limit(1);
  const [poolRow] = await db.select().from(pool).limit(1);
  const [gc] = await db.select().from(gameConfig).limit(1);
  const poolBalance = Number(poolRow?.balance) || 0;
  const threshold = Number(gc?.poolMinimumThreshold) || 0;
  const available = Math.max(0, poolBalance - threshold);
  const budgetPercent = Number(cfg?.budgetPercent) || 30;
  const bigWinBudget = Math.round(available * budgetPercent / 100 * 100) / 100;
  const regularBudget = Math.round(available * (100 - budgetPercent) / 100 * 100) / 100;

  // Total of active prizes (allocated)
  const prizes = await db.select().from(bigWinPrizes).where(eq(bigWinPrizes.isActive, true));
  const allocated = prizes.reduce((s, p) => s + (p.amount * Math.max(0, p.quantity - p.wonCount)), 0);

  return c.json({
    success: true,
    config: { budgetPercent },
    pool: {
      balance: poolBalance,
      threshold,
      available,
      bigWinBudget,
      regularBudget,
      allocated: Math.round(allocated * 100) / 100,
      freeBigWin: Math.round((bigWinBudget - allocated) * 100) / 100,
    },
  });
});

const bigWinConfigSchema = z.object({
  budgetPercent: z.number().min(0).max(100),
});

// PUT /admin/big-win/config
admin.put("/big-win/config", adminMiddleware, async (c) => {
  await ensureBigWinConfig();
  const body = await c.req.json();
  const parsed = bigWinConfigSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);
  const db = getDb();
  await db.update(bigWinConfig).set({
    budgetPercent: parsed.data.budgetPercent,
    updatedAt: new Date().toISOString(),
  }).where(eq(bigWinConfig.id, "main"));
  const adminId = c.get("adminId") as string;
  await logAction(adminId, "update_big_win_config", JSON.stringify(parsed.data));
  return c.json({ success: true });
});

// GET /admin/big-win/prizes
admin.get("/big-win/prizes", adminMiddleware, async (c) => {
  const db = getDb();
  const prizes = await db.select().from(bigWinPrizes).orderBy(desc(bigWinPrizes.createdAt));
  return c.json({ success: true, prizes });
});

const prizeSchema = z.object({
  amount: z.number().positive(),
  quantity: z.number().int().positive(),
});

// POST /admin/big-win/prizes
admin.post("/big-win/prizes", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = prizeSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);
  const db = getDb();

  // Server-side budget guard
  await ensureBigWinConfig();
  const [bw] = await db.select().from(bigWinConfig).limit(1);
  const [poolRow] = await db.select().from(pool).limit(1);
  const [gc] = await db.select().from(gameConfig).limit(1);
  const available = Math.max(0, (Number(poolRow?.balance) || 0) - (Number(gc?.poolMinimumThreshold) || 0));
  const budget = available * (Number(bw?.budgetPercent) || 30) / 100;
  const existing = await db.select().from(bigWinPrizes).where(eq(bigWinPrizes.isActive, true));
  const allocated = existing.reduce((s, p) => s + p.amount * Math.max(0, p.quantity - p.wonCount), 0);
  const free = budget - allocated;
  const totalNew = parsed.data.amount * parsed.data.quantity;
  if (totalNew > free + 0.001) {
    throw new BadRequestError(`პრიზი ბიუჯეტს აჭარბებს ${(totalNew - free).toFixed(2)}₾-ით (ბიუჯეტი: ${budget.toFixed(2)}₾, თავისუფალი: ${free.toFixed(2)}₾)`);
  }

  await db.insert(bigWinPrizes).values({
    id: nanoid(),
    amount: parsed.data.amount,
    quantity: parsed.data.quantity,
  });
  return c.json({ success: true });
});

// PUT /admin/big-win/prizes/:id
admin.put("/big-win/prizes/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const db = getDb();

  const [existing] = await db.select().from(bigWinPrizes).where(eq(bigWinPrizes.id, id)).limit(1);
  if (!existing) return c.json({ success: false, message: "Not found" }, 404);

  // Validate quantity >= wonCount
  if (body.quantity !== undefined && body.quantity < existing.wonCount) {
    throw new BadRequestError(`რაოდენობა ვერ იქნება ნაკლები მოგებულზე (${existing.wonCount})`);
  }

  // Server-side budget guard for amount/quantity changes
  if (body.amount !== undefined || body.quantity !== undefined) {
    await ensureBigWinConfig();
    const [bw] = await db.select().from(bigWinConfig).limit(1);
    const [poolRow] = await db.select().from(pool).limit(1);
    const [gc] = await db.select().from(gameConfig).limit(1);
    const available = Math.max(0, (Number(poolRow?.balance) || 0) - (Number(gc?.poolMinimumThreshold) || 0));
    const budget = available * (Number(bw?.budgetPercent) || 30) / 100;
    const others = await db.select().from(bigWinPrizes).where(eq(bigWinPrizes.isActive, true));
    const allocatedOthers = others
      .filter(p => p.id !== id)
      .reduce((s, p) => s + p.amount * Math.max(0, p.quantity - p.wonCount), 0);
    const newAmount = body.amount ?? existing.amount;
    const newQuantity = body.quantity ?? existing.quantity;
    const newPrizeRemaining = newAmount * Math.max(0, newQuantity - existing.wonCount);
    const totalAfter = allocatedOthers + newPrizeRemaining;
    if (totalAfter > budget + 0.001) {
      throw new BadRequestError(`ცვლილება ბიუჯეტს აჭარბებს ${(totalAfter - budget).toFixed(2)}₾-ით (ბიუჯეტი: ${budget.toFixed(2)}₾)`);
    }
  }

  const updates: any = { updatedAt: new Date().toISOString() };
  if (body.amount !== undefined) updates.amount = body.amount;
  if (body.quantity !== undefined) updates.quantity = body.quantity;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  await db.update(bigWinPrizes).set(updates).where(eq(bigWinPrizes.id, id));
  return c.json({ success: true });
});

// DELETE /admin/big-win/prizes/:id (only if not won)
admin.delete("/big-win/prizes/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const db = getDb();
  const [p] = await db.select().from(bigWinPrizes).where(eq(bigWinPrizes.id, id)).limit(1);
  if (!p) return c.json({ success: false, message: "Not found" }, 404);
  if (p.wonCount > 0) return c.json({ success: false, message: "Cannot delete — prize already won" }, 400);
  await db.delete(bigWinPrizes).where(eq(bigWinPrizes.id, id));
  return c.json({ success: true });
});

// GET /admin/big-win/history
admin.get("/big-win/history", adminMiddleware, async (c) => {
  const db = getDb();
  const list = await db.select().from(bigWinHistory).orderBy(desc(bigWinHistory.wonAt)).limit(100);
  const enriched = await Promise.all(list.map(async (h) => {
    const [u] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, h.userId)).limit(1);
    return { ...h, userName: u?.name || u?.phone || h.userId };
  }));
  return c.json({ success: true, history: enriched });
});

// ══════════════════════════════════════
// OFFERS (cashback promos shown on /promos page)
// ══════════════════════════════════════

// GET /admin/offers
admin.get("/offers", adminMiddleware, async (c) => {
  const db = getDb();
  const type = c.req.query("type");
  const activeParam = c.req.query("active");

  const conds: any[] = [];
  if (type) conds.push(eq(offers.offerType, type));
  if (activeParam === "true") conds.push(eq(offers.isActive, true));
  if (activeParam === "false") conds.push(eq(offers.isActive, false));

  const rows = conds.length > 0
    ? await db.select().from(offers).where(and(...conds)).orderBy(offers.sortOrder, desc(offers.createdAt))
    : await db.select().from(offers).orderBy(offers.sortOrder, desc(offers.createdAt));

  const enriched = await Promise.all(rows.map(async (o) => {
    const [m] = await db.select({
      id: merchants.id,
      merchantCode: merchants.merchantCode,
      businessName: merchants.businessName,
      businessNameKa: merchants.businessNameKa,
      category: merchants.category,
      logoUrl: merchants.logoUrl,
    }).from(merchants).where(eq(merchants.id, o.merchantId)).limit(1);
    return { ...o, merchant: m || null };
  }));
  return c.json({ success: true, offers: enriched });
});

// POST /admin/offers
admin.post("/offers", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const adminId = c.get("adminId") as string;
  const db = getDb();

  if (!body.merchant_id) throw new BadRequestError("merchant_id required");
  if (!body.offer_type) throw new BadRequestError("offer_type required");
  if (!["featured", "flash", "partner"].includes(body.offer_type)) {
    throw new BadRequestError("offer_type must be featured, flash, or partner");
  }
  if (body.boosted_rate == null) throw new BadRequestError("boosted_rate required");
  if (!body.starts_at || !body.ends_at) throw new BadRequestError("starts_at and ends_at required");

  const [m] = await db.select().from(merchants).where(eq(merchants.id, body.merchant_id)).limit(1);
  if (!m) throw new BadRequestError("Merchant not found");

  const id = nanoid();
  await db.insert(offers).values({
    id,
    merchantId: body.merchant_id,
    offerType: body.offer_type,
    boostedRate: Number(body.boosted_rate),
    normalRate: Number(body.normal_rate ?? 0),
    title: body.title || null,
    description: body.description || null,
    sortOrder: Number(body.sort_order ?? 0),
    startsAt: body.starts_at,
    endsAt: body.ends_at,
    isActive: body.is_active !== false,
    createdBy: adminId,
  });

  await logAction(adminId, "create_offer", JSON.stringify({ id, merchantId: body.merchant_id, offerType: body.offer_type }));
  const [created] = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  return c.json({ success: true, offer: created });
});

// PATCH /admin/offers/:id
admin.patch("/offers/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [existing] = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  if (!existing) return c.json({ success: false, message: "Not found" }, 404);

  const updates: Record<string, any> = {};
  if (body.merchant_id !== undefined) updates.merchantId = body.merchant_id;
  if (body.offer_type !== undefined) {
    if (!["featured", "flash", "partner"].includes(body.offer_type)) {
      throw new BadRequestError("offer_type must be featured, flash, or partner");
    }
    updates.offerType = body.offer_type;
  }
  if (body.boosted_rate !== undefined) updates.boostedRate = Number(body.boosted_rate);
  if (body.normal_rate !== undefined) updates.normalRate = Number(body.normal_rate);
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.sort_order !== undefined) updates.sortOrder = Number(body.sort_order);
  if (body.starts_at !== undefined) updates.startsAt = body.starts_at;
  if (body.ends_at !== undefined) updates.endsAt = body.ends_at;
  if (body.is_active !== undefined) updates.isActive = body.is_active;

  if (Object.keys(updates).length > 0) {
    await db.update(offers).set(updates).where(eq(offers.id, id));
  }
  await logAction(adminId, "update_offer", JSON.stringify({ id, updates }));
  const [updated] = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  return c.json({ success: true, offer: updated });
});

// DELETE /admin/offers/:id
admin.delete("/offers/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const db = getDb();
  const adminId = c.get("adminId") as string;
  await db.delete(offers).where(eq(offers.id, id));
  await logAction(adminId, "delete_offer", JSON.stringify({ id }));
  return c.json({ success: true });
});

// ══════════════════════════════════════
// TICKETS (home page swipeable strip)
// ══════════════════════════════════════

admin.get("/tickets", adminMiddleware, async (c) => {
  const db = getDb();
  const rows = await db.select().from(tickets).orderBy(tickets.sortOrder, desc(tickets.createdAt));
  const shaped = rows.map((r) => {
    let termsArr: string[] = [];
    try { termsArr = JSON.parse((r as any).termsJson || "[]"); } catch {}
    return { ...r, terms: termsArr, row: (r as any).rowLabel };
  });
  return c.json({ success: true, tickets: shaped });
});

// Generate a unique SH-YYYYMMDD-XXXXX serial that doesn't already exist in the tickets table.
async function generateUniqueSerial(db: any): Promise<string> {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I
  for (let attempt = 0; attempt < 10; attempt++) {
    let rand = "";
    for (let i = 0; i < 5; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    const candidate = `SH-${ymd}-${rand}`;
    const [existing] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.serial, candidate)).limit(1);
    if (!existing) return candidate;
  }
  throw new BadRequestError("Could not generate unique serial, please retry");
}

admin.post("/tickets", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const adminId = c.get("adminId") as string;
  const db = getDb();

  if (!body.title || !body.brand) {
    throw new BadRequestError("title and brand are required");
  }

  // Always auto-generate a unique serial server-side
  const serial = await generateUniqueSerial(db);

  const id = nanoid();
  await db.insert(tickets).values({
    id,
    emoji: body.emoji || "🎫",
    logoUrl: body.logo_url || null,
    category: body.category || "other",
    title: body.title,
    titleKa: body.title_ka || body.title,
    brand: body.brand || "SHANSI",
    validity: body.validity || "7 დღე",
    type: body.type || "ერთჯერადი",
    price: body.price || "0",
    bonus: body.bonus || "+ 0₾",
    personName: body.person_name || "",
    screen: body.screen || null,
    rowLabel: body.row || null,
    seat: body.seat || null,
    serial,
    social: body.social || null,
    termsJson: JSON.stringify(Array.isArray(body.terms) ? body.terms : []),
    website: body.website || "WWW.SHANSI.GE",
    sortOrder: Number(body.sort_order ?? 0),
    isActive: body.is_active !== false,
    createdBy: adminId,
  });

  await logAction(adminId, "create_ticket", JSON.stringify({ id, title: body.title, serial }));
  const [created] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return c.json({ success: true, ticket: created });
});

admin.patch("/tickets/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();
  const db = getDb();
  const adminId = c.get("adminId") as string;

  const [existing] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!existing) return c.json({ success: false, message: "Not found" }, 404);

  const updates: Record<string, any> = {};
  const fieldMap: Record<string, string> = {
    emoji: "emoji",
    logo_url: "logoUrl",
    category: "category",
    title: "title",
    title_ka: "titleKa",
    brand: "brand",
    validity: "validity",
    type: "type",
    price: "price",
    bonus: "bonus",
    person_name: "personName",
    screen: "screen",
    row: "rowLabel",
    seat: "seat",
    social: "social",
    website: "website",
  };
  for (const [bodyKey, dbKey] of Object.entries(fieldMap)) {
    if (body[bodyKey] !== undefined) updates[dbKey] = body[bodyKey];
  }
  if (body.terms !== undefined && Array.isArray(body.terms)) updates.termsJson = JSON.stringify(body.terms);
  if (body.sort_order !== undefined) updates.sortOrder = Number(body.sort_order);
  if (body.is_active !== undefined) updates.isActive = !!body.is_active;

  if (Object.keys(updates).length > 0) {
    await db.update(tickets).set(updates).where(eq(tickets.id, id));
  }
  await logAction(adminId, "update_ticket", JSON.stringify({ id, updates: Object.keys(updates) }));
  const [updated] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return c.json({ success: true, ticket: updated });
});

admin.delete("/tickets/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const db = getDb();
  const adminId = c.get("adminId") as string;
  await db.delete(tickets).where(eq(tickets.id, id));
  await logAction(adminId, "delete_ticket", JSON.stringify({ id }));
  return c.json({ success: true });
});

export default admin;
