"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCoinBalance, getCashBalance, exchange as doExchange } from "@/services/balance";

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showCardNotif, setShowCardNotif] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All Activity");
  const [gender, setGender] = useState("Male");
  const [showEditCode, setShowEditCode] = useState(false);
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window === "undefined") return "CASHBACK001";
    return localStorage.getItem("shansi_referral") || "CASHBACK001";
  });
  const [editCodeInput, setEditCodeInput] = useState("");
  const [showEditName, setShowEditName] = useState(false);
  const [showNameConfirm, setShowNameConfirm] = useState(false);
  const [editNameInput, setEditNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [username, setUsername] = useState(() => {
    if (typeof window === "undefined") return "Cashback User";
    try {
      const stored = localStorage.getItem("shansi_user");
      if (stored) {
        const user = JSON.parse(stored);
        return user.name || "Cashback User";
      }
    } catch {}
    return "Cashback User";
  });
  const [showExchange, setShowExchange] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [cashBalance, setCashBalanceState] = useState(28);
  const [coinBalance, setCoinBalanceState] = useState(5000);

  useEffect(() => {
    setCashBalanceState(getCashBalance());
    setCoinBalanceState(getCoinBalance());
    const saved = localStorage.getItem("user-gender");
    if (saved) setGender(saved);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const avatarSrc = gender === "Female" ? "/images/profile-avatar-female.png" : gender === "Other" ? "/images/profile-avatar-other.png" : "/images/profile-avatar.png";

  const stagger = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.5s ease-out ${i * 0.08}s`,
  });

  return (
    <>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="min-h-[100dvh] bg-black pb-[100px]">
        <div
          className="max-w-[430px] mx-auto px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          {/* ── Top bar: back + settings ── */}
          <div className="flex items-center justify-between mb-8" style={stagger(0)}>
            <button
              onClick={() => router.back()}
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
              style={{ background: "#1C1C1E" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
              style={{ background: "#1C1C1E" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>

          {/* ── Avatar ── */}
          <div className="flex flex-col items-center mb-6" style={stagger(1)}>
            <div className="relative mb-4">
              <div
                className="w-[140px] h-[140px] rounded-full overflow-hidden"
                style={{ background: "linear-gradient(135deg, #C4E0F9, #E8D5F5)" }}
              >
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Upload button */}
              <button
                className="absolute bottom-0 right-0 w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
                style={{ background: "#2C2C2E" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14h8" />
                  <path d="M8 10V2" />
                  <path d="M5 5l3-3 3 3" />
                </svg>
              </button>
            </div>

            {/* Username — tappable to edit */}
            <button
              onClick={() => { setEditNameInput(username); setNameError(""); setShowEditName(true); }}
              className="flex items-center gap-2 active:opacity-70 transition-opacity"
            >
              <h1
                className="text-white text-[22px] font-bold"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {username}
              </h1>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" />
              </svg>
            </button>

            {/* Level badge */}
            <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full" style={{ background: "rgba(249,231,65,0.12)", border: "1px solid rgba(249,231,65,0.2)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="#F9E741" stroke="none">
                <path d="M7 0.5l1.76 3.57 3.94.57-2.85 2.78.67 3.93L7 9.46l-3.52 1.89.67-3.93L1.3 4.64l3.94-.57L7 0.5z" />
              </svg>
              <span className="text-[12px] font-bold" style={{ color: "#F9E741", fontFamily: "var(--font-outfit)" }}>
                Level 1
              </span>
            </div>
          </div>

          {/* ── Balance row: Coins + Lari + Card ── */}
          <div className="flex items-end justify-center gap-0 mb-10" style={stagger(2)}>
            {/* Coins (for playing) */}
            <div className="flex-1 flex flex-col items-center">
              <img
                src="/images/coin-icon.png"
                alt="Coin"
                width={60}
                height={60}
                style={{ objectFit: "contain" }}
                className="mb-1"
              />
              <div className="flex items-center gap-1 mb-1">
                <span
                  className="text-white text-[22px] font-bold"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  {coinBalance.toLocaleString()}
                </span>
              </div>
              <span
                className="text-[12px] text-[#888]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Coins
              </span>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-[50px] bg-[#333]" />

            {/* Lari (winnings) */}
            <div className="flex-1 flex flex-col items-center cursor-pointer active:scale-[0.97] transition-transform" onClick={() => setShowBalanceModal(true)}>
              <img
                src="/images/lari-icon.png"
                alt="₾"
                width={115}
                height={115}
                style={{ objectFit: "contain" }}
                className="mb-1"
              />
              <div className="flex items-center gap-1 mb-1">
                <span
                  className="text-white text-[22px] font-bold"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  {cashBalance}
                </span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5l3 3 3-3" />
                </svg>
              </div>
              <span
                className="text-[12px] text-[#888]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Winnings ₾
              </span>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-[50px] bg-[#333]" />

            {/* Add a card */}
            <div className="flex-1 flex flex-col items-center cursor-pointer active:scale-[0.97] transition-transform" onClick={() => setShowCardNotif(true)}>
              <div className="mb-1">
                <svg width="60" height="60" viewBox="0 0 48 36" fill="none">
                  <rect x="2" y="2" width="44" height="32" rx="6" fill="#1C1C1E" stroke="#333" strokeWidth="1" />
                  <rect x="6" y="10" width="20" height="3" rx="1.5" fill="#333" />
                  <rect x="6" y="16" width="12" height="2" rx="1" fill="#2A2A2A" />
                  <circle cx="40" cy="26" r="4" fill="#FFD700" opacity="0.6" />
                  <circle cx="36" cy="26" r="4" fill="#FFD700" opacity="0.4" />
                </svg>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <span
                  className="text-white text-[22px] font-bold"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  ₾0.00
                </span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5l3 3 3-3" />
                </svg>
              </div>
              <span
                className="text-[12px] text-[#888]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Add a card
              </span>
            </div>
          </div>

          {/* ── Referral section ── */}
          <div className="flex flex-col items-center" style={stagger(3)}>
            <h2
              className="text-white text-[22px] font-bold mb-3 text-center"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Get 500 Cashback Cash 🎉
            </h2>
            <p
              className="text-[#999] text-[15px] text-center mb-6 leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Earn <span className="text-white font-bold">10</span> Cashback Cash for each referral
              plus extra <span className="text-white font-bold">25</span> every five referrals
            </p>

            {/* Referral progress dots */}
            <div className="flex items-center gap-3 mb-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[44px] h-[44px] rounded-full"
                  style={{
                    border: "2px dashed rgba(255,255,255,0.2)",
                    background: "transparent",
                  }}
                />
              ))}
            </div>

            {/* Referral code */}
            <div className="flex items-center gap-2 mb-6">
              <span
                className="text-[#888] text-[15px]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Code:
              </span>
              <span
                className="text-white text-[17px] font-bold tracking-wide"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {referralCode}
              </span>
              <button
                className="active:scale-[0.95] transition-transform"
                onClick={() => { setEditCodeInput(referralCode); setShowEditCode(true); }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 3.5l3 3M2 14l.7-2.8L11 3l3 3-8.3 8.2L2 14z" />
                </svg>
              </button>
            </div>

            {/* Share button */}
            <button
              className="px-16 py-7 rounded-full flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              style={{ background: "#FFFFFF" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v5a1 1 0 001 1h10a1 1 0 001-1v-5" />
                <path d="M10 3v10" />
                <path d="M7 6l3-3 3 3" />
              </svg>
              <span
                className="text-black text-[17px] font-bold"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Share
              </span>
            </button>
          </div>

          {/* ── All Activity ── */}
          <div className="mt-10" style={stagger(4)}>
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-white text-[22px] font-bold"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                All Activity
              </h2>
              <div className="relative">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="w-[40px] h-[40px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
                  style={{ background: "#2C2C2E" }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="17" y2="6" />
                    <line x1="6" y1="10" x2="14" y2="10" />
                    <line x1="8" y1="14" x2="12" y2="14" />
                  </svg>
                </button>

                {showFilter && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                    <div
                      className="absolute right-0 top-[48px] z-50 rounded-[16px] py-2 min-w-[180px]"
                      style={{
                        background: "rgba(50, 50, 50, 0.08)",
                        backdropFilter: "blur(12px) saturate(200%)",
                        WebkitBackdropFilter: "blur(12px) saturate(200%)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        animation: "fadeIn 0.15s ease-out",
                      }}
                    >
                      {["All Activity", "Rewards", "Redemptions"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { setActiveFilter(cat); setShowFilter(false); }}
                          className="w-full text-left px-4 py-3 transition-all duration-150"
                          style={{
                            background: activeFilter === cat ? "rgba(255,255,255,0.1)" : "transparent",
                          }}
                        >
                          <span
                            className={`text-[15px] font-medium ${activeFilter === cat ? "text-white" : "text-[#999]"}`}
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            {cat}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="h-[0.5px] mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />

            {[
              { text: "You dropped it like it's hot on Lucky Drop 🎯 1 times in practice! 🎯 Scored 89 Practice Coins in 24 hours", time: "11h" },
              { text: "You got lucky on Midnight Machine 🎰 7 times in practice! 🎯 Scored 4125 Practice Coins in 24 hours", time: "11h" },
              { text: "You crushed MYSTERY_BOX 1 times! Won ₾25.00 in 24 hours 🔥", time: "19h" },
              { text: "Welcome! Cashback helps you pay bills by playing fun games for cash.", time: "19h" },
            ].map((item, i, arr) => (
              <div key={i}>
                <div className="flex items-start gap-4 py-5">
                  {/* ₾ icon */}
                  <div
                    className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ background: "#FFD700" }}
                  >
                    <span className="text-black text-[26px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>₾</span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-white text-[15px] font-medium leading-[1.5]"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {item.text}
                    </p>
                  </div>

                  {/* Time */}
                  <span
                    className="text-[14px] text-[#666] shrink-0 mt-0.5"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {item.time}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="h-[0.5px]" style={{ background: "rgba(255,255,255,0.08)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Edit Referral Code Modal ── */}
      {showEditCode && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowEditCode(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-[430px] rounded-t-[36px] pb-8 pt-3 px-5"
            style={{
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-[36px] h-[5px] rounded-full bg-white/30 mx-auto mb-6" />

            {/* Pencil emoji */}
            <div className="flex justify-center mb-4">
              <span className="text-[48px]">✏️</span>
            </div>

            {/* Title */}
            <h3
              className="text-white text-[22px] font-bold text-center mb-3"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Edit Referral Code
            </h3>

            {/* Description */}
            <p
              className="text-[#999] text-[15px] text-center mb-6 leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Set a custom referral code that&apos;s easy for friends to remember.
            </p>

            {/* Input */}
            <input
              type="text"
              placeholder="eg. MYCODE123"
              value={editCodeInput}
              onChange={(e) => setEditCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20))}
              className="w-full px-5 py-4 rounded-full text-[16px] text-white placeholder-[#666] outline-none mb-2"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "var(--font-dm-sans)",
              }}
            />

            {/* Hint */}
            <p
              className="text-[#666] text-[13px] text-center mb-6"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              4-20 characters, letters and numbers only
            </p>

            {/* Buttons */}
            <div className="flex items-center justify-between px-4">
              <button
                onClick={() => setShowEditCode(false)}
                className="active:opacity-60 transition-opacity"
              >
                <span
                  className="text-white text-[17px] font-bold"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  Cancel
                </span>
              </button>
              <button
                onClick={() => {
                  if (editCodeInput.length >= 4) {
                    setReferralCode(editCodeInput);
                    localStorage.setItem("shansi_referral", editCodeInput);
                    setShowEditCode(false);
                  }
                }}
                className="active:opacity-60 transition-opacity"
              >
                <span
                  className={`text-[17px] font-bold ${editCodeInput.length >= 4 ? "text-white" : "text-[#555]"}`}
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  Save
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Balance Modal ── */}
      {showBalanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowBalanceModal(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-[430px] rounded-t-[36px] pb-8 pt-3 px-5"
            style={{
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-[36px] h-[5px] rounded-full bg-white/30 mx-auto mb-5" />
            <h3
              className="text-white text-[20px] font-bold text-center mb-6"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Select an Option
            </h3>
            <div className="flex gap-3 mb-6">
              <button
                className="flex-1 flex flex-col items-center gap-3 py-6 rounded-[28px] transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onClick={() => {
                  setShowBalanceModal(false);
                  setExchangeAmount("");
                  setShowExchange(true);
                }}
              >
                <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 16l-4-4 4-4" />
                    <path d="M3 12h14" />
                    <path d="M17 8l4 4-4 4" />
                    <path d="M21 12H7" />
                  </svg>
                </div>
                <span className="text-white text-[14px] font-semibold" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  Exchange
                </span>
              </button>
              <button
                className="flex-1 flex flex-col items-center gap-3 py-6 rounded-[28px] transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onClick={() => {
                  setShowBalanceModal(false);
                  router.push("/redeem");
                }}
              >
                <div className="w-[52px] h-[52px] rounded-full bg-[#3A3A3C] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </div>
                <span className="text-[#999] text-[14px] font-semibold" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  Redeem Balance
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Card Coming Soon Notification ── */}
      {showCardNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowCardNotif(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative rounded-[20px] px-8 py-10 flex flex-col items-center max-w-[320px] w-full"
            style={{
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
              border: "1px solid rgba(255,255,255,0.2)",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[40px] mb-4">🚀</span>
            <h3
              className="text-white text-[20px] font-bold text-center mb-2"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Coming Soon
            </h3>
            <p
              className="text-[#999] text-[14px] text-center"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              This feature is coming soon
            </p>
          </div>
        </div>
      )}

      {/* ── Edit Username Modal (bottom sheet) ── */}
      {showEditName && !showNameConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEditName(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-[430px] rounded-t-[36px] pb-8 pt-3 px-5"
            style={{ background: "rgba(30,30,30,0.55)", backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)", borderTop: "1px solid rgba(255,255,255,0.15)", animation: "slideUp 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-[36px] h-[5px] rounded-full bg-white/30 mx-auto mb-5" />

            <h3 className="text-white text-[20px] font-bold text-center mb-5" style={{ fontFamily: "var(--font-outfit)" }}>
              Edit Username
            </h3>

            <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="7" r="4" /><path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" />
              </svg>
              <input
                type="text"
                placeholder="eg. cool_user"
                value={editNameInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/\s/g, "").slice(0, 20);
                  setEditNameInput(v);
                  if (v.length > 0 && v.length < 3) setNameError("Minimum 3 characters");
                  else if (!/^[a-zA-Z0-9_-]*$/.test(v)) setNameError("Only letters, numbers, _ and -");
                  else setNameError("");
                }}
                className="flex-1 bg-transparent text-white text-[18px] font-bold outline-none"
                style={{ fontFamily: "var(--font-outfit)" }}
                maxLength={20}
              />
              <span className="text-[11px] text-[#666] shrink-0" style={{ fontFamily: "var(--font-dm-sans)" }}>{editNameInput.length}/20</span>
            </div>

            {nameError && (
              <p className="text-[#EF4444] text-[12px] mt-2 px-1" style={{ fontFamily: "var(--font-dm-sans)" }}>{nameError}</p>
            )}

            <p className="text-[11px] text-[#666] text-center my-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Letters, numbers, _ and - only
            </p>

            <button
              onClick={() => {
                if (editNameInput.length >= 3 && !nameError) {
                  setShowNameConfirm(true);
                }
              }}
              disabled={editNameInput.length < 3 || !!nameError}
              className="mx-auto block px-10 py-5 rounded-full text-[16px] font-bold transition-all active:scale-[0.97] disabled:opacity-40"
              style={{ background: "#F9E741", color: "#000", fontFamily: "var(--font-outfit)" }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm Username Change ── */}
      {showNameConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowNameConfirm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative rounded-[20px] px-7 py-7 flex flex-col items-center max-w-[320px] w-full"
            style={{ background: "rgba(30,30,30,0.55)", backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)", border: "1px solid rgba(255,255,255,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
              <path d="M10 2L1 18h18L10 2z" /><line x1="10" y1="8" x2="10" y2="12" /><circle cx="10" cy="15" r="0.5" fill="#F97316" />
            </svg>
            <h3 className="text-white text-[17px] font-bold text-center mb-2" style={{ fontFamily: "var(--font-outfit)" }}>Are you sure?</h3>
            <p className="text-[#999] text-[13px] text-center mb-5 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
              You will not be able to change your username for the next <span className="text-white font-bold">24 hours</span>
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={async () => {
                  setUsername(editNameInput);
                  setShowNameConfirm(false);
                  setShowEditName(false);
                  // Save to backend
                  try {
                    const { apiFetch } = await import("@/services/api");
                    await apiFetch("/user/profile", { method: "PATCH", body: JSON.stringify({ name: editNameInput }) });
                    const stored = localStorage.getItem("shansi_user");
                    if (stored) {
                      const user = JSON.parse(stored);
                      user.name = editNameInput;
                      localStorage.setItem("shansi_user", JSON.stringify(user));
                    }
                  } catch {}
                }}
                className="flex-1 py-3 rounded-full text-[13px] font-bold active:scale-[0.97]"
                style={{ background: "#F9E741", color: "#000", fontFamily: "var(--font-outfit)" }}
              >Confirm</button>
              <button onClick={() => setShowNameConfirm(false)} className="flex-1 py-3 rounded-full text-[13px] font-bold"
                style={{ background: "rgba(255,255,255,0.08)", color: "#999", fontFamily: "var(--font-outfit)" }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Exchange Popup (bottom sheet) ── */}
      {showExchange && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowExchange(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-[430px] rounded-t-[36px] pb-8 pt-3 px-5"
            style={{ background: "rgba(30,30,30,0.55)", backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)", borderTop: "1px solid rgba(255,255,255,0.15)", animation: "slideUp 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-[36px] h-[5px] rounded-full bg-white/30 mx-auto mb-5" />
            <h3 className="text-white text-[20px] font-bold text-center mb-6" style={{ fontFamily: "var(--font-outfit)" }}>Exchange</h3>

            <div className="flex items-center py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="w-[60px] shrink-0 flex items-center justify-center">
                <img src="/images/lari-icon.png" alt="₾" width={75} height={75} style={{ objectFit: "contain" }} />
              </div>
              <input type="number" placeholder="0" value={exchangeAmount} onChange={(e) => setExchangeAmount(e.target.value)}
                className="flex-1 bg-transparent text-white text-[22px] font-bold outline-none ml-2" style={{ fontFamily: "var(--font-outfit)" }} min={0} max={cashBalance} />
              <span className="text-[15px] text-[#999] font-semibold shrink-0" style={{ fontFamily: "var(--font-dm-sans)" }}>Balance: {cashBalance} ₾</span>
            </div>

            <div className="flex justify-center py-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4v12M6 12l4 4 4-4" /></svg>
            </div>

            <div className="flex items-center py-3 border-b mb-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="w-[60px] shrink-0 flex items-center justify-center">
                <img src="/images/coin-icon.png" alt="Coin" width={42} height={42} style={{ objectFit: "contain" }} />
              </div>
              <span className="flex-1 text-white text-[22px] font-bold ml-2" style={{ fontFamily: "var(--font-outfit)" }}>
                {exchangeAmount ? (parseFloat(exchangeAmount) * 100).toLocaleString() : "0"}
              </span>
              <span className="text-[15px] text-[#999] font-semibold shrink-0" style={{ fontFamily: "var(--font-dm-sans)" }}>Coins</span>
            </div>

            <p className="text-[13px] text-[#999] text-center mb-5" style={{ fontFamily: "var(--font-dm-sans)" }}>1₾ Cash = 100 Coin</p>

            <button
              onClick={() => {
                const amt = parseFloat(exchangeAmount);
                if (doExchange(amt)) { setCashBalanceState(getCashBalance()); setCoinBalanceState(getCoinBalance()); setShowExchange(false); setExchangeAmount(""); }
              }}
              disabled={!exchangeAmount || parseFloat(exchangeAmount) <= 0 || parseFloat(exchangeAmount) > cashBalance}
              className="mx-auto block px-10 py-8 rounded-full text-[16px] font-bold transition-all active:scale-[0.97] disabled:opacity-40"
              style={{ background: "#F9E741", color: "#000", fontFamily: "var(--font-outfit)" }}
            >Exchange</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
