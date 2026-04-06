"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginMerchant } from "@/services/merchant";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [merchantCode, setMerchantCode] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantCode.trim() || !pin.trim()) {
      setError("შეავსეთ ყველა ველი");
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN უნდა იყოს 4 ციფრი");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await loginMerchant(merchantCode.trim(), pin);
      router.push("/merchant/qr");
    } catch (err: any) {
      setError(err.message || "შესვლა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "var(--font-dm-sans)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#999] mb-6 active:opacity-60 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-6 6 6 6" /></svg>
          <span className="text-sm">უკან</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-[#FFD700]/10 flex items-center justify-center">
            <span/>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
            მერჩანტის შესვლა
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Merchant ID */}
          <div>
            <label className="block text-sm text-[#999] mb-1.5">{"\u10E2\u10D4\u10DA\u10D4\u10E4\u10DD\u10DC\u10D8 \u10D0\u10DC \u10DB\u10D4\u10E0\u10E9\u10D0\u10DC\u10E2 ID"}</label>
            <input
              type="text"
              value={merchantCode}
              onChange={(e) => {
                setMerchantCode(e.target.value);
                setError("");
              }}
              placeholder="SH-00001 ან 5XXXXXXXX"
              className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white placeholder-[#555] outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm text-[#999] mb-1.5">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(val);
                setError("");
              }}
              placeholder="••••"
              className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white placeholder-[#555] outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors tracking-[0.5em] text-center text-lg"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-[8px] py-2">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#FFD700] text-black font-semibold text-sm hover:bg-[#FFD700]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "შესვლა..." : "შესვლა"}
          </button>

          {/* Links */}
          <div className="space-y-3 pt-2 text-center text-sm">
            <p className="text-[#999]">
              პირველად ხართ?{" "}
              <button
                type="button"
                onClick={() => router.push("/merchant/setup")}
                className="text-[#FFD700] hover:underline transition-all"
              >
                PIN-ის დაყენება
              </button>
            </p>
            <p className="text-[#999]">
              არ გაქვთ ანგარიში?{" "}
              <button
                type="button"
                onClick={() => router.push("/merchant/register")}
                className="text-[#FFD700] hover:underline transition-all"
              >
                რეგისტრაცია
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
