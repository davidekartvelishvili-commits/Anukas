"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

import type { GameState } from "@/components/air-hockey/AirHockeyEngine";
import type { MultiplayerGameConfig } from "@/components/air-hockey/LobbyScreen";
import { FIELD_W, FIELD_H } from "@/components/air-hockey/AirHockeyEngine";

type Difficulty = "easy" | "medium" | "hard";
type GoalTarget = 5 | 10 | 15 | 20;
type Mode = "menu" | "lobby" | "playing" | "finished";

const GOAL_OPTIONS: GoalTarget[] = [5, 10, 15, 20];
const SELECTOR_ACTIVE = "#A8E06C";
const SELECTOR_ACTIVE_TEXT = "#0A0F1C";

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; labelKa: string }[] = [
  { value: "easy", label: "Easy", labelKa: "მარტივი" },
  { value: "medium", label: "Medium", labelKa: "საშუალო" },
  { value: "hard", label: "Hard", labelKa: "რთული" },
];

// ── Multiplayer state held outside React for socket handler access ────────────

interface MultiplayerState {
  roomId: string;
  yourSide: "bottom" | "top";
  wager: number;
  goalTarget: number;
  opponentName: string;
  opponentDisconnected: boolean;
  robotActive: boolean;
  disconnectCountdown: number;
}

export default function AirHockeyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");
  const [multiplayer, setMultiplayer] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [goalTarget, setGoalTarget] = useState<GoalTarget>(5);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const engineRef = useRef<typeof import("@/components/air-hockey/AirHockeyEngine") | null>(null);
  const gameLoopRef = useRef<number>(0);
  const stateRef = useRef<GameState | null>(null);

  // Multiplayer state
  const [mpConfig, setMpConfig] = useState<MultiplayerState | null>(null);
  const [mpGameOver, setMpGameOver] = useState<{
    won: boolean;
    scorePlayer: number;
    scoreOpponent: number;
    opponentWasRobot: boolean;
  } | null>(null);

  // Auto-join from shared link: ?room=XXXX&pin=1234
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get("room");
    const pin = params.get("pin");
    if (roomCode) {
      // Go straight to lobby, then auto-join once socket connects
      setMode("lobby");
      setTimeout(async () => {
        const { connectSocket, getSocket } = await import("@/services/socket");
        const token = localStorage.getItem("shansi_token") || "";
        connectSocket(token);
        const socket = getSocket();
        // Wait briefly for socket to connect, then join
        const tryJoin = () => {
          if (socket.connected) {
            socket.emit("joinRoom", { roomId: roomCode.toUpperCase(), pin: pin || undefined });
          } else {
            setTimeout(tryJoin, 300);
          }
        };
        setTimeout(tryJoin, 500);
      }, 100);
    }
  }, []);

  // Measure available space for the canvas
  useEffect(() => {
    function measure() {
      const maxW = Math.min(window.innerWidth - 16, 420);
      const maxH = window.innerHeight - 180;
      const fieldAspect = 1.6;
      let w = maxW;
      let h = w * fieldAspect;
      if (h > maxH) { h = maxH; w = h / fieldAspect; }
      setCanvasSize({ w: Math.floor(w), h: Math.floor(h) });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Connect socket when entering lobby
  useEffect(() => {
    if (mode !== "lobby") return;

    let socket: ReturnType<typeof import("@/services/socket").getSocket> | null = null;

    import("@/services/socket").then(({ connectSocket }) => {
      const token = localStorage.getItem("shansi_token") || "";
      socket = connectSocket(token);
    });

    return () => {
      // Don't disconnect when transitioning to playing — only on full exit
    };
  }, [mode]);

  // ── Single player: Start game ───────────────────────────────────────────────

  const startSinglePlayer = useCallback(async () => {
    const engine = await import("@/components/air-hockey/AirHockeyEngine");
    engineRef.current = engine;
    const initial = engine.createInitialState(goalTarget, difficulty);
    stateRef.current = initial;
    setGameState(initial);
    setMultiplayer(false);
    setMode("playing");
  }, [goalTarget, difficulty]);

  // ── Single player: Game loop ────────────────────────────────────────────────

  useEffect(() => {
    if (mode !== "playing" || multiplayer || !engineRef.current) return;
    let lastTime = 0;

    function tick(time: number) {
      if (!engineRef.current || !stateRef.current) return;
      const dt = lastTime ? Math.min((time - lastTime) / 16.667, 3) : 1;
      lastTime = time;

      let s = stateRef.current;
      s = engineRef.current.updateGame(s, dt);

      if (s.status === "finished") {
        stateRef.current = s;
        setGameState(s);
        setMode("finished");
        return;
      }

      stateRef.current = s;
      setGameState(s);
      gameLoopRef.current = requestAnimationFrame(tick);
    }

    gameLoopRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [mode, multiplayer]);

  // ── Single player: Player input ─────────────────────────────────────────────

  const handlePlayerMove = useCallback((x: number, y: number) => {
    if (multiplayer) {
      // In multiplayer, send paddle position to server
      import("@/services/socket").then(({ getSocket }) => {
        const socket = getSocket();
        socket.emit("paddleMove", { x, y });
      });
      return;
    }
    if (!engineRef.current || !stateRef.current) return;
    stateRef.current = engineRef.current.movePlayer(stateRef.current, x, y);
  }, [multiplayer]);

  // ── Multiplayer: handle lobby → game start ──────────────────────────────────

  const handleMultiplayerGameStart = useCallback((config: MultiplayerGameConfig) => {
    setMpConfig({
      roomId: config.roomId,
      yourSide: config.yourSide,
      wager: config.wager,
      goalTarget: config.goalTarget,
      opponentName: config.opponentName,
      opponentDisconnected: false,
      robotActive: false,
      disconnectCountdown: 15,
    });
    setMultiplayer(true);
    setMpGameOver(null);
    setMode("playing");

    // Listen for multiplayer game events
    import("@/services/socket").then(({ getSocket }) => {
      const socket = getSocket();

      // Remove any old listeners to avoid duplication
      socket.off("gameState");
      socket.off("gameOver");
      socket.off("opponentDisconnected");
      socket.off("robotTakeover");

      socket.on("gameState", (serverState: any) => {
        // Transform server state shape (paddles.bottom/top, score.bottom/top)
        // into the GameState shape the canvas expects (player/opponent, score.player/opponent).
        // If we are "top" side, swap player/opponent so we always see ourselves at the bottom.
        const yourSide = config.yourSide;
        const isBottom = yourSide === "bottom";
        const myPaddle = isBottom ? serverState.paddles?.bottom : serverState.paddles?.top;
        const theirPaddle = isBottom ? serverState.paddles?.top : serverState.paddles?.bottom;

        const transformed: GameState = {
          puck: isBottom
            ? serverState.puck
            : { ...serverState.puck, y: FIELD_H - serverState.puck.y, vy: -(serverState.puck.vy || 0) },
          player: myPaddle
            ? (isBottom
              ? { x: myPaddle.x, y: myPaddle.y, r: myPaddle.r || 0.045 }
              : { x: myPaddle.x, y: FIELD_H - myPaddle.y, r: myPaddle.r || 0.045 })
            : { x: 0.5, y: FIELD_H * 0.82, r: 0.045 },
          opponent: theirPaddle
            ? (isBottom
              ? { x: theirPaddle.x, y: theirPaddle.y, r: theirPaddle.r || 0.045 }
              : { x: theirPaddle.x, y: FIELD_H - theirPaddle.y, r: theirPaddle.r || 0.045 })
            : { x: 0.5, y: FIELD_H * 0.18, r: 0.045 },
          score: {
            player: isBottom ? (serverState.score?.bottom ?? 0) : (serverState.score?.top ?? 0),
            opponent: isBottom ? (serverState.score?.top ?? 0) : (serverState.score?.bottom ?? 0),
          },
          goalTarget: serverState.goalTarget || config.goalTarget,
          status: serverState.status || "playing",
          winner: serverState.winner
            ? (serverState.winner === yourSide ? "player" : "opponent")
            : null,
          robotDifficulty: "medium",
          _goalPauseFrames: serverState.goalPauseFrames || 0,
          _lastScoredOn: null,
        };
        setGameState(transformed);
      });

      socket.on("gameOver", (data: any) => {
        const yourSide = config.yourSide;
        const won = data.winner === yourSide;
        const score = data.score || { bottom: 0, top: 0 };
        const scorePlayer = yourSide === "bottom" ? (score.bottom ?? 0) : (score.top ?? 0);
        const scoreOpponent = yourSide === "bottom" ? (score.top ?? 0) : (score.bottom ?? 0);

        setMpGameOver({
          won,
          scorePlayer,
          scoreOpponent,
          opponentWasRobot: data.opponentWasRobot,
        });
        setMode("finished");
      });

      socket.on("opponentDisconnected", (data: { countdown: number }) => {
        setMpConfig((prev) =>
          prev ? { ...prev, opponentDisconnected: true, disconnectCountdown: data.countdown } : prev
        );
      });

      socket.on("robotTakeover", () => {
        setMpConfig((prev) =>
          prev ? { ...prev, robotActive: true } : prev
        );
      });
    });
  }, []);

  // ── Multiplayer: handle rematch ─────────────────────────────────────────────

  const handleMultiplayerRematch = useCallback(() => {
    if (!mpConfig) return;
    import("@/services/socket").then(({ getSocket }) => {
      const socket = getSocket();
      socket.emit("rematch", { roomId: mpConfig.roomId });
    });
    setMpGameOver(null);
    setMode("playing");
  }, [mpConfig]);

  // ── Navigation helpers ──────────────────────────────────────────────────────

  const handleRestart = () => {
    setMode("menu");
    setGameState(null);
    stateRef.current = null;
    setMultiplayer(false);
    setMpConfig(null);
    setMpGameOver(null);
  };

  const handleBackToMenu = () => {
    if (multiplayer && mpConfig) {
      import("@/services/socket").then(({ getSocket }) => {
        const socket = getSocket();
        socket.emit("leaveRoom", { roomId: mpConfig.roomId });
        socket.off("gameState");
        socket.off("gameOver");
        socket.off("opponentDisconnected");
        socket.off("robotTakeover");
      });
    }
    handleRestart();
  };

  // ── Flip helper for top-side multiplayer ────────────────────────────────────
  // When yourSide === "top", we need to flip the y-axis so the player
  // always sees themselves at the bottom of the screen.

  const displayState = (() => {
    if (!gameState) return null;
    if (!multiplayer || !mpConfig || mpConfig.yourSide === "bottom") return gameState;

    // Flip: invert all y coordinates, swap player/opponent
    return {
      ...gameState,
      puck: {
        ...gameState.puck,
        x: gameState.puck.x,
        y: FIELD_H - gameState.puck.y,
        vx: gameState.puck.vx,
        vy: -gameState.puck.vy,
      },
      player: {
        ...gameState.opponent, // server's "opponent" is actually us when flipped
        y: FIELD_H - gameState.opponent.y,
      },
      opponent: {
        ...gameState.player, // server's "player" (bottom) is our opponent
        y: FIELD_H - gameState.player.y,
      },
      score: {
        player: gameState.score.opponent,
        opponent: gameState.score.player,
      },
      winner: gameState.winner === "player"
        ? "opponent" as const
        : gameState.winner === "opponent"
          ? "player" as const
          : null,
    };
  })();

  return (
    <AuthGuard>
      <div className="min-h-[100dvh] flex flex-col items-center" style={{ background: "#0A0F1C" }}>
        {/* Header */}
        <div
          className="w-full flex items-center px-4 shrink-0"
          style={{ height: 56, paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <button
            onClick={() => {
              if (mode === "lobby") {
                setMode("menu");
                setMultiplayer(false);
              } else if (mode === "playing" || mode === "finished") {
                handleBackToMenu();
              } else {
                router.back();
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 4l-6 6 6 6" />
            </svg>
          </button>
          <h1
            className="flex-1 text-center text-[18px] font-bold"
            style={{ color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}
          >
            Air Hockey
          </h1>
          <div className="w-10" />
        </div>

        {/* ── Menu ─────────────────────────────────────────────────── */}
        {mode === "menu" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 max-w-[380px] w-full">
            {/* Difficulty */}
            <div className="w-full">
              <p className="text-[12px] font-semibold mb-2 uppercase tracking-wider" style={{ color: "#94A3B8", fontFamily: "var(--font-dm-sans)" }}>
                სირთულე
              </p>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className="flex-1 py-3 rounded-[12px] text-[14px] font-bold transition-all active:scale-[0.97]"
                    style={{
                      background: difficulty === d.value ? SELECTOR_ACTIVE : "#1C2539",
                      border: `1.5px solid ${difficulty === d.value ? SELECTOR_ACTIVE : "#1C2539"}`,
                      color: difficulty === d.value ? SELECTOR_ACTIVE_TEXT : "#94A3B8",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    {d.labelKa}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal target */}
            <div className="w-full">
              <p className="text-[12px] font-semibold mb-2 uppercase tracking-wider" style={{ color: "#94A3B8", fontFamily: "var(--font-dm-sans)" }}>
                გოლები გასამარჯვებლად
              </p>
              <div className="flex gap-2">
                {GOAL_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoalTarget(g)}
                    className="flex-1 py-3 rounded-[12px] text-[16px] font-bold transition-all active:scale-[0.97]"
                    style={{
                      background: goalTarget === g ? SELECTOR_ACTIVE : "#1C2539",
                      border: `1.5px solid ${goalTarget === g ? SELECTOR_ACTIVE : "#1C2539"}`,
                      color: goalTarget === g ? SELECTOR_ACTIVE_TEXT : "#94A3B8",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode buttons */}
            <div className="flex flex-col gap-3 items-center w-full">
              <button
                onClick={startSinglePlayer}
                className="w-[200px] h-[58px] rounded-[29px] text-[17px] font-bold active:scale-[0.96] transition-transform"
                style={{
                  background: "#1C2539",
                  color: "#F1F5F9",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                vs Robot
              </button>
              <button
                onClick={() => setMode("lobby")}
                className="w-[200px] h-[58px] rounded-[29px] text-[17px] font-bold active:scale-[0.96] transition-transform"
                style={{
                  background: "#FFE500",
                  color: "#0A0F1C",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                Multiplayer
              </button>
            </div>
          </div>
        )}

        {/* ── Lobby ────────────────────────────────────────────────── */}
        {mode === "lobby" && (
          <LobbyScreenLazy onGameStart={handleMultiplayerGameStart} />
        )}

        {/* ── Playing ──────────────────────────────────────────────── */}
        {mode === "playing" && displayState && canvasSize.w > 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            {/* Score bar */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "#F97316" }} />
                <span className="text-[24px] font-bold" style={{ color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}>
                  {displayState.score.opponent}
                </span>
              </div>
              <span className="text-[16px]" style={{ color: "#475569" }}>—</span>
              <div className="flex items-center gap-2">
                <span className="text-[24px] font-bold" style={{ color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}>
                  {displayState.score.player}
                </span>
                <div className="w-3 h-3 rounded-full" style={{ background: "#FFE500" }} />
              </div>
            </div>

            {/* Multiplayer opponent name */}
            {multiplayer && mpConfig && (
              <p className="text-[11px]" style={{ color: "#64748B", fontFamily: "var(--font-dm-sans)" }}>
                vs {mpConfig.opponentName}
                {mpConfig.robotActive && " (Robot)"}
              </p>
            )}

            {/* Canvas */}
            <GameCanvasLazy
              gameState={displayState}
              onPlayerMove={handlePlayerMove}
              width={canvasSize.w}
              height={canvasSize.h}
            />

            {/* Goal target info */}
            <p className="text-[11px]" style={{ color: "#64748B", fontFamily: "var(--font-dm-sans)" }}>
              პირველი {multiplayer && mpConfig ? mpConfig.goalTarget : goalTarget} გოლამდე
            </p>
          </div>
        )}

        {/* ── Finished (single player) ─────────────────────────────── */}
        {mode === "finished" && !multiplayer && gameState && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: gameState.winner === "player" ? "#FFE500" : "#EF4444",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0A0F1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {gameState.winner === "player"
                  ? <polyline points="8,12 11,15 16,9" />
                  : <><line x1="8" y1="8" x2="16" y2="16" /><line x1="16" y1="8" x2="8" y2="16" /></>}
              </svg>
            </div>
            <h2
              className="text-[28px] font-bold"
              style={{
                color: gameState.winner === "player" ? "#FFE500" : "#EF4444",
                fontFamily: "var(--font-outfit)",
              }}
            >
              {gameState.winner === "player" ? "გაიმარჯვე!" : "წააგე"}
            </h2>
            <p className="text-[16px]" style={{ color: "#94A3B8", fontFamily: "var(--font-dm-sans)" }}>
              {gameState.score.player} — {gameState.score.opponent}
            </p>
            <div className="flex gap-3 w-full max-w-[300px]">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-[12px] text-[14px] font-bold active:scale-[0.97] transition-transform"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#F1F5F9",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                მენიუ
              </button>
              <button
                onClick={startSinglePlayer}
                className="flex-1 py-3 rounded-[12px] text-[14px] font-bold active:scale-[0.97] transition-transform"
                style={{
                  background: "#FFE500",
                  color: "#0A0F1C",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                თავიდან
              </button>
            </div>
          </div>
        )}

        {/* ── Finished (multiplayer) ───────────────────────────────── */}
        {mode === "finished" && multiplayer && mpGameOver && (
          <GameOverModalLazy
            won={mpGameOver.won}
            scorePlayer={mpGameOver.scorePlayer}
            scoreOpponent={mpGameOver.scoreOpponent}
            wager={mpConfig?.wager ?? 0}
            opponentWasRobot={mpGameOver.opponentWasRobot}
            onMenu={handleBackToMenu}
            onRematch={handleMultiplayerRematch}
          />
        )}

        {/* ── Disconnect overlay ───────────────────────────────────── */}
        {mode === "playing" && multiplayer && mpConfig?.opponentDisconnected && (
          <DisconnectOverlayLazy
            countdownTotal={mpConfig.disconnectCountdown}
            robotActive={mpConfig.robotActive}
          />
        )}
      </div>
    </AuthGuard>
  );
}

// ── Lazy wrappers ─────────────────────────────────────────────────────────────

import { useState as useStateLazy, useEffect as useEffectLazy } from "react";

function GameCanvasLazy(props: {
  gameState: GameState;
  onPlayerMove: (x: number, y: number) => void;
  width: number;
  height: number;
}) {
  const [Canvas, setCanvas] = useStateLazy<React.ComponentType<typeof props> | null>(null);

  useEffectLazy(() => {
    import("@/components/air-hockey/GameCanvas").then((mod) => {
      setCanvas(() => mod.default);
    });
  }, []);

  if (!Canvas) return <div style={{ width: props.width, height: props.height, background: "#141B2D", borderRadius: 16 }} />;
  return <Canvas {...props} />;
}

function LobbyScreenLazy(props: {
  onGameStart: (config: MultiplayerGameConfig) => void;
}) {
  const [Lobby, setLobby] = useStateLazy<React.ComponentType<typeof props> | null>(null);

  useEffectLazy(() => {
    import("@/components/air-hockey/LobbyScreen").then((mod) => {
      setLobby(() => mod.default);
    });
  }, []);

  if (!Lobby) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: "#FFE500 transparent #FFE500 #FFE500" }}
        />
      </div>
    );
  }
  return <Lobby {...props} />;
}

function GameOverModalLazy(props: {
  won: boolean;
  scorePlayer: number;
  scoreOpponent: number;
  wager: number;
  opponentWasRobot: boolean;
  onMenu: () => void;
  onRematch: () => void;
}) {
  const [Modal, setModal] = useStateLazy<React.ComponentType<typeof props> | null>(null);

  useEffectLazy(() => {
    import("@/components/air-hockey/GameOverModal").then((mod) => {
      setModal(() => mod.default);
    });
  }, []);

  if (!Modal) return null;
  return <Modal {...props} />;
}

function DisconnectOverlayLazy(props: {
  countdownTotal: number;
  robotActive: boolean;
}) {
  const [Overlay, setOverlay] = useStateLazy<React.ComponentType<typeof props> | null>(null);

  useEffectLazy(() => {
    import("@/components/air-hockey/DisconnectOverlay").then((mod) => {
      setOverlay(() => mod.default);
    });
  }, []);

  if (!Overlay) return null;
  return <Overlay {...props} />;
}
