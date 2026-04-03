import "dotenv/config";
import { createClient } from "@libsql/client";
import { getEnv } from "../utils/env.js";

async function migrate() {
  const env = getEnv();
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      pin_hash TEXT,
      balance REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token TEXT NOT NULL,
      device_info TEXT,
      is_valid INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS otp_rate_limits (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      window_start TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS game_config (
      id TEXT PRIMARY KEY,
      game_type TEXT NOT NULL,
      avg_return_percent REAL NOT NULL DEFAULT 85,
      max_win_per_user REAL NOT NULL DEFAULT 100,
      pool_minimum_threshold REAL NOT NULL DEFAULT 1000,
      full_return_threshold REAL NOT NULL DEFAULT 5,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS pool (
      id TEXT PRIMARY KEY,
      balance REAL NOT NULL DEFAULT 0,
      total_funded REAL NOT NULL DEFAULT 0,
      total_won REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS game_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      game_type TEXT NOT NULL,
      bet_amount REAL NOT NULL,
      win_amount REAL NOT NULL,
      pool_balance_before REAL,
      pool_balance_after REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `ALTER TABLE admins ADD COLUMN permissions TEXT`,
    `ALTER TABLE game_config ADD COLUMN min_return_percent REAL NOT NULL DEFAULT 0.5`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      payment_amount REAL NOT NULL,
      coins_received INTEGER NOT NULL,
      coins_remaining INTEGER NOT NULL,
      total_cash_won REAL NOT NULL DEFAULT 0,
      guaranteed_minimum REAL NOT NULL,
      guarantee_met INTEGER NOT NULL DEFAULT 0,
      bonus_games_given INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL REFERENCES admins(id),
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ];

  for (const s of statements) {
    try { await client.execute(s); } catch (e: any) {
      // Ignore "duplicate column" errors from ALTER TABLE
      if (!e.message?.includes("duplicate column")) throw e;
    }
  }

  console.log("Migrations complete");
  process.exit(0);
}

migrate().catch(console.error);
