"use client";

import React, { useEffect } from "react";

// ============================================================================
// ATTACK CARD REVEAL — brief reward notification when user earns an attack card
// ============================================================================

interface Props {
  onDone: () => void;
}

export default function AttackCardReveal({ onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  useEffect(() => {
    try {
      const audio = new Audio("/audio/battle.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onDone}
    >
      <style>{css}</style>
      <div className="acr-container">
        {/* Glow ring */}
        <div className="acr-glow" />

        {/* Sparks */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * 360;
          const dist = 120 + Math.random() * 60;
          const rad = (angle * Math.PI) / 180;
          return (
            <div
              key={i}
              className="acr-spark"
              style={{
                "--tx": `${Math.cos(rad) * dist}px`,
                "--ty": `${Math.sin(rad) * dist}px`,
                animationDelay: `${Math.random() * 0.3}s`,
              } as any}
            />
          );
        })}

        {/* Card icon — sword/attack card */}
        <div className="acr-card">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            {/* Card background */}
            <rect x="8" y="4" width="64" height="72" rx="8" fill="#1C2539" stroke="#FF6B6B" strokeWidth="2.5"/>
            {/* Sword */}
            <g transform="translate(40, 38)">
              <path d="M0 -22 L4 -8 L4 8 L0 12 L-4 8 L-4 -8 Z" fill="#d5d7da" stroke="#4a4f54" strokeWidth="1"/>
              <rect x="-6" y="12" width="12" height="4" rx="1" fill="#8a8f94"/>
              <rect x="-2" y="16" width="4" height="8" fill="#1a2836"/>
              <circle cx="0" cy="0" r="2.5" fill="#FF6B6B"/>
            </g>
            {/* +1 */}
            <text x="40" y="68" textAnchor="middle" fill="#FF6B6B" fontSize="11" fontWeight="900" fontFamily="var(--font-outfit)">+1</text>
          </svg>
        </div>

        {/* Label */}
        <div className="acr-label">
          <div className="acr-label-small">REWARD UNLOCKED</div>
          <div className="acr-label-big">ATTACK CARD</div>
        </div>
      </div>
    </div>
  );
}

const css = `
.acr-container{position:relative;width:280px;height:320px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.acr-glow{position:absolute;top:50%;left:50%;width:200px;height:200px;transform:translate(-50%,-60%);border-radius:50%;background:radial-gradient(circle,rgba(255,107,107,.4) 0%,rgba(255,107,107,.15) 40%,transparent 70%);animation:acrPulse 1.5s ease-in-out infinite}
@keyframes acrPulse{0%,100%{transform:translate(-50%,-60%) scale(1);opacity:.8}50%{transform:translate(-50%,-60%) scale(1.15);opacity:1}}
.acr-spark{position:absolute;top:45%;left:50%;width:6px;height:6px;border-radius:50%;background:#FF6B6B;box-shadow:0 0 8px #FF6B6B,0 0 16px #FF6B6B;opacity:0;animation:acrSpark .8s cubic-bezier(.2,.6,.3,1) forwards}
@keyframes acrSpark{0%{opacity:1;transform:translate(-50%,-50%) scale(.5)}15%{opacity:1;transform:translate(calc(-50% + var(--tx)*.2),calc(-50% + var(--ty)*.2)) scale(1.3)}100%{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.3)}}
.acr-card{animation:acrCardIn .8s cubic-bezier(.34,1.56,.64,1) forwards;opacity:0;filter:drop-shadow(0 0 20px rgba(255,107,107,.6)) drop-shadow(0 8px 16px rgba(0,0,0,.5))}
@keyframes acrCardIn{0%{opacity:0;transform:scale(.3) rotate(-15deg)}40%{opacity:1;transform:scale(1.15) rotate(5deg)}60%{transform:scale(.95) rotate(-2deg)}80%{transform:scale(1.03) rotate(1deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.acr-label{text-align:center;opacity:0;animation:acrLabelIn .6s cubic-bezier(.34,1.56,.64,1) .5s forwards}
@keyframes acrLabelIn{0%{opacity:0;transform:translateY(16px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}
.acr-label-small{font-size:11px;font-weight:800;letter-spacing:.3em;color:#FF6B6B;text-shadow:0 0 12px rgba(255,107,107,.6);margin-bottom:4px}
.acr-label-big{font-size:28px;font-weight:900;letter-spacing:.1em;color:#fff;text-shadow:0 0 20px rgba(255,107,107,.8),0 2px 0 rgba(0,0,0,.6),0 4px 12px rgba(0,0,0,.7)}
`;
