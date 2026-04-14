import { Hono } from "hono";
import { z } from "zod";
import { eq, and, or, desc, sql } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { users, transactions, referrals, merchants, paymentTransactions, withdrawals, systemConfig, pendingPayments, gameConfig, gameHistory, promoCodeUses, promoCodes } from "../db/schema.js";
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

  // Get coin balance — sum of ALL active transactions
  const profileActiveTxs = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))));
  const profileCoinBalance = profileActiveTxs.reduce((sum, t) => sum + (t.coinsRemaining || 0), 0);

  return c.json({
    success: true,
    user: {
      id: u.id,
      phone: u.phone,
      name: u.name,
      balance: u.balance,
      coinBalance: profileCoinBalance,
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

  // Try structured QR: SHANSI:merchantId:paymentId:amount
  if (qrCode.startsWith("SHANSI:")) {
    const parts = qrCode.split(":");
    if (parts.length >= 4) {
      const [, merchantId, paymentId, amountStr] = parts;
      const [payment] = await db.select().from(pendingPayments).where(eq(pendingPayments.id, paymentId)).limit(1);
      if (!payment) throw new BadRequestError("გადახდა ვერ მოიძებნა");
      if (payment.status !== "pending") throw new BadRequestError("გადახდა უკვე დასრულებულია");
      if (new Date(payment.expiresAt) < new Date()) throw new BadRequestError("QR კოდი ვადაგასულია");

      const [m] = await db.select().from(merchants).where(and(eq(merchants.id, merchantId), eq(merchants.isActive, true))).limit(1);
      if (!m) throw new BadRequestError("მერჩანტი ვერ მოიძებნა");

      return c.json({
        success: true,
        type: "payment",
        paymentId,
        merchant: { id: m.id, name: m.businessName, nameKa: m.businessNameKa, category: m.category },
        amount: payment.amount,
      });
    }
  }

  // Legacy: static QR code
  const [merchant] = await db.select().from(merchants).where(and(eq(merchants.qrCode, qrCode), eq(merchants.isActive, true))).limit(1);
  if (!merchant) throw new BadRequestError("მერჩანტი ვერ მოიძებნა");

  return c.json({ success: true, type: "merchant", merchant: { id: merchant.id, name: merchant.businessName, nameKa: merchant.businessNameKa, category: merchant.category } });
});

// ── POST /user/confirm-payment ──
user.post("/confirm-payment", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const { payment_id } = body;
  if (!payment_id) throw new BadRequestError("payment_id required");

  const db = getDb();

  // Find pending payment
  const [payment] = await db.select().from(pendingPayments).where(eq(pendingPayments.id, payment_id)).limit(1);
  if (!payment) throw new BadRequestError("გადახდა ვერ მოიძებნა");
  if (payment.status !== "pending") throw new BadRequestError("გადახდა უკვე დასრულებულია");
  if (new Date(payment.expiresAt) < new Date()) throw new BadRequestError("QR კოდი ვადაგასულია");

  // Find merchant
  const [m] = await db.select().from(merchants).where(eq(merchants.id, payment.merchantId)).limit(1);
  if (!m || !m.isActive) throw new BadRequestError("მერჩანტი არ არის აქტიური");

  const amount = payment.amount;

  // Get config
  const [coinsConfig] = await db.select().from(systemConfig).where(eq(systemConfig.key, "coins_per_lari")).limit(1);
  const coinsPerLari = parseInt(coinsConfig?.value || "100");
  const [cfg] = await db.select().from(gameConfig).limit(1);
  const minReturnPercent = cfg?.minReturnPercent || 0.5;

  // Respect per-merchant commission toggle — if disabled, zero commission, merchant keeps full amount
  const commissionEnabled = (m as any).commissionEnabled !== false;
  const commissionAmount = commissionEnabled
    ? Math.round(amount * m.commissionPercent / 100 * 100) / 100
    : 0;
  const merchantAmount = Math.round((amount - commissionAmount) * 100) / 100;
  const coinsAwarded = Math.round(amount * coinsPerLari);
  const guaranteedMinimum = Math.round(amount * minReturnPercent / 100 * 100) / 100;

  // Create payment transaction
  const paymentTxId = nanoid();
  await db.insert(paymentTransactions).values({
    id: paymentTxId, userId, merchantId: m.id,
    amount, commissionAmount, merchantAmount, coinsAwarded,
  });

  // Create coin transaction for user — LINKED to payment for finance tracking
  await db.insert(transactions).values({
    id: nanoid(), userId, paymentTransactionId: paymentTxId, paymentAmount: amount,
    coinsReceived: coinsAwarded, coinsRemaining: coinsAwarded,
    totalCashWon: 0, guaranteedMinimum, status: "active",
  });

  // Mark pending payment as completed
  await db.update(pendingPayments).set({ status: "completed" }).where(eq(pendingPayments.id, payment_id));

  return c.json({
    success: true,
    coinsAwarded,
    amount,
    merchantName: m.businessName,
    message: `მიიღე ${coinsAwarded} ქოინი!`,
  });
});

// ── GET /user/activity ──
user.get("/activity", async (c) => {
  const userId = c.get("userId") as string;
  const db = getDb();
  const limit = parseInt(c.req.query("limit") || "50");

  const activities: { id: string; type: string; title: string; description: string; amount?: number; coins?: number; color: string; createdAt: string; transactionId?: string }[] = [];

  // 1. Merchant payments — INCLUDE transaction ID
  const payments = await db.select().from(paymentTransactions).where(eq(paymentTransactions.userId, userId)).orderBy(desc(paymentTransactions.createdAt)).limit(limit);
  for (const p of payments) {
    const [m] = await db.select({ businessName: merchants.businessName }).from(merchants).where(eq(merchants.id, p.merchantId)).limit(1);
    activities.push({
      id: p.id,
      type: "payment",
      title: "გადახდა",
      description: `${m?.businessName || "მერჩანტი"} — ${p.amount.toFixed(2)}₾`,
      amount: p.amount, coins: p.coinsAwarded, color: "#3B82F6", createdAt: p.createdAt,
      transactionId: p.id,
    });
  }

  // 2. Game plays — wins and losses
  const games = await db.select().from(gameHistory).where(eq(gameHistory.userId, userId)).orderBy(desc(gameHistory.createdAt)).limit(limit);
  const gameLabels: Record<string, string> = { slot: "Midnight Machine", plinko: "Lucky Drop", chicken_rush: "Lucky Step" };
  for (const g of games) {
    const won = g.winAmount > 0;
    activities.push({
      id: g.id,
      type: won ? "game_win" : "game_loss",
      title: won ? "მოგება" : "თამაში",
      description: `${gameLabels[g.gameType] || g.gameType}${won ? ` — +${g.winAmount.toFixed(2)}₾` : ""}`,
      amount: won ? g.winAmount : undefined,
      color: won ? "#22C55E" : "#EF4444",
      createdAt: g.createdAt,
    });
  }

  // 3. Withdrawals
  const wds = await db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt)).limit(limit);
  const statusLabels: Record<string, string> = { pending: "მოლოდინში", approved: "დამტკიცებული", completed: "დასრულებული", rejected: "უარყოფილი" };
  for (const w of wds) {
    activities.push({
      id: w.id, type: "withdrawal", title: "გამოტანა",
      description: `${w.amount.toFixed(2)}₾ — ${statusLabels[w.status] || w.status}`,
      amount: w.amount, color: w.status === "completed" ? "#22C55E" : w.status === "rejected" ? "#EF4444" : "#F59E0B", createdAt: w.createdAt,
    });
  }

  // 4. Referral rewards
  const refs = await db.select().from(referrals).where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt)).limit(limit);
  for (const r of refs) {
    activities.push({
      id: r.id, type: "referral", title: "რეფერალი",
      description: `მეგობარი შემოუერთდა — +${r.referrerCoinsRewarded} ქოინი`,
      coins: r.referrerCoinsRewarded, color: "#A855F7", createdAt: r.createdAt,
    });
  }

  // 5. Promo code usage
  const promos = await db.select().from(promoCodeUses).where(eq(promoCodeUses.userId, userId)).orderBy(desc(promoCodeUses.usedAt)).limit(limit);
  for (const p of promos) {
    const [code] = await db.select({ code: promoCodes.code }).from(promoCodes).where(eq(promoCodes.id, p.promoCodeId)).limit(1);
    activities.push({
      id: p.id, type: "promo", title: "პრომო კოდი",
      description: `${code?.code || "CODE"} — +${p.coinsRewarded} ქოინი`,
      coins: p.coinsRewarded, color: "#F59E0B", createdAt: p.usedAt,
    });
  }

  // Sort by date descending
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return c.json({ success: true, activities: activities.slice(0, limit) });
});

export default user;
