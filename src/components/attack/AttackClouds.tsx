"use client";

import React from "react";

interface Props {
  state: "closing" | "open" | "opening";
  onTransitionEnd?: () => void;
}

export default function AttackClouds({ state, onTransitionEnd }: Props) {
  return (
    <div
      className="fixed inset-0 z-[300] pointer-events-none"
      onAnimationEnd={onTransitionEnd}
    >
      <style>{css}</style>
      {/* Left cloud */}
      <div
        className={`atk-cloud atk-cloud-left ${state === "closing" ? "atk-cloud-close-l" : ""} ${state === "opening" ? "atk-cloud-open-l" : ""} ${state === "open" ? "atk-cloud-closed-l" : ""}`}
      />
      {/* Right cloud */}
      <div
        className={`atk-cloud atk-cloud-right ${state === "closing" ? "atk-cloud-close-r" : ""} ${state === "opening" ? "atk-cloud-open-r" : ""} ${state === "open" ? "atk-cloud-closed-r" : ""}`}
      />
    </div>
  );
}

const css = `
.atk-cloud{position:absolute;top:0;bottom:0;width:55%;z-index:300;
  background:radial-gradient(ellipse at center,rgba(30,30,50,0.98) 0%,rgba(20,20,40,0.95) 40%,rgba(10,10,30,0.85) 70%,transparent 100%);
  filter:blur(8px)}
.atk-cloud-left{left:-55%;border-radius:0 40% 40% 0}
.atk-cloud-right{right:-55%;border-radius:40% 0 0 40%}
.atk-cloud-close-l{animation:atkCloseL .6s ease-in forwards}
.atk-cloud-close-r{animation:atkCloseR .6s ease-in forwards}
.atk-cloud-open-l{animation:atkOpenL .6s ease-out forwards}
.atk-cloud-open-r{animation:atkOpenR .6s ease-out forwards}
.atk-cloud-closed-l{left:0}
.atk-cloud-closed-r{right:0}
@keyframes atkCloseL{0%{left:-55%}100%{left:0}}
@keyframes atkCloseR{0%{right:-55%}100%{right:0}}
@keyframes atkOpenL{0%{left:0}100%{left:-55%}}
@keyframes atkOpenR{0%{right:0}100%{right:-55%}}
`;
