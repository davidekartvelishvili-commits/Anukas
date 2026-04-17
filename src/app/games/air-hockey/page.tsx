"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

// Lazy-loaded after the engine + canvas are ready
import type { GameState } from "@/components/air-hockey/AirHockeyEngine";

type Difficulty = "easy" | "medium" | "hard";
type GoalTarget = 5 | 10 | 15 | 20;

const GOAL_OPTIONS: GoalTarget[] = [5, 10, 15, 20];
const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; labelKa: string; color: string }[] = [
  { value: "easy", label: "Easy", labelKa: "მარტივი", color: "#22C55E" },
  { value: "medium", label: "Medium", labelKa: "საშუალო", color: "#F59E0B" },
  { value: "hard", label: "Hard", labelKa: "რთული", color: "#EF4444" },
];

export default function AirHockeyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"menu" | "playing" | "finished">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [goalTarget, setGoalTarget] = useState<GoalTarget>(5);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const engineRef = useRef<typeof import("@/components/air-hockey/AirHockeyEngine") | null>(null);
  const gameLoopRef = useRef<number>(0);
  const stateRef = useRef<GameState | null>(null);

  // Measure available space for the canvas
  useEffect(() => {
    function measure() {
      const maxW = Math.min(window.innerWidth - 16, 420);
      const maxH = window.innerHeight - 180; // leave room for header + bottom
      // Field is portrait: aspect ratio ~1:1.6
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

  // Start game
  const startGame = useCallback(async () => {
    const engine = await import("@/components/air-hockey/AirHockeyEngine");
    engineRef.current = engine;
    const initial = engine.createInitialState(goalTarget, difficulty);
    stateRef.current = initial;
    setGameState(initial);
    setPhase("playing");
  }, [goalTarget, difficulty]);

  // Game loop
  useEffect(() => {
    if (phase !== "playing" || !engineRef.current) return;
    let lastTime = 0;

    function tick(time: number) {
      if (!engineRef.current || !stateRef.current) return;
      const dt = lastTime ? Math.min((time - lastTime) / 16.667, 3) : 1; // normalized to 60fps
      lastTime = time;

      let s = stateRef.current;

      // Engine handles goal-pause internally (_goalPauseFrames counts
      // down 60 frames then auto-resets). All we do is call updateGame
      // every frame — it returns unchanged state during the pause.
      s = engineRef.current.updateGame(s, dt);

      if (s.status === "finished") {
        stateRef.current = s;
        setGameState(s);
        setPhase("finished");
        return;
      }

      stateRef.current = s;
      setGameState(s);
      gameLoopRef.current = requestAnimationFrame(tick);
    }

    gameLoopRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [phase]);

  // Player input
  const handlePlayerMove = useCallback((x: number, y: number) => {
    if (!engineRef.current || !stateRef.current) return;
    stateRef.current = engineRef.current.movePlayer(stateRef.current, x, y);
  }, []);

  // Restart
  const handleRestart = () => {
    setPhase("menu");
    setGameState(null);
    stateRef.current = null;
  };

  return (
    <AuthGuard>
      <div className="min-h-[100dvh] flex flex-col items-center" style={{ background: "#0A0F1C" }}>
        {/* Header */}
        <div
          className="w-full flex items-center px-4 shrink-0"
          style={{ height: 56, paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <button
            onClick={() => router.back()}
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

        {/* Menu */}
        {phase === "menu" && (
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
                      background: difficulty === d.value ? d.color + "20" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${difficulty === d.value ? d.color : "rgba(255,255,255,0.08)"}`,
                      color: difficulty === d.value ? d.color : "#94A3B8",
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
                      background: goalTarget === g ? "#FFE500" + "20" : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${goalTarget === g ? "#FFE500" : "rgba(255,255,255,0.08)"}`,
                      color: goalTarget === g ? "#FFE500" : "#94A3B8",
                      fontFamily: "var(--font-outfit)",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Play button */}
            <button
              onClick={startGame}
              className="w-full py-4 rounded-[12px] text-[18px] font-bold active:scale-[0.97] transition-transform"
              style={{
                background: "#FFE500",
                color: "#0A0F1C",
                fontFamily: "var(--font-outfit)",
              }}
            >
              თამაში
            </button>

            {/* Robot indicator */}
            <p className="text-[12px]" style={{ color: "#64748B", fontFamily: "var(--font-dm-sans)" }}>
              🤖 vs Robot ({DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.label})
            </p>
          </div>
        )}

        {/* Game */}
        {phase === "playing" && gameState && canvasSize.w > 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            {/* Score bar */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "#F97316" }} />
                <span className="text-[24px] font-bold" style={{ color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}>
                  {gameState.score.opponent}
                </span>
              </div>
              <span className="text-[16px]" style={{ color: "#475569" }}>—</span>
              <div className="flex items-center gap-2">
                <span className="text-[24px] font-bold" style={{ color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}>
                  {gameState.score.player}
                </span>
                <div className="w-3 h-3 rounded-full" style={{ background: "#FFE500" }} />
              </div>
            </div>

            {/* Canvas */}
            <GameCanvasLazy
              gameState={gameState}
              onPlayerMove={handlePlayerMove}
              width={canvasSize.w}
              height={canvasSize.h}
            />

            {/* Goal target info */}
            <p className="text-[11px]" style={{ color: "#64748B", fontFamily: "var(--font-dm-sans)" }}>
              პირველი {goalTarget} გოლამდე
            </p>
          </div>
        )}

        {/* Finished */}
        {phase === "finished" && gameState && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: gameState.winner === "player" ? "#FFE50015" : "#EF444415",
              }}
            >
              <span className="text-[40px]">{gameState.winner === "player" ? "🏆" : "😔"}</span>
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
                onClick={startGame}
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
      </div>
    </AuthGuard>
  );
}

// Lazy wrapper for GameCanvas (imported dynamically since the engine
// is loaded asynchronously on game start)
function GameCanvasLazy(props: {
  gameState: GameState;
  onPlayerMove: (x: number, y: number) => void;
  width: number;
  height: number;
}) {
  const [Canvas, setCanvas] = useState<React.ComponentType<typeof props> | null>(null);

  useEffect(() => {
    import("@/components/air-hockey/GameCanvas").then((mod) => {
      setCanvas(() => mod.default);
    });
  }, []);

  if (!Canvas) return <div style={{ width: props.width, height: props.height, background: "#141B2D", borderRadius: 16 }} />;
  return <Canvas {...props} />;
}
