import { Hono } from "hono";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, and, or, desc } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { users, sessions, otpRateLimits, transactions, referrals, referralConfig } from "../db/schema.js";
import { sendOtp, verifyOtp } from "../services/otp.js";
import { signToken } from "../services/token.js";
import { hashPin, verifyPin } from "../services/pin.js";
import { randomStageName } from "../utils/stageNames.js";
import { authMiddleware } from "../middleware/auth.js";
import { BadRequestError, RateLimitError, UnauthorizedError } from "../utils/errors.js";

const auth = new Hono<AppEnv>();

// Helper: get coin balance — sum of ALL active transactions' remaining coins
async function getUserCoinBalance(userId: string): Promise<number> {
  const db = getDb();
  const activeTxs = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))));
  return activeTxs.reduce((sum, tx) => sum + (tx.coinsRemaining || 0), 0);
}

// Helper: generate unique referral code
async function generateReferralCode(): Promise<string> {
  const db = getDb();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 10; i++) {
    let code = "SHANSI-";
    for (let j = 0; j < 6; j++) code += chars[Math.floor(Math.random() * chars.length)];
    const [existing] = await db.select().from(users).where(eq(users.referralCode, code)).limit(1);
    if (!existing) return code;
  }
  return "SHANSI-" + nanoid(6).toUpperCase();
}

// Helper: ensure user has a referral code
async function ensureReferralCode(userId: string): Promise<string> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user?.referralCode) return user.referralCode;
  const code = await generateReferralCode();
  await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
  return code;
}

// ── Schemas ──
const phoneSchema = z.object({
  phone: z.string().regex(/^\+995\d{9}$/, "Invalid Georgian phone number (E.164)"),
});

// ── POST /auth/check-phone (NO auth) ──
auth.post("/check-phone", async (c) => {
  const body = await c.req.json();
  const parsed = phoneSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.phone, parsed.data.phone)).limit(1);

  return c.json({
    success: true,
    exists: !!user,
    hasPin: !!user?.pinHash,
  });
});

const verifySchema = z.object({
  phone: z.string().regex(/^\+995\d{9}$/),
  code: z.string().length(6),
  referralCode: z.string().optional(),
});

const pinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
});

// ── POST /auth/send-otp ──
auth.post("/send-otp", async (c) => {
  const body = await c.req.json();
  const parsed = phoneSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0].message);
  }

  const { phone } = parsed.data;
  const db = getDb();

  // Rate limiting
  const [rateLimit] = await db
    .select()
    .from(otpRateLimits)
    .where(eq(otpRateLimits.phone, phone))
    .limit(1);

  const now = new Date();
  const windowMs = 10 * 60 * 1000; // 10 minutes

  if (rateLimit) {
    const windowStart = new Date(rateLimit.windowStart);
    if (now.getTime() - windowStart.getTime() < windowMs) {
      if (rateLimit.attempts >= 5) {
        throw new RateLimitError("Too many OTP requests. Try again in 10 minutes.");
      }
      await db
        .update(otpRateLimits)
        .set({ attempts: rateLimit.attempts + 1 })
        .where(eq(otpRateLimits.id, rateLimit.id));
    } else {
      // Reset window
      await db
        .update(otpRateLimits)
        .set({ attempts: 1, windowStart: now.toISOString() })
        .where(eq(otpRateLimits.id, rateLimit.id));
    }
  } else {
    await db.insert(otpRateLimits).values({
      id: nanoid(),
      phone,
      attempts: 1,
      windowStart: now.toISOString(),
    });
  }

  const sent = await sendOtp(phone);
  if (!sent) {
    throw new BadRequestError("Failed to send OTP");
  }

  return c.json({ success: true, message: "OTP sent" });
});

// ── POST /auth/verify-otp ──
auth.post("/verify-otp", async (c) => {
  const body = await c.req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0].message);
  }

  const { phone, code, referralCode: inputReferralCode } = parsed.data;
  const approved = await verifyOtp(phone, code);
  if (!approved) {
    throw new UnauthorizedError("Invalid or expired OTP");
  }

  const db = getDb();

  // Find or create user
  let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  let isNewUser = false;
  let referralReward: { coinsEarned: number } | null = null;

  if (!user) {
    isNewUser = true;
    const userId = nanoid();
    const newReferralCode = await generateReferralCode();
    await db.insert(users).values({
      id: userId,
      phone,
      balance: 0,
      referralCode: newReferralCode,
      stageName: randomStageName(),
    } as any);
    [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    // Handle referral if code provided
    if (inputReferralCode && inputReferralCode.trim()) {
      try {
        const refCode = inputReferralCode.trim().toUpperCase();
        const [referrer] = await db.select().from(users).where(eq(users.referralCode, refCode)).limit(1);
        if (referrer && referrer.id !== userId) {
          const [config] = await db.select().from(referralConfig).limit(1);
          if (config && config.isActive) {
            await db.insert(referrals).values({
              id: nanoid(),
              referrerId: referrer.id,
              referredId: userId,
              referralCode: refCode,
              rewardGivenToReferrer: true,
              rewardGivenToReferred: true,
              referrerCoinsRewarded: config.referrerRewardCoins,
              referredCoinsRewarded: config.referredRewardCoins,
            });
            await db.update(users).set({ referredBy: referrer.id }).where(eq(users.id, userId));
            const newTotalRefs = (referrer.totalReferrals || 0) + 1;
            await db.update(users).set({ totalReferrals: newTotalRefs }).where(eq(users.id, referrer.id));

            // Milestone bonus — every Nth successful referral gives extra coins
            const bonusEveryN = (config as any).bonusEveryN || 5;
            const bonusRewardCoins = (config as any).bonusRewardCoins || 0;
            if (bonusRewardCoins > 0 && bonusEveryN > 0 && newTotalRefs % bonusEveryN === 0) {
              const [bonusTx] = await db.select().from(transactions)
                .where(and(eq(transactions.userId, referrer.id), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
                .orderBy(desc(transactions.createdAt)).limit(1);
              if (bonusTx) {
                await db.update(transactions).set({
                  coinsRemaining: bonusTx.coinsRemaining + bonusRewardCoins,
                  coinsReceived: bonusTx.coinsReceived + bonusRewardCoins,
                }).where(eq(transactions.id, bonusTx.id));
              } else {
                await db.insert(transactions).values({
                  id: nanoid(), userId: referrer.id, paymentAmount: 0,
                  coinsReceived: bonusRewardCoins, coinsRemaining: bonusRewardCoins,
                  totalCashWon: 0, guaranteedMinimum: 0, status: "active",
                });
              }
            }

            // Give coins to new user
            if (config.referredRewardCoins > 0) {
              await db.insert(transactions).values({
                id: nanoid(), userId, paymentAmount: 0,
                coinsReceived: config.referredRewardCoins, coinsRemaining: config.referredRewardCoins,
                totalCashWon: 0, guaranteedMinimum: 0, status: "active",
              });
            }
            // Give coins to referrer
            if (config.referrerRewardCoins > 0) {
              const [existingTx] = await db.select().from(transactions)
                .where(and(eq(transactions.userId, referrer.id), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
                .orderBy(desc(transactions.createdAt)).limit(1);
              if (existingTx) {
                await db.update(transactions).set({
                  coinsRemaining: existingTx.coinsRemaining + config.referrerRewardCoins,
                  coinsReceived: existingTx.coinsReceived + config.referrerRewardCoins,
                }).where(eq(transactions.id, existingTx.id));
              } else {
                await db.insert(transactions).values({
                  id: nanoid(), userId: referrer.id, paymentAmount: 0,
                  coinsReceived: config.referrerRewardCoins, coinsRemaining: config.referrerRewardCoins,
                  totalCashWon: 0, guaranteedMinimum: 0, status: "active",
                });
              }
            }
            referralReward = { coinsEarned: config.referredRewardCoins };
          }
        }
      } catch (e) {
        console.error("Referral error:", e);
      }
    }
  } else {
    // Existing user — ensure they have a referral code
    if (!user.referralCode) {
      await ensureReferralCode(user.id);
      [user] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    }
  }

  // Generate JWT
  const token = signToken({ userId: user.id, phone: user.phone });

  // Store session
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(sessions).values({
    id: nanoid(),
    userId: user.id,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  const coinBalance = await getUserCoinBalance(user.id);

  return c.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,\n      stageName: (user as any).stageName || null,
      balance: user.balance,
      coinBalance,
      referralCode: user.referralCode,
      hasPin: !!user.pinHash,
    },
    isNewUser,
    ...(referralReward ? { referralReward } : {}),
  });
});

// ── POST /auth/pin/setup (protected) ──
auth.post("/pin/setup", authMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0].message);
  }

  const userId = c.get("userId") as string;
  const hash = await hashPin(parsed.data.pin);
  const db = getDb();

  await db
    .update(users)
    .set({ pinHash: hash, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));

  return c.json({ success: true, message: "PIN set" });
});

// ── POST /auth/pin/login (NO auth required) ──
const pinLoginSchema = z.object({
  phone: z.string().regex(/^\+995\d{9}$/),
  pin: z.string().regex(/^\d{6}$/),
});

auth.post("/pin/login", async (c) => {
  const body = await c.req.json();
  const parsed = pinLoginSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0].message);
  }

  const { phone, pin } = parsed.data;
  const db = getDb();

  // Rate limit: check pin login attempts
  const [rateLimit] = await db
    .select()
    .from(otpRateLimits)
    .where(eq(otpRateLimits.phone, `pin:${phone}`))
    .limit(1);

  const now = new Date();
  const windowMs = 15 * 60 * 1000; // 15 minutes

  if (rateLimit) {
    const windowStart = new Date(rateLimit.windowStart);
    if (now.getTime() - windowStart.getTime() < windowMs && rateLimit.attempts >= 5) {
      throw new RateLimitError("Too many wrong attempts. Try again in 15 minutes.");
    }
  }

  // Find user
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }
  if (!user.pinHash) {
    throw new BadRequestError("PIN not set up");
  }

  // Verify PIN
  const valid = await verifyPin(pin, user.pinHash);
  if (!valid) {
    // Increment rate limit
    if (rateLimit) {
      const windowStart = new Date(rateLimit.windowStart);
      if (now.getTime() - windowStart.getTime() < windowMs) {
        await db.update(otpRateLimits).set({ attempts: rateLimit.attempts + 1 }).where(eq(otpRateLimits.id, rateLimit.id));
      } else {
        await db.update(otpRateLimits).set({ attempts: 1, windowStart: now.toISOString() }).where(eq(otpRateLimits.id, rateLimit.id));
      }
    } else {
      await db.insert(otpRateLimits).values({ id: nanoid(), phone: `pin:${phone}`, attempts: 1, windowStart: now.toISOString() });
    }
    throw new UnauthorizedError("Invalid credentials");
  }

  // Reset rate limit on success
  if (rateLimit) {
    await db.update(otpRateLimits).set({ attempts: 0 }).where(eq(otpRateLimits.id, rateLimit.id));
  }

  // Generate JWT + session
  const token = signToken({ userId: user.id, phone: user.phone });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    id: nanoid(),
    userId: user.id,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  const userReferralCode = user.referralCode || await ensureReferralCode(user.id);
  const coinBalance = await getUserCoinBalance(user.id);

  return c.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,\n      stageName: (user as any).stageName || null,
      balance: user.balance,
      coinBalance,
      referralCode: userReferralCode,
      hasPin: true,
    },
  });
});

// ── POST /auth/pin/verify (protected) ──
auth.post("/pin/verify", authMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0].message);
  }

  const userId = c.get("userId") as string;
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.pinHash) {
    throw new BadRequestError("PIN not set");
  }

  const valid = await verifyPin(parsed.data.pin, user.pinHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid PIN");
  }

  return c.json({ success: true });
});

// ── POST /auth/biometric/verify (protected) ──
auth.post("/biometric/verify", authMiddleware, async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();

  let [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  if (!user.referralCode) {
    await ensureReferralCode(user.id);
    [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  }

  const coinBalance = await getUserCoinBalance(user.id);

  return c.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,\n      stageName: (user as any).stageName || null,
      balance: user.balance,
      coinBalance,
      referralCode: user.referralCode,
      hasPin: !!user.pinHash,
    },
  });
});

// ── GET /auth/me (protected) ──
auth.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();

  let [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  if (!user.referralCode) {
    await ensureReferralCode(user.id);
    [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  }

  const coinBalance = await getUserCoinBalance(user.id);
  const stageName = (user as any).stageName || null;

  return c.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,\n      stageName: (user as any).stageName || null,
      stageName,
      balance: user.balance,
      coinBalance,
      referralCode: user.referralCode,
      hasPin: !!user.pinHash,
    },
  });
});

// ── POST /auth/logout (protected) ──
auth.post("/logout", authMiddleware, async (c) => {
  const token = c.req.header("Authorization")!.slice(7);
  const db = getDb();

  await db
    .update(sessions)
    .set({ isValid: false })
    .where(eq(sessions.token, token));

  return c.json({ success: true });
});

export default auth;
