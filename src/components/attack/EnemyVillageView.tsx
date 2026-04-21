"use client";

import React from "react";
import type { VillageItem } from "@/shared/types/attack";

interface Props {
  defenderUsername: string;
  defenderLevel: number;
  shieldActive: boolean;
  villageItems: VillageItem[];
  attackNumber: number;
  pickedPositions: number[];
  onSelectItem: (position: number) => void;
  selectedPosition: number | null;
  onConfirmAttack: () => void;
}

const POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 25, y: 56 },
  2: { x: 50, y: 60 },
  3: { x: 75, y: 56 },
  4: { x: 35, y: 44 },
  5: { x: 65, y: 44 },
};

const BUILDING_SIZE = 90;

export default function EnemyVillageView({
  defenderUsername, defenderLevel,
  villageItems, attackNumber, pickedPositions,
  onSelectItem, selectedPosition, onConfirmAttack,
}: Props) {
  const items = villageItems.length > 0 ? villageItems : [1,2,3,4,5].map(p => ({ position: p, stars: 1, name: `Building ${p}`, image: "" }));

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <style>{css}</style>

      {/* Same sky gradient as village page */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, #d4ecf5 0%, #b3dcec 10%, #87CEEB 18%, #7cc4e1 22%, #6ab04c 30%, #5a9e3e 38%, #4a8e30 58%, #3d7a28 68%, #2d8bc9 76%, #1e90c9 84%, #1975a8 100%)"
      }} />

      {/* Red attack tint overlay */}
      <div className="absolute inset-0" style={{ background: "rgba(120,20,0,0.08)", zIndex: 1 }} />

      {/* Clouds */}
      {[
        { top: 3, left: 65, scale: 1.1 },
        { top: 7, left: 25, scale: 0.8 },
        { top: 2, left: 10, scale: 0.9 },
      ].map((c, i) => (
        <div key={i} className="absolute" style={{ top: `${c.top}%`, left: `${c.left}%`, transform: `scale(${c.scale})`, zIndex: 1, opacity: 0.9 }}>
          <svg width="140" height="60" viewBox="0 0 140 60">
            <ellipse cx="30" cy="40" rx="22" ry="18" fill="#fff" opacity="0.9" />
            <ellipse cx="55" cy="32" rx="26" ry="22" fill="#fff" opacity="0.95" />
            <ellipse cx="85" cy="35" rx="24" ry="20" fill="#fff" opacity="0.9" />
            <ellipse cx="110" cy="42" rx="20" ry="16" fill="#fff" opacity="0.85" />
            <ellipse cx="70" cy="45" rx="30" ry="12" fill="#fff" opacity="0.8" />
          </svg>
        </div>
      ))}

      {/* Mountains */}
      <div className="absolute left-0 right-0" style={{ top: "17%", zIndex: 1 }}>
        <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
          <path d="M0,80 L40,30 L80,55 L120,20 L160,45 L200,15 L240,40 L280,25 L320,50 L360,30 L400,55 L400,80 Z" fill="#8ba8c9" opacity="0.7" />
          <path d="M115,25 L120,20 L125,25 L122,30 Z" fill="#fff" opacity="0.8" />
          <path d="M195,20 L200,15 L205,20 L202,25 Z" fill="#fff" opacity="0.8" />
        </svg>
      </div>

      {/* Trees */}
      {[
        { left: 8, top: 34, s: 0.7 }, { left: 18, top: 36, s: 0.6 },
        { left: 85, top: 34, s: 0.65 }, { left: 92, top: 37, s: 0.55 },
        { left: 5, top: 50, s: 0.8 }, { left: 95, top: 52, s: 0.75 },
      ].map((t, i) => (
        <div key={`tree-${i}`} className="absolute" style={{ left: `${t.left}%`, top: `${t.top}%`, transform: `scale(${t.s})`, zIndex: 2 }}>
          <svg width="40" height="80" viewBox="0 0 40 80">
            <rect x="17" y="58" width="6" height="18" fill="#5a3a1a" rx="1" />
            <path d="M20,8 L8,34 L32,34 Z" fill="#3a6e20" />
            <path d="M20,26 L5,54 L35,54 Z" fill="#3a6e20" />
            <path d="M20,44 L3,68 L37,68 Z" fill="#4a8e30" />
          </svg>
        </div>
      ))}

      {/* Lake */}
      <div className="absolute left-0 right-0" style={{ bottom: "12%", height: "16%", zIndex: 1 }}>
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, rgba(45,139,201,0.6) 0%, rgba(25,117,168,0.8) 100%)", borderRadius: "50% 50% 0 0" }} />
      </div>

      {/* Header — just name + attack counter */}
      <div className="absolute top-0 left-0 right-0 z-30" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}>
        <div className="flex items-center justify-between px-4">
          <div className="px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
            <span className="text-[14px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
              {defenderUsername}
            </span>
            <span className="text-[11px] text-white/50 ml-1.5">Lv.{defenderLevel}</span>
          </div>

          <div className="px-3 py-1.5 rounded-full" style={{ background: "rgba(249,231,65,0.2)", border: "1px solid rgba(249,231,65,0.4)", backdropFilter: "blur(8px)" }}>
            <span className="text-[13px] font-bold" style={{ color: "#F9E741", fontFamily: "var(--font-outfit)" }}>
              Attack {attackNumber} of 2
            </span>
          </div>
        </div>
      </div>

      {/* Buildings on the village */}
      {items.map((item) => {
        const pos = POSITIONS[item.position];
        if (!pos) return null;
        const alreadyPicked = pickedPositions.includes(item.position);
        const isSelected = selectedPosition === item.position;
        const canSelect = !alreadyPicked;

        return (
          <button
            key={item.position}
            className={`ev-building ${isSelected ? "ev-selected" : ""} ${alreadyPicked ? "ev-picked" : ""}`}
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
              opacity: alreadyPicked ? 0.35 : 1,
              zIndex: 6,
            }}
            onClick={() => canSelect && onSelectItem(item.position)}
            disabled={!canSelect}
          >
            <div className="ev-inner" style={{
              width: BUILDING_SIZE, height: BUILDING_SIZE,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 16,
              border: isSelected ? "3px solid #F9E741" : "2px solid transparent",
              boxShadow: isSelected ? "0 0 24px rgba(249,231,65,0.6)" : "none",
              background: isSelected ? "rgba(249,231,65,0.08)" : "transparent",
            }}>
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} width={BUILDING_SIZE - 10} height={BUILDING_SIZE - 10}
                  style={{ objectFit: "contain", filter: alreadyPicked ? "grayscale(60%) brightness(0.4) sepia(0.3)" : "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }} />
              ) : (
                <div style={{
                  width: BUILDING_SIZE - 20, height: BUILDING_SIZE - 20, borderRadius: 12,
                  background: "rgba(90,70,50,0.4)", border: "2px dashed rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>?</span>
                </div>
              )}
            </div>
            {/* Stars below building */}
            <div className="flex gap-0.5 mt-1 justify-center">
              {[0, 1, 2, 3].map(s => (
                <div key={s} style={{
                  width: 10, height: 10,
                  clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                  background: s < item.stars ? "#FFD700" : "rgba(255,255,255,0.2)",
                }} />
              ))}
            </div>
            {alreadyPicked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: -5 }}>
                {/* Smoke effect */}
                <div style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: BUILDING_SIZE + 10, height: BUILDING_SIZE,
                  background: "radial-gradient(ellipse at bottom, rgba(40,30,20,0.7) 0%, rgba(60,40,20,0.3) 50%, transparent 80%)",
                  borderRadius: "50%",
                  animation: "ev-smoke 2s ease-in-out infinite",
                }} />
                {/* Fire embers */}
                <div style={{ fontSize: 20, position: "relative", zIndex: 2 }}>🔥</div>
              </div>
            )}
          </button>
        );
      })}

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <button
          onClick={onConfirmAttack}
          disabled={selectedPosition === null}
          className="w-[200px] h-[58px] rounded-[29px] text-[17px] font-bold active:scale-[0.96] transition-transform"
          style={{
            background: selectedPosition !== null ? "#F9E741" : "rgba(0,0,0,0.3)",
            color: selectedPosition !== null ? "#000" : "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-outfit)",
            boxShadow: selectedPosition !== null ? "0 4px 20px rgba(249,231,65,0.4)" : "none",
            backdropFilter: "blur(8px)",
          }}
        >
          {selectedPosition !== null ? "Attack!" : "Select a building"}
        </button>
      </div>
    </div>
  );
}

const css = `
.ev-building{background:none;border:none;cursor:pointer;padding:0;transition:transform .15s;position:relative}
.ev-building:active:not(:disabled){transform:translate(-50%,-50%) scale(.93)!important}
.ev-selected .ev-inner{animation:evPulse 1s ease-in-out infinite}
.ev-picked{pointer-events:none}
@keyframes evPulse{0%,100%{box-shadow:0 0 24px rgba(249,231,65,.6)}50%{box-shadow:0 0 40px rgba(249,231,65,.9)}}
@keyframes ev-smoke{0%,100%{opacity:.6;transform:translateX(-50%) scale(1)}50%{opacity:.9;transform:translateX(-50%) scale(1.1) translateY(-3px)}}
`;
