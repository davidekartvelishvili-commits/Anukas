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
  // FK link to source payment that created the coins for this game
  paymentTransactionId: text("payment_transaction_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  // FK to the payment that created these coins (for finance tracking)
  paymentTransactionId: text("payment_transaction_id"),
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
  bonusEveryN: integer("bonus_every_n").default(5).notNull(),
  bonusRewardCoins: integer("bonus_reward_coins").default(500).notNull(),
  signupRewardLari: integer("signup_reward_lari").default(10).notNull(),
  shareMessageTemplate: text("share_message_template"),
  shareImageUrl: text("share_image_url"),
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
  commissionEnabled: integer("commission_enabled", { mode: "boolean" }).default(true).notNull(),
  logoUrl: text("logo_url"),
  pinHash: text("pin_hash"),
  qrCode: text("qr_code").unique(),
  isActive: integer("is_active", { mode: "boolean" }).default(false).notNull(),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false).notNull(),
  contactPerson: text("contact_person"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  approvedAt: text("approved_at"),
  approvedBy: text("approved_by"),
});

export const offers = sqliteTable("offers", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").notNull().references(() => merchants.id),
  offerType: text("offer_type").notNull(), // 'featured' | 'flash' | 'partner'
  boostedRate: real("boosted_rate").notNull(),
  normalRate: real("normal_rate").default(0).notNull(),
  title: text("title"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
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
  // Commission lifecycle: pending → transferred → in_pool
  commissionStatus: text("commission_status").default("pending").notNull(),
  paymentReference: text("payment_reference"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const poolFundings = sqliteTable("pool_fundings", {
  id: text("id").primaryKey(),
  amount: real("amount").notNull(),
  adminId: text("admin_id").notNull(),
  note: text("note"),
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

// ═══════════════════════════════════════
// BIG WIN — admin-managed prize pool
// ═══════════════════════════════════════

export const bigWinConfig = sqliteTable("big_win_config", {
  id: text("id").primaryKey(),
  budgetPercent: real("budget_percent").default(30).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const bigWinPrizes = sqliteTable("big_win_prizes", {
  id: text("id").primaryKey(),
  amount: real("amount").notNull(),
  quantity: integer("quantity").notNull(),
  wonCount: integer("won_count").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const bigWinHistory = sqliteTable("big_win_history", {
  id: text("id").primaryKey(),
  prizeId: text("prize_id").notNull().references(() => bigWinPrizes.id),
  userId: text("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  wonAt: text("won_at").default(sql`(datetime('now'))`).notNull(),
});

// ═══════════════════════════════════════
// VILLAGE — gamification layer (levels, cards, attacks)
// ═══════════════════════════════════════

export const villageLevels = sqliteTable("village_levels", {
  id: text("id").primaryKey(),
  levelNumber: integer("level_number").notNull().unique(),
  starsRequired: integer("stars_required").notNull(),
  maxWinAmount: real("max_win_amount").notNull(),
  description: text("description"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// LEGACY (kept for migration compat — no longer used by new system)
export const villageCards = sqliteTable("village_cards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rarity: text("rarity").notNull(),
  imageUrl: text("image_url"),
  starValue: integer("star_value").notNull(),
  coinCost: integer("coin_cost").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// NEW: themed villages with 5 buildings, each upgradable through 4 star levels
export const villages = sqliteTable("villages", {
  id: text("id").primaryKey(),
  position: integer("position").notNull().unique(),
  name: text("name").notNull(),
  theme: text("theme"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const villageBuildings = sqliteTable("village_buildings", {
  id: text("id").primaryKey(),
  villageId: text("village_id").notNull().references(() => villages.id),
  position: integer("position").notNull(), // 1-5
  name: text("name").notNull(),
  star1Name: text("star1_name").notNull(),
  star1Cost: integer("star1_cost").notNull(),
  star1Image: text("star1_image"),
  star2Name: text("star2_name").notNull(),
  star2Cost: integer("star2_cost").notNull(),
  star2Image: text("star2_image"),
  star3Name: text("star3_name").notNull(),
  star3Cost: integer("star3_cost").notNull(),
  star3Image: text("star3_image"),
  star4Name: text("star4_name").notNull(),
  star4Cost: integer("star4_cost").notNull(),
  star4Image: text("star4_image"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const userVillageProgress = sqliteTable("user_village_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  villageId: text("village_id").notNull().references(() => villages.id),
  building1Stars: integer("b1_stars").default(0).notNull(),
  building2Stars: integer("b2_stars").default(0).notNull(),
  building3Stars: integer("b3_stars").default(0).notNull(),
  building4Stars: integer("b4_stars").default(0).notNull(),
  building5Stars: integer("b5_stars").default(0).notNull(),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  completedAt: text("completed_at"),
});

export const userVillageProfile = sqliteTable("user_village_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  currentLevel: integer("current_level").default(1).notNull(),
  totalStars: integer("total_stars").default(0).notNull(),
  shieldActiveUntil: text("shield_active_until"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const userCards = sqliteTable("user_cards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  cardId: text("card_id").notNull().references(() => villageCards.id),
  obtainedAt: text("obtained_at").default(sql`(datetime('now'))`).notNull(),
});

export const villageAttacks = sqliteTable("village_attacks", {
  id: text("id").primaryKey(),
  attackerId: text("attacker_id").notNull().references(() => users.id),
  victimId: text("victim_id").notNull().references(() => users.id),
  attackResult: text("attack_result").notNull(), // success | failed | blocked
  starsAwarded: integer("stars_awarded").default(0).notNull(),
  attackerLevel: integer("attacker_level").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const villageConfig = sqliteTable("village_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const simulationRuns = sqliteTable("simulation_runs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  userCount: integer("user_count").notNull(),
  minSpend: real("min_spend").notNull(),
  maxSpend: real("max_spend").notNull(),
  status: text("status").default("running").notNull(), // running | complete | error
  progress: integer("progress").default(0).notNull(),
  results: text("results"), // JSON blob
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  completedAt: text("completed_at"),
});
