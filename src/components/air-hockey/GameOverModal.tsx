"use client";

import React from "react";
import Image from "next/image";

// ── Design tokens ─────────────────────────────────────────────────────────────

const BG = "#0A0F1C";
const CARD = "#1C2539";
const ACCENT = "#FFE500";
const ERROR = "#EF4444";
const TEXT_PRIMARY = "#F1F5F9";
const TEXT_SECONDARY = "#94A3B8";
const TEXT_MUTED = "#64748B";

// ── Props ─────────────────────────────────────────────────────────────────────

interface GameOverModalProps {
  won: boolean;
  scorePlayer: number;
  scoreOpponent: number;
  wager: number;
  opponentWasRobot: boolean;
  onMenu: () => void;
  onRematch: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GameOverModal({
  won,
  scorePlayer,
  scoreOpponent,
  wager,
  opponentWasRobot,
  onMenu,
  onRematch,
}: GameOverModalProps) {
  const coinDelta = won ? `+${wager}` : `-${wager}`;
  const coinColor = won ? ACCENT : ERROR;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: "rgba(10,15,28,0.92)" }}
    >
      {/* Icon circle */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: won ? ACCENT : ERROR }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke={BG}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {won ? (
            <polyline points="8,12 11,15 16,9" />
          ) : (
            <>
              <line x1="8" y1="8" x2="16" y2="16" />
              <line x1="16" y1="8" x2="8" y2="16" />
            </>
          )}
        </svg>
      </div>

      {/* Result text */}
      <h2
        className="text-[28px] font-bold mb-2"
        style={{
          color: won ? ACCENT : ERROR,
          fontFamily: "var(--font-outfit)",
        }}
      >
        {won ? "You Won!" : "You Lost"}
      </h2>

      {/* Score */}
      <p
        className="text-[22px] mb-4"
        style={{ color: TEXT_SECONDARY, fontFamily: "var(--font-outfit)" }}
      >
        {scorePlayer} — {scoreOpponent}
      </p>

      {/* Coin result */}
      <div className="flex items-center gap-2 mb-2">
        <Image src="/images/coin-icon.png" alt="" width={20} height={20} />
        <span
          className="text-[20px] font-bold"
          style={{ color: coinColor, fontFamily: "var(--font-outfit)" }}
        >
          {coinDelta}
        </span>
      </div>

      {/* Robot indicator */}
      {opponentWasRobot && (
        <p
          className="text-[12px] mb-6"
          style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
        >
          vs Robot
        </p>
      )}

      {!opponentWasRobot && <div className="mb-6" />}

      {/* Buttons */}
      <div className="flex gap-3 w-full max-w-[300px]">
        <button
          onClick={onMenu}
          className="flex-1 py-3.5 rounded-[12px] text-[14px] font-bold transition-all active:scale-[0.97]"
          style={{
            background: CARD,
            color: TEXT_PRIMARY,
            fontFamily: "var(--font-outfit)",
          }}
        >
          Menu
        </button>
        <button
          onClick={onRematch}
          className="flex-1 py-3.5 rounded-[12px] text-[14px] font-bold transition-all active:scale-[0.97]"
          style={{
            background: ACCENT,
            color: BG,
            fontFamily: "var(--font-outfit)",
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
