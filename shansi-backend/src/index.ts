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
  ];
  for (const s of statements) {
    try { await (db as any).run(s); } catch (e: any) {
      // duplicate column / table already exists — ignore
      if (!/duplicate column|already exists/i.test(e.message || "")) {
        console.error("[startup migration]", e.message);
      }
    }
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
