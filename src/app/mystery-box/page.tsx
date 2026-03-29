"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MysteryBoxPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        html, body { background: #E8C840 !important; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateY(0deg); }
          25% { transform: translateY(-12px) rotateY(3deg); }
          50% { transform: translateY(-6px) rotateY(-2deg); }
          75% { transform: translateY(-14px) rotateY(1deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(0,200,255,0.3), 0 0 60px rgba(0,200,255,0.1); }
          50% { box-shadow: 0 0 50px rgba(0,200,255,0.5), 0 0 100px rgba(0,200,255,0.2); }
        }
      `}</style>
      <meta name="theme-color" content="#E8C840" />

      <main
        className="min-h-[100dvh] relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #E8C840 0%, #D4A820 40%, #2A2520 75%, #1A1510 100%)",
        }}
      >
        {/* Sparkle particles */}
        {mounted && Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[3px] h-[3px] rounded-full bg-white"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${15 + Math.random() * 60}%`,
              animation: `sparkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
            }}
          />
        ))}

        <div
          className="max-w-[430px] mx-auto px-4 flex flex-col min-h-[100dvh]"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between mb-8"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.5s ease-out",
            }}
          >
            <div className="w-[44px]" />
            <h1
              className="text-[#1A1A1A] text-[18px] font-bold"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Mystery Box
            </h1>
            <button
              onClick={() => router.back()}
              className="w-[44px] h-[44px] flex items-center justify-center active:scale-[0.95] transition-transform"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l10 10M16 6L6 16" />
              </svg>
            </button>
          </div>

          {/* ── Mystery Cube ── */}
          <div className="flex-1 flex items-center justify-center">
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "scale(1)" : "scale(0.8)",
                transition: "all 0.8s ease-out 0.2s",
              }}
            >
              <div
                className="relative w-[280px] h-[280px]"
                style={{ animation: "float 6s ease-in-out infinite" }}
              >
                {/* Cube body */}
                <div
                  className="absolute inset-0 rounded-[24px]"
                  style={{
                    background: "linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 50%, #0A0A0A 100%)",
                    animation: "glow-pulse 3s ease-in-out infinite",
                    border: "2px solid rgba(0,200,255,0.3)",
                  }}
                >
                  {/* Honeycomb pattern overlay */}
                  <div className="absolute inset-0 rounded-[24px] overflow-hidden opacity-20">
                    <svg width="100%" height="100%" viewBox="0 0 280 280">
                      {Array.from({ length: 8 }).map((_, row) =>
                        Array.from({ length: 8 }).map((_, col) => (
                          <polygon
                            key={`${row}-${col}`}
                            points={(() => {
                              const cx = col * 38 + (row % 2 ? 19 : 0) + 10;
                              const cy = row * 34 + 10;
                              const r = 16;
                              return Array.from({ length: 6 }).map((_, i) => {
                                const a = (Math.PI / 3) * i - Math.PI / 6;
                                return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
                              }).join(" ");
                            })()}
                            fill="none"
                            stroke="rgba(0,200,255,0.4)"
                            strokeWidth="0.5"
                          />
                        ))
                      )}
                    </svg>
                  </div>

                  {/* Glowing ₾ logo in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Outer ring */}
                      <div
                        className="w-[140px] h-[140px] rounded-full flex items-center justify-center"
                        style={{
                          background: "radial-gradient(circle, rgba(232,200,64,0.3) 0%, transparent 70%)",
                          border: "3px solid rgba(232,200,64,0.6)",
                          boxShadow: "0 0 40px rgba(232,200,64,0.3), inset 0 0 30px rgba(232,200,64,0.1)",
                        }}
                      >
                        {/* Inner ring */}
                        <div
                          className="w-[100px] h-[100px] rounded-full flex items-center justify-center"
                          style={{
                            border: "2px solid rgba(232,200,64,0.4)",
                          }}
                        >
                          <span
                            className="text-[48px] font-black"
                            style={{
                              fontFamily: "var(--font-outfit)",
                              color: "#E8C840",
                              textShadow: "0 0 20px rgba(232,200,64,0.8), 0 0 40px rgba(232,200,64,0.4)",
                            }}
                          >
                            ₾
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Corner accents - cyan glow strips */}
                  <div className="absolute top-3 left-3 w-[40px] h-[4px] rounded-full" style={{ background: "linear-gradient(90deg, #00C8FF, transparent)", boxShadow: "0 0 10px #00C8FF" }} />
                  <div className="absolute top-3 left-3 w-[4px] h-[40px] rounded-full" style={{ background: "linear-gradient(180deg, #00C8FF, transparent)", boxShadow: "0 0 10px #00C8FF" }} />
                  <div className="absolute top-3 right-3 w-[40px] h-[4px] rounded-full" style={{ background: "linear-gradient(-90deg, #00C8FF, transparent)", boxShadow: "0 0 10px #00C8FF" }} />
                  <div className="absolute top-3 right-3 w-[4px] h-[40px] rounded-full" style={{ background: "linear-gradient(180deg, #00C8FF, transparent)", boxShadow: "0 0 10px #00C8FF" }} />
                  <div className="absolute bottom-3 left-3 w-[40px] h-[4px] rounded-full" style={{ background: "linear-gradient(90deg, #00C8FF, transparent)", boxShadow: "0 0 10px #00C8FF" }} />
                  <div className="absolute bottom-3 left-3 w-[4px] h-[40px] rounded-full" style={{ background: "linear-gradient(0deg, #00C8FF, transparent)", boxShadow: "0 0 10px #00C8FF" }} />
                  <div className="absolute bottom-3 right-3 w-[40px] h-[4px] rounded-full" style={{ background: "linear-gradient(-90deg, #00C8FF, transparent)", boxShadow: "0 0 10px #00C8FF" }} />
                  <div className="absolute bottom-3 right-3 w-[4px] h-[40px] rounded-full" style={{ background: "linear-gradient(0deg, #00C8FF, transparent)", boxShadow: "0 0 10px #00C8FF" }} />

                  {/* Edge highlights */}
                  <div className="absolute top-[50%] left-3 w-[4px] h-[60px] rounded-full -translate-y-1/2" style={{ background: "linear-gradient(180deg, transparent, #00C8FF, transparent)", boxShadow: "0 0 8px #00C8FF" }} />
                  <div className="absolute top-[50%] right-3 w-[4px] h-[60px] rounded-full -translate-y-1/2" style={{ background: "linear-gradient(180deg, transparent, #00C8FF, transparent)", boxShadow: "0 0 8px #00C8FF" }} />
                </div>

                {/* Reflection below */}
                <div
                  className="absolute -bottom-[60px] left-[10%] right-[10%] h-[50px] rounded-[50%]"
                  style={{
                    background: "radial-gradient(ellipse, rgba(0,200,255,0.15) 0%, transparent 70%)",
                    filter: "blur(10px)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Skip The Wait ── */}
          <div
            className="text-center mb-4"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.5s ease-out 0.6s",
            }}
          >
            <span
              className="text-[15px] font-medium"
              style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.4)" }}
            >
              Skip The Wait
            </span>
          </div>

          {/* ── Bottom Buttons ── */}
          <div
            className="flex items-center gap-3 pb-10"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.5s ease-out 0.8s",
              paddingBottom: "max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))",
            }}
          >
            <button
              className="flex-1 py-5 rounded-full active:scale-[0.97] transition-transform"
              style={{ background: "#1A1A1A" }}
            >
              <span
                className="text-white text-[16px] font-bold block text-center leading-tight"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Get mystery<br />box
              </span>
            </button>

            <span
              className="text-[16px] font-bold shrink-0"
              style={{ fontFamily: "var(--font-outfit)", color: "rgba(255,255,255,0.5)" }}
            >
              OR
            </span>

            <button
              className="flex-1 py-5 rounded-full active:scale-[0.97] transition-transform"
              style={{ background: "#1A1A1A" }}
            >
              <span
                className="text-white text-[16px] font-bold block text-center"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Invite 1 Friend
              </span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
