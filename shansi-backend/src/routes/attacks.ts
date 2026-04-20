import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and, sql } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import {
  users, userVillageProfile, userVillageProgress, attackSessions, attackAttempts,
  villages, villageBuildings,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { BadRequestError } from "../utils/errors.js";
import { getCoinBalance, deductCoins, addCoins } from "../services/coinService.js";

const attacks = new Hono<AppEnv>();
attacks.use("*", authMiddleware);

// Helper: get star column name for position 1-5
function starColumn(position: number): string {
  return `b${position}_stars`;
}

// POST /attacks/initialize
attacks.post("/initialize", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();

  // Validate attacker has >= 3 attack charges
  const [attackerProfile] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, userId)).limit(1);
  if (!attackerProfile) throw new BadRequestError("Village profile not found");
  const attackCharges = attackerProfile.attackCharges ?? 0;
  console.log(`[attack] user=${userId} charges=${attackCharges} level=${attackerProfile.currentLevel}`);
  if (attackCharges < 3) throw new BadRequestError(`Not enough attack charges (have ${attackCharges}, need 3)`);

  const attackerLevel = attackerProfile.currentLevel;

  // Find valid targets: same level, not self, not attacked in last 24h, has stars > 0, has coins > 0
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // Get users attacked by this attacker in last 24h
  const recentAttacks = await (db as any).all(
    sql`SELECT DISTINCT defender_id FROM attack_sessions WHERE attacker_id = ${userId} AND created_at > ${twentyFourHoursAgo}`
  );
  const recentRows = recentAttacks?.rows || recentAttacks || [];
  const recentDefenderIds = new Set(recentRows.map((r: any) => r.defender_id || r[0]));

  // Get all users at same level, excluding self
  const candidates = await db.select().from(userVillageProfile)
    .where(and(eq(userVillageProfile.currentLevel, attackerLevel)));

  const validTargets: Array<{ userId: string; profile: any }> = [];
  for (const cand of candidates) {
    if (cand.userId === userId) continue;
    if (recentDefenderIds.has(cand.userId)) continue;
    if (cand.totalStars <= 0) continue;
    const coinBal = await getCoinBalance(cand.userId);
    if (coinBal <= 0) continue;
    validTargets.push({ userId: cand.userId, profile: cand });
  }

  console.log(`[attack] candidates=${candidates.length} validTargets=${validTargets.length}`);
  if (validTargets.length === 0) {
    // Fallback: find ANY other user with a village profile (ignore level/stars/coins)
    const anyUser = candidates.find(c => c.userId !== userId);
    console.log(`[attack] fallback anyUser=${!!anyUser}`);
    if (anyUser) {
      validTargets.push({ userId: anyUser.userId, profile: anyUser });
    } else {
      // No other users at all — refund charges and return error
      await (db as any).run(
        sql`UPDATE user_village_profile SET attack_charges = attack_charges + 3, updated_at = datetime('now') WHERE user_id = ${userId}`
      );
      throw new BadRequestError("No valid targets found");
    }
  }

  // Pick random target
  const target = validTargets[Math.floor(Math.random() * validTargets.length)];
  const defenderId = target.userId;

  // Snapshot defender's coin balance
  const coinBalance = await getCoinBalance(defenderId);
  const coinsHiddenTotal = Math.floor(coinBalance * 0.5);
  const perItem = Math.floor(coinsHiddenTotal / 2);

  // Get defender's village progress to pick positions with stars > 0
  const defenderProgress = await db.select().from(userVillageProgress).where(eq(userVillageProgress.userId, defenderId));
  const activeProgress = defenderProgress.find(p => !p.completed) || defenderProgress[0];

  // Find positions with stars > 0
  const positionsWithStars: number[] = [];
  if (activeProgress) {
    const starValues: Record<number, number> = {
      1: activeProgress.building1Stars,
      2: activeProgress.building2Stars,
      3: activeProgress.building3Stars,
      4: activeProgress.building4Stars,
      5: activeProgress.building5Stars,
    };
    for (let i = 1; i <= 5; i++) {
      if (starValues[i] > 0) positionsWithStars.push(i);
    }
  }

  // If no positions with stars, use random 2 positions
  let posA: number, posB: number;
  if (positionsWithStars.length >= 2) {
    const shuffled = [...positionsWithStars].sort(() => Math.random() - 0.5);
    posA = shuffled[0];
    posB = shuffled[1];
  } else if (positionsWithStars.length === 1) {
    posA = positionsWithStars[0];
    // Pick a random different position
    const others = [1, 2, 3, 4, 5].filter(p => p !== posA);
    posB = others[Math.floor(Math.random() * others.length)];
  } else {
    posA = 1 + Math.floor(Math.random() * 5);
    posB = posA;
    while (posB === posA) posB = 1 + Math.floor(Math.random() * 5);
  }

  // Create session
  const sessionId = nanoid();
  await db.insert(attackSessions).values({
    id: sessionId,
    attackerId: userId,
    defenderId,
    defenderCoinSnapshot: coinBalance,
    coinsHiddenTotal,
    itemAPosition: posA,
    itemACoins: perItem,
    itemBPosition: posB,
    itemBCoins: coinsHiddenTotal - perItem,
    attacksUsed: 0,
    status: "in_progress",
  });

  // Deduct 3 attack charges from attacker
  await (db as any).run(
    sql`UPDATE user_village_profile SET attack_charges = attack_charges - 3, updated_at = datetime('now') WHERE user_id = ${userId}`
  );

  // Get defender info
  const [defenderUser] = await db.select().from(users).where(eq(users.id, defenderId)).limit(1);
  const [defenderProfileFull] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, defenderId)).limit(1);
  const defenderShieldCount = defenderProfileFull?.shieldCount ?? 0;

  // Get village items for display
  let villageItems: Array<{ position: number; stars: number; name: string }> = [];
  if (activeProgress) {
    const [v] = await db.select().from(villages).where(eq(villages.id, activeProgress.villageId)).limit(1);
    const buildings = await db.select().from(villageBuildings).where(eq(villageBuildings.villageId, activeProgress.villageId));
    const starValues: Record<number, number> = {
      1: activeProgress.building1Stars,
      2: activeProgress.building2Stars,
      3: activeProgress.building3Stars,
      4: activeProgress.building4Stars,
      5: activeProgress.building5Stars,
    };
    villageItems = buildings.map(b => ({
      position: b.position,
      stars: starValues[b.position] || 0,
      name: b.name,
    }));
  }

  return c.json({
    success: true,
    attackSessionId: sessionId,
    defenderUsername: defenderUser?.stageName || defenderUser?.name || "Player",
    defenderVillageLevel: defenderProfileFull?.currentLevel || 1,
    defenderShieldActive: defenderShieldCount > 0,
    defenderShieldCount,
    villageItems,
  });
});

// POST /attacks/attempt
attacks.post("/attempt", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const { attackSessionId, pickedPosition } = body;

  if (!attackSessionId || !pickedPosition || pickedPosition < 1 || pickedPosition > 5) {
    throw new BadRequestError("attackSessionId and pickedPosition (1-5) required");
  }

  const db = getDb();

  // Load session
  const [session] = await db.select().from(attackSessions).where(eq(attackSessions.id, attackSessionId)).limit(1);
  if (!session) throw new BadRequestError("Attack session not found");
  if (session.attackerId !== userId) throw new BadRequestError("Not your attack session");
  if (session.status === "completed") throw new BadRequestError("Attack session already completed");
  if (session.attacksUsed >= 2) throw new BadRequestError("No attacks remaining");

  const attemptNumber = session.attacksUsed + 1;
  const defenderId = session.defenderId;

  // Check defender shield (use shield_count, fallback to timestamp)
  const [defenderProfile] = await db.select().from(userVillageProfile).where(eq(userVillageProfile.userId, defenderId)).limit(1);
  const defenderShieldCount = (defenderProfile as any)?.shieldCount ?? 0;
  const shieldActive = defenderShieldCount > 0;

  let outcome: string;
  let coinsTransferred = 0;
  let shieldConsumed = false;
  let itemBurned = false;
  let newStarCount: number | null = null;

  if (shieldActive) {
    // Consume 1 shield
    await (db as any).run(
      sql`UPDATE user_village_profile SET shield_count = MAX(shield_count - 1, 0), updated_at = datetime('now') WHERE user_id = ${defenderId}`
    );
    outcome = "shield_blocked";
    shieldConsumed = true;
    itemBurned = false;
  } else {
    // Check if position matches hidden items
    const hitA = pickedPosition === session.itemAPosition;
    const hitB = pickedPosition === session.itemBPosition;

    if (hitA || hitB) {
      coinsTransferred = hitA ? session.itemACoins : session.itemBCoins;
      // Transfer coins
      await addCoins(userId, coinsTransferred);
      await deductCoins(defenderId, coinsTransferred);
      outcome = "coins_stolen";
      itemBurned = true;
    } else {
      outcome = "empty_burn";
      itemBurned = true;
    }

    // Burn: decrement the building's stars by 1 on defender's progress
    if (itemBurned) {
      const defenderProgress = await db.select().from(userVillageProgress).where(eq(userVillageProgress.userId, defenderId));
      const activeProgress = defenderProgress.find(p => !p.completed) || defenderProgress[0];
      if (activeProgress) {
        const col = starColumn(pickedPosition);
        await (db as any).run(
          sql`UPDATE user_village_progress SET ${sql.raw(col)} = MAX(${sql.raw(col)} - 1, 0) WHERE id = ${activeProgress.id}`
        );
        // Get new star count
        const [updatedProgress] = await db.select().from(userVillageProgress).where(eq(userVillageProgress.id, activeProgress.id)).limit(1);
        if (updatedProgress) {
          const starValues: Record<number, number> = {
            1: updatedProgress.building1Stars,
            2: updatedProgress.building2Stars,
            3: updatedProgress.building3Stars,
            4: updatedProgress.building4Stars,
            5: updatedProgress.building5Stars,
          };
          newStarCount = starValues[pickedPosition] ?? 0;

          // Check if total stars = 0 and level > 1 => drop level
          const totalStars = updatedProgress.building1Stars + updatedProgress.building2Stars +
            updatedProgress.building3Stars + updatedProgress.building4Stars + updatedProgress.building5Stars;
          if (totalStars === 0 && defenderProfile && defenderProfile.currentLevel > 1) {
            await (db as any).run(
              sql`UPDATE user_village_profile SET current_level = current_level - 1, updated_at = datetime('now') WHERE user_id = ${defenderId}`
            );
          }
        }
      }
    }
  }

  // Insert attempt
  await db.insert(attackAttempts).values({
    id: nanoid(),
    attackSessionId,
    attemptNumber,
    pickedPosition,
    outcome,
    coinsTransferred,
    shieldConsumed,
    itemBurned,
  });

  // Update session
  const newAttacksUsed = session.attacksUsed + 1;
  const updates: any = { attacksUsed: newAttacksUsed };
  if (newAttacksUsed >= 2) {
    updates.status = "completed";
    updates.completedAt = new Date().toISOString();
  }
  await db.update(attackSessions).set(updates).where(eq(attackSessions.id, attackSessionId));

  return c.json({
    success: true,
    outcome,
    coinsTransferred,
    shieldConsumed,
    itemBurned,
    attacksRemaining: 2 - newAttacksUsed,
    newStarCount,
  });
});

// GET /attacks/:id/summary
attacks.get("/:id/summary", async (c) => {
  const userId = c.get("userId") as string;
  const sessionId = c.req.param("id");
  const db = getDb();

  const [session] = await db.select().from(attackSessions).where(eq(attackSessions.id, sessionId)).limit(1);
  if (!session) throw new BadRequestError("Attack session not found");
  if (session.attackerId !== userId) throw new BadRequestError("Not your attack session");

  const attempts = await db.select().from(attackAttempts)
    .where(eq(attackAttempts.attackSessionId, sessionId));

  const totalCoinsStolen = attempts.reduce((sum, a) => sum + (a.coinsTransferred || 0), 0);
  const itemsBurned = attempts.filter(a => a.itemBurned).length;

  return c.json({
    success: true,
    session: {
      id: session.id,
      status: session.status,
      attacksUsed: session.attacksUsed,
      coinsHiddenTotal: session.coinsHiddenTotal,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    },
    attempts: attempts.map(a => ({
      attemptNumber: a.attemptNumber,
      pickedPosition: a.pickedPosition,
      outcome: a.outcome,
      coinsTransferred: a.coinsTransferred,
      shieldConsumed: a.shieldConsumed,
      itemBurned: a.itemBurned,
    })),
    totals: {
      coinsStolen: totalCoinsStolen,
      itemsBurned,
    },
  });
});

// GET /attacks/pending-notifications
attacks.get("/pending-notifications", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();

  // Get user's last_attack_seen_at
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const lastSeen = user?.lastAttackSeenAt || "1970-01-01T00:00:00.000Z";

  // Query attack attempts where defender = current user and created_at > lastSeen
  const results = await (db as any).all(
    sql`SELECT aa.*, ats.attacker_id, ats.id as session_id
        FROM attack_attempts aa
        JOIN attack_sessions ats ON aa.attack_session_id = ats.id
        WHERE ats.defender_id = ${userId} AND aa.created_at > ${lastSeen}
        ORDER BY aa.created_at DESC`
  );
  const rows = results?.rows || results || [];

  // Enrich with attacker names
  const notifications = await Promise.all(rows.map(async (row: any) => {
    const attackerId = row.attacker_id;
    const [attacker] = await db.select().from(users).where(eq(users.id, attackerId)).limit(1);
    return {
      attackerName: attacker?.stageName || attacker?.name || "Player",
      outcome: row.outcome,
      coinsLost: row.coins_transferred || 0,
      itemBurned: !!(row.item_burned),
      pickedPosition: row.picked_position,
      createdAt: row.created_at,
    };
  }));

  // Update last_attack_seen_at
  await (db as any).run(
    sql`UPDATE users SET last_attack_seen_at = datetime('now') WHERE id = ${userId}`
  );

  return c.json({
    success: true,
    notifications,
  });
});

// TEMP: Reset all users' attack_charges and shields to 0 for testing
attacks.post("/reset-all", async (c) => {
  const db = getDb();
  await (db as any).run(sql`UPDATE user_village_profile SET attack_charges = 0, shield_count = 0, shield_active_until = NULL, updated_at = datetime('now')`);
  await (db as any).run(sql`DELETE FROM user_cards`);
  return c.json({ success: true, message: "All attack charges and shields reset to 0" });
});

export default attacks;
