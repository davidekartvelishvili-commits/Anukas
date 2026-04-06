import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").unique().notNull(),
  name: text("name"),
  pinHash: text("pin_hash"),
  balance: real("balance").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  totalReferrals: integer("total_referrals").default(0).notNull(),
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

export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id").notNull().references(() => users.id),
  referredId: text("referred_id").notNull().references(() => users.id),
  referralCode: text("referral_code").notNull(),
  rewardGivenToReferrer: integer("reward_given_to_referrer", { mode: "boolean" }).default(false).notNull(),
  rewardGivenToReferred: integer("reward_given_to_referred", { mode: "boolean" }).default(false).notNull(),
  referrerCoinsRewarded: integer("referrer_coins_rewarded").default(0).notNull(),
  referredCoinsRewarded: integer("referred_coins_rewarded").default(0).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const referralConfig = sqliteTable("referral_config", {
  id: text("id").primaryKey(),
  referrerRewardCoins: integer("referrer_reward_coins").default(200).notNull(),
  referredRewardCoins: integer("referred_reward_coins").default(100).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const promoCodes = sqliteTable("promo_codes", {
  id: text("id").primaryKey(),
  code: text("code").unique().notNull(),
  description: text("description"),
  coinRewardForUser: integer("coin_reward_for_user").notNull(),
  coinRewardForCreator: integer("coin_reward_for_creator").default(0).notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0).notNull(),
  maxUsesPerUser: integer("max_uses_per_user").default(1).notNull(),
  startsAt: text("starts_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdBy: text("created_by").references(() => admins.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const promoCodeUses = sqliteTable("promo_code_uses", {
  id: text("id").primaryKey(),
  promoCodeId: text("promo_code_id").notNull().references(() => promoCodes.id),
  userId: text("user_id").notNull().references(() => users.id),
  coinsRewarded: integer("coins_rewarded").notNull(),
  usedAt: text("used_at").default(sql`(datetime('now'))`).notNull(),
});

export const merchants = sqliteTable("merchants", {
  id: text("id").primaryKey(),
  merchantCode: text("merchant_code").unique(),
  businessName: text("business_name").notNull(),
  businessNameKa: text("business_name_ka"),
  category: text("category").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  commissionPercent: real("commission_percent").default(3.0).notNull(),
  pinHash: text("pin_hash"),
  qrCode: text("qr_code").unique(),
  isActive: integer("is_active", { mode: "boolean" }).default(false).notNull(),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false).notNull(),
  contactPerson: text("contact_person"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  approvedAt: text("approved_at"),
  approvedBy: text("approved_by"),
});

export const pendingPayments = sqliteTable("pending_payments", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").notNull().references(() => merchants.id),
  amount: real("amount").notNull(),
  status: text("status").default("pending").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const paymentTransactions = sqliteTable("payment_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  merchantId: text("merchant_id").notNull().references(() => merchants.id),
  amount: real("amount").notNull(),
  commissionAmount: real("commission_amount").notNull(),
  merchantAmount: real("merchant_amount").notNull(),
  coinsAwarded: integer("coins_awarded").notNull(),
  status: text("status").default("completed").notNull(),
  paymentReference: text("payment_reference"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const withdrawals = sqliteTable("withdrawals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  iban: text("iban").notNull(),
  bankName: text("bank_name"),
  accountHolderName: text("account_holder_name").notNull(),
  status: text("status").default("pending").notNull(),
  adminNote: text("admin_note"),
  processedBy: text("processed_by"),
  processedAt: text("processed_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const systemConfig = sqliteTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});
