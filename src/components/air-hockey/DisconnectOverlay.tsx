"use client";

import React, { useState, useEffect, useRef } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────

const ACCENT = "#FFE500";
const TEXT_PRIMARY = "#F1F5F9";
const TEXT_SECONDARY = "#94A3B8";

// ── Props ─────────────────────────────────────────────────────────────────────

interface DisconnectOverlayProps {
  /** Total seconds before robot takes over */
  countdownTotal: number;
  /** Whether the robot has already taken over */
  robotActive: boolean;
  /** Callback when countdown reaches zero (parent should trigger robot) */
  onCountdownEnd?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DisconnectOverlay({
  countdownTotal,
  robotActive,
  onCountdownEnd,
}: DisconnectOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(countdownTotal);
  const onCountdownEndRef = useRef(onCountdownEnd);
  onCountdownEndRef.current = onCountdownEnd;

  useEffect(() => {
    if (robotActive) return;

    setSecondsLeft(countdownTotal);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCountdownEndRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownTotal, robotActive]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(10,15,28,0.92)" }}
    >
      {robotActive ? (
        <>
          {/* Robot indicator */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: "#1C2539" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <line x1="12" y1="7" x2="12" y2="11" />
              <circle cx="8" cy="16" r="1" fill={ACCENT} />
              <circle cx="16" cy="16" r="1" fill={ACCENT} />
            </svg>
          </div>
          <p
            className="text-[18px] font-bold"
            style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
          >
            Robot is playing
          </p>
          <p
            className="text-[13px] mt-2"
            style={{ color: TEXT_SECONDARY, fontFamily: "var(--font-dm-sans)" }}
          >
            Opponent disconnected
          </p>
        </>
      ) : (
        <>
          <p
            className="text-[18px] font-bold mb-4"
            style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
          >
            Player disconnected
          </p>
          <p
            className="text-[48px] font-bold mb-3"
            style={{ color: ACCENT, fontFamily: "var(--font-outfit)" }}
          >
            {secondsLeft}
          </p>
          <p
            className="text-[13px]"
            style={{ color: TEXT_SECONDARY, fontFamily: "var(--font-dm-sans)" }}
          >
            Robot takes over in {secondsLeft} seconds
          </p>
        </>
      )}
    </div>
  );
}
