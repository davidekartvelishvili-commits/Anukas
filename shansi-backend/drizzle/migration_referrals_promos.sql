-- Referral & Promo Code Migration
-- Run this against your Turso database

-- Add referral columns to users table
ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN referred_by TEXT;
ALTER TABLE users ADD COLUMN total_referrals INTEGER DEFAULT 0 NOT NULL;

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL REFERENCES users(id),
  referred_id TEXT NOT NULL REFERENCES users(id),
  referral_code TEXT NOT NULL,
  reward_given_to_referrer INTEGER DEFAULT 0 NOT NULL,
  reward_given_to_referred INTEGER DEFAULT 0 NOT NULL,
  referrer_coins_rewarded INTEGER DEFAULT 0 NOT NULL,
  referred_coins_rewarded INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Referral config
CREATE TABLE IF NOT EXISTS referral_config (
  id TEXT PRIMARY KEY,
  referrer_reward_coins INTEGER DEFAULT 200 NOT NULL,
  referred_reward_coins INTEGER DEFAULT 100 NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  coin_reward_for_user INTEGER NOT NULL,
  coin_reward_for_creator INTEGER DEFAULT 0 NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0 NOT NULL,
  max_uses_per_user INTEGER DEFAULT 1 NOT NULL,
  starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,
  created_by TEXT REFERENCES admins(id),
  created_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Promo code uses
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id TEXT PRIMARY KEY,
  promo_code_id TEXT NOT NULL REFERENCES promo_codes(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  coins_rewarded INTEGER NOT NULL,
  used_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Seed referral config
INSERT OR IGNORE INTO referral_config (id, referrer_reward_coins, referred_reward_coins, is_active, updated_at)
VALUES ('default', 200, 100, 1, datetime('now'));
