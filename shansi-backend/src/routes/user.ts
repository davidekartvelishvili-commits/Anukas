import { Hono } from "hono";
import { z } from "zod";
import { eq, and, or, desc, sql } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { users, transactions, referrals, merchants, paymentTransactions, withdrawals, systemConfig } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { BadRequestError } from "../utils/errors.js";
import { nanoid } from "nanoid";

const user = new Hono<AppEnv>();

user.use("*", authMiddleware);

const updateSchema = z.object({
  name: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

// ── GET /user/profile ──
user.get("/profile", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();

  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return c.json({ success: false, message: "Not found" }, 404);

  // Get coin balance from active transaction
  const [activeTx] = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))))
    .orderBy(desc(transactions.createdAt)).limit(1);

  return c.json({
    success: true,
    user: {
      id: u.id,
      phone: u.phone,
      name: u.name,
      balance: u.balance,
      coinBalance: activeTx?.coinsRemaining || 0,
      hasPin: !!u.pinHash,
      isActive: u.isActive,
      createdAt: u.createdAt,
    },
  });
});

// ── PATCH /user/profile ──
user.patch("/profile", async (c) => {
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.errors[0].message);
  }

  const userId = c.get("userId") as string;
  const db = getDb();

  const updates: Record<string, string> = { updatedAt: new Date().toISOString() };
  if (parsed.data.name) updates.name = parsed.data.name;

  await db.update(users).set(updates).where(eq(users.id, userId));

  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return c.json({
    success: true,
    user: {
      id: u.id,
      phone: u.phone,
      name: u.name,
      balance: u.balance,
      hasPin: !!u.pinHash,
    },
  });
});

// ── GET /user/referral ──
user.get("/referral", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();

  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return c.json({ success: false, message: "Not found" }, 404);

  const referredUsers = await db.select().from(referrals)
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));

  const enriched = await Promise.all(
    referredUsers.map(async (r) => {
      const [referred] = await db.select({ name: users.name, phone: users.phone })
        .from(users).where(eq(users.id, r.referredId)).limit(1);
      return {
        id: r.id,
        userName: referred?.name || null,
        userPhone: referred ? referred.phone.replace(/(\+995\d{3})\d{3}(\d{2})/, "$1***$2") : null,
        coinsRewarded: r.referrerCoinsRewarded,
        date: r.createdAt,
      };
    })
  );

  return c.json({
    success: true,
    referralCode: u.referralCode,
    totalReferrals: u.totalReferrals || 0,
    referredUsers: enriched,
  });
});

// ── GET /user/referral-code ──
user.get("/referral-code", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return c.json({ success: false, message: "Not found" }, 404);
  return c.json({ success: true, referralCode: u.referralCode || null });
});

// ── POST /user/withdraw ──
const withdrawSchema = z.object({
  amount: z.number().positive(),
  iban: z.string().regex(/^GE\d{2}[A-Z0-9]{16}$/, "Invalid IBAN format"),
  bank_name: z.string().min(1),
  account_holder_name: z.string().min(2),
});

user.post("/withdraw", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const { amount, iban, bank_name, account_holder_name } = parsed.data;
  const db = getDb();

  // Check system config
  const [minConfig] = await db.select().from(systemConfig).where(eq(systemConfig.key, "min_withdrawal")).limit(1);
  const [maxConfig] = await db.select().from(systemConfig).where(eq(systemConfig.key, "max_withdrawal_daily")).limit(1);
  const [enabledConfig] = await db.select().from(systemConfig).where(eq(systemConfig.key, "withdrawal_enabled")).limit(1);

  if (enabledConfig?.value === "false") throw new BadRequestError("გამოტანა დროებით შეჩერებულია");

  const minWithdrawal = parseFloat(minConfig?.value || "1.0");
  const maxDaily = parseFloat(maxConfig?.value || "100.0");

  if (amount < minWithdrawal) throw new BadRequestError(`მინიმუმი: ${minWithdrawal}₾`);

  // Check user balance
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) throw new BadRequestError("User not found");
  if (u.balance < amount) throw new BadRequestError("არასაკმარისი ბალანსი");

  // Check daily limit
  const today = new Date().toISOString().split("T")[0];
  const [dailyTotal] = await db.select({
    total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)`,
  }).from(withdrawals).where(
    and(eq(withdrawals.userId, userId), sql`date(${withdrawals.createdAt}) = ${today}`)
  );
  if ((Number(dailyTotal?.total) || 0) + amount > maxDaily) throw new BadRequestError(`დღიური ლიმიტი: ${maxDaily}₾`);

  // Deduct balance
  await db.update(users).set({ balance: Math.round((u.balance - amount) * 100) / 100, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));

  // Create withdrawal
  await db.insert(withdrawals).values({
    id: nanoid(), userId, amount, iban, bankName: bank_name, accountHolderName: account_holder_name,
  });

  return c.json({ success: true, message: "მოთხოვნა მიღებულია" });
});

// ── GET /user/withdrawals ──
user.get("/withdrawals", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();
  const list = await db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt)).limit(50);
  return c.json({ success: true, withdrawals: list });
});

// ── GET /user/transactions ──
user.get("/transactions", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const txList = await db.select().from(paymentTransactions).where(eq(paymentTransactions.userId, userId)).orderBy(desc(paymentTransactions.createdAt)).limit(limit).offset(offset);

  const enriched = await Promise.all(txList.map(async (tx) => {
    const [merchant] = await db.select({ businessName: merchants.businessName, category: merchants.category }).from(merchants).where(eq(merchants.id, tx.merchantId)).limit(1);
    return { ...tx, merchantName: merchant?.businessName, merchantCategory: merchant?.category };
  }));

  return c.json({ success: true, transactions: enriched });
});

// ── POST /user/scan-qr ──
user.post("/scan-qr", async (c) => {
  const body = await c.req.json();
  const qrCode = body.qr_code?.toString().trim();
  if (!qrCode) throw new BadRequestError("QR code required");

  const db = getDb();
  const [merchant] = await db.select().from(merchants).where(and(eq(merchants.qrCode, qrCode), eq(merchants.isActive, true))).limit(1);
  if (!merchant) throw new BadRequestError("მერჩანტი ვერ მოიძებნა");

  return c.json({ success: true, merchant: { id: merchant.id, name: merchant.businessName, nameKa: merchant.businessNameKa, category: merchant.category } });
});

export default user;
