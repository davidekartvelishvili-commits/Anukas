"use client";

import React from "react";
import type { VillageItem } from "@/shared/types/attack";

interface Props {
  defenderUsername: string;
  defenderLevel: number;
  shieldActive: boolean;
  villageItems: VillageItem[];
  attackNumber: number; // 1 or 2
  pickedPositions: number[]; // positions already attacked
  onSelectItem: (position: number) => void;
  selectedPosition: number | null;
  onConfirmAttack: () => void;
}

const POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 20, y: 50 },
  2: { x: 40, y: 55 },
  3: { x: 60, y: 55 },
  4: { x: 80, y: 50 },
  5: { x: 50, y: 40 },
};

export default function EnemyVillageView({
  defenderUsername, defenderLevel, shieldActive,
  villageItems, attackNumber, pickedPositions,
  onSelectItem, selectedPosition, onConfirmAttack,
}: Props) {
  return (
    <div className="fixed inset-0 z-[200]" style={{ background: "#0a0008" }}>
      <style>{css}</style>

      {/* Red/orange tint overlay */}
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

          {/* Shield indicator */}
          <div className="flex items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/shield.png" alt="" width={20} height={20} style={{ opacity: shieldActive ? 1 : 0.2 }} />
            <span className="text-[12px] font-bold text-white/60">{shieldActive ? "Active" : "None"}</span>
          </div>
        </div>
      </div>

      {/* Village scene */}
      <div className="absolute inset-0" style={{ top: 80 }}>
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "40%", background: "linear-gradient(180deg, #2a1508 0%, #1a0a04 100%)" }} />

        {/* Buildings */}
        {villageItems.map((item) => {
          const pos = POSITIONS[item.position];
          if (!pos) return null;
          const alreadyPicked = pickedPositions.includes(item.position);
          const isSelected = selectedPosition === item.position;
          const canSelect = !alreadyPicked && item.stars > 0;

          return (
            <button
              key={item.position}
              className={`atk-building ${isSelected ? "atk-building-selected" : ""} ${alreadyPicked ? "atk-building-picked" : ""}`}
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
              {/* Building visual */}
              <div className="atk-building-inner" style={{
                width: 70, height: 70, borderRadius: 12,
                background: alreadyPicked ? "#333" : "linear-gradient(135deg, #3a2a1a, #5a3a20)",
                border: isSelected ? "3px solid #F9E741" : "2px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                boxShadow: isSelected ? "0 0 20px rgba(249,231,65,0.5)" : "0 4px 12px rgba(0,0,0,0.5)",
              }}>
                <span style={{ fontSize: 24 }}>🏠</span>
                {/* Stars */}
                <div className="flex gap-0.5 mt-1">
                  {[0, 1, 2, 3].map(s => (
                    <div key={s} style={{
                      width: 8, height: 8,
                      clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                      background: s < item.stars ? "#FFD700" : "rgba(255,255,255,0.15)",
                    }} />
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-white/60 mt-1 text-center" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {item.name}
              </div>
              {alreadyPicked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[20px]">✕</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Confirm attack button */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <button
          onClick={onConfirmAttack}
          disabled={selectedPosition === null}
          className="px-8 py-4 rounded-full text-[18px] font-bold active:scale-[0.95] transition-transform"
          style={{
            background: selectedPosition !== null ? "#F9E741" : "rgba(255,255,255,0.1)",
            color: selectedPosition !== null ? "#000" : "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-outfit)",
            boxShadow: selectedPosition !== null ? "0 0 30px rgba(249,231,65,0.4)" : "none",
          }}
        >
          {selectedPosition !== null ? "⚔️ Attack!" : "Select a building"}
        </button>
      </div>
    </div>
  );
}

const css = `
.atk-building{background:none;border:none;cursor:pointer;padding:0;transition:transform .15s}
.atk-building:active:not(:disabled){transform:translate(-50%,-50%) scale(.95)}
.atk-building-selected .atk-building-inner{animation:atkPulse 1s ease-in-out infinite}
.atk-building-picked{pointer-events:none;filter:grayscale(80%)}
@keyframes atkPulse{0%,100%{box-shadow:0 0 20px rgba(249,231,65,.5)}50%{box-shadow:0 0 35px rgba(249,231,65,.8)}}
`;
