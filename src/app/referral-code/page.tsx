"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe, getStoredUser } from "@/services/auth";
import { apiFetch } from "@/services/api";

export default function ReferralCodePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    // Fetch referral info
    apiFetch("/user/referral").then((data: any) => {
      if (data.referralCode) setReferralCode(data.referralCode);
      if (data.totalReferrals) setTotalReferrals(data.totalReferrals);
    }).catch(() => {
      const user = getStoredUser() as any;
      if (user?.referralCode) setReferralCode(user.referralCode);
    });
    return () => clearTimeout(t);
  }, []);

  const stagger = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.5s ease-out ${i * 0.08}s`,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setPromoResult("\u10D9\u10DD\u10D3\u10D8 \u10D3\u10D0\u10D9\u10DD\u10DE\u10D8\u10E0\u10D3\u10D0!");
    setTimeout(() => setPromoResult(null), 2000);
  };

  const handleShare = async () => {
    const shareText = `\u10D2\u10D0\u10D3\u10DB\u10DD\u10EC\u10D4\u10E0\u10D4 \u10E8\u10D0\u10DC\u10E1\u10D8 \u10D3\u10D0 \u10D2\u10D0\u10DB\u10DD\u10D8\u10E7\u10D4\u10DC\u10D4 \u10E9\u10D4\u10DB\u10D8 \u10D9\u10DD\u10D3\u10D8 ${referralCode} \u2014 \u10DD\u10E0\u10D8\u10D5\u10D4 \u10DB\u10D8\u10D5\u10D8\u10E6\u10D4\u10D1\u10D7 \u10D1\u10DD\u10DC\u10E3\u10E1 \u10E5\u10DD\u10D8\u10DC\u10D4\u10D1\u10E1! \uD83C\uDF89`;
    if (navigator.share) {
      try { await navigator.share({ text: shareText }); } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      setPromoResult("\u10D2\u10D0\u10D6\u10D8\u10D0\u10E0\u10D4\u10D1\u10D8\u10E1 \u10E2\u10D4\u10E5\u10E1\u10E2\u10D8 \u10D3\u10D0\u10D9\u10DD\u10DE\u10D8\u10E0\u10D3\u10D0!");
      setTimeout(() => setPromoResult(null), 2000);
    }
  };

  const handlePromoSubmit = async () => {
    if (!promoCode.trim()) return;
    setLoading(true);
    setPromoError(null);
    setPromoResult(null);
    try {
      const data = await apiFetch("/games/use-promo-code", {
        method: "POST",
        body: JSON.stringify({ code: promoCode.trim() }),
      }) as any;
      setPromoResult(data.message || `\u10DB\u10D8\u10D8\u10E6\u10D4 ${data.coinsEarned} \u10E5\u10DD\u10D8\u10DC\u10D8!`);
      setPromoCode("");
    } catch (err: any) {
      setPromoError(err.message || "\u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D0");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="min-h-[100dvh] bg-black pb-[100px]">
        <div className="max-w-[430px] mx-auto px-4 pt-[60px]">
          {/* Back button */}
          <button onClick={() => router.back()} className="mb-6 active:opacity-50 transition-opacity" style={stagger(0)}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 5L8 11l6 6" />
            </svg>
          </button>

          {/* ── Your Referral Code ── */}
          <div style={stagger(1)}>
            <h1 className="text-white text-[28px] font-bold text-center leading-tight mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
              {"\u10E8\u10D4\u10DC\u10D8 \u10E0\u10D4\u10E4\u10D4\u10E0\u10D0\u10DA \u10D9\u10DD\u10D3\u10D8"}
            </h1>
            <p className="text-[14px] text-center mb-4" style={{ color: "#999", fontFamily: "var(--font-dm-sans)" }}>
              {"\u10D2\u10D0\u10E3\u10D6\u10D8\u10D0\u10E0\u10D4 \u10DB\u10D4\u10D2\u10DD\u10D1\u10D0\u10E0\u10E1 \u10D3\u10D0 \u10DD\u10E0\u10D8\u10D5\u10D4 \u10DB\u10D8\u10D8\u10E6\u10D4\u10D1\u10D7 \u10D1\u10DD\u10DC\u10E3\u10E1 \u10E5\u10DD\u10D8\u10DC\u10D4\u10D1\u10E1"}
            </p>
          </div>

          {/* Code display */}
          <div className="rounded-[16px] p-5 mb-4 text-center" style={{ ...stagger(2), background: "#1C1C1E" }}>
            <p className="text-[28px] font-extrabold tracking-[4px]" style={{ color: "#FFD700", fontFamily: "var(--font-outfit)" }}>
              {referralCode || "..."}
            </p>
            <div className="flex gap-3 mt-4 justify-center">
              <button onClick={handleCopy} className="px-5 py-2.5 rounded-full text-[13px] font-bold active:scale-95 transition-transform" style={{ background: "#FFD700", color: "#000" }}>
                {"\u10D3\u10D0\u10D9\u10DD\u10DE\u10D8\u10E0\u10D4\u10D1\u10D0"}
              </button>
              <button onClick={handleShare} className="px-5 py-2.5 rounded-full text-[13px] font-bold active:scale-95 transition-transform" style={{ background: "rgba(255,255,255,0.15)", color: "#FFF" }}>
                {"\u10D2\u10D0\u10D6\u10D8\u10D0\u10E0\u10D4\u10D1\u10D0"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-[16px] p-4 mb-6" style={{ ...stagger(3), background: "#1C1C1E" }}>
            <div className="flex justify-between items-center">
              <span className="text-[13px]" style={{ color: "#999", fontFamily: "var(--font-dm-sans)" }}>{"\u10DB\u10DD\u10EC\u10D5\u10D4\u10E3\u10DA\u10D8 \u10DB\u10D4\u10D2\u10DD\u10D1\u10E0\u10D4\u10D1\u10D8"}</span>
              <span className="text-[18px] font-bold" style={{ color: "#FFD700", fontFamily: "var(--font-outfit)" }}>{totalReferrals}</span>
            </div>
          </div>

          {/* ── Promo Code Section ── */}
          <div style={stagger(4)}>
            <h2 className="text-white text-[20px] font-bold mb-3" style={{ fontFamily: "var(--font-outfit)" }}>
              {"\u10DE\u10E0\u10DD\u10DB\u10DD \u10D9\u10DD\u10D3\u10D8"}
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={"\u10DB\u10D0\u10D2: LAUNCH2026"}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 rounded-[12px] text-[14px] text-white placeholder-[#666] outline-none"
                style={{ background: "#1C1C1E", fontFamily: "var(--font-dm-sans)" }}
              />
              <button
                onClick={handlePromoSubmit}
                disabled={loading || !promoCode.trim()}
                className="px-5 py-3 rounded-[12px] text-[14px] font-bold active:scale-95 transition-transform disabled:opacity-50"
                style={{ background: "#FFD700", color: "#000", fontFamily: "var(--font-outfit)" }}
              >
                {loading ? "..." : "\u10D2\u10D0\u10DB\u10DD\u10E7\u10D4\u10DC\u10D4\u10D1\u10D0"}
              </button>
            </div>
          </div>

          {/* Result/Error */}
          {promoResult && (
            <div className="rounded-[12px] px-4 py-3 mt-3 text-center" style={{ background: "#22C55E20" }}>
              <p className="text-[14px] font-bold" style={{ color: "#22C55E" }}>{promoResult}</p>
            </div>
          )}
          {promoError && (
            <div className="rounded-[12px] px-4 py-3 mt-3 text-center" style={{ background: "#EF444420" }}>
              <p className="text-[14px] font-bold" style={{ color: "#EF4444" }}>{promoError}</p>
            </div>
          )}
        </div>

        {/* ── Bottom Nav ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
          <div className="flex items-center px-2 py-1.5 rounded-full gap-0" style={{ background: "rgba(50, 50, 50, 0.08)", backdropFilter: "blur(5px) saturate(200%)", WebkitBackdropFilter: "blur(5px) saturate(200%)", border: "0.5px solid rgba(255,255,255,0.15)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            {[
              { label: "Home", href: "/home", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l8-7 8 7" /><path d="M5 9.5v8a1 1 0 001 1h3v-4h4v4h3a1 1 0 001-1v-8" /></svg> },
              { label: "Games", href: "/games", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="7" cy="7" r="2.2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" /><circle cx="15" cy="7" r="2.2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" /><circle cx="7" cy="15" r="2.2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" /><circle cx="15" cy="15" r="2.2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" /></svg> },
              { label: "Scan", href: "/scan", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7V4a2 2 0 012-2h3" /><path d="M15 2h3a2 2 0 012 2v3" /><path d="M20 15v3a2 2 0 01-2 2h-3" /><path d="M7 20H4a2 2 0 01-2-2v-3" /><line x1="2" y1="11" x2="20" y2="11" /></svg> },
            ].map(({ label, href, icon }) => (
              <button key={label} onClick={() => router.push(href)} className="flex flex-col items-center px-5 py-1.5 rounded-full transition-all duration-200">
                {icon}
                <span className="text-[10px] mt-1 font-medium" style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.4)" }}>{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </main>
    </>
  );
}
