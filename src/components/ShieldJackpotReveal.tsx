"use client";

import React, { useState, useEffect } from "react";

// ============================================================================
// SHIELD JACKPOT REVEAL
// - Transparent background (drops onto any game scene)
// - 4.5s total animation, multi-phase reveal
// - Casino palette: gold, red, magenta, cyan
// ============================================================================

const SHIELD_SRC = "/images/shield.png";

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const CASINO_COLORS = ["#FFD700", "#FF3B5C", "#FF2EC4", "#00E5FF", "#FFF4A3", "#B967FF"];
const CONFETTI_COLORS = ["#FFD700", "#FF3B5C", "#FF2EC4", "#00E5FF", "#9FFF5B", "#FFFFFF"];

function generateParticles() {
  const sparks = Array.from({ length: 36 }, (_, i) => ({
    id: i, angle: (i / 36) * 360 + rand(-5, 5), distance: rand(180, 320),
    size: rand(4, 9), delay: rand(0, 0.2), duration: rand(1.0, 1.6), color: pick(CASINO_COLORS),
  }));
  const sparks2 = Array.from({ length: 24 }, (_, i) => ({
    id: i, angle: (i / 24) * 360 + rand(-8, 8), distance: rand(160, 280),
    size: rand(3, 7), delay: rand(1.2, 1.6), duration: rand(0.9, 1.4), color: pick(CASINO_COLORS),
  }));
  const confetti = Array.from({ length: 32 }, (_, i) => ({
    id: i, angle: (i / 32) * 360 + rand(-10, 10), distance: rand(220, 380),
    w: rand(6, 11), h: rand(10, 18), delay: rand(0.35, 0.6), duration: rand(2.0, 2.8),
    spin: rand(540, 1200) * (Math.random() > 0.5 ? 1 : -1), color: pick(CONFETTI_COLORS),
  }));
  const coins = Array.from({ length: 18 }, (_, i) => ({
    id: i, angle: (i / 18) * 360 + rand(-8, 8), distance: rand(200, 340),
    size: rand(16, 26), delay: rand(0.3, 0.5), duration: rand(1.4, 2.0),
    spin: rand(480, 1000) * (Math.random() > 0.5 ? 1 : -1),
  }));
  const glitter = Array.from({ length: 48 }, (_, i) => ({
    id: i, angle: rand(0, 360), distance: rand(90, 240),
    size: rand(2, 4), delay: rand(0.3, 3.5), duration: rand(1.2, 2.2),
    color: pick(["#FFFFFF", "#FFF4A3", "#00E5FF", "#FF2EC4"]),
  }));
  const streaks = Array.from({ length: 10 }, (_, i) => ({
    id: i, angle: (i / 10) * 360, delay: rand(0, 0.08),
  }));
  return { sparks, sparks2, confetti, coins, glitter, streaks };
}

interface Props {
  onDone: () => void;
}

export default function ShieldJackpotReveal({ onDone }: Props) {
  const [particles] = useState(generateParticles);

  useEffect(() => {
    const timer = setTimeout(onDone, 4500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const { sparks, sparks2, confetti, coins, glitter, streaks } = particles;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "transparent", pointerEvents: "auto" }}
      onClick={onDone}
    >
      <style>{css}</style>
      <div style={{ position: "relative", width: "min(92vw, 520px)", aspectRatio: "1/1" }}>
        {/* Screen flash */}
        <div className="sjr-flash sjr-play" />

        {/* Radial rays */}
        <div className="sjr-rays sjr-play">
          <svg viewBox="-200 -200 400 400" width="100%" height="100%">
            <defs>
              <linearGradient id="sjrRayGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="0" />
                <stop offset="40%" stopColor="#FFD700" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFF4A3" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="sjrRayPink" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF2EC4" stopOpacity="0" />
                <stop offset="40%" stopColor="#FF2EC4" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FF3B5C" stopOpacity="0" />
              </linearGradient>
            </defs>
            {Array.from({ length: 20 }).map((_, i) => (
              <polygon key={i} points="-12,-400 12,-400 0,0"
                fill={i % 2 === 0 ? "url(#sjrRayGold)" : "url(#sjrRayPink)"}
                transform={`rotate(${(i * 360) / 20})`} />
            ))}
          </svg>
        </div>

        {/* Halo rings */}
        <div className="sjr-halo sjr-halo-outer sjr-play" />
        <div className="sjr-halo sjr-halo-mid sjr-play" />
        <div className="sjr-halo sjr-halo-inner sjr-play" />

        {/* Pulsing aura */}
        <div className="sjr-aura sjr-play" />

        {/* Streaks */}
        <div className="sjr-streaks sjr-play">
          {streaks.map((s) => (
            <div key={s.id} className="sjr-streak"
              style={{ transform: `rotate(${s.angle}deg)`, animationDelay: `${s.delay}s` }} />
          ))}
        </div>

        {/* Confetti */}
        <div className="sjr-confetti sjr-play">
          {confetti.map((c) => {
            const rad = (c.angle * Math.PI) / 180;
            return (
              <div key={c.id} className="sjr-confetto" style={{
                width: c.w, height: c.h, background: c.color, boxShadow: `0 0 8px ${c.color}`,
                "--tx": `${Math.cos(rad) * c.distance}px`, "--ty": `${Math.sin(rad) * c.distance}px`,
                "--spin": `${c.spin}deg`, animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s`,
              } as any} />
            );
          })}
        </div>

        {/* Coins */}
        <div className="sjr-coins sjr-play">
          {coins.map((c) => {
            const rad = (c.angle * Math.PI) / 180;
            return (
              <div key={c.id} className="sjr-coin" style={{
                width: c.size, height: c.size,
                "--tx": `${Math.cos(rad) * c.distance}px`, "--ty": `${Math.sin(rad) * c.distance}px`,
                "--spin": `${c.spin}deg`, animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s`,
              } as any} />
            );
          })}
        </div>

        {/* Sparks */}
        <div className="sjr-sparks sjr-play">
          {sparks.map((s) => {
            const rad = (s.angle * Math.PI) / 180;
            return (
              <div key={s.id} className="sjr-spark" style={{
                width: s.size, height: s.size, background: s.color,
                boxShadow: `0 0 12px ${s.color}, 0 0 24px ${s.color}`,
                "--tx": `${Math.cos(rad) * s.distance}px`, "--ty": `${Math.sin(rad) * s.distance}px`,
                animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`,
              } as any} />
            );
          })}
        </div>
        <div className="sjr-sparks sjr-play">
          {sparks2.map((s) => {
            const rad = (s.angle * Math.PI) / 180;
            return (
              <div key={`b-${s.id}`} className="sjr-spark" style={{
                width: s.size, height: s.size, background: s.color,
                boxShadow: `0 0 10px ${s.color}, 0 0 20px ${s.color}`,
                "--tx": `${Math.cos(rad) * s.distance}px`, "--ty": `${Math.sin(rad) * s.distance}px`,
                animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`,
              } as any} />
            );
          })}
        </div>

        {/* Glitter */}
        <div className="sjr-glitter sjr-play">
          {glitter.map((g) => {
            const rad = (g.angle * Math.PI) / 180;
            return (
              <div key={g.id} className="sjr-glitter-dot" style={{
                width: g.size, height: g.size, background: g.color,
                boxShadow: `0 0 6px ${g.color}, 0 0 12px ${g.color}`,
                "--tx": `${Math.cos(rad) * g.distance}px`, "--ty": `${Math.sin(rad) * g.distance}px`,
                animationDelay: `${g.delay}s`, animationDuration: `${g.duration}s`,
              } as any} />
            );
          })}
        </div>

        {/* Shield */}
        <div className="sjr-shield-wrap sjr-play">
          <div className="sjr-shield-float">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHIELD_SRC} alt="Shield reward" className="sjr-shield-img" draggable={false} />
          </div>
        </div>

        {/* Label */}
        <div className="sjr-label sjr-play">
          <div className="sjr-label-small">REWARD UNLOCKED</div>
          <div className="sjr-label-big">SHIELD</div>
        </div>
      </div>
    </div>
  );
}

const css = `
.sjr-flash,.sjr-rays,.sjr-halo,.sjr-aura,.sjr-streaks,.sjr-confetti,.sjr-coins,.sjr-sparks,.sjr-glitter,.sjr-shield-wrap,.sjr-label{position:absolute;inset:0;pointer-events:none;will-change:transform,opacity}
.sjr-flash{background:radial-gradient(circle at center,rgba(255,255,255,0.95) 0%,rgba(255,215,0,0.5) 25%,rgba(255,46,196,0.25) 45%,transparent 65%);opacity:0;mix-blend-mode:screen;border-radius:50%}
.sjr-flash.sjr-play{animation:sjrFlash .6s ease-out .45s forwards}
@keyframes sjrFlash{0%{opacity:0;transform:scale(.5)}20%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1.3)}}
.sjr-rays{display:flex;align-items:center;justify-content:center;opacity:0;filter:blur(.5px)}
.sjr-rays.sjr-play{animation:sjrRays 4.5s cubic-bezier(.16,1,.3,1) .35s forwards}
@keyframes sjrRays{0%{opacity:0;transform:scale(.3) rotate(0)}15%{opacity:.95;transform:scale(1.05) rotate(10deg)}40%{opacity:.7;transform:scale(1) rotate(25deg)}100%{opacity:.45;transform:scale(1.05) rotate(60deg)}}
.sjr-halo{display:flex;align-items:center;justify-content:center;opacity:0}
.sjr-halo::before{content:'';border-radius:50%;border:3px solid transparent;background:conic-gradient(from 0deg,transparent 0deg,#FFD700 40deg,#FF2EC4 80deg,transparent 120deg,transparent 200deg,#00E5FF 240deg,#FFD700 280deg,transparent 320deg,transparent 360deg) border-box;-webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;filter:drop-shadow(0 0 14px #FFD700) drop-shadow(0 0 8px #FF2EC4)}
.sjr-halo-outer::before{width:88%;height:88%}.sjr-halo-mid::before{width:70%;height:70%;border-width:2px}.sjr-halo-inner::before{width:55%;height:55%;border-width:2px}
.sjr-halo-outer.sjr-play{animation:sjrHalo 4.5s ease-out .5s forwards}.sjr-halo-mid.sjr-play{animation:sjrHalo 4.5s ease-out .6s forwards}.sjr-halo-inner.sjr-play{animation:sjrHalo 4.5s ease-out .7s forwards}
@keyframes sjrHalo{0%{opacity:0;transform:scale(.4)}20%{opacity:1;transform:scale(1.08)}40%{opacity:.9;transform:scale(1)}100%{opacity:.75;transform:scale(1)}}
.sjr-halo-outer.sjr-play::before{animation:sjrSpinCW 7s linear .5s infinite}.sjr-halo-mid.sjr-play::before{animation:sjrSpinCCW 5s linear .6s infinite}.sjr-halo-inner.sjr-play::before{animation:sjrSpinCW 3.5s linear .7s infinite}
@keyframes sjrSpinCW{to{transform:rotate(360deg)}}@keyframes sjrSpinCCW{to{transform:rotate(-360deg)}}
.sjr-aura{display:flex;align-items:center;justify-content:center;opacity:0}
.sjr-aura::before{content:'';width:60%;height:60%;border-radius:50%;background:radial-gradient(circle,rgba(255,215,0,.75) 0%,rgba(255,46,196,.4) 35%,rgba(0,229,255,.2) 65%,transparent 85%);filter:blur(24px)}
.sjr-aura.sjr-play{animation:sjrAuraIn .8s ease-out .35s forwards}.sjr-aura.sjr-play::before{animation:sjrAuraPulse 1.8s ease-in-out 1s infinite}
@keyframes sjrAuraIn{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}
@keyframes sjrAuraPulse{0%,100%{transform:scale(1);opacity:.85;filter:blur(24px) hue-rotate(0)}50%{transform:scale(1.22);opacity:1;filter:blur(28px) hue-rotate(30deg)}}
.sjr-streaks{display:flex;align-items:center;justify-content:center}
.sjr-streak{position:absolute;left:50%;top:50%;width:5px;height:280px;margin-left:-2.5px;margin-top:-140px;background:linear-gradient(to top,transparent 0%,rgba(255,215,0,.9) 40%,rgba(255,255,255,1) 50%,rgba(255,46,196,.9) 60%,transparent 100%);transform-origin:center;filter:blur(1.2px) drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 6px #FF2EC4);opacity:0}
.sjr-streaks.sjr-play .sjr-streak{animation:sjrStreak 1.3s cubic-bezier(.22,1,.36,1) forwards}
@keyframes sjrStreak{0%{opacity:0}20%{opacity:1}60%{opacity:.7}100%{opacity:0}}
.sjr-confetti{display:flex;align-items:center;justify-content:center}
.sjr-confetto{position:absolute;left:50%;top:50%;border-radius:2px;transform:translate(-50%,-50%) scale(0);opacity:0}
.sjr-confetti.sjr-play .sjr-confetto{animation:sjrConfetti cubic-bezier(.2,.6,.3,1) forwards}
@keyframes sjrConfetti{0%{transform:translate(-50%,-50%) scale(0) rotate(0);opacity:0}10%{transform:translate(-50%,-50%) scale(1) rotate(20deg);opacity:1}70%{opacity:1}100%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty) + 120px)) scale(.7) rotate(var(--spin));opacity:0}}
.sjr-coins{display:flex;align-items:center;justify-content:center}
.sjr-coin{position:absolute;left:50%;top:50%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFF4A3 0%,#FFD700 45%,#B8860B 100%);box-shadow:inset -2px -2px 4px rgba(0,0,0,.35),inset 2px 2px 4px rgba(255,255,255,.5),0 0 12px rgba(255,215,0,.7);transform:translate(-50%,-50%) scale(0);opacity:0}
.sjr-coins.sjr-play .sjr-coin{animation:sjrCoin cubic-bezier(.22,.7,.3,1) forwards}
@keyframes sjrCoin{0%{transform:translate(-50%,-50%) scale(0) rotate(0);opacity:0}10%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:1}70%{opacity:1}100%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty) + 100px)) scale(.6) rotate(var(--spin));opacity:0}}
.sjr-sparks{display:flex;align-items:center;justify-content:center}
.sjr-spark{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%) scale(0);opacity:0}
.sjr-sparks.sjr-play .sjr-spark{animation:sjrSpark cubic-bezier(.22,1,.36,1) forwards}
@keyframes sjrSpark{0%{transform:translate(-50%,-50%) scale(0);opacity:0}12%{transform:translate(calc(-50% + var(--tx)*.25),calc(-50% + var(--ty)*.25)) scale(1.4);opacity:1}100%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.2);opacity:0}}
.sjr-glitter{display:flex;align-items:center;justify-content:center}
.sjr-glitter-dot{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(0);opacity:0}
.sjr-glitter.sjr-play .sjr-glitter-dot{animation:sjrTwinkle ease-in-out infinite}
@keyframes sjrTwinkle{0%,100%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(0);opacity:0}50%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(1);opacity:1}}
.sjr-shield-wrap{display:flex;align-items:center;justify-content:center;z-index:10;opacity:0}
.sjr-shield-float{width:50%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 24px rgba(255,215,0,.9)) drop-shadow(0 0 48px rgba(255,46,196,.6)) drop-shadow(0 0 16px rgba(0,229,255,.4)) drop-shadow(0 10px 24px rgba(0,0,0,.7))}
.sjr-shield-img{width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none}
.sjr-shield-wrap.sjr-play{animation:sjrShieldEntry 1.3s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes sjrShieldEntry{0%{opacity:0;transform:scale(.05) rotate(-25deg)}30%{opacity:1;transform:scale(1.35) rotate(12deg)}50%{transform:scale(.88) rotate(-6deg)}70%{transform:scale(1.08) rotate(3deg)}85%{transform:scale(.97) rotate(-1deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.sjr-shield-wrap.sjr-play .sjr-shield-float{animation:sjrShieldFloat 2.8s ease-in-out 1.4s infinite}
@keyframes sjrShieldFloat{0%,100%{transform:translateY(0) scale(1) rotate(0)}50%{transform:translateY(-10px) scale(1.03) rotate(2deg)}}
.sjr-label{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:6%;opacity:0;z-index:11}
.sjr-label-small{font-size:clamp(10px,2.2vw,13px);font-weight:800;letter-spacing:.35em;background:linear-gradient(90deg,#FFD700,#FF2EC4,#00E5FF,#FFD700);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:6px;animation:sjrShimmer 3s linear infinite}
.sjr-label-big{font-size:clamp(30px,7.5vw,48px);font-weight:900;letter-spacing:.14em;color:#FFF4A3;text-shadow:0 0 24px rgba(255,215,0,.9),0 0 12px rgba(255,46,196,.6),0 2px 0 rgba(0,0,0,.6),0 4px 16px rgba(0,0,0,.7)}
@keyframes sjrShimmer{0%{background-position:0% 50%}100%{background-position:300% 50%}}
.sjr-label.sjr-play{animation:sjrLabelIn .7s cubic-bezier(.34,1.56,.64,1) 1.1s forwards}
@keyframes sjrLabelIn{0%{opacity:0;transform:translateY(24px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}
@media(prefers-reduced-motion:reduce){.sjr-flash.sjr-play,.sjr-rays.sjr-play,.sjr-halo.sjr-play,.sjr-aura.sjr-play,.sjr-streaks.sjr-play .sjr-streak,.sjr-confetti.sjr-play .sjr-confetto,.sjr-coins.sjr-play .sjr-coin,.sjr-sparks.sjr-play .sjr-spark,.sjr-glitter.sjr-play .sjr-glitter-dot,.sjr-shield-wrap.sjr-play,.sjr-shield-wrap.sjr-play .sjr-shield-float,.sjr-label.sjr-play{animation-duration:.5s!important;animation-iteration-count:1!important}}
`;
