import { NextResponse } from "next/server";

const DIFFICULTIES: Record<string, { cols: number; rows: number; mult: number }> = {
  easy:    { cols: 5, rows: 25, mult: 1.2 },
  medium:  { cols: 4, rows: 20, mult: 1.3 },
  hard:    { cols: 3, rows: 15, mult: 1.45 },
  extreme: { cols: 2, rows: 10, mult: 1.9 },
};

// In-memory store (replace with Redis in production)
const rounds = new Map<string, { trapMap: number[]; difficulty: string; betAmount: number; currentRow: number; cashedOut: boolean; multiplier: number }>();

// Clean old rounds every 5 min
setInterval(() => { if (rounds.size > 1000) rounds.clear(); }, 300000);

export { rounds };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const difficulty = DIFFICULTIES[body.difficulty] ? body.difficulty : "easy";
    const config = DIFFICULTIES[difficulty];
    const betAmount = body.betAmount || 5;

    const roundId = crypto.randomUUID();
    const trapMap: number[] = [];
    for (let i = 0; i < config.rows; i++) {
      trapMap.push(Math.floor(Math.random() * config.cols));
    }

    rounds.set(roundId, { trapMap, difficulty, betAmount, currentRow: 0, cashedOut: false, multiplier: 1 });

    // TTL cleanup
    setTimeout(() => rounds.delete(roundId), 300000);

    return NextResponse.json({ roundId, rows: config.rows, cols: config.cols });
  } catch {
    return NextResponse.json({ error: "Failed to start" }, { status: 500 });
  }
}
