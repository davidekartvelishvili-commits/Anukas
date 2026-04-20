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
  1: { x: 20, y: 48 },
  2: { x: 42, y: 54 },
  3: { x: 64, y: 54 },
  4: { x: 82, y: 48 },
  5: { x: 50, y: 38 },
};

export default function EnemyVillageView({
  defenderUsername, defenderLevel, shieldActive,
  villageItems, attackNumber, pickedPositions,
  onSelectItem, selectedPosition, onConfirmAttack,
}: Props) {
  return (
    <div className="fixed inset-0 z-[200]" style={{ background: "#0a0008" }}>
      <style>{css}</style>

      {/* Red tint */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(120,20,0,0.15) 0%, rgba(180,40,0,0.1) 50%, rgba(60,10,0,0.2) 100%)" }} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
        <div className="flex items-center justify-between px-4">
          <div>
            <div className="text-[16px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
              {defenderUsername}
            </div>
            <div className="text-[11px] text-white/50" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Level {defenderLevel}
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-full" style={{ background: "rgba(249,231,65,0.15)", border: "1px solid rgba(249,231,65,0.3)" }}>
            <span className="text-[13px] font-bold" style={{ color: "#F9E741", fontFamily: "var(--font-outfit)" }}>
              Attack {attackNumber} of 2
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/shield.png" alt="" width={20} height={20} style={{ opacity: shieldActive ? 1 : 0.2 }} />
            <span className="text-[12px] font-bold text-white/60">{shieldActive ? "Active" : "None"}</span>
          </div>
        </div>
      </div>

      {/* Village scene */}
      <div className="absolute inset-0" style={{ top: 80 }}>
        {/* Ground gradient */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "45%", background: "linear-gradient(180deg, #2a1508 0%, #1a0a04 100%)" }} />
        {/* Sky */}
        <div className="absolute top-0 left-0 right-0" style={{ height: "55%", background: "linear-gradient(180deg, #0a0018 0%, #150a08 100%)" }} />

        {/* Buildings */}
        {(villageItems.length > 0 ? villageItems : [1,2,3,4,5].map(p => ({ position: p, stars: 1, name: `Building ${p}`, image: "" }))).map((item) => {
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
                opacity: alreadyPicked ? 0.3 : 1,
              }}
              onClick={() => canSelect && onSelectItem(item.position)}
              disabled={!canSelect}
            >
              <div className="ev-inner" style={{
                width: 80, height: 80, borderRadius: 14,
                background: alreadyPicked ? "#222" : "linear-gradient(135deg, #3a2a1a, #5a3a20)",
                border: isSelected ? "3px solid #F9E741" : "2px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                boxShadow: isSelected ? "0 0 24px rgba(249,231,65,0.6)" : "0 4px 12px rgba(0,0,0,0.5)",
                overflow: "hidden",
              }}>
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} width={56} height={56}
                    style={{ objectFit: "contain", filter: alreadyPicked ? "grayscale(100%)" : "none" }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: "rgba(180,150,100,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-dm-sans)" }}>?</span>
                  </div>
                )}
              </div>
              {/* Stars */}
              <div className="flex gap-0.5 mt-1 justify-center">
                {[0, 1, 2, 3].map(s => (
                  <div key={s} style={{
                    width: 9, height: 9,
                    clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                    background: s < item.stars ? "#FFD700" : "rgba(255,255,255,0.15)",
                  }} />
                ))}
              </div>
              <div className="text-[9px] text-white/50 mt-0.5 text-center truncate w-[80px]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {item.name}
              </div>
              {alreadyPicked && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ top: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#ff4444", fontSize: 18, fontWeight: 900 }}>✕</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <button
          onClick={onConfirmAttack}
          disabled={selectedPosition === null}
          className="w-[200px] h-[58px] rounded-[29px] text-[17px] font-bold active:scale-[0.96] transition-transform"
          style={{
            background: selectedPosition !== null ? "#F9E741" : "rgba(255,255,255,0.08)",
            color: selectedPosition !== null ? "#000" : "rgba(255,255,255,0.25)",
            fontFamily: "var(--font-outfit)",
            boxShadow: selectedPosition !== null ? "0 4px 20px rgba(249,231,65,0.4)" : "none",
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
.ev-picked{pointer-events:none;filter:grayscale(60%)}
@keyframes evPulse{0%,100%{box-shadow:0 0 24px rgba(249,231,65,.6)}50%{box-shadow:0 0 40px rgba(249,231,65,.9)}}
`;
