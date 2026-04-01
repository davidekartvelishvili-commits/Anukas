"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VillagePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showHand, setShowHand] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Hand blink every 3 seconds
  useEffect(() => {
    if (!showWelcome) return;
    const iv = setInterval(() => {
      setShowHand((h) => !h);
    }, 3000);
    return () => clearInterval(iv);
  }, [showWelcome]);

  const handleCardClick = () => {
    setShowWelcome(false);
    setShowHand(false);
  };

  return (
    <>
      <style>{`
        html, body { background: #87CEEB !important; }
        @keyframes float-cloud { 0% { transform: translateX(0); } 100% { transform: translateX(30px); } }
        @keyframes sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        @keyframes sparkle-flower { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes hand-bounce { 0%,100% { transform: translateY(0) rotate(-15deg); } 50% { transform: translateY(-8px) rotate(-15deg); } }
        @keyframes banner-pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      <main className="relative w-full h-[100dvh] overflow-hidden" style={{ background: "linear-gradient(180deg, #e8f4f8 0%, #c5e8f0 8%, #87CEEB 15%, #87CEEB 20%, #6ab04c 28%, #5a9e3e 35%, #4a8e30 60%, #3d7a28 70%, #2d8bc9 78%, #1e90c9 85%, #2d8bc9 100%)" }}>

        {/* Clouds */}
        <div className="absolute top-[3%] right-[10%] w-[120px] h-[50px] rounded-[40px] opacity-80" style={{ background: "rgba(255,255,255,0.7)", animation: "float-cloud 8s ease-in-out infinite alternate" }} />
        <div className="absolute top-[6%] right-[25%] w-[80px] h-[35px] rounded-[30px] opacity-60" style={{ background: "rgba(255,255,255,0.6)", animation: "float-cloud 10s ease-in-out infinite alternate-reverse" }} />
        <div className="absolute top-[2%] left-[5%] w-[60px] h-[28px] rounded-[20px] opacity-50" style={{ background: "rgba(255,255,255,0.5)", animation: "float-cloud 12s ease-in-out infinite alternate" }} />

        {/* Forest trees - back row */}
        {[8, 18, 30, 42, 55, 68, 80, 90].map((left, i) => (
          <div key={`bt-${i}`} className="absolute" style={{ left: `${left}%`, top: "15%", transform: "translateX(-50%)" }}>
            <div style={{ width: 0, height: 0, borderLeft: `${18 + i % 3 * 5}px solid transparent`, borderRight: `${18 + i % 3 * 5}px solid transparent`, borderBottom: `${50 + i % 3 * 10}px solid #1a5c3a` }} />
            <div style={{ width: 0, height: 0, borderLeft: `${22 + i % 3 * 5}px solid transparent`, borderRight: `${22 + i % 3 * 5}px solid transparent`, borderBottom: `${45 + i % 3 * 8}px solid #1a6b3a`, marginTop: -20, marginLeft: -4 }} />
            <div className="w-[8px] h-[15px] mx-auto rounded-b-sm" style={{ background: "#5c3a1a" }} />
          </div>
        ))}

        {/* Forest trees - front row */}
        {[5, 15, 25, 72, 82, 92].map((left, i) => (
          <div key={`ft-${i}`} className="absolute" style={{ left: `${left}%`, top: "22%", transform: "translateX(-50%)", zIndex: 2 }}>
            <div style={{ width: 0, height: 0, borderLeft: `${20 + i % 2 * 8}px solid transparent`, borderRight: `${20 + i % 2 * 8}px solid transparent`, borderBottom: `${55 + i % 2 * 12}px solid #2d7a28` }} />
            <div style={{ width: 0, height: 0, borderLeft: `${24 + i % 2 * 8}px solid transparent`, borderRight: `${24 + i % 2 * 8}px solid transparent`, borderBottom: `${50 + i % 2 * 10}px solid #3a8e30`, marginTop: -22, marginLeft: -4 }} />
            <div className="w-[9px] h-[18px] mx-auto rounded-b-sm" style={{ background: "#6b4a2a" }} />
          </div>
        ))}

        {/* Bushes */}
        {[3, 20, 75, 95].map((left, i) => (
          <div key={`bush-${i}`} className="absolute rounded-full" style={{ left: `${left}%`, top: `${30 + i * 2}%`, width: 30 + i * 5, height: 20 + i * 3, background: "#3d8a28", zIndex: 2 }}>
            <div className="absolute w-[5px] h-[5px] rounded-full bg-red-500 top-[2px] left-[8px]" />
            <div className="absolute w-[4px] h-[4px] rounded-full bg-red-500 top-[5px] right-[10px]" />
          </div>
        ))}

        {/* Fence - wooden stakes around village */}
        <div className="absolute" style={{ left: "20%", top: "30%", width: "60%", height: "35%", zIndex: 3 }}>
          {/* Left fence */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`fl-${i}`} className="absolute" style={{
              left: `${-2 + i * 2}%`, top: `${10 + i * 10}%`,
              width: 6, height: 22, background: "#8B6914", borderRadius: "2px 2px 0 0",
              transform: `rotate(${-15 + i * 2}deg)`, boxShadow: "1px 0 0 #6b4a0a",
            }} />
          ))}
          {/* Right fence */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`fr-${i}`} className="absolute" style={{
              right: `${-2 + i * 2}%`, top: `${10 + i * 10}%`,
              width: 6, height: 22, background: "#8B6914", borderRadius: "2px 2px 0 0",
              transform: `rotate(${15 - i * 2}deg)`, boxShadow: "-1px 0 0 #6b4a0a",
            }} />
          ))}
        </div>

        {/* Village clearing - lighter green area */}
        <div className="absolute rounded-[50%]" style={{ left: "15%", top: "32%", width: "70%", height: "30%", background: "radial-gradient(ellipse, #7ec850 0%, #6ab04c 50%, #5a9e3e 100%)", zIndex: 1 }} />

        {/* Small flowers scattered */}
        {[
          { x: 30, y: 45 }, { x: 50, y: 50 }, { x: 65, y: 42 }, { x: 40, y: 55 },
          { x: 55, y: 48 }, { x: 35, y: 52 }, { x: 60, y: 55 }, { x: 45, y: 42 },
        ].map((f, i) => (
          <div key={`fl-${i}`} className="absolute w-[6px] h-[6px] rounded-full" style={{
            left: `${f.x}%`, top: `${f.y}%`, background: "#fff",
            animation: `sparkle-flower ${2 + i * 0.3}s ease-in-out ${i * 0.4}s infinite`, zIndex: 4,
          }} />
        ))}

        {/* Lake */}
        <div className="absolute" style={{ left: "5%", top: "68%", width: "90%", height: "18%", background: "linear-gradient(180deg, #2d8bc9 0%, #1e7ab8 50%, #1565a0 100%)", borderRadius: "40% 60% 50% 50%", zIndex: 5 }}>
          {/* Lake shore */}
          <div className="absolute -top-[6px] left-[5%] right-[5%] h-[12px] rounded-[50%]" style={{ background: "#8B6914" }} />
          {/* Water shimmer */}
          <div className="absolute top-[30%] left-[20%] w-[60%] h-[3px] rounded-full opacity-30" style={{ background: "rgba(255,255,255,0.4)" }} />
          <div className="absolute top-[50%] left-[30%] w-[40%] h-[2px] rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.3)" }} />
        </div>

        {/* Wooden dock */}
        <div className="absolute" style={{ left: "52%", top: "72%", zIndex: 6 }}>
          <div className="w-[50px] h-[8px] rounded-[2px]" style={{ background: "#8B6914", transform: "perspective(100px) rotateX(15deg)" }} />
          <div className="w-[50px] h-[8px] rounded-[2px] mt-[3px]" style={{ background: "#7a5a10" }} />
          {/* Dock posts */}
          <div className="absolute -left-[3px] top-[2px] w-[5px] h-[20px] rounded-b-sm" style={{ background: "#6b4a0a" }} />
          <div className="absolute -right-[3px] top-[2px] w-[5px] h-[20px] rounded-b-sm" style={{ background: "#6b4a0a" }} />
        </div>

        {/* ── TOP UI ── */}
        <div className="absolute top-0 left-0 right-0 z-30" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
          <div className="flex items-center justify-between px-3">
            {/* Coins */}
            <div className="flex items-center gap-1.5">
              <img src="/images/lari-icon.png" alt="₾" width={32} height={32} style={{ objectFit: "contain" }} />
              <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: "rgba(180,140,80,0.7)" }}>
                <span className="text-white text-[15px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>75,000</span>
                <span className="text-[#4CAF50] text-[14px] font-bold">+</span>
              </div>
            </div>

            {/* Star - Level */}
            <div className="flex items-center gap-1">
              <span className="text-[28px]">⭐</span>
              <span className="text-white text-[15px] font-bold" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>0</span>
            </div>

            {/* Shields */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: "rgba(150,200,240,0.5)" }}>
              <span className="text-[20px]">🛡️</span>
              <span className="text-white text-[13px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>0</span>
            </div>
          </div>
        </div>

        {/* ── WELCOME BANNER ── */}
        {showWelcome && (
          <div className="absolute left-0 right-0 z-20 flex flex-col items-center" style={{ top: "30%", animation: "banner-pop 0.5s ease-out" }}>
            {/* Red banner */}
            <div className="relative px-8 py-3 mb-4" style={{ background: "linear-gradient(180deg, #e53935, #c62828)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
              {/* Banner folds */}
              <div className="absolute -left-3 top-0 w-3 h-full" style={{ background: "#b71c1c", borderRadius: "4px 0 0 4px" }} />
              <div className="absolute -right-3 top-0 w-3 h-full" style={{ background: "#b71c1c", borderRadius: "0 4px 4px 0" }} />
              <span className="text-white text-[22px] font-black uppercase tracking-wider" style={{ fontFamily: "var(--font-outfit)", textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
                Your First Village
              </span>
            </div>

            {/* Welcome text */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px]">✨</span>
              <span className="text-white text-[22px] font-black italic" style={{ fontFamily: "var(--font-outfit)", textShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}>
                Welcome Friend!
              </span>
              <span className="text-[10px]">✨</span>
            </div>
            <span className="text-white text-[17px] font-bold" style={{ fontFamily: "var(--font-outfit)", textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>
              Click on the Build button to start
            </span>
          </div>
        )}

        {/* ── BOTTOM CARDS ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 70px)" }}>
          <div className="flex gap-2 px-2 overflow-x-auto scrollbar-hide">
            {[
              { price: "60K", stars: 4 },
              { price: "80K", stars: 4 },
              { price: "100K", stars: 4 },
              { price: "120K", stars: 4 },
              { price: "160K", stars: 4 },
            ].map((card, i) => (
              <div
                key={i}
                onClick={handleCardClick}
                className="relative shrink-0 w-[85px] rounded-[12px] overflow-hidden cursor-pointer active:scale-[0.95] transition-transform"
                style={{ background: "linear-gradient(180deg, #f5e6c8, #e8d4a8)", border: "2px solid #c4a46a", boxShadow: "0 3px 8px rgba(0,0,0,0.2)" }}
              >
                {/* Stars */}
                <div className="flex justify-center gap-0.5 pt-1.5">
                  {Array.from({ length: card.stars }).map((_, s) => (
                    <span key={s} className="text-[10px]">⭐</span>
                  ))}
                </div>

                {/* Empty card content area */}
                <div className="h-[60px] flex items-center justify-center">
                  <div className="w-[50px] h-[50px] rounded-[8px]" style={{ background: "rgba(180,150,100,0.2)" }} />
                </div>

                {/* Price */}
                <div className="flex items-center justify-center gap-1 pb-1.5 pt-1">
                  <img src="/images/lari-icon.png" alt="₾" width={14} height={14} style={{ objectFit: "contain" }} />
                  <span className="text-[12px] font-bold" style={{ color: "#5a4a2a", fontFamily: "var(--font-outfit)" }}>{card.price}</span>
                </div>

                {/* Hand pointer on first card */}
                {i === 0 && showHand && showWelcome && (
                  <div className="absolute -bottom-2 -left-2 text-[36px] z-30" style={{ animation: "hand-bounce 1s ease-in-out infinite" }}>
                    👆
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM NAV ── */}
        <nav className="absolute bottom-0 left-0 right-0 z-30 flex justify-center" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}>
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
              { label: "Village", idx: 2, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 20V10l8-7 8 7v10" />
                  <path d="M8 20v-5h6v5" />
                  <path d="M1 20h20" />
                  <circle cx="17" cy="6" r="2" fill={a ? "#FFF" : "none"} />
                </svg>
              )},
              { label: "Scan", idx: 3, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7V4a2 2 0 012-2h3" />
                  <path d="M15 2h3a2 2 0 012 2v3" />
                  <path d="M20 15v3a2 2 0 01-2 2h-3" />
                  <path d="M7 20H4a2 2 0 01-2-2v-3" />
                  <line x1="2" y1="11" x2="20" y2="11" />
                </svg>
              )},
            ].map(({ label, idx, icon }) => {
              const isActive = idx === 2;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (idx === 0) router.push("/home");
                    if (idx === 1) router.push("/games");
                    if (idx === 3) router.push("/scan");
                  }}
                  className="flex flex-col items-center px-3.5 py-1.5 rounded-full transition-all duration-200"
                  style={{ background: isActive ? "rgba(255,255,255,0.1)" : "transparent" }}
                >
                  {icon(isActive)}
                  <span
                    className="text-[10px] mt-1 font-medium"
                    style={{ fontFamily: "var(--font-dm-sans)", color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.4)" }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>
    </>
  );
}
