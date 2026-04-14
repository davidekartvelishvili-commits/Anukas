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

export const metadata: Metadata = {
  title: "Shansi — Smart Cashback",
  description: "Get cashback on every purchase. Join me on Shansi!",
  openGraph: {
    title: "Welcome to Shansi!",
    description: "Smart cashback on every purchase. Join now and get bonus cash.",
    images: [
      {
        url: "/og-welcome.png",
        width: 1200,
        height: 1200,
        alt: "Welcome to Shansi!",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Welcome to Shansi!",
    description: "Smart cashback on every purchase. Join now and get bonus cash.",
    images: ["/og-welcome.png"],
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
