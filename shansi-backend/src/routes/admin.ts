import { Hono } from "hono";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, desc, like, or, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AdminEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { admins, gameConfig, pool, gameHistory, adminLogs, users, otpRateLimits, transactions, referrals, referralConfig, promoCodes, promoCodeUses } from "../db/schema.js";
import { adminMiddleware } from "../middleware/admin.js";
import { getEnv } from "../utils/env.js";
import { BadRequestError, UnauthorizedError, RateLimitError } from "../utils/errors.js";

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

// GET /admin/game-config
admin.get("/game-config", adminMiddleware, async (c) => {
  const db = getDb();
  const configs = await db.select().from(gameConfig);
  return c.json({ success: true, configs });
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

      const [activeTx] = await db.select().from(transactions)
        .where(and(eq(transactions.userId, u.id), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
        .orderBy(desc(transactions.createdAt)).limit(1);

      return {
        id: u.id,
        phone: u.phone,
        name: u.name,
        coin_balance: activeTx?.coinsRemaining || 0,
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

  const [activeTx] = await db.select().from(transactions)
    .where(and(eq(transactions.userId, id), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
    .orderBy(desc(transactions.createdAt)).limit(1);

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
      coin_balance: activeTx?.coinsRemaining || 0,
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

// GET /admin/game-history
admin.get("/game-history", adminMiddleware, async (c) => {
  const db = getDb();
  const page = parseInt(c.req.query("page") || "1");
  const limit = 50;
  const offset = (page - 1) * limit;
  const gameType = c.req.query("game_type");
  const userId = c.req.query("user_id");

  const history = await db.select().from(gameHistory).orderBy(desc(gameHistory.createdAt)).limit(limit).offset(offset);
  const allHistory = await db.select().from(gameHistory);

  return c.json({
    success: true,
    history,
    pagination: { page, limit, total: allHistory.length },
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
    config: config || { id: "default", referrerRewardCoins: 200, referredRewardCoins: 100, isActive: true },
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
      isActive: body.is_active ?? true,
    });
  } else {
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (body.referrer_reward_coins !== undefined) updates.referrerRewardCoins = body.referrer_reward_coins;
    if (body.referred_reward_coins !== undefined) updates.referredRewardCoins = body.referred_reward_coins;
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

export default admin;
