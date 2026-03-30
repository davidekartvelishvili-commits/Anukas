"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MULTIPLIERS, SLOT_COLORS, BET_COST, type RiskLevel, type DropResult } from "./drop-config";

const ROWS = 12;
const GRAVITY = 0.25;
const BOUNCE = 0.55;
const FRICTION = 0.98;

interface Peg { x: number; y: number; r: number; glow: number }
interface Slot { x: number; y: number; w: number; h: number; mult: number; color: string; glow: number }
interface TrailPoint { x: number; y: number; a: number }
interface Ball {
  x: number; y: number; vx: number; vy: number;
  r: number; alive: boolean; settled: boolean;
  trail: TrailPoint[]; targetSlot: number;
  data: DropResult;
}

export default function LuckyDropPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    balls: [] as Ball[],
    pegs: [] as Peg[],
    slots: [] as Slot[],
    W: 0, H: 0,
    gapX: 0, gapY: 0, startY: 0, slotH: 0, pegR: 0,
    leftWall: [] as { x1: number; y1: number; x2: number; y2: number }[],
    rightWall: [] as { x1: number; y1: number; x2: number; y2: number }[],
  });

  const [balance, setBalance] = useState(5000);
  const [risk, setRisk] = useState<RiskLevel>("low");
  const [result, setResult] = useState<{ text: string; isJP: boolean } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  const riskRef = useRef(risk);
  useEffect(() => { riskRef.current = risk; }, [risk]);

  const calcLayout = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const pegR = Math.max(4, W * 0.007);
    const cols = ROWS + 2;
    const gapX = (W - 60) / cols;
    const gapY = (H * 0.52) / ROWS;
    const startY = H * 0.16;
    const slotH = H * 0.08;

    const pegs: Peg[] = [];
    const rowEdges: { left: number; right: number; y: number }[] = [];

    for (let row = 0; row < ROWS; row++) {
      const c = row + 3;
      const totalW = (c - 1) * gapX;
      const sx = (W - totalW) / 2;
      for (let col = 0; col < c; col++) {
        pegs.push({ x: sx + col * gapX, y: startY + row * gapY, r: pegR, glow: 0 });
      }
      rowEdges.push({ left: sx, right: sx + totalW, y: startY + row * gapY });
    }

    // Build angled walls from peg edges
    const leftWall: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const rightWall: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < rowEdges.length - 1; i++) {
      leftWall.push({ x1: rowEdges[i].left, y1: rowEdges[i].y, x2: rowEdges[i + 1].left, y2: rowEdges[i + 1].y });
      rightWall.push({ x1: rowEdges[i].right, y1: rowEdges[i].y, x2: rowEdges[i + 1].right, y2: rowEdges[i + 1].y });
    }

    const mults = MULTIPLIERS[riskRef.current];
    const count = mults.length;
    const totalW2 = (ROWS + 1) * gapX;
    const sx2 = (W - totalW2) / 2;
    const slotW = totalW2 / count;
    const sy = startY + ROWS * gapY + gapY * 0.6;
    const colors = SLOT_COLORS[riskRef.current];

    const slots: Slot[] = mults.map((m, i) => ({
      x: sx2 + i * slotW, y: sy, w: slotW, h: slotH,
      mult: m, color: colors[i], glow: 0,
    }));

    const s = stateRef.current;
    s.W = W; s.H = H; s.pegs = pegs; s.slots = slots;
    s.gapX = gapX; s.gapY = gapY; s.startY = startY; s.slotH = slotH; s.pegR = pegR;
    s.leftWall = leftWall; s.rightWall = rightWall;
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;

    function resize() {
      cvs!.width = window.innerWidth;
      cvs!.height = window.innerHeight;
      calcLayout();
    }
    resize();
    window.addEventListener("resize", resize);

    let animId: number;

    function loop() {
      animId = requestAnimationFrame(loop);
      const now = performance.now();
      const s = stateRef.current;
      const { W, H } = s;

      const bg = ctx.createRadialGradient(W / 2, H * 0.3, 50, W / 2, H * 0.5, H * 0.8);
      bg.addColorStop(0, "#1a237e"); bg.addColorStop(0.35, "#0d1254");
      bg.addColorStop(0.7, "#070b2e"); bg.addColorStop(1, "#030612");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      if (s.balls.length === 0) {
        const pulse = Math.sin(now * 0.004) * 0.3 + 0.7;
        ctx.save(); ctx.globalAlpha = pulse * 0.6;
        ctx.beginPath();
        ctx.moveTo(W / 2, s.startY - 35);
        ctx.lineTo(W / 2 - 8, s.startY - 47);
        ctx.lineTo(W / 2 + 8, s.startY - 47);
        ctx.closePath();
        ctx.fillStyle = "#FFD700"; ctx.shadowColor = "#FFD700"; ctx.shadowBlur = 15;
        ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
      }

      // Pegs
      for (const peg of s.pegs) {
        peg.glow *= 0.92;
        if (peg.glow > 0.05) {
          const g = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, peg.r * 5);
          g.addColorStop(0, `rgba(124,77,255,${peg.glow * 0.5})`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fillRect(peg.x - peg.r * 5, peg.y - peg.r * 5, peg.r * 10, peg.r * 10);
        }
        const a = 0.4 + peg.glow * 0.6;
        const pg = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, peg.r);
        pg.addColorStop(0, `rgba(180,180,240,${a})`);
        pg.addColorStop(1, `rgba(90,100,180,${a * 0.7})`);
        ctx.beginPath(); ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
        ctx.fillStyle = pg; ctx.fill();
        ctx.beginPath(); ctx.arc(peg.x, peg.y, peg.r + 1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(124,77,255,${0.2 + peg.glow * 0.8})`;
        ctx.lineWidth = 1; ctx.stroke();
      }

      // Slots
      for (let i = 0; i < s.slots.length; i++) {
        const sl = s.slots[i];
        sl.glow *= 0.95;
        const pulse = 0.5 + Math.sin(now * 0.003 + i * 0.5) * 0.15;
        ctx.fillStyle = sl.color + "18";
        ctx.fillRect(sl.x + 1, sl.y, sl.w - 2, sl.h);
        if (sl.glow > 0.05) {
          const ga = Math.min(255, Math.floor(sl.glow * 80));
          ctx.fillStyle = sl.color + ga.toString(16).padStart(2, "0");
          ctx.fillRect(sl.x, sl.y, sl.w, sl.h);
        }
        const la = Math.min(255, Math.floor((pulse + sl.glow) * 180));
        ctx.fillStyle = sl.color + la.toString(16).padStart(2, "0").slice(0, 2);
        ctx.fillRect(sl.x + 2, sl.y, sl.w - 4, 2.5);
        ctx.font = `${sl.mult >= 10 ? "900" : "700"} ${Math.min(sl.w * 0.38, 18)}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = sl.color; ctx.shadowBlur = 8 + sl.glow * 20;
        ctx.fillStyle = sl.mult === 0 ? "rgba(255,255,255,0.2)" : sl.color;
        ctx.fillText(sl.mult === 0 ? "0x" : sl.mult + "x", sl.x + sl.w / 2, sl.y + sl.h / 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(sl.x + sl.w - 0.5, sl.y, 1, sl.h);
      }

      // Balls
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i];
        if (!b.alive) { s.balls.splice(i, 1); continue; }

        if (!b.settled) {
          b.vy += GRAVITY;
          b.vx *= FRICTION;
          b.x += b.vx; b.y += b.vy;

          // Trail
          b.trail.push({ x: b.x, y: b.y, a: 1 });
          if (b.trail.length > 12) b.trail.shift();
          b.trail.forEach((t) => (t.a *= 0.85));

          // Peg collisions
          for (const peg of s.pegs) {
            const dx = b.x - peg.x, dy = b.y - peg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minD = b.r + peg.r;
            if (dist < minD) {
              const nx = dx / dist, ny = dy / dist;
              const rv = b.vx * nx + b.vy * ny;
              if (rv < 0) {
                b.vx -= (1 + BOUNCE) * rv * nx;
                b.vy -= (1 + BOUNCE) * rv * ny;
                b.vx += (Math.random() - 0.5) * 1.2;
              }
              const ov = minD - dist;
              b.x += nx * ov; b.y += ny * ov;
              peg.glow = 1;
            }
          }

          // Angled wall collisions — keep ball inside the peg triangle
          for (const wall of s.leftWall) {
            const wallY = b.y;
            if (wallY >= wall.y1 && wallY <= wall.y2) {
              const t = (wallY - wall.y1) / (wall.y2 - wall.y1);
              const wallX = wall.x1 + t * (wall.x2 - wall.x1) - s.gapX * 0.5;
              if (b.x < wallX + b.r) {
                b.x = wallX + b.r;
                b.vx = Math.abs(b.vx) * 0.5;
              }
            }
          }
          for (const wall of s.rightWall) {
            const wallY = b.y;
            if (wallY >= wall.y1 && wallY <= wall.y2) {
              const t = (wallY - wall.y1) / (wall.y2 - wall.y1);
              const wallX = wall.x1 + t * (wall.x2 - wall.x1) + s.gapX * 0.5;
              if (b.x > wallX - b.r) {
                b.x = wallX - b.r;
                b.vx = -Math.abs(b.vx) * 0.5;
              }
            }
          }

          // Hard screen walls as last resort
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.5; }
          if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.5; }

          // Slot landing
          if (b.y >= (s.slots[0]?.y || H)) {
            b.settled = true; b.vy = 0; b.vx = 0;
            for (const sl of s.slots) {
              if (b.x >= sl.x && b.x <= sl.x + sl.w) { sl.glow = 1; break; }
            }
            // Trigger win display from settled ball
            if (typeof (b as any)._onSettle === "function") (b as any)._onSettle();
            setTimeout(() => { b.alive = false; }, 800);
          }
        }

        // Draw trail
        b.trail.forEach((t, ti) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, b.r * 0.6 * (ti / b.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,215,0,${t.a * 0.3})`; ctx.fill();
        });

        // Draw glow
        const gg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3);
        gg.addColorStop(0, "rgba(255,215,0,0.3)"); gg.addColorStop(1, "transparent");
        ctx.fillStyle = gg;
        ctx.fillRect(b.x - b.r * 3, b.y - b.r * 3, b.r * 6, b.r * 6);

        // Draw ball
        const bg2 = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
        bg2.addColorStop(0, "#fff8e1"); bg2.addColorStop(0.3, "#FFD700");
        bg2.addColorStop(0.8, "#FFA000"); bg2.addColorStop(1, "#E65100");
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = bg2; ctx.fill();

        // Shine
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill();
      }
    }
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, [calcLayout]);

  useEffect(() => { calcLayout(); }, [risk, calcLayout]);

  function spawnParticles(count: number, isJP: boolean) {
    const colors = isJP
      ? ["#FFD700", "#FF6D00", "#FF3D00", "#FFAB00", "#fff"]
      : ["#FFD700", "#FFC107", "#00E676", "#fff"];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      const sz = 4 + Math.random() * 10;
      Object.assign(p.style, {
        position: "absolute", width: `${sz}px`, height: `${sz}px`,
        left: `${10 + Math.random() * 80}%`, top: `${-5 + Math.random() * 20}%`,
        background: colors[Math.floor(Math.random() * colors.length)],
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        pointerEvents: "none", zIndex: "50",
        animation: `particleFall ${1.5 + Math.random() * 2}s linear ${Math.random() * 0.5}s forwards`,
      });
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 4000);
    }
  }

  const handleDrop = useCallback(async () => {
    if (balance < BET_COST) return;
    setBalance((b) => b - BET_COST);

    try {
      const res = await fetch("/api/lucky-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ risk }),
      });
      const data: DropResult = await res.json();

      const s = stateRef.current;
      const ballR = Math.max(8, s.W * 0.015);
      const ball: Ball = {
        x: s.W / 2 + (Math.random() - 0.5) * s.gapX * 0.5,
        y: s.startY - 40,
        vx: (Math.random() - 0.5) * 1,
        vy: 0, r: ballR,
        alive: true, settled: false,
        trail: [], targetSlot: data.slotIndex,
        data,
      };

      // Called when ball physically settles into a slot
      (ball as any)._onSettle = () => {
        if (data.winAmount > 0) {
          setBalance((b) => b + data.winAmount);
          const isJP = data.multiplier >= 40;
          setResult({
            text: isJP
              ? `${data.multiplier}x — +${data.winAmount} coins!`
              : data.multiplier >= 5
              ? `${data.multiplier}x — +${data.winAmount} coins!`
              : `${data.multiplier}x — +${data.winAmount.toFixed(1)}`,
            isJP,
          });

          if (data.multiplier >= 5) {
            setWinAmount(data.winAmount);
            setShowWin(true);
            spawnParticles(isJP ? 50 : 20, isJP);
            setTimeout(() => setShowWin(false), 2200);
          }

          setTimeout(() => setResult(null), 2500);
        } else {
          setResult({ text: "0x — No win", isJP: false });
          setTimeout(() => setResult(null), 2000);
        }
      };

      s.balls.push(ball);
    } catch {
      setBalance((b) => b + BET_COST);
    }
  }, [balance, risk]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#050a1a] overflow-hidden">
      <style>{`
        @keyframes particleFall {
          0% { opacity:1; transform:translateY(0) rotate(0deg) scale(1); }
          100% { opacity:0; transform:translateY(100vh) rotate(720deg) scale(.2); }
        }
      `}</style>

      <canvas ref={canvasRef} className="absolute inset-0 z-[1]" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3.5 z-10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/[0.12] flex items-center justify-center text-white/60 backdrop-blur-lg active:scale-[0.95] transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4l8 8M12 4L4 12" />
          </svg>
        </button>
        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[22px] px-5 py-2 flex flex-col items-center gap-px">
          <div className="flex items-center gap-1.5 font-bold text-[17px] text-white" style={{ fontFamily: "var(--font-outfit)" }}>
            <span className="text-[14px]">₾</span>
            {BET_COST}
          </div>
          <span className="text-[10px] text-white/[0.45] font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-sans)" }}>Lucky Drop</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Risk Selector */}
      <div className="absolute top-[68px] left-0 right-0 z-10 flex justify-center gap-1.5" style={{ marginTop: "env(safe-area-inset-top, 0px)" }}>
        {(["low", "mid", "high"] as RiskLevel[]).map((r) => (
          <button
            key={r}
            onClick={() => setRisk(r)}
            className={`px-4 py-1 rounded-full text-[11px] font-bold border backdrop-blur-lg transition-all active:scale-[0.95] ${
              risk === r
                ? r === "low"
                  ? "bg-green-500/20 text-green-400 border-green-400"
                  : r === "mid"
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-400"
                  : "bg-red-500/20 text-red-400 border-red-400"
                : "bg-white/5 text-white/50 border-white/10"
            }`}
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            {r === "low" ? "Low" : r === "mid" ? "Medium" : "High"}
          </button>
        ))}
      </div>

      {/* Win Overlay */}
      <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 ${showWin ? "opacity-100" : "opacity-0"}`}>
        <span className="text-[52px] font-black bg-gradient-to-br from-yellow-400 to-amber-600 bg-clip-text text-transparent animate-pulse" style={{ filter: "drop-shadow(0 0 30px rgba(255,215,0,.5))", fontFamily: "var(--font-outfit)" }}>
          +{winAmount}
        </span>
        <span className="text-[15px] text-white/60 mt-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
          {result?.isJP ? "JACKPOT!" : "Coins Won!"}
        </span>
      </div>

      {/* Bottom UI */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-10 pointer-events-none gap-2.5" style={{ paddingBottom: "max(18px, calc(env(safe-area-inset-bottom, 0px) + 12px))" }}>
        <div
          className={`text-[15px] font-bold min-h-[22px] text-center transition-all duration-300 ${
            result ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"
          } ${result?.isJP ? "text-[20px] text-red-500" : "text-yellow-400"}`}
          style={{ textShadow: result?.isJP ? "0 0 30px rgba(255,61,0,.7)" : "0 0 20px rgba(255,215,0,.5)", fontFamily: "var(--font-outfit)" }}
        >
          {result?.text || ""}
        </div>

        <button
          onClick={handleDrop}
          disabled={balance < BET_COST}
          className="pointer-events-auto px-12 py-6 rounded-full text-[19px] font-black tracking-wide transition-all duration-150 active:scale-[0.97] disabled:bg-[#3a3a4a] disabled:text-[#777] disabled:cursor-not-allowed"
          style={{
            background: balance < BET_COST ? "#3a3a4a" : "#FFD700",
            color: balance < BET_COST ? "#777" : "#1a1a2e",
            boxShadow: balance < BET_COST ? "none" : "0 4px 24px rgba(255,215,0,.25), inset 0 1px 0 rgba(255,255,255,.3)",
            fontFamily: "var(--font-outfit)",
          }}
        >
          Drop
        </button>

        <div className="pointer-events-auto flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-[30px] px-4 py-2 backdrop-blur-lg">
            <span className="text-[11px] text-white/40" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Balance{" "}
              <span className="text-white font-bold">
                {balance.toLocaleString("en-US", { maximumFractionDigits: 2 })} ₾
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
