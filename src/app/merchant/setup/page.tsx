"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setupPin } from "@/services/merchant";

export default function MerchantSetupPage() {
  const router = useRouter();
  const [merchantCode, setMerchantCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantCode.trim()) {
      setError("შეიყვანეთ მერჩანტის ID");
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN უნდა იყოს 4 ციფრი");
      return;
    }
    if (pin !== confirmPin) {
      setError("PIN-ები არ ემთხვევა");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await setupPin(merchantCode.toUpperCase(), pin);
      setSuccess(true);
      setTimeout(() => {
        router.push("/merchant/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "შეცდომა, სცადეთ თავიდან");
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
            PIN-ის დაყენება
          </h1>
        </div>

        {/* Success toast */}
        {success && (
          <div className="mb-6 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-[12px] px-4 py-3 text-center">
            <p className="text-[#22C55E] text-sm font-medium">PIN დაყენებულია, შედით სისტემაში</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Merchant ID */}
          <div>
            <label className="block text-sm text-[#999] mb-1.5">მერჩანტის ID</label>
            <input
              type="text"
              value={merchantCode}
              onChange={(e) => {
                setMerchantCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="SH-00001"
              className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white placeholder-[#555] outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors tracking-wider font-mono"
            />
          </div>

          {/* New PIN */}
          <div>
            <label className="block text-sm text-[#999] mb-1.5">ახალი PIN</label>
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

          {/* Confirm PIN */}
          <div>
            <label className="block text-sm text-[#999] mb-1.5">PIN-ის დადასტურება</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setConfirmPin(val);
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
            disabled={loading || success}
            className="w-full py-3.5 rounded-full bg-[#FFD700] text-black font-semibold text-sm hover:bg-[#FFD700]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "მუშავდება..." : "დაყენება"}
          </button>

          {/* Link */}
          <p className="text-center text-sm text-[#999] pt-2">
            უკვე გაქვთ PIN?{" "}
            <button
              type="button"
              onClick={() => router.push("/merchant/login")}
              className="text-[#FFD700] hover:underline transition-all"
            >
              შესვლა
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
