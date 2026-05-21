import { Hono } from "hono";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { MerchantEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { merchants, paymentTransactions, pendingPayments, users, transactions, systemConfig, gameConfig, tickets, userTickets } from "../db/schema.js";
import { merchantMiddleware } from "../middleware/merchant.js";
import { getEnv } from "../utils/env.js";
import { BadRequestError, RateLimitError } from "../utils/errors.js";
import { sendOtp, verifyOtp } from "../services/otp.js";
import { otpRateLimits } from "../db/schema.js";

const merchant = new Hono<MerchantEnv>();

// ══════════════════════════════════════
// PUBLIC ROUTES (no auth)
// ══════════════════════════════════════

// POST /merchant/send-otp — send OTP to merchant phone
merchant.post("/send-otp", async (c) => {
  const body = await c.req.json();
  const phone = body.phone?.trim();
  if (!phone || phone.length < 5) throw new BadRequestError("ტელეფონის ნომერი სავალდებულოა");

  const db = getDb();

  // Rate limit: 5 attempts per 10 minutes
  const rlKey = `merchant:${phone}`;
  const [rl] = await db.select().from(otpRateLimits).where(eq(otpRateLimits.phone, rlKey)).limit(1);
  const now = new Date();
  const windowMs = 10 * 60 * 1000;

  if (rl) {
    const ws = new Date(rl.windowStart);
    if (now.getTime() - ws.getTime() < windowMs && rl.attempts >= 5) {
      throw new RateLimitError("ძალიან ბევრი მცდელობა, სცადეთ 10 წუთში");
    }
    if (now.getTime() - ws.getTime() >= windowMs) {
      await db.update(otpRateLimits).set({ attempts: 1, windowStart: now.toISOString() }).where(eq(otpRateLimits.phone, rlKey));
    } else {
      await db.update(otpRateLimits).set({ attempts: rl.attempts + 1 }).where(eq(otpRateLimits.phone, rlKey));
    }
  } else {
    await db.insert(otpRateLimits).values({ id: nanoid(), phone: rlKey, attempts: 1, windowStart: now.toISOString() });
  }

  await sendOtp(phone);
  return c.json({ success: true, message: "კოდი გაიგზავნა" });
});

// POST /merchant/verify-otp — verify OTP code
merchant.post("/verify-otp", async (c) => {
  const body = await c.req.json();
  const phone = body.phone?.trim();
  const code = body.code?.trim();
  if (!phone || !code) throw new BadRequestError("ტელეფონი და კოდი სავალდებულოა");

  const isValid = await verifyOtp(phone, code);
  if (!isValid) throw new BadRequestError("არასწორი კოდი");

  return c.json({ success: true, verified: true });
});

// POST /merchant/register — requires OTP verification first
const registerSchema = z.object({
  business_name: z.string().min(1, "ბიზნესის სახელი სავალდებულოა"),
  business_name_ka: z.string().min(1, "ქართული სახელი სავალდებულოა"),
  category: z.string().min(1, "კატეგორია სავალდებულოა"),
  phone: z.string().min(5, "ტელეფონი სავალდებულოა"),
  email: z.string().email("არასწორი ელ-ფოსტა"),
  address: z.string().min(1, "მისამართი სავალდებულოა"),
  contact_person: z.string().min(1, "საკონტაქტო პირი სავალდებულოა"),
  otp_code: z.string().min(4, "OTP კოდი სავალდებულოა"),
});

merchant.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const { business_name, business_name_ka, category, phone, email, address, contact_person, otp_code } = parsed.data;

  // Verify OTP
  const isValid = await verifyOtp(phone, otp_code);
  if (!isValid) throw new BadRequestError("არასწორი კოდი, სცადეთ თავიდან");

  // Check if phone already registered
  const [existing] = await db.select().from(merchants).where(eq(merchants.phone, phone)).limit(1);
  if (existing) throw new BadRequestError("ეს ტელეფონი უკვე რეგისტრირებულია");

  const id = nanoid();
  await db.insert(merchants).values({
    id,
    businessName: business_name,
    businessNameKa: business_name_ka,
    category,
    phone,
    email,
    address,
    contactPerson: contact_person,
    isVerified: true,
  });

  return c.json({ success: true, message: "განაცხადი მიღებულია, მოიცადეთ დამტკიცებას" });
});

// Helper: find merchant by code OR phone
async function findMerchantByIdentifier(identifier: string) {
  const db = getDb();
  const val = identifier.trim();
  // Try merchant code first
  if (val.toUpperCase().startsWith("SH-")) {
    const [m] = await db.select().from(merchants).where(eq(merchants.merchantCode, val.toUpperCase())).limit(1);
    if (m) return m;
  }
  // Try phone (with or without +995 prefix)
  const phone = val.startsWith("+") ? val : val.replace(/^995/, "+995").replace(/^5/, "+9955");
  const [byPhone] = await db.select().from(merchants).where(eq(merchants.phone, phone)).limit(1);
  if (byPhone) return byPhone;
  // Try raw value as phone
  const [byRaw] = await db.select().from(merchants).where(eq(merchants.phone, val)).limit(1);
  return byRaw || null;
}

// POST /merchant/setup-pin
const setupPinSchema = z.object({
  identifier: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
});

merchant.post("/setup-pin", async (c) => {
  const body = await c.req.json();
  const parsed = setupPinSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const m = await findMerchantByIdentifier(parsed.data.identifier);
  if (!m) throw new BadRequestError("მერჩანტი ვერ მოიძებნა");
  if (!m.isActive) throw new BadRequestError("მერჩანტი ჯერ არ არის დამტკიცებული");
  if (m.pinHash) throw new BadRequestError("PIN უკვე დაყენებულია. გამოიყენეთ პარამეტრები შესაცვლელად");

  const hash = await bcrypt.hash(parsed.data.pin, 10);
  await db.update(merchants).set({ pinHash: hash }).where(eq(merchants.id, m.id));

  // Auto-login: return JWT token so merchant goes straight to app
  const token = jwt.sign({ merchantId: m.id }, getEnv().JWT_SECRET, { expiresIn: "24h" });

  return c.json({
    success: true,
    message: "PIN დაყენებულია",
    token,
    merchant: {
      id: m.id, merchantCode: m.merchantCode, businessName: m.businessName,
      businessNameKa: m.businessNameKa, category: m.category,
    },
  });
});

// POST /merchant/login
const loginSchema = z.object({
  identifier: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/),
});

merchant.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) throw new BadRequestError(parsed.error.errors[0].message);

  const db = getDb();
  const m = await findMerchantByIdentifier(parsed.data.identifier);
  if (!m) throw new BadRequestError("მერჩანტი ვერ მოიძებნა");
  if (!m.isActive) throw new BadRequestError("მერჩანტი არ არის აქტიური");
  if (!m.pinHash) throw new BadRequestError("PIN არ არის დაყენებული. გადადით PIN-ის დაყენების გვერდზე");

  const valid = await bcrypt.compare(parsed.data.pin, m.pinHash);
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

// ══════════════════════════════════════════════════════════════════
//   TICKETS (merchant-side) — scan + redeem + history
// ══════════════════════════════════════════════════════════════════

// POST /merchant/tickets/verify — merchant scans a user's ticket QR.
// Validates: QR exists, not already redeemed, and CRITICALLY that the
// ticket's merchant_id matches the authenticated merchant (Cinepark
// can only scan Cinepark tickets, etc.). Returns ticket details so the
// merchant can see what the user is trying to redeem before approving.
merchant.post("/tickets/verify", merchantMiddleware, async (c) => {
  const merchantId = c.get("merchantId") as string;
  const body = await c.req.json();
  const qrCode: string = (body?.qr_code || body?.qrCode || "").trim();
  if (!qrCode) return c.json({ success: false, message: "Missing QR code" }, 400);

  const db = getDb();
  const [ut] = await db.select().from(userTickets).where(eq(userTickets.qrCode, qrCode)).limit(1);
  if (!ut) return c.json({ success: false, code: "NOT_FOUND", message: "არასწორი ტიკეტი" }, 404);

  const [tpl] = await db.select().from(tickets).where(eq(tickets.id, ut.ticketId)).limit(1);
  if (!tpl) return c.json({ success: false, code: "NOT_FOUND", message: "ტიკეტი არ მოიძებნა" }, 404);

  // Ownership check — the ticket template must belong to this merchant.
  // Allows null merchantId tickets (pre-link legacy data) to be redeemable
  // by any merchant; otherwise strict match.
  if (tpl.merchantId && tpl.merchantId !== merchantId) {
    return c.json({ success: false, code: "WRONG_MERCHANT", message: "ეს ტიკეტი სხვა მერჩანტისაა" }, 403);
  }

  if (ut.redeemedAt) {
    return c.json({
      success: false,
      code: "ALREADY_USED",
      message: "ტიკეტი უკვე გამოყენებულია",
      redeemedAt: ut.redeemedAt,
    }, 409);
  }

  // Pull user's display name for context
  const [u] = await db.select({ id: users.id, name: users.name, phone: users.phone }).from(users).where(eq(users.id, ut.userId)).limit(1);

  let termsArr: string[] = [];
  try { termsArr = JSON.parse((tpl as any).termsJson || "[]"); } catch {}

  return c.json({
    success: true,
    userTicket: { id: ut.id, qrCode: ut.qrCode, activatedAt: ut.activatedAt },
    ticket: {
      ...tpl,
      terms: termsArr,
      row: (tpl as any).rowLabel,
    },
    user: u || null,
  });
});

// POST /merchant/tickets/redeem — merchant confirms activation. Marks
// redeemed_at, expires_at = now + 5h, records this merchant as redeemer.
merchant.post("/tickets/redeem", merchantMiddleware, async (c) => {
  const merchantId = c.get("merchantId") as string;
  const body = await c.req.json();
  const userTicketId: string = body?.user_ticket_id || body?.userTicketId;
  if (!userTicketId) return c.json({ success: false, message: "Missing user_ticket_id" }, 400);

  const db = getDb();
  const [ut] = await db.select().from(userTickets).where(eq(userTickets.id, userTicketId)).limit(1);
  if (!ut) return c.json({ success: false, code: "NOT_FOUND", message: "Ticket not found" }, 404);
  if (ut.redeemedAt) {
    return c.json({ success: false, code: "ALREADY_USED", message: "ტიკეტი უკვე გამოყენებულია" }, 409);
  }
  const [tpl] = await db.select().from(tickets).where(eq(tickets.id, ut.ticketId)).limit(1);
  if (tpl?.merchantId && tpl.merchantId !== merchantId) {
    return c.json({ success: false, code: "WRONG_MERCHANT", message: "სხვა მერჩანტის ტიკეტი" }, 403);
  }

  const now = new Date();
  const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

  // Atomic conditional update: only succeed if redeemed_at is still NULL.
  // Blocks double-redeem under concurrent requests (the read-check-write
  // path above has a race; this second gate closes it).
  const result: any = await (db as any).run(
    sql`UPDATE user_tickets
        SET redeemed_at = ${fmt(now)},
            expires_at = ${fmt(fiveHoursLater)},
            redeemed_by_merchant_id = ${merchantId}
        WHERE id = ${userTicketId} AND redeemed_at IS NULL`
  );
  const affected = result?.rowsAffected ?? result?.changes ?? 0;
  if (!affected) {
    return c.json({ success: false, code: "ALREADY_USED", message: "ტიკეტი უკვე გამოყენებულია" }, 409);
  }

  return c.json({ success: true, redeemedAt: fmt(now), expiresAt: fmt(fiveHoursLater) });
});

// GET /merchant/tickets/history — paginated list of this merchant's
// redeemed tickets. Used in the merchant transaction history view.
merchant.get("/tickets/history", merchantMiddleware, async (c) => {
  const merchantId = c.get("merchantId") as string;
  const page = parseInt(c.req.query("page") || "1");
  const limit = Math.min(parseInt(c.req.query("limit") || "30"), 100);
  const offset = (page - 1) * limit;

  const db = getDb();
  const rows = await db.select().from(userTickets)
    .where(eq(userTickets.redeemedByMerchantId, merchantId))
    .orderBy(desc(userTickets.redeemedAt))
    .limit(limit)
    .offset(offset);
  const enriched = await Promise.all(rows.map(async (ut) => {
    const [t] = await db.select({ id: tickets.id, title: tickets.title, titleKa: tickets.titleKa, price: tickets.price, bonus: tickets.bonus, serial: tickets.serial, logoUrl: tickets.logoUrl, category: tickets.category }).from(tickets).where(eq(tickets.id, ut.ticketId)).limit(1);
    const [u] = await db.select({ id: users.id, name: users.name, phone: users.phone }).from(users).where(eq(users.id, ut.userId)).limit(1);
    return { ...ut, ticket: t || null, user: u || null };
  }));
  return c.json({ success: true, redemptions: enriched });
});

export default merchant;
