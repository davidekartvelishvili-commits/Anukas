import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

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

// Absolute site URL for OG/Twitter metadata — always production URL so crawlers (WhatsApp, FB, iMessage) get a stable domain
// VERCEL_URL changes per deployment (preview URLs), which breaks OG caching and confuses scrapers — always hardcode production.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://backapp-liart.vercel.app";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Build the OG description from the admin's share-message template
function buildDescription(template: string | null | undefined, lari: number): string {
  const tpl = (template || "Join me on Shansi! Use my referral code: {code} to get _ ₾").trim();
  return tpl
    .replace(/\{code\}/gi, "your code")
    .replace(/_/g, String(lari));
}

export async function generateMetadata(): Promise<Metadata> {
  // Always point to /api/og-image — it handles admin-uploaded image + falls back to static JPEG
  // Using a single stable endpoint with explicit image/jpeg + 1200×630 is WhatsApp-friendly
  let imageUrl = `${SITE_URL}/api/og-image`;
  let description = "გამოიყენე რეფერალი და მიიღე 10 ₾ სარეგისტრაციო ბონუსი! 🎰";
  let imageVersion = "1";

  try {
    const res = await fetch(`${API_BASE}/public/referral-config`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data: any = await res.json();
      const cfg = data?.config;
      // Use a short hash of the image so the URL changes when admin re-uploads,
      // forcing WhatsApp/FB/etc to re-scrape
      if (cfg?.shareImageUrl) {
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
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: "შანსი — გეიმიფიცირებული Cashback",
          type: "image/jpeg",
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
        {/* Meta Pixel — must be inline in head, not deferred */}
        <script dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '2177327599789445');
          fbq('init', '2077512643172992');
          fbq('track', 'PageView');
        `}} />
        <noscript>
          <img height="1" width="1" style={{ display: "none" }} src="https://www.facebook.com/tr?id=2177327599789445&ev=PageView&noscript=1" alt="" />
          <img height="1" width="1" style={{ display: "none" }} src="https://www.facebook.com/tr?id=2077512643172992&ev=PageView&noscript=1" alt="" />
        </noscript>
      </head>
      <body
        className={`${outfit.variable} ${dmSans.variable} antialiased`}
        style={{ overscrollBehavior: "none" }}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
