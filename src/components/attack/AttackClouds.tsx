"use client";

import React, { useEffect, useRef } from "react";

interface Props {
  state: "closing" | "open" | "opening";
  onTransitionEnd?: () => void;
}

export default function AttackClouds({ state, onTransitionEnd }: Props) {
  const firedRef = useRef(false);

  // Use timeout instead of onAnimationEnd to avoid double-fire from two children
  useEffect(() => {
    firedRef.current = false;
    if (state === "closing" || state === "opening") {
      const timer = setTimeout(() => {
        if (!firedRef.current && onTransitionEnd) {
          firedRef.current = true;
          onTransitionEnd();
        }
      }, 700); // slightly longer than 600ms animation
      return () => clearTimeout(timer);
    }
  }, [state, onTransitionEnd]);

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none">
      <style>{css}</style>
      <div className={`atk-cloud atk-cloud-left ${state === "closing" ? "atk-cl" : state === "opening" ? "atk-ol" : state === "open" ? "atk-closed-l" : ""}`} />
      <div className={`atk-cloud atk-cloud-right ${state === "closing" ? "atk-cr" : state === "opening" ? "atk-or" : state === "open" ? "atk-closed-r" : ""}`} />
    </div>
  );
}

const css = `
.atk-cloud{position:absolute;top:0;bottom:0;width:55%;z-index:300;
  background:linear-gradient(90deg,rgba(10,10,20,0.98) 0%,rgba(15,15,30,0.96) 60%,rgba(20,20,40,0.8) 85%,rgba(25,25,50,0.3) 100%)}
.atk-cloud-left{left:-55%}
.atk-cloud-right{right:-55%;transform:scaleX(-1)}
.atk-closed-l{left:0}
.atk-closed-r{right:0}
.atk-cl{animation:atkCloseL .6s ease-in-out forwards}
.atk-cr{animation:atkCloseR .6s ease-in-out forwards}
.atk-ol{animation:atkOpenL .6s ease-in-out forwards}
.atk-or{animation:atkOpenR .6s ease-in-out forwards}
@keyframes atkCloseL{0%{left:-55%}100%{left:0}}
@keyframes atkCloseR{0%{right:-55%}100%{right:0}}
@keyframes atkOpenL{0%{left:0}100%{left:-55%}}
@keyframes atkOpenR{0%{right:0}100%{right:-55%}}
`;
