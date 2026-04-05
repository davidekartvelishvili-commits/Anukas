"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { SYMBOLS, BET_COST, type SpinResult } from "./slot-config";
import { playGame, ensureActiveTransaction } from "@/services/games";
import { setCoinBalance as storeCoin, setCashBalance as storeCash } from "@/services/balance";

const SlotMachine = dynamic(() => import("./SlotMachine"), { ssr: false });

export default function MidnightMachinePage() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [targetSymbols, setTargetSymbols] = useState<[string, string, string] | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [showNoLuck, setShowNoLuck] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [showBetPicker, setShowBetPicker] = useState(true);
  const [betAmount, setBetAmount] = useState(0);
  const BET_OPTIONS = [10, 25, 50, 100, 250, 500];

  useEffect(() => {
    ensureActiveTransaction().then((tx) => {
      setCoinBalance(tx.coinsRemaining);
      storeCoin(tx.coinsRemaining);
    }).catch(() => {});
  }, []);

  const handleSpin = useCallback(async () => {
    if (isSpinning || betAmount <= 0 || coinBalance < betAmount) return;

    setIsSpinning(true);
    setResult(null);
    setShowWin(false);

    try {
      // Server decides outcome FIRST — coins deducted server-side
      const serverResult = await playGame("slot");

      // Immediately sync coin balance from server (after deduction)
      setCoinBalance(serverResult.coinsRemaining);
      storeCoin(serverResult.coinsRemaining);

      // Map server result to visual symbols
      const symbols: [string, string, string] = serverResult.won
        ? ["Crown", "Crown", "Crown"]
        : ["Cherry", "Melon", "Banana"];
      const spinData: SpinResult = {
        symbols,
        winType: serverResult.won ? "triple" : "none",
        winAmount: serverResult.totalWin,
        multiplier: serverResult.won ? serverResult.totalWin / betAmount : 0,
        winSymbol: serverResult.won ? "Crown" : undefined,
      };

      setTargetSymbols(spinData.symbols);
      setSpinTrigger((t) => t + 1);

      setTimeout(() => {
        setResult(spinData);
        setIsSpinning(false);
        // Sync cash from server
        if (serverResult.totalWin > 0) {
          setCashBalance(serverResult.newBalance);
          storeCash(serverResult.newBalance);
        }

        if (serverResult.totalWin > 0 && serverResult.won) {
          setShowWin(true);
          spawnParticles(serverResult.bonusWin > 50 ? 60 : 25);
          setTimeout(() => setShowWin(false), 2500);
        } else {
          setShowNoLuck(true);
          setTimeout(() => setShowNoLuck(false), 4000);
        }
      }, 6500);
    } catch (err: any) {
      setIsSpinning(false);
      // API failed — don't change balance (server didn't deduct)
      if (err.message?.includes("disabled")) {
        alert("\u10D7\u10D0\u10DB\u10D0\u10E8\u10D8 \u10D3\u10E0\u10DD\u10D4\u10D1\u10D8\u10D7 \u10E8\u10D4\u10E9\u10D4\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8\u10D0");
      }
    }
  }, [isSpinning, coinBalance, betAmount]);

  function spawnParticles(count: number) {
    const colors = ["#FFD700", "#FF6D00", "#FF3D00", "#FFAB00", "#fff"];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      const size = 4 + Math.random() * 10;
      Object.assign(p.style, {
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        left: `${10 + Math.random() * 80}%`,
        top: `${-5 + Math.random() * 20}%`,
        background: colors[Math.floor(Math.random() * colors.length)],
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        pointerEvents: "none",
        zIndex: "50",
        animation: `particleFall ${1.5 + Math.random() * 2}s linear ${Math.random() * 0.6}s forwards`,
      });
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 4000);
    }
  }

  function getEmoji(name?: string) {
    if (!name) return "";
    const sym = SYMBOLS.find((s) => s.name === name);
    if (!sym) return name;
    if (sym.name === "Seven") return "7\uFE0F\u20E3";
    if (sym.name === "Covrd") return "\u24B8";
    return sym.emoji;
  }

  return (
    <div className="relative w-full h-[100dvh] bg-[#050a1a] overflow-hidden">
      <style>{`
        @keyframes particleFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg) scale(0.2); }
        }
      `}</style>

      <SlotMachine
        spinTrigger={spinTrigger}
        targetSymbols={targetSymbols}
        onSpinStart={() => setIsSpinning(true)}
        onSpinEnd={() => {}}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4 z-10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 text-lg backdrop-blur-lg active:scale-[0.95] transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4l8 8M12 4L4 12" />
          </svg>
        </button>

        {/* My Play card */}
        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[22px] px-5 py-2 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5 font-bold text-[17px] text-white" style={{ fontFamily: "var(--font-outfit)" }}>
            <span className="text-[14px]">₾</span>
            {betAmount > 0 ? betAmount : "—"}
          </div>
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-sans)" }}>
            My Play
          </span>
        </div>

        <div className="w-9" />
      </div>

      {/* No luck message */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 flex flex-col items-center transition-opacity duration-500 ${showNoLuck ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 100px)" }}
      >
        <p className="text-white text-[28px] font-black text-center" style={{ fontFamily: "var(--font-outfit)" }}>
          No luck this time!
        </p>
        <p className="text-white/60 text-[18px] font-bold text-center mt-1" style={{ fontFamily: "var(--font-outfit)" }}>
          Try again!
        </p>
      </div>

      {/* Payout table */}
      <div
        className={`absolute top-[108px] right-3 z-20 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-[14px] p-3.5 text-xs transition-all duration-200 ${
          payoutOpen ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 -translate-y-1.5 scale-95 pointer-events-none"
        }`}
        style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
      >
        <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">Match 3 to Win</h4>
        {SYMBOLS.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5 py-0.5">
            <span className="text-sm min-w-[50px] tracking-wide">
              {s.name === "Seven" ? "7\uFE0F\u20E37\uFE0F\u20E37\uFE0F\u20E3" : s.name === "Covrd" ? "\u24B8\u24B8\u24B8" : `${s.emoji}${s.emoji}${s.emoji}`}
            </span>
            <span className={`min-w-[60px] text-[11px] ${s.name === "Covrd" ? "text-yellow-400 font-bold" : "text-white/50"}`}>
              {s.name}
            </span>
            <span className={`font-bold text-xs ${s.name === "Covrd" ? "text-red-500" : "text-yellow-400"}`}>
              {s.multiplier}x
            </span>
          </div>
        ))}
        <hr className="border-white/[0.06] my-1.5" />
        <p className="text-[10px] text-white/25">Match 2 pays /5 | \u24B8 = Jackpot</p>
      </div>

      {/* Win overlay */}
      <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 ${showWin ? "opacity-100" : "opacity-0"}`}>
        <span
          className="text-[52px] font-black bg-gradient-to-br from-yellow-400 to-amber-600 bg-clip-text text-transparent animate-pulse"
          style={{ filter: "drop-shadow(0 0 30px rgba(255,215,0,0.5))", fontFamily: "var(--font-outfit)" }}
        >
          +{result?.winAmount || 0}
        </span>
        <span className="text-[15px] text-white/60 mt-1 font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
          {result?.winType === "triple" && result?.winSymbol === "Covrd" ? "JACKPOT!" : "Coins Won!"}
        </span>
      </div>

      {/* Bottom UI */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-10 gap-3 pointer-events-none" style={{ paddingBottom: "max(20px, calc(env(safe-area-inset-bottom, 0px) + 12px))" }}>
        {/* Result text */}
        <div
          className={`text-[15px] font-bold text-yellow-400 min-h-[24px] text-center transition-all duration-300 ${
            result && result.winAmount > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } ${result?.winType === "triple" && result?.winSymbol === "Covrd" ? "text-[22px] text-red-500" : ""}`}
          style={{
            fontFamily: "var(--font-outfit)",
            textShadow: result?.winType === "triple" && result?.winSymbol === "Covrd"
              ? "0 0 30px rgba(255,61,0,0.7)" : "0 0 20px rgba(255,215,0,0.5)",
          }}
        >
          {result?.winAmount && result.winAmount > 0
            ? result.winType === "triple"
              ? `${getEmoji(result.winSymbol)} ${getEmoji(result.winSymbol)} ${getEmoji(result.winSymbol)}  x${result.multiplier} — +${result.winAmount}!`
              : `${getEmoji(result.winSymbol)} Pair — +${result.winAmount}`
            : ""}
        </div>

        {/* Pick amount label */}
        {showBetPicker && (
          <p className="text-white/50 text-[14px] font-medium pointer-events-none" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Pick amount to play
          </p>
        )}

        {/* Bet picker pills */}
        {showBetPicker && (
          <div className="pointer-events-auto flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide w-full max-w-[420px]">
            {BET_OPTIONS.map((amt) => (
              <button
                key={amt}
                onClick={() => { setBetAmount(amt); setShowBetPicker(false); }}
                className="shrink-0 px-8 py-5 rounded-full text-[20px] font-bold active:scale-[0.95] transition-transform"
                style={{
                  background: "#FFE135",
                  color: "#1a1a2e",
                  fontFamily: "var(--font-outfit)",
                }}
              >
                {amt}
              </button>
            ))}
          </div>
        )}

        {/* Spin button (after bet selected) */}
        {!showBetPicker && betAmount > 0 && (
          <button
            onClick={handleSpin}
            disabled={isSpinning || coinBalance < betAmount}
            className="pointer-events-auto px-12 py-6 rounded-full text-[19px] font-black tracking-wide transition-all duration-150 disabled:bg-[#3a3a4a] disabled:text-[#777] disabled:cursor-not-allowed active:scale-[0.97]"
            style={{
              background: isSpinning ? "#3a3a4a" : "#FFD700",
              color: isSpinning ? "#777" : "#1a1a2e",
              boxShadow: isSpinning ? "none" : "0 4px 24px rgba(255,225,53,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            {isSpinning ? "Spinning..." : "Spin"}
          </button>
        )}

        {/* Bottom bar: wallet + balance + info */}
        <div className="pointer-events-auto flex items-center gap-3 w-full max-w-[420px] justify-center px-4">
          {/* Balance center */}
          <button
            onClick={() => setShowBetPicker(true)}
            className="flex flex-col items-center gap-0.5 bg-white/[0.06] border border-white/10 rounded-[30px] px-5 py-2 backdrop-blur-lg active:scale-[0.97] transition-transform"
          >
            {betAmount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                  ₾ {betAmount}
                </span>
                <span className="text-white/30 text-[13px]">&rsaquo;</span>
              </div>
            )}
            <span className="text-[11px] text-white/40" style={{ fontFamily: "var(--font-dm-sans)" }}>
              {betAmount > 0 ? "Balance " : "Pick amount to play"}
              {betAmount > 0 && (
                <span className="text-white font-bold">
                  {coinBalance.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                </span>
              )}
            </span>
          </button>

        </div>
      </div>

      {/* Info button — fixed bottom right */}
      <button
        onClick={() => setPayoutOpen(!payoutOpen)}
        className="absolute right-4 z-10 w-[48px] h-[48px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
        style={{
          bottom: "max(20px, calc(env(safe-area-inset-bottom, 0px) + 12px))",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="9" r="7.5" opacity="0.5" />
          <path d="M9 12.5V8.5" />
          <circle cx="9" cy="6" r="0.5" fill="white" />
        </svg>
      </button>
    </div>
  );
}
