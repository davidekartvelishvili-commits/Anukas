"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getSocket } from "@/services/socket";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MultiplayerGameConfig {
  roomId: string;
  yourSide: "bottom" | "top";
  wager: number;
  goalTarget: number;
  opponentName: string;
}

interface RoomInfo {
  id: string;
  players: { displayName: string; side: string }[];
  wager: number;
  goalTarget: number;
  status: "waiting" | "playing" | "finished";
  spectatorCount: number;
  score?: { bottom: number; top: number };
}

interface LobbyScreenProps {
  onGameStart: (config: MultiplayerGameConfig) => void;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const BG = "#0A0F1C";
const SURFACE = "#141B2D";
const CARD = "#1C2539";
const ACCENT = "#FFE500";
const SELECTED = "#A8E06C";
const TEXT_PRIMARY = "#F1F5F9";
const TEXT_SECONDARY = "#94A3B8";
const TEXT_MUTED = "#64748B";

const WAGER_OPTIONS = [50, 100, 250, 500, 1000];
const GOAL_OPTIONS = [5, 10, 15, 20];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LobbyScreen({ onGameStart }: LobbyScreenProps) {
  const [wager, setWager] = useState(100);
  const [goalTarget, setGoalTarget] = useState(5);
  const [searching, setSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);

  // Listen for socket events
  useEffect(() => {
    const socket = getSocket();

    const handleRoomList = (list: RoomInfo[]) => {
      setRooms(list);
    };

    const handleMatchFound = (config: {
      roomId: string;
      yourSide: "bottom" | "top";
      wager: number;
      goalTarget: number;
      opponentName: string;
    }) => {
      setSearching(false);
      onGameStart(config);
    };

    const handleQueueCancelled = () => {
      setSearching(false);
    };

    socket.on("roomList", handleRoomList);
    socket.on("matchFound", handleMatchFound);
    socket.on("queueCancelled", handleQueueCancelled);

    // Request room list on mount
    socket.emit("getRooms");

    return () => {
      socket.off("roomList", handleRoomList);
      socket.off("matchFound", handleMatchFound);
      socket.off("queueCancelled", handleQueueCancelled);
    };
  }, [onGameStart]);

  const handlePlayOnline = useCallback(() => {
    const socket = getSocket();
    setSearching(true);
    socket.emit("joinQueue", { wager, goalTarget });
  }, [wager, goalTarget]);

  const handleCancelSearch = useCallback(() => {
    const socket = getSocket();
    socket.emit("leaveQueue");
    setSearching(false);
  }, []);

  const handleRoomTap = useCallback(
    (room: RoomInfo) => {
      const socket = getSocket();
      if (room.status === "waiting") {
        socket.emit("joinRoom", { roomId: room.id });
      } else if (room.status === "playing") {
        socket.emit("spectateRoom", { roomId: room.id });
      }
    },
    []
  );

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-[420px] mx-auto px-4 pb-6 overflow-y-auto">
      {/* Title */}
      <div className="mt-4 mb-6 text-center">
        <h2
          className="text-[22px] font-bold"
          style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
        >
          Air Hockey
        </h2>
        <p
          className="text-[13px] mt-1"
          style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
        >
          მრავალმოთამაშე
        </p>
      </div>

      {/* Wager selector */}
      <div className="w-full mb-4">
        <p
          className="text-[12px] font-semibold mb-2 uppercase tracking-wider"
          style={{ color: TEXT_SECONDARY, fontFamily: "var(--font-dm-sans)" }}
        >
          ფსონი
        </p>
        <div className="flex gap-2">
          {WAGER_OPTIONS.map((w) => (
            <button
              key={w}
              onClick={() => setWager(w)}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[29px] text-[13px] font-bold transition-all active:scale-[0.97]"
              style={{
                background: wager === w ? SELECTED : CARD,
                color: wager === w ? BG : TEXT_SECONDARY,
                fontFamily: "var(--font-outfit)",
              }}
            >
              <Image
                src="/images/coin-icon.png"
                alt=""
                width={14}
                height={14}
                className="shrink-0"
              />
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Goal target selector */}
      <div className="w-full mb-6">
        <p
          className="text-[12px] font-semibold mb-2 uppercase tracking-wider"
          style={{ color: TEXT_SECONDARY, fontFamily: "var(--font-dm-sans)" }}
        >
          გოლები გასამარჯვებლად
        </p>
        <div className="flex gap-2">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g}
              onClick={() => setGoalTarget(g)}
              className="flex-1 py-2.5 rounded-[29px] text-[14px] font-bold transition-all active:scale-[0.97]"
              style={{
                background: goalTarget === g ? SELECTED : CARD,
                color: goalTarget === g ? BG : TEXT_SECONDARY,
                fontFamily: "var(--font-outfit)",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full items-center mb-8">
        <button
          onClick={handlePlayOnline}
          className="w-[200px] h-[50px] rounded-[25px] text-[15px] font-bold transition-all active:scale-[0.96]"
          style={{
            background: ACCENT,
            color: BG,
            fontFamily: "var(--font-outfit)",
          }}
        >
          ონლაინ თამაში
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-[200px] h-[50px] rounded-[25px] text-[15px] font-bold transition-all active:scale-[0.96]"
          style={{
            background: CARD,
            color: TEXT_PRIMARY,
            fontFamily: "var(--font-outfit)",
          }}
        >
          ოთახის შექმნა
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          className="w-[200px] h-[50px] rounded-[25px] text-[15px] font-bold transition-all active:scale-[0.96]"
          style={{
            background: CARD,
            color: TEXT_PRIMARY,
            fontFamily: "var(--font-outfit)",
          }}
        >
          კოდით შესვლა
        </button>
      </div>

      {/* Active Rooms */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#22C55E", animation: "pulse 2s infinite" }}
          />
          <p
            className="text-[13px] font-semibold"
            style={{ color: TEXT_SECONDARY, fontFamily: "var(--font-dm-sans)" }}
          >
            ლაივ თამაშები
          </p>
        </div>

        {rooms.length === 0 && (
          <p
            className="text-[12px] text-center py-6"
            style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
          >
            აქტიური თამაშები არ არის
          </p>
        )}

        <div className="flex flex-col gap-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomTap(room)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] transition-all active:scale-[0.98]"
              style={{ background: SURFACE }}
            >
              <div className="flex flex-col items-start">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
                >
                  {room.players.map((p) => p.displayName).join(" vs ")}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Image
                    src="/images/coin-icon.png"
                    alt=""
                    width={12}
                    height={12}
                  />
                  <span
                    className="text-[11px]"
                    style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
                  >
                    {room.wager}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                {room.status === "playing" && room.score ? (
                  <p
                    className="text-[14px] font-bold"
                    style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
                  >
                    {room.score.bottom} — {room.score.top}
                  </p>
                ) : (
                  <p
                    className="text-[12px]"
                    style={{ color: ACCENT, fontFamily: "var(--font-dm-sans)" }}
                  >
                    Waiting...
                  </p>
                )}
                {room.spectatorCount > 0 && (
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
                  >
                    {room.spectatorCount} watching
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Searching overlay */}
      {searching && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: "rgba(10,15,28,0.9)" }}
        >
          {/* Spinner */}
          <div
            className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin mb-5"
            style={{ borderColor: `${ACCENT} transparent ${ACCENT} ${ACCENT}` }}
          />
          <p
            className="text-[16px] font-semibold mb-1"
            style={{ color: TEXT_PRIMARY, fontFamily: "var(--font-outfit)" }}
          >
            მოთამაშის ძებნა...
          </p>
          <p
            className="text-[12px] mb-6"
            style={{ color: TEXT_MUTED, fontFamily: "var(--font-dm-sans)" }}
          >
            {wager} coins / {goalTarget} goals
          </p>
          <button
            onClick={handleCancelSearch}
            className="px-8 py-3 rounded-[12px] text-[14px] font-bold transition-all active:scale-[0.97]"
            style={{
              background: CARD,
              color: TEXT_PRIMARY,
              fontFamily: "var(--font-outfit)",
            }}
          >
            გაუქმება
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModalInline
          wager={wager}
          goalTarget={goalTarget}
          onClose={() => setShowCreateModal(false)}
          onGameStart={onGameStart}
        />
      )}
      {showJoinModal && (
        <JoinRoomModalInline
          onClose={() => setShowJoinModal(false)}
          onGameStart={onGameStart}
        />
      )}

      {/* Pulse animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ── Inline modals (thin wrappers that re-export from separate files) ──────────
// These are inline for tree-shaking; the full modal components are in their own files.

function CreateRoomModalInline({
  wager,
  goalTarget,
  onClose,
  onGameStart,
}: {
  wager: number;
  goalTarget: number;
  onClose: () => void;
  onGameStart: (config: MultiplayerGameConfig) => void;
}) {
  // Dynamically import to keep LobbyScreen lean
  const [Modal, setModal] = useState<React.ComponentType<{
    wager: number;
    goalTarget: number;
    onClose: () => void;
    onGameStart: (config: MultiplayerGameConfig) => void;
  }> | null>(null);

  useEffect(() => {
    import("./CreateRoomModal").then((mod) => setModal(() => mod.default));
  }, []);

  if (!Modal) return null;
  return (
    <Modal
      wager={wager}
      goalTarget={goalTarget}
      onClose={onClose}
      onGameStart={onGameStart}
    />
  );
}

function JoinRoomModalInline({
  onClose,
  onGameStart,
}: {
  onClose: () => void;
  onGameStart: (config: MultiplayerGameConfig) => void;
}) {
  const [Modal, setModal] = useState<React.ComponentType<{
    onClose: () => void;
    onGameStart: (config: MultiplayerGameConfig) => void;
  }> | null>(null);

  useEffect(() => {
    import("./JoinRoomModal").then((mod) => setModal(() => mod.default));
  }, []);

  if (!Modal) return null;
  return <Modal onClose={onClose} onGameStart={onGameStart} />;
}
