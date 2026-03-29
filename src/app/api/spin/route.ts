// ============================================
// POST /api/spin — Server-side spin result
// The result is ALWAYS determined server-side
// Client only plays the animation
// ============================================
// File: app/api/spin/route.ts

import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";         // Uncomment for DB
// import { redis } from "@/lib/redis";            // Uncomment for Redis balance
// import { getServerSession } from "next-auth";   // Uncomment for auth

const SYMBOLS = [
  { name: "Cherry",  multiplier: 10,   weight: 18 },
  { name: "Melon",   multiplier: 10,   weight: 18 },
  { name: "Banana",  multiplier: 10,   weight: 16 },
  { name: "Clover",  multiplier: 15,   weight: 14 },
  { name: "Bell",    multiplier: 15,   weight: 14 },
  { name: "Diamond", multiplier: 25,   weight: 10 },
  { name: "Crown",   multiplier: 40,   weight: 6  },
  { name: "Seven",   multiplier: 100,  weight: 3  },
  { name: "Covrd",   multiplier: 1000, weight: 1  },
];

const TOTAL_WEIGHT = SYMBOLS.reduce((a, s) => a + s.weight, 0);
const BET_COST = 5;

function weightedRandom() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const sym of SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SYMBOLS[0];
}

function calculateWin(results: typeof SYMBOLS[number][]) {
  const [a, b, c] = results;

  // Triple match
  if (a.name === b.name && b.name === c.name) {
    return {
      winType: "triple" as const,
      multiplier: a.multiplier,
      winAmount: BET_COST * a.multiplier,
      winSymbol: a.name,
    };
  }

  // Double match (any 2)
  let pair: typeof SYMBOLS[number] | null = null;
  if (a.name === b.name) pair = a;
  else if (b.name === c.name) pair = b;
  else if (a.name === c.name) pair = a;

  if (pair) {
    const mult = Math.max(Math.floor(pair.multiplier / 5), 2);
    return {
      winType: "double" as const,
      multiplier: mult,
      winAmount: BET_COST * mult,
      winSymbol: pair.name,
    };
  }

  return {
    winType: "none" as const,
    multiplier: 0,
    winAmount: 0,
  };
}

export async function POST(request: Request) {
  try {
    // ── AUTH CHECK ──
    // const session = await getServerSession();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const userId = session.user.id;

    // ── BALANCE CHECK ──
    // For production, check balance from Redis/DB:
    // const balance = await redis.get(`balance:${userId}`);
    // if (Number(balance) < BET_COST) {
    //   return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    // }

    // ── DEDUCT BET ──
    // await redis.decrby(`balance:${userId}`, BET_COST);

    // ── DETERMINE RESULT (Server-side RNG) ──
    const results = [weightedRandom(), weightedRandom(), weightedRandom()];
    const win = calculateWin(results);

    // ── CREDIT WINNINGS ──
    // if (win.winAmount > 0) {
    //   await redis.incrby(`balance:${userId}`, win.winAmount);
    // }

    // ── LOG SPIN ──
    // await prisma.spinLog.create({
    //   data: {
    //     userId,
    //     betAmount: BET_COST,
    //     symbols: results.map(r => r.name),
    //     winType: win.winType,
    //     winAmount: win.winAmount,
    //     multiplier: win.multiplier,
    //   },
    // });

    return NextResponse.json({
      symbols: results.map((r) => r.name) as [string, string, string],
      winType: win.winType,
      winAmount: win.winAmount,
      multiplier: win.multiplier,
      winSymbol: win.winSymbol || null,
      // balance: Number(await redis.get(`balance:${userId}`)),
    });
  } catch (error) {
    console.error("Spin error:", error);
    return NextResponse.json({ error: "Spin failed" }, { status: 500 });
  }
}
