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
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  console.log("Migrations complete");
  process.exit(0);
}

migrate().catch(console.error);
