import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Common response headers — WhatsApp requires explicit Content-Type + cache
const imageHeaders = (mime: string, len?: number): Record<string, string> => ({
  "Content-Type": mime,
  "Cache-Control": "public, max-age=3600",
  ...(len ? { "Content-Length": String(len) } : {}),
});

// Decode a base64 data URL like "data:image/jpeg;base64,XXXX" → Buffer + mime
function decodeDataUrl(dataUrl: string): { buf: Buffer; mime: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

async function fetchDefaultJpeg(origin: string): Promise<{ buf: Buffer; mime: string }> {
  const res = await fetch(`${origin}/og-image.jpg`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, mime: res.headers.get("Content-Type") || "image/jpeg" };
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
          // Skip WebP — WhatsApp/iMessage/Facebook can't render it in OG cards
          if (decoded && !/webp/i.test(decoded.mime)) {
            return new NextResponse(new Uint8Array(decoded.buf) as any, {
              headers: imageHeaders(decoded.mime, decoded.buf.length),
            });
          }
          // WebP or bad decode → fall through to default
        } else if (/^https?:\/\//i.test(url)) {
          const imgRes = await fetch(url);
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const mime = imgRes.headers.get("Content-Type") || "image/jpeg";
            return new NextResponse(new Uint8Array(buf) as any, {
              headers: imageHeaders(mime, buf.length),
            });
          }
        }
      }
    }
  } catch {
    // fall through to default
  }

  // Default fallback: serve static JPEG (WhatsApp-friendly)
  try {
    const { buf, mime } = await fetchDefaultJpeg(origin);
    return new NextResponse(new Uint8Array(buf) as any, {
      headers: imageHeaders(mime, buf.length),
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
