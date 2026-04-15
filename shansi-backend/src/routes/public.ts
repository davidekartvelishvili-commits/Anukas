import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { referralConfig, systemConfig, tickets } from "../db/schema.js";
import { desc, and } from "drizzle-orm";

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
      emoji: r.emoji,
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

export { publicRoute };
