"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MULTIPLIERS, SLOT_COLORS, BET_COST, type RiskLevel, type DropResult } from "./drop-config";
import { playGame, ensureActiveTransaction } from "@/services/games";
import { setCoinBalance as storeCoin, setCashBalance as storeCash } from "@/services/balance";
import WinAnimation from "@/components/WinAnimation";

const ROWS = 12;

interface Peg { x: number; y: number; r: number; glow: number }
interface Slot { x: number; y: number; w: number; h: number; mult: number; color: string; glow: number }
interface TrailPoint { x: number; y: number; a: number }

// Path-based ball: follows pre-calculated waypoints
interface Ball {
  x: number; y: number;
  r: number; alive: boolean; settled: boolean;
  trail: TrailPoint[];
  targetSlot: number;
  data: DropResult;
  // Path animation
  path: { x: number; y: number }[];
  pathProgress: number; // 0 to 1
  pathSpeed: number;
}

// Generate a natural path from top to target slot
function generateBallPath(
  startX: number, startY: number,
  targetSlotIdx: number, pegs: Peg[], slots: Slot[],
  gapX: number, gapY: number, rows: number
): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  path.push({ x: startX, y: startY - 30 });

  // Build peg grid: for each row, get the peg positions
  const pegRows: { x: number; y: number }[][] = [];
  let pegIdx = 0;
  for (let row = 0; row < rows; row++) {
    const count = row + 3;
    pegRows.push(pegs.slice(pegIdx, pegIdx + count));
    pegIdx += count;
  }

  // Calculate target X from target slot
  const targetSlot = slots[targetSlotIdx];
  const targetX = targetSlot ? targetSlot.x + targetSlot.w / 2 : startX;

  // Work backwards: determine which column we need at each row to reach target
  // At row N, there are N+3 pegs. The ball falls between pegs.
  // Between peg i and peg i+1, the ball can go left (toward i) or right (toward i+1)

  // Forward approach: start at center, bias toward target
  let currentX = startX;

  for (let row = 0; row < rows; row++) {
    const rowPegs = pegRows[row];
    if (!rowPegs || rowPegs.length === 0) continue;

    // Find closest peg in this row
    let closestPeg = rowPegs[0];
    let closestDist = Infinity;
    for (const p of rowPegs) {
      const d = Math.abs(p.x - currentX);
      if (d < closestDist) { closestDist = d; closestPeg = p; }
    }

    // Decide: go left or right of this peg, biased toward target
    const biasToTarget = (targetX - currentX) * 0.15;
    const randomOffset = (Math.random() - 0.5) * gapX * 0.4;
    const goRight = (biasToTarget + randomOffset) > 0;

    const offsetX = (goRight ? 1 : -1) * gapX * (0.3 + Math.random() * 0.2);
    currentX = closestPeg.x + offsetX;

    // Add slight wobble point above the peg (ball approaching)
    const wobbleX = currentX + (Math.random() - 0.5) * gapX * 0.1;
    path.push({ x: wobbleX, y: closestPeg.y - gapY * 0.15 });

    // Add the bounce point (at peg level)
    path.push({ x: currentX, y: closestPeg.y + gapY * 0.3 });
  }

  // Final: land in the target slot
  path.push({ x: targetX, y: targetSlot ? targetSlot.y + targetSlot.h * 0.3 : startY + rows * gapY });

  return path;
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

  const [balance, setBalance] = useState(0);
  const risk: RiskLevel = "low";
  const [result, setResult] = useState<{ text: string; isJP: boolean } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [betAmount, setBetAmount] = useState(0);
  const [showBetPicker, setShowBetPicker] = useState(true);
  const pendingBallsRef = useRef(0);
  const lastServerCoinsRef = useRef(-1);

  useEffect(() => {
    ensureActiveTransaction().then((tx) => {
      setBalance(tx.coinsRemaining);
      storeCoin(tx.coinsRemaining);
    }).catch(() => {});
  }, []);
  const [bigWinText, setBigWinText] = useState("");
  const [showWinAnim, setShowWinAnim] = useState(false);
  const [winAnimAmount, setWinAnimAmount] = useState(0);
  const [bonusRoundInfo, setBonusRoundInfo] = useState<{ coins: number; gamesLeft: number } | null>(null);
  const dropCount = useRef(0);
  const BET_OPTIONS = [10, 25, 50, 100, 250, 500];

  const riskRef = useRef(risk);

  const calcLayout = useCallback(() => {
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.clientHeight;
    const scale = Math.min(W / 430, 1); // Scale relative to iPhone size
    const pegR = Math.max(3, W * 0.008);
    const cols = ROWS + 2;
    const sidePad = Math.max(20, W * 0.05);
    const gapX = (W - sidePad * 2) / cols;
    const gapY = (H * 0.40) / ROWS;
    const startY = H * 0.20;
    const slotH = H * 0.06;

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
    const totalW2 = cols * gapX;
    const sx2 = sidePad;
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
      cvs!.width = document.documentElement.clientWidth;
      cvs!.height = document.documentElement.clientHeight;
      calcLayout();
    }
    resize();
    // Debounce so iOS URL-bar/pull-to-refresh gestures (which fire rapid
    // resize events) don't cause the board to visibly stretch.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener("resize", debouncedResize);

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

      // Pegs — bright, crisp dots with a soft blue glow
      for (const peg of s.pegs) {
        peg.glow *= 0.92;

        // Purple impact halo on collision (unchanged)
        if (peg.glow > 0.05) {
          const g = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, peg.r * 5);
          g.addColorStop(0, `rgba(124,77,255,${peg.glow * 0.5})`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fillRect(peg.x - peg.r * 5, peg.y - peg.r * 5, peg.r * 10, peg.r * 10);
        }

        // Visual radius is a hair bigger than physics radius for a clean read
        // (does not affect collision — peg.r is unchanged).
        const visR = peg.r + 0.5;

        ctx.save();
        ctx.shadowColor = "rgba(150,180,255,0.9)";
        ctx.shadowBlur = 3 + peg.glow * 5;

        const pg = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, visR);
        pg.addColorStop(0, "rgba(255,255,255,1)");
        pg.addColorStop(0.6, "rgba(210,220,255,0.98)");
        pg.addColorStop(1, "rgba(160,180,235,0.95)");
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, visR, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.restore();

        // Crisp hairline outer ring
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, visR + 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,215,255,${0.55 + peg.glow * 0.45})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
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
        ctx.fillText(sl.mult === 0 ? "0" : "WIN", sl.x + sl.w / 2, sl.y + sl.h / 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(sl.x + sl.w - 0.5, sl.y, 1, sl.h);
      }

      // Balls — path-based animation
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i];
        if (!b.alive) { s.balls.splice(i, 1); continue; }

        if (!b.settled) {
          // Advance along path
          b.pathProgress += b.pathSpeed;

          if (b.pathProgress >= 1) {
            // Reached end of path — settle
            b.pathProgress = 1;
            b.settled = true;
            const last = b.path[b.path.length - 1];
            b.x = last.x;
            b.y = last.y;

            // Glow the landing slot
            for (const sl of s.slots) {
              if (b.x >= sl.x && b.x <= sl.x + sl.w) { sl.glow = 1; break; }
            }
            if (typeof (b as any)._onSettle === "function") (b as any)._onSettle();
            setTimeout(() => { b.alive = false; }, 500);
          } else {
            // Interpolate position along path with easing
            const totalLen = b.path.length - 1;
            const rawIdx = b.pathProgress * totalLen;
            const idx = Math.floor(rawIdx);
            const frac = rawIdx - idx;

            const p0 = b.path[Math.min(idx, totalLen)];
            const p1 = b.path[Math.min(idx + 1, totalLen)];

            // Ease-in for Y (gravity feel), smooth for X
            const easedFrac = frac;
            b.x = p0.x + (p1.x - p0.x) * easedFrac;
            b.y = p0.y + (p1.y - p0.y) * easedFrac;

            // Speed up as ball falls (gravity acceleration)
            b.pathSpeed = Math.min(0.022, b.pathSpeed + 0.00010);

            // Light up nearby pegs
            for (const peg of s.pegs) {
              const dx = b.x - peg.x, dy = b.y - peg.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < s.gapY * 0.4) {
                peg.glow = Math.max(peg.glow, 1 - dist / (s.gapY * 0.4));
              }
            }
          }

          // Trail
          b.trail.push({ x: b.x, y: b.y, a: 1 });
          if (b.trail.length > 14) b.trail.shift();
          b.trail.forEach((t) => (t.a *= 0.88));
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
      window.removeEventListener("resize", debouncedResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      cancelAnimationFrame(animId);
    };
  }, [calcLayout]);

  useEffect(() => { calcLayout(); }, [calcLayout]);

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

  const handleDrop = useCallback(() => {
    if (betAmount <= 0 || balance < betAmount) return;
    // Block drops while win animation is playing
    if (showWinAnim) return;

    // Deduct locally for instant UI feedback
    setBalance((prev) => prev - betAmount);
    pendingBallsRef.current++;
    dropCount.current++;

    const currentRisk = risk;
    const currentBet = betAmount;

    // Fire API immediately (parallel — no queue)
    playGame("plinko").then((serverResult: any) => {
      // Always keep the LOWEST server balance (most up-to-date after all deductions)
      if (lastServerCoinsRef.current < 0 || serverResult.coinsRemaining < lastServerCoinsRef.current) {
        lastServerCoinsRef.current = serverResult.coinsRemaining;
      }

      // Handle bonus round: coins hit 0, then bonus coins added after a delay
      if (serverResult.bonusRound && serverResult.freeCoins) {
        // Balance should show 0 first, then bonus coins appear after notification
        lastServerCoinsRef.current = 0;
        setTimeout(() => {
          setBonusRoundInfo({ coins: serverResult.freeCoins, gamesLeft: serverResult.bonusGamesLeft || 0 });
          // Update balance to bonus coins after showing notification
          setTimeout(() => {
            setBalance(serverResult.freeCoins);
            storeCoin(serverResult.freeCoins);
            lastServerCoinsRef.current = serverResult.freeCoins;
          }, 800);
        }, 500);
      } else if (serverResult.transactionComplete) {
        setBonusRoundInfo(null);
      }

      // Map server result to slot: WIN → random green slot, LOSE → random red slot
      const mults = MULTIPLIERS[currentRisk];
      const won = serverResult.totalWin > 0;
      let closestIdx: number;
      if (won) {
        // Pick a random WIN slot (indices where mult > 0)
        const winSlots = mults.map((m, i) => ({ m, i })).filter(s => s.m > 0);
        closestIdx = winSlots[Math.floor(Math.random() * winSlots.length)].i;
      } else {
        // Pick a random LOSE slot (indices where mult === 0), prefer ones near center
        const loseSlots = mults.map((m, i) => ({ m, i })).filter(s => s.m === 0);
        closestIdx = loseSlots[Math.floor(Math.random() * loseSlots.length)].i;
      }

      const data: DropResult = {
        slotIndex: closestIdx,
        multiplier: mults[closestIdx],
        winAmount: serverResult.totalWin,
        risk: currentRisk,
      };

      const s = stateRef.current;
      const ballR = Math.max(8, s.W * 0.015);
      const startX = s.W / 2 + (Math.random() - 0.5) * s.gapX * 0.4;
      const path = generateBallPath(startX, s.startY, data.slotIndex, s.pegs, s.slots, s.gapX, s.gapY, ROWS);
      const ball: Ball = {
        x: startX,
        y: s.startY - 30,
        r: ballR,
        alive: true, settled: false,
        trail: [], targetSlot: data.slotIndex,
        data,
        path,
        pathProgress: 0,
        pathSpeed: 0.007 + Math.random() * 0.003,
      };

      (ball as any)._onSettle = () => {
        pendingBallsRef.current--;
        // Show win effects
        if (serverResult.totalWin > 0) {
          storeCash(serverResult.newBalance);
        }
        if (serverResult.totalWin > 0 && serverResult.won) {
          setWinAmount(serverResult.totalWin);
          spawnParticles(serverResult.bonusWin > 20 ? 50 : 20, serverResult.bonusWin > 20);
          // Trigger the new fancy win animation overlay
          setWinAnimAmount(serverResult.totalWin);
          setShowWinAnim(true);
        }
        // Always sync to server balance — never let it go UP from local
        setBalance((prev) => Math.min(prev, serverResult.coinsRemaining));
        // When last ball settles, set exact server balance and reset for next batch
        if (pendingBallsRef.current === 0) {
          setBalance(lastServerCoinsRef.current);
          storeCoin(lastServerCoinsRef.current);
          lastServerCoinsRef.current = -1;
        }
      };

      s.balls.push(ball);
    }).catch((err: any) => {
      // API failed — restore the local deduction
      console.error("Drop API error:", err.message);
      pendingBallsRef.current--;
      setBalance((prev) => prev + currentBet);
      if (pendingBallsRef.current === 0 && lastServerCoinsRef.current >= 0) {
        setBalance(lastServerCoinsRef.current);
        storeCoin(lastServerCoinsRef.current);
        lastServerCoinsRef.current = -1;
      }
      // Show error briefly
      setBigWinText(err.message || "\u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D0");
      setTimeout(() => setBigWinText(""), 2000);
    });
  }, [balance, betAmount, showWinAnim]);

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#050a1a] overflow-hidden"
      style={{ overscrollBehavior: "none", touchAction: "none" }}
    >
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
            <img src="/images/coin-icon.png" alt="coin" width={16} height={16} style={{ objectFit: "contain" }} />
            {betAmount > 0 ? betAmount : "—"}
          </div>
          <span className="text-[10px] text-white/[0.45] font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-sans)" }}>Lucky Drop</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Risk selector removed — single mode */}

      {/* Win animation overlay — coin/bill rain + slot counter ramping to winAmount */}
      <WinAnimation
        show={showWinAnim}
        amount={winAnimAmount}
        onDone={() => setShowWinAnim(false)}
      />

      {/* Bonus round banner */}
      {bonusRoundInfo && (
        <div className="absolute left-0 right-0 z-20 flex justify-center" style={{ top: "calc(env(safe-area-inset-top, 0px) + 70px)" }}>
          <div className="px-5 py-3 rounded-[16px] text-center" style={{ background: "rgba(255,215,0,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,215,0,0.3)" }}>
            <p className="text-[14px] font-bold" style={{ color: "#FFD700", fontFamily: "var(--font-outfit)" }}>
              {"\uD83C\uDF89 \u10D1\u10DD\u10DC\u10E3\u10E1 \u10E0\u10D0\u10E3\u10DC\u10D3\u10D8!"}
            </p>
            <p className="text-[12px] mt-1" style={{ color: "rgba(255,215,0,0.7)", fontFamily: "var(--font-dm-sans)" }}>
              {"\u10E3\u10E4\u10D0\u10E1\u10DD \u10E5\u10DD\u10D8\u10DC\u10D4\u10D1\u10D8: "}{bonusRoundInfo.coins} {bonusRoundInfo.gamesLeft > 0 && ` \u2022 \u10D3\u10D0\u10E0\u10E9\u10D0: ${bonusRoundInfo.gamesLeft}`}
            </p>
          </div>
        </div>
      )}

      {/* Bottom UI */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-10 pointer-events-none gap-3" style={{ paddingBottom: "max(18px, calc(env(safe-area-inset-bottom, 0px) + 12px))" }}>
        <div className="min-h-[4px]" />

        {/* Pick amount label */}
        {showBetPicker && (
          <p className="text-white/50 text-[14px] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Pick amount to play
          </p>
        )}

        {/* Bet picker pills */}
        {showBetPicker && (
          <div className="pointer-events-auto flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide w-full max-w-[420px]">
            {BET_OPTIONS.map((amt) => (
              <button
                key={amt}
                onClick={() => { setBetAmount(amt); setShowBetPicker(false); }}
                className="shrink-0 px-8 py-5 rounded-full text-[20px] font-bold active:scale-[0.95] transition-transform"
                style={{ background: "#FFD700", color: "#1a1a2e", fontFamily: "var(--font-outfit)" }}
              >
                {amt}
              </button>
            ))}
          </div>
        )}

        {/* Drop button (after bet selected) */}
        {!showBetPicker && betAmount > 0 && (
          <button
            onClick={handleDrop}
            disabled={balance < betAmount}
            className="pointer-events-auto px-12 py-6 rounded-full text-[19px] font-black tracking-wide transition-all duration-150 active:scale-[0.97] disabled:bg-[#3a3a4a] disabled:text-[#777] disabled:cursor-not-allowed"
            style={{
              background: balance < betAmount ? "#3a3a4a" : "#FFD700",
              color: balance < betAmount ? "#777" : "#1a1a2e",
              boxShadow: balance < betAmount ? "none" : "0 4px 24px rgba(255,215,0,.25), inset 0 1px 0 rgba(255,255,255,.3)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            Drop
          </button>
        )}

        {/* Balance bar — same pill shape as Drop button */}
        <button
          onClick={() => setShowBetPicker(true)}
          className="pointer-events-auto px-8 py-4 rounded-full active:scale-[0.97] transition-transform"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex flex-col items-center gap-0.5">
            {betAmount > 0 && (
              <div className="flex items-center gap-1.5">
                <img src="/images/coin-icon.png" alt="coin" width={15} height={15} style={{ objectFit: "contain" }} />
                <span className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                  {betAmount}
                </span>
                <span className="text-white/30 text-[13px]">&rsaquo;</span>
              </div>
            )}
            <span className="text-[11px] text-white/40" style={{ fontFamily: "var(--font-dm-sans)" }}>
              {betAmount > 0 ? "Balance " : "Pick amount to play"}
              {betAmount > 0 && (
                <span className="text-white font-bold">
                  {balance.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                </span>
              )}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
