import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

// Seed ანუკა's account - run once
export async function GET() {
  const userKey = "anukas-user-592322992";
  const existing = await redis.get(userKey);
  if (existing) {
    return NextResponse.json({ message: "Already exists", existing });
  }

  await redis.set(userKey, {
    pin: "000000",
    name: "ანუკა",
    profile: {
      age: "34",
      gender: "მდედრობითი",
      height: "165",
      weight: "60",
      goal: "წონის დაკლება",
      activityLevel: "საშუალო (3-5 დღე/კვირაში ვარჯიში)",
      startingWeight: "65",
      targetWeight: "58",
    },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ message: "ანუკა seeded with phone 592322992 and pin 000000" });
}
