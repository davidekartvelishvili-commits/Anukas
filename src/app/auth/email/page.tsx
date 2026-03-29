"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleContinue = () => {
    if (!isValid) return;
    router.push("/auth/onboarding");
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
            Enter your email
          </h1>

          {/* Subtitle */}
          <p
            className="text-[15px] text-[#9CA3AF] mt-3 text-center"
            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
          >
            Used to maintain your account
          </p>

          {/* Email input — rounded pill */}
          <div
            className="w-full mt-8 flex items-center h-[60px] rounded-full px-6 transition-all duration-200"
            style={{
              background: "#1C1C1E",
              border: focused ? "1.5px solid #3A3A3C" : "1.5px solid transparent",
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <input
              ref={inputRef}
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Email address"
              className="flex-1 bg-transparent text-[17px] text-white placeholder-[#4B5563] outline-none"
              style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
            />
          </div>
        </div>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Continue button ── */}
        <div className="px-6 pb-3 shrink-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
          <button
            onClick={handleContinue}
            disabled={!isValid}
            className="w-full h-[64px] rounded-[32px] text-[18px] font-bold transition-all duration-200 active:scale-[0.97]"
            style={{
              fontFamily: "var(--font-outfit), system-ui, sans-serif",
              background: isValid ? "#FFE500" : "#1C1C1E",
              color: isValid ? "#000000" : "#4B5563",
              cursor: isValid ? "pointer" : "not-allowed",
            }}
          >
            Continue
          </button>
        </div>
      </main>
    </>
  );
}
