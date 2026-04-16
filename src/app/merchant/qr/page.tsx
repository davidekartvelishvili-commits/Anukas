"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  isMerchantAuthenticated,
  getStoredMerchant,
  generateQR,
  getPaymentStatus,
} from "@/services/merchant";

export default function MerchantQRPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "completed">("idle");
  const [completedData, setCompletedData] = useState<any>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isMerchantAuthenticated()) {
      router.push("/merchant/login");
      return;
    }
    setMerchant(getStoredMerchant());
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("შეიყვანეთ თანხა");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await generateQR(numAmount);
      const qrData = res.qrData || res.qr_data || res.paymentUrl || JSON.stringify(res);
      const pid = res.paymentId || res.payment_id;

      const encodedData = encodeURIComponent(qrData);
      setQrImageUrl(
        `https://api.qrserver.com/v1/create-qr-code/?data=${encodedData}&size=300x300&bgcolor=1C1C1E&color=FFFFFF`
      );
      setPaymentId(pid);
      setStatus("pending");

      if (pid) {
        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await getPaymentStatus(pid);
            if (statusRes.status === "completed") {
              if (pollRef.current) clearInterval(pollRef.current);
              setStatus("completed");
              setCompletedData(statusRes);
            }
          } catch {
            // keep polling
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "QR გენერაცია ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }, [amount]);

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setAmount("");
    setQrImageUrl(null);
    setPaymentId(null);
    setStatus("idle");
    setCompletedData(null);
    setError("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ background: "#000000", fontFamily: "var(--font-dm-sans)" }}
    >
      <div className="w-full max-w-[430px] mx-auto px-4 pt-6 pb-28 flex flex-col items-center">
        {/* Header */}
        <div className="w-full mb-8">
          <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
            მერჩანტ პორტალი
          </p>
          <h1
            className="text-2xl font-bold mt-1"
            style={{ fontFamily: "var(--font-outfit)", color: "#F1F5F9" }}
          >
            {merchant?.business_name || merchant?.business_name_ka || "მერჩანტი"}
          </h1>
        </div>

        {/* Completed State */}
        {status === "completed" && (
          <div className="w-full flex flex-col items-center gap-6 animate-in fade-in">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.15)", border: "2px solid #22C55E" }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)", color: "#22C55E" }}>
                გადახდა მიღებულია!
              </p>
              <p className="text-lg mt-2" style={{ color: "#F1F5F9" }}>
                {amount} ₾
              </p>
              {completedData?.coins && (
                <p className="text-sm mt-1" style={{ color: "#FFD700" }}>
                  +{completedData.coins} coins
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "#000",
                fontFamily: "var(--font-outfit)",
              }}
            >
              ახალი გადახდა
            </button>
          </div>
        )}

        {/* Pending State — show QR */}
        {status === "pending" && qrImageUrl && (
          <div className="w-full flex flex-col items-center gap-6">
            <div
              className="p-4 rounded-2xl"
              style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <img
                src={qrImageUrl}
                alt="Payment QR Code"
                width={280}
                height={280}
                className="rounded-xl"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xl font-bold" style={{ fontFamily: "var(--font-outfit)", color: "#F1F5F9" }}>
                {amount} ₾
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#FFD700" }}
                />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  მოლოდინში...
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-sm underline transition-all duration-200"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              გაუქმება
            </button>
          </div>
        )}

        {/* Idle State — amount input */}
        {status === "idle" && (
          <div className="w-full flex flex-col items-center gap-6">
            <div
              className="w-full rounded-2xl p-6 flex flex-col items-center gap-4"
              style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                შეიყვანეთ თანხა
              </p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-center text-5xl font-bold outline-none w-full"
                  style={{
                    fontFamily: "var(--font-outfit)",
                    color: "#F1F5F9",
                    caretColor: "#FFD700",
                  }}
                />
              </div>
              <span className="text-2xl font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                ₾
              </span>
            </div>

            {error && (
              <p className="text-sm" style={{ color: "#EF4444" }}>
                {error}
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
              style={{
                background: loading
                  ? "rgba(255,215,0,0.3)"
                  : "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "#000",
                fontFamily: "var(--font-outfit)",
              }}
            >
              {loading ? "იტვირთება..." : "QR-ის გენერაცია"}
            </button>

            {/* Quick amounts */}
            <div className="flex gap-2 flex-wrap justify-center">
              {[5, 10, 20, 50, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
                  style={{
                    background: "rgba(255,215,0,0.08)",
                    color: "#FFD700",
                    border: "1px solid rgba(255,215,0,0.2)",
                  }}
                >
                  {v} ₾
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <MerchantNav active="qr" />
    </div>
  );
}

function MerchantNav({ active }: { active: string }) {
  const router = useRouter();
  const items = [
    {
      key: "qr",
      label: "QR",
      href: "/merchant/qr",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="3" height="3" />
          <line x1="21" y1="14" x2="21" y2="14.01" />
          <line x1="21" y1="21" x2="21" y2="21.01" />
          <line x1="17" y1="21" x2="17" y2="21.01" />
        </svg>
      ),
    },
    {
      key: "tickets",
      label: "ტიკეტი",
      href: "/merchant/scan-ticket",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7h20v4a2 2 0 000 4v4H2v-4a2 2 0 000-4V7z" />
          <line x1="10" y1="7" x2="10" y2="19" strokeDasharray="1 2" />
        </svg>
      ),
    },
    {
      key: "transactions",
      label: "ტრანზაქციები",
      href: "/merchant/transactions",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      key: "settings",
      label: "პარამეტრები",
      href: "/merchant/settings",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div
        className="flex items-center px-2 py-1.5 rounded-full gap-0"
        style={{
          background: "rgba(50,50,50,0.85)",
          backdropFilter: "blur(20px)",
          border: "0.5px solid rgba(255,255,255,0.15)",
        }}
      >
        {items.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center px-5 py-1.5 rounded-full transition-all duration-200"
              style={{
                color: isActive ? "#FFD700" : "rgba(255,255,255,0.4)",
                background: isActive ? "rgba(255,215,0,0.1)" : "transparent",
              }}
            >
              {item.icon}
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
