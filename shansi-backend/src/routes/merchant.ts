import { Hono } from "hono";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { MerchantEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { merchants, paymentTransactions, pendingPayments, users, transactions, systemConfig, gameConfig } from "../db/schema.js";
import { merchantMiddleware } from "../middleware/merchant.js";
import { getEnv } from "../utils/env.js";
import { BadRequestError } from "../utils/errors.js";

const merchant = new Hono<MerchantEnv>();

// ══════════════════════════════════════
// PUBLIC ROUTES (no auth)
// ══════════════════════════════════════

// POST /merchant/register
const registerSchema = z.object({
  business_name: z.string().min(1),
  business_name_ka: z.string().optional(),
  category: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
});

merchant.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const { business_name, business_name_ka, category, phone, email, address, contact_person } = parsed.data;

  // Check if phone already registered
  const [existing] = await db.select().from(merchants).where(eq(merchants.phone, phone)).limit(1);
  if (existing) throw new BadRequestError("ეს ტელეფონი უკვე რეგისტრირებულია");

  const id = nanoid();
  await db.insert(merchants).values({
    id,
    businessName: business_name,
    businessNameKa: business_name_ka || null,
    category,
    phone,
    email: email || null,
    address: address || null,
    contactPerson: contact_person || null,
  });

  return c.json({ success: true, message: "განაცხადი მიღებულია, მოიცადეთ დამტკიცებას" });
});

// POST /merchant/setup-pin
const setupPinSchema = z.object({
  merchant_code: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
});

merchant.post("/setup-pin", async (c) => {
  const body = await c.req.json();
  const parsed = setupPinSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const { merchant_code, pin } = parsed.data;

  const [m] = await db.select().from(merchants).where(eq(merchants.merchantCode, merchant_code.toUpperCase())).limit(1);
  if (!m) throw new BadRequestError("მერჩანტი ვერ მოიძებნა");
  if (!m.isActive) throw new BadRequestError("მერჩანტი ჯერ არ არის დამტკიცებული");
  if (m.pinHash) throw new BadRequestError("PIN უკვე დაყენებულია. გამოიყენეთ პარამეტრები შესაცვლელად");

  const hash = await bcrypt.hash(pin, 10);
  await db.update(merchants).set({ pinHash: hash }).where(eq(merchants.id, m.id));

  return c.json({ success: true, message: "PIN დაყენებულია" });
});

// POST /merchant/login
const loginSchema = z.object({
  merchant_code: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/),
});

merchant.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const { merchant_code, pin } = parsed.data;

  const [m] = await db.select().from(merchants).where(eq(merchants.merchantCode, merchant_code.toUpperCase())).limit(1);
  if (!m) throw new BadRequestError("მერჩანტი ვერ მოიძებნა");
  if (!m.isActive) throw new BadRequestError("მერჩანტი არ არის აქტიური");
  if (!m.pinHash) throw new BadRequestError("PIN არ არის დაყენებული. გადადით PIN-ის დაყენების გვერდზე");

  const valid = await bcrypt.compare(pin, m.pinHash);
  if (!valid) throw new BadRequestError("არასწორი PIN");

  const token = jwt.sign({ merchantId: m.id }, getEnv().JWT_SECRET, { expiresIn: "24h" });

  return c.json({
    success: true,
    token,
    merchant: {
      id: m.id,
      merchantCode: m.merchantCode,
      businessName: m.businessName,
      businessNameKa: m.businessNameKa,
      category: m.category,
    },
  });
});

// ══════════════════════════════════════
// PROTECTED ROUTES (merchant auth)
// ══════════════════════════════════════

// GET /merchant/profile
merchant.get("/profile", merchantMiddleware, async (c) => {
  const merchantId = c.get("merchantId") as string;
  const db = getDb();
  const [m] = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);
  if (!m) return c.json({ success: false, message: "Not found" }, 404);

  return c.json({
    success: true,
    merchant: {
      id: m.id,
      merchantCode: m.merchantCode,
      businessName: m.businessName,
      businessNameKa: m.businessNameKa,
      category: m.category,
      phone: m.phone,
      email: m.email,
      address: m.address,
      commissionPercent: m.commissionPercent,
      isActive: m.isActive,
    },
  });
});

// GET /merchant/stats
merchant.get("/stats", merchantMiddleware, async (c) => {
  const merchantId = c.get("merchantId") as string;
  const db = getDb();

  const today = new Date().toISOString().split("T")[0];

  const [allStats] = await db.select({
    totalTx: sql<number>`count(*)`,
    totalAmount: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)`,
    totalCommission: sql<number>`coalesce(sum(${paymentTransactions.commissionAmount}), 0)`,
  }).from(paymentTransactions).where(eq(paymentTransactions.merchantId, merchantId));

  const [todayStats] = await db.select({
    todayTx: sql<number>`count(*)`,
    todayAmount: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)`,
  }).from(paymentTransactions).where(
    and(eq(paymentTransactions.merchantId, merchantId), sql`date(${paymentTransactions.createdAt}) = ${today}`)
  );

  return c.json({
    success: true,
    stats: {
      totalTransactions: Number(allStats?.totalTx) || 0,
      totalAmount: Number(allStats?.totalAmount) || 0,
      totalCommission: Number(allStats?.totalCommission) || 0,
      todayTransactions: Number(todayStats?.todayTx) || 0,
      todayAmount: Number(todayStats?.todayAmount) || 0,
    },
  });
});

// GET /merchant/transactions
merchant.get("/transactions", merchantMiddleware, async (c) => {
  const merchantId = c.get("merchantId") as string;
  const db = getDb();
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const txList = await db.select().from(paymentTransactions)
    .where(eq(paymentTransactions.merchantId, merchantId))
    .orderBy(desc(paymentTransactions.createdAt)).limit(limit).offset(offset);

  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(paymentTransactions)
    .where(eq(paymentTransactions.merchantId, merchantId));

  return c.json({
    success: true,
    transactions: txList,
    pagination: { page, limit, total: Number(totalResult?.count) || 0 },
  });
});

// POST /merchant/generate-qr
merchant.post("/generate-qr", merchantMiddleware, async (c) => {
  const merchantId = c.get("merchantId") as string;
  const body = await c.req.json();
  const amount = body.amount;
  if (!amount || amount <= 0) throw new BadRequestError("Invalid amount");

  const db = getDb();
  const paymentId = nanoid();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  await db.insert(pendingPayments).values({
    id: paymentId,
    merchantId,
    amount,
    status: "pending",
    expiresAt,
  });

  // QR data: structured string
  const qrData = `SHANSI:${merchantId}:${paymentId}:${amount}`;

  return c.json({
    success: true,
    paymentId,
    qrData,
    amount,
    expiresAt,
  });
});

// GET /merchant/payment/:id/status
merchant.get("/payment/:id/status", merchantMiddleware, async (c) => {
  const paymentId = c.req.param("id") as string;
  const db = getDb();

  const [payment] = await db.select().from(pendingPayments).where(eq(pendingPayments.id, paymentId)).limit(1);
  if (!payment) return c.json({ success: false, message: "Not found" }, 404);

  const expired = new Date(payment.expiresAt) < new Date();

  return c.json({
    success: true,
    status: expired && payment.status === "pending" ? "expired" : payment.status,
    amount: payment.amount,
  });
});

// PATCH /merchant/change-pin
const changePinSchema = z.object({
  current_pin: z.string().regex(/^\d{4}$/),
  new_pin: z.string().regex(/^\d{4}$/),
});

merchant.patch("/change-pin", merchantMiddleware, async (c) => {
  const merchantId = c.get("merchantId") as string;
  const body = await c.req.json();
  const parsed = changePinSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const [m] = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);
  if (!m || !m.pinHash) throw new BadRequestError("Merchant not found");

  const valid = await bcrypt.compare(parsed.data.current_pin, m.pinHash);
  if (!valid) throw new BadRequestError("არასწორი მიმდინარე PIN");

  const newHash = await bcrypt.hash(parsed.data.new_pin, 10);
  await db.update(merchants).set({ pinHash: newHash }).where(eq(merchants.id, merchantId));

  return c.json({ success: true, message: "PIN შეცვლილია" });
});

export default merchant;
