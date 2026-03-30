import { NextResponse } from "next/server";
import { rounds } from "../start/route";

const MULTS: Record<string, number> = { easy: 1.2, medium: 1.3, hard: 1.45, extreme: 1.9 };

export async function POST(request: Request) {
  try {
    const { roundId, row, column } = await request.json();
    const round = rounds.get(roundId);
    if (!round) return NextResponse.json({ error: "Invalid round" }, { status: 400 });
    if (round.cashedOut) return NextResponse.json({ error: "Already cashed out" }, { status: 400 });
    if (row !== round.currentRow) return NextResponse.json({ error: "Wrong row" }, { status: 400 });

    const isTrap = round.trapMap[row] === column;

    if (isTrap) {
      const trapMap = round.trapMap;
      rounds.delete(roundId);
      return NextResponse.json({ safe: false, multiplier: 0, nextRow: row, trapColumn: column, trapMap });
    }

    round.multiplier *= MULTS[round.difficulty] || 1.2;
    round.currentRow = row + 1;

    return NextResponse.json({
      safe: true,
      multiplier: Math.round(round.multiplier * 100) / 100,
      nextRow: round.currentRow,
    });
  } catch {
    return NextResponse.json({ error: "Step failed" }, { status: 500 });
  }
}
