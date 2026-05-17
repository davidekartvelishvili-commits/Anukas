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
            მერჩანტის რეგისტრაცია
          </h1>
        </div>

        {success ? (
          <div className="bg-[#1C1C1E] rounded-[16px] p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <p className="text-[#22C55E] text-lg font-semibold mb-2">განაცხადი მიღებულია</p>
            <p className="text-[#999] text-sm">მოიცადეთ დამტკიცებას</p>
            <button
              onClick={() => router.push("/merchant/login")}
              className="mt-6 w-full py-3 rounded-full bg-[#FFD700] text-black font-semibold text-sm hover:bg-[#FFD700]/90 active:scale-[0.98] transition-all"
            >
              შესვლის გვერდზე გადასვლა
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business Name */}
            <div>
              <label className="block text-sm text-[#999] mb-1.5">ბიზნესის სახელი *</label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => update("business_name", e.target.value)}
                placeholder="My Business"
                className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white placeholder-[#555] outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors"
              />
            </div>

            {/* Business Name Georgian */}
            <div>
              <label className="block text-sm text-[#999] mb-1.5">ბიზნესის სახელი ქართულად</label>
              <input
                type="text"
                value={form.business_name_ka}
                onChange={(e) => update("business_name_ka", e.target.value)}
                placeholder="ჩემი ბიზნესი"
                className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white placeholder-[#555] outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm text-[#999] mb-1.5">კატეგორია</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1C1C1E]">აირჩიეთ კატეგორია</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} className="bg-[#1C1C1E]">{c.label}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><polyline points="3,5 7,9 11,5" /></svg>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-[#999] mb-1.5">ტელეფონი *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="555 123 456"
                className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white placeholder-[#555] outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-[#999] mb-1.5">ელ-ფოსტა</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="info@business.ge"
                className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white placeholder-[#555] outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm text-[#999] mb-1.5">მისამართი</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="ქ. თბილისი, ..."
                className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white placeholder-[#555] outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm text-[#999] mb-1.5">საკონტაქტო პირი</label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => update("contact_person", e.target.value)}
                placeholder="სახელი გვარი"
                className="w-full bg-[#1C1C1E] rounded-[8px] px-4 py-3 text-white placeholder-[#555] outline-none border border-transparent focus:border-[#FFD700]/50 transition-colors"
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
              {loading ? "იგზავნება..." : "განაცხადის გაგზავნა"}
            </button>

            {/* Link to login */}
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
  );
}
