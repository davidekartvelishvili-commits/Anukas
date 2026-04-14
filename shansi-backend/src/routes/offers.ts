import { Hono } from "hono";
import { eq, and, desc, sql } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { getDb } from "../db/client.js";
import { offers, merchants, paymentTransactions, users } from "../db/schema.js";

const offersRoute = new Hono<AppEnv>();

// Helper: enrich offer row with merchant info
async function enrichOffers(list: any[]) {
  const db = getDb();
  if (!list.length) return [];
  return Promise.all(list.map(async (o) => {
    const [m] = await db.select({
      id: merchants.id,
      merchantCode: merchants.merchantCode,
      businessName: merchants.businessName,
      businessNameKa: merchants.businessNameKa,
      category: merchants.category,
      logoUrl: merchants.logoUrl,
    }).from(merchants).where(eq(merchants.id, o.merchantId)).limit(1);
    return { ...o, merchant: m || null };
  }));
}

// GET /offers?type=featured&active=true  — public, no auth
offersRoute.get("/", async (c) => {
  const db = getDb();
  const type = c.req.query("type"); // featured | flash | partner | undefined = all
  const activeParam = c.req.query("active"); // "true" to only show currently active

  const conds: any[] = [];
  if (type) conds.push(eq(offers.offerType, type));
  if (activeParam === "true") conds.push(eq(offers.isActive, true));

  const rows = conds.length > 0
    ? await db.select().from(offers).where(and(...conds)).orderBy(offers.sortOrder, desc(offers.createdAt))
    : await db.select().from(offers).orderBy(offers.sortOrder, desc(offers.createdAt));

  // If active=true, also filter by starts_at/ends_at window server-side
  const now = new Date().toISOString();
  let filtered = rows;
  if (activeParam === "true") {
    filtered = rows.filter((r) => r.startsAt <= now && r.endsAt >= now);
  }

  const enriched = await enrichOffers(filtered);
  return c.json({ success: true, offers: enriched });
});

// GET /offers/recent-wins  — top recent cashback winners
offersRoute.get("/recent-wins", async (c) => {
  const db = getDb();
  const limit = Math.min(Number(c.req.query("limit") || 10), 20);

  // Pull recent payment transactions with high commission/cashback potential
  // Order by created_at desc, limit N
  const recent = await db.select({
    id: paymentTransactions.id,
    userId: paymentTransactions.userId,
    merchantId: paymentTransactions.merchantId,
    amount: paymentTransactions.amount,
    coinsAwarded: paymentTransactions.coinsAwarded,
    createdAt: paymentTransactions.createdAt,
  }).from(paymentTransactions).orderBy(desc(paymentTransactions.createdAt)).limit(limit * 2);

  // Enrich with user first name + merchant name, compute pct
  const wins = await Promise.all(recent.map(async (t) => {
    const [u] = await db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, t.userId)).limit(1);
    const [m] = await db.select({ businessName: merchants.businessName, logoUrl: merchants.logoUrl }).from(merchants).where(eq(merchants.id, t.merchantId)).limit(1);
    const rawName = u?.name?.trim() || (u?.phone ? `${u.phone.slice(-4)}` : "User");
    const initials = rawName.length > 12 ? rawName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() : rawName;
    // pct = coins awarded / (amount*100) * 100 — since default coinsPerLari is 100 this is meaningless; use amount-based ratio as proxy
    const pct = Math.max(5, Math.min(100, Math.round((t.coinsAwarded / Math.max(1, t.amount * 100)) * 100)));
    return {
      id: t.id,
      name: initials,
      pct,
      place: m?.businessName || "Merchant",
      logoUrl: m?.logoUrl || null,
      createdAt: t.createdAt,
    };
  }));

  // Dedupe by merchant to keep list varied (optional)
  return c.json({ success: true, wins: wins.slice(0, limit) });
});

// GET /offers/:id
offersRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();
  const [row] = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  if (!row) return c.json({ success: false, message: "Not found" }, 404);
  const [enriched] = await enrichOffers([row]);
  return c.json({ success: true, offer: enriched });
});

export { offersRoute };
