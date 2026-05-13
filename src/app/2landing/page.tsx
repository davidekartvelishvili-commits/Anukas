"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* ───────── 3D FLOATING ITEMS — same assets as main landing page ───────── */

const FLOATING_ITEMS = [
  // Top-left cluster
  { src: "/images/onboarding/sushi.png",       left: "-2%",  top: "8%",   size: 130, rotate: -18, delay: 0,    duration: 5.8 },
  { src: "/images/onboarding/piggy-bank.png",  left: "5%",   top: "42%",  size: 120, rotate: 14,  delay: 1.2,  duration: 6.4 },
  { src: "/images/onboarding/yoga-mat.png",    left: "-1%",  top: "72%",  size: 110, rotate: 22,  delay: 0.6,  duration: 5.4 },

  // Top-right cluster
  { src: "/images/onboarding/sneaker.png",     left: "82%",  top: "6%",   size: 140, rotate: 12,  delay: 0.4,  duration: 6.0 },
  { src: "/images/onboarding/airplane.png",    left: "85%",  top: "38%",  size: 125, rotate: -22, delay: 1.8,  duration: 5.6 },
  { src: "/images/onboarding/ring.png",        left: "88%",  top: "68%",  size: 105, rotate: 28,  delay: 0.8,  duration: 6.6 },

  // Top center (partially cut off)
  { src: "/images/onboarding/cards.png",       left: "38%",  top: "-3%",  size: 120, rotate: -10, delay: 2.0,  duration: 5.2 },
  { src: "/images/coin-icon.png",              left: "62%",  top: "-2%",  size: 100, rotate: 15,  delay: 1.4,  duration: 6.2 },

  // Bottom edges
  { src: "/images/onboarding/suitcase.png",    left: "12%",  top: "78%",  size: 115, rotate: -8,  delay: 1.0,  duration: 5.9 },
  { src: "/images/trophy.png",                 left: "75%",  top: "76%",  size: 110, rotate: 18,  delay: 2.2,  duration: 6.1 },

  // Far edges — partially off-screen for depth
  { src: "/images/onboarding/building.png",    left: "-4%",  top: "20%",  size: 100, rotate: -5,  delay: 1.6,  duration: 6.8 },
  { src: "/images/onboarding/golfball.png",    left: "92%",  top: "52%",  size: 95,  rotate: -15, delay: 0.2,  duration: 5.5 },
];

/* ───────── MERCHANT TICKER DATA ───────── */

const MERCHANTS = [
  { name: "Lui Coffee",   amount: "₾8"   },
  { name: "Coffee LAB",   amount: "₾12"  },
  { name: "Wendy's",      amount: "₾32"  },
  { name: "Dunkin'",      amount: "₾18"  },
  { name: "Stamba Hotel",  amount: "₾120" },
  { name: "Entree",       amount: "₾45"  },
  { name: "Rooms Hotel",  amount: "₾95"  },
  { name: "Lolita",       amount: "₾28"  },
];

/* ───────── MAIN PAGE ───────── */

export default function SecondLandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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

  return (
    <>
      <style>{`
        html, body {
          background: #F9E741 !important;
          overflow-x: hidden;
        }

        /* ── Floating bob ── */
        @keyframes floatBob {
          0%, 100% { transform: translateY(0) rotate(var(--rot)); }
          50%      { transform: translateY(-20px) rotate(var(--rot)); }
        }

        /* ── Pop-in entrance ── */
        @keyframes itemPop {
          0%   { opacity: 0; transform: scale(0.2) rotate(var(--rot)); }
          70%  { opacity: 1; transform: scale(1.08) rotate(var(--rot)); }
          100% { opacity: 1; transform: scale(1) rotate(var(--rot)); }
        }

        /* ── Hero text entrance ── */
        @keyframes heroUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-in     { animation: heroUp 0.7s ease-out forwards; }
        .hero-in-d1  { animation: heroUp 0.7s ease-out 0.10s forwards; opacity: 0; }
        .hero-in-d2  { animation: heroUp 0.7s ease-out 0.22s forwards; opacity: 0; }
        .hero-in-d3  { animation: heroUp 0.7s ease-out 0.34s forwards; opacity: 0; }

        /* ── Merchant ticker ── */
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: tickerScroll 30s linear infinite;
        }
      `}</style>

      <meta name="theme-color" content="#F9E741" />

      <div className="min-h-screen" style={{ background: "#F9E741" }}>

        {/* ═══════════ NAVBAR — transparent over yellow ═══════════ */}
        <nav className="relative z-50 w-full">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/shansi-logo.png"
                alt="Shansi"
                width={36}
                height={36}
                className="select-none"
                draggable={false}
              />
              <span
                className="text-[22px] font-extrabold text-[#1A1A1A] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Shansi
              </span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/auth?mode=login")}
                className="hidden sm:block px-5 py-2 text-[15px] font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Log In
              </button>
              <button
                onClick={() => router.push("/auth")}
                className="px-6 py-2.5 rounded-full text-[15px] font-bold text-white transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]"
                style={{
                  fontFamily: "var(--font-outfit)",
                  background: "#10B981",
                  boxShadow: "0 2px 12px rgba(16,185,129,0.3)",
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* ═══════════ HERO ═══════════ */}
        <section className="relative min-h-[calc(100vh-68px)] flex flex-col items-center justify-center px-6 overflow-hidden">

          {/* ── 3D floating objects — desktop ── */}
          {FLOATING_ITEMS.map((item, i) => (
            <div
              key={i}
              className="absolute pointer-events-none select-none hidden sm:block"
              style={{
                left: item.left,
                top: item.top,
                width: item.size,
                height: item.size,
                // @ts-expect-error CSS custom property
                "--rot": `${item.rotate}deg`,
                animation: mounted
                  ? `itemPop 0.5s ease-out ${item.delay}s forwards, floatBob ${item.duration}s ease-in-out ${item.delay + 0.5}s infinite`
                  : "none",
                opacity: 0,
                filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.12))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                width={item.size}
                height={item.size}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          ))}

          {/* ── 3D floating objects — mobile (fewer, smaller) ── */}
          {FLOATING_ITEMS.filter((_, i) => i % 2 === 0).map((item, i) => (
            <div
              key={`m-${i}`}
              className="absolute pointer-events-none select-none sm:hidden"
              style={{
                left: item.left,
                top: item.top,
                width: item.size * 0.6,
                height: item.size * 0.6,
                // @ts-expect-error CSS custom property
                "--rot": `${item.rotate}deg`,
                animation: mounted
                  ? `itemPop 0.5s ease-out ${item.delay}s forwards, floatBob ${item.duration}s ease-in-out ${item.delay + 0.5}s infinite`
                  : "none",
                opacity: 0,
                filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.10))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                width={Math.round(item.size * 0.6)}
                height={Math.round(item.size * 0.6)}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          ))}

          {/* ── Headline ── */}
          <div className="relative z-10 text-center max-w-[900px] mx-auto">
            <h1
              className={`text-[#1A1A1A] leading-[0.95] tracking-[-0.03em] ${mounted ? "hero-in-d1" : "opacity-0"}`}
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: "clamp(44px, 9vw, 84px)",
              }}
            >
              Buy Now, Win Maybe
            </h1>
            <h2
              className={`text-[#1A1A1A]/75 leading-[1.0] tracking-[-0.02em] mt-3 mb-10 ${mounted ? "hero-in-d2" : "opacity-0"}`}
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 800,
                fontStyle: "italic",
                fontSize: "clamp(30px, 5.5vw, 56px)",
              }}
            >
              We got you Shansi&apos;d
            </h2>

            {/* CTA */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${mounted ? "hero-in-d3" : "opacity-0"}`}>
              <button
                onClick={() => router.push("/auth")}
                className="px-10 py-4 rounded-full text-[17px] font-extrabold text-white transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]"
                style={{
                  fontFamily: "var(--font-outfit)",
                  background: "#1A1A1A",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                }}
              >
                Sign Up Free
              </button>
              <button
                onClick={() => router.push("/auth?mode=login")}
                className="px-8 py-4 rounded-full text-[16px] font-bold text-[#1A1A1A] border-2 border-[#1A1A1A]/20 hover:border-[#1A1A1A]/40 transition-all duration-200 sm:hidden"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Log In
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════ MERCHANT TICKER ═══════════ */}
        <div className="relative z-10 w-full overflow-hidden py-5" style={{ background: "#1A1A1A" }}>
          <div className="flex ticker-track" style={{ width: "200%" }}>
            {[...MERCHANTS, ...MERCHANTS, ...MERCHANTS, ...MERCHANTS].map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-8 shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-[#1A1A1A] shrink-0"
                  style={{ background: "#F9E741", fontFamily: "var(--font-outfit)" }}
                >
                  {m.name[0]}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[14px] font-semibold text-white whitespace-nowrap"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {m.name}
                  </span>
                  <span className="text-[13px] font-bold text-[#10B981] whitespace-nowrap">
                    {m.amount}
                  </span>
                </div>
                <span className="text-white/20 text-[8px] ml-2">●</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section className="py-20 md:py-28 px-6" style={{ background: "#FFFDF0" }}>
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-14">
              <h2
                className="text-[32px] sm:text-[44px] md:text-[52px] font-extrabold text-[#1A1A1A] leading-[1.1] mb-4"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                How It Works
              </h2>
              <p
                className="text-[16px] sm:text-[18px] text-[#1A1A1A]/60 max-w-[480px] mx-auto"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Three steps to turn every purchase into a chance to win.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {[
                { emoji: "📱", step: "01", title: "Scan & Pay",    desc: "Visit any partner merchant and scan the QR code to log your purchase instantly." },
                { emoji: "🎮", step: "02", title: "Play Games",    desc: "Use your entries to play — slots, plinko, chicken rush. Every purchase is a game ticket." },
                { emoji: "💸", step: "03", title: "Win Cashback",  desc: "Win up to 100% of your purchase back. Withdraw anytime, zero strings attached." },
              ].map((s, i) => (
                <div
                  key={i}
                  className="relative rounded-3xl p-8 md:p-10 text-center transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "white",
                    boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <span
                    className="absolute top-4 right-6 text-[48px] font-black text-[#1A1A1A]/[0.04] select-none"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    {s.step}
                  </span>
                  <div className="text-[48px] mb-5">{s.emoji}</div>
                  <h3
                    className="text-[20px] font-bold text-[#1A1A1A] mb-3"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-[14px] text-[#1A1A1A]/55 leading-[1.6]"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ DUAL CARDS ═══════════ */}
        <section className="py-16 md:py-24 px-6" style={{ background: "#FFFDF0" }}>
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-6 md:gap-8">
            <div
              className="rounded-3xl p-8 md:p-10 transition-all duration-200 hover:scale-[1.01]"
              style={{ background: "#F9E741", boxShadow: "0 4px 30px rgba(249,231,65,0.3)" }}
            >
              <span className="text-[48px] mb-4 block">📊</span>
              <h3
                className="text-[28px] sm:text-[34px] font-extrabold text-[#1A1A1A] leading-[1.15] mb-4"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Track your<br />purchases...
              </h3>
              <p className="text-[15px] text-[#1A1A1A]/65 leading-[1.6]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                A sleek way to get on top of your spending — see insights, build better habits, and take control of your finances.
              </p>
            </div>

            <div
              className="rounded-3xl p-8 md:p-10 transition-all duration-200 hover:scale-[1.01]"
              style={{ background: "#1A1A1A", boxShadow: "0 4px 30px rgba(0,0,0,0.15)" }}
            >
              <span className="text-[48px] mb-4 block">🏆</span>
              <h3
                className="text-[28px] sm:text-[34px] font-extrabold text-white leading-[1.15] mb-4"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                ...and win<br />them back
              </h3>
              <p className="text-[15px] text-white/55 leading-[1.6]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                A fun and thrilling approach to get your purchases covered — play games, win them back. Every purchase is a new chance.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURES GRID ═══════════ */}
        <section className="py-16 md:py-24 px-6" style={{ background: "#FFFDF0" }}>
          <div className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { emoji: "💳", title: "100% Cashback",     desc: "Win back the full purchase amount" },
                { emoji: "🔓", title: "Zero Hidden Fees",  desc: "No subscriptions, no catches" },
                { emoji: "📈", title: "Smart Insights",    desc: "Build better spending habits" },
                { emoji: "🎲", title: "Auto Game Entries", desc: "Every purchase is a game ticket" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 text-center transition-all duration-200 hover:scale-[1.03]"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}
                >
                  <div className="text-[36px] mb-3">{f.emoji}</div>
                  <p className="text-[15px] font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
                    {f.title}
                  </p>
                  <p className="text-[13px] text-[#1A1A1A]/50 leading-[1.5]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <section className="py-20 md:py-28 px-6" style={{ background: "#F9E741" }}>
          <div className="max-w-[700px] mx-auto text-center">
            <h2
              className="text-[32px] sm:text-[44px] md:text-[56px] font-extrabold text-[#1A1A1A] leading-[1.05] mb-5"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Ready to Get<br />Shansi&apos;d?
            </h2>
            <p
              className="text-[16px] sm:text-[18px] text-[#1A1A1A]/60 mb-10 max-w-[420px] mx-auto"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Join thousands of users already winning their purchases back.
            </p>
            <button
              onClick={() => router.push("/auth")}
              className="px-10 py-4 rounded-full text-[17px] font-extrabold text-[#F9E741] transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]"
              style={{ fontFamily: "var(--font-outfit)", background: "#1A1A1A", boxShadow: "0 4px 24px rgba(0,0,0,0.20)" }}
            >
              Sign Up Free
            </button>
            <p className="text-[13px] text-[#1A1A1A]/40 mt-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
              No credit card required
            </p>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="py-8 px-6" style={{ background: "#1A1A1A" }}>
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/shansi-logo.png" alt="Shansi" width={24} height={24} className="select-none brightness-0 invert" />
              <span className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                Shansi
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/50" style={{ fontFamily: "var(--font-dm-sans)" }}>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-white transition-colors">Home</button>
              <button onClick={() => router.push("/auth")} className="hover:text-white transition-colors">Sign Up</button>
              <button onClick={() => router.push("/auth?mode=login")} className="hover:text-white transition-colors">Log In</button>
            </div>
            <p className="text-[12px] text-white/30" style={{ fontFamily: "var(--font-dm-sans)" }}>
              &copy; 2026 Shansi. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
