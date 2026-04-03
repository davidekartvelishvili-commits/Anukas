"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { verifyOtp, sendOtp } from "@/services/auth";

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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      const data = await verifyOtp(phoneRaw, code);
      if (!data.isNewUser && !isLoginMode) {
        // User already exists but came from signup — redirect to login with phone pre-filled
        router.push(`/auth?mode=login&phone=${phoneRaw}&msg=registered`);
        return;
      }
      if (data.isNewUser) {
        router.push("/auth/onboarding");
      } else {
        router.push("/home");
      }
    } catch (err: any) {
      setVerifyError(err.message || "Invalid code");
      setVerifying(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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
