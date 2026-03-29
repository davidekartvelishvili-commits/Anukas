"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        html, body { background: #000000 !important; }
        @keyframes scan-line {
          0% { top: 0%; }
          50% { top: 92%; }
          100% { top: 0%; }
        }
      `}</style>
      <meta name="theme-color" content="#000000" />

      <main className="min-h-[100dvh] bg-black relative flex flex-col">
        {/* Glass overlay background */}
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(50, 50, 50, 0.08)",
            backdropFilter: "blur(12px) saturate(200%)",
            WebkitBackdropFilter: "blur(12px) saturate(200%)",
          }}
        />

        <div
          className="relative z-10 max-w-[430px] mx-auto w-full flex flex-col flex-1 px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between mb-8 shrink-0"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease-out",
            }}
          >
            <button
              onClick={() => router.back()}
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6" />
              </svg>
            </button>
            <h1
              className="text-white text-[18px] font-bold"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Scan QR Code
            </h1>
            <div className="w-[44px]" />
          </div>

          {/* ── Scanner area ── */}
          <div
            className="flex-1 flex items-center justify-center"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "scale(1)" : "scale(0.95)",
              transition: "all 0.5s ease-out 0.2s",
            }}
          >
            <div className="relative">
              {/* Scanner square */}
              <div
                className="w-[260px] h-[260px] relative rounded-[20px] overflow-hidden"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "2px solid rgba(255,255,255,0.15)",
                }}
              >
                {/* Scanning line */}
                <div
                  className="absolute left-[8px] right-[8px] h-[2px]"
                  style={{
                    background: "linear-gradient(90deg, transparent, #00E88F, transparent)",
                    boxShadow: "0 0 15px #00E88F, 0 0 30px rgba(0,232,143,0.3)",
                    animation: "scan-line 3s ease-in-out infinite",
                  }}
                />

                {/* Corner brackets */}
                {/* Top left */}
                <div className="absolute top-0 left-0 w-[40px] h-[3px] rounded-full" style={{ background: "#FFFFFF" }} />
                <div className="absolute top-0 left-0 w-[3px] h-[40px] rounded-full" style={{ background: "#FFFFFF" }} />
                {/* Top right */}
                <div className="absolute top-0 right-0 w-[40px] h-[3px] rounded-full" style={{ background: "#FFFFFF" }} />
                <div className="absolute top-0 right-0 w-[3px] h-[40px] rounded-full" style={{ background: "#FFFFFF" }} />
                {/* Bottom left */}
                <div className="absolute bottom-0 left-0 w-[40px] h-[3px] rounded-full" style={{ background: "#FFFFFF" }} />
                <div className="absolute bottom-0 left-0 w-[3px] h-[40px] rounded-full" style={{ background: "#FFFFFF" }} />
                {/* Bottom right */}
                <div className="absolute bottom-0 right-0 w-[40px] h-[3px] rounded-full" style={{ background: "#FFFFFF" }} />
                <div className="absolute bottom-0 right-0 w-[3px] h-[40px] rounded-full" style={{ background: "#FFFFFF" }} />
              </div>

              {/* Instruction text */}
              <p
                className="text-center text-[14px] mt-6"
                style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.5)" }}
              >
                Point your camera at a QR code
              </p>
            </div>
          </div>

          {/* ── Bottom actions ── */}
          <div
            className="shrink-0 flex flex-col items-center gap-3 pb-6"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease-out 0.4s",
              paddingBottom: "max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))",
            }}
          >
            <button
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <span
              className="text-[12px]"
              style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.4)" }}
            >
              Upload from gallery
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
