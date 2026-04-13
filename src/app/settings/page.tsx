"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/services/auth";
import AuthGuard from "@/components/AuthGuard";

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [gender, setGender] = useState("Male");
  const [username, setUsername] = useState("Cashback_User");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [lastNameChange, setLastNameChange] = useState(0);

  // Mock taken usernames
  const TAKEN = ["cool_user", "gamer_pro", "david_k", "ana_m", "nino_j", "backapp_fan"];

  const validateUsername = (val: string) => {
    if (val.length < 3) return "Minimum 3 characters";
    if (val.length > 20) return "Maximum 20 characters";
    if (/\s/.test(val)) return "No spaces allowed";
    if (!/^[a-zA-Z0-9_-]+$/.test(val)) return "Only letters, numbers, _ and -";
    if (TAKEN.includes(val.toLowerCase())) {
      setNameSuggestions([
        val + "_" + Math.floor(Math.random() * 99),
        val + "-" + Math.floor(Math.random() * 999),
        val + "_backapp",
      ]);
      return "Username is taken";
    }
    setNameSuggestions([]);
    return "";
  };

  const canChangeName = () => {
    const now = Date.now();
    return now - lastNameChange > 24 * 60 * 60 * 1000;
  };

  useEffect(() => {
    const saved = localStorage.getItem("user-gender");
    if (saved) setGender(saved);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleGender = (g: string) => {
    setGender(g);
    localStorage.setItem("user-gender", g);
  };

  const avatarSrc = gender === "Female" ? "/images/profile-avatar-female.png" : gender === "Other" ? "/images/profile-avatar-other.png" : "/images/profile-avatar.png";

  const stagger = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.5s ease-out ${i * 0.08}s`,
  });

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
          <div className="flex items-center justify-center relative mb-6" style={stagger(0)}>
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
              Settings
            </h1>
          </div>

          {/* ── Avatar ── */}
          <div className="flex justify-center mb-8" style={stagger(1)}>
            <div className="relative">
              <div
                className="w-[160px] h-[160px] rounded-full overflow-hidden"
                style={{ background: "linear-gradient(135deg, #C4E0F9, #E8D5F5)" }}
              >
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                className="absolute bottom-1 right-1 w-[40px] h-[40px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform bg-white"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6.5 3.5h7l1.5 2H18a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1v-9a1 1 0 011-1h3z" />
                  <circle cx="10" cy="10.5" r="3.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── My Info ── */}
          <div style={stagger(2)}>
            <h2
              className="text-white text-[20px] font-bold mb-4"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              My Info
            </h2>

            {/* Gender selector */}
            <div
              className="flex items-center rounded-full p-1 mb-4"
              style={{ background: "#1C1C1E" }}
            >
              {["Male", "Female", "Other"].map((g) => (
                <button
                  key={g}
                  onClick={() => handleGender(g)}
                  className="flex-1 py-3 rounded-full text-center transition-all duration-200"
                  style={{ background: gender === g ? "#FFFFFF" : "transparent" }}
                >
                  <span
                    className={`text-[15px] font-semibold ${gender === g ? "text-black" : "text-[#888]"}`}
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {g}
                  </span>
                </button>
              ))}
            </div>

            {/* Username field */}
            {!editingName ? (
              <button
                onClick={() => {
                  if (!canChangeName()) {
                    setNameError("You can change username once per 24 hours");
                    setTimeout(() => setNameError(""), 3000);
                    return;
                  }
                  setEditingName(true);
                  setNameInput(username);
                  setNameError("");
                  setNameSuggestions([]);
                }}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-full mb-4 active:scale-[0.98] transition-transform"
                style={{ background: "#1C1C1E" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="7" r="4" />
                  <path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" />
                </svg>
                <span className="flex-1 text-[#999] text-[16px] text-left" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  {username}
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" />
                </svg>
              </button>
            ) : (
              <div className="mb-4">
                <div className="flex items-center gap-3 px-5 py-3 rounded-full mb-2" style={{ background: "#1C1C1E", border: nameError && nameError !== "Username is taken" ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.15)" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="7" r="4" />
                    <path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" />
                  </svg>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s/g, "").slice(0, 20);
                      setNameInput(v);
                      setNameError(v.length > 0 ? validateUsername(v) : "");
                    }}
                    className="flex-1 bg-transparent text-white text-[16px] outline-none"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                    placeholder="Username"
                    autoFocus
                    maxLength={20}
                  />
                  <span className="text-[11px] text-[#666]" style={{ fontFamily: "var(--font-dm-sans)" }}>{nameInput.length}/20</span>
                </div>

                {/* Error */}
                {nameError && (
                  <p className="text-[12px] font-medium px-5 mb-1" style={{ color: "#EF4444", fontFamily: "var(--font-dm-sans)" }}>
                    {nameError}
                  </p>
                )}

                {/* Suggestions */}
                {nameSuggestions.length > 0 && (
                  <div className="px-5 mb-2">
                    <p className="text-[11px] text-[#666] mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>Try these:</p>
                    <div className="flex flex-wrap gap-2">
                      {nameSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setNameInput(s); setNameError(validateUsername(s)); }}
                          className="px-3 py-1 rounded-full text-[12px] font-medium active:scale-[0.95] transition-transform"
                          style={{ background: "rgba(255,255,255,0.08)", color: "#999", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "var(--font-dm-sans)" }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 px-2">
                  <button
                    onClick={() => {
                      const err = validateUsername(nameInput);
                      if (err) { setNameError(err); return; }
                      setShowConfirmSave(true);
                    }}
                    disabled={!nameInput || nameInput.length < 3 || !!nameError}
                    className="flex-1 py-3 rounded-full text-[13px] font-bold transition-all active:scale-[0.97] disabled:opacity-30"
                    style={{ background: "#F9E741", color: "#000", fontFamily: "var(--font-outfit)" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameError(""); setNameSuggestions([]); }}
                    className="flex-1 py-3 rounded-full text-[13px] font-bold"
                    style={{ background: "#1C1C1E", color: "#999", fontFamily: "var(--font-outfit)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Name change cooldown error (outside edit mode) */}
            {!editingName && nameError && (
              <p className="text-[12px] font-medium px-5 -mt-3 mb-3" style={{ color: "#EF4444", fontFamily: "var(--font-dm-sans)" }}>
                {nameError}
              </p>
            )}

            {/* Phone field */}
            <div
              className="flex items-center gap-3 px-5 py-4 rounded-full mb-4"
              style={{ background: "#1C1C1E" }}
            >
              <span className="text-[18px]">🇬🇪</span>
              <span
                className="text-[#999] text-[16px]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                +995 5XX XXX XXX
              </span>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="h-[0.5px] my-6" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* ── Audio Settings ── */}
          <div style={stagger(3)}>
            <button
              onClick={() => router.push("/audio-settings")}
              className="w-full flex items-center justify-between py-4 active:opacity-70 transition-opacity"
            >
              <div>
                <h3
                  className="text-white text-[18px] font-bold text-left"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  Audio Settings
                </h3>
                <p
                  className="text-[#888] text-[14px] text-left mt-0.5"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Manage SFX and music settings
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4l6 6-6 6" />
              </svg>
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="h-[0.5px] my-2" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* ── Security & Easy Access ── */}
          <div style={stagger(4)}>
            <button
              onClick={() => router.push("/security")}
              className="w-full flex items-center justify-between py-4 active:opacity-70 transition-opacity"
            >
              <div>
                <h3
                  className="text-white text-[18px] font-bold text-left"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  Security & Easy Access
                </h3>
                <p
                  className="text-[#888] text-[14px] text-left mt-0.5"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Face recognition and PIN settings
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4l6 6-6 6" />
              </svg>
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="h-[0.5px] my-2" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* ── Referral Code ── */}
          <div style={stagger(5)}>
            <button
              onClick={() => router.push("/referral-code")}
              className="w-full flex items-center justify-between py-4 active:opacity-70 transition-opacity"
            >
              <div>
                <h3
                  className="text-white text-[18px] font-bold text-left"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  Referral Code
                </h3>
                <p
                  className="text-[#888] text-[14px] text-left mt-0.5"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  If a friend invited you, enter code here
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4l6 6-6 6" />
              </svg>
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="h-[0.5px] my-2" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* ── Log Out ── */}
          <div style={stagger(5)}>
            <button
              onClick={async () => { await logout(); router.push("/"); }}
              className="w-full flex items-center justify-between py-4 active:opacity-70 transition-opacity"
            >
              <h3
                className="text-[#EF4444] text-[18px] font-bold"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Log Out
              </h3>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* ── Confirm Username Save Modal ── */}
      {showConfirmSave && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setShowConfirmSave(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative rounded-[20px] px-7 py-7 flex flex-col items-center max-w-[320px] w-full"
            style={{
              background: "rgba(60, 60, 60, 0.12)",
              backdropFilter: "blur(8px) saturate(180%)",
              WebkitBackdropFilter: "blur(8px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
              <path d="M10 2L1 18h18L10 2z" /><line x1="10" y1="8" x2="10" y2="12" /><circle cx="10" cy="15" r="0.5" fill="#F97316" />
            </svg>
            <h3 className="text-white text-[17px] font-bold text-center mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
              Are you sure?
            </h3>
            <p className="text-[#999] text-[13px] text-center mb-5 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
              You will not be able to change your username for the next <span className="text-white font-bold">24 hours</span>
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  setUsername(nameInput);
                  setLastNameChange(Date.now());
                  setEditingName(false);
                  setShowConfirmSave(false);
                  setNameError("");
                  setNameSuggestions([]);
                }}
                className="flex-1 py-3 rounded-full text-[13px] font-bold active:scale-[0.97] transition-transform"
                style={{ background: "#F9E741", color: "#000", fontFamily: "var(--font-outfit)" }}
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmSave(false)}
                className="flex-1 py-3 rounded-full text-[13px] font-bold"
                style={{ background: "rgba(255,255,255,0.08)", color: "#999", fontFamily: "var(--font-outfit)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
