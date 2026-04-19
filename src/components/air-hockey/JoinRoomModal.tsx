"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
const ERROR = "#EF4444";

// ── Props ─────────────────────────────────────────────────────────────────────

interface JoinRoomModalProps {
  onClose: () => void;
  onGameStart: (config: MultiplayerGameConfig) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function JoinRoomModal({ onClose, onGameStart }: JoinRoomModalProps) {
  const [roomCode, setRoomCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleMatchFound = (config: {
      roomId: string;
      yourSide: "bottom" | "top";
      wager: number;
      goalTarget: number;
      opponentName: string;
    }) => {
      setJoining(false);
      onGameStart(config);
    };

    const handleJoinError = (data: { message: string }) => {
      setJoining(false);
      setError(data.message || "Room not found");
    };

    socket.on("matchFound", handleMatchFound);
    socket.on("joinError", handleJoinError);

    return () => {
      socket.off("matchFound", handleMatchFound);
      socket.off("joinError", handleJoinError);
    };
  }, [onGameStart]);

  const handleJoin = useCallback(() => {
    if (roomCode.length < 1) {
      setError("Enter room code");
      return;
    }
    setError("");
    setJoining(true);
    const socket = getSocket();
    socket.emit("joinRoom", {
      roomId: roomCode.toUpperCase(),
      pin: pin || undefined,
    });
  }, [roomCode, pin]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setRoomCode(val);
    setError("");
  }, []);

  const handlePinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setPin(val);
    setError("");
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(10,15,28,0.9)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] rounded-[16px] p-6 relative"
        style={{ background: SURFACE }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.9]"
          style={{ color: TEXT_SECONDARY }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <h3
          className="text-[18px] font-bold mb-6"
          style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
        >
          Join by Code
        </h3>

        {/* Room code input */}
        <div className="mb-4">
          <label
            className="block text-[12px] font-semibold mb-2 uppercase tracking-wider"
            style={{ color: TEXT_SECONDARY, fontFamily: "var(--font-dm-sans)" }}
          >
            Room Code
          </label>
          <input
            ref={codeInputRef}
            type="text"
            value={roomCode}
            onChange={handleCodeChange}
            placeholder="XXXXXX"
            maxLength={6}
            autoFocus
            className="w-full text-center text-[20px] font-bold tracking-[0.3em] py-3 px-4 rounded-[12px] outline-none transition-all focus:ring-1"
            style={{
              background: BG,
              border: `1px solid ${CARD}`,
              color: TEXT_PRIMARY,
              fontFamily: "var(--font-outfit)",
              caretColor: ACCENT,
            }}
          />
        </div>

        {/* PIN input */}
        <div className="mb-5">
          <label
            className="block text-[12px] font-semibold mb-2 uppercase tracking-wider"
            style={{ color: TEXT_SECONDARY, fontFamily: "var(--font-dm-sans)" }}
          >
            PIN (for private rooms)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={handlePinChange}
            placeholder="----"
            maxLength={4}
            className="w-full text-center text-[20px] font-bold tracking-[0.3em] py-3 px-4 rounded-[12px] outline-none transition-all focus:ring-1"
            style={{
              background: BG,
              border: `1px solid ${CARD}`,
              color: TEXT_PRIMARY,
              fontFamily: "var(--font-outfit)",
              caretColor: ACCENT,
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p
            className="text-[12px] mb-3 text-center"
            style={{ color: ERROR, fontFamily: "var(--font-dm-sans)" }}
          >
            {error}
          </p>
        )}

        {/* Join button */}
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full py-3.5 rounded-[12px] text-[15px] font-bold transition-all active:scale-[0.97] disabled:opacity-60"
          style={{
            background: ACCENT,
            color: BG,
            fontFamily: "var(--font-outfit)",
          }}
        >
          {joining ? "..." : "Join"}
        </button>
      </div>
    </div>
  );
}
