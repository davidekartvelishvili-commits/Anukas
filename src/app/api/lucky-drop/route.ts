// ============================================
// POST /api/lucky-drop — Server determines slot
// Uses binomial distribution to simulate Plinko
// File: app/api/lucky-drop/route.ts
// ============================================

import { NextResponse } from "next/server";

type RiskLevel = "low" | "mid" | "high";

const BET_COST = 5;

const MULTIPLIERS: Record<RiskLevel, number[]> = {
  low:  [0, 0.5, 1, 1.5, 2, 5, 2, 1.5, 1, 0.5, 0],
  mid:  [0, 0,   0.5, 2, 5, 15, 5, 2, 0.5, 0,   0],
  high: [0, 0,   0,   1, 5, 40, 5, 1, 0,   0,   0],
};

// Simulate Plinko with binomial distribution
// After 12 rows of pegs, ball position follows binomial(12, 0.5)
// mapped to 11 slots (0-10)
function simulateDrop(rows: number = 12): number {
  let position = 0;
  for (let i = 0; i < rows; i++) {
    // Each peg: 50/50 chance left or right, with slight center bias
    position += Math.random() < 0.5 ? 0 : 1;
  }
  // Map 0-12 range to 0-10 slots
  return Math.min(10, Math.floor((position / rows) * 11));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const risk: RiskLevel = ["low", "mid", "high"].includes(body.risk) ? body.risk : "low";

    // ── AUTH CHECK ──
    // const session = await getServerSession();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // ── BALANCE CHECK ──
    // const balance = await redis.get(`balance:${userId}`);
    // if (Number(balance) < BET_COST) {
    //   return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    // }

    // ── DEDUCT BET ──
    // await redis.decrby(`balance:${userId}`, BET_COST);

    // ── DETERMINE RESULT ──
    const slotIndex = simulateDrop(12);
    const multiplier = MULTIPLIERS[risk][slotIndex];
    const winAmount = BET_COST * multiplier;

    // ── CREDIT WINNINGS ──
    // if (winAmount > 0) {
    //   await redis.incrby(`balance:${userId}`, winAmount);
    // }

    // ── LOG DROP ──
    // await prisma.dropLog.create({
    //   data: { userId, betAmount: BET_COST, risk, slotIndex, multiplier, winAmount },
    // });

    return NextResponse.json({
      slotIndex,
      multiplier,
      winAmount,
      risk,
    });
  } catch (error) {
    console.error("Lucky Drop error:", error);
    return NextResponse.json({ error: "Drop failed" }, { status: 500 });
  }
}
