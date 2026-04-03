import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").unique().notNull(),
  name: text("name"),
  pinHash: text("pin_hash"),
  balance: real("balance").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull(),
  deviceInfo: text("device_info"),
  isValid: integer("is_valid", { mode: "boolean" }).default(true).notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const otpRateLimits = sqliteTable("otp_rate_limits", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  windowStart: text("window_start").default(sql`(datetime('now'))`).notNull(),
});

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role").default("admin").notNull(),
  permissions: text("permissions"), // JSON array of allowed pages e.g. ["dashboard","users","games"]
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const gameConfig = sqliteTable("game_config", {
  id: text("id").primaryKey(),
  gameType: text("game_type").notNull(),
  avgReturnPercent: real("avg_return_percent").default(85).notNull(),
  maxWinPerUser: real("max_win_per_user").default(100).notNull(),
  poolMinimumThreshold: real("pool_minimum_threshold").default(1000).notNull(),
  fullReturnThreshold: real("full_return_threshold").default(5).notNull(),
  minReturnPercent: real("min_return_percent").default(0.5).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const pool = sqliteTable("pool", {
  id: text("id").primaryKey(),
  balance: real("balance").default(0).notNull(),
  totalFunded: real("total_funded").default(0).notNull(),
  totalWon: real("total_won").default(0).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const gameHistory = sqliteTable("game_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull(),
  betAmount: real("bet_amount").notNull(),
  winAmount: real("win_amount").notNull(),
  poolBalanceBefore: real("pool_balance_before"),
  poolBalanceAfter: real("pool_balance_after"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  paymentAmount: real("payment_amount").notNull(),
  coinsReceived: integer("coins_received").notNull(),
  coinsRemaining: integer("coins_remaining").notNull(),
  totalCashWon: real("total_cash_won").default(0).notNull(),
  guaranteedMinimum: real("guaranteed_minimum").notNull(),
  guaranteeMet: integer("guarantee_met", { mode: "boolean" }).default(false).notNull(),
  bonusGamesGiven: integer("bonus_games_given").default(0).notNull(),
  bonusWinsPlan: text("bonus_wins_plan"),
  bonusGamesPlayed: integer("bonus_games_played").default(0).notNull(),
  bonusGamesTotal: integer("bonus_games_total").default(0).notNull(),
  status: text("status").default("active").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  completedAt: text("completed_at"),
});

export const adminLogs = sqliteTable("admin_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull().references(() => admins.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});
