"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch } from "@/services/api";
import { getCoinBalance } from "@/services/balance";

interface Building {
  id: string;
  position: number;
  name: string;
  currentStars: number;
  currentImage: string;
  nextStar: number | null;
  nextName: string | null;
  nextCost: number | null;
  nextImage: string | null;
  previewImage: string;
  complete: boolean;
}

interface VillageData {
  id: string;
  name: string;
  theme: string;
  position: number;
  buildings: Building[];
  totalStars: number;
  totalRequired: number;
  complete: boolean;
}

function StarRow({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-0.5 pt-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 12,
            height: 12,
            clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            background: i < current ? "#FFD700" : "#8a7a5a",
          }}
        />
      ))}
    </div>
  );
}

export default function VillagePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [village, setVillage] = useState<VillageData | null>(null);
  const [coinBalance, setCoinBalanceState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showHand, setShowHand] = useState(true);
  const [profile, setProfile] = useState<{ totalStars: number; shieldActive: boolean; currentLevel: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Fetch village data
  useEffect(() => {
    setCoinBalanceState(getCoinBalance());
    Promise.all([
      apiFetch("/village/current").catch(() => null),
      apiFetch("/village/profile").catch(() => null),
    ]).then(([vData, pData]: any[]) => {
      if (vData?.success) setVillage(vData.village);
      if (pData?.success) setProfile(pData.profile);
      setLoading(false);
    });
  }, []);

  // Hand blink
  useEffect(() => {
    if (!showWelcome) return;
    const iv = setInterval(() => setShowHand((h) => !h), 3000);
    return () => clearInterval(iv);
  }, [showWelcome]);

  const handleUpgrade = async (building: Building) => {
    if (building.complete || !building.nextCost || upgrading) return;
    setShowWelcome(false);
    setShowHand(false);

    if (coinBalance < building.nextCost) return;

    setUpgrading(building.id);
    try {
      const res: any = await apiFetch("/village/upgrade", {
        method: "POST",
        body: JSON.stringify({ buildingId: building.id }),
      });
      if (res.success) {
        // Refresh data
        const [vData, pData]: any[] = await Promise.all([
          apiFetch("/village/current").catch(() => null),
          apiFetch("/village/profile").catch(() => null),
        ]);
        if (vData?.success) setVillage(vData.village);
        if (pData?.success) setProfile(pData.profile);
        setCoinBalanceState(getCoinBalance());
      }
    } catch {
      // error handling
    }
    setUpgrading(null);
  };

  const formatCoins = (n: number) => {
    if (n >= 1000) return `${Math.floor(n / 1000)}K`;
    return String(n);
  };

  const buildings = village?.buildings || [];

  return (
    <AuthGuard>
      <style>{`
        html, body { background: #87CEEB !important; }
        @keyframes drift-slow { 0% { transform: translateX(-20px); } 100% { transform: translateX(20px); } }
        @keyframes drift-med { 0% { transform: translateX(-15px); } 100% { transform: translateX(25px); } }
        @keyframes drift-fast { 0% { transform: translateX(-30px); } 100% { transform: translateX(10px); } }
        @keyframes tree-sway { 0%,100% { transform: rotate(-1.2deg) translateY(0); } 50% { transform: rotate(1.2deg) translateY(-1px); } }
        @keyframes leaf-sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        @keyframes sparkle-flower { 0%,100% { opacity: 0.4; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes hand-bounce { 0%,100% { transform: translateY(0) rotate(-15deg); } 50% { transform: translateY(-8px) rotate(-15deg); } }
        @keyframes banner-pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes water-ripple-1 { 0% { transform: translateX(-100%); opacity: 0; } 30% { opacity: 0.7; } 100% { transform: translateX(100%); opacity: 0; } }
        @keyframes water-ripple-2 { 0% { transform: translateX(-80%); opacity: 0; } 30% { opacity: 0.5; } 100% { transform: translateX(120%); opacity: 0; } }
        @keyframes water-shine { 0%,100% { opacity: 0.2; } 50% { opacity: 0.6; } }
        @keyframes fence-sway { 0%,100% { transform: translateY(0) rotate(var(--r, 0deg)); } 50% { transform: translateY(-0.5px) rotate(calc(var(--r, 0deg) + 0.5deg)); } }
      `}</style>

      <main className="relative w-full h-[100dvh] overflow-hidden" style={{ background: "linear-gradient(180deg, #d4ecf5 0%, #b3dcec 10%, #87CEEB 18%, #7cc4e1 22%, #6ab04c 30%, #5a9e3e 38%, #4a8e30 58%, #3d7a28 68%, #2d8bc9 76%, #1e90c9 84%, #1975a8 100%)" }}>

        {/* ── REALISTIC CLOUDS — multi-layered puff ── */}
        {[
          { top: 3, left: 65, scale: 1.2, speed: 22, delay: 0, opacity: 0.95 },
          { top: 7, left: 30, scale: 0.8, speed: 28, delay: -8, opacity: 0.8 },
          { top: 2, left: 8, scale: 0.9, speed: 32, delay: -3, opacity: 0.85 },
          { top: 10, left: 85, scale: 0.6, speed: 26, delay: -12, opacity: 0.7 },
        ].map((c, i) => (
          <div
            key={`cloud-${i}`}
            className="absolute"
            style={{
              top: `${c.top}%`,
              left: `${c.left}%`,
              transform: `scale(${c.scale})`,
              animation: `${i % 3 === 0 ? "drift-slow" : i % 3 === 1 ? "drift-med" : "drift-fast"} ${c.speed}s ease-in-out infinite alternate`,
              animationDelay: `${c.delay}s`,
              opacity: c.opacity,
              zIndex: 1,
            }}
          >
            <svg width="140" height="60" viewBox="0 0 140 60" style={{ filter: "drop-shadow(0 4px 8px rgba(100,130,160,0.15))" }}>
              <defs>
                <radialGradient id={`cloudGrad${i}`} cx="50%" cy="40%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#f5f9fc" />
                  <stop offset="100%" stopColor="#d8e4ec" />
                </radialGradient>
              </defs>
              <ellipse cx="30" cy="40" rx="22" ry="18" fill={`url(#cloudGrad${i})`} />
              <ellipse cx="55" cy="32" rx="26" ry="22" fill={`url(#cloudGrad${i})`} />
              <ellipse cx="85" cy="35" rx="24" ry="20" fill={`url(#cloudGrad${i})`} />
              <ellipse cx="110" cy="42" rx="20" ry="16" fill={`url(#cloudGrad${i})`} />
              <ellipse cx="70" cy="45" rx="30" ry="12" fill={`url(#cloudGrad${i})`} opacity="0.9" />
              {/* Cloud shadow highlight */}
              <ellipse cx="55" cy="28" rx="20" ry="10" fill="rgba(255,255,255,0.6)" />
            </svg>
          </div>
        ))}

        {/* ── DISTANT MOUNTAINS ── */}
        <div className="absolute left-0 right-0" style={{ top: "17%", zIndex: 1 }}>
          <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8ba8c9" />
                <stop offset="100%" stopColor="#6a8ca8" />
              </linearGradient>
            </defs>
            <path d="M0,80 L40,30 L80,55 L120,20 L160,45 L200,15 L240,40 L280,25 L320,50 L360,30 L400,55 L400,80 Z" fill="url(#mountainGrad)" opacity="0.7" />
            {/* Snow caps */}
            <path d="M115,25 L120,20 L125,25 L122,30 Z" fill="#fff" opacity="0.8" />
            <path d="M195,20 L200,15 L205,20 L202,25 Z" fill="#fff" opacity="0.8" />
            <path d="M275,30 L280,25 L285,30 L282,33 Z" fill="#fff" opacity="0.8" />
          </svg>
        </div>

        {/* ── REALISTIC TREES — back row (distant forest) ── */}
        {[
          { left: 5, top: 20, scale: 0.7, delay: 0 },
          { left: 14, top: 19, scale: 0.65, delay: -1 },
          { left: 22, top: 21, scale: 0.75, delay: -0.5 },
          { left: 31, top: 20, scale: 0.7, delay: -1.5 },
          { left: 40, top: 22, scale: 0.6, delay: -0.8 },
          { left: 60, top: 21, scale: 0.7, delay: -1.2 },
          { left: 69, top: 20, scale: 0.65, delay: -0.3 },
          { left: 77, top: 22, scale: 0.75, delay: -1.8 },
          { left: 86, top: 19, scale: 0.7, delay: -0.7 },
          { left: 94, top: 21, scale: 0.65, delay: -1.1 },
        ].map((t, i) => (
          <div
            key={`bt-${i}`}
            className="absolute"
            style={{
              left: `${t.left}%`,
              top: `${t.top}%`,
              transform: `translateX(-50%) scale(${t.scale})`,
              animation: `tree-sway ${4 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${t.delay}s`,
              transformOrigin: "bottom center",
              zIndex: 2,
            }}
          >
            <svg width="50" height="90" viewBox="0 0 50 90">
              <defs>
                <linearGradient id={`trunkBack${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4a2f18" />
                  <stop offset="50%" stopColor="#6b4422" />
                  <stop offset="100%" stopColor="#3a2510" />
                </linearGradient>
                <linearGradient id={`leafBack${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3a7a3a" />
                  <stop offset="100%" stopColor="#1a5c2a" />
                </linearGradient>
              </defs>
              {/* Trunk */}
              <rect x="22" y="60" width="6" height="28" fill={`url(#trunkBack${i})`} rx="1" />
              {/* Foliage — 3 layered clusters */}
              <ellipse cx="25" cy="60" rx="20" ry="14" fill={`url(#leafBack${i})`} />
              <ellipse cx="18" cy="48" rx="14" ry="12" fill={`url(#leafBack${i})`} />
              <ellipse cx="32" cy="48" rx="14" ry="12" fill={`url(#leafBack${i})`} />
              <ellipse cx="25" cy="38" rx="12" ry="11" fill={`url(#leafBack${i})`} />
              {/* Highlights */}
              <ellipse cx="22" cy="42" rx="5" ry="3" fill="#5a9a4a" opacity="0.6" />
              <ellipse cx="30" cy="52" rx="4" ry="2.5" fill="#5a9a4a" opacity="0.5" />
            </svg>
          </div>
        ))}

        {/* ── REALISTIC TREES — front row (closer, bigger) ── */}
        {[
          { left: 3, top: 27, scale: 1.1, delay: 0 },
          { left: 12, top: 29, scale: 0.95, delay: -1.3 },
          { left: 22, top: 28, scale: 1.05, delay: -0.6 },
          { left: 78, top: 28, scale: 1.05, delay: -1.7 },
          { left: 88, top: 29, scale: 1.0, delay: -0.9 },
          { left: 97, top: 27, scale: 1.1, delay: -2.1 },
        ].map((t, i) => (
          <div
            key={`ft-${i}`}
            className="absolute"
            style={{
              left: `${t.left}%`,
              top: `${t.top}%`,
              transform: `translateX(-50%) scale(${t.scale})`,
              animation: `tree-sway ${3.5 + (i % 2) * 0.8}s ease-in-out infinite`,
              animationDelay: `${t.delay}s`,
              transformOrigin: "bottom center",
              zIndex: 3,
            }}
          >
            <svg width="60" height="110" viewBox="0 0 60 110">
              <defs>
                <linearGradient id={`trunkFront${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#5a3820" />
                  <stop offset="40%" stopColor="#7a5230" />
                  <stop offset="70%" stopColor="#5a3820" />
                  <stop offset="100%" stopColor="#3a2210" />
                </linearGradient>
                <radialGradient id={`leafFront${i}`} cx="40%" cy="40%">
                  <stop offset="0%" stopColor="#5aa348" />
                  <stop offset="60%" stopColor="#388a30" />
                  <stop offset="100%" stopColor="#1c6622" />
                </radialGradient>
              </defs>
              {/* Trunk with texture lines */}
              <path d="M26,75 L26,105 L34,105 L34,75 Z" fill={`url(#trunkFront${i})`} />
              <line x1="28" y1="82" x2="28" y2="100" stroke="#3a2210" strokeWidth="0.8" opacity="0.5" />
              <line x1="31" y1="85" x2="31" y2="103" stroke="#3a2210" strokeWidth="0.6" opacity="0.4" />
              {/* Foliage — multiple overlapping clusters for depth */}
              <ellipse cx="30" cy="75" rx="26" ry="16" fill={`url(#leafFront${i})`} />
              <ellipse cx="18" cy="60" rx="16" ry="14" fill={`url(#leafFront${i})`} />
              <ellipse cx="42" cy="60" rx="16" ry="14" fill={`url(#leafFront${i})`} />
              <ellipse cx="30" cy="48" rx="16" ry="14" fill={`url(#leafFront${i})`} />
              <ellipse cx="22" cy="38" rx="12" ry="11" fill={`url(#leafFront${i})`} />
              <ellipse cx="38" cy="38" rx="12" ry="11" fill={`url(#leafFront${i})`} />
              <ellipse cx="30" cy="28" rx="11" ry="10" fill={`url(#leafFront${i})`} />
              {/* Highlights — sun catching leaves */}
              <ellipse cx="24" cy="35" rx="5" ry="4" fill="#7bc26a" opacity="0.7" />
              <ellipse cx="36" cy="50" rx="5" ry="3.5" fill="#7bc26a" opacity="0.6" />
              <ellipse cx="20" cy="55" rx="4" ry="3" fill="#7bc26a" opacity="0.5" />
            </svg>
          </div>
        ))}

        {/* ── VILLAGE CLEARING (grass) ── */}
        <div
          className="absolute rounded-[50%]"
          style={{
            left: "12%",
            top: "33%",
            width: "76%",
            height: "32%",
            background: "radial-gradient(ellipse at 50% 40%, #8fd460 0%, #7ec850 30%, #6ab04c 65%, #5a9e3e 100%)",
            boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.1)",
            zIndex: 2,
          }}
        />

        {/* ── GRASS TEXTURE BLADES ── */}
        {[
          { x: 20, y: 42 }, { x: 25, y: 58 }, { x: 35, y: 60 }, { x: 45, y: 42 },
          { x: 55, y: 58 }, { x: 65, y: 44 }, { x: 72, y: 56 }, { x: 80, y: 45 },
          { x: 30, y: 50 }, { x: 60, y: 50 }, { x: 70, y: 42 }, { x: 40, y: 56 },
        ].map((g, i) => (
          <div
            key={`grass-${i}`}
            className="absolute"
            style={{
              left: `${g.x}%`,
              top: `${g.y}%`,
              width: 2,
              height: 6,
              background: "linear-gradient(to top, #3a7a28, #5a9e3e)",
              borderRadius: "50% 50% 0 0",
              animation: `leaf-sway ${2 + (i % 3) * 0.5}s ease-in-out ${i * 0.2}s infinite`,
              transformOrigin: "bottom center",
              zIndex: 3,
            }}
          />
        ))}

        {/* ── CIRCULAR WOODEN FENCE — around the village clearing ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "12%",
            top: "33%",
            width: "76%",
            height: "32%",
            zIndex: 4,
          }}
        >
          {/* 24 fence posts distributed around the ellipse */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            // Ellipse positioning — only show fence on sides and bottom (hide top for visibility)
            const isTop = angle > Math.PI * 1.2 && angle < Math.PI * 1.8;
            if (isTop) return null;
            const cx = 50 + Math.cos(angle) * 48;
            const cy = 50 + Math.sin(angle) * 45;
            // Tilt post based on position on circle
            const tilt = Math.cos(angle) * 8 + (Math.sin(i * 1.7) * 3);
            const height = 26 + Math.sin(i) * 3;
            return (
              <div
                key={`fence-${i}`}
                className="absolute"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  transform: `translate(-50%, -100%)`,
                  animation: "fence-sway 4s ease-in-out infinite",
                  animationDelay: `${i * 0.15}s`,
                  ["--r" as any]: `${tilt}deg`,
                }}
              >
                <svg width="10" height={height} viewBox={`0 0 10 ${height}`}>
                  <defs>
                    <linearGradient id={`postGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#5a3a18" />
                      <stop offset="30%" stopColor="#8B6914" />
                      <stop offset="70%" stopColor="#6b4a0a" />
                      <stop offset="100%" stopColor="#3a2208" />
                    </linearGradient>
                  </defs>
                  {/* Post body */}
                  <path
                    d={`M1,${height} L1,6 L5,0 L9,6 L9,${height} Z`}
                    fill={`url(#postGrad${i})`}
                  />
                  {/* Wood grain lines */}
                  <line x1="3" y1="8" x2="3" y2={height - 2} stroke="#3a2208" strokeWidth="0.4" opacity="0.5" />
                  <line x1="6" y1="10" x2="6" y2={height - 3} stroke="#3a2208" strokeWidth="0.3" opacity="0.4" />
                  {/* Top highlight */}
                  <path d={`M1,6 L5,0 L9,6 L5,4 Z`} fill="#a88044" opacity="0.7" />
                </svg>
              </div>
            );
          })}
          {/* Horizontal fence rails connecting posts (only bottom arc) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="railGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B6914" />
                <stop offset="100%" stopColor="#5a3a10" />
              </linearGradient>
            </defs>
            {/* Top rail */}
            <path
              d="M 2,55 A 48,42 0 0,0 98,55"
              fill="none"
              stroke="url(#railGrad)"
              strokeWidth="1.2"
              opacity="0.85"
            />
            {/* Bottom rail */}
            <path
              d="M 2,62 A 48,42 0 0,0 98,62"
              fill="none"
              stroke="url(#railGrad)"
              strokeWidth="1.2"
              opacity="0.85"
            />
          </svg>
        </div>

        {/* ── FLOWERS inside clearing ── */}
        {[
          { x: 25, y: 42, color: "#ff6b6b" }, { x: 32, y: 54, color: "#ffd93d" },
          { x: 45, y: 46, color: "#fff" }, { x: 52, y: 52, color: "#ff6b9d" },
          { x: 60, y: 44, color: "#fff" }, { x: 68, y: 50, color: "#ffd93d" },
          { x: 38, y: 48, color: "#ff6b6b" }, { x: 72, y: 45, color: "#ff6b9d" },
        ].map((f, i) => (
          <div
            key={`flower-${i}`}
            className="absolute"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              zIndex: 5,
              animation: `sparkle-flower ${2 + i * 0.3}s ease-in-out ${i * 0.4}s infinite`,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="2.5" r="1.5" fill={f.color} />
              <circle cx="7.5" cy="5" r="1.5" fill={f.color} />
              <circle cx="5" cy="7.5" r="1.5" fill={f.color} />
              <circle cx="2.5" cy="5" r="1.5" fill={f.color} />
              <circle cx="5" cy="5" r="1.2" fill="#ffd93d" />
            </svg>
          </div>
        ))}

        {/* ── REALISTIC LAKE with animated water ── */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: "3%",
            top: "68%",
            width: "94%",
            height: "20%",
            borderRadius: "48% 52% 46% 54% / 40% 60% 50% 50%",
            background: "linear-gradient(180deg, #4ba3d4 0%, #2d8bc9 30%, #1e7ab8 60%, #1565a0 100%)",
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.2), inset 0 -4px 8px rgba(20,80,140,0.3)",
            zIndex: 5,
          }}
        >
          {/* Sandy shore along top edge */}
          <div
            className="absolute left-0 right-0 -top-1 h-[14px]"
            style={{
              background: "linear-gradient(180deg, #c4a46a 0%, #a88044 60%, transparent 100%)",
              borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            }}
          />
          {/* Small rocks on shore */}
          {[12, 28, 42, 58, 72, 88].map((x, i) => (
            <div
              key={`rock-${i}`}
              className="absolute"
              style={{
                left: `${x}%`,
                top: i % 2 === 0 ? "1px" : "3px",
                width: 4 + (i % 3),
                height: 3 + (i % 2),
                background: "radial-gradient(ellipse at 30% 30%, #a8a098, #6a6258)",
                borderRadius: "50%",
                boxShadow: "0 1px 0 rgba(0,0,0,0.3)",
              }}
            />
          ))}
          {/* Lake reflections / shimmer lines — horizontally sweeping */}
          <div
            className="absolute left-0 right-0 h-[2px]"
            style={{
              top: "25%",
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
              animation: "water-ripple-1 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute left-0 right-0 h-[1.5px]"
            style={{
              top: "45%",
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              animation: "water-ripple-2 8s ease-in-out 1.5s infinite",
            }}
          />
          <div
            className="absolute left-0 right-0 h-[1px]"
            style={{
              top: "65%",
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
              animation: "water-ripple-1 10s ease-in-out 3s infinite",
            }}
          />
          {/* Static shine spots */}
          <div
            className="absolute top-[20%] left-[15%] w-[20%] h-[2px] rounded-full"
            style={{ background: "rgba(255,255,255,0.4)", animation: "water-shine 3s ease-in-out infinite" }}
          />
          <div
            className="absolute top-[55%] left-[55%] w-[15%] h-[2px] rounded-full"
            style={{ background: "rgba(255,255,255,0.3)", animation: "water-shine 4s ease-in-out 1s infinite" }}
          />
          {/* Lily pad */}
          <div className="absolute top-[35%] left-[20%]" style={{ zIndex: 6 }}>
            <svg width="18" height="12" viewBox="0 0 18 12">
              <ellipse cx="9" cy="6" rx="8" ry="4" fill="#2d7a28" opacity="0.85" />
              <path d="M 9,6 L 1,6" stroke="#1a5c2a" strokeWidth="0.8" />
              <circle cx="4" cy="5" r="1.2" fill="#ff6b9d" opacity="0.8" />
            </svg>
          </div>
          <div className="absolute top-[50%] left-[75%]" style={{ zIndex: 6 }}>
            <svg width="14" height="10" viewBox="0 0 14 10">
              <ellipse cx="7" cy="5" rx="6" ry="3" fill="#2d7a28" opacity="0.8" />
            </svg>
          </div>
        </div>

        {/* Dock */}
        <div className="absolute" style={{ left: "52%", top: "72%", zIndex: 6 }}>
          <div className="w-[50px] h-[8px] rounded-[2px]" style={{ background: "#8B6914", transform: "perspective(100px) rotateX(15deg)" }} />
          <div className="w-[50px] h-[8px] rounded-[2px] mt-[3px]" style={{ background: "#7a5a10" }} />
          <div className="absolute -left-[3px] top-[2px] w-[5px] h-[20px] rounded-b-sm" style={{ background: "#6b4a0a" }} />
          <div className="absolute -right-[3px] top-[2px] w-[5px] h-[20px] rounded-b-sm" style={{ background: "#6b4a0a" }} />
        </div>

        {/* ── TOP UI ── */}
        <div className="absolute top-0 left-0 right-0 z-30" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
          <div className="flex items-center justify-between px-3">
            {/* Coins */}
            <div className="flex items-center gap-1.5">
              <img src="/images/coin-icon.png" alt="coin" width={32} height={32} style={{ objectFit: "contain" }} />
              <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: "rgba(180,140,80,0.7)" }}>
                <span className="text-white text-[15px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
                  {coinBalance.toLocaleString()}
                </span>
                <span className="text-[#4CAF50] text-[14px] font-bold">+</span>
              </div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1">
              <div style={{ width: 28, height: 28, clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)", background: "#FFD700" }} />
              <span className="text-white text-[15px] font-bold" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                {profile?.totalStars ?? 0}
              </span>
            </div>

            {/* Shields */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: "rgba(150,200,240,0.5)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-white text-[13px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
                {profile?.shieldActive ? "1" : "0"}
              </span>
            </div>
          </div>
        </div>

        {/* ── WELCOME BANNER ── */}
        {showWelcome && !loading && (
          <div className="absolute left-0 right-0 z-20 flex flex-col items-center" style={{ top: "30%", animation: "banner-pop 0.5s ease-out" }}>
            <div className="relative px-8 py-3 mb-4" style={{ background: "linear-gradient(180deg, #e53935, #c62828)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
              <div className="absolute -left-3 top-0 w-3 h-full" style={{ background: "#b71c1c", borderRadius: "4px 0 0 4px" }} />
              <div className="absolute -right-3 top-0 w-3 h-full" style={{ background: "#b71c1c", borderRadius: "0 4px 4px 0" }} />
              <span className="text-white text-[22px] font-black uppercase tracking-wider" style={{ fontFamily: "var(--font-outfit)", textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
                {village?.name || "Your Village"}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white text-[22px] font-black italic" style={{ fontFamily: "var(--font-outfit)", textShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}>
                Welcome Friend!
              </span>
            </div>
            <span className="text-white text-[17px] font-bold" style={{ fontFamily: "var(--font-outfit)", textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>
              Click on the Build button to start
            </span>
          </div>
        )}

        {/* ── BOTTOM CARDS ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 70px)" }}>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex gap-2 px-2 overflow-x-auto scrollbar-hide">
              {buildings.map((b, i) => (
                <div
                  key={b.id}
                  onClick={() => handleUpgrade(b)}
                  className="relative shrink-0 w-[85px] rounded-[12px] overflow-hidden cursor-pointer active:scale-[0.95] transition-transform"
                  style={{
                    background: "linear-gradient(180deg, #f5e6c8, #e8d4a8)",
                    border: b.complete ? "2px solid #FFD700" : "2px solid #c4a46a",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                    opacity: upgrading === b.id ? 0.6 : 1,
                  }}
                >
                  {/* Stars — colored only for earned stars */}
                  <StarRow current={b.currentStars} total={4} />

                  {/* Card image — always show preview, dim if not yet purchased */}
                  <div className="h-[60px] flex items-center justify-center">
                    {b.previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.previewImage}
                        alt={b.name}
                        className="w-[50px] h-[50px] rounded-[8px] object-cover"
                        style={{
                          opacity: b.currentStars > 0 ? 1 : 0.5,
                          filter: b.currentStars > 0 ? "none" : "grayscale(40%)",
                        }}
                      />
                    ) : (
                      <div className="w-[50px] h-[50px] rounded-[8px]" style={{ background: "rgba(180,150,100,0.2)" }} />
                    )}
                  </div>

                  {/* Price or complete */}
                  <div className="flex items-center justify-center gap-1 pb-1.5 pt-1">
                    {b.complete ? (
                      <span className="text-[11px] font-bold" style={{ color: "#2d7a28", fontFamily: "var(--font-outfit)" }}>MAX</span>
                    ) : (
                      <>
                        <img src="/images/coin-icon.png" alt="coin" width={14} height={14} style={{ objectFit: "contain" }} />
                        <span className="text-[12px] font-bold" style={{ color: "#5a4a2a", fontFamily: "var(--font-outfit)" }}>
                          {formatCoins(b.nextCost || 0)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Hand pointer on first card */}
                  {i === 0 && showHand && showWelcome && (
                    <div className="absolute -bottom-2 -left-2 text-[36px] z-30" style={{ animation: "hand-bounce 1s ease-in-out infinite" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="#FFD700" stroke="#5a4a2a" strokeWidth="1">
                        <path d="M12 2l-1 9H7l5 11 1-9h4L12 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
    </AuthGuard>
  );
}
