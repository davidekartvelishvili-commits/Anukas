"use client";

import React from "react";
import type { AttackAttemptSummary } from "@/shared/types/attack";

interface Props {
  attempts: AttackAttemptSummary[];
  totalCoinsStolen: number;
  totalItemsBurned: number;
  onClose: () => void;
}

export default function AttackResultModal({ attempts, totalCoinsStolen, totalItemsBurned, onClose }: Props) {
  const shieldsBroken = attempts.filter(a => a.shieldConsumed).length;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-[340px] rounded-[20px] p-6" style={{ background: "#1C2539", border: "1px solid rgba(249,231,65,0.2)" }}>
        {/* Title */}
        <h2 className="text-center text-[22px] font-bold mb-1" style={{ color: "#F9E741", fontFamily: "var(--font-outfit)" }}>
          Attack Complete!
        </h2>
        <p className="text-center text-[12px] mb-5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-dm-sans)" }}>
          თავდასხმა დასრულდა
        </p>

        {/* Total coins */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/coin-icon.png" alt="" width={28} height={28} />
          <span className="text-[32px] font-bold" style={{ color: "#F9E741", fontFamily: "var(--font-outfit)" }}>
            +{totalCoinsStolen}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-6 mb-5">
          <div className="text-center">
            <div className="text-[18px] font-bold text-white">{totalItemsBurned}</div>
            <div className="text-[10px] text-white/40" style={{ fontFamily: "var(--font-dm-sans)" }}>Burned</div>
          </div>
          <div className="text-center">
            <div className="text-[18px] font-bold text-white">{shieldsBroken}</div>
            <div className="text-[10px] text-white/40" style={{ fontFamily: "var(--font-dm-sans)" }}>Shields</div>
          </div>
        </div>

        {/* Attempt rows */}
        <div className="flex flex-col gap-2 mb-5">
          {attempts.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-[10px]" style={{ background: "rgba(255,255,255,0.05)" }}>
              <span className="text-[12px] font-bold text-white/40 w-4">{a.attemptNumber}</span>
              <span className="text-[16px]">
                {a.outcome === "coins_stolen" ? "💰" : a.outcome === "shield_blocked" ? "🛡️" : "🔥"}
              </span>
              <span className="flex-1 text-[13px] font-medium text-white/80" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {a.outcome === "coins_stolen" ? `Took ${a.coinsTransferred} coins` :
                 a.outcome === "shield_blocked" ? "Blocked by shield" :
                 "Empty — burned"}
              </span>
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full h-[54px] rounded-[27px] text-[16px] font-bold active:scale-[0.96] transition-transform"
          style={{ background: "#F9E741", color: "#000", fontFamily: "var(--font-outfit)", boxShadow: "0 4px 20px rgba(249,231,65,0.3)" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
