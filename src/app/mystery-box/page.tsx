"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ───────── FACE DATA ───────── */

const FACE_TRANSFORMS = [
  "translateZ(100px)",
  "rotateY(90deg) translateZ(100px)",
  "rotateY(180deg) translateZ(100px)",
  "rotateY(-90deg) translateZ(100px)",
];

const FACE_COLORS = [
  { glow: "rgba(0,200,255,0.3)", color: "#00C8FF", symbol: "₾", symbolColor: "#E8C840" },
  { glow: "rgba(232,200,64,0.3)", color: "#E8C840", symbol: "?", symbolColor: "#E8C840" },
  { glow: "rgba(168,85,247,0.3)", color: "#A855F7", symbol: "★", symbolColor: "#A855F7" },
  { glow: "rgba(0,232,143,0.3)", color: "#00E88F", symbol: "₾", symbolColor: "#00E88F" },
];

/* ───────── CUBE FACE ───────── */

function CubeFace({ idx, transform, isMain = true }: { idx: number; transform: string; isMain?: boolean }) {
  const f = FACE_COLORS[idx];
  const isFront = idx === 0 && isMain;
  return (
    <div
      className="absolute w-[200px] h-[200px] rounded-[20px] flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #1A1A1A, #2D2D2D)",
        border: "2px solid #3A3A3A",
        transform,
        backfaceVisibility: "hidden",
        boxShadow: `0 0 30px ${f.glow}, inset 0 0 20px ${f.glow.replace("0.3", "0.1")}`,
      }}
    >
      {/* Inner border */}
      <div className="absolute inset-2 rounded-[16px] border opacity-30" style={{ borderColor: f.color }} />
      {/* Glow strips */}
      <div className="absolute top-3 left-3 w-2 h-12 rounded-full opacity-40" style={{ background: f.color }} />
      <div className="absolute bottom-3 right-3 w-2 h-12 rounded-full opacity-40" style={{ background: f.color }} />

      {isFront && (
        <>
          <div className="absolute top-0 left-[20px] right-[20px] h-[1px] rounded-full pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.08) 70%, transparent)", zIndex: 5 }} />
          <div className="absolute left-0 top-[20px] bottom-[20px] w-[1px] rounded-full pointer-events-none" style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.06) 70%, transparent)", zIndex: 5 }} />
          <div className="absolute inset-0 rounded-[20px] pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 40%, transparent 100%)", zIndex: 4 }} />
        </>
      )}

      <span
        className="font-black select-none text-[72px]"
        style={{ fontFamily: "var(--font-outfit)", color: f.symbolColor, textShadow: `0 0 30px ${f.glow}`, opacity: isMain ? 1 : 0.45 }}
      >
        {f.symbol}
      </span>
    </div>
  );
}

function TopFace({ isMain = true }: { isMain?: boolean }) {
  return (
    <div className="absolute w-[200px] h-[200px] rounded-[20px]" style={{ background: "linear-gradient(135deg, #222, #1A1A1A)", border: "2px solid #3A3A3A", transform: "rotateX(90deg) translateZ(100px)", backfaceVisibility: "hidden" }}>
      {isMain && <div className="absolute inset-0 rounded-[20px] pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 60%)" }} />}
    </div>
  );
}

function BottomFace() {
  return (
    <div className="absolute w-[200px] h-[200px] rounded-[20px]" style={{ background: "#111", border: "2px solid #222", transform: "rotateX(-90deg) translateZ(100px)", backfaceVisibility: "hidden" }} />
  );
}

/* ───────── MAIN ───────── */

export default function MysteryBoxPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const rotX = useRef(-15);
  const rotY = useRef(0);
  const velX = useRef(0);
  const velY = useRef(0);
  const cubeRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const isDragging = useRef(false);
  const dragPrev = useRef({ x: 0, y: 0 });
  const dragVel = useRef({ x: 0, y: 0 });

  const FRICTION = 0.95;
  const SENSITIVITY = 0.4;

  useEffect(() => {
    setMounted(true);

    const loop = () => {
      if (!isDragging.current) {
        rotY.current += velY.current;
        rotX.current += velX.current;
        velY.current *= FRICTION;
        velX.current *= FRICTION;

        // Gravity: pull X back to -15
        const restX = -15;
        const diffX = restX - rotX.current;
        const pullStrength = Math.abs(velX.current) < 1 ? 0.06 : 0.02;
        rotX.current += diffX * pullStrength;
        velX.current += diffX * 0.01;

        // Snap to nearest face when slow
        if (Math.abs(velY.current) < 0.8 && Math.abs(velY.current) > 0.01) {
          const norm = ((rotY.current % 360) + 360) % 360;
          const nearest = Math.round(norm / 90) * 90;
          const diff = nearest - norm;
          if (Math.abs(diff) > 0.5) velY.current += diff * 0.05;
        }

        if (Math.abs(velY.current) < 0.05) velY.current = 0;
        if (Math.abs(velX.current) < 0.05 && Math.abs(diffX) < 0.5) velX.current = 0;
      }

      const mainTransform = `rotateX(${rotX.current}deg) rotateY(${rotY.current}deg)`;
      if (cubeRef.current) cubeRef.current.style.transform = mainTransform;

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    dragPrev.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragVel.current = { x: 0, y: 0 };
    velX.current = 0;
    velY.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - dragPrev.current.x;
    const dy = e.touches[0].clientY - dragPrev.current.y;
    rotY.current += dx * SENSITIVITY;
    rotX.current -= dy * SENSITIVITY;
    dragVel.current.x = dragVel.current.x * 0.5 + (-dy * SENSITIVITY) * 0.5;
    dragVel.current.y = dragVel.current.y * 0.5 + (dx * SENSITIVITY) * 0.5;
    dragPrev.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = () => {
    isDragging.current = false;
    velX.current = dragVel.current.x * 1.5;
    velY.current = dragVel.current.y * 1.5;
  };

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragPrev.current = { x: e.clientX, y: e.clientY };
    dragVel.current = { x: 0, y: 0 };
    velX.current = 0;
    velY.current = 0;
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = ev.clientX - dragPrev.current.x;
      const dy = ev.clientY - dragPrev.current.y;
      rotY.current += dx * SENSITIVITY;
      rotX.current -= dy * SENSITIVITY;
      dragVel.current.x = dragVel.current.x * 0.5 + (-dy * SENSITIVITY) * 0.5;
      dragVel.current.y = dragVel.current.y * 0.5 + (dx * SENSITIVITY) * 0.5;
      dragPrev.current = { x: ev.clientX, y: ev.clientY };
    };
    const onUp = () => {
      isDragging.current = false;
      velX.current = dragVel.current.x * 1.5;
      velY.current = dragVel.current.y * 1.5;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <>
      <style>{`html, body { background: #E8C840 !important; }`}</style>
      <meta name="theme-color" content="#E8C840" />

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
          <div
            className="flex-1 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
          >
            <div style={{ perspective: "800px" }}>
              <div
                ref={cubeRef}
                className="relative w-[200px] h-[200px]"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateX(-15deg) rotateY(0deg)",
                  opacity: mounted ? 1 : 0,
                  transition: mounted ? "none" : "opacity 0.5s ease-out",
                }}
              >
                {FACE_TRANSFORMS.map((t, i) => <CubeFace key={i} idx={i} transform={t} isMain />)}
                <TopFace isMain />
                <BottomFace />
              </div>
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

      <style>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
