import { Hono } from "hono";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { gameConfig, gameHistory } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { playGame } from "../services/gameEngine.js";
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

    return c.json({
      success: true,
      result: {
        won: result.won,
        minWin: result.minWin,
        bonusWin: result.bonusWin,
        totalWin: result.totalWin,
        newBalance: result.newBalance,
      },
    });
  } catch (err: any) {
    throw new BadRequestError(err.message || "Game play failed");
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

export default games;
