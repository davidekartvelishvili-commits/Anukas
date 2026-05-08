"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ───────── ITEM CONFIG ───────── */

interface FloatingItem {
  src: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  depth: number;
  zIndex: number;
}

const ITEMS: FloatingItem[] = [
  { src: "/images/onboarding/sushi.png",       x: -5,  y: 2,   width: 110, rotation: -15, depth: 1.8, zIndex: 5 },
  { src: "/images/onboarding/airplane.png",    x: 20,  y: -5,  width: 120, rotation: -10, depth: 1.2, zIndex: 4 },
  { src: "/images/onboarding/yoga-mat.png",    x: 48,  y: 5,   width: 100, rotation: 22,  depth: 0.8, zIndex: 2 },
  { src: "/images/onboarding/sneaker.png",     x: 55,  y: 30,  width: 130, rotation: 8,   depth: 1.6, zIndex: 7 },
  { src: "/images/onboarding/stethoscope.png", x: -3,  y: 35,  width: 105, rotation: -5,  depth: 1.3, zIndex: 6 },
  { src: "/images/onboarding/building.png",    x: 30,  y: 45,  width: 100, rotation: 5,   depth: 1.0, zIndex: 3 },
  { src: "/images/onboarding/piggy-bank.png",  x: 60,  y: 60,  width: 110, rotation: -6,  depth: 2.0, zIndex: 7 },
  { src: "/images/onboarding/suitcase.png",   x: 35,  y: 68,  width: 115, rotation: 12,  depth: 1.4, zIndex: 5 },
  { src: "/images/onboarding/ring.png",      x: 65,  y: -2,  width: 95,  rotation: -10, depth: 0.9, zIndex: 3 },
  { src: "/images/onboarding/golfball.png", x: -2,  y: 55,  width: 80,  rotation: 0,   depth: 1.7, zIndex: 4 },
  { src: "/images/onboarding/cards.png",   x: 42,  y: 25,  width: 120, rotation: -8,  depth: 1.1, zIndex: 3 },
  { src: "/images/onboarding/ali-nino.png", x: 10,  y: 75,  width: 105, rotation: 10,  depth: 1.5, zIndex: 6 },
];

/* ───────── ENTRANCE ANIMATION ───────── */

const CAROUSEL_DURATION = 4000;       // 4s carousel phase
const STAGGER_DELAY = 100;            // 100ms between each item falling
const CAROUSEL_RADIUS = 160;          // circle radius in px
const CAROUSEL_SPEED = 0.001178;      // radians per ms — 3/4 circle in CAROUSEL_DURATION

/* ───────── LOGO ───────── */

function ShansiLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/shansi-logo.png"
      alt="Shansi"
      width={52}
      height={52}
      className="select-none"
      draggable={false}
    />
  );
}

/* ───────── PHYSICS STATE (per item) ───────── */

interface PhysicsBody {
  // Position offset from initial CSS position
  x: number;
  y: number;
  // Velocity
  vx: number;
  vy: number;
  // Rotation (degrees, accumulated; cosmos-style 360° spins on impact)
  r: number;
  // Rotational velocity (degrees per frame)
  vr: number;
}

/* ───────── MAIN ───────── */

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [gyroGranted, setGyroGranted] = useState(false);
  const userTapped = useRef(false);

  // Capture ?ref=CODE from share link → store for the signup flow
  // Capture ?callbackUrl= from AuthGuard redirect → persist for post-login
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && ref.trim()) {
        localStorage.setItem("pending_referral_code", ref.trim().toUpperCase());
      }
      const cb = params.get("callbackUrl");
      if (cb) {
        localStorage.setItem("auth_callback_url", cb);
      }
      // Track page view
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      fetch(`${API}/public/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer || null,
          utm_source: params.get("utm_source") || null,
          utm_medium: params.get("utm_medium") || null,
          utm_campaign: params.get("utm_campaign") || null,
          screenWidth: window.innerWidth,
        }),
      }).catch(() => {});
    } catch {}
  }, []);

  const rawTilt = useRef({ x: 0, y: 0 });
  const smoothTilt = useRef({ x: 0, y: 0 });
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);

  // Physics bodies — one per item
  const bodies = useRef<PhysicsBody[]>(ITEMS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0 })));

  // Entrance animation state
  const animPhase = useRef<"carousel" | "falling" | "settled">("carousel");
  const animStartTime = useRef<number>(0);
  const itemScale = useRef<number[]>(ITEMS.map(() => 1));
  const hasBouncedFloor = useRef<boolean[]>(ITEMS.map(() => false));
  const itemReleased = useRef<boolean[]>(ITEMS.map(() => false));
  const itemFrozen = useRef<boolean[]>(ITEMS.map(() => false));

  // Drag state
  const draggingIdx = useRef<number | null>(null);
  const dragPrev = useRef({ x: 0, y: 0 });
  const dragVel = useRef({ x: 0, y: 0 });

  const SENSITIVITY = 0.8;
  const MAX_GYRO = 40;
  const FRICTION = 0.96;
  const COLLISION_RESPONSE = 0.5;
  const BOUNCE = 0.6;

  useEffect(() => {
    setMounted(true);
    animStartTime.current = performance.now();

    // Get the center of an item in screen coordinates
    const getCenter = (idx: number): { x: number; y: number } => {
      const el = itemRefs.current[idx];
      if (!el) return { x: 0, y: 0 };
      const parent = el.parentElement?.getBoundingClientRect();
      const pw = parent?.width || window.innerWidth;
      const ph = parent?.height || window.innerHeight;
      const item = ITEMS[idx];
      const body = bodies.current[idx];
      return {
        x: (item.x / 100) * pw + item.width / 2 + body.x,
        y: ((45 + item.y * 0.55) / 100) * ph + item.width / 2 + body.y,
      };
    };

    // Compute the carousel offset for an item (offset from its base position to its circle slot)
    const getCarouselOffset = (idx: number, elapsed: number) => {
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      const item = ITEMS[idx];
      // Circle center: horizontally centered, vertically ~30% from top (near the title)
      const cx = sw / 2;
      const cy = sh * 0.38;
      // Item base position (matches CSS)
      const baseX = (item.x / 100) * sw;
      const baseY = ((45 + item.y * 0.55) / 100) * sh;
      // Angle for this item in the circle, rotating clockwise over time
      const angle = (idx / ITEMS.length) * Math.PI * 2 + elapsed * CAROUSEL_SPEED;
      const targetX = cx + CAROUSEL_RADIUS * Math.cos(angle) - item.width / 2;
      const targetY = cy + CAROUSEL_RADIUS * Math.sin(angle) - item.width / 2;
      return { x: targetX - baseX, y: targetY - baseY };
    };

    // ── Main physics loop at 60fps ──
    const loop = () => {
      const now = performance.now();
      const elapsed = now - animStartTime.current;

      // Lerp gyro
      smoothTilt.current.x += (rawTilt.current.x - smoothTilt.current.x) * 0.1;
      smoothTilt.current.y += (rawTilt.current.y - smoothTilt.current.y) * 0.1;
      const sx = smoothTilt.current.x;
      const sy = smoothTilt.current.y;

      const n = ITEMS.length;

      // ── PHASE: Carousel (first 2 seconds) ──
      if (animPhase.current === "carousel") {
        if (elapsed >= CAROUSEL_DURATION) {
          // Transition to EXPLOSION — blast items outward from the carousel center
          const sw = window.innerWidth;
          const sh = window.innerHeight;
          for (let i = 0; i < n; i++) {
            const off = getCarouselOffset(i, elapsed);
            bodies.current[i].x = off.x;
            bodies.current[i].y = off.y;

            // Outward direction = item's current offset from center, plus some jitter
            const item = ITEMS[i];
            const baseX = (item.x / 100) * sw;
            const baseY = ((45 + item.y * 0.55) / 100) * sh;
            const absX = baseX + off.x;
            const absY = baseY + off.y;
            const dx = absX - sw / 2;
            const dy = absY - sh * 0.38; // carousel center Y
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            // Explosion speed — varies per item for organic feel
            const speed = 22 + Math.random() * 14; // px/frame
            const jitter = (Math.random() - 0.5) * 0.25; // small angle offset
            const cos = dx / dist, sin = dy / dist;
            // Rotate by jitter
            const rc = Math.cos(jitter), rs = Math.sin(jitter);
            const vxDir = cos * rc - sin * rs;
            const vyDir = sin * rc + cos * rs;
            bodies.current[i].vx = vxDir * speed;
            bodies.current[i].vy = vyDir * speed;
            // Random spin from the blast
            bodies.current[i].vr = (Math.random() - 0.5) * 18;

            itemScale.current[i] = 1.25; // pulse out on explosion
            hasBouncedFloor.current[i] = false;
            itemReleased.current[i] = true; // all released at once — no stagger
            itemFrozen.current[i] = false;
          }
          animPhase.current = "falling";
        } else {
          // Position all items on the rotating circle
          for (let i = 0; i < n; i++) {
            const off = getCarouselOffset(i, elapsed);
            bodies.current[i].x = off.x;
            bodies.current[i].y = off.y;
          }
        }
      }

      // ── PHASE: Explosion (items blast outward from carousel center, then settle) ──
      if (animPhase.current === "falling") {
        const WALL_BOUNCE_FALL = 0.5;
        let allSettled = true;

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        for (let i = 0; i < n; i++) {
          const b = bodies.current[i];
          const item = ITEMS[i];

          // Skip frozen items — they've settled
          if (itemFrozen.current[i]) {
            continue;
          }

          // Air friction — slows the blast gradually (no gravity, zero-G feel)
          b.vx *= 0.965;
          b.vy *= 0.965;

          b.x += b.vx;
          b.y += b.vy;

          // Angular motion + friction
          b.r += b.vr;
          b.vr *= 0.94;

          // Absolute position for wall checks
          const baseX = (item.x / 100) * screenW;
          const baseY = ((45 + item.y * 0.55) / 100) * screenH;
          const absLeft = baseX + b.x;
          const absRight = absLeft + item.width;
          const absTop = baseY + b.y;
          const absBottom = absTop + item.width;

          // Wall bounces — keep items on screen (no floor, it's 4 walls)
          if (absLeft < -10) {
            b.x = -10 - baseX;
            b.vx = Math.abs(b.vx) * WALL_BOUNCE_FALL;
          }
          if (absRight > screenW + 10) {
            b.x = screenW + 10 - item.width - baseX;
            b.vx = -Math.abs(b.vx) * WALL_BOUNCE_FALL;
          }
          if (absTop < -10) {
            b.y = -10 - baseY;
            b.vy = Math.abs(b.vy) * WALL_BOUNCE_FALL;
          }
          if (absBottom > screenH + 10) {
            b.y = screenH + 10 - item.width - baseY;
            b.vy = -Math.abs(b.vy) * WALL_BOUNCE_FALL;
          }

          // Scale settle: 1.25 → 1.0
          if (itemScale.current[i] > 1.001) {
            itemScale.current[i] += (1.0 - itemScale.current[i]) * 0.08;
          } else {
            itemScale.current[i] = 1;
          }

          // Freeze once motion is essentially zero — wherever the item ends up is fine
          const speedSq = b.vx * b.vx + b.vy * b.vy;
          if (speedSq < 0.08 && Math.abs(b.vr) < 0.25) {
            b.vx = 0;
            b.vy = 0;
            b.vr = 0;
            itemFrozen.current[i] = true;
            itemScale.current[i] = 1;
            continue;
          }

          allSettled = false;
        }

        // Collision between falling items
        for (let i = 0; i < n; i++) {
          if (!itemReleased.current[i]) continue;
          for (let j = i + 1; j < n; j++) {
            if (!itemReleased.current[j]) continue;
            const ci = getCenter(i);
            const cj = getCenter(j);
            const dx = cj.x - ci.x;
            const dy = cj.y - ci.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = ITEMS[i].width * 0.35 + ITEMS[j].width * 0.35;
            if (dist < minDist && dist > 0.5) {
              const nx = dx / dist;
              const ny = dy / dist;
              const bi = bodies.current[i];
              const bj = bodies.current[j];
              const dvDotN = (bj.vx - bi.vx) * nx + (bj.vy - bi.vy) * ny;
              if (dvDotN < 0) {
                const impulse = -dvDotN * 0.4;
                bi.vx -= nx * impulse;
                bi.vy -= ny * impulse;
                bj.vx += nx * impulse;
                bj.vy += ny * impulse;
              }
              const overlap = (minDist - dist) * 0.5;
              bi.x -= nx * overlap;
              bi.y -= ny * overlap;
              bj.x += nx * overlap;
              bj.y += ny * overlap;
            }
          }
        }

        if (allSettled) {
          animPhase.current = "settled";
        }
      }

      // ── PHASE: Settled (normal physics) ──
      if (animPhase.current === "settled") {
        // ── Apply velocity + friction to non-dragged items ──
        for (let i = 0; i < n; i++) {
          const b = bodies.current[i];
          if (draggingIdx.current === i) {
            // While dragging: no inertia damping (direct follow). Rotation settles quickly.
            b.vr *= 0.85;
            if (Math.abs(b.vr) < 0.08) b.vr = 0;
            b.r += b.vr;
            continue;
          }
          b.x += b.vx;
          b.y += b.vy;
          b.vx *= FRICTION;
          b.vy *= FRICTION;
          if (Math.abs(b.vx) < 0.05) b.vx = 0;
          if (Math.abs(b.vy) < 0.05) b.vy = 0;
          // Rotation — strong angular friction so items don't keep spinning like a top
          b.r += b.vr;
          b.vr *= 0.93;
          if (Math.abs(b.vr) < 0.08) b.vr = 0;
        }

        // ── Collision detection + momentum transfer ──
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const ci = getCenter(i);
            const cj = getCenter(j);
            const dx = cj.x - ci.x;
            const dy = cj.y - ci.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ri = ITEMS[i].width * 0.35;
            const rj = ITEMS[j].width * 0.35;
            const minDist = ri + rj;

            if (dist < minDist && dist > 0.5) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;

              const bi = bodies.current[i];
              const bj = bodies.current[j];

              const dvx = bj.vx - bi.vx;
              const dvy = bj.vy - bi.vy;
              const dvDotN = dvx * nx + dvy * ny;

              if (dvDotN < 0) {
                const speed = Math.abs(dvDotN);
                if (speed > 1.5 && userTapped.current && navigator.vibrate) {
                  navigator.vibrate(Math.min(30, Math.round(speed * 4)));
                }
                const impulse = -(1 + BOUNCE) * dvDotN * COLLISION_RESPONSE;

                if (draggingIdx.current === i) {
                  bj.vx += nx * impulse * 2;
                  bj.vy += ny * impulse * 2;
                } else if (draggingIdx.current === j) {
                  bi.vx -= nx * impulse * 2;
                  bi.vy -= ny * impulse * 2;
                } else {
                  bi.vx -= nx * impulse;
                  bi.vy -= ny * impulse;
                  bj.vx += nx * impulse;
                  bj.vy += ny * impulse;
                }

                // ── Gentle angular impulse — natural, subtle rotation on collision (not a fidget spinner) ──
                const tx = -ny, ty = nx;
                const tangential = dvx * tx + dvy * ty;
                // Small multiplier + low cap so the spin is a subtle rotation, not a full spin
                const spinMagnitude = Math.min(3.5, Math.abs(tangential) * 0.5);
                const spinDir = tangential >= 0 ? 1 : -1;
                if (draggingIdx.current !== j) bj.vr += spinDir * spinMagnitude;
                if (draggingIdx.current !== i) bi.vr -= spinDir * spinMagnitude;
              }

              const sep = overlap * 0.5;
              if (draggingIdx.current === i) {
                bj.x += nx * overlap;
                bj.y += ny * overlap;
              } else if (draggingIdx.current === j) {
                bi.x -= nx * overlap;
                bi.y -= ny * overlap;
              } else {
                bi.x -= nx * sep;
                bi.y -= ny * sep;
                bj.x += nx * sep;
                bj.y += ny * sep;
              }
            }
          }
        }

        // ── Wall bouncing ──
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        for (let i = 0; i < n; i++) {
          const item = ITEMS[i];
          const b = bodies.current[i];
          const baseX = (item.x / 100) * screenW;
          const baseY = ((45 + item.y * 0.55) / 100) * screenH;
          const actualLeft = baseX + b.x;
          const actualRight = actualLeft + item.width;
          const actualTop = baseY + b.y;
          const actualBottom = actualTop + item.width;

          const wallVibrate = (v: number) => {
            if (Math.abs(v) > 2 && userTapped.current && navigator.vibrate) {
              navigator.vibrate(Math.min(20, Math.round(Math.abs(v) * 3)));
            }
          };

          // Wall-bounce angular impulse — very gentle, only noticeable on corner/glancing hits
          const addSpinFromWall = (tangential: number) => {
            const mag = Math.min(2.5, Math.abs(tangential) * 0.35);
            b.vr += (tangential >= 0 ? 1 : -1) * mag;
          };

          if (actualLeft < -10) {
            b.x = -10 - baseX;
            wallVibrate(b.vx);
            addSpinFromWall(b.vy); // vertical motion at left wall → spin
            b.vx = Math.abs(b.vx) * BOUNCE;
          }
          if (actualRight > screenW + 10) {
            b.x = screenW + 10 - item.width - baseX;
            wallVibrate(b.vx);
            addSpinFromWall(-b.vy);
            b.vx = -Math.abs(b.vx) * BOUNCE;
          }
          if (actualTop < -10) {
            b.y = -10 - baseY;
            wallVibrate(b.vy);
            addSpinFromWall(-b.vx);
            b.vy = Math.abs(b.vy) * BOUNCE;
          }
          if (actualBottom > screenH + 10) {
            b.y = screenH + 10 - item.width - baseY;
            wallVibrate(b.vy);
            addSpinFromWall(b.vx);
            b.vy = -Math.abs(b.vy) * BOUNCE;
          }
        }
      }

      // ── Apply transforms ──
      ITEMS.forEach((item, idx) => {
        const el = itemRefs.current[idx];
        if (!el) return;
        const b = bodies.current[idx];
        const scale = itemScale.current[idx];
        // Only apply gyro/parallax after settling
        const useGyro = animPhase.current === "settled";
        const gyroX = useGyro ? Math.max(-MAX_GYRO, Math.min(MAX_GYRO, sx * item.depth * 30 * SENSITIVITY)) : 0;
        const gyroY = useGyro ? Math.max(-MAX_GYRO, Math.min(MAX_GYRO, sy * item.depth * 18 * SENSITIVITY)) : 0;
        const gyroDr = useGyro ? sx * item.depth * 3 : 0;
        const totalX = gyroX + b.x;
        const totalY = gyroY + b.y;
        // Total rotation = original resting angle + gyro tilt + accumulated spin from collisions/walls
        const totalRotation = item.rotation + gyroDr + b.r;
        el.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) rotate(${totalRotation}deg) scale(${scale})`;
      });

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // ── Gyroscope ──
    const onOrientation = (e: DeviceOrientationEvent) => {
      rawTilt.current.x = Math.max(-1, Math.min(1, (e.gamma || 0) / 25));
      rawTilt.current.y = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 25));
    };

    // ── Mouse parallax (desktop) ──
    const onMouse = (e: MouseEvent) => {
      if (draggingIdx.current !== null) return; // don't mix mouse parallax with drag
      rawTilt.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      rawTilt.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const isIOS = typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function";
    if (!isIOS && typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", onOrientation);
    }
    window.addEventListener("mousemove", onMouse);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  // ── iOS gyroscope permission ──
  const requestGyro = () => {
    if (gyroGranted) return;
    const DOE = typeof DeviceOrientationEvent !== "undefined" ? DeviceOrientationEvent : null;
    if (DOE && typeof (DOE as any).requestPermission === "function") {
      (DOE as any).requestPermission().then((p: string) => {
        if (p === "granted") {
          setGyroGranted(true);
          window.addEventListener("deviceorientation", (e: DeviceOrientationEvent) => {
            rawTilt.current.x = Math.max(-1, Math.min(1, (e.gamma || 0) / 25));
            rawTilt.current.y = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 25));
          });
        }
      }).catch(() => {});
    }
  };

  // ── Drag handlers ──
  const startDrag = (idx: number, cx: number, cy: number) => {
    userTapped.current = true;
    if (animPhase.current !== "settled") return;
    draggingIdx.current = idx;
    dragPrev.current = { x: cx, y: cy };
    dragVel.current = { x: 0, y: 0 };
    bodies.current[idx].vx = 0;
    bodies.current[idx].vy = 0;
    const el = itemRefs.current[idx];
    if (el) el.style.zIndex = "30";
  };

  const moveDrag = (idx: number, cx: number, cy: number) => {
    if (draggingIdx.current !== idx) return;
    const dx = cx - dragPrev.current.x;
    const dy = cy - dragPrev.current.y;
    // Track velocity (smoothed)
    dragVel.current.x = dragVel.current.x * 0.5 + dx * 0.5;
    dragVel.current.y = dragVel.current.y * 0.5 + dy * 0.5;
    // Move body directly
    bodies.current[idx].x += dx;
    bodies.current[idx].y += dy;
    dragPrev.current = { x: cx, y: cy };
  };

  const endDrag = (idx: number) => {
    if (draggingIdx.current !== idx) return;
    // Apply inertia — fling velocity
    bodies.current[idx].vx = dragVel.current.x * 1.5;
    bodies.current[idx].vy = dragVel.current.y * 1.5;
    draggingIdx.current = null;
    const el = itemRefs.current[idx];
    if (el) el.style.zIndex = String(ITEMS[idx].zIndex);
  };

  return (
    <>
      <style>{`
        html, body {
          background: #FFE500 !important;
          overflow: hidden !important;
          height: 100%;
          overscroll-behavior: none;
        }
      `}</style>
      {/* Override theme-color for Safari status bar + URL bar */}
      <meta name="theme-color" content="#FFE500" />

      <main
        className="fixed inset-0 flex flex-col overflow-hidden"
        style={{
          background: "#FFE500",
          touchAction: "none",
          overscrollBehavior: "none",
        }}
        onClick={() => { userTapped.current = true; requestGyro(); }}
      >
        {/* ── Top bar ── */}
        <div
          className="flex justify-end px-5 pt-3 relative z-50"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)", pointerEvents: "none" }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); router.push("/auth?mode=login"); }}
            className="text-[16px] font-bold text-[#1A1A1A] active:opacity-50 transition-opacity"
            style={{ fontFamily: "var(--font-outfit), system-ui, -apple-system, sans-serif", pointerEvents: "auto" }}
          >
            Log In
          </button>
        </div>

        {/* ── Logo ── */}
        <div
          className="flex justify-center mt-24 relative z-50"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1)" : "scale(0.8)",
            transition: "all 0.5s ease-out 0.1s",
            pointerEvents: "none",
          }}
        >
          <ShansiLogo />
        </div>

        {/* ── Title — centered, one line, edge to edge ── */}
        <div
          className="px-3 mt-3 relative z-50 text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s ease-out 0.15s",
            pointerEvents: "none",
          }}
        >
          <h1
            className="text-[#1A1A1A] leading-[1] tracking-[0.04em] whitespace-nowrap"
            style={{
              fontFamily: "var(--font-outfit), system-ui, -apple-system, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(30px, 9.5vw, 52px)",
            }}
          >
            Welcome to Shansi!
          </h1>
        </div>

        {/* ── Floating items — full screen, physics-driven ── */}
        <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
          {ITEMS.map((item, idx) => (
            <div
              key={idx}
              ref={(el) => { itemRefs.current[idx] = el; }}
              className="absolute will-change-transform touch-none cursor-grab active:cursor-grabbing"
              style={{
                left: `${item.x}%`,
                top: `${45 + item.y * 0.55}%`,
                width: item.width,
                zIndex: item.zIndex,
                transform: `translate3d(0, 0, 0) rotate(${item.rotation}deg)`,
                filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.15))",
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                startDrag(idx, e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchMove={(e) => {
                moveDrag(idx, e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchEnd={() => endDrag(idx)}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                startDrag(idx, e.clientX, e.clientY);
                const onMove = (ev: MouseEvent) => moveDrag(idx, ev.clientX, ev.clientY);
                const onUp = () => {
                  endDrag(idx);
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                width={item.width}
                height={item.width}
                className="w-full h-auto object-contain select-none pointer-events-none"
                draggable={false}
                style={{
                  opacity: mounted ? 1 : 0,
                  transition: `opacity 0.5s ease-out ${0.3 + idx * 0.06}s`,
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Sign up button ── */}
        <div
          className="relative flex justify-center mb-6"
          style={{
            zIndex: 40,
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.5s ease-out 0.3s",
            pointerEvents: "none",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); router.push("/auth"); }}
            className="w-[145px] h-[66px] rounded-[33px] bg-[#1A1A1A] text-white text-[17px] font-bold active:scale-[0.96] transition-transform duration-150"
            style={{
              fontFamily: "var(--font-outfit), system-ui, -apple-system, sans-serif",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              pointerEvents: "auto",
            }}
          >
            Sign up
          </button>
        </div>
      </main>
    </>
  );
}
