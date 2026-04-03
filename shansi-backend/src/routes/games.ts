import { Hono } from "hono";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { gameConfig, gameHistory } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { playGame, playChickenRush } from "../services/gameEngine.js";
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

export default games;
