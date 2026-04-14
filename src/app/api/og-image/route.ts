import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Decode a base64 data URL like "data:image/png;base64,XXXX" → Buffer + mime
function decodeDataUrl(dataUrl: string): { buf: Buffer; mime: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

async function defaultImage(): Promise<{ body: Buffer; mime: string }> {
  // Fallback to static /public/og-welcome.png
  const p = path.join(process.cwd(), "public", "og-welcome.png");
  const body = await readFile(p);
  return { body, mime: "image/png" };
}

export async function GET() {
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
    // fall through to default
  }

  const { body, mime } = await defaultImage();
  return new NextResponse(new Uint8Array(body) as any, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
