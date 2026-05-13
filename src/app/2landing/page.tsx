"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ───────── MERCHANT DATA (like Coverd's transaction cards) ───────── */

const TRANSACTIONS = [
  { name: "Stamba Hotel", amount: "₾120", icon: "/images/stamba-logo.png" },
  { name: "Dunkin'", amount: "₾18", icon: "/images/dunkin-logo.jpg" },
  { name: "Wendy's", amount: "₾32", icon: "/images/wendys-logo.png" },
];

/* ───────── FEATURE ITEMS ───────── */

const FEATURES = [
  {
    icon: "wallet",
    title: "Up to 100% Cashback",
    titleGe: "100%-მდე ქეშბექი",
    desc: "Win back the full amount of your purchases through games.",
  },
  {
    icon: "scan",
    title: "Zero Hidden Fees",
    titleGe: "დამალული საკომისიოების გარეშე",
    desc: "Transparent. No subscriptions, no catches.",
  },
  {
    icon: "flame",
    title: "Smart Insights",
    titleGe: "ჭკვიანი ანალიტიკა",
    desc: "Track spending habits, build better financial routines.",
  },
  {
    icon: "game",
    title: "Automatic Game Entries",
    titleGe: "ავტომატური თამაშის შესვლა",
    desc: "Every purchase is a chance to win it back. Play instantly.",
  },
];

/* ───────── GAME COVERS ───────── */

const GAMES = [
  { name: "Midnight Machine", cover: "/images/onboarding/slot-machine.mp4", type: "video" },
  { name: "Chicken Rush", cover: "/images/lucky-step-cover.png", type: "image" },
  { name: "Lucky Drop", cover: "/images/lucky-drop-cover.png", type: "image" },
  { name: "Air Hockey", cover: "/images/air-hockey-cover.png", type: "image" },
];

/* ───────── FLOATING ITEMS (for hero background) ───────── */

const FLOAT_ITEMS = [
  "/images/onboarding/sushi.png",
  "/images/onboarding/sneaker.png",
  "/images/onboarding/piggy-bank.png",
  "/images/onboarding/airplane.png",
  "/images/onboarding/ring.png",
  "/images/onboarding/cards.png",
  "/images/onboarding/suitcase.png",
  "/images/onboarding/building.png",
];

/* ───────── ICON COMPONENT (inline) ───────── */

function FeatureIcon({ name, size = 28 }: { name: string; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#00E88F",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "wallet":
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M22 6V5a2 2 0 00-2-2H6a4 4 0 00-4 4" />
          <circle cx="18" cy="14" r="1" fill="#00E88F" stroke="none" />
        </svg>
      );
    case "scan":
      return (
        <svg {...props}>
          <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2M17 21h2a2 2 0 002-2v-2" />
          <path d="M7 12h10" strokeWidth="2.5" />
          <path d="M12 7v10" strokeWidth="2.5" />
        </svg>
      );
    case "flame":
      return (
        <svg {...props} fill="#00E88F" fillOpacity="0.2">
          <path d="M12 2c.5 4-2.5 6-2.5 10a5 5 0 0010 0c0-4-3-5.5-2.5-10a7.4 7.4 0 01-5 0z" />
          <path d="M12 18a2.5 2.5 0 002.5-2.5c0-2-2.5-3-2.5-5-.5 1.5-2.5 2.5-2.5 5A2.5 2.5 0 0012 18z" fill="#00E88F" fillOpacity="0.4" />
        </svg>
      );
    case "game":
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="12" rx="4" />
          <circle cx="8" cy="12" r="1.5" fill="#00E88F" stroke="none" />
          <circle cx="16" cy="10" r="1" fill="#00E88F" stroke="none" />
          <circle cx="16" cy="14" r="1" fill="#00E88F" stroke="none" />
          <circle cx="14" cy="12" r="1" fill="#00E88F" stroke="none" />
          <circle cx="18" cy="12" r="1" fill="#00E88F" stroke="none" />
          <path d="M8 9v6M5 12h6" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...props}>
          <path d="M6 3h12v6a6 6 0 01-12 0V3z" fill="#00E88F" fillOpacity="0.1" />
          <path d="M6 5H4a1 1 0 00-1 1v1a4 4 0 004 4" />
          <path d="M18 5h2a1 1 0 011 1v1a4 4 0 01-4 4" />
          <path d="M12 13v3" />
          <path d="M8 19h8" />
          <path d="M9 19v-3h6v3" />
        </svg>
      );
    case "star":
      return (
        <svg {...props} fill="#00E88F" fillOpacity="0.15">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      );
    default:
      return null;
  }
}

/* ───────── MAIN PAGE ───────── */

export default function SecondLandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Capture ?ref=CODE and track page view (same as before)
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && ref.trim()) {
        localStorage.setItem("pending_referral_code", ref.trim().toUpperCase());
      }
      const cb = params.get("callbackUrl");
      if (cb) {
        localStorage.setItem("auth_callback_url", cb);
      }
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      fetch(`${API}/public/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer || null,
          utm_source: params.get("utm_source") || null,
          utm_medium: params.get("utm_medium") || null,
          utm_campaign: params.get("utm_campaign") || null,
          screenWidth: window.innerWidth,
        }),
      }).catch(() => {});
    } catch {}
  }, []);

  // Parallax scroll tracking
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        html, body {
          background: #0A0F1C !important;
          scroll-behavior: smooth;
        }
        .gradient-text {
          background: linear-gradient(135deg, #00E88F 0%, #00D4AA 50%, #00BCD4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glow-accent {
          box-shadow: 0 0 40px rgba(0, 232, 143, 0.15), 0 0 80px rgba(0, 232, 143, 0.05);
        }
        .float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .float-slow-delay {
          animation: floatSlow 7s ease-in-out infinite 1s;
        }
        .float-slow-delay2 {
          animation: floatSlow 8s ease-in-out infinite 2s;
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.7s ease-out forwards;
        }
        .animate-fadeInUp-delay1 {
          animation: fadeInUp 0.7s ease-out 0.15s forwards;
          opacity: 0;
        }
        .animate-fadeInUp-delay2 {
          animation: fadeInUp 0.7s ease-out 0.3s forwards;
          opacity: 0;
        }
        .animate-fadeInUp-delay3 {
          animation: fadeInUp 0.7s ease-out 0.45s forwards;
          opacity: 0;
        }
        .transaction-scroll {
          animation: scrollLeft 20s linear infinite;
        }
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .game-card:hover .game-overlay {
          opacity: 1;
        }
        .game-card:hover img, .game-card:hover video {
          transform: scale(1.05);
        }
      `}</style>

      <div className="min-h-screen bg-[#0A0F1C] text-[#F1F5F9] overflow-x-hidden">
        {/* ═══════════ NAVIGATION ═══════════ */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: scrollY > 50 ? "rgba(10, 15, 28, 0.9)" : "transparent",
            backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
            borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          <div className="max-w-[1200px] mx-auto px-6 md:px-10 h-[72px] flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/shansi-logo.png" alt="Shansi" width={36} height={36} className="select-none" />
              <span
                className="text-[20px] font-bold text-white"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Shansi
              </span>
            </button>

            {/* Nav links */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/auth?mode=login")}
                className="hidden sm:block px-5 py-2.5 text-[14px] font-medium text-[#94A3B8] hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Log In
              </button>
              <button
                onClick={() => router.push("/auth")}
                className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-[#0A0F1C] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  fontFamily: "var(--font-outfit)",
                  background: "linear-gradient(135deg, #00E88F, #00D4AA)",
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* ═══════════ HERO SECTION ═══════════ */}
        <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
          {/* Background floating items */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: mounted ? 0.12 : 0, transition: "opacity 1.5s ease" }}>
            {FLOAT_ITEMS.map((src, i) => (
              <div
                key={i}
                className={`absolute ${i % 3 === 0 ? "float-slow" : i % 3 === 1 ? "float-slow-delay" : "float-slow-delay2"}`}
                style={{
                  left: `${10 + (i % 4) * 22}%`,
                  top: `${15 + Math.floor(i / 4) * 35}%`,
                  transform: `rotate(${-15 + i * 8}deg)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  width={80 + (i % 3) * 20}
                  height={80 + (i % 3) * 20}
                  className="select-none opacity-60"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Radial glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(0,232,143,0.08) 0%, transparent 70%)",
            }}
          />

          {/* Hero content */}
          <div className="relative z-10 text-center max-w-[800px]">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 ${mounted ? "animate-fadeInUp" : "opacity-0"}`}
            >
              <span className="w-2 h-2 rounded-full bg-[#00E88F] animate-pulse" />
              <span className="text-[13px] text-[#94A3B8]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Gamified Cashback Platform
              </span>
            </div>

            {/* Main heading */}
            <h1
              className={`text-[40px] sm:text-[56px] md:text-[72px] leading-[1.05] font-extrabold mb-6 ${mounted ? "animate-fadeInUp-delay1" : "opacity-0"}`}
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Turn Expenses
              <br />
              into <span className="gradient-text">Games</span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-[16px] sm:text-[18px] text-[#94A3B8] leading-[1.6] max-w-[540px] mx-auto mb-10 ${mounted ? "animate-fadeInUp-delay2" : "opacity-0"}`}
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Enjoy life&apos;s moments without the shadow of regret.
              Track spending, play games, and win your purchases back.
            </p>

            {/* CTA buttons */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${mounted ? "animate-fadeInUp-delay3" : "opacity-0"}`}>
              <button
                onClick={() => router.push("/auth")}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-[16px] font-bold text-[#0A0F1C] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] glow-accent"
                style={{
                  fontFamily: "var(--font-outfit)",
                  background: "linear-gradient(135deg, #00E88F 0%, #00D4AA 100%)",
                }}
              >
                Get Started — It&apos;s Free
              </button>
              <button
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-[16px] font-semibold text-white glass-card hover:bg-white/[0.08] transition-all duration-200"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Transaction ticker */}
          <div className="relative z-10 mt-16 w-full max-w-[700px] overflow-hidden rounded-2xl glass-card py-4">
            <div className="flex transaction-scroll" style={{ width: "200%" }}>
              {[...TRANSACTIONS, ...TRANSACTIONS, ...TRANSACTIONS, ...TRANSACTIONS].map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-6 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.icon} alt={t.name} width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-white" style={{ fontFamily: "var(--font-dm-sans)" }}>{t.name}</p>
                    <p className="text-[13px] text-[#00E88F] font-semibold">{t.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
            <span className="text-[12px] text-[#94A3B8]" style={{ fontFamily: "var(--font-dm-sans)" }}>Scroll</span>
            <div className="w-[1px] h-6 bg-gradient-to-b from-[#94A3B8] to-transparent" />
          </div>
        </section>

        {/* ═══════════ DUAL FEATURE SECTION (Coverd style) ═══════════ */}
        <section id="features" className="relative py-20 md:py-32 px-6">
          <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Track your purchases */}
            <div className="glass-card rounded-3xl p-8 md:p-10 group hover:border-[#00E88F]/20 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#00E88F]/10 flex items-center justify-center mb-6">
                <FeatureIcon name="wallet" size={28} />
              </div>
              <h2
                className="text-[28px] sm:text-[36px] font-bold leading-[1.15] mb-4"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Track your
                <br />
                purchases<span className="gradient-text">...</span>
              </h2>
              <p className="text-[15px] text-[#94A3B8] leading-[1.6] mb-6" style={{ fontFamily: "var(--font-dm-sans)" }}>
                A sleek way to get on top of your spending — see insights, build better habits, and take control of your finances.
              </p>
              {/* Mini merchant logos */}
              <div className="flex items-center gap-3 mt-auto">
                {TRANSACTIONS.map((t, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.icon} alt={t.name} width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                ))}
                <span className="text-[13px] text-[#94A3B8] ml-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  +50 more
                </span>
              </div>
            </div>

            {/* Win them back */}
            <div className="glass-card rounded-3xl p-8 md:p-10 group hover:border-[#00E88F]/20 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#00E88F]/10 flex items-center justify-center mb-6">
                <FeatureIcon name="trophy" size={28} />
              </div>
              <h2
                className="text-[28px] sm:text-[36px] font-bold leading-[1.15] mb-4"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                <span className="gradient-text">...</span>and win
                <br />
                them back
              </h2>
              <p className="text-[15px] text-[#94A3B8] leading-[1.6] mb-6" style={{ fontFamily: "var(--font-dm-sans)" }}>
                A fun and thrilling approach to get your purchases covered — play games, win them back. Every purchase is a new chance.
              </p>
              {/* Mini game covers */}
              <div className="flex items-center gap-3 mt-auto">
                {GAMES.filter(g => g.type === "image").slice(0, 3).map((g, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.cover} alt={g.name} width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                ))}
                <span className="text-[13px] text-[#94A3B8] ml-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  4 games
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ GAMES SHOWCASE ═══════════ */}
        <section className="relative py-16 md:py-24 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2
                className="text-[32px] sm:text-[44px] md:text-[52px] font-extrabold leading-[1.1] mb-4"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Play. Win. <span className="gradient-text">Repeat.</span>
              </h2>
              <p className="text-[16px] text-[#94A3B8] max-w-[500px] mx-auto" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Every purchase enters you into exciting games. Four unique ways to win your money back.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {GAMES.map((game, i) => (
                <div
                  key={i}
                  className="game-card relative rounded-2xl overflow-hidden aspect-square group cursor-pointer"
                >
                  {game.type === "video" ? (
                    <video
                      src={game.cover}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover transition-transform duration-500"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={game.cover}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-500"
                    />
                  )}
                  {/* Overlay */}
                  <div className="game-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 opacity-0 transition-opacity duration-300 md:opacity-0">
                    <p className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                      {game.name}
                    </p>
                  </div>
                  {/* Always visible name on mobile */}
                  <div className="md:hidden absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-[13px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                      {game.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ SHANSI CARD SECTION (like Coverd Card) ═══════════ */}
        <section className="relative py-20 md:py-32 px-6">
          {/* Background glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse, rgba(0,232,143,0.06) 0%, transparent 70%)",
            }}
          />

          <div className="relative max-w-[1200px] mx-auto">
            <div className="glass-card rounded-3xl p-8 md:p-14 glow-accent">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00E88F]/10 border border-[#00E88F]/20 mb-6">
                <span className="text-[13px] font-medium text-[#00E88F]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  Now Available
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-10 items-center">
                {/* Text content */}
                <div>
                  <h2
                    className="text-[32px] sm:text-[44px] md:text-[52px] font-extrabold leading-[1.05] mb-3"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    We Got You
                    <br />
                    <span className="gradient-text">Covered</span>
                  </h2>
                  <p className="text-[15px] text-[#94A3B8] leading-[1.7] mb-8 max-w-[440px]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    Shansi is a gamified cashback platform that offers up to 100% cash back, zero hidden fees, smart spending insights, and automatic entries into win-back games with every purchase.
                  </p>

                  <button
                    onClick={() => router.push("/auth")}
                    className="px-8 py-4 rounded-xl text-[16px] font-bold text-[#0A0F1C] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      fontFamily: "var(--font-outfit)",
                      background: "linear-gradient(135deg, #00E88F 0%, #00D4AA 100%)",
                    }}
                  >
                    Join Now
                  </button>
                </div>

                {/* Feature cards grid */}
                <div className="grid grid-cols-2 gap-4">
                  {FEATURES.map((f, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#00E88F]/20 transition-all duration-200 hover:bg-white/[0.05]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#00E88F]/10 flex items-center justify-center mb-3">
                        <FeatureIcon name={f.icon} size={20} />
                      </div>
                      <p className="text-[14px] font-semibold text-white mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
                        {f.title}
                      </p>
                      <p className="text-[12px] text-[#94A3B8] leading-[1.5]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {f.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section className="relative py-16 md:py-24 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <h2
              className="text-[32px] sm:text-[44px] font-extrabold leading-[1.1] mb-4"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-[16px] text-[#94A3B8] mb-12 md:mb-16" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Three simple steps to start winning your purchases back.
            </p>
          </div>

          <div className="max-w-[1000px] mx-auto grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: "01",
                icon: "scan",
                title: "Scan & Pay",
                titleGe: "სკანირება & გადახდა",
                desc: "Visit any partner merchant and scan the QR code to log your purchase.",
              },
              {
                step: "02",
                icon: "game",
                title: "Play Games",
                titleGe: "თამაშის დაწყება",
                desc: "Use your earned entries to play exciting games — slots, plinko, chicken rush, and more.",
              },
              {
                step: "03",
                icon: "wallet",
                title: "Win Cashback",
                titleGe: "ქეშბექის მიღება",
                desc: "Win up to 100% of your purchase amount back. Withdraw anytime, no strings attached.",
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                {/* Step number */}
                <span
                  className="text-[64px] font-black text-white/[0.03] absolute -top-4 left-1/2 -translate-x-1/2 select-none"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  {step.step}
                </span>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#00E88F]/10 border border-[#00E88F]/20 flex items-center justify-center mx-auto mb-5">
                    <FeatureIcon name={step.icon} size={28} />
                  </div>
                  <h3
                    className="text-[18px] font-bold mb-2"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-[#94A3B8] leading-[1.6] max-w-[280px] mx-auto" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <section className="relative py-20 md:py-32 px-6">
          <div className="max-w-[700px] mx-auto text-center">
            <h2
              className="text-[32px] sm:text-[44px] md:text-[56px] font-extrabold leading-[1.05] mb-6"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Ready to Turn
              <br />
              Spending into <span className="gradient-text">Winning?</span>
            </h2>
            <p className="text-[16px] text-[#94A3B8] mb-10 max-w-[460px] mx-auto" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Join thousands of users who are already winning their purchases back with Shansi.
            </p>
            <button
              onClick={() => router.push("/auth")}
              className="px-10 py-4 rounded-xl text-[17px] font-bold text-[#0A0F1C] transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] glow-accent"
              style={{
                fontFamily: "var(--font-outfit)",
                background: "linear-gradient(135deg, #00E88F 0%, #00D4AA 100%)",
              }}
            >
              Sign Up Free
            </button>
            <p className="text-[13px] text-[#94A3B8]/60 mt-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
              No credit card required
            </p>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="border-t border-white/[0.06] py-10 px-6">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/shansi-logo.png" alt="Shansi" width={28} height={28} className="select-none" />
              <span className="text-[16px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                Shansi
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-[#94A3B8]" style={{ fontFamily: "var(--font-dm-sans)" }}>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-white transition-colors">
                Home
              </button>
              <button onClick={() => router.push("/auth")} className="hover:text-white transition-colors">
                Sign Up
              </button>
              <button onClick={() => router.push("/auth?mode=login")} className="hover:text-white transition-colors">
                Log In
              </button>
            </div>

            {/* Copyright */}
            <p className="text-[12px] text-[#94A3B8]/50" style={{ fontFamily: "var(--font-dm-sans)" }}>
              © 2026 Shansi. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
