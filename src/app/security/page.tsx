"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, setupPin } from "@/services/auth";
import AuthGuard from "@/components/AuthGuard";

export default function SecurityPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const storedUser = typeof window !== "undefined" ? getStoredUser() : null;
  const [faceId, setFaceId] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(storedUser?.hasPin ?? false);

  // PIN setup flow
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const stagger = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.5s ease-out ${i * 0.08}s`,
  });

  const handleFaceIdToggle = () => {
    if (!faceId) {
      // Turning on — need PIN first
      setShowPinSetup(true);
      setPinStep("enter");
      setFirstPin("");
      setCurrentPin("");
      setPinError("");
      setPinSuccess("");
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setFaceId(false);
      setPinEnabled(false);
    }
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
        setTimeout(() => inputRef.current?.focus(), 50);
      } else {
        // Confirm step
        if (clean === firstPin) {
          setPinSuccess("PIN set successfully!");
          setPinEnabled(true);
          setFaceId(true);
          // Save to backend + localStorage
          try {
            await setupPin(clean);
            const stored = localStorage.getItem("shansi_user");
            if (stored) {
              const user = JSON.parse(stored);
              user.hasPin = true;
              localStorage.setItem("shansi_user", JSON.stringify(user));
            }
          } catch {}
          setTimeout(() => {
            setShowPinSetup(false);
            setPinSuccess("");
          }, 1500);
        } else {
          setPinError("PINs don't match. Try again.");
          setCurrentPin("");
          setPinStep("enter");
          setFirstPin("");
        }
      }
    }
  };

  const handlePinToggle = () => {
    if (pinEnabled) {
      setPinEnabled(false);
    } else {
      setShowPinSetup(true);
      setPinStep("enter");
      setFirstPin("");
      setCurrentPin("");
      setPinError("");
      setPinSuccess("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <AuthGuard>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="min-h-[100dvh] bg-black pb-[100px]">
        <div
          className="max-w-[430px] mx-auto px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          {/* ── Top bar ── */}
          <div className="flex items-center justify-center relative mb-8" style={stagger(0)}>
            <button
              onClick={() => router.back()}
              className="absolute left-0 w-[44px] h-[44px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
              style={{ background: "#1C1C1E" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6" />
              </svg>
            </button>
            <h1
              className="text-white text-[18px] font-bold"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Security & Easy Access
            </h1>
          </div>

          {/* ── Controls ── */}
          <div style={stagger(1)}>
            <h2
              className="text-white text-[17px] font-semibold mb-3"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Login Methods
            </h2>

            <div className="rounded-[28px] overflow-hidden" style={{ background: "#1C1C1E" }}>
              {/* Face Recognition */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="16" height="16" rx="4" />
                    <circle cx="8.5" cy="9" r="1" fill="#FFF" />
                    <circle cx="13.5" cy="9" r="1" fill="#FFF" />
                    <path d="M8 14c.5 1 1.8 1.5 3 1.5s2.5-.5 3-1.5" />
                  </svg>
                  <span
                    className="text-white text-[16px] font-medium"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    Face Recognition
                  </span>
                </div>
                <button
                  onClick={handleFaceIdToggle}
                  className="relative w-[52px] h-[30px] rounded-full transition-all duration-300"
                  style={{ background: faceId ? "#FFFFFF" : "rgba(255,255,255,0.2)" }}
                >
                  <div
                    className="absolute top-[3px] w-[24px] h-[24px] rounded-full transition-all duration-300"
                    style={{ left: faceId ? "25px" : "3px", background: faceId ? "#000" : "#FFF" }}
                  />
                </button>
              </div>

              {/* Divider */}
              <div className="mx-5 h-[0.5px]" style={{ background: "rgba(255,255,255,0.08)" }} />

              {/* PIN */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="10" width="12" height="9" rx="2" />
                    <path d="M8 10V7a3 3 0 016 0v3" />
                    <circle cx="11" cy="15" r="1" fill="#FFF" />
                  </svg>
                  <span
                    className="text-white text-[16px] font-medium"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    PIN Code
                  </span>
                </div>
                <button
                  onClick={handlePinToggle}
                  className="relative w-[52px] h-[30px] rounded-full transition-all duration-300"
                  style={{ background: pinEnabled ? "#FFFFFF" : "rgba(255,255,255,0.2)" }}
                >
                  <div
                    className="absolute top-[3px] w-[24px] h-[24px] rounded-full transition-all duration-300"
                    style={{ left: pinEnabled ? "25px" : "3px", background: pinEnabled ? "#000" : "#FFF" }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── PIN Setup Modal ── */}
        {showPinSetup && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]" onClick={() => { setShowPinSetup(false); setPinError(""); }}>
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative rounded-[20px] px-8 py-8 flex flex-col items-center max-w-[320px] w-full"
              style={{
                background: "rgba(60, 60, 60, 0.12)",
                backdropFilter: "blur(8px) saturate(180%)",
                WebkitBackdropFilter: "blur(8px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lock icon */}
              <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.1)" }}>
                <svg width="28" height="28" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="10" width="12" height="9" rx="2" />
                  <path d="M8 10V7a3 3 0 016 0v3" />
                  <circle cx="11" cy="15" r="1" fill="#FFF" />
                </svg>
              </div>

              <h3 className="text-white text-[18px] font-bold text-center mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
                {pinStep === "enter" ? "Set PIN" : "Confirm PIN"}
              </h3>
              <p className="text-[#999] text-[13px] text-center mb-5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {pinStep === "enter" ? "Enter a 6-digit PIN" : "Re-enter your PIN to confirm"}
              </p>

              {/* PIN dots */}
              <div className="flex gap-3 mb-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[14px] h-[14px] rounded-full transition-all duration-200"
                    style={{
                      background: i < currentPin.length ? "#FFFFFF" : "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>

              {/* Hidden input */}
              <input
                ref={inputRef}
                type="number"
                value={currentPin}
                onChange={(e) => handlePinInput(e.target.value)}
                className="absolute opacity-0 w-0 h-0"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
              />

              {/* Tap to type */}
              <button
                onClick={() => inputRef.current?.focus()}
                className="text-[12px] text-[#666] mb-3"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Tap to enter PIN
              </button>

              {/* Error */}
              {pinError && (
                <p className="text-[#EF4444] text-[13px] font-medium text-center mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {pinError}
                </p>
              )}

              {/* Success */}
              {pinSuccess && (
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,8 6,11 13,4" />
                  </svg>
                  <p className="text-[#22C55E] text-[13px] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {pinSuccess}
                  </p>
                </div>
              )}

              {/* Cancel */}
              <button
                onClick={() => { setShowPinSetup(false); setPinError(""); }}
                className="text-[#999] text-[14px] font-medium mt-2"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Bottom Nav ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
          <div
            className="flex items-center px-2 py-1.5 rounded-full gap-0"
            style={{
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(5px) saturate(200%)",
              WebkitBackdropFilter: "blur(5px) saturate(200%)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            {[
              { label: "Home", idx: 0, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l8-7 8 7" /><path d="M5 9.5v8a1 1 0 001 1h3v-4h4v4h3a1 1 0 001-1v-8" />
                </svg>
              )},
              { label: "Games", idx: 1, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="7" cy="7" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                  <circle cx="15" cy="7" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                  <circle cx="7" cy="15" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                  <circle cx="15" cy="15" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                </svg>
              )},
              { label: "Scan", idx: 2, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7V4a2 2 0 012-2h3" />
                  <path d="M15 2h3a2 2 0 012 2v3" />
                  <path d="M20 15v3a2 2 0 01-2 2h-3" />
                  <path d="M7 20H4a2 2 0 01-2-2v-3" />
                  <line x1="2" y1="11" x2="20" y2="11" />
                </svg>
              )},
            ].map(({ label, idx, icon }) => (
              <button
                key={idx}
                onClick={() => {
                  if (idx === 0) router.push("/home");
                  if (idx === 1) router.push("/games");
                  if (idx === 2) router.push("/scan");
                }}
                className="flex flex-col items-center px-5 py-1.5 rounded-full transition-all duration-200"
              >
                {icon(false)}
                <span
                  className="text-[10px] mt-1 font-medium"
                  style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.4)" }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </main>
    </AuthGuard>
  );
}
