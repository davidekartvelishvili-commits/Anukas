import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

const GLOBAL_KEY = "anukas-global";
const DAYS_INDEX_KEY = "anukas-days-index";

function dayKey(date: string) {
  return `anukas-day-${date}`;
}

// GET - load saved data
// GET /api/data — returns global data (profile, regime)
// GET /api/data?date=2026-05-27 — returns daily data for that date
// GET /api/data?daysIndex=1 — returns the list of dates that have data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const daysIndex = searchParams.get("daysIndex");

    if (daysIndex) {
      // Return the list of dates that have data
      const dates = await redis.smembers(DAYS_INDEX_KEY);
      return NextResponse.json(dates || []);
    }

    if (date) {
      // Return daily data for that date
      const data = await redis.get(dayKey(date));
      return NextResponse.json(data || null);
    }

    // Return global data (profile, regime) + migrate from old key if needed
    let globalData = await redis.get(GLOBAL_KEY);
    if (!globalData) {
      // Try to migrate from old unified key
      const oldData = await redis.get("anukas-calories-data") as Record<string, unknown> | null;
      if (oldData) {
        const { profile, regime, ...dailyFields } = oldData;
        // Save global
        const global = { profile, regime };
        await redis.set(GLOBAL_KEY, global);
        // Save daily data under today's date
        const today = new Date().toISOString().split("T")[0];
        const daily = {
          foods: dailyFields.foods || [],
          waterMl: dailyFields.waterMl || 0,
          weight: dailyFields.weight || 65,
          userActivities: (dailyFields as Record<string, unknown>).activities || [],
        };
        await redis.set(dayKey(today), daily);
        await redis.sadd(DAYS_INDEX_KEY, today);
        globalData = global;
      }
    }
    return NextResponse.json(globalData || null);
  } catch {
    return NextResponse.json(null);
  }
}

// POST - save data
// POST with { type: "global", profile, regime } — saves global
// POST with { type: "daily", date: "2026-05-27", foods, waterMl, weight, userActivities } — saves daily
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type === "global") {
      const { profile, regime } = body;
      await redis.set(GLOBAL_KEY, { profile, regime });
      return NextResponse.json({ ok: true });
    }

    if (body.type === "daily") {
      const { date, foods, waterMl, weight, userActivities } = body;
      await redis.set(dayKey(date), { foods, waterMl, weight, userActivities });
      // Track this date in the index if it has meaningful data
      const hasData = (foods && foods.length > 0) || (userActivities && userActivities.length > 0) || (waterMl && waterMl > 0);
      if (hasData) {
        await redis.sadd(DAYS_INDEX_KEY, date);
      } else {
        await redis.srem(DAYS_INDEX_KEY, date);
      }
      return NextResponse.json({ ok: true });
    }

    // Fallback: old-style save (shouldn't happen after migration)
    await redis.set("anukas-calories-data", body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
