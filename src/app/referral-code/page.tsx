"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReferralCodePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const stagger = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.5s ease-out ${i * 0.08}s`,
  });

  return (
    <>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="min-h-[100dvh] bg-black pb-[100px]">
        <div
          className="max-w-[430px] mx-auto px-4 pt-[120px]"
        >
          {/* ── Title ── */}
          <h1
            className="text-white text-[32px] font-bold text-center leading-tight mb-4"
            style={{ ...stagger(0), fontFamily: "var(--font-outfit)" }}
          >
            Do you have a{"\n"}referral code?
          </h1>

          {/* ── Subtitle ── */}
          <p
            className="text-[#999] text-[16px] text-center mb-8"
            style={{ ...stagger(1), fontFamily: "var(--font-dm-sans)" }}
          >
            If a friend invited you, enter code:
          </p>

          {/* ── Input ── */}
          <div style={stagger(2)}>
            <input
              type="text"
              placeholder="eg. 8CM99K1"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-5 py-4 rounded-full text-[16px] text-white placeholder-[#666] outline-none"
              style={{
                background: "#1C1C1E",
                fontFamily: "var(--font-dm-sans)",
              }}
            />
          </div>

          {/* ── Cancel ── */}
          <button
            onClick={() => router.back()}
            className="w-full py-4 mt-6 active:opacity-60 transition-opacity"
            style={stagger(3)}
          >
            <span
              className="text-white text-[17px] font-bold"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Cancel
            </span>
          </button>

          {/* ── Apply ── */}
          <div className="flex justify-center" style={stagger(4)}>
            <button
              className="px-16 py-7 rounded-full mt-4 active:scale-[0.97] transition-transform"
              style={{
                background: code.length > 0 ? "#FFD700" : "rgba(255,255,255,0.25)",
              }}
              onClick={() => {
                if (code.length > 0) {
                  router.back();
                }
              }}
            >
              <span
                className={`text-[17px] font-bold ${code.length > 0 ? "text-black" : "text-[#666]"}`}
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Apply
              </span>
            </button>
          </div>
        </div>

        {/* ── Bottom Nav ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
          <div
            className="flex items-center px-2 py-1.5 rounded-full gap-0"
            style={{
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(5px) saturate(200%)",
              WebkitBackdropFilter: "blur(5px) saturate(200%)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            {[
              { label: "Home", idx: 0, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l8-7 8 7" /><path d="M5 9.5v8a1 1 0 001 1h3v-4h4v4h3a1 1 0 001-1v-8" />
                </svg>
              )},
              { label: "Games", idx: 1, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="7" cy="7" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                  <circle cx="15" cy="7" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                  <circle cx="7" cy="15" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                  <circle cx="15" cy="15" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                </svg>
              )},
              { label: "Scan", idx: 2, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7V4a2 2 0 012-2h3" />
                  <path d="M15 2h3a2 2 0 012 2v3" />
                  <path d="M20 15v3a2 2 0 01-2 2h-3" />
                  <path d="M7 20H4a2 2 0 01-2-2v-3" />
                  <line x1="2" y1="11" x2="20" y2="11" />
                </svg>
              )},
            ].map(({ label, idx, icon }) => (
              <button
                key={idx}
                onClick={() => {
                  if (idx === 0) router.push("/home");
                  if (idx === 1) router.push("/games");
                }}
                className="flex flex-col items-center px-5 py-1.5 rounded-full transition-all duration-200"
              >
                {icon(false)}
                <span
                  className="text-[10px] mt-1 font-medium"
                  style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.4)" }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </main>
    </>
  );
}
