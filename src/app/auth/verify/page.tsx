"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { verifyOtp, sendOtp, setupPin } from "@/services/auth";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneRaw = searchParams.get("phone") || "";
  const isLoginMode = searchParams.get("mode") === "login";
  const [verifyError, setVerifyError] = useState("");

  // Format phone for display: +995 5XX XX XX XX
  const formatDisplay = (d: string) => {
    if (d.length <= 3) return `+995 ${d}`;
    if (d.length <= 5) return `+995 ${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 7) return `+995 ${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
    return `+995 ${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  };

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralToast, setReferralToast] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // PIN creation state
  const [pinStep, setPinStep] = useState<"none" | "create" | "confirm">("none");
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [firstPin, setFirstPin] = useState("");
  const [pinError, setPinError] = useState("");
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (value && index === 5 && next.every((d) => d !== "")) {
      submitOtp(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === 6) {
      submitOtp(pasted);
    }
  };

  const submitOtp = async (code: string) => {
    setVerifying(true);
    setVerifyError("");
    try {
      const data = await verifyOtp(phoneRaw, code, referralCode.trim() || undefined) as any;
      if (data.referralReward) {
        setReferralToast(`\u10DB\u10D8\u10D8\u10E6\u10D4 ${data.referralReward.coinsEarned} \u10E5\u10DD\u10D8\u10DC\u10D8 \u10E0\u10D4\u10E4\u10D4\u10E0\u10D0\u10DA \u10D1\u10DD\u10DC\u10E3\u10E1\u10D8! \uD83C\uDF89`);
        await new Promise(r => setTimeout(r, 2000));
      }
      if (data.isNewUser) {
        // New user — show PIN creation
        setVerifying(false);
        setPinStep("create");
        setPin(["", "", "", "", "", ""]);
        setTimeout(() => pinRefs.current[0]?.focus(), 300);
        return;
      }
      router.push("/home");
    } catch (err: any) {
      setVerifyError(err.message || "Invalid code");
      setVerifying(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  // PIN input handlers
  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);

    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && next.every((d) => d !== "")) {
      handlePinSubmit(next.join(""));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const next = [...pin];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setPin(next);
    const focusIdx = Math.min(pasted.length, 5);
    pinRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) {
      handlePinSubmit(pasted);
    }
  };

  const handlePinSubmit = async (code: string) => {
    if (pinStep === "create") {
      setFirstPin(code);
      setPinStep("confirm");
      setPin(["", "", "", "", "", ""]);
      setPinError("");
      setTimeout(() => pinRefs.current[0]?.focus(), 200);
      return;
    }

    if (pinStep === "confirm") {
      if (code !== firstPin) {
        setPinError("\u10DE\u10D8\u10DC\u10D4\u10D1\u10D8 \u10D0\u10E0 \u10D4\u10E0\u10D7\u10DB\u10D0\u10DC\u10D4\u10D7\u10D8. \u10E1\u10EA\u10D0\u10D3\u10D4\u10D7 \u10D7\u10D0\u10D5\u10D8\u10D3\u10D0\u10DC.");
        setPin(["", "", "", "", "", ""]);
        setTimeout(() => pinRefs.current[0]?.focus(), 200);
        return;
      }

      setVerifying(true);
      setPinError("");
      try {
        await setupPin(code);
        // Update stored user to reflect PIN
        const stored = localStorage.getItem("shansi_user");
        if (stored) {
          const user = JSON.parse(stored);
          user.hasPin = true;
          localStorage.setItem("shansi_user", JSON.stringify(user));
        }
        router.push("/home");
      } catch (err: any) {
        setPinError(err.message || "PIN setup failed");
        setVerifying(false);
        setPin(["", "", "", "", "", ""]);
        setTimeout(() => pinRefs.current[0]?.focus(), 200);
      }
    }
  };

  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setVerifyError("");
    inputRefs.current[0]?.focus();
    try {
      await sendOtp(phoneRaw);
    } catch {}
  };

  // ── PIN creation screen ──
  if (pinStep !== "none") {
    return (
      <>
        <style>{`html, body { background: #000000 !important; }`}</style>
        <meta name="theme-color" content="#000000" />

        <main
          className="flex flex-col"
          style={{ background: "#000000", minHeight: "100dvh", height: "100dvh" }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center px-4 pt-3 shrink-0"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
          >
            <button
              onClick={() => {
                if (pinStep === "confirm") {
                  setPinStep("create");
                  setPin(["", "", "", "", "", ""]);
                  setPinError("");
                  setTimeout(() => pinRefs.current[0]?.focus(), 200);
                }
              }}
              className="w-[32px] h-[32px] flex items-center justify-center active:opacity-50 transition-opacity"
              style={{ visibility: pinStep === "confirm" ? "visible" : "hidden" }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 5L8 11l6 6" />
              </svg>
            </button>
            <span
              className="flex-1 text-center text-[16px] font-semibold text-white pr-8"
              style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
            >
              {"\u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8"}
            </span>
          </div>

          {/* ── Content ── */}
          <div className="flex flex-col items-center px-6 pt-12 shrink-0">
            {/* Lock icon */}
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-6"
              style={{ background: "#1C1C1E" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFE500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>

            <h1
              className="text-[28px] sm:text-[32px] font-bold text-white text-center leading-[1.15]"
              style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
            >
              {pinStep === "create"
                ? "\u10E8\u10D4\u10E5\u10DB\u10D4\u10DC\u10D8 \u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8"
                : "\u10D2\u10D0\u10D8\u10DB\u10D4\u10DD\u10E0\u10D4\u10D7 \u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8"}
            </h1>

            <p
              className="text-[15px] text-[#9CA3AF] mt-3 text-center leading-[1.4]"
              style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
            >
              {pinStep === "create"
                ? "\u10E8\u10D4\u10D8\u10E7\u10D5\u10D0\u10DC\u10D4\u10D7 6-\u10DC\u10D8\u10E8\u10DC\u10D0 \u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8"
                : "\u10E8\u10D4\u10D8\u10E7\u10D5\u10D0\u10DC\u10D4\u10D7 \u10DE\u10D8\u10DC \u10D9\u10DD\u10D3\u10D8 \u10D7\u10D0\u10D5\u10D8\u10D3\u10D0\u10DC"}
            </p>

            {/* PIN inputs */}
            <div className="flex justify-center gap-3 mt-8" onPaste={handlePinPaste}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { pinRefs.current[i] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className="w-[48px] h-[56px] rounded-[16px] text-center text-[22px] font-bold text-white outline-none transition-all duration-200 caret-white"
                  style={{
                    fontFamily: "var(--font-outfit), system-ui, sans-serif",
                    background: digit ? "#2A2A2E" : "#1C1C1E",
                    border: "none",
                  }}
                />
              ))}
            </div>

            {/* PIN dots indicator */}
            <div className="flex gap-2 mt-6">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: pinStep === "create" ? "#FFE500" : "#333" }}
              />
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: pinStep === "confirm" ? "#FFE500" : "#333" }}
              />
            </div>
          </div>

          {/* ── Spacer ── */}
          <div className="flex-1" />

          {/* Error */}
          {pinError && (
            <p
              className="text-[#EF4444] text-[14px] text-center font-medium mb-4 px-6"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {pinError}
            </p>
          )}

          <div className="h-8 shrink-0" />

          {/* Loading overlay */}
          {verifying && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
              <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#FFE500" strokeWidth="3" />
                <path className="opacity-75" fill="#FFE500" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </main>
      </>
    );
  }

  // ── OTP verification screen ──
  return (
    <>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main
        className="flex flex-col"
        style={{ background: "#000000", minHeight: "100dvh", height: "100dvh" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center px-4 pt-3 shrink-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
        >
          <button
            onClick={() => router.back()}
            className="w-[32px] h-[32px] flex items-center justify-center active:opacity-50 transition-opacity"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 5L8 11l6 6" />
            </svg>
          </button>
          <span
            className="flex-1 text-center text-[16px] font-semibold text-white pr-8"
            style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
          >
            Create account
          </span>
        </div>

        {/* ── Content ── */}
        <div className="flex flex-col items-center px-6 pt-8 shrink-0">
          {/* Title */}
          <h1
            className="text-[32px] sm:text-[36px] font-bold text-white text-center leading-[1.15]"
            style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
          >
            Verify your<br />phone number
          </h1>

          {/* Subtitle */}
          <p
            className="text-[15px] text-[#9CA3AF] mt-3 text-center leading-[1.4]"
            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
          >
            Enter 6-digit code sent to
          </p>
          <p
            className="text-[15px] text-white font-medium text-center mt-0.5"
            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
          >
            {formatDisplay(phoneRaw)}
          </p>

          {/* OTP inputs */}
          <div className="flex justify-center gap-3 mt-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-[48px] h-[56px] rounded-[16px] text-center text-[22px] font-bold text-white outline-none transition-all duration-200 caret-white"
                style={{
                  fontFamily: "var(--font-outfit), system-ui, sans-serif",
                  background: digit ? "#2A2A2E" : "#1C1C1E",
                  border: "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Referral Code Input ── */}
        <div className="px-6 mt-6 shrink-0">
          <input
            type="text"
            placeholder={"\u10E0\u10D4\u10E4\u10D4\u10E0\u10D0\u10DA \u10D9\u10DD\u10D3\u10D8 (\u10D0\u10E0\u10D0\u10E1\u10D0\u10D5\u10D0\u10DA\u10D3\u10D4\u10D1\u10E3\u10DA\u10DD)"}
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-[12px] text-[14px] text-white placeholder-[#666] outline-none text-center"
            style={{ background: "#1C1C1E", fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
          />
          <p className="text-[11px] text-center mt-1.5" style={{ color: "#666666", fontFamily: "var(--font-dm-sans)" }}>
            {"\u10DB\u10D0\u10D2: SHANSI-A7B3K9"}
          </p>
        </div>

        {/* ── Referral Toast ── */}
        {referralToast && (
          <div className="px-6 mt-3 shrink-0">
            <div className="rounded-[12px] px-4 py-3 text-center" style={{ background: "#22C55E20" }}>
              <p className="text-[14px] font-bold" style={{ color: "#22C55E", fontFamily: "var(--font-outfit)" }}>{referralToast}</p>
            </div>
          </div>
        )}

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* Error */}
        {verifyError && (
          <p className="text-[#EF4444] text-[14px] text-center font-medium mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>{verifyError}</p>
        )}

        {/* ── Resend Code ── */}
        <div className="flex justify-center pb-4 shrink-0">
          <button
            onClick={handleResend}
            className="text-[16px] font-semibold text-white active:opacity-50 transition-opacity"
            style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
          >
            Resend Code
          </button>
        </div>

        {/* Loading overlay */}
        {verifying && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#FFE500" strokeWidth="3" />
              <path className="opacity-75" fill="#FFE500" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </main>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main style={{ background: "#000000", minHeight: "100dvh" }} />
    }>
      <VerifyContent />
    </Suspense>
  );
}
