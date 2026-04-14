import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Decode a base64 data URL like "data:image/png;base64,XXXX" → Buffer + mime
function decodeDataUrl(dataUrl: string): { buf: Buffer; mime: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

async function fetchDefault(origin: string): Promise<{ buf: Buffer; mime: string }> {
  const res = await fetch(`${origin}/og-welcome.png`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, mime: res.headers.get("Content-Type") || "image/png" };
}

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;

  // Try fetching admin-configured image
  try {
    const res = await fetch(`${API_BASE}/public/referral-config`, { cache: "no-store" });
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
                "Content-Length": String(decoded.buf.length),
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
                "Content-Length": String(buf.length),
                "Cache-Control": "public, max-age=300, s-maxage=300",
              },
            });
          }
        }
      }
    }
  } catch {
    // fall through to default
  }

  // Default fallback: serve the static image bytes (no redirect — scrapers don't always follow)
  try {
    const { buf, mime } = await fetchDefault(origin);
    return new NextResponse(new Uint8Array(buf) as any, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
