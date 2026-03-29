"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // On mobile Safari autoFocus doesn't open keyboard —
  // so we make the phone input bar itself a big tap target

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  };

  const digits = phone.replace(/\D/g, "");
  const isValid = digits.length === 9;

  const handleContinue = () => {
    if (!isValid) return;
    router.push(`/auth/verify?phone=${digits}`);
  };

  return (
    <>
    <style>{`html, body { background: #000000 !important; }`}</style>
    <meta name="theme-color" content="#000000" />
    <main
      className="flex flex-col"
      style={{
        background: "#000000",
        minHeight: "100dvh",
        height: "100dvh",
      }}
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

      {/* ── Content — scrollable so keyboard doesn't cover it ── */}
      <div className="flex flex-col items-center px-6 pt-8 shrink-0">
        {/* Title */}
        <h1
          className="text-[32px] sm:text-[36px] font-bold text-white text-center leading-[1.15]"
          style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
        >
          Enter your<br />phone number
        </h1>

        {/* Subtitle */}
        <p
          className="text-[15px] text-[#9CA3AF] mt-3 text-center"
          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
        >
          Used to create your account
        </p>

        {/* Phone input — rounded pill shape */}
        <div
          className="w-full mt-8 flex items-center h-[60px] rounded-full px-6 gap-3 transition-all duration-200"
          style={{
            background: "#1C1C1E",
            border: focused ? "1.5px solid #3A3A3C" : "1.5px solid transparent",
          }}
          onClick={() => inputRef.current?.focus()}
        >
          <span className="text-[22px] leading-none select-none">🇬🇪</span>
          <span
            className="text-[17px] text-[#9CA3AF] font-medium shrink-0"
            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
          >
            +995
          </span>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={formatPhone(phone)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Phone number"
            className="flex-1 bg-transparent text-[17px] text-white placeholder-[#4B5563] outline-none"
            style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
          />
        </div>
      </div>

      {/* ── Terms + button — directly below input, not at bottom ── */}
      <div className="px-6 mt-auto pt-8 pb-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
        <p
          className="text-[13px] text-[#6B7280] text-center leading-[1.5] mb-4"
          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
        >
          By clicking Continue, you confirm that you are
          at least 18 years old and that you agree to our{" "}
          <span className="underline text-[#9CA3AF]">Terms of Service</span>{" "}
          and{" "}
          <span className="underline text-[#9CA3AF]">Privacy Policy</span>.
        </p>

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
