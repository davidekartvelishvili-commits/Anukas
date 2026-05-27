import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

// Check if phone exists
// POST { action: "check", phone }
// Login with pin
// POST { action: "login", phone, pin }
// Register new user
// POST { action: "register", phone, pin, name, profile }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone } = body;

    const userKey = `anukas-user-${phone}`;

    if (action === "check") {
      const user = await redis.get(userKey);
      return NextResponse.json({ exists: !!user });
    }

    if (action === "login") {
      const { pin } = body;
      const user = (await redis.get(userKey)) as Record<string, unknown> | null;
      if (!user) {
        return NextResponse.json({ error: "მომხმარებელი ვერ მოიძებნა" }, { status: 404 });
      }
      if (user.pin !== pin) {
        return NextResponse.json({ error: "არასწორი პინი" }, { status: 401 });
      }
      return NextResponse.json({ ok: true, user: { phone, name: user.name, profile: user.profile } });
    }

    if (action === "changePin") {
      const { newPin } = body;
      const user = (await redis.get(userKey)) as Record<string, unknown> | null;
      if (!user) {
        return NextResponse.json({ error: "მომხმარებელი ვერ მოიძებნა" }, { status: 404 });
      }
      await redis.set(userKey, { ...user, pin: newPin });
      return NextResponse.json({ ok: true });
    }

    if (action === "register") {
      const { pin, name, profile } = body;
      const existing = await redis.get(userKey);
      if (existing) {
        return NextResponse.json({ error: "ეს ნომერი უკვე რეგისტრირებულია" }, { status: 409 });
      }
      await redis.set(userKey, { pin, name, profile, createdAt: new Date().toISOString() });
      // Also save profile to global data key for this user
      const globalKey = `anukas-global-${phone}`;
      await redis.set(globalKey, { profile, regime: "standard" });
      return NextResponse.json({ ok: true, user: { phone, name, profile } });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
