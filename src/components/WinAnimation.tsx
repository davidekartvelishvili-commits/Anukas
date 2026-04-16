"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const Y = "#F9E741";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  gravity: number; drag: number;
  life: number; decay: number;
  size: number; rot: number; rotSpeed: number;
  wobble: number; wobbleSpeed: number;
  type: "coin" | "bill" | "spark";
  color: string;
}

/* ─── PARTICLE CANVAS ─── */
function ParticleCanvas({ running }: { running: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number>(0);
  const runningRef = useRef(running);

  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const drawCoin = (ctx: CanvasRenderingContext2D, p: Particle) => {
      const r = p.size;
      const flip = Math.cos(p.wobble);
      const sx = Math.abs(flip) < 0.05 ? 0.05 : Math.abs(flip);
      const isTails = flip < 0;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(sx, 1);

      ctx.beginPath();
      ctx.ellipse(0, r * 1.0, r * 0.6, r * 0.15, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fill();

      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
      g.addColorStop(0, isTails ? "#ffe680" : "#fffbe0");
      g.addColorStop(0.4, Y);
      g.addColorStop(0.75, "#c8a800");
      g.addColorStop(1, "#7a5200");
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();

      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = "#e0b800"; ctx.lineWidth = r * 0.1; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
      ctx.strokeStyle = "#c8a800"; ctx.lineWidth = r * 0.05; ctx.stroke();

      if (!isTails && sx > 0.3) {
        ctx.fillStyle = "#7a5200";
        ctx.font = `bold ${r * 0.88}px Georgia`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("\u20BE", 0, r * 0.04);
      }

      ctx.beginPath();
      ctx.ellipse(-r * 0.22, -r * 0.28, r * 0.36, r * 0.18, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.38)"; ctx.fill();
      ctx.restore();
    };

    const drawBill = (ctx: CanvasRenderingContext2D, p: Particle) => {
      const w = p.size * 3.4;
      const h = p.size * 1.6;
      const flip = Math.abs(Math.cos(p.wobble));
      const fy = flip < 0.05 ? 0.05 : flip;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, fy);

      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;

      const bg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      bg.addColorStop(0, "#197a38"); bg.addColorStop(0.35, "#23a352");
      bg.addColorStop(0.65, "#1d8c45"); bg.addColorStop(1, "#145f2e");
      ctx.beginPath();
      (ctx as any).roundRect ? (ctx as any).roundRect(-w / 2, -h / 2, w, h, 3) : ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = bg; ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.beginPath();
      (ctx as any).roundRect ? (ctx as any).roundRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 2) : ctx.rect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
      ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1; ctx.stroke();

      for (const ox of [-w / 2 + h * 0.5, w / 2 - h * 0.5]) {
        ctx.beginPath(); ctx.arc(ox, 0, h * 0.32, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fill();
      }

      if (fy > 0.3) {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = `bold ${h * 0.58}px Georgia`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("\u20BE", 0, 0);
      }

      ctx.restore();
    };

    const drawSpark = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = p.life * 0.85;
      ctx.strokeStyle = p.color; ctx.lineWidth = 1.6; ctx.lineCap = "round";
      const len = p.size * 2.2;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * p.size * 0.2, Math.sin(a) * p.size * 0.2);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.restore();
    };

    type SpawnOpts = { angle?: number; spread?: number; scatter?: number };
    const spawn = (cx: number, cy: number, count: number, type: "coin" | "bill" | "spark", opts: SpawnOpts = {}) => {
      for (let i = 0; i < count; i++) {
        const a = opts.angle !== undefined
          ? opts.angle + (Math.random() - 0.5) * (opts.spread || 2)
          : Math.random() * Math.PI * 2;
        const spd = type === "coin" ? Math.random() * 13 + 4
          : type === "bill" ? Math.random() * 7 + 3
          : Math.random() * 10 + 3;
        particles.current.push({
          x: cx + (Math.random() - 0.5) * (opts.scatter || 40),
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - (type === "coin" ? 8 : 4),
          gravity: type === "coin" ? 0.42 : type === "bill" ? 0.2 : 0.18,
          drag: 0.986,
          life: 1,
          decay: 0.003 + Math.random() * 0.005,
          size: type === "coin" ? 10 + Math.random() * 16
            : type === "bill" ? 10 + Math.random() * 12
            : 2 + Math.random() * 5,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * (type === "bill" ? 0.06 : 0.13),
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.05 + Math.random() * 0.09,
          type,
          color: [Y, "#fff", "#FFD700", "#ffe066"][~~(Math.random() * 4)],
        });
      }
    };

    (ref.current as any)._spawn = spawn;

    let frame = 0;
    let lastMs = 0;

    const loop = (ts: number) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      frame++;

      if (runningRef.current && ts - lastMs > 50) {
        lastMs = ts;
        const cx = w / 2;
        if (frame % 2 === 0) spawn(Math.random() * w, -35, 2, "coin", { angle: Math.PI / 2, spread: 0.5 });
        if (frame % 3 === 0) spawn(Math.random() * w, -20, 1, "bill", { angle: Math.PI / 2, spread: 0.4 });
        if (frame % 12 === 0) {
          spawn(cx, h * 0.55, 5, "coin", { scatter: 90 });
          spawn(cx, h * 0.55, 3, "bill", { scatter: 70 });
        }
        if (frame % 20 === 0) {
          spawn(w * 0.12, h * 0.38, 5, "coin");
          spawn(w * 0.88, h * 0.38, 5, "coin");
          spawn(cx, h * 0.52, 4, "spark");
        }
      }

      particles.current = particles.current.filter(p => p.life > 0.01 && p.y < h + 280);
      for (const p of particles.current) {
        p.vy += p.gravity; p.vx *= p.drag; p.vy *= p.drag;
        p.x += p.vx; p.y += p.vy;
        p.rot += p.rotSpeed; p.wobble += p.wobbleSpeed;
        p.life -= p.decay;
        ctx.globalAlpha = Math.min(p.life * 2.5, 1);
        if (p.type === "coin") drawCoin(ctx, p);
        else if (p.type === "bill") drawBill(ctx, p);
        else drawSpark(ctx, p);
        ctx.globalAlpha = 1;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Initial burst when running starts
  useEffect(() => {
    if (!running || !ref.current) return;
    const sp = (ref.current as any)._spawn;
    if (!sp) return;
    const w = ref.current.offsetWidth;
    const h = ref.current.offsetHeight;
    const cx = w / 2, cy = h * 0.55;
    sp(cx, cy, 28, "coin", { scatter: 30 });
    sp(cx, cy, 12, "bill", { scatter: 50 });
    sp(cx, cy, 18, "spark");
    setTimeout(() => {
      sp(cx, cy, 20, "coin", { scatter: 100 });
      sp(w * 0.15, h * 0.35, 12, "coin");
      sp(w * 0.85, h * 0.35, 12, "coin");
      sp(cx, cy - 20, 10, "bill", { scatter: 80 });
    }, 300);
  }, [running]);

  return (
    <canvas ref={ref} style={{
      position: "absolute", inset: 0,
      width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 30,
    }} />
  );
}

/* ─── SLOT COUNTER ─── */
function SlotCounter({ active, target, onDone }: { active: boolean; target: number; onDone?: () => void }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!active) { setDisplay(0); return; }

    const PEAK    = 1000;
    const T_UP    = 3800;
    const T_HOVER = 500;
    const T_DOWN  = 1200;
    const T_TOTAL = T_UP + T_HOVER + T_DOWN;

    let start: number | null = null;
    let finished = false;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const e = ts - start;

      if (e < T_UP) {
        const t = e / T_UP;
        const curved = t < 0.3
          ? (t / 0.3) * (t / 0.3) * 0.3
          : 0.3 + (t - 0.3) / 0.7 * 0.7;
        setDisplay(Math.min(Math.floor(curved * PEAK), PEAK));
      } else if (e < T_UP + T_HOVER) {
        const t = (e - T_UP) / T_HOVER;
        const wobble = Math.sin(t * Math.PI * 4) * 6;
        setDisplay(Math.floor(PEAK - 5 + wobble));
      } else if (e < T_TOTAL) {
        const t = (e - T_UP - T_HOVER) / T_DOWN;
        const ease = 1 - Math.pow(1 - t, 3);
        const val = PEAK - ease * (PEAK - target);
        setDisplay(Math.round(val));
      } else {
        if (!finished) {
          finished = true;
          setDisplay(target);
          onDone?.();
        }
        return;
      }

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, target, onDone]);

  return <>{display}</>;
}

/* ─── MAIN ─── */
export default function WinAnimation({
  show,
  amount,
  onDone,
}: {
  show: boolean;
  amount: number;
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "flash" | "celebrate" | "finishing" | "done">("idle");

  // Trigger when `show` becomes true
  useEffect(() => {
    if (show && phase === "idle") {
      setPhase("celebrate");
    }
    if (!show && (phase === "done" || phase === "finishing")) {
      setPhase("idle");
    }
  }, [show, phase]);

  const handleCounterDone = useCallback(() => {
    setPhase("finishing");
    setTimeout(() => {
      setPhase("done");
      onDone?.();
    }, 2500);
  }, [onDone]);

  const showCounter = phase === "celebrate" || phase === "finishing" || phase === "done";
  const running = phase === "celebrate";

  if (phase === "idle") return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        // Semi-transparent dark backdrop — blocks taps so user can't drop
        // balls during animation. backdrop-filter:blur removed: it was
        // forcing a full-screen GPU recomposite every frame for the whole
        // duration of the win animation, stealing 3-8ms per frame on mobile.
        background: "rgba(0,0,0,0.72)",
        fontFamily: "'Montserrat', 'Outfit', sans-serif",
        animation: phase === "finishing" || phase === "done" ? "fadeOut 2s forwards" : undefined,
      }}
    >
      <style>{`
        @keyframes screenFlash { 0% { opacity: 0.65; } 100% { opacity: 0; } }
        @keyframes slamIn {
          0% { transform: scale(3.2); opacity: 0; filter: blur(30px); }
          55% { transform: scale(0.93); filter: blur(0); opacity: 1; }
          75% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmerGold {
          0% { background-position: -400% center; }
          100% { background-position: 400% center; }
        }
        @keyframes glowPulse {
          0%,100% { filter: drop-shadow(0 0 28px ${Y}88) drop-shadow(0 0 55px ${Y}44); }
          50% { filter: drop-shadow(0 0 55px ${Y}cc) drop-shadow(0 0 110px ${Y}66); }
        }
        @keyframes ringOut {
          0% { transform: translate(-50%,-50%) scale(0.5); opacity: 0.75; }
          100% { transform: translate(-50%,-50%) scale(3.8); opacity: 0; }
        }
        @keyframes bgBreath { 0%,100% { opacity: 0.22; } 50% { opacity: 0.42; } }
        @keyframes raysSpin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      {/* Background glow */}
      {showCounter && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 65% 55% at 50% 52%, ${Y}2a, transparent 68%)`,
          animation: running ? "bgBreath 1.8s ease-in-out infinite" : "fadeOut 2s forwards",
          pointerEvents: "none",
        }} />
      )}

      {/* Spinning rays */}
      {showCounter && (
        <div style={{
          position: "absolute",
          width: "240%", height: "240%",
          top: "50%", left: "50%",
          animation: running
            ? "raysSpin 24s linear infinite"
            : "raysSpin 24s linear infinite, fadeOut 2.5s forwards",
          pointerEvents: "none", opacity: 0.17,
        }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: "1.5px", height: "50%",
              background: `linear-gradient(to bottom, ${Y}, transparent)`,
              transformOrigin: "top left",
              transform: `rotate(${i * (360 / 28)}deg)`,
            }} />
          ))}
        </div>
      )}

      {/* Particles */}
      <ParticleCanvas running={running} />

      {/* Amount */}
      <div style={{ position: "relative", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {running && (
          <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none" }}>
            {[0, 0.6, 1.2, 1.8].map((d, i) => (
              <div key={i} style={{
                position: "absolute", top: "50%", left: "50%",
                width: 90, height: 90, borderRadius: "50%",
                border: `1.5px solid ${Y}`,
                animation: `ringOut 2.8s ${d}s ease-out infinite`,
              }} />
            ))}
          </div>
        )}

        {showCounter && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            animation: "slamIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both, glowPulse 2s 0.8s ease-in-out infinite",
          }}>
            <span style={{
              fontSize: "clamp(38px, 9vw, 68px)",
              fontWeight: 900,
              color: Y,
              lineHeight: 1,
              marginTop: "0.2em",
              marginRight: "0.06em",
            }}>₾</span>

            <span style={{
              fontSize: "clamp(96px, 25vw, 196px)",
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: "-0.03em",
              background: `linear-gradient(135deg, #fffaaa 0%, ${Y} 22%, #ffe44d 48%, ${Y} 74%, #fffaaa 100%)`,
              backgroundSize: "400% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmerGold 2.4s linear infinite",
              minWidth: "3ch",
              display: "inline-block",
              textAlign: "center",
            }}>
              <SlotCounter active={showCounter} target={amount} onDone={handleCounterDone} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
