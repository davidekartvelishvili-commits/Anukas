import { eq, and, or } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { transactions } from "../db/schema.js";
import { nanoid } from "nanoid";

/** Get a user's total coin balance across active transactions. */
export async function getCoinBalance(userId: string): Promise<number> {
  const db = getDb();
  const activeTxs = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))));
  return activeTxs.reduce((sum, t) => sum + (t.coinsRemaining || 0), 0);
}

/** Deduct coins from a user's oldest active transaction. Returns true if successful. */
export async function deductCoins(userId: string, amount: number): Promise<boolean> {
  const db = getDb();
  const activeTxs = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))));
  const total = activeTxs.reduce((sum, t) => sum + (t.coinsRemaining || 0), 0);
  if (total < amount) return false;

  let remaining = amount;
  for (const tx of activeTxs) {
    if (remaining <= 0) break;
    const deduct = Math.min(tx.coinsRemaining || 0, remaining);
    if (deduct > 0) {
      await db.update(transactions).set({
        coinsRemaining: (tx.coinsRemaining || 0) - deduct,
      }).where(eq(transactions.id, tx.id));
      remaining -= deduct;
    }
  }
  return true;
}

/** Add coins to a user — creates a new active transaction if none exists. */
export async function addCoins(userId: string, amount: number): Promise<void> {
  const db = getDb();
  const activeTxs = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), or(eq(transactions.status, "active"), eq(transactions.status, "bonus_round"))));

  if (activeTxs.length > 0) {
    await db.update(transactions).set({
      coinsRemaining: (activeTxs[0].coinsRemaining || 0) + amount,
    }).where(eq(transactions.id, activeTxs[0].id));
  } else {
    await db.insert(transactions).values({
      id: nanoid(),
      userId,
      paymentAmount: 0,
      coinsReceived: amount,
      coinsRemaining: amount,
      totalCashWon: 0,
      guaranteedMinimum: 0,
      status: "active",
    });
  }
}
