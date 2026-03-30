import { NextResponse } from "next/server";
import { rounds } from "../store";

export async function POST(request: Request) {
  try {
    const { roundId, betAmount } = await request.json();
    const round = rounds.get(roundId);
    if (!round) return NextResponse.json({ error: "Invalid round" }, { status: 400 });
    if (round.cashedOut) return NextResponse.json({ error: "Already cashed out" }, { status: 400 });
    if (round.currentRow === 0) return NextResponse.json({ error: "No steps taken" }, { status: 400 });

    round.cashedOut = true;
    const winAmount = Math.round((betAmount || round.betAmount) * round.multiplier * 100) / 100;
    rounds.delete(roundId);

    return NextResponse.json({ winAmount });
  } catch {
    return NextResponse.json({ error: "Cashout failed" }, { status: 500 });
  }
}
