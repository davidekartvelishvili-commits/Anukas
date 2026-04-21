"use client";

import React from "react";
import type { AttackNotification } from "@/shared/types/attack";

interface Props {
  notifications: AttackNotification[];
  onClose: () => void;
}

export default function AttackedNotificationModal({ notifications, onClose }: Props) {
  const totalCoinsLost = notifications.reduce((sum, n) => sum + n.coinsLost, 0);
  const totalBurned = notifications.filter(n => n.itemBurned).length;
  const totalShields = notifications.filter(n => n.outcome === "shield_blocked").length;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-[340px] rounded-[20px] p-6" style={{ background: "#1C2539", border: "1px solid rgba(239,68,68,0.3)" }}>
        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-[24px]">⚔️</span>
          <h2 className="text-[20px] font-bold" style={{ color: "#EF4444", fontFamily: "var(--font-outfit)" }}>
            You Were Attacked!
          </h2>
        </div>
        <p className="text-center text-[12px] mb-4" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-dm-sans)" }}>
          თავს დაგესხნენ!
        </p>

        {/* Stats */}
        {totalCoinsLost > 0 && (
          <div className="flex items-center justify-center gap-2 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/coin-icon.png" alt="" width={20} height={20} />
            <span className="text-[24px] font-bold" style={{ color: "#EF4444", fontFamily: "var(--font-outfit)" }}>
              -{totalCoinsLost}
            </span>
          </div>
        )}

        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-[16px] font-bold text-white">{totalBurned}</div>
            <div className="text-[10px] text-white/40">Burned</div>
          </div>
          <div className="text-center">
            <div className="text-[16px] font-bold text-white">{totalShields}</div>
            <div className="text-[10px] text-white/40">Shields Used</div>
          </div>
        </div>

        {/* Attack list (scrollable if many) */}
        <div className="flex flex-col gap-1.5 mb-5 max-h-[200px] overflow-y-auto">
          {notifications.map((n, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-[8px]" style={{ background: "rgba(255,255,255,0.04)" }}>
              <span className="text-[14px]">
                {n.outcome === "coins_stolen" ? "💰" : n.outcome === "shield_blocked" ? "🛡️" : "🔥"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-white/80 truncate" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {n.attackerName}
                </div>
                <div className="text-[10px] text-white/40">
                  {n.outcome === "coins_stolen" ? `Took ${n.coinsLost} coins` :
                   n.outcome === "shield_blocked" ? "Shield blocked" :
                   "Burned empty building"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-[12px] text-[14px] font-bold active:scale-[0.97] transition-transform"
          style={{ background: "rgba(255,255,255,0.08)", color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
