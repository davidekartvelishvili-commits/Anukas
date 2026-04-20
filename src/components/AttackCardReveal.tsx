"use client";

import React, { useEffect, useRef, useCallback } from "react";

// ============================================================================
// ATTACK CARD REVEAL — full battle animation (sword slashing shield)
// Plays when user earns an attack card from Lucky Drop milestone
// ============================================================================

interface Props {
  onDone: () => void;
}

export default function AttackCardReveal({ onDone }: Props) {
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
  const labelRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timeoutsRef.current.push(t);
  }, []);

  // Sound
  useEffect(() => {
    const audio = new Audio("/audio/battle.mp3");
    audio.volume = 0.9;
    audio.play().catch(() => {});
    return () => { audio.pause(); audio.currentTime = 0; };
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(onDone, 5500);
    return () => clearTimeout(t);
  }, [onDone]);

  // Animation sequence
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
    const label = labelRef.current;
    if (!sword || !shield || !trail || !trailPath || !flash || !sparks || !debris || !wrapper || !c1 || !c2 || !c3 || !label) return;

    function resetSword() {
      sword!.setAttribute("class", "acr-sword");
      sword!.style.cssText = "";
      trail!.setAttribute("class", "acr-trail");
      flash!.setAttribute("class", "acr-flash");
      trailPath!.setAttribute("d", "");
    }

    function createSpark(dx: number, dy: number, size: number, color: string, isStar: boolean) {
      const el = document.createElement("div");
      el.className = "acr-spark acr-spark-active";
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
      trail!.classList.add("acr-trail-active");
      setTimeout(() => { trail!.classList.remove("acr-trail-active"); trailPath!.setAttribute("d", ""); }, 450);
    }

    function spawnDebris() {
      const colors = ["#d4a017", "#b8321a"];
      for (let i = 0; i < 14; i++) {
        const el = document.createElement("div");
        el.className = "acr-debris";
        const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.3;
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
        requestAnimationFrame(() => el.classList.add("acr-debris-active"));
        setTimeout(() => el.remove(), 1700);
      }
    }

    function doSlash(slashClass: string, trailD: string, kbClass: string, crack: SVGGElement, t: number) {
      schedule(() => { resetSword(); sword!.classList.add(slashClass); drawTrail(trailD); }, t);
      schedule(() => {
        wrapper!.classList.add("acr-shake-strong");
        flash!.classList.add("acr-flash-strong");
        burstSparks(20, 90);
        shield!.classList.add(kbClass);
        crack.classList.add("acr-crack-visible");
        setTimeout(() => {
          wrapper!.classList.remove("acr-shake-strong");
          flash!.classList.remove("acr-flash-strong");
          shield!.classList.remove(kbClass);
        }, 300);
      }, t + 350);
    }

    // 3 slashes
    doSlash("acr-slash-1", "M 280 60 Q 180 180 80 280", "acr-knockback", c1, 0);
    doSlash("acr-slash-2", "M 80 60 Q 180 180 280 280", "acr-knockback-2", c2, 750);
    doSlash("acr-slash-3", "M 180 40 Q 180 180 180 320", "acr-knockback", c3, 1500);

    // Final thrust + break
    schedule(() => { resetSword(); sword!.classList.add("acr-thrust-final"); }, 2300);
    schedule(() => {
      wrapper!.classList.add("acr-shake-massive");
      flash!.classList.add("acr-flash-break");
      burstSparks(40, 140);
      shield!.style.opacity = "0";
      spawnDebris();
      setTimeout(() => {
        wrapper!.classList.remove("acr-shake-massive");
        flash!.classList.remove("acr-flash-break");
      }, 500);
    }, 2650);
    schedule(() => { sword!.classList.remove("acr-thrust-final"); sword!.classList.add("acr-exit-anim"); }, 3000);

    // Show label after shield breaks
    schedule(() => { label!.classList.add("acr-label-visible"); }, 3200);

    return () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };
  }, [schedule]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }} onClick={onDone}>
      <style>{css}</style>
      <div className="acr-battle">
        <div className="acr-shake-wrapper" ref={wrapperRef}>
          {/* Shield */}
          <div className="acr-shield" ref={shieldRef}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/shield.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.4))" }} />
            <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <defs><clipPath id="acrClip"><circle cx="100" cy="100" r="90"/></clipPath></defs>
              <g className="acr-crack-layer" ref={crack1Ref} clipPath="url(#acrClip)">
                <path d="M 100 30 L 95 55 L 108 75 L 95 95" stroke="#1a0a05" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M 95 55 L 78 48" stroke="#1a0a05" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </g>
              <g className="acr-crack-layer" ref={crack2Ref} clipPath="url(#acrClip)">
                <path d="M 95 95 L 70 110 L 55 135 L 45 155" stroke="#1a0a05" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                <path d="M 70 110 L 42 105" stroke="#1a0a05" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </g>
              <g className="acr-crack-layer" ref={crack3Ref} clipPath="url(#acrClip)">
                <path d="M 100 100 L 130 130 L 150 165" stroke="#1a0a05" strokeWidth="4" fill="none" strokeLinecap="round"/>
                <path d="M 100 100 L 140 85 L 170 75" stroke="#1a0a05" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M 100 100 L 75 155" stroke="#1a0a05" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </g>
            </svg>
          </div>

          <div ref={debrisRef} />

          <svg className="acr-trail" ref={trailRef} viewBox="0 0 360 360">
            <defs>
              <linearGradient id="acrTrailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0"/>
                <stop offset="50%" stopColor="white" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path ref={trailPathRef} d="" stroke="url(#acrTrailGrad)" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.7"/>
          </svg>

          {/* Sword — uses the actual sword image */}
          <div className="acr-sword" ref={swordRef}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/sword.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>

          <div className="acr-flash" ref={flashRef} />
          <div ref={sparksRef} />
        </div>

        {/* Label — appears after shield breaks */}
        <div className="acr-label" ref={labelRef}>
          <div className="acr-label-small">REWARD UNLOCKED</div>
          <div className="acr-label-big">ATTACK CARD</div>
        </div>
      </div>
    </div>
  );
}

const css = `
.acr-battle{position:relative;width:min(360px,85vw);aspect-ratio:1/1;overflow:visible;display:flex;align-items:center;justify-content:center}
.acr-shake-wrapper{width:100%;height:100%;position:relative}
.acr-shake-wrapper.acr-shake-strong{animation:acrShakeS .25s ease-out}
.acr-shake-wrapper.acr-shake-massive{animation:acrShakeM .5s ease-out}
@keyframes acrShakeS{0%,100%{transform:translate(0,0)}15%{transform:translate(-5px,3px)}35%{transform:translate(4px,-4px)}55%{transform:translate(-4px,5px)}75%{transform:translate(5px,-3px)}}
@keyframes acrShakeM{0%,100%{transform:translate(0,0)}10%{transform:translate(-12px,8px) rotate(-1.5deg)}25%{transform:translate(10px,-10px) rotate(1.5deg)}40%{transform:translate(-11px,11px)}55%{transform:translate(12px,-6px)}70%{transform:translate(-8px,9px)}85%{transform:translate(6px,-7px)}}
.acr-shield{position:absolute;top:50%;left:50%;width:200px;height:200px;transform:translate(-50%,-50%);z-index:2;transition:opacity .05s}
.acr-shield.acr-knockback{animation:acrKB .35s cubic-bezier(.34,1.56,.64,1)}
.acr-shield.acr-knockback-2{animation:acrKB2 .35s cubic-bezier(.34,1.56,.64,1)}
@keyframes acrKB{0%,100%{transform:translate(-50%,-50%) rotate(0) scale(1)}40%{transform:translate(-50%,-50%) rotate(-6deg) scale(.94)}70%{transform:translate(-50%,-50%) rotate(4deg) scale(.97)}}
@keyframes acrKB2{0%,100%{transform:translate(-50%,-50%) rotate(0) scale(1)}40%{transform:translate(-50%,-50%) rotate(7deg) scale(.93)}70%{transform:translate(-50%,-50%) rotate(-5deg) scale(.97)}}
.acr-crack-layer{opacity:0;transition:opacity .2s ease-out}
.acr-crack-layer.acr-crack-visible{opacity:1}
.acr-sword{position:absolute;top:50%;left:50%;width:50px;height:160px;transform-origin:center;opacity:0;transform:translate(-50%,-50%);z-index:10;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))}
.acr-trail{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:5}
.acr-trail.acr-trail-active{animation:acrTrailF .45s ease-out forwards}
@keyframes acrTrailF{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
.acr-flash{position:absolute;top:50%;left:50%;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(249,231,65,.9) 0%,rgba(249,231,65,.4) 30%,transparent 70%);transform:translate(-50%,-50%) scale(0);opacity:0;pointer-events:none;mix-blend-mode:screen;z-index:6}
.acr-flash.acr-flash-strong{animation:acrFlashS .35s ease-out forwards}
.acr-flash.acr-flash-break{animation:acrFlashB .7s ease-out forwards}
@keyframes acrFlashS{0%{transform:translate(-50%,-50%) scale(0);opacity:0}20%{transform:translate(-50%,-50%) scale(1.3);opacity:1}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}
@keyframes acrFlashB{0%{transform:translate(-50%,-50%) scale(0);opacity:0}12%{transform:translate(-50%,-50%) scale(1.8);opacity:1}100%{transform:translate(-50%,-50%) scale(3);opacity:0}}
.acr-spark{position:absolute;border-radius:50%;top:50%;left:50%;opacity:0;pointer-events:none;z-index:7}
.acr-spark.acr-spark-active{animation:acrSparkF 1s cubic-bezier(.2,.6,.3,1) forwards}
@keyframes acrSparkF{0%{opacity:1;transform:translate(-50%,-50%) scale(.6)}15%{opacity:1;transform:translate(calc(-50% + var(--dx)*.2),calc(-50% + var(--dy)*.2)) scale(1.4)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3)}}
.acr-debris{position:absolute;top:50%;left:50%;opacity:0;pointer-events:none;z-index:3;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))}
.acr-debris.acr-debris-active{animation:acrDebrisF 1.6s cubic-bezier(.15,.6,.4,1) forwards}
@keyframes acrDebrisF{0%{opacity:1;transform:translate(-50%,-50%) rotate(0) scale(1)}15%{opacity:1;transform:translate(calc(-50% + var(--dx-mid)),calc(-50% + var(--dy-mid))) rotate(var(--rot-mid)) scale(1.05)}80%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--rot)) scale(.8)}}
.acr-slash-1{animation:acrSlash1 .45s cubic-bezier(.5,0,.75,0) forwards}
@keyframes acrSlash1{0%{transform:translate(80px,-120px) rotate(-45deg) scale(.8);opacity:0}20%{transform:translate(70px,-100px) rotate(-50deg) scale(1);opacity:1}100%{transform:translate(-80px,100px) rotate(135deg) scale(1);opacity:1}}
.acr-slash-2{animation:acrSlash2 .45s cubic-bezier(.5,0,.75,0) forwards}
@keyframes acrSlash2{0%{transform:translate(-80px,-120px) rotate(45deg) scale(.8);opacity:0}20%{transform:translate(-70px,-100px) rotate(50deg) scale(1);opacity:1}100%{transform:translate(80px,100px) rotate(-135deg) scale(1);opacity:1}}
.acr-slash-3{animation:acrSlash3 .45s cubic-bezier(.5,0,.75,0) forwards}
@keyframes acrSlash3{0%{transform:translate(0,-140px) rotate(0) scale(.8);opacity:0}20%{transform:translate(0,-110px) rotate(0) scale(1);opacity:1}100%{transform:translate(0,120px) rotate(180deg) scale(1);opacity:1}}
.acr-thrust-final{animation:acrThrust .4s cubic-bezier(.6,0,.3,1) forwards}
@keyframes acrThrust{0%{transform:translate(-50%,-50%) translateX(-180px) rotate(90deg) scale(.9);opacity:0}25%{transform:translate(-50%,-50%) translateX(-150px) rotate(90deg) scale(1.1);opacity:1}70%{transform:translate(-50%,-50%) translateX(10px) rotate(90deg) scale(1.2);opacity:1}100%{transform:translate(-50%,-50%) translateX(-30px) rotate(90deg) scale(1);opacity:1}}
.acr-exit-anim{animation:acrExit .3s ease-in forwards}
@keyframes acrExit{0%{opacity:1}100%{transform:translate(-50%,-50%) translateX(120px) rotate(90deg) scale(.6);opacity:0}}
.acr-label{position:absolute;bottom:5%;left:0;right:0;text-align:center;opacity:0;z-index:20;pointer-events:none}
.acr-label.acr-label-visible{animation:acrLabelIn .7s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes acrLabelIn{0%{opacity:0;transform:translateY(24px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}
.acr-label-small{font-size:clamp(11px,2.5vw,14px);font-weight:800;letter-spacing:.3em;color:#F9E741;text-shadow:0 0 16px rgba(249,231,65,.7);margin-bottom:6px}
.acr-label-big{font-size:clamp(28px,7vw,42px);font-weight:900;letter-spacing:.12em;color:#fff;text-shadow:0 0 24px rgba(249,231,65,.9),0 0 12px rgba(255,107,107,.6),0 2px 0 rgba(0,0,0,.7),0 4px 16px rgba(0,0,0,.8)}
`;
