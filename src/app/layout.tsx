import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
});

// Absolute site URL for OG/Twitter metadata — must be reachable by scrapers (WhatsApp, Telegram, iMessage, Messenger)
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://backapp-liart.vercel.app");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Build the OG description from the admin's share-message template
function buildDescription(template: string | null | undefined, lari: number): string {
  const tpl = (template || "Join me on Shansi! Use my referral code: {code} to get _ ₾").trim();
  return tpl
    .replace(/\{code\}/gi, "your code")
    .replace(/_/g, String(lari));
}

export async function generateMetadata(): Promise<Metadata> {
  let imageUrl = `${SITE_URL}/og-image.png`;
  let description = "გამოიყენე რეფერალი და მიიღე 10 ₾ სარეგისტრაციო ბონუსი! 🎰";
  let imageVersion = "1";

  try {
    const res = await fetch(`${API_BASE}/public/referral-config`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data: any = await res.json();
      const cfg = data?.config;
      // If admin uploaded a custom image, use the /api/og-image route (serves bytes inline)
      if (cfg?.shareImageUrl) {
        imageUrl = `${SITE_URL}/api/og-image`;
        // Use a short hash of the image so the URL changes when admin re-uploads,
        // forcing WhatsApp/FB/etc to re-scrape
        try {
          const h = Buffer.from(String(cfg.shareImageUrl)).toString("base64").slice(-12);
          imageVersion = h;
        } catch {
          imageVersion = String(Date.now());
        }
      }
      description = buildDescription(cfg?.shareMessageTemplate, cfg?.signupRewardLari ?? 10);
    }
  } catch {
    // fall back to defaults
  }

  // Append version so scrapers see a new URL when the underlying image changes
  imageUrl = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${imageVersion}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: "შანსი — გეიმიფიცირებული Cashback",
    description,
    openGraph: {
      title: "შანსი — გეიმიფიცირებული Cashback",
      description,
      url: SITE_URL,
      siteName: "შანსი",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "შანსი — გეიმიფიცირებული Cashback",
          type: "image/png",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "შანსი — გეიმიფიცირებული Cashback",
      description,
      images: [imageUrl],
    },
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
      viewportFit: "cover",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Note: OG / Twitter meta tags are emitted by generateMetadata() so admin-uploaded image takes priority */}
      </head>
      <body className={`${outfit.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
