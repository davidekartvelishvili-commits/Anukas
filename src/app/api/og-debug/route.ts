import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://backapp-liart.vercel.app";

// Interpolate template placeholders: {code} → given code string, _ → amount
function interpolate(template: string, code: string, amount: number): string {
  return template
    .replace(/\{code\}/gi, code)
    .replace(/_/g, String(amount));
}

// GET /api/og-debug — shows what OG metadata would resolve to right now
export async function GET() {
  const debug: any = {
    SITE_URL,
    API_BASE,
    configFetchUrl: `${API_BASE}/public/referral-config`,
  };

  try {
    const res = await fetch(`${API_BASE}/public/referral-config`, { cache: "no-store" });
    debug.configStatus = res.status;
    if (res.ok) {
      const data: any = await res.json();
      const cfg = data?.config || {};
      debug.hasShareImageUrl = !!cfg.shareImageUrl;
      debug.shareImageUrlPrefix = cfg.shareImageUrl
        ? String(cfg.shareImageUrl).slice(0, 60) + "..."
        : null;
      debug.shareImageMimeDetected = cfg.shareImageUrl?.match(/^data:([^;]+)/)?.[1] || null;
      debug.shareImageUrlLength = cfg.shareImageUrl ? String(cfg.shareImageUrl).length : 0;
      debug.chosenImageUrl = cfg.shareImageUrl
        ? `${SITE_URL}/api/og-image`
        : `${SITE_URL}/og-image.png`;
      debug.signupRewardLari = cfg.signupRewardLari;
      debug.shareMessageTemplate = cfg.shareMessageTemplate;

      // Show the interpolated result that OG metadata + share button actually use
      const amount = Number(cfg.signupRewardLari ?? 10);
      const rawTemplate: string = cfg.shareMessageTemplate || "Join me on Shansi! Use my referral code: {code} to get _ ₾";
      debug.interpolatedForOG = interpolate(rawTemplate, "your code", amount);
      debug.interpolatedForShare = interpolate(rawTemplate, "TEST1", amount);

      // Sanity checks on the template
      debug.hasCodePlaceholder = /\{code\}/i.test(rawTemplate);
      debug.hasAmountPlaceholder = /_/.test(rawTemplate);
      // Check for Unicode look-alikes that might silently break interpolation
      debug.unusualUnderscoreChars = (rawTemplate.match(/[＿⎯⏤―—–‒]/g) || []).join("") || null;
    } else {
      debug.configError = await res.text().catch(() => "unreadable");
    }
  } catch (e: any) {
    debug.fetchException = String(e?.message || e);
  }

  return NextResponse.json(debug, {
    headers: { "Cache-Control": "no-store" },
  });
}
