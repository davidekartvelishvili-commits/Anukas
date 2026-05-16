"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ───────── 3D FLOATING ITEMS — matching coverd.us positions exactly ───────── */
/* 9 items scattered around edges, very large, some partially off-screen */

const FLOATING_ITEMS = [
  // Top-left: airplane — large, angled, partially off left edge
  { src: "/images/onboarding/airplane.png",      left: "2%",   top: "10%",  size: 220, rotate: -20, delay: 0.2,  duration: 6.0 },
  // Top-center: stethoscope
  { src: "/images/onboarding/stethoscope.png",   left: "28%",  top: "2%",   size: 85,  rotate: 10,  delay: 0,    duration: 5.6 },
  // Top-right: cards
  { src: "/images/onboarding/cards.png",         left: "60%",  top: "5%",   size: 190, rotate: -12, delay: 0.6,  duration: 6.4 },
  // Right: piggy bank
  { src: "/images/onboarding/piggy-bank-pink.png",    left: "82%",  top: "14%",  size: 210, rotate: 15,  delay: 0.4,  duration: 5.8 },
  // Center-left below headline: sushi
  { src: "/images/onboarding/sushi.png",         left: "18%",  top: "58%",  size: 120, rotate: -8,  delay: 1.0,  duration: 6.2 },
  // Center-right: ring
  { src: "/images/onboarding/ring.png",          left: "55%",  top: "72%",  size: 110, rotate: 20,  delay: 1.4,  duration: 5.4 },
  // Bottom-right: sneaker
  { src: "/images/onboarding/sneaker.png",       left: "70%",  top: "64%",  size: 200, rotate: -18, delay: 0.8,  duration: 6.6 },
  // Far-left edge: building
  { src: "/images/onboarding/building.png",      left: "-5%",  top: "48%",  size: 180, rotate: 5,   delay: 1.2,  duration: 5.5 },
  // Bottom-left: ali-nino
  { src: "/images/onboarding/ali-nino.png",      left: "22%",  top: "78%",  size: 160, rotate: -6,  delay: 0.6,  duration: 6.0 },
];

/* ───────── TRANSACTION ROWS — 3 scrolling rows like coverd.us ───────── */

// Row 1: largest cards, slowest scroll
const TRX_ROW_1 = [
  { src: "/images/trx-nike.png",          scale: 1.7,  rotate: -1, gap: 60 },
];

// Row 2: medium cards, medium scroll
const TRX_ROW_2 = [
  { src: "/images/trx-zara-amex.png",     scale: 1.15, rotate: 2,  gap: 35 },
  { src: "/images/trx-coffeelab-amex.png", scale: 1.0,  rotate: -2, gap: 50 },
  { src: "/images/trx-cavea.png",         scale: 1.2,  rotate: 1,  gap: 30 },
  { src: "/images/trx-nike.png",          scale: 1.1,  rotate: -1, gap: 45 },
];

// Row 3: smallest cards, fastest scroll
const TRX_ROW_3 = [
  { src: "/images/trx-coffeelab-visa.png", scale: 0.85, rotate: -1, gap: 30 },
  { src: "/images/trx-zara-visa.png",     scale: 0.95, rotate: 2,  gap: 40 },
  { src: "/images/trx-zara-amex.png",     scale: 0.8,  rotate: -2, gap: 25 },
  { src: "/images/trx-nike.png",          scale: 0.9,  rotate: 1,  gap: 35 },
  { src: "/images/trx-cavea.png",         scale: 0.85, rotate: -1, gap: 30 },
];

/* ───────── MAIN PAGE ───────── */

export default function SecondLandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
        html, html body {
          background: #F9E741 !important;
          overflow: auto !important;
          overflow-x: hidden !important;
          overflow-y: scroll !important;
          height: auto !important;
          max-height: none !important;
          position: static !important;
          overscroll-behavior: auto !important;
        }

        @font-face {
          font-family: 'DachiTheLynx';
          src: url('/fonts/DachiTheLynx.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        @keyframes floatBob {
          0%, 100% { transform: translateY(0) rotate(var(--rot)); }
          50%      { transform: translateY(-18px) rotate(var(--rot)); }
        }

        @keyframes itemPop {
          0%   { opacity: 0; transform: scale(0.3) rotate(var(--rot)); }
          70%  { opacity: 1; transform: scale(1.05) rotate(var(--rot)); }
          100% { opacity: 1; transform: scale(1) rotate(var(--rot)); }
        }

        @keyframes heroUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-in-d1  { animation: heroUp 0.7s ease-out 0.10s forwards; opacity: 0; }
        .hero-in-d2  { animation: heroUp 0.7s ease-out 0.22s forwards; opacity: 0; }
        .hero-in-d3  { animation: heroUp 0.7s ease-out 0.34s forwards; opacity: 0; }

        @keyframes scrollRow {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .trx-row-1 { animation: scrollRow 35s linear infinite; }
        .trx-row-2 { animation: scrollRow 28s linear infinite; }
        .trx-row-3 { animation: scrollRow 20s linear infinite; }
      `}</style>

      <meta name="theme-color" content="#F9E741" />

      <div className="min-h-screen" style={{ background: "#F9E741" }}>

        {/* ═══════════ HERO — full viewport, everything lives here ═══════════ */}
        <section className="relative flex flex-col" style={{ background: "#F9E741", minHeight: "100vh" }}>

          {/* ── Top bar: just logo + button, NO header bar, z-index BELOW items ── */}
          <div className="relative z-10 w-full px-5 sm:px-10 pt-5 flex items-center justify-between">
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

            {/* Center nav links — matching coverd */}
            <div className="hidden md:flex items-center gap-6">
              {["Home", "About", "Careers", "Support"].map((link, i) => (
                <button
                  key={link}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="text-[15px] font-semibold text-[#1A1A1A] px-5 py-1.5 rounded-full transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-outfit)",
                    border: i === 0 ? "2px solid #1A1A1A" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (i !== 0) e.currentTarget.style.border = "2px solid #1A1A1A"; }}
                  onMouseLeave={(e) => { if (i !== 0) e.currentTarget.style.border = "2px solid transparent"; }}
                >
                  {link}
                </button>
              ))}
            </div>

            {/* CTA button */}
            <button
              onClick={() => router.push("/auth")}
              className="px-7 py-3 rounded-full text-[15px] font-bold text-white transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]"
              style={{
                fontFamily: "var(--font-outfit)",
                background: "#1A1A1A",
              }}
            >
              Get Started
            </button>
          </div>

          {/* ── 3D floating objects — z-20, they float OVER the nav bar ── */}
          {FLOATING_ITEMS.map((item, i) => (
            <div
              key={i}
              className="absolute pointer-events-none select-none hidden md:block"
              style={{
                left: item.left,
                top: item.top,
                width: item.size,
                height: item.size,
                zIndex: 40,
                // @ts-expect-error CSS custom property
                "--rot": `${item.rotate}deg`,
                animation: mounted
                  ? `itemPop 0.5s ease-out ${item.delay}s forwards, floatBob ${item.duration}s ease-in-out ${item.delay + 0.5}s infinite`
                  : "none",
                opacity: 0,
                filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.12))",
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

          {/* ── Tablet: slightly smaller ── */}
          {FLOATING_ITEMS.map((item, i) => (
            <div
              key={`t-${i}`}
              className="absolute pointer-events-none select-none hidden sm:block md:hidden"
              style={{
                left: item.left,
                top: item.top,
                width: item.size * 0.6,
                height: item.size * 0.6,
                zIndex: 40,
                // @ts-expect-error CSS custom property
                "--rot": `${item.rotate}deg`,
                animation: mounted
                  ? `itemPop 0.5s ease-out ${item.delay}s forwards, floatBob ${item.duration}s ease-in-out ${item.delay + 0.5}s infinite`
                  : "none",
                opacity: 0,
                filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.10))",
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

          {/* ── Mobile: only 5 items, much smaller ── */}
          {FLOATING_ITEMS.filter((_, i) => [0, 3, 4, 6, 8].includes(i)).map((item, i) => (
            <div
              key={`m-${i}`}
              className="absolute pointer-events-none select-none sm:hidden"
              style={{
                left: item.left,
                top: item.top,
                width: item.size * 0.38,
                height: item.size * 0.38,
                zIndex: 40,
                // @ts-expect-error CSS custom property
                "--rot": `${item.rotate}deg`,
                animation: mounted
                  ? `itemPop 0.5s ease-out ${item.delay}s forwards, floatBob ${item.duration}s ease-in-out ${item.delay + 0.5}s infinite`
                  : "none",
                opacity: 0,
                filter: "drop-shadow(0 5px 12px rgba(0,0,0,0.08))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                width={Math.round(item.size * 0.38)}
                height={Math.round(item.size * 0.38)}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          ))}

          {/* ── Headline — center, z-30 so text is always readable ── */}
          <div className="flex-1 flex items-center justify-center relative z-30 pointer-events-none" style={{ marginTop: "-6vh" }}>
            <div className="text-center max-w-[900px] mx-auto px-6 pointer-events-auto">
              <h1
                className={`text-[#1A1A1A] leading-[0.95] tracking-[-0.03em] ${mounted ? "hero-in-d1" : "opacity-0"}`}
                style={{
                  fontFamily: "'DachiTheLynx', var(--font-outfit)",
                  fontWeight: 900,
                  fontStyle: "italic",
                  fontSize: "clamp(40px, 8.5vw, 84px)",
                }}
              >
                გამოიყენე SHANSI
              </h1>
              <h2
                className={`text-[#1A1A1A] leading-[1.0] tracking-[-0.02em] mt-2 ${mounted ? "hero-in-d2" : "opacity-0"}`}
                style={{
                  fontFamily: "'DachiTheLynx', var(--font-outfit)",
                  fontWeight: 900,
                  fontStyle: "italic",
                  fontSize: "clamp(34px, 7vw, 72px)",
                }}
              >
                აქციე ხარჯი მოგებად
              </h2>
            </div>
          </div>

        </section>

        {/* ═══════════ VIDEO SECTION — right below hero, like coverd ═══════════ */}
        <section className="relative z-30 px-6 md:px-10 -mt-12" style={{ background: "transparent" }}>
          <div className="max-w-[1200px] mx-auto relative">
            {/* Suitcase overlapping top-left of video — floating */}
            <div
              className="absolute pointer-events-none select-none hidden md:block"
              style={{
                left: -60,
                top: -70,
                width: 180,
                height: 180,
                zIndex: 40,
                // @ts-expect-error CSS custom property
                "--rot": "-6deg",
                animation: "floatBob 6s ease-in-out infinite",
                filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.12))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/onboarding/suitcase.png" alt="" width={180} height={180} className="w-full h-full object-contain" draggable={false} />
            </div>
            <div
              className="relative overflow-hidden cursor-pointer"
              style={{
                borderRadius: 20,
                boxShadow: "0 12px 50px rgba(0,0,0,0.15)",
                aspectRatio: "16 / 9",
                background: "#1A1A1A",
              }}
              onClick={() => {
                if (videoRef.current) {
                  if (videoPlaying) {
                    videoRef.current.pause();
                    setVideoPlaying(false);
                  } else {
                    videoRef.current.play();
                    setVideoPlaying(true);
                  }
                }
              }}
            >
              <video
                ref={videoRef}
                src="/images/shansi-demo.mp4"
                playsInline
                preload="metadata"
                controls={videoPlaying}
                style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
                onEnded={() => setVideoPlaying(false)}
              />
              {/* Play button overlay */}
              {!videoPlaying && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                  <div
                    className="flex items-center justify-center transition-transform duration-200 hover:scale-110"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "#F9E741",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                    }}
                  >
                    <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
                      <path d="M30 18L2 34V2L30 18Z" fill="#1A1A1A" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Tagline below video */}
            <p
              className="text-center mt-16 md:mt-20 px-4"
              style={{
                fontFamily: "'DachiTheLynx', var(--font-outfit)",
                fontWeight: 700,
                fontStyle: "italic",
                fontSize: "clamp(24px, 4vw, 44px)",
                color: "#1a1a2e",
                lineHeight: 1.3,
              }}
            >
              ისიამოვნე ყოველი მომენტით, SHANSI შენს მხარესაა.
            </p>

            {/* Transactions — 3 rows */}
            <div className="mt-28 md:mt-36 mb-16 md:mb-24 flex flex-col gap-16 md:gap-24 select-none">
              {/* Row 1: 3 transactions */}
              <div className="flex items-end gap-16 md:gap-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/trx-cavea-mc.png"
                  alt=""
                  className="h-auto pointer-events-none"
                  style={{
                    width: 400,
                    transform: "rotate(-1deg)",
                    filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
                  }}
                  draggable={false}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/trx-nike-mc.png"
                  alt=""
                  className="h-auto pointer-events-none"
                  style={{
                    width: 210,
                    transform: "rotate(2deg)",
                    filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
                  }}
                  draggable={false}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/trx-zara-mc.png"
                  alt=""
                  className="h-auto pointer-events-none"
                  style={{
                    width: 300,
                    transform: "rotate(-1.5deg)",
                    filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
                  }}
                  draggable={false}
                />
              </div>
              {/* Row 2: Bolt — centered */}
              <div className="flex justify-center" style={{ marginTop: -40 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/trx-bolt-amex.png"
                  alt=""
                  className="h-auto pointer-events-none"
                  style={{
                    width: 400,
                    transform: "rotate(-1deg)",
                    filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
                  }}
                  draggable={false}
                />
              </div>
              {/* Row 3: Zara Visa — left side, under Cavea */}
              <div className="flex justify-start" style={{ marginTop: -60 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/trx-zara-visa2.png"
                  alt=""
                  className="h-auto pointer-events-none"
                  style={{
                    width: 280,
                    transform: "rotate(1deg)",
                    filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
                  }}
                  draggable={false}
                />
              </div>
            </div>

            {/* App mockup */}
            <div className="mt-28 md:mt-36 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/app-mockup.png"
                alt="Shansi App"
                className="pointer-events-none"
                style={{
                  width: 340,
                  filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.15))",
                }}
                draggable={false}
              />
            </div>
          </div>
        </section>


        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section className="py-20 md:py-28 px-6" style={{ background: "#F9E741" }}>
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
                { emoji: "📱", step: "01", title: "Scan & Pay",   desc: "Visit any partner merchant and scan the QR code to log your purchase instantly." },
                { emoji: "🎮", step: "02", title: "Play Games",   desc: "Use your entries to play — slots, plinko, chicken rush. Every purchase is a game ticket." },
                { emoji: "💸", step: "03", title: "Win Cashback", desc: "Win up to 100% of your purchase back. Withdraw anytime, zero strings attached." },
              ].map((s, i) => (
                <div
                  key={i}
                  className="relative rounded-3xl p-8 md:p-10 text-center transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: "white", boxShadow: "0 2px 20px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <span
                    className="absolute top-4 right-6 text-[48px] font-black text-[#1A1A1A]/[0.04] select-none"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    {s.step}
                  </span>
                  <div className="text-[48px] mb-5">{s.emoji}</div>
                  <h3 className="text-[20px] font-bold text-[#1A1A1A] mb-3" style={{ fontFamily: "var(--font-outfit)" }}>
                    {s.title}
                  </h3>
                  <p className="text-[14px] text-[#1A1A1A]/55 leading-[1.6]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ DUAL CARDS ═══════════ */}
        <section className="py-16 md:py-24 px-6" style={{ background: "#F9E741" }}>
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-6 md:gap-8">
            <div
              className="rounded-3xl p-8 md:p-10 transition-all duration-200 hover:scale-[1.01]"
              style={{ background: "#F9E741", boxShadow: "0 4px 30px rgba(249,231,65,0.3)" }}
            >
              <span className="text-[48px] mb-4 block">📊</span>
              <h3 className="text-[28px] sm:text-[34px] font-extrabold text-[#1A1A1A] leading-[1.15] mb-4" style={{ fontFamily: "var(--font-outfit)" }}>
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
              <h3 className="text-[28px] sm:text-[34px] font-extrabold text-white leading-[1.15] mb-4" style={{ fontFamily: "var(--font-outfit)" }}>
                ...and win<br />them back
              </h3>
              <p className="text-[15px] text-white/55 leading-[1.6]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                A fun and thrilling approach to get your purchases covered — play games, win them back. Every purchase is a new chance.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURES GRID ═══════════ */}
        <section className="py-16 md:py-24 px-6" style={{ background: "#F9E741" }}>
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
                  <p className="text-[15px] font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "var(--font-outfit)" }}>{f.title}</p>
                  <p className="text-[13px] text-[#1A1A1A]/50 leading-[1.5]" style={{ fontFamily: "var(--font-dm-sans)" }}>{f.desc}</p>
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
            <p className="text-[16px] sm:text-[18px] text-[#1A1A1A]/60 mb-10 max-w-[420px] mx-auto" style={{ fontFamily: "var(--font-dm-sans)" }}>
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
              <span className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>Shansi</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/50" style={{ fontFamily: "var(--font-dm-sans)" }}>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-white transition-colors">Home</button>
              <button onClick={() => router.push("/auth")} className="hover:text-white transition-colors">Sign Up</button>
              <button onClick={() => router.push("/auth?mode=login")} className="hover:text-white transition-colors">Log In</button>
            </div>
            <p className="text-[12px] text-white/30" style={{ fontFamily: "var(--font-dm-sans)" }}>&copy; 2026 Shansi. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
