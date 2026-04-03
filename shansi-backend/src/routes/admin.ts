import { Hono } from "hono";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AdminEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { admins, gameConfig, pool, gameHistory, adminLogs, users, otpRateLimits } from "../db/schema.js";
import { adminMiddleware } from "../middleware/admin.js";
import { getEnv } from "../utils/env.js";
import { BadRequestError, UnauthorizedError, RateLimitError } from "../utils/errors.js";

const admin = new Hono<AdminEnv>();

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
  isActive: z.boolean().optional(),
});

// Helper: log admin action
async function logAction(adminId: string, action: string, details?: string) {
  const db = getDb();
  await db.insert(adminLogs).values({ id: nanoid(), adminId, action, details: details || null });
}

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
    admin: { id: a.id, email: a.email, name: a.name, role: a.role },
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
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = c.req.query("search");

  const allUsers = await db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));
  const totalUsers = await db.select().from(users);

  return c.json({
    success: true,
    users: allUsers.map((u) => ({ id: u.id, phone: u.phone, name: u.name, balance: u.balance, isActive: u.isActive, createdAt: u.createdAt })),
    pagination: { page, limit, total: totalUsers.length },
  });
});

// GET /admin/users/:id
admin.get("/users/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id") as string;
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return c.json({ success: false, message: "User not found" }, 404);

  const history = await db.select().from(gameHistory).where(eq(gameHistory.userId, id as string)).orderBy(desc(gameHistory.createdAt)).limit(50);

  return c.json({
    success: true,
    user: { id: user.id, phone: user.phone, name: user.name, balance: user.balance, isActive: user.isActive, createdAt: user.createdAt },
    gameHistory: history,
  });
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

export default admin;
