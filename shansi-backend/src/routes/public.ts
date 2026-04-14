import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { referralConfig } from "../db/schema.js";

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

export { publicRoute };
