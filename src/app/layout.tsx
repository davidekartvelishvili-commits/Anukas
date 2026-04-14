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

// Absolute site URL for OG/Twitter metadata — must be reachable by scrapers (WhatsApp, Telegram, iMessage, etc.)
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://backapp-liart.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Shansi — Smart Cashback",
  description: "Get cashback on every purchase. Join me on Shansi!",
  openGraph: {
    title: "Welcome to Shansi!",
    description: "Smart cashback on every purchase. Join now and get bonus cash.",
    url: SITE_URL,
    siteName: "Shansi",
    images: [
      {
        url: `${SITE_URL}/api/og-image`,
        width: 1200,
        height: 1200,
        alt: "Welcome to Shansi!",
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Welcome to Shansi!",
    description: "Smart cashback on every purchase. Join now and get bonus cash.",
    images: [`${SITE_URL}/api/og-image`],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

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
      </head>
      <body className={`${outfit.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
