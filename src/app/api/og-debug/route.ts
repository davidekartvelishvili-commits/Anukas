import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://backapp-liart.vercel.app");

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
