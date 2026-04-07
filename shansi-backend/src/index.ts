import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sql } from "drizzle-orm";
import auth from "./routes/auth.js";
import user from "./routes/user.js";
import admin from "./routes/admin.js";
import games from "./routes/games.js";
import merchant from "./routes/merchant.js";
import village from "./routes/village.js";
import { AppError } from "./utils/errors.js";
import { getEnv } from "./utils/env.js";
import { getDb } from "./db/client.js";

// Run schema migrations at startup so newly added columns/tables exist
// before any Drizzle SELECT * queries hit them.
async function runStartupMigrations() {
  const db = getDb();
  const statements = [
    sql`CREATE TABLE IF NOT EXISTS pool_fundings (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      admin_id TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS simulation_runs (
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
    )`,
    sql`ALTER TABLE payment_transactions ADD COLUMN commission_status TEXT NOT NULL DEFAULT 'pending'`,
    sql`ALTER TABLE game_history ADD COLUMN payment_transaction_id TEXT`,
    sql`ALTER TABLE transactions ADD COLUMN payment_transaction_id TEXT`,
    // ── Village system tables ──
    sql`CREATE TABLE IF NOT EXISTS village_levels (
      id TEXT PRIMARY KEY,
      level_number INTEGER NOT NULL UNIQUE,
      stars_required INTEGER NOT NULL,
      max_win_amount REAL NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS village_cards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rarity TEXT NOT NULL,
      image_url TEXT,
      star_value INTEGER NOT NULL,
      coin_cost INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS user_village_profile (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
      current_level INTEGER NOT NULL DEFAULT 1,
      total_stars INTEGER NOT NULL DEFAULT 0,
      shield_active_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS user_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      card_id TEXT NOT NULL REFERENCES village_cards(id),
      obtained_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS village_attacks (
      id TEXT PRIMARY KEY,
      attacker_id TEXT NOT NULL REFERENCES users(id),
      victim_id TEXT NOT NULL REFERENCES users(id),
      attack_result TEXT NOT NULL,
      stars_awarded INTEGER NOT NULL DEFAULT 0,
      attacker_level INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS village_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    // ── Big Win tables ──
    sql`CREATE TABLE IF NOT EXISTS big_win_config (
      id TEXT PRIMARY KEY,
      budget_percent REAL NOT NULL DEFAULT 30,
      trigger_chance_percent REAL NOT NULL DEFAULT 0.1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS big_win_prizes (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      quantity INTEGER NOT NULL,
      won_count INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS big_win_history (
      id TEXT PRIMARY KEY,
      prize_id TEXT NOT NULL REFERENCES big_win_prizes(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      won_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ];
  for (const s of statements) {
    try { await (db as any).run(s); } catch (e: any) {
      if (!/duplicate column|already exists/i.test(e.message || "")) {
        console.error("[startup migration]", e.message);
      }
    }
  }

  // Seed default village data if empty
  try {
    const lvls = await (db as any).all(sql`SELECT COUNT(*) as c FROM village_levels`);
    const count = lvls?.rows?.[0]?.c ?? lvls?.[0]?.c ?? 0;
    if (count === 0) {
      const defaults = [
        { lvl: 1, stars: 0, max: 1, desc: "Starter" },
        { lvl: 2, stars: 10, max: 2, desc: "" },
        { lvl: 3, stars: 30, max: 3, desc: "" },
        { lvl: 4, stars: 60, max: 5, desc: "" },
        { lvl: 5, stars: 100, max: 7, desc: "" },
        { lvl: 6, stars: 150, max: 10, desc: "" },
        { lvl: 7, stars: 220, max: 15, desc: "" },
        { lvl: 8, stars: 300, max: 20, desc: "" },
        { lvl: 9, stars: 400, max: 30, desc: "" },
        { lvl: 10, stars: 500, max: 50, desc: "" },
      ];
      for (const d of defaults) {
        await (db as any).run(sql`INSERT INTO village_levels (id, level_number, stars_required, max_win_amount, description) VALUES (${"lvl_" + d.lvl}, ${d.lvl}, ${d.stars}, ${d.max}, ${d.desc})`);
      }
      console.log("[startup] seeded 10 default village levels");
    }
    const cards = await (db as any).all(sql`SELECT COUNT(*) as c FROM village_cards`);
    const cardCount = cards?.rows?.[0]?.c ?? cards?.[0]?.c ?? 0;
    if (cardCount === 0) {
      const defaultCards = [
        { name: "Common Pack", rarity: "common", stars: 1, cost: 50 },
        { name: "Rare Pack", rarity: "rare", stars: 3, cost: 150 },
        { name: "Epic Pack", rarity: "epic", stars: 10, cost: 400 },
        { name: "Legendary Pack", rarity: "legendary", stars: 30, cost: 1000 },
      ];
      for (const c of defaultCards) {
        await (db as any).run(sql`INSERT INTO village_cards (id, name, rarity, star_value, coin_cost) VALUES (${"card_" + c.rarity}, ${c.name}, ${c.rarity}, ${c.stars}, ${c.cost})`);
      }
      console.log("[startup] seeded 4 default village cards");
    }
    // Default village config
    const configDefaults = [
      ["shield_cost_stars", "50"],
      ["attack_cards_needed", "3"],
      ["attack_star_bonus", "15"],
      ["attack_success_rate", "50"],
    ];
    for (const [k, v] of configDefaults) {
      try { await (db as any).run(sql`INSERT INTO village_config (key, value) VALUES (${k}, ${v})`); } catch {}
    }
    // Default big win config (single row)
    try {
      await (db as any).run(sql`INSERT INTO big_win_config (id, budget_percent) VALUES ('main', 30)`);
    } catch {}
  } catch (e: any) {
    console.error("[startup seed]", e.message);
  }

  console.log("[startup] migrations applied");
}

const app = new Hono();

// ── Middleware ──
app.use("*", cors({
  origin: (origin) => {
    const allowed = [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

    // Allow all Vercel preview deployments
    if (origin && origin.endsWith(".vercel.app")) return origin;
    if (origin && allowed.includes(origin)) return origin;
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return "*";
    return allowed[0] || "*";
  },
  allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use("*", logger());

// ── Request timing ──
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  c.header("X-Response-Time", `${ms}ms`);
});

// ── Routes ──
app.route("/auth", auth);
app.route("/user", user);
app.route("/admin", admin);
app.route("/games", games);
app.route("/merchant", merchant);
app.route("/village", village);

// ── Health check ──
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Global error handler ──
app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`);

  if (err instanceof AppError) {
    return c.json({ success: false, message: err.message }, err.statusCode as any);
  }

  const status = 500;
  const message = getEnv().NODE_ENV === "production" ? "Internal server error" : err.message;
  return c.json({ success: false, message }, status);
});

// ── 404 ──
app.notFound((c) => {
  return c.json({ success: false, message: "Not found" }, 404);
});

// ── Start ──
const env = getEnv();
const port = parseInt(env.PORT);

runStartupMigrations()
  .catch((e) => console.error("[startup migration fatal]", e))
  .finally(() => {
    serve({ fetch: app.fetch, port }, () => {
      console.log(`Shansi backend running on http://localhost:${port}`);
    });
  });
