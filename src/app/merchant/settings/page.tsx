"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isMerchantAuthenticated,
  getStoredMerchant,
  changePin,
  logoutMerchant,
} from "@/services/merchant";

export default function MerchantSettingsPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<any>(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isMerchantAuthenticated()) {
      router.push("/merchant/login");
      return;
    }
    setMerchant(getStoredMerchant());
  }, []);

  async function handleChangePin() {
    setPinMessage(null);
    if (!currentPin || !newPin || !confirmPin) {
      setPinMessage({ type: "error", text: "შეავსეთ ყველა ველი" });
      return;
    }
    if (newPin !== confirmPin) {
      setPinMessage({ type: "error", text: "ახალი PIN არ ემთხვევა" });
      return;
    }
    if (newPin.length < 4) {
      setPinMessage({ type: "error", text: "PIN მინიმუმ 4 ციფრი უნდა იყოს" });
      return;
    }
    setPinLoading(true);
    try {
      await changePin(currentPin, newPin);
      setPinMessage({ type: "success", text: "PIN წარმატებით შეიცვალა" });
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch (err: any) {
      setPinMessage({ type: "error", text: err.message || "PIN შეცვლა ვერ მოხერხდა" });
    } finally {
      setPinLoading(false);
    }
  }

  const infoRows = [
    { label: "სახელი", value: merchant?.business_name || merchant?.business_name_ka || "—" },
    { label: "ID", value: merchant?.merchant_code || merchant?.id || "—" },
    { label: "კატეგორია", value: merchant?.category || "—" },
    { label: "ტელეფონი", value: merchant?.phone || "—" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ background: "#000000", fontFamily: "var(--font-dm-sans)" }}
    >
      <div className="w-full max-w-[430px] mx-auto px-4 pt-6 pb-28">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
            მერჩანტ პორტალი
          </p>
          <h1
            className="text-2xl font-bold mt-1"
            style={{ fontFamily: "var(--font-outfit)", color: "#F1F5F9" }}
          >
            პარამეტრები
          </h1>
        </div>

        {/* Merchant Info */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)" }}>
            მერჩანტის ინფორმაცია
          </h3>
          <div className="flex flex-col gap-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {row.label}
                </span>
                <span className="text-sm font-medium" style={{ color: "#F1F5F9" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Change PIN */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-outfit)" }}>
            PIN-ის შეცვლა
          </h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.35)" }}>
                მიმდინარე PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-1"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "#F1F5F9",
                  border: "1px solid rgba(255,255,255,0.1)",
                  outline: "none",
                }}
                placeholder="****"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.35)" }}>
                ახალი PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-1"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "#F1F5F9",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                placeholder="****"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.35)" }}>
                PIN-ის დადასტურება
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-1"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "#F1F5F9",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                placeholder="****"
              />
            </div>

            {pinMessage && (
              <p
                className="text-sm"
                style={{ color: pinMessage.type === "success" ? "#22C55E" : "#EF4444" }}
              >
                {pinMessage.text}
              </p>
            )}

            <button
              onClick={handleChangePin}
              disabled={pinLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "#000",
                fontFamily: "var(--font-outfit)",
              }}
            >
              {pinLoading ? "იტვირთება..." : "შეცვლა"}
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => logoutMerchant()}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "#EF4444",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          გასვლა
        </button>
      </div>

      {/* Bottom Nav */}
      <MerchantNav active="settings" />
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
