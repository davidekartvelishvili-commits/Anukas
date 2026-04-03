"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ───────── FACE DATA ───────── */

const FACES = [
  { title: "Welcome to Cverd", subtitle: "A fun way to pay your credit card bills", symbol: "₾", glow: "rgba(77,201,246,0.3)", color: "#4dc9f6", symbolColor: "#FFE500" },
  { title: "Win Cashback", subtitle: "Spin the wheel and win up to 100% back", symbol: "%", glow: "rgba(255,184,0,0.3)", color: "#FFB800", symbolColor: "#FFB800" },
  { title: "Level Up", subtitle: "Play more, level up, win bigger rewards", symbol: "★", glow: "rgba(168,85,247,0.3)", color: "#A855F7", symbolColor: "#A855F7" },
  { title: "Get Started", subtitle: "Your cashback journey begins now", symbol: "₾", glow: "rgba(0,232,143,0.3)", color: "#00E88F", symbolColor: "#00E88F" },
];

const FACE_TRANSFORMS = [
  "translateZ(100px)",
  "rotateY(90deg) translateZ(100px)",
  "rotateY(180deg) translateZ(100px)",
  "rotateY(-90deg) translateZ(100px)",
];

function getFaceIndex(rx: number, ry: number): number {
  const toRad = Math.PI / 180;
  const cx = Math.cos(rx * toRad);
  const cy = Math.cos(ry * toRad);
  const sy = Math.sin(ry * toRad);
  const faces = [
    { idx: 0, z: cx * cy },
    { idx: 1, z: cx * sy },
    { idx: 2, z: cx * (-cy) },
    { idx: 3, z: cx * (-sy) },
  ];
  let best = faces[0];
  for (let i = 1; i < faces.length; i++) {
    if (faces[i].z > best.z) best = faces[i];
  }
  return best.idx;
}

/* ───────── CUBE FACE COMPONENT ───────── */

function CubeFace({ idx, transform, isMain = true }: { idx: number; transform: string; isMain?: boolean }) {
  const f = FACES[idx];
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

      {/* Specular rim light on front face — top + left edge highlights */}
      {isFront && (
        <>
          <div className="absolute top-0 left-[20px] right-[20px] h-[1px] rounded-full pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.08) 70%, transparent)", zIndex: 5 }} />
          <div className="absolute left-0 top-[20px] bottom-[20px] w-[1px] rounded-full pointer-events-none" style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.06) 70%, transparent)", zIndex: 5 }} />
          {/* Ambient directional light overlay */}
          <div className="absolute inset-0 rounded-[20px] pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 40%, transparent 100%)", zIndex: 4 }} />
        </>
      )}

      {/* Symbol */}
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
      {/* Overhead light on top face */}
      {isMain && (
        <div className="absolute inset-0 rounded-[20px] pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 60%)" }} />
      )}
    </div>
  );
}

function BottomFace() {
  return (
    <div className="absolute w-[200px] h-[200px] rounded-[20px]" style={{ background: "#111", border: "2px solid #222", transform: "rotateX(-90deg) translateZ(100px)", backfaceVisibility: "hidden" }} />
  );
}

/* ───────── MAIN ───────── */

export default function OnboardingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [faceIdx, setFaceIdx] = useState(0);

  const rotX = useRef(-15);
  const rotY = useRef(0);
  const velX = useRef(0);
  const velY = useRef(0);
  const cubeRef = useRef<HTMLDivElement>(null);
  const reflRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const isDragging = useRef(false);
  const dragPrev = useRef({ x: 0, y: 0 });
  const dragVel = useRef({ x: 0, y: 0 });
  const wasFastSpin = useRef(false);

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

        // Gravity: pull X back to -15°
        const restX = -15;
        const diffX = restX - rotX.current;
        const pullStrength = Math.abs(velX.current) < 1 ? 0.06 : 0.02;
        rotX.current += diffX * pullStrength;
        velX.current += diffX * 0.01;

        // Fast spin → snap to "Get Started" face
        if (wasFastSpin.current && Math.abs(velY.current) < 3) {
          wasFastSpin.current = false;
          const norm = ((rotY.current % 360) + 360) % 360;
          let target = 270;
          if (norm > 270) target = 270 + 360;
          const fullTarget = rotY.current - norm + target;
          velY.current = (fullTarget - rotY.current) * 0.12;
        }

        // Slow spin → snap to nearest face
        if (!wasFastSpin.current && Math.abs(velY.current) < 0.8 && Math.abs(velY.current) > 0.01) {
          const norm = ((rotY.current % 360) + 360) % 360;
          const nearest = Math.round(norm / 90) * 90;
          const diff = nearest - norm;
          if (Math.abs(diff) > 0.5) velY.current += diff * 0.05;
        }

        if (Math.abs(velY.current) < 0.05) velY.current = 0;
        if (Math.abs(velX.current) < 0.05 && Math.abs(diffX) < 0.5) velX.current = 0;
      }

      // Apply transforms
      const mainTransform = `rotateX(${rotX.current}deg) rotateY(${rotY.current}deg)`;
      if (cubeRef.current) cubeRef.current.style.transform = mainTransform;

      // Reflection: same Y rotation, fixed X tilt, flipped
      if (reflRef.current) {
        reflRef.current.style.transform = `scaleY(-1) rotateX(15deg) rotateY(${rotY.current}deg)`;
      }

      const newFace = getFaceIndex(rotX.current, rotY.current);
      setFaceIdx((prev) => (prev !== newFace ? newFace : prev));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Touch
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    wasFastSpin.current = false;
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
    if (Math.abs(velY.current) > 12) wasFastSpin.current = true;
  };

  // Mouse
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    wasFastSpin.current = false;
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
      if (Math.abs(velY.current) > 12) wasFastSpin.current = true;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const face = FACES[faceIdx];

  return (
    <>
      <style>{`html, body { background: #FFE500 !important; }`}</style>
      <meta name="theme-color" content="#FFE500" />

      <main
        className="relative flex flex-col items-center overflow-hidden"
        style={{ background: "#FFE500", height: "100dvh", minHeight: "100vh" }}
      >
        {/* ── Title ── */}
        <div className="flex flex-col items-center px-6 shrink-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 40px)" }}>
          <h1 key={`t-${faceIdx}`} className="text-[34px] sm:text-[40px] text-[#1A1A1A] text-center leading-[1.1] animate-fadeInUp" style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif", fontWeight: 800 }}>
            {face.title}
          </h1>
          <p key={`s-${faceIdx}`} className="text-[16px] text-[#1A1A1A] text-center mt-3 px-4 opacity-70 animate-fadeInUp" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", animationDelay: "0.1s" }}>
            {face.subtitle}
          </p>
        </div>

        {/* ── Cube + Reflection area ── */}
        <div
          className="flex-1 flex flex-col items-center justify-center w-full touch-none cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          {/* Vertical flex: crate → floor line → reflection. Normal flow, no absolute. */}
          <div className="flex flex-col items-center relative">

            {/* ═══ MAIN CRATE ═══ */}
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
        </div>

        {/* ── Bottom: dots + button ── */}
        <div className="shrink-0 flex flex-col items-center -mt-28" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
          <div className="flex justify-center gap-2 mb-4">
            {FACES.map((_, i) => (
              <div key={i} className="w-[8px] h-[8px] rounded-full transition-all duration-300" style={{ background: i === faceIdx ? "#1A1A1A" : "rgba(26,26,26,0.25)" }} />
            ))}
          </div>
          <div className="h-[66px] flex items-center justify-center">
            {faceIdx === 3 && (
              <button
                onClick={() => router.push("/auth/setup")}
                className="w-[145px] h-[66px] rounded-[33px] bg-[#1A1A1A] text-white text-[17px] font-bold active:scale-[0.96] transition-transform duration-150 animate-fadeInUp"
                style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 20 }}
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
