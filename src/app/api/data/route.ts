import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();
const DATA_KEY = "anukas-calories-data";

// GET - load saved data
export async function GET() {
  try {
    const data = await redis.get(DATA_KEY);
    return NextResponse.json(data || null);
  } catch {
    return NextResponse.json(null);
  }
}

// POST - save data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await redis.set(DATA_KEY, body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
