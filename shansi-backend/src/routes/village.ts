import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and, ne, sql } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import {
  users, villageLevels, villageCards, userVillageProfile, userCards,
  villageAttacks, villageConfig,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { BadRequestError } from "../utils/errors.js";

const village = new Hono<AppEnv>();

village.use("*", authMiddleware);

// Helper: get or create village profile
async function getOrCreateProfile(userId: string) {
  const db = getDb();
  let [profile] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, userId)).limit(1);
  if (!profile) {
    await db.insert(userVillageProfile).values({
      id: nanoid(), userId, currentLevel: 1, totalStars: 0,
    });
    [profile] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, userId)).limit(1);
  }
  return profile!;
}

// Helper: read config value
async function getConfig(key: string, defaultVal: number): Promise<number> {
  const db = getDb();
  const [row] = await db.select().from(villageConfig).where(eq(villageConfig.key, key)).limit(1);
  return row ? Number(row.value) : defaultVal;
}

// Helper: check & apply level up after stars change
async function checkLevelUp(userId: string) {
  const db = getDb();
  const profile = await getOrCreateProfile(userId);
  const allLevels = await db.select().from(villageLevels).orderBy(villageLevels.levelNumber);
  let newLevel = profile.currentLevel;
  for (const lvl of allLevels) {
    if (profile.totalStars >= lvl.starsRequired && lvl.levelNumber > newLevel) {
      newLevel = lvl.levelNumber;
    }
  }
  if (newLevel !== profile.currentLevel) {
    await db.update(userVillageProfile).set({
      currentLevel: newLevel, updatedAt: new Date().toISOString(),
    }).where(eq(userVillageProfile.id, profile.id));
    console.log(`[VILLAGE] User ${userId} leveled up: ${profile.currentLevel} → ${newLevel}`);
    return { leveledUp: true, newLevel, oldLevel: profile.currentLevel };
  }
  return { leveledUp: false, newLevel, oldLevel: profile.currentLevel };
}

// GET /village/profile
village.get("/profile", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();
  const profile = await getOrCreateProfile(userId);
  const [currentLvl] = await db.select().from(villageLevels).where(eq(villageLevels.levelNumber, profile.currentLevel)).limit(1);
  const allLevels = await db.select().from(villageLevels).orderBy(villageLevels.levelNumber);
  const nextLvl = allLevels.find(l => l.levelNumber > profile.currentLevel);
  const [cardCountRow] = await db.select({ c: sql<number>`count(*)` }).from(userCards).where(eq(userCards.userId, userId));

  const shieldActive = profile.shieldActiveUntil ? new Date(profile.shieldActiveUntil) > new Date() : false;

  return c.json({
    success: true,
    profile: {
      currentLevel: profile.currentLevel,
      totalStars: profile.totalStars,
      currentLevelMaxWin: currentLvl?.maxWinAmount || 0,
      nextLevelStarsRequired: nextLvl?.starsRequired || null,
      starsToNextLevel: nextLvl ? Math.max(0, nextLvl.starsRequired - profile.totalStars) : 0,
      cardCount: Number(cardCountRow?.c) || 0,
      shieldActive,
      shieldActiveUntil: profile.shieldActiveUntil,
    },
  });
});

// GET /village/shop
village.get("/shop", async (c) => {
  const db = getDb();
  const cards = await db.select().from(villageCards).where(eq(villageCards.isActive, true)).orderBy(villageCards.coinCost);
  return c.json({ success: true, cards });
});

// POST /village/buy-card
village.post("/buy-card", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const cardId = body.cardId as string;
  if (!cardId) throw new BadRequestError("cardId required");

  const db = getDb();
  const [card] = await db.select().from(villageCards).where(eq(villageCards.id, cardId)).limit(1);
  if (!card || !card.isActive) throw new BadRequestError("Card not available");

  // Deduct coins from active transaction
  const allActiveTx = await db.select().from(sql`transactions`).where(sql`user_id = ${userId} AND status = 'active'` as any) as any[];
  const txWithCoins = (allActiveTx as any[]).find((t: any) => t.coins_remaining >= card.coinCost);
  if (!txWithCoins) throw new BadRequestError("არასაკმარისი ქოინები");

  await (db as any).run(sql`UPDATE transactions SET coins_remaining = coins_remaining - ${card.coinCost} WHERE id = ${txWithCoins.id}`);

  // Add card to user
  await db.insert(userCards).values({
    id: nanoid(), userId, cardId,
  });

  // Add stars
  await getOrCreateProfile(userId);
  await (db as any).run(sql`UPDATE user_village_profile SET total_stars = total_stars + ${card.starValue}, updated_at = datetime('now') WHERE user_id = ${userId}`);

  const levelUp = await checkLevelUp(userId);
  const profile = await getOrCreateProfile(userId);

  return c.json({
    success: true,
    starsEarned: card.starValue,
    cardName: card.name,
    cardRarity: card.rarity,
    totalStars: profile.totalStars,
    currentLevel: profile.currentLevel,
    leveledUp: levelUp.leveledUp,
    newLevel: levelUp.leveledUp ? levelUp.newLevel : null,
  });
});

// GET /village/collection
village.get("/collection", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();
  const myCards = await db.select().from(userCards).where(eq(userCards.userId, userId));

  // Group by cardId with count
  const counts = new Map<string, number>();
  for (const c of myCards) counts.set(c.cardId, (counts.get(c.cardId) || 0) + 1);

  const result = await Promise.all(Array.from(counts.entries()).map(async ([cardId, count]) => {
    const [card] = await db.select().from(villageCards).where(eq(villageCards.id, cardId)).limit(1);
    return { ...card, count };
  }));
  return c.json({ success: true, collection: result });
});

// GET /village/attack/targets
village.get("/attack/targets", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();
  const myProfile = await getOrCreateProfile(userId);
  // Same level users
  const targets = await db.select({
    userId: userVillageProfile.userId,
    currentLevel: userVillageProfile.currentLevel,
    totalStars: userVillageProfile.totalStars,
    shieldActiveUntil: userVillageProfile.shieldActiveUntil,
  }).from(userVillageProfile)
    .where(and(eq(userVillageProfile.currentLevel, myProfile.currentLevel), ne(userVillageProfile.userId, userId)))
    .limit(20);

  const enriched = await Promise.all(targets.map(async (t) => {
    const [u] = await db.select({ phone: users.phone, name: users.name }).from(users).where(eq(users.id, t.userId)).limit(1);
    const shielded = t.shieldActiveUntil ? new Date(t.shieldActiveUntil) > new Date() : false;
    return {
      userId: t.userId,
      name: u?.name || "მომხმარებელი",
      level: t.currentLevel,
      stars: t.totalStars,
      shielded,
    };
  }));
  return c.json({ success: true, targets: enriched });
});

// POST /village/attack
village.post("/attack", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const victimId = body.victimId as string;
  const cardIds = body.cardIds as string[];

  if (!victimId || !cardIds || !Array.isArray(cardIds)) throw new BadRequestError("victimId and cardIds required");

  const db = getDb();
  const cardsNeeded = await getConfig("attack_cards_needed", 3);
  if (cardIds.length !== cardsNeeded) throw new BadRequestError(`${cardsNeeded} cards required`);

  const attacker = await getOrCreateProfile(userId);
  const [victim] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, victimId)).limit(1);
  if (!victim) throw new BadRequestError("Victim not found");
  if (attacker.currentLevel !== victim.currentLevel) throw new BadRequestError("Same level only");

  // Shield check
  const victimShielded = victim.shieldActiveUntil ? new Date(victim.shieldActiveUntil) > new Date() : false;
  if (victimShielded) {
    await db.insert(villageAttacks).values({
      id: nanoid(), attackerId: userId, victimId, attackResult: "blocked",
      starsAwarded: 0, attackerLevel: attacker.currentLevel,
    });
    return c.json({ success: true, result: "blocked", message: "მსხვერპლს აქვს ფარი" });
  }

  // Verify attacker owns the cards
  for (const cid of cardIds) {
    const [owned] = await db.select().from(userCards).where(and(eq(userCards.id, cid), eq(userCards.userId, userId))).limit(1);
    if (!owned) throw new BadRequestError("Card not owned");
  }

  // Roll attack
  const successRate = await getConfig("attack_success_rate", 50);
  const roll = Math.random() * 100;
  const success = roll < successRate;

  // Always consume the cards
  for (const cid of cardIds) {
    await db.delete(userCards).where(eq(userCards.id, cid));
  }

  let starsAwarded = 0;
  if (success) {
    const bonus = await getConfig("attack_star_bonus", 15);
    starsAwarded = bonus;
    // Award stars to attacker
    await (db as any).run(sql`UPDATE user_village_profile SET total_stars = total_stars + ${bonus}, updated_at = datetime('now') WHERE user_id = ${userId}`);
    // Drop victim's level by 1 (min 1)
    if (victim.currentLevel > 1) {
      await db.update(userVillageProfile).set({
        currentLevel: victim.currentLevel - 1,
        updatedAt: new Date().toISOString(),
      }).where(eq(userVillageProfile.id, victim.id));
    }
  }

  await db.insert(villageAttacks).values({
    id: nanoid(), attackerId: userId, victimId,
    attackResult: success ? "success" : "failed",
    starsAwarded, attackerLevel: attacker.currentLevel,
  });

  const levelUp = success ? await checkLevelUp(userId) : { leveledUp: false };

  return c.json({
    success: true,
    result: success ? "success" : "failed",
    starsAwarded,
    leveledUp: levelUp.leveledUp,
  });
});

// POST /village/shield
village.post("/shield", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();
  const profile = await getOrCreateProfile(userId);
  const cost = await getConfig("shield_cost_stars", 50);
  if (profile.totalStars < cost) throw new BadRequestError("არასაკმარისი ვარსკვლავები");

  const until = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  await db.update(userVillageProfile).set({
    totalStars: profile.totalStars - cost,
    shieldActiveUntil: until,
    updatedAt: new Date().toISOString(),
  }).where(eq(userVillageProfile.id, profile.id));

  return c.json({ success: true, shieldActiveUntil: until, starsSpent: cost });
});

export default village;
