"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [gender, setGender] = useState("Male");

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
    <>
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
            <div
              className="flex items-center gap-3 px-5 py-4 rounded-full mb-4"
              style={{ background: "#1C1C1E" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="7" r="4" />
                <path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" />
              </svg>
              <span
                className="text-[#999] text-[16px]"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Cashback User
              </span>
            </div>

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

          {/* ── Referral Code ── */}
          <div style={stagger(4)}>
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
    </>
  );
}
