import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { referralConfig, systemConfig, tickets, gameHistory, users, pageViews } from "../db/schema.js";
import { nanoid } from "nanoid";
import { desc, and, gt, sql } from "drizzle-orm";

// Public endpoints (no auth required) — used by OG metadata / scrapers / share pages
const publicRoute = new Hono<AppEnv>();

// GET /public/referral-config — mirrors /user/referral-config but with no auth
publicRoute.get("/referral-config", async (c) => {
  const db = getDb();
  const [cfg] = await db.select().from(referralConfig).where(eq(referralConfig.id, "default")).limit(1);
  return c.json({
    success: true,
    config: {
      referrerRewardCoins: cfg?.referrerRewardCoins ?? 200,
      referredRewardCoins: cfg?.referredRewardCoins ?? 100,
      bonusEveryN: (cfg as any)?.bonusEveryN ?? 5,
      bonusRewardCoins: (cfg as any)?.bonusRewardCoins ?? 500,
      signupRewardLari: (cfg as any)?.signupRewardLari ?? 10,
      shareMessageTemplate: (cfg as any)?.shareMessageTemplate ?? "Join me on Shansi! Use my referral code: {code} to get _ ₾",
      shareImageUrl: (cfg as any)?.shareImageUrl ?? null,
      isActive: cfg?.isActive ?? true,
    },
  });
});

// GET /public/features — public feature flags (home page mystery box, etc.)
publicRoute.get("/features", async (c) => {
  const db = getDb();
  const [mbx] = await db.select().from(systemConfig).where(eq(systemConfig.key, "mystery_box_enabled")).limit(1);
  return c.json({
    success: true,
    features: {
      mysteryBoxEnabled: mbx?.value !== "false", // default enabled
    },
  });
});

// GET /public/tickets — active tickets for home page strip
publicRoute.get("/tickets", async (c) => {
  const db = getDb();
  const rows = await db.select().from(tickets).where(eq(tickets.isActive, true)).orderBy(tickets.sortOrder, desc(tickets.createdAt));
  const shaped = rows.map((r) => {
    let termsArr: string[] = [];
    try { termsArr = JSON.parse((r as any).termsJson || "[]"); } catch {}
    return {
      id: r.id,
      merchantId: (r as any).merchantId,
      emoji: r.emoji,
      logoUrl: (r as any).logoUrl,
      category: r.category,
      title: r.title,
      titleKa: r.titleKa,
      brand: r.brand,
      validity: r.validity,
      type: r.type,
      price: r.price,
      bonus: r.bonus,
      personName: r.personName,
      screen: r.screen,
      row: (r as any).rowLabel,
      seat: r.seat,
      serial: r.serial,
      social: r.social,
      terms: termsArr,
      website: r.website,
    };
  });
  return c.json({ success: true, tickets: shaped });
});

// GET /public/recent-wins — last 5 game wins for the live home-page feed.
// Returns coin amounts so users can see "who's winning right now" without
// auth. Polls every ~8s from the client. Lightweight query: single indexed
// SELECT on game_history ordered by created_at desc.
publicRoute.get("/recent-wins", async (c) => {
  const db = getDb();
  const COINS_PER_LARI = 100; // same conversion rate used throughout the app

  // Pull last 5 actual wins (winAmount > 0) from game_history
  const rows = await db.select({
    id: gameHistory.id,
    userId: gameHistory.userId,
    gameType: gameHistory.gameType,
    winAmount: gameHistory.winAmount,
    betAmount: gameHistory.betAmount,
    createdAt: gameHistory.createdAt,
  })
    .from(gameHistory)
    .where(gt(gameHistory.winAmount, 0))
    .orderBy(desc(gameHistory.createdAt))
    .limit(5);

  const wins = await Promise.all(rows.map(async (r) => {
    const [u] = await db.select({ name: users.name, phone: users.phone, stageName: users.stageName })
      .from(users).where(eq(users.id, r.userId)).limit(1);
    // Priority: stageName > custom name > phone last 4
    const displayName = (u as any)?.stageName
      || u?.name?.trim()
      || (u?.phone ? `****${u.phone.slice(-4)}` : "User");

    // Convert cash win to coin equivalent
    const coinAmount = Math.round(r.winAmount * COINS_PER_LARI);

    // Friendly game label
    const gameLabel: Record<string, string> = {
      slot: "Midnight Machine",
      plinko: "Lucky Drop",
      chicken_rush: "Lucky Step",
      air_hockey: "Air Hockey",
      village_attack: "Village Attack",
    };

    return {
      id: r.id,
      name: displayName.length > 10 ? displayName.slice(0, 10) : displayName,
      coins: coinAmount,
      game: gameLabel[r.gameType] || r.gameType,
      createdAt: r.createdAt,
    };
  }));

  return c.json({ success: true, wins });
});

// POST /public/track — record a page view (no auth)
publicRoute.post("/track", async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb();
    const ua = c.req.header("user-agent") || "";
    const country = c.req.header("cf-ipcountry") || c.req.header("x-vercel-ip-country") || null;

    // Detect device type from user-agent
    let deviceType = "desktop";
    if (/mobile|android|iphone|ipod/i.test(ua)) deviceType = "mobile";
    else if (/tablet|ipad/i.test(ua)) deviceType = "tablet";

    await db.insert(pageViews).values({
      id: nanoid(),
      path: body.path || "/",
      referrer: body.referrer || null,
      utmSource: body.utm_source || null,
      utmMedium: body.utm_medium || null,
      utmCampaign: body.utm_campaign || null,
      userAgent: ua.slice(0, 500),
      country,
      deviceType,
      screenWidth: body.screenWidth || null,
    });
    return c.json({ success: true });
  } catch (e: any) {
    console.error("[track]", e.message);
    return c.json({ success: true }); // never fail the client
  }
});

export { publicRoute };
