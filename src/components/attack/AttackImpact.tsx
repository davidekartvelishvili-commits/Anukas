"use client";

import React, { useEffect, useRef } from "react";

interface Props {
  outcome: "coins_stolen" | "empty_burn" | "shield_blocked";
  coinsTransferred: number;
  onDone: () => void;
}

export default function AttackImpact({ outcome, coinsTransferred, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  // Sound
  useEffect(() => {
    try {
      if (outcome === "shield_blocked") {
        const a = new Audio("/audio/shield-win.mp3");
        a.volume = 0.8;
        a.play().catch(() => {});
      } else {
        const a = new Audio("/audio/battle.mp3");
        a.volume = 0.9;
        a.play().catch(() => {});
      }
    } catch {}
  }, [outcome]);

  // Particle effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 360 * dpr;
    canvas.height = 400 * dpr;
    ctx.scale(dpr, dpr);

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      r: number; color: string; life: number; maxLife: number;
    }> = [];

    const cx = 180, cy = 180;

    // Spawn particles based on outcome
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      let color: string;
      if (outcome === "coins_stolen") color = Math.random() > 0.5 ? "#F9E741" : "#FFD700";
      else if (outcome === "shield_blocked") color = Math.random() > 0.5 ? "#88CCFF" : "#AADDFF";
      else color = Math.random() > 0.5 ? "#FF6633" : "#FF4411";

      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 3,
        color,
        life: 0,
        maxLife: 40 + Math.random() * 30,
      });
    }

    let raf = 0;
    function draw() {
      ctx!.clearRect(0, 0, 360, 400);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life++;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (alpha <= 0) continue;
        alive = true;
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [outcome]);

  const title = outcome === "coins_stolen"
    ? `+${coinsTransferred} Coins Taken!`
    : outcome === "shield_blocked"
    ? "Shield Blocked!"
    : "Burned!";

  const titleGe = outcome === "coins_stolen"
    ? `აიღე ${coinsTransferred} კოინი!`
    : outcome === "shield_blocked"
    ? "ფარმა დაიცვა!"
    : "დაიწვა!";

  const titleColor = outcome === "coins_stolen" ? "#F9E741"
    : outcome === "shield_blocked" ? "#88CCFF"
    : "#FF4411";

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center overflow-hidden" onClick={onDone} style={{ pointerEvents: "auto" }}>
      <style>{impactCss}</style>
      {/* Screen shake */}
      <div className={`atki-shake ${outcome === "coins_stolen" ? "atki-shake-heavy" : outcome === "shield_blocked" ? "atki-shake-light" : "atki-shake-med"}`}>
        {/* Dark overlay */}
        <div className="fixed inset-0" style={{ background: "rgba(0,0,0,0.6)" }} />

        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 360, height: 400, zIndex: 2 }}
        />

        {/* Outcome icon */}
        <div className="atki-icon" style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 3 }}>
          {outcome === "shield_blocked" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/images/shield.png" alt="" width={100} height={100} className="atki-bounce" style={{ objectFit: "contain" }} />
          )}
          {outcome === "coins_stolen" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/images/coin-icon.png" alt="" width={80} height={80} className="atki-bounce" style={{ objectFit: "contain" }} />
          )}
          {outcome === "empty_burn" && (
            <div className="atki-bounce" style={{ fontSize: 60 }}>🔥</div>
          )}
        </div>

        {/* Text */}
        <div className="atki-text" style={{ position: "absolute", top: "58%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 3, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: titleColor, textShadow: `0 0 20px ${titleColor}80, 0 2px 0 rgba(0,0,0,0.7)`, fontFamily: "var(--font-outfit)" }}>
            {title}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: 6, fontFamily: "var(--font-dm-sans)" }}>
            {titleGe}
          </div>
        </div>
      </div>
    </div>
  );
}

const impactCss = `
.atki-shake-light{animation:atkiShake .3s ease-out}
.atki-shake-med{animation:atkiShake .4s ease-out}
.atki-shake-heavy{animation:atkiShakeHeavy .5s ease-out}
@keyframes atkiShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-4px,3px)}40%{transform:translate(3px,-3px)}60%{transform:translate(-3px,4px)}80%{transform:translate(4px,-2px)}}
@keyframes atkiShakeHeavy{0%,100%{transform:translate(0,0)}10%{transform:translate(-8px,6px)}25%{transform:translate(7px,-7px)}40%{transform:translate(-6px,8px)}55%{transform:translate(8px,-4px)}70%{transform:translate(-5px,6px)}85%{transform:translate(4px,-5px)}}
.atki-bounce{animation:atkiBounce .6s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes atkiBounce{0%{transform:scale(0) rotate(-15deg);opacity:0}40%{transform:scale(1.3) rotate(5deg);opacity:1}60%{transform:scale(.9) rotate(-3deg)}80%{transform:scale(1.05) rotate(1deg)}100%{transform:scale(1) rotate(0);opacity:1}}
.atki-text{animation:atkiTextIn .5s ease-out .3s both}
@keyframes atkiTextIn{0%{opacity:0;transform:translate(-50%,-50%) translateY(20px) scale(.9)}100%{opacity:1;transform:translate(-50%,-50%) translateY(0) scale(1)}}
`;
