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
import attacks from "./routes/attacks.js";
import { offersRoute } from "./routes/offers.js";
import { publicRoute } from "./routes/public.js";
import { AppError } from "./utils/errors.js";
import { getEnv } from "./utils/env.js";
import { getDb } from "./db/client.js";
import { merchants, merchantBranches, merchantReviews, merchantProducts, users } from "./db/schema.js";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

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
    sql`ALTER TABLE merchants ADD COLUMN commission_enabled INTEGER NOT NULL DEFAULT 1`,
    sql`ALTER TABLE merchants ADD COLUMN logo_url TEXT`,
    sql`ALTER TABLE merchants ADD COLUMN show_on_promos INTEGER NOT NULL DEFAULT 0`,
    sql`ALTER TABLE merchants ADD COLUMN rating REAL DEFAULT 0`,
    sql`ALTER TABLE merchant_products ADD COLUMN position INTEGER NOT NULL DEFAULT 0`,
    sql`CREATE TABLE IF NOT EXISTS merchant_reviews (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchants(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      payment_transaction_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS merchant_branches (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchants(id),
      name TEXT NOT NULL,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS merchant_products (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchants(id),
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`ALTER TABLE referral_config ADD COLUMN bonus_every_n INTEGER NOT NULL DEFAULT 5`,
    sql`ALTER TABLE referral_config ADD COLUMN bonus_reward_coins INTEGER NOT NULL DEFAULT 500`,
    sql`ALTER TABLE referral_config ADD COLUMN signup_reward_lari INTEGER NOT NULL DEFAULT 10`,
    sql`ALTER TABLE referral_config ADD COLUMN share_message_template TEXT`,
    sql`ALTER TABLE referral_config ADD COLUMN share_image_url TEXT`,
    sql`ALTER TABLE tickets ADD COLUMN logo_url TEXT`,
    sql`ALTER TABLE users ADD COLUMN stage_name TEXT`,
    sql`ALTER TABLE tickets ADD COLUMN merchant_id TEXT`,
    sql`ALTER TABLE user_village_profile ADD COLUMN balls_dropped INTEGER NOT NULL DEFAULT 0`,
    sql`CREATE TABLE IF NOT EXISTS user_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      ticket_id TEXT NOT NULL REFERENCES tickets(id),
      qr_code TEXT NOT NULL UNIQUE,
      activated_at TEXT NOT NULL DEFAULT (datetime('now')),
      redeemed_at TEXT,
      redeemed_by_merchant_id TEXT REFERENCES merchants(id),
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE INDEX IF NOT EXISTS idx_user_tickets_user ON user_tickets(user_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_user_tickets_qr ON user_tickets(qr_code)`,
    sql`CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      emoji TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      title_ka TEXT NOT NULL,
      brand TEXT NOT NULL,
      validity TEXT NOT NULL,
      type TEXT NOT NULL,
      price TEXT NOT NULL,
      bonus TEXT NOT NULL,
      person_name TEXT NOT NULL,
      screen TEXT,
      row_label TEXT,
      seat TEXT,
      serial TEXT NOT NULL,
      social TEXT,
      terms_json TEXT NOT NULL DEFAULT '[]',
      website TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchants(id),
      offer_type TEXT NOT NULL,
      boosted_rate REAL NOT NULL,
      normal_rate REAL NOT NULL DEFAULT 0,
      title TEXT,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
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
    // ── New Village system (themed villages with buildings) ──
    sql`CREATE TABLE IF NOT EXISTS villages (
      id TEXT PRIMARY KEY,
      position INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      theme TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS village_buildings (
      id TEXT PRIMARY KEY,
      village_id TEXT NOT NULL REFERENCES villages(id),
      position INTEGER NOT NULL,
      name TEXT NOT NULL,
      star1_name TEXT NOT NULL,
      star1_cost INTEGER NOT NULL,
      star1_image TEXT,
      star2_name TEXT NOT NULL,
      star2_cost INTEGER NOT NULL,
      star2_image TEXT,
      star3_name TEXT NOT NULL,
      star3_cost INTEGER NOT NULL,
      star3_image TEXT,
      star4_name TEXT NOT NULL,
      star4_cost INTEGER NOT NULL,
      star4_image TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE TABLE IF NOT EXISTS user_village_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      village_id TEXT NOT NULL REFERENCES villages(id),
      b1_stars INTEGER NOT NULL DEFAULT 0,
      b2_stars INTEGER NOT NULL DEFAULT 0,
      b3_stars INTEGER NOT NULL DEFAULT 0,
      b4_stars INTEGER NOT NULL DEFAULT 0,
      b5_stars INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    )`,
    // ── Attack system v2 ──
    sql`ALTER TABLE user_village_profile ADD COLUMN attack_charges INTEGER NOT NULL DEFAULT 0`,
    sql`ALTER TABLE user_village_profile ADD COLUMN shield_count INTEGER NOT NULL DEFAULT 0`,
    sql`ALTER TABLE users ADD COLUMN last_attack_seen_at TEXT`,
    sql`CREATE TABLE IF NOT EXISTS attack_sessions (
      id TEXT PRIMARY KEY,
      attacker_id TEXT NOT NULL REFERENCES users(id),
      defender_id TEXT NOT NULL REFERENCES users(id),
      defender_coin_snapshot INTEGER NOT NULL,
      coins_hidden_total INTEGER NOT NULL,
      item_a_position INTEGER NOT NULL,
      item_a_coins INTEGER NOT NULL,
      item_b_position INTEGER NOT NULL,
      item_b_coins INTEGER NOT NULL,
      attacks_used INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    )`,
    sql`CREATE TABLE IF NOT EXISTS attack_attempts (
      id TEXT PRIMARY KEY,
      attack_session_id TEXT NOT NULL REFERENCES attack_sessions(id),
      attempt_number INTEGER NOT NULL,
      picked_position INTEGER NOT NULL,
      outcome TEXT NOT NULL,
      coins_transferred INTEGER NOT NULL DEFAULT 0,
      shield_consumed INTEGER NOT NULL DEFAULT 0,
      item_burned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE INDEX IF NOT EXISTS idx_attack_sessions_attacker ON attack_sessions(attacker_id, created_at)`,
    sql`CREATE INDEX IF NOT EXISTS idx_attack_sessions_defender ON attack_sessions(defender_id, created_at)`,
    sql`CREATE INDEX IF NOT EXISTS idx_attack_attempts_session ON attack_attempts(attack_session_id)`,
    // ── Page views analytics ──
    sql`CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      referrer TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      user_agent TEXT,
      country TEXT,
      device_type TEXT,
      screen_width INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    sql`CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at)`,
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
      // Milestone rewards: grant a shield every N plinko drops, an
      // attack card every M drops. 0 disables the reward.
      ["balls_per_shield", "50"],
      ["balls_per_attack_card", "25"],
      ["shield_reward_hours", "24"],
    ];
    for (const [k, v] of configDefaults) {
      try { await (db as any).run(sql`INSERT INTO village_config (key, value) VALUES (${k}, ${v})`); } catch {}
    }
    // Default big win config (single row)
    try {
      await (db as any).run(sql`INSERT INTO big_win_config (id, budget_percent) VALUES ('main', 30)`);
    } catch {}

    // Seed 5 default villages with their 5 buildings each
    const vCount = await (db as any).all(sql`SELECT COUNT(*) as c FROM villages`);
    const vc = vCount?.rows?.[0]?.c ?? vCount?.[0]?.c ?? 0;
    if (vc === 0) {
      const villages = [
        { pos: 1, name: "ქართული სოფელი", theme: "georgian", buildings: ["სახლი", "ეკლესია", "ძეგლი", "ბაღი", "ფერმა"] },
        { pos: 2, name: "ეგვიპტე", theme: "egyptian", buildings: ["პირამიდა", "სფინქსი", "ტაძარი", "ობელისკი", "ოაზისი"] },
        { pos: 3, name: "იაპონია", theme: "japanese", buildings: ["პაგოდა", "ციხე", "ტორი", "ბაღი", "სახლი"] },
        { pos: 4, name: "შუა საუკუნეები", theme: "medieval", buildings: ["ციხე", "ტავერნა", "ეკლესია", "ბაზარი", "კოშკი"] },
        { pos: 5, name: "მომავალი", theme: "futuristic", buildings: ["ცათამბჯენი", "სადგური", "ლაბორატორია", "გუმბათი", "ფაბრიკა"] },
      ];
      // Star costs scale per village level: village 1 starts at 50, village 2 at 100, etc.
      for (const v of villages) {
        const vid = `village_${v.pos}`;
        await (db as any).run(sql`INSERT INTO villages (id, position, name, theme) VALUES (${vid}, ${v.pos}, ${v.name}, ${v.theme})`);
        for (let i = 0; i < 5; i++) {
          const bname = v.buildings[i];
          const base = 50 * v.pos; // village multiplier
          await (db as any).run(sql`INSERT INTO village_buildings (
            id, village_id, position, name,
            star1_name, star1_cost,
            star2_name, star2_cost,
            star3_name, star3_cost,
            star4_name, star4_cost
          ) VALUES (
            ${`b_${v.pos}_${i + 1}`}, ${vid}, ${i + 1}, ${bname},
            ${bname + " ⭐"}, ${base},
            ${bname + " ⭐⭐"}, ${base * 2},
            ${bname + " ⭐⭐⭐"}, ${base * 4},
            ${bname + " ⭐⭐⭐⭐"}, ${base * 8}
          )`);
        }
      }
      console.log("[startup] seeded 5 default villages with 25 buildings");
    }
  } catch (e: any) {
    console.error("[startup seed]", e.message);
  }

  // Backfill stage names for existing users who don't have one and
  // haven't set a custom username. Runs on every startup but is
  // idempotent — only touches rows where stage_name IS NULL.
  try {
    const { randomStageName } = await import("./utils/stageNames.js");
    const missing = await (db as any).all(sql`SELECT id FROM users WHERE stage_name IS NULL`);
    const rows = missing?.rows || missing || [];
    for (const row of rows) {
      const uid = row.id || (row as any)[0];
      if (!uid) continue;
      await (db as any).run(sql`UPDATE users SET stage_name = ${randomStageName()} WHERE id = ${uid} AND stage_name IS NULL`);
    }
    if (rows.length) console.log(`[startup] backfilled stage names for ${rows.length} users`);
  } catch (e: any) {
    console.error("[startup stage-name backfill]", e.message);
  }

  // One-time admin password reset — remove after deploy
  try {
    await (db as any).run(sql`UPDATE admins SET password_hash = '$2a$10$QvfyDk/nixFQ8KZSViJWAukUwZJCF8aZF/Hrr3.gi6TlzbrqkNrIu' WHERE email = 'ukleba21@gmail.com'`);
    console.log("[startup] admin password reset for ukleba21@gmail.com");
  } catch {}

  // One-time: seed McDonald's branches (Tbilisi)
  try {
    const [mcD] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.businessName, "McDonald's")).limit(1);
    if (mcD) {
      // Delete old branches and re-seed with correct addresses
      await db.delete(merchantBranches).where(eq(merchantBranches.merchantId, mcD.id));
      const branches = [
        { name: "McDonald's — კაკაბაძეების", address: "ძმები კაკაბაძეების ქ. 1", lat: 41.6970, lng: 44.8013 },
        { name: "McDonald's — Galleria", address: "შოთა რუსთაველის გამზირი 2/4, Galleria Tbilisi", lat: 41.6934, lng: 44.8015 },
        { name: "McDonald's — მარჯანიშვილი", address: "კოტე მარჯანიშვილის ქუჩა", lat: 41.6921, lng: 44.7977 },
        { name: "McDonald's — წერეთელი", address: "აკაკი წერეთლის გამზირი 18", lat: 41.7175, lng: 44.7833 },
        { name: "McDonald's — კოსტავა", address: "მერაბ კოსტავას ქუჩა", lat: 41.7145, lng: 44.7725 },
        { name: "McDonald's — ვაკე", address: "დიმიტრი არაყიშვილის ქ. 3", lat: 41.7088, lng: 44.7587 },
        { name: "McDonald's Riverside", address: "ლევან გოთუას ქ. 7", lat: 41.7210, lng: 44.7620 },
        { name: "McDonald's — გლდანი", address: "ომარ ხიზანიშვილის ქ. 5", lat: 41.7795, lng: 44.8135 },
        { name: "McDonald's — ბალანჩინი", address: "გიორგი ბალანჩინის ქ. 11", lat: 41.7260, lng: 44.7470 },
        { name: "McDonald's — East Point", address: "ალექსანდრე თვალჭრელიძის ქ. 2, East Point", lat: 41.7260, lng: 44.8584 },
        { name: "McDonald's — ნავთლუღი", address: "ნავთლუღის ქ. 8ა", lat: 41.7350, lng: 44.8420 },
        { name: "McDonald's — ორხევი", address: "ორხევის დასახლება", lat: 41.7580, lng: 44.7280 },
        { name: "McDonald's — აღმაშენებელი", address: "დავით აღმაშენებლის ხეივანი", lat: 41.6880, lng: 44.8100 },
        { name: "McDonald's — ქავთარაძე", address: "პეტრე ქავთარაძის ქ. 1", lat: 41.7320, lng: 44.7680 },
      ];
      for (const b of branches) {
        await db.insert(merchantBranches).values({ id: nanoid(), merchantId: mcD.id, ...b });
      }
      console.log("[startup] seeded McDonald's branches (14 locations)");
    }
    // Seed Kvarts Coffee branch
    const [kv] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.businessName, "Kvarts Coffee")).limit(1);
    if (kv) {
      const existing = await db.select().from(merchantBranches).where(eq(merchantBranches.merchantId, kv.id)).limit(1);
      if (existing.length === 0) {
        await db.delete(merchantBranches).where(eq(merchantBranches.merchantId, kv.id));
        await db.insert(merchantBranches).values({ id: nanoid(), merchantId: kv.id, name: "Kvarts Coffee", address: "შოთა რუსთაველის გამზირი 26", lat: 41.7005, lng: 44.7955 });
        console.log("[startup] seeded Kvarts Coffee branch");
      }
    }
    // Fix CHIKA Georgian name
    await (db as any).run(sql`UPDATE merchants SET business_name_ka = 'ჭიქა რუსთაველი' WHERE business_name = 'CHIKA Rustaveli'`);

    // Seed CHIKA Rustaveli — approve, enable promos, add branch, products, reviews
    const [chika] = await db.select({ id: merchants.id, isActive: merchants.isActive }).from(merchants).where(eq(merchants.businessName, "CHIKA Rustaveli")).limit(1);
    if (chika) {
      // Approve if not active
      if (!chika.isActive) {
        const [maxCode] = await db.select({ code: merchants.merchantCode }).from(merchants).orderBy(desc(merchants.merchantCode)).limit(1);
        const maxNum = maxCode?.code ? parseInt(maxCode.code.replace("SH-", "")) : 0;
        await db.update(merchants).set({
          isActive: true,
          showOnPromos: true,
          rating: 4.5,
          merchantCode: `SH-${String(maxNum + 1).padStart(5, "0")}`,
          approvedAt: new Date().toISOString(),
        }).where(eq(merchants.id, chika.id));
        console.log("[startup] approved CHIKA Rustaveli");
      }
      // Ensure showOnPromos is on
      await db.update(merchants).set({ showOnPromos: true, rating: 4.5 }).where(eq(merchants.id, chika.id));

      // Branch
      const existingBranches = await db.select().from(merchantBranches).where(eq(merchantBranches.merchantId, chika.id)).limit(1);
      if (existingBranches.length === 0) {
        await db.insert(merchantBranches).values({ id: nanoid(), merchantId: chika.id, name: "CHIKA Rustaveli", address: "მერაბ კოსტავას ქ. 9", lat: 41.7103, lng: 44.7932 });
        console.log("[startup] seeded CHIKA branch");
      }

      // Products
      const existingProducts = await db.select().from(merchantProducts).where(eq(merchantProducts.merchantId, chika.id)).limit(1);
      if (existingProducts.length === 0) {
        const chikaProducts = [
          { name: "ავოკადო ტოსტი", price: 14.90, sortOrder: 0 },
          { name: "პანკეიკი", price: 12.50, sortOrder: 0 },
          { name: "", price: 8.90, sortOrder: 1 },
          { name: "", price: 6.50, sortOrder: 1 },
          { name: "ბენედიქტი", price: 16.90, sortOrder: 0 },
        ];
        for (const p of chikaProducts) {
          await db.insert(merchantProducts).values({ id: nanoid(), merchantId: chika.id, name: p.name, price: p.price, sortOrder: p.sortOrder });
        }
        console.log("[startup] seeded CHIKA products");
      }
    }
  } catch (e: any) { console.error("[startup] branch seed error:", e.message); }

  // One-time: seed realistic reviews for merchants
  try {
    const existingReviews = await db.select().from(merchantReviews).limit(1);
    if (existingReviews.length === 0) {
      // Get some real users to attribute reviews to
      const realUsers = await db.select({ id: users.id, name: users.name }).from(users).limit(6);
      if (realUsers.length >= 2) {
        const [mcD] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.businessName, "McDonald's")).limit(1);
        const [kv] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.businessName, "Kvarts Coffee")).limit(1);

        if (mcD) {
          const mcdReviews = [
            { rating: 5, comment: "ძალიან გემრიელი ბურგერებია, მომსახურებაც შესანიშნავი იყო. ყოველთვის სიამოვნებით ვსტუმრობ!" },
            { rating: 4, comment: "კარტოფილი ფრი ისეთივე გემრიელია როგორც ყოველთვის. სწრაფი მომსახურება, სუფთა გარემო." },
            { rating: 5, comment: "საუკეთესო ფასტფუდი თბილისში. ბავშვებს განსაკუთრებით უყვართ, ოჯახური გარემოა." },
          ];
          for (let i = 0; i < mcdReviews.length && i < realUsers.length; i++) {
            await db.insert(merchantReviews).values({
              id: nanoid(), merchantId: mcD.id, userId: realUsers[i].id,
              paymentTransactionId: `seed-mcd-${i}`, rating: mcdReviews[i].rating, comment: mcdReviews[i].comment,
            });
          }
          const avgMcd = mcdReviews.reduce((s, r) => s + r.rating, 0) / mcdReviews.length;
          await db.update(merchants).set({ rating: Math.round(avgMcd * 10) / 10 }).where(eq(merchants.id, mcD.id));
          console.log("[startup] seeded McDonald's reviews");
        }

        if (kv) {
          const kvReviews = [
            { rating: 5, comment: "საოცარი ყავაა! ბარისტები ძალიან პროფესიონალები არიან, ატმოსფეროც ძალიან სასიამოვნოა." },
            { rating: 5, comment: "თბილისის საუკეთესო ყავა! ლატე უბრალოდ ზეციურია, ინტერიერიც მშვენიერია." },
            { rating: 4, comment: "ძალიან კარგი ადგილია მეგობრებთან შესახვედრად. ყავა ყოველთვის ხარისხიანია." },
          ];
          for (let i = 0; i < kvReviews.length && i < realUsers.length; i++) {
            await db.insert(merchantReviews).values({
              id: nanoid(), merchantId: kv.id, userId: realUsers[i].id,
              paymentTransactionId: `seed-kv-${i}`, rating: kvReviews[i].rating, comment: kvReviews[i].comment,
            });
          }
          const avgKv = kvReviews.reduce((s, r) => s + r.rating, 0) / kvReviews.length;
          await db.update(merchants).set({ rating: Math.round(avgKv * 10) / 10 }).where(eq(merchants.id, kv.id));
          console.log("[startup] seeded Kvarts Coffee reviews");
        }

        // CHIKA reviews
        const [chika] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.businessName, "CHIKA Rustaveli")).limit(1);
        if (chika && realUsers.length >= 5) {
          const chikaReviews = [
            { rating: 5, comment: "საუკეთესო ბრანჩის ადგილია თბილისში! ავოკადო ტოსტი უბრალოდ განსაკუთრებულია, ატმოსფეროც ძალიან მყუდრო და სასიამოვნოა." },
            { rating: 4, comment: "პანკეიკები ძალიან გემრიელია, ყავაც კარგი ხარისხისაა. სტუდენტებისთვის იდეალური ადგილია." },
            { rating: 5, comment: "მეგობრებთან ერთად ხშირად მოვდივართ, ყოველთვის კმაყოფილები ვრჩებით. მომსახურება სწრაფი და თბილია." },
          ];
          for (let i = 0; i < chikaReviews.length; i++) {
            const userIdx = (i + 3) % realUsers.length;
            await db.insert(merchantReviews).values({
              id: nanoid(), merchantId: chika.id, userId: realUsers[userIdx].id,
              paymentTransactionId: `seed-chika-${i}`, rating: chikaReviews[i].rating, comment: chikaReviews[i].comment,
            });
          }
          const avgChika = chikaReviews.reduce((s, r) => s + r.rating, 0) / chikaReviews.length;
          await db.update(merchants).set({ rating: Math.round(avgChika * 10) / 10 }).where(eq(merchants.id, chika.id));
          console.log("[startup] seeded CHIKA reviews");
        }
      }
    }
  } catch (e: any) { console.error("[startup] review seed error:", e.message); }

  console.log("[startup] migrations applied");
}

const app = new Hono();

// ── Middleware ──
app.use("*", cors({
  origin: (origin) => {
    const allowed = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://shansi.app",
      "https://www.shansi.app",
      "https://merchants.shansi.app",
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
app.route("/attacks", attacks);
app.route("/offers", offersRoute);
app.route("/public", publicRoute);

// ── Health check ──
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Ping (latency measurement) ──
app.get("/ping", (c) => {
  return c.json({
    pong: true,
    serverTime: Date.now(),
    region: "eu-west",
  });
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
    const httpServer = serve({ fetch: app.fetch, port }, () => {
      console.log(`Shansi backend running on http://localhost:${port}`);
    });
    // Attach Socket.io for multiplayer Air Hockey
    import("./socket/index.js").then(({ setupSocketServer }) => {
      setupSocketServer(httpServer);
      console.log("[socket.io] Air Hockey multiplayer ready");
    }).catch((e) => console.error("[socket.io setup]", e));
  });
