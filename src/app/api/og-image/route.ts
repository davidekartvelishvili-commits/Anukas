import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Decode a base64 data URL like "data:image/png;base64,XXXX" → Buffer + mime
function decodeDataUrl(dataUrl: string): { buf: Buffer; mime: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

function redirectToDefault(req: Request): NextResponse {
  const u = new URL(req.url);
  const defaultUrl = `${u.origin}/og-welcome.png`;
  return NextResponse.redirect(defaultUrl, 302);
}

export async function GET(req: Request) {
  try {
    // Fetch current referral config from backend
    const res = await fetch(`${API_BASE}/user/referral-config`, { cache: "no-store" });
    if (res.ok) {
      const data: any = await res.json();
      const url: string | null = data?.config?.shareImageUrl;
      if (url && typeof url === "string") {
        if (url.startsWith("data:")) {
          const decoded = decodeDataUrl(url);
          if (decoded) {
            return new NextResponse(new Uint8Array(decoded.buf) as any, {
              headers: {
                "Content-Type": decoded.mime,
                "Cache-Control": "public, max-age=300, s-maxage=300",
              },
            });
          }
        } else if (/^https?:\/\//i.test(url)) {
          const imgRes = await fetch(url);
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            return new NextResponse(new Uint8Array(buf) as any, {
              headers: {
                "Content-Type": imgRes.headers.get("Content-Type") || "image/png",
                "Cache-Control": "public, max-age=300, s-maxage=300",
              },
            });
          }
        }
      }
    }
  } catch {
    // fall through to default redirect
  }

  // Fallback: redirect to static default image
  return redirectToDefault(req);
}
