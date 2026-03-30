"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DIFFICULTIES, type Difficulty, type StartResult, type StepResult } from "./game-config";

type TileState = "hidden" | "safe" | "trap" | "revealed-trap";
interface GameState {
  roundId: string;
  rows: number;
  cols: number;
  currentRow: number;
  multiplier: number;
  tiles: TileState[][];
  chickenPos: { row: number; col: number } | null;
  gameOver: boolean;
  won: boolean;
  trapMap?: number[];
}

export default function ChickenRushPage() {
  const [balance, setBalance] = useState(5000);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [betAmount, setBetAmount] = useState(0);
  const [showBetPicker, setShowBetPicker] = useState(true);
  const [game, setGame] = useState<GameState | null>(null);
  const [animating, setAnimating] = useState(false);
  const [resultText, setResultText] = useState("");
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const BET_OPTIONS = [0.25, 0.5, 1, 2.5, 5, 10];

  const config = DIFFICULTIES[difficulty];

  // Scroll grid to show current row
  useEffect(() => {
    if (!game || !gridRef.current) return;
    const rowEl = gridRef.current.querySelector(`[data-row="${game.currentRow}"]`);
    if (rowEl) rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [game?.currentRow]);

  const startRound = useCallback(async () => {
    if (betAmount <= 0 || balance < betAmount) return;
    setBalance((b) => b - betAmount);
    setResultText("");
    setShowWin(false);

    const res = await fetch("/api/chicken-rush/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty, betAmount }),
    });
    const data: StartResult = await res.json();

    const tiles: TileState[][] = [];
    for (let r = 0; r < data.rows; r++) {
      tiles.push(Array(data.cols).fill("hidden"));
    }

    setGame({
      roundId: data.roundId,
      rows: data.rows,
      cols: data.cols,
      currentRow: 0,
      multiplier: 1,
      tiles,
      chickenPos: null,
      gameOver: false,
      won: false,
    });
  }, [betAmount, balance, difficulty]);

  const handleTileClick = useCallback(async (row: number, col: number) => {
    if (!game || game.gameOver || animating || row !== game.currentRow) return;
    setAnimating(true);

    const res = await fetch("/api/chicken-rush/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: game.roundId, row, column: col }),
    });
    const data: StepResult & { trapMap?: number[] } = await res.json();

    if (data.safe) {
      // SOUND: safe_step.mp3
      const newTiles = game.tiles.map((r) => [...r]);
      newTiles[row][col] = "safe";

      const completed = data.nextRow >= game.rows;

      setGame((g) => g ? {
        ...g,
        tiles: newTiles,
        currentRow: data.nextRow,
        multiplier: data.multiplier,
        chickenPos: { row, col },
        gameOver: completed,
        won: completed,
      } : g);

      if (completed) {
        // Auto cashout on completion
        const cRes = await fetch("/api/chicken-rush/cashout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId: game.roundId, betAmount }),
        });
        const cData = await cRes.json();
        setBalance((b) => b + cData.winAmount);
        setWinAmount(cData.winAmount);
        setShowWin(true);
        setResultText(`LEGENDARY! x${data.multiplier} — +${cData.winAmount}`);
        setTimeout(() => setShowWin(false), 3000);
      }
    } else {
      // SOUND: trap_explode.mp3
      const newTiles = game.tiles.map((r) => [...r]);
      newTiles[row][col] = "trap";

      // Reveal all traps with stagger
      if (data.trapMap) {
        const trapMap = data.trapMap as number[];
        for (let r = 0; r < trapMap.length; r++) {
          if (r !== row) {
            setTimeout(() => {
              setGame((g) => {
                if (!g) return g;
                const t = g.tiles.map((row) => [...row]);
                if (t[r][trapMap[r]] === "hidden") t[r][trapMap[r]] = "revealed-trap";
                return { ...g, tiles: t };
              });
            }, r * 60);
          }
        }
      }

      setGame((g) => g ? {
        ...g,
        tiles: newTiles,
        chickenPos: { row, col },
        gameOver: true,
        won: false,
        trapMap: data.trapMap,
      } : g);
      setResultText("You hit a trap!");
    }

    setTimeout(() => setAnimating(false), 300);
  }, [game, animating, betAmount]);

  const handleCashout = useCallback(async () => {
    if (!game || game.gameOver || game.currentRow === 0) return;

    const res = await fetch("/api/chicken-rush/cashout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: game.roundId, betAmount }),
    });
    const data = await res.json();
    setBalance((b) => b + data.winAmount);
    setWinAmount(data.winAmount);
    setShowWin(true);
    setResultText(`Cashed out! +${data.winAmount}`);
    setGame((g) => g ? { ...g, gameOver: true, won: true } : g);
    setTimeout(() => setShowWin(false), 2500);
  }, [game, betAmount]);

  const resetGame = () => { setGame(null); setResultText(""); };

  return (
    <div className="relative w-full h-[100dvh] bg-[#050a1a] overflow-hidden flex flex-col">
      <style>{`
        @keyframes hop { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 8px rgba(124,77,255,0.3); } 50% { box-shadow: 0 0 18px rgba(124,77,255,0.6); } }
        @keyframes flash-red { 0% { background: rgba(255,61,0,0.3); } 100% { background: transparent; } }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, #1a237e, #0d1254 35%, #070b2e 70%, #030612)" }} />

      {/* Top Bar */}
      <div className="relative z-10 flex justify-between items-start p-3.5 shrink-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
        <button onClick={() => window.history.back()} className="w-9 h-9 rounded-full bg-white/10 border border-white/[0.12] flex items-center justify-center text-white/60 backdrop-blur-lg active:scale-[0.95] transition-transform">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l8 8M12 4L4 12" /></svg>
        </button>
        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[22px] px-5 py-2 flex flex-col items-center gap-px">
          <div className="flex items-center gap-1.5 font-bold text-[17px] text-white" style={{ fontFamily: "var(--font-outfit)" }}>
            <span className="text-[14px]">₾</span>{betAmount > 0 ? betAmount : "—"}
          </div>
          <span className="text-[10px] text-white/[0.45] font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-sans)" }}>Chicken Rush</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Multiplier */}
      {game && (
        <div className="relative z-10 text-center shrink-0 py-1">
          <span className="text-[32px] font-black text-white" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
            x{game.multiplier.toFixed(2)}
          </span>
        </div>
      )}

      {/* Difficulty selector (only before game) */}
      {!game && (
        <div className="relative z-10 flex justify-center gap-2 py-3 shrink-0">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all active:scale-[0.95] ${
                difficulty === d
                  ? `bg-opacity-20 border-current`
                  : "bg-white/5 text-white/50 border-white/10"
              }`}
              style={{ color: difficulty === d ? DIFFICULTIES[d].color : undefined, borderColor: difficulty === d ? DIFFICULTIES[d].color : undefined, background: difficulty === d ? DIFFICULTIES[d].color + "22" : undefined, fontFamily: "var(--font-dm-sans)" }}
            >
              {DIFFICULTIES[d].label}
            </button>
          ))}
        </div>
      )}

      {/* Game Grid */}
      {game && (
        <div ref={gridRef} className="relative z-10 flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
          <div className="flex flex-col-reverse gap-2 min-h-full justify-start pb-4">
            {Array.from({ length: game.rows }).map((_, row) => {
              const isCurrent = row === game.currentRow && !game.gameOver;
              const isPast = row < game.currentRow;
              const isFuture = row > game.currentRow;

              return (
                <div key={row} data-row={row} className="flex justify-center gap-2">
                  {Array.from({ length: game.cols }).map((_, col) => {
                    const state = game.tiles[row][col];
                    const isChicken = game.chickenPos?.row === row && game.chickenPos?.col === col;

                    let bg = "#12122e";
                    let border = "1px solid rgba(124,77,255,0.15)";
                    let content = "";
                    let anim = "";

                    if (state === "safe") {
                      bg = "#00E676"; border = "1px solid #00E676"; content = "✓";
                    } else if (state === "trap") {
                      bg = "#FF3D00"; border = "1px solid #FF3D00"; content = "🔥";
                      anim = "shake 0.3s ease-in-out";
                    } else if (state === "revealed-trap") {
                      bg = "rgba(255,61,0,0.3)"; border = "1px solid rgba(255,61,0,0.5)"; content = "💀";
                    } else if (isCurrent) {
                      border = "1px solid rgba(124,77,255,0.5)";
                      anim = "pulse-glow 2s ease-in-out infinite";
                    }

                    const opacity = isFuture && !game.gameOver ? 0.3 : 1;

                    return (
                      <button
                        key={col}
                        onClick={() => handleTileClick(row, col)}
                        disabled={!isCurrent || game.gameOver || animating}
                        className="relative rounded-[12px] flex items-center justify-center text-[18px] font-bold transition-all duration-200 active:scale-[0.93]"
                        style={{
                          width: `${Math.min(70, (window?.innerWidth || 400 - 40) / game.cols - 8)}px`,
                          height: "52px",
                          background: bg, border, opacity,
                          animation: anim,
                          fontFamily: "var(--font-outfit)",
                          cursor: isCurrent && !game.gameOver ? "pointer" : "default",
                        }}
                      >
                        {content && <span>{content}</span>}
                        {isChicken && !game.gameOver && (
                          <span className="absolute -top-5 text-[24px]" style={{ animation: "hop 0.4s ease-out" }}>🐔</span>
                        )}
                        {isChicken && game.gameOver && !game.won && (
                          <span className="absolute -top-5 text-[24px]" style={{ animation: "shake 0.5s ease-in-out" }}>😵</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Win Overlay */}
      <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 ${showWin ? "opacity-100" : "opacity-0"}`}>
        <span className="text-[52px] font-black bg-gradient-to-br from-yellow-400 to-amber-600 bg-clip-text text-transparent animate-pulse" style={{ filter: "drop-shadow(0 0 30px rgba(255,215,0,.5))", fontFamily: "var(--font-outfit)" }}>
          +{winAmount}
        </span>
      </div>

      {/* Loss flash */}
      {game?.gameOver && !game.won && (
        <div className="absolute inset-0 z-15 pointer-events-none" style={{ animation: "flash-red 0.5s ease-out" }} />
      )}

      {/* Bottom UI */}
      <div className="relative z-10 flex flex-col items-center gap-3 shrink-0 pointer-events-none" style={{ paddingBottom: "max(18px, calc(env(safe-area-inset-bottom, 0px) + 12px))" }}>
        {/* Result text */}
        {resultText && (
          <p className={`text-[16px] font-bold text-center ${game?.won ? "text-yellow-400" : "text-red-400"}`} style={{ fontFamily: "var(--font-outfit)", textShadow: "0 0 15px currentColor" }}>
            {resultText}
          </p>
        )}

        {/* Cash out button */}
        {game && !game.gameOver && game.currentRow > 0 && (
          <button
            onClick={handleCashout}
            className="pointer-events-auto px-10 py-4 rounded-full text-[16px] font-black transition-all active:scale-[0.97]"
            style={{ background: "#00E676", color: "#0a1a0a", boxShadow: "0 0 20px rgba(0,230,118,0.4)", fontFamily: "var(--font-outfit)" }}
          >
            Cash Out — {(betAmount * game.multiplier).toFixed(2)} ₾
          </button>
        )}

        {/* Bet picker */}
        {!game && showBetPicker && (
          <>
            <p className="text-white/50 text-[14px] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>Pick amount to play</p>
            <div className="pointer-events-auto flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide w-full max-w-[420px]">
              {BET_OPTIONS.map((amt) => (
                <button key={amt} onClick={() => { setBetAmount(amt); setShowBetPicker(false); }}
                  className="shrink-0 px-8 py-5 rounded-full text-[20px] font-bold active:scale-[0.95] transition-transform"
                  style={{ background: "#FFD700", color: "#1a1a2e", fontFamily: "var(--font-outfit)" }}
                >{amt}</button>
              ))}
            </div>
          </>
        )}

        {/* Start / Play Again / Drop button */}
        {!game && !showBetPicker && betAmount > 0 && (
          <button onClick={startRound} disabled={balance < betAmount}
            className="pointer-events-auto px-12 py-6 rounded-full text-[19px] font-black tracking-wide transition-all active:scale-[0.97] disabled:bg-[#3a3a4a] disabled:text-[#777]"
            style={{ background: balance < betAmount ? "#3a3a4a" : "#FFD700", color: balance < betAmount ? "#777" : "#1a1a2e", boxShadow: "0 4px 24px rgba(255,215,0,.25)", fontFamily: "var(--font-outfit)" }}
          >Play</button>
        )}

        {game?.gameOver && (
          <button onClick={resetGame}
            className="pointer-events-auto px-12 py-6 rounded-full text-[19px] font-black tracking-wide transition-all active:scale-[0.97]"
            style={{ background: "#FFD700", color: "#1a1a2e", boxShadow: "0 4px 24px rgba(255,215,0,.25)", fontFamily: "var(--font-outfit)" }}
          >Play Again</button>
        )}

        {/* Balance */}
        <button onClick={() => { if (!game) setShowBetPicker(true); }}
          className="pointer-events-auto px-8 py-4 rounded-full active:scale-[0.97] transition-transform"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex flex-col items-center gap-0.5">
            {betAmount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>₾ {betAmount}</span>
                <span className="text-white/30 text-[13px]">&rsaquo;</span>
              </div>
            )}
            <span className="text-[11px] text-white/40" style={{ fontFamily: "var(--font-dm-sans)" }}>
              {betAmount > 0 ? "Balance " : "Pick amount"}
              {betAmount > 0 && <span className="text-white font-bold">{balance.toLocaleString("en-US", { maximumFractionDigits: 1 })}</span>}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
