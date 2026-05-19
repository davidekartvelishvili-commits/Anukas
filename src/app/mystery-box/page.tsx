"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AuthGuard from "@/components/AuthGuard";

const MysteryCube = dynamic(() => import("@/components/MysteryCube"), { ssr: false });

/* ───────── MAIN ───────── */

export default function MysteryBoxPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AuthGuard>
      <style>{`html, body { background: #1A1510 !important; }`}</style>
      <meta name="theme-color" content="#1A1510" />

      <main
        className="relative flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #E8C840 0%, #D4A820 40%, #2A2520 75%, #1A1510 100%)",
          height: "100dvh",
          minHeight: "100vh",
        }}
      >
        {/* Sparkle particles */}
        {mounted && Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] rounded-full bg-white pointer-events-none"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${15 + Math.random() * 55}%`,
              animation: `sparkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite`,
            }}
          />
        ))}

        <div
          className="max-w-[430px] mx-auto w-full flex flex-col flex-1"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 mb-4 shrink-0">
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

          {/* ── 3D Cube ── */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className="w-[340px] h-[340px]"
              style={{
                opacity: mounted ? 1 : 0,
                transition: "opacity 0.5s ease-out",
              }}
            >
              <MysteryCube />
            </div>
          </div>

          {/* ── Skip The Wait ── */}
          <div className="text-center mb-4 shrink-0 px-4">
            <span
              className="text-[15px] font-medium"
              style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.4)" }}
            >
              Skip The Wait
            </span>
          </div>

          {/* ── Bottom Buttons ── */}
          <div
            className="flex items-center gap-3 px-4 shrink-0"
            style={{ paddingBottom: "max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))" }}
          >
            <button
              onClick={() => setShowComingSoon(true)}
              className="flex-1 py-5 rounded-full active:scale-[0.97] transition-transform"
              style={{ background: "#000000" }}
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
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "BackApp - smart cashback",
                    text: "Join me on BackApp and get a free Mystery Box!",
                    url: window.location.origin,
                  }).catch(() => {});
                }
              }}
              className="flex-1 py-5 rounded-full active:scale-[0.97] transition-transform"
              style={{ background: "#000000" }}
            >
              <span
                className="text-white text-[16px] font-bold block text-center leading-tight"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Invite 1<br />Friend
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Coming Soon Popup */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowComingSoon(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative rounded-[20px] px-6 py-7 max-w-[320px] w-full"
            style={{
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
              border: "1px solid rgba(255,255,255,0.2)",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-white text-[20px] font-bold mb-2"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Get a Mystery Box
            </h3>
            <p
              className="text-[rgba(255,255,255,0.6)] text-[15px] mb-5 leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Use your Cashback Cash to buy a Mystery Box?
            </p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full py-4 rounded-full active:scale-[0.97] transition-transform mb-3"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span
                className="text-white text-[16px] font-bold"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Buy for 5 Cashback Cash
              </span>
            </button>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full py-4 rounded-full active:scale-[0.97] transition-transform"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <span
                className="text-white text-[16px] font-bold"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Cancel
              </span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </AuthGuard>
  );
}
