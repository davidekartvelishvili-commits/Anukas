import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { referralConfig, systemConfig } from "../db/schema.js";

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

export { publicRoute };
