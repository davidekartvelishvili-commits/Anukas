import { Hono } from "hono";
import { z } from "zod";
import { eq, and, or, desc } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { users, transactions } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { BadRequestError } from "../utils/errors.js";

const user = new Hono<AppEnv>();

user.use("*", authMiddleware);

const updateSchema = z.object({
  name: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

// ── GET /user/profile ──
user.get("/profile", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();

  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return c.json({ success: false, message: "Not found" }, 404);

  // Get coin balance from active transaction
  const [activeTx] = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
    .orderBy(desc(transactions.createdAt)).limit(1);

  return c.json({
    success: true,
    user: {
      id: u.id,
      phone: u.phone,
      name: u.name,
      balance: u.balance,
      coinBalance: activeTx?.coinsRemaining || 0,
      hasPin: !!u.pinHash,
      isActive: u.isActive,
      createdAt: u.createdAt,
    },
  });
});

// ── PATCH /user/profile ──
user.patch("/profile", async (c) => {
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0].message);
  }

  const userId = c.get("userId") as string;
  const db = getDb();

  const updates: Record<string, string> = { updatedAt: new Date().toISOString() };
  if (parsed.data.name) updates.name = parsed.data.name;

  await db.update(users).set(updates).where(eq(users.id, userId));

  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return c.json({
    success: true,
    user: {
      id: u.id,
      phone: u.phone,
      name: u.name,
      balance: u.balance,
      hasPin: !!u.pinHash,
    },
  });
});

export default user;
