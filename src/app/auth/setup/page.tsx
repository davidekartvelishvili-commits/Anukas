"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";
import { setupPin } from "@/services/auth";

/* ───────── SVG ICONS ───────── */

function UserIcon({ size = 40, color = "#475569" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="15" r="7" stroke={color} strokeWidth="2" />
      <path d="M6 35c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 4.5a1 1 0 011-1h1.5l1-1.5h3l1 1.5H11a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6z" stroke="#0A0F1C" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="7" cy="7.5" r="2" stroke="#0A0F1C" strokeWidth="1.3" />
    </svg>
  );
}

function UserInputIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="6.5" r="3.5" />
      <path d="M2.5 16.5c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" />
    </svg>
  );
}

function CheckIcon({ color = "#00E88F" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function GiftIcon({ color = "#00E88F", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="14" height="8" rx="1.5" />
      <rect x="1" y="5" width="16" height="3" rx="1" />
      <path d="M9 5v11" />
      <path d="M9 5C9 5 7 2 5 2s-2 1.5 0 3 4 0 4 0z" />
      <path d="M9 5c0 0 2-3 4-3s2 1.5 0 3-4 0-4 0z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FF5757" strokeWidth="2" strokeLinecap="round">
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2l2.1 4.3 4.7.7-3.4 3.3.8 4.7L9 12.8 4.8 15l.8-4.7L2.2 7l4.7-.7L9 2z" fill="#00E88F" fillOpacity="0.2" stroke="#00E88F" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#00E88F" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="9" cy="9" r="7" />
      <circle cx="9" cy="9" r="2" fill="#00E88F" fillOpacity="0.3" />
      <path d="M9 2v3M9 13v3M2 9h3M13 9h3" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#00E88F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14V4M5 8l4-4 4 4" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#00E88F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2h8v5a4 4 0 01-8 0V2z" fill="#00E88F" fillOpacity="0.15" />
      <path d="M5 4H3a1 1 0 00-1 1v1a3 3 0 003 3" />
      <path d="M13 4h2a1 1 0 011 1v1a3 3 0 01-3 3" />
      <path d="M9 11v2" />
      <path d="M6 15h6" />
      <path d="M7 15v-2h4v2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 9h10M14 9l-4-4M14 9l-4 4" stroke="#0A0F1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SmallSpinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle className="opacity-25" cx="8" cy="8" r="6" stroke="#00E88F" strokeWidth="2" />
      <path className="opacity-75" fill="#00E88F" d="M2 8a6 6 0 016-6V0A8 8 0 000 8h2z" />
    </svg>
  );
}

function BigSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ───────── MAIN ───────── */

export default function SetupPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");

  const [finishing, setFinishing] = useState(false);
  const [showEasyLogin, setShowEasyLogin] = useState(false);
  const [pinStep, setPinStep] = useState<"ask" | "enter" | "confirm">("ask");
  const [firstPin, setFirstPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const pinRef = useRef<HTMLInputElement>(null);

  // Stagger animations
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Check referral code
  useEffect(() => {
    if (referralCode.length !== 6) {
      setReferralStatus("idle");
      return;
    }
    setReferralStatus("checking");
    const t = setTimeout(() => {
      // Simulate: codes starting with "C" are valid
      setReferralStatus(referralCode.toUpperCase().startsWith("C") ? "valid" : "invalid");
    }, 1500);
    return () => clearTimeout(t);
  }, [referralCode]);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getInitials = () => {
    const parts = name.trim().split(/\s+/);
    return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      if (name.trim()) {
        await apiFetch("/user/profile", {
          method: "PATCH",
          body: JSON.stringify({ name: name.trim().replace(/\s+/g, "_").slice(0, 20) }),
        });
      }
    } catch {}
    setFinishing(false);
    setShowEasyLogin(true);
    setPinStep("ask");
  };

  const handlePinInput = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setCurrentPin(clean);
    setPinError("");
    if (clean.length === 6) {
      if (pinStep === "enter") {
        setFirstPin(clean);
        setCurrentPin("");
        setPinStep("confirm");
        setTimeout(() => pinRef.current?.focus(), 50);
      } else if (pinStep === "confirm") {
        if (clean === firstPin) {
          setPinSuccess("PIN set successfully!");
          try { await setupPin(clean); } catch {}
          setTimeout(() => router.push("/home"), 1200);
        } else {
          setPinError("PINs don't match. Try again.");
          setCurrentPin("");
          setFirstPin("");
          setPinStep("enter");
          setTimeout(() => pinRef.current?.focus(), 50);
        }
      }
    }
  };

  const canFinish = name.trim().length > 0;

  return (
    <main className="min-h-[100dvh] bg-[#0A0F1C] flex flex-col">
      <div className="flex-1 w-full max-w-[430px] mx-auto px-5 sm:px-6 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}>

        {/* ── Progress bar ── */}
        <div
          className="flex gap-1.5 mb-8 transition-opacity duration-500"
          style={{ opacity: visible ? 1 : 0, transitionDelay: "0s" }}
        >
          <div className="flex-1 h-[3px] rounded-[2px] bg-[#00E88F]" />
          <div className="flex-1 h-[3px] rounded-[2px] bg-[#00E88F]" />
          <div className="flex-1 h-[3px] rounded-[2px] overflow-hidden animate-progressShimmer" />
        </div>

        {/* ── Title ── */}
        <div
          className="mb-7 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transitionDelay: "0.05s" }}
        >
          <h1 className="text-[26px] sm:text-[28px] font-bold text-[#F1F5F9] mb-1.5" style={{ fontFamily: "var(--font-outfit)" }}>
            პროფილის შექმნა
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            ბოლო ნაბიჯი რეგისტრაციის დასასრულებლად
          </p>
        </div>

        {/* ── Avatar ── */}
        <div
          className="flex flex-col items-center mb-7 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transitionDelay: "0.1s" }}
        >
          <div className="relative w-[100px] h-[100px]">
            {/* Avatar circle */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-[100px] h-[100px] rounded-[32px] overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: avatar
                  ? "transparent"
                  : name.trim()
                  ? "rgba(0,232,143,0.12)"
                  : "linear-gradient(135deg, #141B2D, #1C2539)",
                border: avatar ? "3px solid #00E88F" : "1.5px solid #1C2539",
              }}
            >
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : name.trim() ? (
                <span className="text-[32px] font-bold text-[#00E88F] select-none" style={{ fontFamily: "var(--font-outfit)" }}>
                  {getInitials()}
                </span>
              ) : (
                <UserIcon size={44} color="#475569" />
              )}
            </button>

            {/* Camera badge — outside the circle at bottom-right corner */}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-[28px] h-[28px] rounded-full bg-[#00E88F] flex items-center justify-center z-10 transition-transform duration-200 hover:scale-110 active:scale-90"
              style={{ border: "3px solid #0A0F1C" }}
            >
              <CameraIcon />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              className="hidden"
            />
          </div>

          <p className="text-[13px] text-[#475569] mt-2.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
            {avatar ? "შეცვალე ფოტო" : "ატვირთე ფოტო"}
          </p>
        </div>

        {/* ── Name input ── */}
        <div
          className="mb-5 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transitionDelay: "0.15s" }}
        >
          <label className="block text-[13px] text-[#94A3B8] font-bold mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
            სახელი
          </label>
          <div
            className="flex items-center h-[52px] sm:h-[56px] rounded-[14px] overflow-hidden transition-all duration-200"
            style={{
              background: "#141B2D",
              border: name.trim() ? "1.5px solid rgba(0,232,143,0.25)" : "1.5px solid #1C2539",
            }}
          >
            <div className="pl-4 shrink-0">
              <UserInputIcon />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="მაგ. გიორგი"
              className="flex-1 h-full bg-transparent px-3 text-[15px] sm:text-[16px] text-[#F1F5F9] placeholder-[#334155] outline-none"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            />
            {name.trim() && (
              <div className="pr-4 shrink-0">
                <CheckIcon />
              </div>
            )}
          </div>
        </div>

        {/* ── Referral code ── */}
        <div
          className="mb-5 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transitionDelay: "0.2s" }}
        >
          {!showReferral ? (
            <button
              onClick={() => setShowReferral(true)}
              className="w-full h-[52px] sm:h-[56px] rounded-[14px] flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[#141B2D] active:scale-[0.97]"
              style={{ border: "1.5px dashed #1C2539" }}
            >
              <PlusIcon />
              <span className="text-[14px] text-[#64748B] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
                გაქვს მოწვევის კოდი?
              </span>
            </button>
          ) : (
            <div>
              <label className="block text-[13px] text-[#94A3B8] font-bold mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
                მოწვევის კოდი
              </label>
              <div
                className="flex items-center h-[52px] sm:h-[56px] rounded-[14px] overflow-hidden transition-all duration-200"
                style={{
                  background: "#141B2D",
                  border: referralStatus === "valid"
                    ? "1.5px solid rgba(0,232,143,0.4)"
                    : referralStatus === "invalid"
                    ? "1.5px solid rgba(255,87,87,0.4)"
                    : "1.5px solid #1C2539",
                }}
              >
                <div className="pl-4 shrink-0">
                  <GiftIcon color="#475569" />
                </div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 6))}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="flex-1 h-full bg-transparent px-3 text-[18px] font-bold text-[#F1F5F9] placeholder-[#334155] outline-none uppercase"
                  style={{ fontFamily: "var(--font-outfit)", letterSpacing: "4px" }}
                />
                <div className="pr-4 shrink-0">
                  {referralStatus === "checking" && <SmallSpinner />}
                  {referralStatus === "valid" && <CheckIcon />}
                  {referralStatus === "invalid" && <XIcon />}
                </div>
              </div>

              {/* Result messages */}
              {referralStatus === "valid" && (
                <div
                  className="mt-3 flex items-start gap-3 p-3 rounded-[12px] animate-fadeIn"
                  style={{ background: "rgba(0,232,143,0.06)", border: "1px solid rgba(0,232,143,0.15)" }}
                >
                  <div className="mt-0.5 shrink-0">
                    <GiftIcon color="#00E88F" size={20} />
                  </div>
                  <div>
                    <p className="text-[14px] text-[#00E88F] font-semibold mb-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      კოდი მიღებულია!
                    </p>
                    <p className="text-[13px] text-[#94A3B8]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      ორივეს მიიღებთ 10 XP ბონუსს
                    </p>
                  </div>
                </div>
              )}

              {referralStatus === "invalid" && (
                <p className="text-[13px] text-[#FF5757] mt-2 ml-1 animate-fadeIn" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  კოდი ვერ მოიძებნა
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Bonus info card ── */}
        <div
          className="mb-6 p-4 rounded-[16px] transition-all duration-500"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.25s",
            background: "linear-gradient(135deg, #141B2D, rgba(28,37,57,0.5))",
            border: "1px solid #1C2539",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center" style={{ background: "rgba(0,232,143,0.1)" }}>
              <StarIcon />
            </div>
            <span className="text-[15px] text-[#F1F5F9] font-semibold" style={{ fontFamily: "var(--font-outfit)" }}>
              რა გელოდება?
            </span>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(0,232,143,0.08)" }}>
                <SpinIcon />
              </div>
              <span className="text-[14px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                უფასო spin ყოველ შენაძენზე
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(0,232,143,0.08)" }}>
                <ArrowUpIcon />
              </div>
              <span className="text-[14px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                ლეველის ამაღლებით მეტი შანსი
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(0,232,143,0.08)" }}>
                <TrophyIcon />
              </div>
              <span className="text-[14px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                ლიდერბორდზე ადგილის დაკავება
              </span>
            </div>
          </div>
        </div>

        {/* ── Bottom buttons ── */}
        <div
          className="flex flex-col gap-3 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transitionDelay: "0.3s" }}
        >
          <button
            onClick={handleFinish}
            disabled={!canFinish || finishing}
            className="w-full h-[52px] sm:h-[56px] rounded-[16px] text-[16px] sm:text-[17px] font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97]"
            style={{
              fontFamily: "var(--font-outfit)",
              background: canFinish ? "linear-gradient(135deg, #00E88F, #00C777)" : "#141B2D",
              color: canFinish ? "#0A0F1C" : "#334155",
              boxShadow: canFinish ? "0 4px 24px rgba(0,232,143,0.3)" : "none",
              cursor: canFinish ? "pointer" : "not-allowed",
            }}
          >
            {finishing ? (
              <BigSpinner />
            ) : (
              <>
                დასრულება
                <ArrowRightIcon />
              </>
            )}
          </button>

          <button
            onClick={() => router.push("/home")}
            className="w-full h-[44px] text-[14px] text-[#475569] font-medium transition-all duration-200 hover:text-[#94A3B8] active:scale-[0.97]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            მოგვიანებით
          </button>
        </div>
      </div>

      {/* iPhone bar */}
      <div className="flex justify-center pb-[max(8px,env(safe-area-inset-bottom,8px))]">
        <div className="w-[134px] h-[5px] rounded-full bg-[rgba(241,245,249,0.12)]" />
      </div>
    </main>

    {/* ── Easy Login Setup Overlay ── */}
    {showEasyLogin && (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000000" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {pinStep === "ask" && (
            <>
              {/* Lock icon */}
              <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-6" style={{ background: "#1C1C1E" }}>
                <svg width="36" height="36" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="10" width="12" height="9" rx="2" />
                  <path d="M8 10V7a3 3 0 016 0v3" />
                  <circle cx="11" cy="15" r="1" fill="#FFF" />
                </svg>
              </div>

              <h2 className="text-white text-[26px] font-bold text-center mb-3" style={{ fontFamily: "var(--font-outfit)" }}>
                Easy Login
              </h2>
              <p className="text-[#9CA3AF] text-[15px] text-center mb-8 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Set up Face ID or PIN for quick access next time
              </p>

              <button
                onClick={() => { setPinStep("enter"); setTimeout(() => pinRef.current?.focus(), 100); }}
                className="w-full max-w-[300px] h-[60px] rounded-[30px] text-[17px] font-bold mb-4 active:scale-[0.97] transition-transform"
                style={{ background: "#FFE500", color: "#000", fontFamily: "var(--font-outfit)" }}
              >
                Set Up PIN
              </button>

              <button
                onClick={() => router.push("/home")}
                className="text-[16px] font-semibold active:opacity-50 transition-opacity"
                style={{ color: "#9CA3AF", fontFamily: "var(--font-outfit)" }}
              >
                Maybe Later
              </button>
            </>
          )}

          {(pinStep === "enter" || pinStep === "confirm") && (
            <>
              <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-6" style={{ background: "#1C1C1E" }}>
                <svg width="36" height="36" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="10" width="12" height="9" rx="2" />
                  <path d="M8 10V7a3 3 0 016 0v3" />
                  <circle cx="11" cy="15" r="1" fill="#FFF" />
                </svg>
              </div>

              <h2 className="text-white text-[24px] font-bold text-center mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
                {pinStep === "enter" ? "Create PIN" : "Confirm PIN"}
              </h2>
              <p className="text-[#9CA3AF] text-[14px] text-center mb-8" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {pinStep === "enter" ? "Enter a 6-digit PIN" : "Re-enter your PIN to confirm"}
              </p>

              {/* PIN dots */}
              <div className="flex gap-4 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[16px] h-[16px] rounded-full transition-all duration-200"
                    style={{
                      background: i < currentPin.length ? "#FFE500" : "transparent",
                      border: i < currentPin.length ? "2px solid #FFE500" : "2px solid #2A2A2A",
                    }}
                  />
                ))}
              </div>

              {pinError && (
                <p className="text-[#EF4444] text-[13px] font-medium mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>{pinError}</p>
              )}

              {pinSuccess && (
                <div className="flex items-center gap-2 mb-4">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,8 6,11 13,4" />
                  </svg>
                  <p className="text-[#22C55E] text-[14px] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>{pinSuccess}</p>
                </div>
              )}

              {/* Hidden input */}
              <input
                ref={pinRef}
                type="number"
                value={currentPin}
                onChange={(e) => handlePinInput(e.target.value)}
                className="absolute opacity-0 w-0 h-0"
                inputMode="numeric"
                autoFocus
              />

              <button
                onClick={() => pinRef.current?.focus()}
                className="text-[13px] text-[#6B7280] mb-6"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Tap to enter PIN
              </button>

              <button
                onClick={() => { setShowEasyLogin(false); router.push("/home"); }}
                className="text-[14px] font-semibold active:opacity-50"
                style={{ color: "#9CA3AF", fontFamily: "var(--font-outfit)" }}
              >
                Skip
              </button>
            </>
          )}
        </div>
      </div>
    )}
  );
}
