"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/services/socket";
import type { MultiplayerGameConfig } from "./LobbyScreen";

// ── Design tokens ─────────────────────────────────────────────────────────────

const BG = "#0A0F1C";
const SURFACE = "#141B2D";
const CARD = "#1C2539";
const ACCENT = "#FFE500";
const TEXT_PRIMARY = "#F1F5F9";
const TEXT_SECONDARY = "#94A3B8";
const TEXT_MUTED = "#64748B";

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreateRoomModalProps {
  wager: number;
  goalTarget: number;
  onClose: () => void;
  onGameStart: (config: MultiplayerGameConfig) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateRoomModal({
  wager,
  goalTarget,
  onClose,
  onGameStart,
}: CreateRoomModalProps) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{
    roomId: string;
    pin: string | null;
  } | null>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleRoomCreated = (data: { roomId: string; pin: string | null }) => {
      setCreatedRoom(data);
      setWaiting(true);
    };

    const handleMatchFound = (config: {
      roomId: string;
      yourSide: "bottom" | "top";
      wager: number;
      goalTarget: number;
      opponentName: string;
    }) => {
      setWaiting(false);
      onGameStart(config);
    };

    socket.on("roomCreated", handleRoomCreated);
    socket.on("matchFound", handleMatchFound);

    return () => {
      socket.off("roomCreated", handleRoomCreated);
      socket.off("matchFound", handleMatchFound);
    };
  }, [onGameStart]);

  const handleCreate = useCallback(() => {
    const socket = getSocket();
    socket.emit("createRoom", { wager, goalTarget, isPrivate });
  }, [wager, goalTarget, isPrivate]);

  const handleCopyCode = useCallback(() => {
    if (createdRoom) {
      const text = createdRoom.pin
        ? `${createdRoom.roomId} (PIN: ${createdRoom.pin})`
        : createdRoom.roomId;
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, [createdRoom]);

  const handleCloseRoom = useCallback(() => {
    if (createdRoom) {
      const socket = getSocket();
      socket.emit("leaveRoom", { roomId: createdRoom.roomId });
    }
    onClose();
  }, [createdRoom, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(10,15,28,0.9)" }}
      onClick={handleCloseRoom}
    >
      <div
        className="w-full max-w-[360px] rounded-[16px] p-6 relative"
        style={{ background: SURFACE }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleCloseRoom}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.9]"
          style={{ color: TEXT_SECONDARY }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {!createdRoom ? (
          <>
            {/* Header */}
            <h3
              className="text-[18px] font-bold mb-6"
              style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
            >
              ოთახის შექმნა
            </h3>

            {/* Private toggle */}
            <div className="flex items-center justify-between mb-6">
              <span
                className="text-[14px]"
                style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-dm-sans)" }}
              >
                პრივატული ოთახი
              </span>
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className="relative w-[44px] h-[24px] rounded-full transition-all"
                style={{
                  background: isPrivate ? ACCENT : CARD,
                }}
              >
                <div
                  className="absolute top-[2px] w-[20px] h-[20px] rounded-full transition-all"
                  style={{
                    background: isPrivate ? BG : TEXT_MUTED,
                    left: isPrivate ? 22 : 2,
                  }}
                />
              </button>
            </div>

            {isPrivate && (
              <p
                className="text-[12px] mb-4 -mt-3"
                style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
              >
                PIN will be generated
              </p>
            )}

            {/* Info */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-[12px] mb-6"
              style={{ background: CARD }}
            >
              <span
                className="text-[12px]"
                style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
              >
                ფსონი: {wager} / გოლები: {goalTarget}
              </span>
            </div>

            {/* Create button */}
            <button
              onClick={handleCreate}
              className="w-full py-3.5 rounded-[12px] text-[15px] font-bold transition-all active:scale-[0.97]"
              style={{
                background: ACCENT,
                color: BG,
                fontFamily: "var(--font-outfit)",
              }}
            >
              შექმნა
            </button>
          </>
        ) : (
          <>
            {/* Room created — show code */}
            <h3
              className="text-[18px] font-bold mb-2"
              style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
            >
              ოთახი შეიქმნა
            </h3>
            <p
              className="text-[12px] mb-6"
              style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
            >
              გაუზიარე კოდი მეგობარს
            </p>

            {/* Room code */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <p
                className="text-[32px] font-bold tracking-[0.2em]"
                style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
              >
                {createdRoom.roomId}
              </p>

              {createdRoom.pin && (
                <p
                  className="text-[14px]"
                  style={{ color: TEXT_SECONDARY, fontFamily: "var(--font-dm-sans)" }}
                >
                  PIN: <span style={{ color: ACCENT, fontWeight: 700, letterSpacing: "0.15em" }}>{createdRoom.pin}</span>
                </p>
              )}
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopyCode}
              className="w-full py-3 rounded-[12px] text-[13px] font-bold mb-4 transition-all active:scale-[0.97]"
              style={{
                background: CARD,
                color: TEXT_PRIMARY,
                fontFamily: "var(--font-outfit)",
              }}
            >
              კოპირება
            </button>

            {/* Waiting indicator */}
            {waiting && (
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ background: ACCENT }}
                />
                <p
                  className="text-[12px]"
                  style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
                >
                  მოთამაშის მოლოდინში...
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
