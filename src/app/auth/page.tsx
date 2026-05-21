"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { sendOtp, pinLogin, checkPhone, verifyBiometric } from "@/services/auth";
import { useTranslation } from "@/context/LanguageContext";

function AuthContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const isLogin = searchParams.get("mode") === "login";
  const isPinMode = searchParams.get("pin") === "true";
  const prefillPhone = searchParams.get("phone") || "";
  const msgParam = searchParams.get("msg");
  const [phone, setPhone] = useState(prefillPhone);
  const [showPinLogin, setShowPinLogin] = useState(isPinMode && !!prefillPhone);
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [infoMsg, setInfoMsg] = useState(msgParam === "registered" ? t("auth.alreadyRegistered") : "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Face ID state
  const [showFaceId, setShowFaceId] = useState(false);
  const [faceAttempts, setFaceAttempts] = useState(0);
  const [faceScanning, setFaceScanning] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const pinRef = useRef<HTMLInputElement>(null);

  // Track auth page view
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const params = new URLSearchParams(window.location.search);
    fetch(`${API}/public/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "/auth",
        referrer: document.referrer || null,
        utm_source: params.get("utm_source") || null,
        utm_medium: params.get("utm_medium") || null,
        utm_campaign: params.get("utm_campaign") || null,
        screenWidth: window.innerWidth,
      }),
    }).catch(() => {});
  }, []);

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

  const handleContinue = async () => {
    if (!isValid || sending) return;
    setSending(true);
    setSendError("");
    setInfoMsg("");
    try {
      // Always check if user exists and has PIN
      const check = await checkPhone(digits);
      if (check.exists && check.hasPin) {
        // User has PIN — go straight to PIN login, no OTP needed
        setSending(false);
        setShowPinLogin(true);
        return;
      }
      if (isLogin && !check.exists) {
        setSendError(t("auth.accountNotFound"));
        setSending(false);
        return;
      }
      await sendOtp(digits);
      router.push(`/auth/verify?phone=${digits}${isLogin ? "&mode=login" : ""}`);
    } catch (err: any) {
      setSendError(err.message || "Failed");
    } finally {
      setSending(false);
    }
  };

  const handleFaceScan = () => {
    setFaceScanning(true);
    // Simulate face scan (always fails for demo — 3 attempts then PIN)
    setTimeout(() => {
      setFaceScanning(false);
      const newAttempts = faceAttempts + 1;
      setFaceAttempts(newAttempts);
      if (newAttempts >= 3) {
        setShowFaceId(false);
        setShowPin(true);
        setTimeout(() => pinRef.current?.focus(), 100);
      }
    }, 2000);
  };

  const handlePinSubmit = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPinInput(clean);
    setPinError("");
    if (clean.length === 6) {
      try {
        await pinLogin(phone || prefillPhone, clean);
        const cb = localStorage.getItem("auth_callback_url");
        localStorage.removeItem("auth_callback_url");
        router.push(cb || "/home");
      } catch (err: any) {
        setPinError(err.message || "Invalid PIN");
        setPinInput("");
      }
    }
  };

  // Show PIN login screen directly if pin mode
  if (showPinLogin) {
    return (
      <>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "#000000" }}>
        <button
          onClick={() => setShowPinLogin(false)}
          className="absolute top-0 left-0 p-4 active:opacity-50"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 5L8 11l6 6" />
          </svg>
        </button>

        <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-6" style={{ background: "#1C1C1E" }}>
          <svg width="36" height="36" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="10" width="12" height="9" rx="2" />
            <path d="M8 10V7a3 3 0 016 0v3" />
            <circle cx="11" cy="15" r="1" fill="#FFF" />
          </svg>
        </div>

        <h2 className="text-white text-[22px] font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
          {t("auth.enterPin")}
        </h2>
        <p className="text-[#6B7280] text-[14px] mb-8" style={{ fontFamily: "var(--font-dm-sans)" }}>
          {t("auth.enterPinDesc")}
        </p>

        <div className="flex gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[16px] h-[16px] rounded-full transition-all duration-200"
              style={{ background: i < pinInput.length ? "#FFE500" : "transparent", border: i < pinInput.length ? "2px solid #FFE500" : "2px solid #2A2A2A" }}
            />
          ))}
        </div>

        {pinError && (
          <p className="text-[#EF4444] text-[13px] font-medium mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>{pinError}</p>
        )}

        <input
          ref={pinRef}
          type="number"
          value={pinInput}
          onChange={(e) => handlePinSubmit(e.target.value)}
          className="absolute opacity-0 w-0 h-0"
          inputMode="numeric"
          autoFocus
        />

        <button onClick={() => pinRef.current?.focus()} className="text-[13px] text-[#6B7280] mb-8" style={{ fontFamily: "var(--font-dm-sans)" }}>
          {t("auth.tapToEnterPin")}
        </button>

        <button
          onClick={() => setShowPinLogin(false)}
          className="text-[14px] font-semibold active:opacity-50"
          style={{ color: "#9CA3AF", fontFamily: "var(--font-outfit)" }}
        >
          {t("auth.usePhoneInstead")}
        </button>
      </div>
      </>
    );
  }

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
          {isLogin ? t("auth.logIn") : t("auth.createAccount")}
        </span>
      </div>

      {/* ── Content — scrollable so keyboard doesn't cover it ── */}
      <div className="flex flex-col items-center px-6 pt-8 shrink-0">
        {/* Title */}
        <h1
          className="text-[32px] sm:text-[36px] font-bold text-white text-center leading-[1.15]"
          style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
        >
          {t("auth.enterPhone")}
        </h1>

        {/* Subtitle */}
        <p
          className="text-[15px] text-[#9CA3AF] mt-3 text-center"
          style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
        >
          {isLogin ? t("auth.enterPhoneToLogin") : t("auth.usedToCreate")}
        </p>

        {/* Info message (e.g. already registered) */}
        {infoMsg && (
          <p className="text-[#F97316] text-[13px] text-center mt-3 font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
            {infoMsg}
          </p>
        )}

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
            placeholder={t("auth.phoneNumber")}
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
          {t("auth.termsText")}{" "}
          <span className="underline text-[#9CA3AF]">{t("auth.termsOfService")}</span>{" "}
          {t("auth.and")}{" "}
          <span className="underline text-[#9CA3AF]">{t("auth.privacyPolicy")}</span>.
        </p>

        {sendError && (
          <p className="text-[#EF4444] text-[13px] text-center mb-2" style={{ fontFamily: "var(--font-dm-sans)" }}>{sendError}</p>
        )}

        <button
          onClick={handleContinue}
          disabled={!isValid || sending}
          className="w-full h-[64px] rounded-[32px] text-[18px] font-bold transition-all duration-200 active:scale-[0.97]"
          style={{
            fontFamily: "var(--font-outfit), system-ui, sans-serif",
            background: isValid && !sending ? "#FFE500" : "#1C1C1E",
            color: isValid && !sending ? "#000000" : "#4B5563",
            cursor: isValid && !sending ? "pointer" : "not-allowed",
          }}
        >
          {sending ? t("auth.sending") : t("auth.continue")}
        </button>

      </div>

      {/* ── Face ID Scanning Overlay ── */}
      {showFaceId && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "#000000" }}>
          <button
            onClick={() => { setShowFaceId(false); setFaceAttempts(0); }}
            className="absolute top-0 left-0 p-4 active:opacity-50"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 5L8 11l6 6" />
            </svg>
          </button>

          {/* Face scan animation */}
          <div className="relative w-[160px] h-[160px] mb-8">
            <div className="absolute inset-0 rounded-[32px]" style={{ border: faceScanning ? "2px solid #FFE500" : "2px solid #2A2A2A" }} />
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-[30px] h-[3px] rounded-full" style={{ background: faceScanning ? "#FFE500" : "#FFF" }} />
            <div className="absolute top-0 left-0 w-[3px] h-[30px] rounded-full" style={{ background: faceScanning ? "#FFE500" : "#FFF" }} />
            <div className="absolute top-0 right-0 w-[30px] h-[3px] rounded-full" style={{ background: faceScanning ? "#FFE500" : "#FFF" }} />
            <div className="absolute top-0 right-0 w-[3px] h-[30px] rounded-full" style={{ background: faceScanning ? "#FFE500" : "#FFF" }} />
            <div className="absolute bottom-0 left-0 w-[30px] h-[3px] rounded-full" style={{ background: faceScanning ? "#FFE500" : "#FFF" }} />
            <div className="absolute bottom-0 left-0 w-[3px] h-[30px] rounded-full" style={{ background: faceScanning ? "#FFE500" : "#FFF" }} />
            <div className="absolute bottom-0 right-0 w-[30px] h-[3px] rounded-full" style={{ background: faceScanning ? "#FFE500" : "#FFF" }} />
            <div className="absolute bottom-0 right-0 w-[3px] h-[30px] rounded-full" style={{ background: faceScanning ? "#FFE500" : "#FFF" }} />
            {/* Face icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={faceScanning ? "#FFE500" : "#666"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <circle cx="9" cy="10" r="1" fill={faceScanning ? "#FFE500" : "#666"} />
                <circle cx="15" cy="10" r="1" fill={faceScanning ? "#FFE500" : "#666"} />
                <path d="M9 15c.7 1 2 1.5 3 1.5s2.3-.5 3-1.5" />
              </svg>
            </div>
            {/* Scanning line */}
            {faceScanning && (
              <div className="absolute left-[10px] right-[10px] h-[2px] rounded-full" style={{ background: "#FFE500", boxShadow: "0 0 10px #FFE500", animation: "scanFace 1.5s ease-in-out infinite" }} />
            )}
          </div>

          <h2 className="text-white text-[22px] font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
            {faceScanning ? t("auth.scanning") : t("auth.faceNotRecognized")}
          </h2>
          <p className="text-[#6B7280] text-[14px] mb-6" style={{ fontFamily: "var(--font-dm-sans)" }}>
            {faceScanning ? t("auth.holdFace") : t("auth.attempt").replace("{current}", String(faceAttempts))}
          </p>

          {!faceScanning && faceAttempts < 3 && (
            <button
              onClick={handleFaceScan}
              className="px-10 py-4 rounded-[32px] text-[16px] font-bold active:scale-[0.97] transition-transform"
              style={{ background: "#FFE500", color: "#000", fontFamily: "var(--font-outfit)" }}
            >
              {t("auth.tryAgain")}
            </button>
          )}

          <style>{`
            @keyframes scanFace {
              0% { top: 10px; }
              50% { top: 140px; }
              100% { top: 10px; }
            }
          `}</style>
        </div>
      )}

      {/* ── PIN Login Overlay ── */}
      {showPin && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "#000000" }}>
          <button
            onClick={() => { setShowPin(false); setPinInput(""); setPinError(""); }}
            className="absolute top-0 left-0 p-4 active:opacity-50"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 5L8 11l6 6" />
            </svg>
          </button>

          {/* Lock icon */}
          <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-6" style={{ background: "#1C1C1E" }}>
            <svg width="36" height="36" viewBox="0 0 22 22" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="10" width="12" height="9" rx="2" />
              <path d="M8 10V7a3 3 0 016 0v3" />
              <circle cx="11" cy="15" r="1" fill="#FFF" />
            </svg>
          </div>

          <h2 className="text-white text-[22px] font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
            {t("auth.enterPin")}
          </h2>
          <p className="text-[#6B7280] text-[14px] mb-8" style={{ fontFamily: "var(--font-dm-sans)" }}>
            {t("auth.faceIdFailed")}
          </p>

          {/* PIN dots */}
          <div className="flex gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[16px] h-[16px] rounded-full transition-all duration-200"
                style={{
                  background: i < pinInput.length ? "#FFE500" : "transparent",
                  border: i < pinInput.length ? "2px solid #FFE500" : "2px solid #2A2A2A",
                }}
              />
            ))}
          </div>

          {pinError && (
            <p className="text-[#EF4444] text-[13px] font-medium mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>{pinError}</p>
          )}

          {/* Hidden input */}
          <input
            ref={pinRef}
            type="number"
            value={pinInput}
            onChange={(e) => handlePinSubmit(e.target.value)}
            className="absolute opacity-0 w-0 h-0"
            inputMode="numeric"
            autoFocus
          />

          <button
            onClick={() => pinRef.current?.focus()}
            className="text-[13px] text-[#6B7280]"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            {t("auth.tapToEnterPin")}
          </button>
        </div>
      )}
    </main>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-black" />}>
      <AuthContent />
    </Suspense>
  );
}
