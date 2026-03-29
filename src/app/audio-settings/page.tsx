"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const BEHAVIOR_OPTIONS = ["Default", "Always on", "Always off"];
const BEHAVIOR_DESCRIPTIONS: Record<string, string> = {
  Default: "Game audio follows your device ringer settings.",
  "Always on": "Game audio will always play, even when ringer is off.",
  "Always off": "Game audio will never play, even when ringer is on.",
};

export default function AudioSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [behavior, setBehavior] = useState("Always on");
  const [sfx, setSfx] = useState(false);
  const [music, setMusic] = useState(true);

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
          className="max-w-[430px] mx-auto px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          {/* ── Top bar ── */}
          <div className="flex items-center justify-center relative mb-8" style={stagger(0)}>
            <button
              onClick={() => router.back()}
              className="absolute left-0 w-[44px] h-[44px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
              style={{ background: "#1C1C1E" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6" />
              </svg>
            </button>
            <h1
              className="text-white text-[18px] font-bold"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Audio Settings
            </h1>
          </div>

          {/* ── Audio Behavior ── */}
          <div style={stagger(1)}>
            <h2
              className="text-white text-[17px] font-semibold mb-3"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Audio Behavior
            </h2>

            {/* Segmented control */}
            <div
              className="flex items-center rounded-[28px] p-1 mb-4"
              style={{ background: "#1C1C1E" }}
            >
              {BEHAVIOR_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBehavior(opt)}
                  className="flex-1 py-3 rounded-[24px] text-center transition-all duration-200"
                  style={{ background: behavior === opt ? "rgba(255,255,255,0.15)" : "transparent" }}
                >
                  <span
                    className={`text-[14px] font-semibold ${behavior === opt ? "text-white" : "text-[#888]"}`}
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {opt}
                  </span>
                </button>
              ))}
            </div>

            {/* Description */}
            <p
              className="text-[#999] text-[15px] leading-relaxed mb-8"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {BEHAVIOR_DESCRIPTIONS[behavior]}
            </p>
          </div>

          {/* ── Individual Controls ── */}
          <div style={stagger(2)}>
            <h2
              className="text-white text-[17px] font-semibold mb-3"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Individual Controls
            </h2>

            <div className="rounded-[28px] overflow-hidden" style={{ background: "#1C1C1E" }}>
              {/* Sound Effects */}
              <div className="flex items-center justify-between px-5 py-4">
                <span
                  className="text-white text-[16px] font-medium"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Sound Effects
                </span>
                <button
                  onClick={() => setSfx(!sfx)}
                  className="relative w-[52px] h-[30px] rounded-full transition-all duration-300"
                  style={{ background: sfx ? "#FFFFFF" : "rgba(255,255,255,0.2)" }}
                >
                  <div
                    className="absolute top-[3px] w-[24px] h-[24px] rounded-full transition-all duration-300"
                    style={{
                      left: sfx ? "25px" : "3px",
                      background: sfx ? "#000" : "#FFF",
                    }}
                  />
                </button>
              </div>

              {/* Divider */}
              <div className="mx-5 h-[0.5px]" style={{ background: "rgba(255,255,255,0.08)" }} />

              {/* Background Music */}
              <div className="flex items-center justify-between px-5 py-4">
                <span
                  className="text-white text-[16px] font-medium"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Background Music
                </span>
                <button
                  onClick={() => setMusic(!music)}
                  className="relative w-[52px] h-[30px] rounded-full transition-all duration-300"
                  style={{ background: music ? "#FFFFFF" : "rgba(255,255,255,0.2)" }}
                >
                  <div
                    className="absolute top-[3px] w-[24px] h-[24px] rounded-full transition-all duration-300"
                    style={{
                      left: music ? "25px" : "3px",
                      background: music ? "#000" : "#FFF",
                    }}
                  />
                </button>
              </div>
            </div>
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
                style={{ background: "transparent" }}
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
