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
  const [activeSlide, setActiveSlide] = useState(0);
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

        {/* Left side — ad images slideshow (desktop only) */}
        <div
          className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative items-center justify-center cursor-pointer select-none"
          style={{ background: "#0A0A0A" }}
          onClick={() => setActiveSlide((prev) => (prev + 1) % 2)}
        >
          <div className="relative w-full h-full overflow-hidden">
            {["/images/merchant-ads/slide1.png", "/images/merchant-ads/slide2.png"].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out"
                style={{
                  opacity: activeSlide === i ? 1 : 0,
                }}
                draggable={false}
              />
            ))}
          </div>
          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1].map((i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveSlide(i); }}
                className="w-[8px] h-[8px] rounded-full transition-all duration-300"
                style={{ background: activeSlide === i ? "#F9E741" : "rgba(255,255,255,0.2)" }}
              />
            ))}
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
              <h1 className="text-[20px] lg:text-[24px] font-bold mb-2 leading-[1.3]" style={{ fontFamily: "var(--font-outfit)" }}>
                დაამატე ობიექტი ჩვენს პლატფორმაზე უფასოდ და გაზარდე ობიექტის ცნობადობა
              </h1>
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
