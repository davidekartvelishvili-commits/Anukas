"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { seedTestUser } from "@/services/balance";

export default function SplashScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    seedTestUser();
    // Phase 1: Logo appears (300ms)
    const t1 = setTimeout(() => setPhase(1), 300);
    // Phase 2: Text appears (900ms)
    const t2 = setTimeout(() => setPhase(2), 900);
    // Phase 3: Shimmer + particles + tagline (1800ms)
    const t3 = setTimeout(() => setPhase(3), 1800);
    // Phase 4: Fade out + redirect (3500ms)
    const t4 = setTimeout(() => setPhase(4), 3500);
    // Navigate after fade completes — check auth
    const t5 = setTimeout(() => {
      const token = localStorage.getItem("shansi_token");
      const phone = localStorage.getItem("shansi_phone");
      if (token) {
        router.push("/home");
      } else if (phone) {
        // Has phone stored (set up PIN before) — show PIN login
        router.push(`/auth?mode=login&pin=true&phone=${phone}`);
      } else {
        router.push("/welcome");
      }
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [router]);

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#0A0F1C]">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[rgba(0,232,143,0.08)] blur-[40px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[rgba(0,232,143,0.06)] blur-[40px] pointer-events-none" />

      {/* Logo container */}
      <div className="relative flex items-center justify-center">
        {/* Expanding rings (Phase 2+) */}
        {phase >= 2 && (
          <>
            <div className="absolute w-[100px] h-[100px] rounded-[28px] border-2 border-[#00E88F] animate-ring1" />
            <div className="absolute w-[100px] h-[100px] rounded-[28px] border-2 border-[#00E88F] animate-ring2" />
          </>
        )}

        {/* Pulsing glow (Phase 3+) */}
        <div
          className={`relative w-[100px] h-[100px] rounded-[28px] flex items-center justify-center
            ${phase >= 1 ? "animate-logoIn" : "scale-0"}
            ${phase >= 3 ? "animate-logoGlow" : ""}`}
          style={{
            background: "linear-gradient(135deg, #00E88F, #00C777, #00A85F)",
          }}
        >
          <span
            className="text-[#0A0F1C] text-[48px] font-[800] leading-none select-none"
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            C
          </span>
        </div>
      </div>

      {/* App name */}
      <h1
        className={`mt-6 text-[42px] font-bold leading-none select-none transition-all duration-500
          ${phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}
          ${phase >= 3 ? "animate-shimmer bg-clip-text text-transparent" : "text-white"}`}
        style={{
          fontFamily: "var(--font-outfit), sans-serif",
          ...(phase >= 3
            ? {
                backgroundImage:
                  "linear-gradient(90deg, #00E88F, #00FFB2, #00E88F, #00FFB2, #00E88F)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }
            : {}),
        }}
      >
        Covrd
      </h1>

      {/* Tagline */}
      <p
        className={`mt-3 text-[15px] uppercase tracking-[3px] text-[#94A3B8] transition-all duration-500
          ${phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      >
        WIN IT BACK
      </p>

      {/* Floating particles (Phase 3+) */}
      {phase >= 3 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-[#00E88F] animate-particle"
              style={{
                width: `${4 + Math.random() * 4}px`,
                height: `${4 + Math.random() * 4}px`,
                left: `${15 + i * 13}%`,
                bottom: "30%",
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + Math.random() * 1.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Loading dots */}
      <div className="absolute bottom-24 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full bg-[#00E88F] transition-opacity duration-300
              ${phase >= 2 ? "animate-pulse" : "opacity-0"}`}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      {/* iPhone bottom bar indicator */}
      <div className="absolute bottom-2 w-[134px] h-[5px] rounded-full bg-[rgba(241,245,249,0.15)]" />

      {/* Phase 4: Fade to black overlay */}
      <div
        className={`absolute inset-0 bg-[#0A0F1C] pointer-events-none transition-opacity duration-500
          ${phase >= 4 ? "opacity-100" : "opacity-0"}`}
      />
    </main>
  );
}
