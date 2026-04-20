"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import CloudReveal from "@/components/CloudReveal";
import BattleAnimation from "@/components/BattleAnimation";
import { apiFetch } from "@/services/api";
import { getCoinBalance, setCoinBalance } from "@/services/balance";
import { getMe } from "@/services/auth";

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

// Building positions on the village scene (viewport %)
const BUILDING_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 25, y: 56 },  // front-left
  2: { x: 50, y: 60 },  // front-center
  3: { x: 75, y: 56 },  // front-right
  4: { x: 35, y: 44 },  // back-left
  5: { x: 65, y: 44 },  // back-right
};

const BUILDING_SIZE = 100; // px, on the village scene

// ─────────────────────────────────────────────
// Build animation — dust puffs, tools, sparkles, progress bar
// ─────────────────────────────────────────────
function BuildAnimation({ x, y, size }: { x: number; y: number; size: number }) {
  const dustRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const W = 160, H = 160, CX = 80, CY = 88;
    const dustCanvas = dustRef.current;
    const sparkCanvas = sparkRef.current;
    if (!dustCanvas || !sparkCanvas) return;
    const dCtx = dustCanvas.getContext("2d")!;
    const sCtx = sparkCanvas.getContext("2d")!;

    const dust: any[] = [];
    const debris: any[] = [];
    const sparks: any[] = [];
    const dustColors: number[][] = [
      [255, 252, 245], [240, 235, 220], [250, 248, 242],
      [230, 225, 215], [245, 242, 230],
    ];

    const spawnDust = () => {
      const a = Math.random() * Math.PI * 2;
      const s = 0.3 + Math.random() * 0.6;
      dust.push({
        x: CX + (Math.random() - 0.5) * 20,
        y: CY + (Math.random() - 0.5) * 15,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.35,
        r: 4 + Math.random() * 9, maxR: 20 + Math.random() * 28,
        life: 0, maxLife: 70 + Math.random() * 50,
        col: dustColors[Math.floor(Math.random() * dustColors.length)],
      });
    };
    const spawnDebris = () => {
      const a = Math.random() * Math.PI * 2;
      const s = 0.8 + Math.random() * 1.8;
      debris.push({
        x: CX + (Math.random() - 0.5) * 15,
        y: CY + (Math.random() - 0.5) * 10,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
        gravity: 0.06 + Math.random() * 0.05,
        size: 1 + Math.random() * 2, life: 0,
        maxLife: 30 + Math.random() * 30,
        color: ["#c8a86e", "#b8924a", "#d4b880", "#aaaaaa", "#c0b090"][Math.floor(Math.random() * 5)],
      });
    };
    const spawnSpark = () => {
      const a = Math.random() * Math.PI * 2;
      const d = 5 + Math.random() * 55;
      sparks.push({
        x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d,
        maxSize: 2.5 + Math.random() * 5, life: 0,
        speed: 0.04 + Math.random() * 0.05,
        hue: [55, 42, 200, 320, 0, 170][Math.floor(Math.random() * 6)],
      });
    };

    for (let i = 0; i < 6; i++) spawnDust();
    const dustInt = setInterval(spawnDust, 80);
    const debrisInt = setInterval(spawnDebris, 60);
    const sparkInt = setInterval(spawnSpark, 75);

    let raf = 0;
    const loop = () => {
      // DUST
      dCtx.clearRect(0, 0, W, H);
      dust.sort((a, b) => b.life - a.life);
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.985; p.vy *= 0.985; p.life++;
        const t = p.life / p.maxLife;
        const eased = 1 - (1 - t) * (1 - t);
        const r = p.r + (p.maxR - p.r) * eased;
        let alpha = t < 0.12 ? (t / 0.12) * 0.82 : t < 0.6 ? 0.82 : 0.82 * (1 - (t - 0.6) / 0.4);
        const [cr, cg, cb] = p.col;
        const g = dCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
        g.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha * 0.75})`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        dCtx.beginPath(); dCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
        dCtx.fillStyle = g; dCtx.fill();
        if (p.life >= p.maxLife) dust.splice(i, 1);
      }
      // DEBRIS
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.x += d.vx; d.y += d.vy; d.vy += d.gravity; d.vx *= 0.97; d.life++;
        const t = d.life / d.maxLife;
        const alpha = t < 0.2 ? t / 0.2 : 1 - t;
        const hex = d.color;
        const big = parseInt(hex.slice(1), 16);
        const dr = (big >> 16) & 255, dg = (big >> 8) & 255, db = big & 255;
        dCtx.beginPath(); dCtx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        dCtx.fillStyle = `rgba(${dr},${dg},${db},${alpha})`;
        dCtx.fill();
        if (d.life >= d.maxLife) debris.splice(i, 1);
      }
      // SPARKS
      sCtx.clearRect(0, 0, W, H);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += s.speed;
        if (s.life >= 1) { sparks.splice(i, 1); continue; }
        const alpha = s.life < 0.4 ? s.life / 0.4 : 1 - (s.life - 0.4) / 0.6;
        const ss = s.maxSize * Math.sin(s.life * Math.PI);
        sCtx.save(); sCtx.globalAlpha = alpha; sCtx.translate(s.x, s.y);
        const g = sCtx.createRadialGradient(0, 0, 0, 0, 0, ss * 3);
        g.addColorStop(0, `hsla(${s.hue},100%,100%,${alpha})`);
        g.addColorStop(0.35, `hsla(${s.hue},100%,92%,${alpha * 0.5})`);
        g.addColorStop(1, `hsla(${s.hue},80%,85%,0)`);
        sCtx.beginPath(); sCtx.arc(0, 0, ss * 3, 0, Math.PI * 2);
        sCtx.fillStyle = g; sCtx.fill();
        sCtx.beginPath();
        for (let k = 0; k < 8; k++) {
          const r = k % 2 === 0 ? ss : ss * 0.1;
          const a = (k * Math.PI) / 4;
          if (k === 0) sCtx.moveTo(r * Math.sin(a), -r * Math.cos(a));
          else sCtx.lineTo(r * Math.sin(a), -r * Math.cos(a));
        }
        sCtx.closePath();
        sCtx.shadowColor = `hsl(${s.hue},100%,96%)`;
        sCtx.shadowBlur = ss * 4;
        sCtx.fillStyle = "#fff"; sCtx.fill();
        sCtx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(dustInt);
      clearInterval(debrisInt);
      clearInterval(sparkInt);
    };
  }, []);

  const BOX = size * 2; // scene box for animation (larger than building for particle spread)
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: BOX,
        height: BOX,
        transform: "translate(-50%, -60%)",
        zIndex: 15,
      }}
    >
      <div style={{ position: "relative", width: BOX, height: BOX }}>
        {/* Canvases */}
        <canvas ref={dustRef} width={160} height={160}
          style={{ position: "absolute", inset: 0, width: BOX, height: BOX, zIndex: 2 }} />
        <canvas ref={sparkRef} width={160} height={160}
          style={{ position: "absolute", inset: 0, width: BOX, height: BOX, zIndex: 8 }} />
        {/* Tools */}
        {[
          { e: "⚙️", rx: 2, ry: -32, delay: 0.35, z: 1 },
          { e: "🪚", rx: -30, ry: 6, delay: 0, z: 9 },
          { e: "🪵", rx: 26, ry: -24, delay: 0.17, z: 9 },
          { e: "🔧", rx: 28, ry: 22, delay: 0.52, z: 9 },
        ].map((t, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: "50%", top: "52%",
              fontSize: BOX * 0.22,
              filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.5))",
              transform: "translate(-50%, -50%) scale(0)",
              opacity: 0,
              zIndex: t.z,
              animation: `tool-pop 1.4s cubic-bezier(.22,1,.36,1) ${t.delay}s infinite`,
              ["--rx" as any]: `${t.rx}px`,
              ["--ry" as any]: `${t.ry}px`,
            }}
          >
            {t.e}
          </span>
        ))}
        {/* Progress bar */}
        <div style={{
          position: "absolute",
          bottom: -2,
          left: "50%",
          transform: "translateX(-50%)",
          width: BOX * 0.75,
        }}>
          <div style={{
            background: "rgba(0,0,0,0.35)",
            borderRadius: 8,
            height: 10,
            border: "1.5px solid rgba(0,0,0,0.35)",
            overflow: "hidden",
            padding: 1.5,
          }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, #F5C800, #FFE000, #FFD600)",
              borderRadius: 5,
              width: "0%",
              animation: "build-fill 2.8s ease-in-out forwards",
              position: "relative",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
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
  const [animatingBuildingPos, setAnimatingBuildingPos] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showHand, setShowHand] = useState(true);
  const [profile, setProfile] = useState<{ totalStars: number; shieldActive: boolean; currentLevel: number; cardCount: number } | null>(null);
  // Intro cloud reveal — plays once per page entry then unmounts
  const [showReveal, setShowReveal] = useState(true);
  // Exit cloud-cover — when set, plays the reverse animation then navigates
  const [exitTarget, setExitTarget] = useState<string | null>(null);
  // Insufficient coins notification
  const [showCoinAlert, setShowCoinAlert] = useState(false);
  // Battle animation — shown when user gets attacked
  const [showBattleAnim, setShowBattleAnim] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Background music — loops while the user is on the village page,
  // stops on navigation away. Browsers block autoplay without a prior
  // user gesture, so if the initial play() is rejected we queue a
  // one-shot listener that starts playback on the first tap/click.
  const villageMusicRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = new Audio("/audio/village-theme.mp3");
    villageMusicRef.current = audio;
    audio.loop = true;
    audio.volume = 0.5;
    let unlocked = false;
    const unlockAndPlay = () => {
      if (unlocked) return;
      unlocked = true;
      audio.play().catch(() => {});
      window.removeEventListener("pointerdown", unlockAndPlay);
      window.removeEventListener("keydown", unlockAndPlay);
      window.removeEventListener("touchstart", unlockAndPlay);
    };
    audio.play().catch(() => {
      // Autoplay blocked — wait for first user interaction
      window.addEventListener("pointerdown", unlockAndPlay, { once: true });
      window.addEventListener("keydown", unlockAndPlay, { once: true });
      window.addEventListener("touchstart", unlockAndPlay, { once: true });
    });
    return () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener("pointerdown", unlockAndPlay);
      window.removeEventListener("keydown", unlockAndPlay);
      window.removeEventListener("touchstart", unlockAndPlay);
    };
  }, []);

  // Fetch village data
  useEffect(() => {
    setCoinBalanceState(getCoinBalance());
    Promise.all([
      apiFetch("/village/current").catch(() => null),
      apiFetch("/village/profile").catch(() => null),
    ]).then(([vData, pData]: any[]) => {
      if (vData?.success) {
        setVillage(vData.village);
        // If user has already built anything → hide welcome banner immediately
        const hasBuilt = vData.village?.buildings?.some((b: Building) => b.currentStars > 0);
        if (hasBuilt) setShowWelcome(false);
      }
      if (pData?.success) setProfile(pData.profile);
      setLoading(false);
    });
  }, []);

  // Auto-hide welcome banner after 5 seconds
  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(t);
  }, [showWelcome]);

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

    if (coinBalance < building.nextCost) {
      setShowCoinAlert(true);
      setTimeout(() => setShowCoinAlert(false), 4000);
      return;
    }

    setUpgrading(building.id);
    setAnimatingBuildingPos(building.position);
    // Don't allow building during battle animation
    if (showBattleAnim) return;
    // Play building construction sound — duck music volume during build
    try {
      if (villageMusicRef.current) villageMusicRef.current.volume = 0.15;
      const sfx = new Audio("/audio/building.mp3");
      sfx.volume = 1.0;
      sfx.play().catch(() => {});
      sfx.onended = () => {
        if (villageMusicRef.current) villageMusicRef.current.volume = 0.5;
      };
    } catch {}
    // Optimistic local coin deduction for snappy UI
    const cost = building.nextCost;
    const optimisticBalance = getCoinBalance() - cost;
    setCoinBalance(optimisticBalance);
    setCoinBalanceState(optimisticBalance);

    // Minimum animation duration so players see the build even when API is fast
    const animationTime = new Promise((r) => setTimeout(r, 2800));

    try {
      const apiCall = apiFetch("/village/upgrade", {
        method: "POST",
        body: JSON.stringify({ buildingId: building.id }),
      });
      // Wait for BOTH animation and API call to complete
      const [res] = (await Promise.all([apiCall, animationTime])) as any[];
      if (res?.success) {
        // Refresh village, profile, and user data (syncs real coin balance)
        const [vData, pData] = await Promise.all([
          apiFetch("/village/current").catch(() => null),
          apiFetch("/village/profile").catch(() => null),
          getMe().catch(() => null),
        ]) as any[];
        if (vData?.success) setVillage(vData.village);
        if (pData?.success) setProfile(pData.profile);
        setCoinBalanceState(getCoinBalance());
      } else {
        // Rollback optimistic deduction
        setCoinBalance(optimisticBalance + cost);
        setCoinBalanceState(optimisticBalance + cost);
      }
    } catch {
      // Still wait for animation to finish for UX
      await animationTime;
      // Rollback optimistic deduction on error
      setCoinBalance(optimisticBalance + cost);
      setCoinBalanceState(optimisticBalance + cost);
    }
    setAnimatingBuildingPos(null);
    setUpgrading(null);
  };

  const formatCoins = (n: number) => {
    if (n >= 1000) return `${Math.floor(n / 1000)}K`;
    return String(n);
  };

  const buildings = village?.buildings || [];

  return (
    <AuthGuard>
      {showReveal && <CloudReveal onDone={() => setShowReveal(false)} />}
      {exitTarget && (
        <CloudReveal
          mode="exit"
          animMs={2200}
          onDone={() => router.push(exitTarget)}
        />
      )}

      {/* Battle animation — when user gets attacked */}
      {showBattleAnim && !animatingBuildingPos && (
        <BattleAnimation onDone={() => setShowBattleAnim(false)} />
      )}

      {/* Insufficient coins notification */}
      {showCoinAlert && (
        <div
          className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-[14px] shadow-lg"
          style={{
            background: "#1C2539",
            border: "1px solid rgba(255,255,255,0.1)",
            animation: "fade-in 0.2s ease-out",
          }}
        >
          <p className="text-[14px] font-bold text-center" style={{ color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}>
            Not enough coins!
          </p>
          <p className="text-[12px] text-center mt-1" style={{ color: "#94A3B8", fontFamily: "var(--font-dm-sans)" }}>
            Invite a friend to earn more coins
          </p>
        </div>
      )}
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
        @keyframes banner-fade { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.9); } }
        @keyframes tool-pop {
          0%, 3% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          22% { transform: translate(calc(-50% + var(--rx)*1.25), calc(-50% + var(--ry)*1.25)) scale(1.4) rotate(14deg); opacity: 1; }
          34% { transform: translate(calc(-50% + var(--rx)), calc(-50% + var(--ry))) scale(1) rotate(-3deg); opacity: 1; }
          44% { transform: translate(calc(-50% + var(--rx)), calc(-50% + var(--ry) - 6px)) scale(1.08) rotate(3deg); opacity: 1; }
          54% { transform: translate(calc(-50% + var(--rx)), calc(-50% + var(--ry))) scale(1) rotate(0deg); opacity: 1; }
          72% { transform: translate(-50%, -50%) scale(0.04) rotate(-25deg); opacity: 0.15; }
          74%, 100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        }
        @keyframes build-fill { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes building-appear {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          60% { transform: translate(-50%, -50%) scale(1.15); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
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


        {/* ── DISTANT BACKGROUND TREES — below mountains, small forest line ── */}
        {(() => {
          const seed = (n: number) => {
            const x = Math.sin(n * 43.1337) * 91733.919;
            return x - Math.floor(x);
          };
          type BgKind = "pine" | "broadleaf" | "tall";
          const kinds: BgKind[] = ["pine", "broadleaf", "tall"];
          const bgTrees: Array<{ left: number; top: number; scale: number; kind: BgKind; hueShift: number; delay: number }> = [];
          // 18 trees spread across the full width, at y just below mountains
          const N = 18;
          for (let i = 0; i < N; i++) {
            const baseX = (i / (N - 1)) * 100;
            const xJitter = (seed(i) - 0.5) * 4;
            const yJitter = (seed(i + 50) - 0.5) * 2;
            const left = baseX + xJitter;
            // top: 25-28% — below mountain bases (mountains end around 27% on mobile)
            const top = 26.5 + yJitter;
            // Very small — distant horizon
            const scale = 0.28 + seed(i + 100) * 0.18;
            const kind = kinds[Math.floor(seed(i + 200) * kinds.length)];
            // Slight blue-green tint for atmospheric perspective
            const hueShift = -10 + seed(i + 300) * 15;
            bgTrees.push({ left, top, scale, kind, hueShift, delay: -(i * 0.13) });
          }
          return bgTrees;
        })().map((t, i) => {
          const leafDark = `hsl(${130 + t.hueShift}, 30%, 28%)`;
          const leafMid = `hsl(${125 + t.hueShift}, 35%, 38%)`;
          const trunkColor = `hsl(25, 35%, 25%)`;
          return (
            <div
              key={`bgt-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${t.left}%`,
                top: `${t.top}%`,
                transform: `translateX(-50%) scale(${t.scale})`,
                animation: `tree-sway ${5 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${t.delay}s`,
                transformOrigin: "bottom center",
                zIndex: 1,
                opacity: 0.85,
                filter: "blur(0.3px)",
              }}
            >
              {t.kind === "pine" && (
                <svg width="40" height="80" viewBox="0 0 40 80">
                  <rect x="17" y="58" width="6" height="18" fill={trunkColor} rx="1" />
                  <path d="M20,8 L8,34 L32,34 Z" fill={leafDark} />
                  <path d="M20,26 L5,54 L35,54 Z" fill={leafDark} />
                  <path d="M20,44 L3,68 L37,68 Z" fill={leafMid} />
                </svg>
              )}
              {t.kind === "tall" && (
                <svg width="28" height="82" viewBox="0 0 28 82">
                  <rect x="11" y="64" width="5" height="16" fill={trunkColor} rx="1" />
                  <path d="M14,6 L6,28 L22,28 Z" fill={leafDark} />
                  <path d="M14,22 L5,46 L23,46 Z" fill={leafDark} />
                  <path d="M14,40 L4,66 L24,66 Z" fill={leafMid} />
                </svg>
              )}
              {t.kind === "broadleaf" && (
                <svg width="42" height="72" viewBox="0 0 42 72">
                  <rect x="18" y="50" width="5" height="20" fill={trunkColor} rx="1" />
                  <ellipse cx="21" cy="48" rx="18" ry="12" fill={leafDark} />
                  <ellipse cx="14" cy="36" rx="10" ry="9" fill={leafDark} />
                  <ellipse cx="28" cy="36" rx="10" ry="9" fill={leafDark} />
                  <ellipse cx="21" cy="28" rx="11" ry="10" fill={leafMid} />
                </svg>
              )}
            </div>
          );
        })}

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


        {/* ── FLOWERS inside clearing ── */}
        {[
          { x: 28, y: 42, color: "#ff6b6b" }, { x: 34, y: 54, color: "#ffd93d" },
          { x: 42, y: 46, color: "#fff" }, { x: 50, y: 54, color: "#ff6b9d" },
          { x: 58, y: 44, color: "#fff" }, { x: 66, y: 52, color: "#ffd93d" },
          { x: 38, y: 58, color: "#ff6b6b" }, { x: 72, y: 46, color: "#ff6b9d" },
          { x: 30, y: 58, color: "#fff" }, { x: 62, y: 58, color: "#ffd93d" },
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

        {/* ── BUILDINGS on the scene ── */}
        {village?.buildings.map((b) => {
          const pos = BUILDING_POSITIONS[b.position];
          if (!pos) return null;
          const hasBuilding = b.currentStars > 0 && b.currentImage;
          if (!hasBuilding) return null;
          return (
            <div
              key={`bld-${b.id}`}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 6,
                animation: "building-appear 0.6s ease-out",
                filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.25))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.currentImage}
                alt={b.name}
                width={BUILDING_SIZE}
                height={BUILDING_SIZE}
                style={{ objectFit: "contain", width: BUILDING_SIZE, height: BUILDING_SIZE }}
              />
            </div>
          );
        })}

        {/* ── BUILD ANIMATION overlay (shown at target building position) ── */}
        {animatingBuildingPos !== null && BUILDING_POSITIONS[animatingBuildingPos] && (
          <BuildAnimation
            x={BUILDING_POSITIONS[animatingBuildingPos].x}
            y={BUILDING_POSITIONS[animatingBuildingPos].y}
            size={BUILDING_SIZE}
          />
        )}

        {/* ── TOP UI ── */}
        <div className="absolute top-0 left-0 right-0 z-30" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
          <div className="flex items-center justify-between px-3">
            {/* Coins — icon inside pill */}
            <div
              className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full"
              style={{ background: "rgba(180,140,80,0.7)" }}
            >
              <img
                src="/images/coin-icon.png"
                alt="coin"
                width={28}
                height={28}
                style={{ objectFit: "contain" }}
              />
              <span
                className="text-white text-[15px] font-bold"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {coinBalance.toLocaleString()}
              </span>
            </div>

            {/* Stars — center */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: "rgba(180,140,80,0.7)" }}>
              <div style={{ width: 24, height: 24, clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)", background: "#FFD700" }} />
              <span className="text-white text-[15px] font-bold" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                {village?.totalStars ?? 0}
              </span>
            </div>

            {/* Shields (top) + Swords (bottom) — stacked */}
            <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-[14px]" style={{ background: "rgba(180,140,80,0.7)" }}>
              {/* Shields row */}
              <div className="flex items-center gap-0">
                {[0, 1, 2].map((i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={`sh-${i}`} src="/images/shield.png" alt="" width={24} height={24}
                    style={{ objectFit: "contain", opacity: i < (profile?.shieldActive ? 1 : 0) ? 1 : 0.2 }} />
                ))}
              </div>
              {/* Swords row */}
              <div className="flex items-center gap-0">
                {[0, 1, 2].map((i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={`sw-${i}`} src="/images/sword.png" alt="" width={24} height={24}
                    style={{ objectFit: "contain", opacity: i < (profile?.cardCount ?? 0) ? 1 : 0.2 }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── WELCOME BANNER — village name only, auto-fades in 5s ── */}
        {showWelcome && !loading && village?.name && (
          <div
            className="absolute left-0 right-0 z-20 flex flex-col items-center"
            style={{
              top: "28%",
              animation: "banner-pop 0.5s ease-out, banner-fade 1s ease-in 4s forwards",
            }}
          >
            <div
              className="relative px-8 py-3"
              style={{
                background: "linear-gradient(180deg, #e53935, #c62828)",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              <div className="absolute -left-3 top-0 w-3 h-full" style={{ background: "#b71c1c", borderRadius: "4px 0 0 4px" }} />
              <div className="absolute -right-3 top-0 w-3 h-full" style={{ background: "#b71c1c", borderRadius: "0 4px 4px 0" }} />
              <span
                className="text-white text-[22px] font-black uppercase tracking-wider"
                style={{ fontFamily: "var(--font-outfit)", textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}
              >
                {village.name}
              </span>
            </div>
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
                    let dest: string | null = null;
                    if (idx === 0) dest = "/home";
                    if (idx === 1) dest = "/games";
                    if (idx === 3) dest = "/scan";
                    if (dest && !exitTarget) setExitTarget(dest);
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
