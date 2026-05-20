"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerMerchant } from "@/services/merchant";

const CATEGORIES = [
  { value: "cafe", label: "კაფე" },
  { value: "restaurant", label: "რესტორანი" },
  { value: "grocery", label: "სასურსათო" },
  { value: "entertainment", label: "გართობა" },
  { value: "game_lounge", label: "გეიმ ლაუნჯი" },
  { value: "autoservice", label: "ავტოსერვისი" },
  { value: "other", label: "სხვა" },
];

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    business_name: "",
    business_name_ka: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    contact_person: "",
  });

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name.trim() || !form.phone.trim()) {
      setError("ბიზნესის სახელი და ტელეფონი სავალდებულოა");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await registerMerchant({
        business_name: form.business_name,
        business_name_ka: form.business_name_ka || undefined,
        category: form.category || "other",
        phone: form.phone,
        email: form.email || undefined,
        address: form.address || undefined,
        contact_person: form.contact_person || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "შეცდომა, სცადეთ თავიდან");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#1C1C1E] rounded-[10px] px-4 py-3.5 text-white placeholder-[#555] outline-none border border-[#2A2A2E] focus:border-[#FFD700]/50 transition-colors text-[14px]";

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "var(--font-dm-sans)" }}>
      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* Left side — branding (desktop only) */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative items-center justify-center" style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)" }}>
          <div className="max-w-[420px] px-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <img src="/images/shansi-logo.png" alt="Shansi" width={44} height={44} className="select-none" draggable={false} />
              <span className="text-[28px] font-extrabold text-white tracking-[-0.02em]" style={{ fontFamily: "var(--font-outfit)" }}>
                Shansi
              </span>
            </div>

            <h2
              className="text-[36px] xl:text-[42px] font-extrabold text-white leading-[1.15] mb-5"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              გახდი Shansi-ს<br />პარტნიორი
            </h2>
            <p className="text-[16px] leading-[1.7] mb-8" style={{ color: "#9CA3AF" }}>
              შემოუერთდი Shansi-ს პარტნიორთა ქსელს და მიიღე მეტი მომხმარებელი.
              შენი ბიზნესი გამოჩნდება ათასობით აქტიური მომხმარებლის წინაშე.
            </p>

            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <p className="text-[28px] font-bold" style={{ color: "#F9E741", fontFamily: "var(--font-outfit)" }}>1000+</p>
                <p className="text-[13px]" style={{ color: "#666" }}>აქტიური მომხმარებელი</p>
              </div>
              <div>
                <p className="text-[28px] font-bold" style={{ color: "#F9E741", fontFamily: "var(--font-outfit)" }}>50+</p>
                <p className="text-[13px]" style={{ color: "#666" }}>პარტნიორი ობიექტი</p>
              </div>
            </div>

            {/* Decorative accent */}
            <div className="absolute bottom-10 left-10 right-10 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(249,231,65,0.15), transparent)" }} />
          </div>
        </div>

        {/* Right side — form */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-6 lg:px-10 py-8 lg:py-0">
          <div className="w-full max-w-[480px]">

            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <img src="/images/shansi-logo.png" alt="Shansi" width={36} height={36} className="select-none" draggable={false} />
              <span className="text-[22px] font-extrabold text-white tracking-[-0.02em]" style={{ fontFamily: "var(--font-outfit)" }}>
                Shansi
              </span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[24px] lg:text-[28px] font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
                მერჩანტის რეგისტრაცია
              </h1>
              <p className="text-[14px]" style={{ color: "#999" }}>
                შეავსეთ ფორმა და გახდით Shansi-ს პარტნიორი
              </p>
            </div>

            {success ? (
              <div className="bg-[#1C1C1E] rounded-[16px] p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <p className="text-[#22C55E] text-lg font-semibold mb-2">განაცხადი მიღებულია</p>
                <p className="text-[#999] text-sm">მოიცადეთ დამტკიცებას</p>
                <button
                  onClick={() => router.push("/merchant/login")}
                  className="mt-6 w-full py-3.5 rounded-full bg-[#FFD700] text-black font-semibold text-sm hover:bg-[#FFD700]/90 active:scale-[0.98] transition-all"
                >
                  შესვლის გვერდზე გადასვლა
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 2-col grid on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-[#999] mb-1.5 font-medium">ბიზნესის სახელი *</label>
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={(e) => update("business_name", e.target.value)}
                      placeholder="My Business"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#999] mb-1.5 font-medium">ბიზნესის სახელი ქართულად</label>
                    <input
                      type="text"
                      value={form.business_name_ka}
                      onChange={(e) => update("business_name_ka", e.target.value)}
                      placeholder="ჩემი ბიზნესი"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-[#999] mb-1.5 font-medium">კატეგორია</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) => update("category", e.target.value)}
                        className={`${inputClass} appearance-none cursor-pointer`}
                      >
                        <option value="" className="bg-[#1C1C1E]">აირჩიეთ კატეგორია</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value} className="bg-[#1C1C1E]">{c.label}</option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><polyline points="3,5 7,9 11,5" /></svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#999] mb-1.5 font-medium">ტელეფონი *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="555 123 456"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-[#999] mb-1.5 font-medium">ელ-ფოსტა</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="info@business.ge"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#999] mb-1.5 font-medium">საკონტაქტო პირი</label>
                    <input
                      type="text"
                      value={form.contact_person}
                      onChange={(e) => update("contact_person", e.target.value)}
                      placeholder="სახელი გვარი"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] text-[#999] mb-1.5 font-medium">მისამართი</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="ქ. თბილისი, ..."
                    className={inputClass}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-[10px] py-2.5">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-[#FFD700] text-black font-semibold text-[15px] hover:bg-[#FFD700]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? "იგზავნება..." : "განაცხადის გაგზავნა"}
                </button>

                <p className="text-center text-sm text-[#999] pt-2">
                  უკვე გაქვთ ID?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/merchant/login")}
                    className="text-[#FFD700] hover:underline transition-all"
                  >
                    შესვლა
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
