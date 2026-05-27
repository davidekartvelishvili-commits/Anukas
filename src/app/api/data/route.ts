import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

function globalKey(phone: string) {
  return `anukas-global-${phone}`;
}

function daysIndexKey(phone: string) {
  return `anukas-days-${phone}`;
}

function dayKey(phone: string, date: string) {
  return `anukas-day-${phone}-${date}`;
}

// GET - load saved data
// GET /api/data?phone=592322992 — returns global data (profile, regime)
// GET /api/data?phone=592322992&date=2026-05-27 — returns daily data for that date
// GET /api/data?phone=592322992&daysIndex=1 — returns the list of dates that have data
// GET /api/data?phone=592322992&history=1 — returns the last 30 days of daily data
// GET /api/data?allUsersHistory=1 — returns last 30 days for ALL users (challenge feed)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const date = searchParams.get("date");
    const daysIndex = searchParams.get("daysIndex");
    const history = searchParams.get("history");
    const allUsersHistory = searchParams.get("allUsersHistory");

    // All-users history for challenge page (no phone required)
    if (allUsersHistory) {
      // Find all user keys
      const userKeys: string[] = [];
      let cursor = 0;
      do {
        const [nextCursor, keys] = await redis.scan(cursor, { match: "anukas-user-*", count: 100 });
        cursor = Number(nextCursor);
        userKeys.push(...keys);
      } while (cursor !== 0);

      const today = new Date();
      const dates: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        );
      }

      const allUsersData: {
        phone: string;
        name: string;
        date: string;
        foods: unknown[];
        waterMl: number;
        weight: number | null;
        userActivities: unknown[];
        goalCalories: number | null;
      }[] = [];

      for (const userKey of userKeys) {
        const userPhone = userKey.replace("anukas-user-", "");
        const userData = (await redis.get(userKey)) as Record<string, unknown> | null;
        const userName = (userData?.name as string) || userPhone;

        // Fetch all 30 days for this user in parallel
        const results = await Promise.all(
          dates.map((dt) => redis.get(dayKey(userPhone, dt)))
        );

        for (let i = 0; i < dates.length; i++) {
          const raw = results[i] as Record<string, unknown> | null;
          if (!raw) continue;
          const hasFoods = Array.isArray(raw.foods) && raw.foods.length > 0;
          const hasActivities = Array.isArray(raw.userActivities) && raw.userActivities.length > 0;
          const hasWater = typeof raw.waterMl === "number" && raw.waterMl > 0;
          if (!hasFoods && !hasActivities && !hasWater) continue;

          allUsersData.push({
            phone: userPhone,
            name: userName,
            date: dates[i],
            foods: (raw.foods as unknown[]) || [],
            waterMl: (raw.waterMl as number) || 0,
            weight: (raw.weight as number) || null,
            userActivities: (raw.userActivities as unknown[]) || [],
            goalCalories: (raw.goalCalories as number) || null,
          });
        }
      }

      return NextResponse.json(allUsersData);
    }

    // All other endpoints require phone
    if (!phone) {
      return NextResponse.json({ error: "phone parameter is required" }, { status: 400 });
    }

    if (history) {
      // Return historical data for the last 30 days
      const today = new Date();
      const dates: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        );
      }
      // Fetch all days in parallel
      const results = await Promise.all(
        dates.map((dt) => redis.get(dayKey(phone, dt)))
      );
      const historyData: Record<string, unknown>[] = [];
      for (let i = 0; i < dates.length; i++) {
        const raw = results[i] as Record<string, unknown> | null;
        historyData.push({
          date: dates[i],
          weight: raw?.weight ?? null,
          foods: raw?.foods ?? [],
          waterMl: raw?.waterMl ?? 0,
          userActivities: raw?.userActivities ?? [],
          goalCalories: raw?.goalCalories ?? null,
        });
      }
      return NextResponse.json(historyData);
    }

    if (daysIndex) {
      // Return the list of dates that have data
      const dates = await redis.smembers(daysIndexKey(phone));
      return NextResponse.json(dates || []);
    }

    if (date) {
      // Return daily data for that date
      const data = await redis.get(dayKey(phone, date));
      return NextResponse.json(data || null);
    }

    // Return global data (profile, regime) + migrate from old keys if needed
    let globalData = await redis.get(globalKey(phone));
    if (!globalData && phone === "592322992") {
      // Try to migrate from old unified keys for the first user
      const oldGlobal = await redis.get("anukas-global") as Record<string, unknown> | null;
      if (oldGlobal) {
        await redis.set(globalKey(phone), oldGlobal);
        globalData = oldGlobal;
      } else {
        // Try legacy key
        const oldData = await redis.get("anukas-calories-data") as Record<string, unknown> | null;
        if (oldData) {
          const { profile, regime, ...dailyFields } = oldData;
          const global = { profile, regime };
          await redis.set(globalKey(phone), global);
          const today = new Date().toISOString().split("T")[0];
          const daily = {
            foods: dailyFields.foods || [],
            waterMl: dailyFields.waterMl || 0,
            weight: dailyFields.weight || 65,
            userActivities: (dailyFields as Record<string, unknown>).activities || [],
          };
          await redis.set(dayKey(phone, today), daily);
          await redis.sadd(daysIndexKey(phone), today);
          globalData = global;
        }
      }
      // Also migrate old day keys (anukas-day-YYYY-MM-DD -> anukas-day-phone-YYYY-MM-DD)
      const oldDaysIndex = await redis.smembers("anukas-days-index");
      if (oldDaysIndex && oldDaysIndex.length > 0) {
        for (const dt of oldDaysIndex) {
          const oldDayData = await redis.get(`anukas-day-${dt}`);
          if (oldDayData) {
            await redis.set(dayKey(phone, dt), oldDayData);
          }
        }
        // Copy old days index
        for (const dt of oldDaysIndex) {
          await redis.sadd(daysIndexKey(phone), dt);
        }
      }
    }
    return NextResponse.json(globalData || null);
  } catch {
    return NextResponse.json(null);
  }
}

// POST - save data
// POST with { phone, type: "global", profile, regime } — saves global
// POST with { phone, type: "daily", date, foods, waterMl, weight, userActivities, goalCalories } — saves daily
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    if (body.type === "global") {
      const { profile, regime } = body;
      await redis.set(globalKey(phone), { profile, regime });
      return NextResponse.json({ ok: true });
    }

    if (body.type === "daily") {
      const { date, foods, waterMl, weight, userActivities, goalCalories } = body;
      await redis.set(dayKey(phone, date), { foods, waterMl, weight, userActivities, goalCalories });
      // Track this date in the index if it has meaningful data
      const hasData = (foods && foods.length > 0) || (userActivities && userActivities.length > 0) || (waterMl && waterMl > 0);
      if (hasData) {
        await redis.sadd(daysIndexKey(phone), date);
      } else {
        await redis.srem(daysIndexKey(phone), date);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
