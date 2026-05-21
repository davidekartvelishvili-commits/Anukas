"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerMerchant, sendMerchantOtp } from "@/services/merchant";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

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
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpSending, setOtpSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [form, setForm] = useState({
    business_name: "",
    business_name_ka: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    contact_person: "",
  });

  // Auto-advance slideshow
  useEffect(() => {
    const iv = setInterval(() => setActiveSlide((p) => (p + 1) % 3), 5000);
    return () => clearInterval(iv);
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const iv = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [resendTimer]);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const validateForm = (): string | null => {
    if (!form.business_name.trim()) return "ბიზნესის სახელი სავალდებულოა";
    if (!form.business_name_ka.trim()) return "ქართული სახელი სავალდებულოა";
    if (!form.category) return "კატეგორია სავალდებულოა";
    if (!form.phone.trim()) return "ტელეფონი სავალდებულოა";
    if (!form.email.trim()) return "ელ-ფოსტა სავალდებულოა";
    if (!form.address.trim()) return "მისამართი სავალდებულოა";
    if (!form.contact_person.trim()) return "საკონტაქტო პირი სავალდებულოა";
    return null;
  };

  const handleNext = async () => {
    const err = validateForm();
    if (err) { setError(err); return; }

    setOtpSending(true);
    setError("");
    try {
      // Format phone
      let phone = form.phone.trim().replace(/\s/g, "");
      if (!phone.startsWith("+")) phone = "+995" + phone;
      setForm((prev) => ({ ...prev, phone }));

      await sendMerchantOtp(phone);
      setStep("otp");
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "კოდის გაგზავნა ვერ მოხერხდა");
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);
    setError("");

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (newCode.every((d) => d) && newCode.join("").length === 6) {
      submitRegistration(newCode.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      const newCode = text.split("");
      setOtpCode(newCode);
      otpRefs.current[5]?.focus();
      submitRegistration(text);
      e.preventDefault();
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpSending(true);
    try {
      await sendMerchantOtp(form.phone);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || "ვერ გაიგზავნა");
    } finally {
      setOtpSending(false);
    }
  };

  const submitRegistration = async (code: string) => {
    setLoading(true);
    setError("");
    try {
      await registerMerchant({
        business_name: form.business_name,
        business_name_ka: form.business_name_ka,
        category: form.category,
        phone: form.phone,
        email: form.email,
        address: form.address,
        contact_person: form.contact_person,
        otp_code: code,
      });
      setSuccess(true);
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "CompleteRegistration");
      }
    } catch (err: any) {
      setError(err.message || "შეცდომა, სცადეთ თავიდან");
      setOtpCode(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
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
            {["/images/merchant-ads/slide1.png", "/images/merchant-ads/slide2.png", "/images/merchant-ads/slide3.png"].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out"
                style={{ opacity: activeSlide === i ? 1 : 0 }}
                draggable={false}
              />
            ))}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveSlide(i); }}
                className="w-[8px] h-[8px] rounded-full transition-all duration-300"
                style={{ background: activeSlide === i ? "#F9E741" : "rgba(255,255,255,0.2)" }}
              />
            ))}
          </div>
        </div>

        {/* Right side — form or OTP */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-6 lg:px-10 py-8 lg:py-0">
          <div className="w-full max-w-[480px]">

            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <img src="/images/shansi-logo.png" alt="Shansi" width={36} height={36} className="select-none" draggable={false} />
              <span className="text-[22px] font-extrabold text-white tracking-[-0.02em]" style={{ fontFamily: "var(--font-outfit)" }}>
                Shansi
              </span>
            </div>

            {success ? (
              /* ── Success ── */
              <div className="bg-[#1C1C1E] rounded-[16px] p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <p className="text-[#22C55E] text-lg font-semibold mb-2">განაცხადი მიღებულია</p>
                <p className="text-[#999] text-sm">ნომერი დადასტურებულია. მოიცადეთ დამტკიცებას.</p>
                <button
                  onClick={() => router.push("/merchant/login")}
                  className="mt-6 w-full py-3.5 rounded-full bg-[#FFD700] text-black font-semibold text-sm hover:bg-[#FFD700]/90 active:scale-[0.98] transition-all"
                >
                  შესვლის გვერდზე გადასვლა
                </button>
              </div>

            ) : step === "otp" ? (
              /* ── OTP Step ── */
              <div>
                <button
                  onClick={() => { setStep("form"); setOtpCode(["", "", "", "", "", ""]); setError(""); }}
                  className="flex items-center gap-2 text-[#999] mb-6 active:opacity-60 transition-opacity"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 4l-6 6 6 6" /></svg>
                  <span className="text-sm">უკან</span>
                </button>

                <div className="mb-8">
                  <h1 className="text-[22px] font-bold mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
                    ნომრის დადასტურება
                  </h1>
                  <p className="text-[14px]" style={{ color: "#999" }}>
                    6-ნიშნა კოდი გაიგზავნა ნომერზე <span className="text-white font-medium">{form.phone}</span>
                  </p>
                </div>

                {/* OTP inputs */}
                <div className="flex gap-3 justify-center mb-6">
                  {otpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="w-[50px] h-[56px] text-center text-[22px] font-bold rounded-[12px] outline-none transition-colors"
                      style={{
                        background: "#1C1C1E",
                        color: "#FFF",
                        border: digit ? "2px solid #FFD700" : "2px solid #2A2A2E",
                      }}
                    />
                  ))}
                </div>

                {loading && (
                  <div className="flex justify-center mb-4">
                    <div className="w-6 h-6 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-[10px] py-2.5 mb-4">{error}</p>
                )}

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-[13px]" style={{ color: "#666" }}>
                      ხელახლა გაგზავნა {resendTimer} წმ-ში
                    </p>
                  ) : (
                    <button
                      onClick={resendOtp}
                      disabled={otpSending}
                      className="text-[13px] text-[#FFD700] hover:underline transition-all"
                    >
                      {otpSending ? "იგზავნება..." : "კოდის ხელახლა გაგზავნა"}
                    </button>
                  )}
                </div>
              </div>

            ) : (
              /* ── Form Step ── */
              <div>
                <div className="mb-8">
                  <h1 className="text-[20px] lg:text-[24px] font-bold mb-2 leading-[1.3]" style={{ fontFamily: "var(--font-outfit)" }}>
                    დაამატე ობიექტი უფასოდ, გაზარდე ცნობადობა
                  </h1>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] text-[#999] mb-1 font-medium">ბიზნესის სახელი *</label>
                      <p className="text-[11px] mb-1.5" style={{ color: "#555" }}>ამ სახელით გამოჩნდება შენი ბიზნესი პლატფორმაზე</p>
                      <input type="text" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} placeholder="My Business" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-[#999] mb-1 font-medium">ბიზნესის სახელი ქართულად *</label>
                      <p className="text-[11px] mb-1.5" style={{ color: "#555" }}>ქართულენოვანი მომხმარებლებისთვის ასე გამოჩნდება</p>
                      <input type="text" value={form.business_name_ka} onChange={(e) => update("business_name_ka", e.target.value)} placeholder="ჩემი ბიზნესი" className={inputClass} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] text-[#999] mb-1 font-medium">კატეგორია *</label>
                      <p className="text-[11px] mb-1.5" style={{ color: "#555" }}>აირჩიე რომელ კატეგორიას მიეკუთვნება შენი ობიექტი</p>
                      <div className="relative">
                        <select value={form.category} onChange={(e) => update("category", e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                          <option value="" className="bg-[#1C1C1E]">აირჩიეთ კატეგორია</option>
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value} className="bg-[#1C1C1E]">{c.label}</option>
                          ))}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><polyline points="3,5 7,9 11,5" /></svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] text-[#999] mb-1 font-medium">ტელეფონი *</label>
                      <p className="text-[11px] mb-1.5" style={{ color: "#555" }}>ამ ნომერზე გაიგზავნება დადასტურების კოდი</p>
                      <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="555 123 456" className={inputClass} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] text-[#999] mb-1 font-medium">ელ-ფოსტა *</label>
                      <p className="text-[11px] mb-1.5" style={{ color: "#555" }}>შეტყობინებები და ანგარიშები გამოგეგზავნება აქ</p>
                      <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="info@business.ge" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-[#999] mb-1 font-medium">საკონტაქტო პირი *</label>
                      <p className="text-[11px] mb-1.5" style={{ color: "#555" }}>ვის უნდა დავუკავშირდეთ საჭიროების შემთხვევაში</p>
                      <input type="text" value={form.contact_person} onChange={(e) => update("contact_person", e.target.value)} placeholder="სახელი გვარი" className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] text-[#999] mb-1 font-medium">მისამართი *</label>
                    <p className="text-[11px] mb-1.5" style={{ color: "#555" }}>ობიექტის ფიზიკური მისამართი, რომ მომხმარებლებმა გიპოვონ</p>
                    <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="ქ. თბილისი, ..." className={inputClass} />
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-[10px] py-2.5">{error}</p>
                  )}

                  <button
                    onClick={handleNext}
                    disabled={otpSending}
                    className="w-full py-3.5 rounded-full bg-[#FFD700] text-black font-semibold text-[15px] hover:bg-[#FFD700]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {otpSending ? "იგზავნება..." : "შემდეგი"}
                  </button>

                  <p className="text-center text-sm text-[#999] pt-2">
                    უკვე გაქვთ ID?{" "}
                    <button type="button" onClick={() => router.push("/merchant/login")} className="text-[#FFD700] hover:underline transition-all">
                      შესვლა
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
