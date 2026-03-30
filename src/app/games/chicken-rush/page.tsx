"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DIFFICULTIES, type Difficulty, type StartResult, type StepResult } from "./game-config";

type TileState = "hidden" | "safe" | "trap" | "revealed-trap";
interface GameState {
  roundId: string; rows: number; cols: number; currentRow: number;
  multiplier: number; tiles: TileState[][]; chickenPos: { row: number; col: number } | null;
  gameOver: boolean; won: boolean; trapMap?: number[];
}

function spawnFirework(x: number, y: number) {
  const colors = ["#FFD700", "#00E676", "#7c4dff", "#00e5ff", "#FF6D00", "#fff"];
  for (let i = 0; i < 15; i++) {
    const p = document.createElement("div");
    const sz = 3 + Math.random() * 6;
    const angle = (Math.PI * 2 * i) / 15 + (Math.random() - 0.5) * 0.5;
    const dist = 40 + Math.random() * 60;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    Object.assign(p.style, {
      position: "fixed", width: `${sz}px`, height: `${sz}px`,
      left: `${x}px`, top: `${y}px`,
      background: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: "50%", pointerEvents: "none", zIndex: "60",
      transition: `all ${0.4 + Math.random() * 0.3}s ease-out`,
      opacity: "1",
    });
    document.body.appendChild(p);
    requestAnimationFrame(() => {
      p.style.transform = `translate(${tx}px, ${ty}px)`;
      p.style.opacity = "0";
    });
    setTimeout(() => p.remove(), 800);
  }
}

export default function ChickenRushPage() {
  const [balance, setBalance] = useState(5000);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [betAmount, setBetAmount] = useState(0.25);
  const [showBetPicker, setShowBetPicker] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [animating, setAnimating] = useState(false);
  const [resultText, setResultText] = useState("");
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [autoStarted, setAutoStarted] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const BET_OPTIONS = [0.25, 0.5, 1, 2.5, 5, 10];
  const config = DIFFICULTIES[difficulty];

  useEffect(() => {
    if (!game || !gridRef.current) return;
    const rowEl = gridRef.current.querySelector(`[data-row="${game.currentRow}"]`);
    if (rowEl) rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [game?.currentRow]);

  // Auto-start on first load
  const startRound = useCallback(async () => {
    if (balance < betAmount) return;
    setBalance((b) => b - betAmount);
    setResultText("");
    setShowWin(false);

    const res = await fetch("/api/chicken-rush/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty, betAmount }),
    });
    const data: StartResult = await res.json();
    const tiles: TileState[][] = [];
    for (let r = 0; r < data.rows; r++) tiles.push(Array(data.cols).fill("hidden"));

    setGame({
      roundId: data.roundId, rows: data.rows, cols: data.cols,
      currentRow: 0, multiplier: 1, tiles, chickenPos: null,
      gameOver: false, won: false,
    });
  }, [betAmount, balance, difficulty]);

  useEffect(() => {
    if (!autoStarted) { setAutoStarted(true); startRound(); }
  }, [autoStarted, startRound]);

  const handleTileClick = useCallback(async (row: number, col: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!game || game.gameOver || animating || row !== game.currentRow) return;
    setAnimating(true);

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const res = await fetch("/api/chicken-rush/step", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: game.roundId, row, column: col }),
    });
    const data: StepResult & { trapMap?: number[] } = await res.json();

    if (data.safe) {
      spawnFirework(cx, cy);
      const newTiles = game.tiles.map((r) => [...r]);
      newTiles[row][col] = "safe";
      const completed = data.nextRow >= game.rows;

      setGame((g) => g ? { ...g, tiles: newTiles, currentRow: data.nextRow, multiplier: data.multiplier, chickenPos: { row, col }, gameOver: completed, won: completed } : g);

      if (completed) {
        const cRes = await fetch("/api/chicken-rush/cashout", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId: game.roundId, betAmount }),
        });
        const cData = await cRes.json();
        setBalance((b) => b + cData.winAmount);
        setWinAmount(cData.winAmount);
        setShowWin(true);
        setResultText(`LEGENDARY! x${data.multiplier}`);
        setTimeout(() => setShowWin(false), 3000);
      }
    } else {
      const newTiles = game.tiles.map((r) => [...r]);
      newTiles[row][col] = "trap";
      if (data.trapMap) {
        const tm = data.trapMap as number[];
        for (let r = 0; r < tm.length; r++) {
          if (r !== row) {
            setTimeout(() => {
              setGame((g) => {
                if (!g) return g;
                const t = g.tiles.map((row) => [...row]);
                if (t[r][tm[r]] === "hidden") t[r][tm[r]] = "revealed-trap";
                return { ...g, tiles: t };
              });
            }, r * 50);
          }
        }
      }
      setGame((g) => g ? { ...g, tiles: newTiles, chickenPos: { row, col }, gameOver: true, won: false, trapMap: data.trapMap } : g);
      setResultText("You hit a trap!");
    }
    setTimeout(() => setAnimating(false), 300);
  }, [game, animating, betAmount]);

  const handleCashout = useCallback(async () => {
    if (!game || game.gameOver || game.currentRow === 0) return;
    const res = await fetch("/api/chicken-rush/cashout", {
      method: "POST", headers: { "Content-Type": "application/json" },
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

  const playAgain = () => { setGame(null); setResultText(""); setTimeout(() => startRound(), 100); };

  return (
    <div className="relative w-full h-[100dvh] bg-[#050a1a] overflow-hidden flex flex-col">
      <style>{`
        @keyframes hop { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 8px rgba(124,77,255,0.3); } 50% { box-shadow: 0 0 18px rgba(124,77,255,0.6); } }
        @keyframes flash-red { 0% { background: rgba(255,61,0,0.3); } 100% { background: transparent; } }
      `}</style>

      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, #1a237e, #0d1254 35%, #070b2e 70%, #030612)" }} />

      {/* Top Bar */}
      <div className="relative z-10 flex justify-between items-start p-3.5 shrink-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
        <button onClick={() => window.history.back()} className="w-9 h-9 rounded-full bg-white/10 border border-white/[0.12] flex items-center justify-center text-white/60 backdrop-blur-lg active:scale-[0.95] transition-transform">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l8 8M12 4L4 12" /></svg>
        </button>
        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[22px] px-5 py-2 flex flex-col items-center gap-px">
          <div className="flex items-center gap-1.5 font-bold text-[17px] text-white" style={{ fontFamily: "var(--font-outfit)" }}>
            <span className="text-[14px]">₾</span>{betAmount}
          </div>
          <span className="text-[10px] text-white/[0.45] font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-sans)" }}>Chicken Rush</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Multiplier + Difficulty */}
      <div className="relative z-10 text-center shrink-0 py-1">
        {game && (
          <span className="text-[28px] font-black text-white" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
            x{game.multiplier.toFixed(2)}
          </span>
        )}
        {/* Difficulty pills inline */}
        <div className="flex justify-center gap-1.5 mt-1">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
            <button key={d} onClick={() => { if (!game || game.gameOver) setDifficulty(d); }}
              className={`px-3 py-0.5 rounded-full text-[10px] font-bold border transition-all active:scale-[0.95] ${
                difficulty === d ? "bg-opacity-20 border-current" : "bg-white/5 text-white/40 border-white/10"
              }`}
              style={{ color: difficulty === d ? DIFFICULTIES[d].color : undefined, borderColor: difficulty === d ? DIFFICULTIES[d].color : undefined, background: difficulty === d ? DIFFICULTIES[d].color + "22" : undefined, fontFamily: "var(--font-dm-sans)" }}
            >{DIFFICULTIES[d].label}</button>
          ))}
        </div>
      </div>

      {/* Game Grid */}
      {game && (
        <div ref={gridRef} className="relative z-10 flex-1 overflow-y-auto px-2 py-1 scrollbar-hide">
          <div className="flex flex-col-reverse gap-1.5 min-h-full justify-start pb-2">
            {Array.from({ length: game.rows }).map((_, row) => {
              const isCurrent = row === game.currentRow && !game.gameOver;
              const isFuture = row > game.currentRow;
              return (
                <div key={row} data-row={row} className="flex justify-center gap-1.5">
                  {Array.from({ length: game.cols }).map((_, col) => {
                    const state = game.tiles[row][col];
                    const isChicken = game.chickenPos?.row === row && game.chickenPos?.col === col;
                    let bg = "#12122e"; let border = "1px solid rgba(124,77,255,0.15)"; let content = ""; let anim = "";
                    if (state === "safe") { bg = "#00E676"; border = "1px solid #00E676"; content = "✓"; }
                    else if (state === "trap") { bg = "#FF3D00"; border = "1px solid #FF3D00"; content = "🔥"; anim = "shake 0.3s ease-in-out"; }
                    else if (state === "revealed-trap") { bg = "rgba(255,61,0,0.3)"; border = "1px solid rgba(255,61,0,0.5)"; content = "💀"; }
                    else if (isCurrent) { border = "1px solid rgba(124,77,255,0.5)"; anim = "pulse-glow 2s ease-in-out infinite"; }
                    return (
                      <button key={col} onClick={(e) => handleTileClick(row, col, e)}
                        disabled={!isCurrent || game.gameOver || animating}
                        className="relative rounded-[10px] flex items-center justify-center text-[14px] font-bold transition-all duration-200 active:scale-[0.93]"
                        style={{
                          width: `${Math.min(56, (window?.innerWidth || 400) / game.cols - 10)}px`, height: "42px",
                          background: bg, border, opacity: isFuture && !game.gameOver ? 0.3 : 1, animation: anim,
                          fontFamily: "var(--font-outfit)", cursor: isCurrent && !game.gameOver ? "pointer" : "default",
                        }}
                      >
                        {content && <span>{content}</span>}
                        {isChicken && !game.gameOver && <span className="absolute -top-4 text-[20px]" style={{ animation: "hop 0.4s ease-out" }}>🐔</span>}
                        {isChicken && game.gameOver && !game.won && <span className="absolute -top-4 text-[20px]" style={{ animation: "shake 0.5s" }}>😵</span>}
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
        <span className="text-[52px] font-black bg-gradient-to-br from-yellow-400 to-amber-600 bg-clip-text text-transparent animate-pulse" style={{ filter: "drop-shadow(0 0 30px rgba(255,215,0,.5))", fontFamily: "var(--font-outfit)" }}>+{winAmount}</span>
      </div>

      {game?.gameOver && !game.won && <div className="absolute inset-0 z-15 pointer-events-none" style={{ animation: "flash-red 0.5s ease-out" }} />}

      {/* Bet Picker Popup */}
      {showBetPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowBetPicker(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative rounded-[20px] px-6 py-7 max-w-[320px] w-full" style={{ background: "rgba(50,50,50,0.08)", backdropFilter: "blur(12px) saturate(200%)", WebkitBackdropFilter: "blur(12px) saturate(200%)", border: "1px solid rgba(255,255,255,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-[18px] font-bold text-center mb-4" style={{ fontFamily: "var(--font-outfit)" }}>Pick amount</h3>
            <div className="grid grid-cols-3 gap-2">
              {BET_OPTIONS.map((amt) => (
                <button key={amt} onClick={() => { setBetAmount(amt); setShowBetPicker(false); }}
                  className={`py-3 rounded-full text-[16px] font-bold active:scale-[0.95] transition-transform ${betAmount === amt ? "ring-2 ring-white" : ""}`}
                  style={{ background: "#FFD700", color: "#1a1a2e", fontFamily: "var(--font-outfit)" }}
                >{amt}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom UI */}
      <div className="relative z-10 flex flex-col items-center gap-2.5 shrink-0 pointer-events-none" style={{ paddingBottom: "max(14px, calc(env(safe-area-inset-bottom, 0px) + 10px))" }}>
        {resultText && (
          <p className={`text-[15px] font-bold text-center ${game?.won ? "text-yellow-400" : "text-red-400"}`} style={{ fontFamily: "var(--font-outfit)", textShadow: "0 0 15px currentColor" }}>{resultText}</p>
        )}

        {/* Cash out — same shape as balance */}
        {game && !game.gameOver && game.currentRow > 0 && (
          <button onClick={handleCashout}
            className="pointer-events-auto px-8 py-4 rounded-full active:scale-[0.97] transition-transform"
            style={{ background: "#00E676", color: "#0a1a0a", fontFamily: "var(--font-outfit)", boxShadow: "0 0 20px rgba(0,230,118,0.4)" }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[15px] font-bold">Cash Out</span>
              <span className="text-[11px] font-medium opacity-70">{(betAmount * (game?.multiplier || 1)).toFixed(2)} ₾</span>
            </div>
          </button>
        )}

        {/* Play Again */}
        {game?.gameOver && (
          <button onClick={playAgain} className="pointer-events-auto px-10 py-5 rounded-full text-[17px] font-black active:scale-[0.97] transition-transform"
            style={{ background: "#FFD700", color: "#1a1a2e", boxShadow: "0 4px 24px rgba(255,215,0,.25)", fontFamily: "var(--font-outfit)" }}
          >Play Again</button>
        )}

        {/* Balance */}
        <button onClick={() => setShowBetPicker(true)}
          className="pointer-events-auto px-8 py-4 rounded-full active:scale-[0.97] transition-transform"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>₾ {betAmount}</span>
              <span className="text-white/30 text-[13px]">&rsaquo;</span>
            </div>
            <span className="text-[11px] text-white/40" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Balance <span className="text-white font-bold">{balance.toLocaleString("en-US", { maximumFractionDigits: 1 })}</span>
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
