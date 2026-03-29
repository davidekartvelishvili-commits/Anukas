// ============================================
// Covrd Spin Page — Main Page Component
// File: app/spin/page.tsx
// ============================================
"use client";

import { useState, useCallback } from "react";
import SlotMachine from "./SlotMachine";
import { SYMBOLS, BET_COST, type SpinResult } from "./slot-config";

export default function SpinPage() {
  const [balance, setBalance] = useState(5000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [targetSymbols, setTargetSymbols] = useState<[string, string, string] | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);

  // ── Spin Handler ──
  const handleSpin = useCallback(async () => {
    if (isSpinning || balance < BET_COST) return;

    setIsSpinning(true);
    setBalance((b) => b - BET_COST);
    setResult(null);
    setShowWin(false);

    try {
      // Call your server API
      const res = await fetch("/api/spin", { method: "POST" });
      const data: SpinResult = await res.json();

      // Set targets — this triggers the 3D animation
      setTargetSymbols(data.symbols);
      setSpinTrigger((t) => t + 1);

      // After animation completes (3.3s), show result
      setTimeout(() => {
        setResult(data);
        setIsSpinning(false);

        if (data.winAmount > 0) {
          setBalance((b) => b + data.winAmount);
          setShowWin(true);
          spawnParticles(
            data.winType === "triple" && data.winSymbol === "Covrd" ? 60 : 25
          );
          setTimeout(() => setShowWin(false), 2500);
        }
      }, 3300);
    } catch (error) {
      console.error("Spin failed:", error);
      setIsSpinning(false);
      setBalance((b) => b + BET_COST); // Refund on error
    }
  }, [isSpinning, balance]);

  // ── Particle Effect ──
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

  // ── Get emoji for display ──
  function getEmoji(name?: string) {
    if (!name) return "";
    const sym = SYMBOLS.find((s) => s.name === name);
    if (!sym) return name;
    if (sym.name === "Seven") return "7️⃣";
    if (sym.name === "Covrd") return "Ⓒ";
    return sym.emoji;
  }

  return (
    <div className="relative w-full h-screen bg-[#050a1a] overflow-hidden">
      {/* Particle animation keyframes */}
      <style jsx global>{`
        @keyframes particleFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg) scale(0.2); }
        }
      `}</style>

      {/* ── 3D Scene ── */}
      <SlotMachine
        spinTrigger={spinTrigger}
        targetSymbols={targetSymbols}
        onSpinStart={() => setIsSpinning(true)}
        onSpinEnd={() => {}}
      />

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4 z-10">
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 text-lg backdrop-blur-lg hover:bg-white/20 transition"
        >
          ✕
        </button>

        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[22px] px-5 py-2 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5 font-bold text-[17px]">
            <span className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 inline-flex items-center justify-center text-[9px] font-black text-yellow-900">
              C
            </span>
            {BET_COST}
          </div>
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
            My Play
          </span>
        </div>

        <button
          onClick={() => setPayoutOpen(!payoutOpen)}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 text-[15px] font-semibold backdrop-blur-lg hover:bg-white/20 transition"
        >
          i
        </button>
      </div>

      {/* ── PAYOUT TABLE ── */}
      <div
        className={`absolute top-[108px] right-3 z-20 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-[14px] p-3.5 text-xs transition-all duration-200 ${
          payoutOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-1.5 scale-95 pointer-events-none"
        }`}
      >
        <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
          Match 3 to Win
        </h4>
        {SYMBOLS.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5 py-0.5">
            <span className="text-sm min-w-[50px] tracking-wide">
              {s.name === "Seven" ? "7️⃣7️⃣7️⃣" : s.name === "Covrd" ? "ⒸⒸⒸ" : `${s.emoji}${s.emoji}${s.emoji}`}
            </span>
            <span
              className={`min-w-[60px] text-[11px] ${
                s.name === "Covrd" ? "text-yellow-400 font-bold" : "text-white/50"
              }`}
            >
              {s.name}
            </span>
            <span
              className={`font-bold text-xs ${
                s.name === "Covrd" ? "text-red-500" : "text-yellow-400"
              }`}
            >
              {s.multiplier}x
            </span>
          </div>
        ))}
        <hr className="border-white/[0.06] my-1.5" />
        <p className="text-[10px] text-white/25">Match 2 pays ÷5 • Ⓒ = Jackpot</p>
      </div>

      {/* ── WIN OVERLAY ── */}
      <div
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 ${
          showWin ? "opacity-100" : "opacity-0"
        }`}
      >
        <span
          className="text-[52px] font-black bg-gradient-to-br from-yellow-400 to-amber-600 bg-clip-text text-transparent animate-pulse"
          style={{ filter: "drop-shadow(0 0 30px rgba(255,215,0,0.5))" }}
        >
          +{result?.winAmount || 0}
        </span>
        <span className="text-[15px] text-white/60 mt-1 font-medium">
          {result?.winType === "triple" && result?.winSymbol === "Covrd"
            ? "🔥 JACKPOT! 🔥"
            : "Coins Won!"}
        </span>
      </div>

      {/* ── BOTTOM UI ── */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-5 px-5 z-10 gap-2.5 pointer-events-none">
        {/* Result text */}
        <div
          className={`text-[15px] font-bold text-yellow-400 min-h-[24px] text-center transition-all duration-300 ${
            result && result.winAmount > 0
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          } ${
            result?.winType === "triple" && result?.winSymbol === "Covrd"
              ? "text-[22px] text-red-500"
              : ""
          }`}
          style={{
            textShadow:
              result?.winType === "triple" && result?.winSymbol === "Covrd"
                ? "0 0 30px rgba(255,61,0,0.7)"
                : "0 0 20px rgba(255,215,0,0.5)",
          }}
        >
          {result?.winAmount && result.winAmount > 0
            ? result.winType === "triple"
              ? `${getEmoji(result.winSymbol)} ${getEmoji(result.winSymbol)} ${getEmoji(result.winSymbol)}  ×${result.multiplier} — +${result.winAmount}!`
              : `${getEmoji(result.winSymbol)} Pair — +${result.winAmount}`
            : ""}
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || balance < BET_COST}
          className="pointer-events-auto bg-[#FFE135] text-[#1a1a2e] border-none px-[72px] py-[15px] rounded-full text-[19px] font-black tracking-wide transition-all duration-150 disabled:bg-[#3a3a4a] disabled:text-[#777] disabled:cursor-not-allowed disabled:shadow-none hover:scale-[1.04] active:scale-[0.97]"
          style={{
            boxShadow: isSpinning
              ? "none"
              : "0 4px 24px rgba(255,225,53,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {isSpinning ? "Spinning..." : "Spin"}
        </button>

        {/* Bottom bar */}
        <div className="pointer-events-auto flex items-center gap-3 w-full max-w-[380px] justify-between">
          <button className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-lg backdrop-blur-lg">
            👥
          </button>

          <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-[30px] px-4 py-2 backdrop-blur-lg">
            <div className="flex flex-col items-center">
              <div className="text-[15px] font-bold flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 inline-flex items-center justify-center text-[7px] font-black text-yellow-900">
                  C
                </span>
                {BET_COST}{" "}
                <span className="text-white/30 text-[13px]">›</span>
              </div>
              <span className="text-[11px] text-white/40">
                Balance{" "}
                <span className="text-white font-bold">
                  {balance.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </span>
              </span>
            </div>
          </div>

          <button className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-lg backdrop-blur-lg">
            ℹ
          </button>
        </div>
      </div>
    </div>
  );
}
