"use client";

import React, { useEffect, useRef, useCallback } from "react";

// ============================================================================
// SHANSI BATTLE ANIMATION
// Sword slashes shield 3 times → cracks appear → final thrust breaks it
// Transparent background, overlays on top of village scene
// ============================================================================

interface Props {
  onDone: () => void;
}

export default function BattleAnimation({ onDone }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const swordRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<SVGSVGElement>(null);
  const trailPathRef = useRef<SVGPathElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const sparksRef = useRef<HTMLDivElement>(null);
  const debrisRef = useRef<HTMLDivElement>(null);
  const crack1Ref = useRef<SVGGElement>(null);
  const crack2Ref = useRef<SVGGElement>(null);
  const crack3Ref = useRef<SVGGElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timeoutsRef.current.push(t);
  }, []);

  // Sound effect
  useEffect(() => {
    const audio = new Audio("/audio/battle.mp3");
    audio.volume = 0.9;
    audio.play().catch(() => {});
    return () => { audio.pause(); audio.currentTime = 0; };
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  // Run the animation sequence
  useEffect(() => {
    const sword = swordRef.current;
    const shield = shieldRef.current;
    const trail = trailRef.current;
    const trailPath = trailPathRef.current;
    const flash = flashRef.current;
    const sparks = sparksRef.current;
    const debris = debrisRef.current;
    const wrapper = wrapperRef.current;
    const c1 = crack1Ref.current;
    const c2 = crack2Ref.current;
    const c3 = crack3Ref.current;
    if (!sword || !shield || !trail || !trailPath || !flash || !sparks || !debris || !wrapper || !c1 || !c2 || !c3) return;

    function resetSword() {
      sword!.setAttribute("class", "sb-sword");
      sword!.style.cssText = "";
      trail!.setAttribute("class", "sb-trail");
      flash!.setAttribute("class", "sb-flash");
      trailPath!.setAttribute("d", "");
    }

    function createSpark(dx: number, dy: number, size: number, color: string, isStar: boolean) {
      const el = document.createElement("div");
      el.className = "sb-spark sb-spark-active";
      el.style.setProperty("--dx", dx + "px");
      el.style.setProperty("--dy", dy + "px");
      el.style.width = size + "px";
      el.style.height = size + "px";
      if (isStar) {
        el.style.background = "transparent";
        el.innerHTML = `<svg viewBox="0 0 20 20" style="width:100%;height:100%;filter:drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color});">
          <polygon points="10,0 12.5,7.5 20,10 12.5,12.5 10,20 7.5,12.5 0,10 7.5,7.5" fill="${color}"/>
          <circle cx="10" cy="10" r="2" fill="#fff"/>
        </svg>`;
      } else {
        el.style.background = color;
        el.style.boxShadow = `0 0 ${size * 1.2}px ${color},0 0 ${size * 2.5}px ${color},0 0 ${size * 4}px ${color}aa`;
      }
      sparks!.appendChild(el);
      setTimeout(() => el.remove(), 1050);
    }

    function burstSparks(count: number, intensity: number) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
        const dist = intensity + Math.random() * 50;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const r = Math.random();
        if (r < 0.35) createSpark(dx, dy, 16 + Math.random() * 10, "#F9E741", true);
        else if (r < 0.65) createSpark(dx, dy, 8 + Math.random() * 6, "#F9E741", false);
        else if (r < 0.88) createSpark(dx, dy, 6 + Math.random() * 5, "#ffffff", false);
        else createSpark(dx, dy, 7 + Math.random() * 5, "#ffb347", false);
      }
    }

    function drawTrail(pathD: string) {
      trailPath!.setAttribute("d", pathD);
      trail!.classList.add("sb-trail-active");
      setTimeout(() => { trail!.classList.remove("sb-trail-active"); trailPath!.setAttribute("d", ""); }, 450);
    }

    function doSlash(slashClass: string, trailD: string, kbClass: string, crack: SVGGElement | null, t: number) {
      schedule(() => { resetSword(); sword!.classList.add(slashClass); drawTrail(trailD); }, t);
      schedule(() => {
        wrapper!.classList.add("sb-shake-strong");
        flash!.classList.add("sb-flash-strong");
        burstSparks(20, 90);
        shield!.classList.add(kbClass);
        if (crack) crack.classList.add("sb-crack-visible");
        setTimeout(() => {
          wrapper!.classList.remove("sb-shake-strong");
          flash!.classList.remove("sb-flash-strong");
          shield!.classList.remove(kbClass);
        }, 300);
      }, t + 350);
    }

    function spawnDebris() {
      const colors = ["#d4a017", "#b8321a"];
      for (let i = 0; i < 12; i++) {
        const el = document.createElement("div");
        el.className = "sb-debris";
        const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
        const dist = 200 + Math.random() * 100;
        el.style.setProperty("--dx", Math.cos(angle) * dist + "px");
        el.style.setProperty("--dy", Math.sin(angle) * dist + "px");
        el.style.setProperty("--dx-mid", Math.cos(angle) * dist * 0.5 + "px");
        el.style.setProperty("--dy-mid", Math.sin(angle) * dist * 0.5 + "px");
        const rot = (Math.random() - 0.5) * 720;
        el.style.setProperty("--rot", rot + "deg");
        el.style.setProperty("--rot-mid", rot * 0.5 + "deg");
        const size = 30 + Math.random() * 25;
        el.style.width = size + "px";
        el.style.height = size + "px";
        el.style.background = colors[i % 2];
        el.style.borderRadius = "4px";
        el.style.border = "2px solid #3d1d08";
        debris!.appendChild(el);
        requestAnimationFrame(() => el.classList.add("sb-debris-active"));
        setTimeout(() => el.remove(), 1700);
      }
    }

    // Sequence: 3 slashes then final break
    doSlash("sb-slash-1", "M 280 60 Q 180 180 80 280", "sb-knockback", c1, 0);
    doSlash("sb-slash-2", "M 80 60 Q 180 180 280 280", "sb-knockback-2", c2, 750);
    doSlash("sb-slash-3", "M 180 40 Q 180 180 180 320", "sb-knockback", c3, 1500);

    // Final thrust + break
    schedule(() => { resetSword(); sword!.classList.add("sb-thrust-final"); }, 2300);
    schedule(() => {
      wrapper!.classList.add("sb-shake-massive");
      flash!.classList.add("sb-flash-break");
      burstSparks(40, 140);
      shield!.style.opacity = "0";
      spawnDebris();
      setTimeout(() => {
        wrapper!.classList.remove("sb-shake-massive");
        flash!.classList.remove("sb-flash-break");
      }, 500);
    }, 2650);
    schedule(() => { sword!.classList.remove("sb-thrust-final"); sword!.classList.add("sb-exit-anim"); }, 3000);

    return () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };
  }, [schedule]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onDone}>
      <style>{css}</style>
      <div className="sb-battle">
        <div className="sb-shake-wrapper" ref={wrapperRef}>
          {/* Shield */}
          <div className="sb-shield" ref={shieldRef}>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <clipPath id="sbInnerClip"><circle cx="100" cy="100" r="85"/></clipPath>
              </defs>
              <circle cx="100" cy="100" r="96" fill="#6b3410" stroke="#3d1d08" strokeWidth="3"/>
              <g clipPath="url(#sbInnerClip)">
                <rect x="0" y="0" width="100" height="100" fill="#d4a017"/>
                <rect x="100" y="0" width="100" height="100" fill="#b8321a"/>
                <rect x="0" y="100" width="100" height="100" fill="#b8321a"/>
                <rect x="100" y="100" width="100" height="100" fill="#d4a017"/>
              </g>
              <circle cx="100" cy="100" r="85" fill="none" stroke="#3d1d08" strokeWidth="2.5" opacity="0.7"/>
              <g className="sb-crack-layer" ref={crack1Ref} clipPath="url(#sbInnerClip)">
                <path d="M 100 30 L 95 55 L 108 75 L 95 95" stroke="#1a0a05" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <path d="M 95 55 L 78 48" stroke="#1a0a05" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </g>
              <g className="sb-crack-layer" ref={crack2Ref} clipPath="url(#sbInnerClip)">
                <path d="M 95 95 L 70 110 L 55 135 L 45 155" stroke="#1a0a05" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M 70 110 L 42 105" stroke="#1a0a05" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </g>
              <g className="sb-crack-layer" ref={crack3Ref} clipPath="url(#sbInnerClip)">
                <path d="M 100 100 L 130 130 L 150 165" stroke="#1a0a05" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                <path d="M 100 100 L 140 85 L 170 75" stroke="#1a0a05" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </g>
              {/* Center star */}
              <g transform="translate(100, 100)">
                <path d="M 0 -40 L 8 -10 L 0 -5 L -8 -10 Z" fill="#a9c7d9" stroke="#4a6578" strokeWidth="1.5"/>
                <path d="M 40 0 L 10 8 L 5 0 L 10 -8 Z" fill="#a9c7d9" stroke="#4a6578" strokeWidth="1.5"/>
                <path d="M 0 40 L -8 10 L 0 5 L 8 10 Z" fill="#a9c7d9" stroke="#4a6578" strokeWidth="1.5"/>
                <path d="M -40 0 L -10 -8 L -5 0 L -10 8 Z" fill="#a9c7d9" stroke="#4a6578" strokeWidth="1.5"/>
                <circle cx="0" cy="0" r="18" fill="#d5d7da" stroke="#4a4f54" strokeWidth="2"/>
                <ellipse cx="-4" cy="-4" rx="8" ry="6" fill="#a9c7d9" opacity="0.8"/>
              </g>
            </svg>
          </div>

          <div ref={debrisRef} />

          <svg className="sb-trail" ref={trailRef} viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sbTrailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0"/>
                <stop offset="50%" stopColor="white" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path ref={trailPathRef} d="" stroke="url(#sbTrailGrad)" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.7"/>
          </svg>

          {/* Sword */}
          <div className="sb-sword" ref={swordRef}>
            <svg viewBox="0 0 40 140" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 5 L32 50 L32 95 L20 100 L8 95 L8 50 Z" fill="#6b3410" stroke="#3d1d08" strokeWidth="1.5"/>
              <path d="M20 12 L28 52 L28 92 L20 96 L12 92 L12 52 Z" fill="#d5d7da" stroke="#4a4f54" strokeWidth="1"/>
              <path d="M20 15 L24 52 L24 88 L20 92 L16 88 L16 52 Z" fill="#a9c7d9" opacity="0.6"/>
              <rect x="4" y="100" width="32" height="8" rx="2" fill="#8a8f94" stroke="#3d3f42" strokeWidth="1"/>
              <circle cx="20" cy="104" r="2" fill="#c23616"/>
              <rect x="16" y="108" width="8" height="22" fill="#1a2836" stroke="#000" strokeWidth="1"/>
              <circle cx="20" cy="132" r="4" fill="#8a8f94" stroke="#3d3f42" strokeWidth="1"/>
            </svg>
          </div>

          <div className="sb-flash" ref={flashRef} />
          <div ref={sparksRef} />
        </div>
      </div>
    </div>
  );
}

const css = `
.sb-battle{position:relative;width:min(360px,85vw);aspect-ratio:1/1;overflow:visible}
.sb-shake-wrapper{width:100%;height:100%;position:relative}
.sb-shake-wrapper.sb-shake-strong{animation:sbShakeS .25s ease-out}
.sb-shake-wrapper.sb-shake-massive{animation:sbShakeM .5s ease-out}
@keyframes sbShakeS{0%,100%{transform:translate(0,0)}15%{transform:translate(-5px,3px)}35%{transform:translate(4px,-4px)}55%{transform:translate(-4px,5px)}75%{transform:translate(5px,-3px)}}
@keyframes sbShakeM{0%,100%{transform:translate(0,0)}10%{transform:translate(-12px,8px) rotate(-1.5deg)}25%{transform:translate(10px,-10px) rotate(1.5deg)}40%{transform:translate(-11px,11px)}55%{transform:translate(12px,-6px)}70%{transform:translate(-8px,9px)}85%{transform:translate(6px,-7px)}}
.sb-shield{position:absolute;top:50%;left:50%;width:200px;height:200px;transform:translate(-50%,-50%);z-index:2;transition:opacity .05s}
.sb-shield svg{width:100%;height:100%;filter:drop-shadow(0 6px 12px rgba(0,0,0,.4))}
.sb-shield.sb-knockback{animation:sbKB .35s cubic-bezier(.34,1.56,.64,1)}
.sb-shield.sb-knockback-2{animation:sbKB2 .35s cubic-bezier(.34,1.56,.64,1)}
@keyframes sbKB{0%,100%{transform:translate(-50%,-50%) rotate(0) scale(1)}40%{transform:translate(-50%,-50%) rotate(-6deg) scale(.94)}70%{transform:translate(-50%,-50%) rotate(4deg) scale(.97)}}
@keyframes sbKB2{0%,100%{transform:translate(-50%,-50%) rotate(0) scale(1)}40%{transform:translate(-50%,-50%) rotate(7deg) scale(.93)}70%{transform:translate(-50%,-50%) rotate(-5deg) scale(.97)}}
.sb-crack-layer{opacity:0;transition:opacity .2s ease-out}
.sb-crack-layer.sb-crack-visible{opacity:1}
.sb-sword{position:absolute;top:50%;left:50%;width:40px;height:140px;transform-origin:center;opacity:0;transform:translate(-50%,-50%);z-index:10;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))}
.sb-sword svg{width:100%;height:100%;display:block}
.sb-trail{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:5}
.sb-trail.sb-trail-active{animation:sbTrailF .45s ease-out forwards}
@keyframes sbTrailF{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
.sb-flash{position:absolute;top:50%;left:50%;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(249,231,65,.9) 0%,rgba(249,231,65,.4) 30%,transparent 70%);transform:translate(-50%,-50%) scale(0);opacity:0;pointer-events:none;mix-blend-mode:screen;z-index:6}
.sb-flash.sb-flash-strong{animation:sbFlashS .35s ease-out forwards}
.sb-flash.sb-flash-break{animation:sbFlashB .7s ease-out forwards}
@keyframes sbFlashS{0%{transform:translate(-50%,-50%) scale(0);opacity:0}20%{transform:translate(-50%,-50%) scale(1.3);opacity:1}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}
@keyframes sbFlashB{0%{transform:translate(-50%,-50%) scale(0);opacity:0}12%{transform:translate(-50%,-50%) scale(1.8);opacity:1}100%{transform:translate(-50%,-50%) scale(3);opacity:0}}
.sb-spark{position:absolute;border-radius:50%;top:50%;left:50%;opacity:0;pointer-events:none;z-index:7}
.sb-spark.sb-spark-active{animation:sbSparkF 1s cubic-bezier(.2,.6,.3,1) forwards}
@keyframes sbSparkF{0%{opacity:1;transform:translate(-50%,-50%) scale(.6)}15%{opacity:1;transform:translate(calc(-50% + var(--dx)*.2),calc(-50% + var(--dy)*.2)) scale(1.4)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3)}}
.sb-debris{position:absolute;top:50%;left:50%;opacity:0;pointer-events:none;z-index:3;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))}
.sb-debris.sb-debris-active{animation:sbDebrisF 1.6s cubic-bezier(.15,.6,.4,1) forwards}
@keyframes sbDebrisF{0%{opacity:1;transform:translate(-50%,-50%) rotate(0) scale(1)}15%{opacity:1;transform:translate(calc(-50% + var(--dx-mid)),calc(-50% + var(--dy-mid))) rotate(var(--rot-mid)) scale(1.05)}80%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--rot)) scale(.8)}}
.sb-slash-1{animation:sbSlash1 .45s cubic-bezier(.5,0,.75,0) forwards}
@keyframes sbSlash1{0%{transform:translate(80px,-120px) rotate(-45deg) scale(.8);opacity:0}20%{transform:translate(70px,-100px) rotate(-50deg) scale(1);opacity:1}100%{transform:translate(-80px,100px) rotate(135deg) scale(1);opacity:1}}
.sb-slash-2{animation:sbSlash2 .45s cubic-bezier(.5,0,.75,0) forwards}
@keyframes sbSlash2{0%{transform:translate(-80px,-120px) rotate(45deg) scale(.8);opacity:0}20%{transform:translate(-70px,-100px) rotate(50deg) scale(1);opacity:1}100%{transform:translate(80px,100px) rotate(-135deg) scale(1);opacity:1}}
.sb-slash-3{animation:sbSlash3 .45s cubic-bezier(.5,0,.75,0) forwards}
@keyframes sbSlash3{0%{transform:translate(0,-140px) rotate(0) scale(.8);opacity:0}20%{transform:translate(0,-110px) rotate(0) scale(1);opacity:1}100%{transform:translate(0,120px) rotate(180deg) scale(1);opacity:1}}
.sb-thrust-final{animation:sbThrust .4s cubic-bezier(.6,0,.3,1) forwards}
@keyframes sbThrust{0%{transform:translate(-50%,-50%) translateX(-180px) rotate(90deg) scale(.9);opacity:0}25%{transform:translate(-50%,-50%) translateX(-150px) rotate(90deg) scale(1.1);opacity:1}70%{transform:translate(-50%,-50%) translateX(10px) rotate(90deg) scale(1.2);opacity:1}100%{transform:translate(-50%,-50%) translateX(-30px) rotate(90deg) scale(1);opacity:1}}
.sb-exit-anim{animation:sbExit .3s ease-in forwards}
@keyframes sbExit{0%{opacity:1}100%{transform:translate(-50%,-50%) translateX(120px) rotate(90deg) scale(.6);opacity:0}}
`;
