"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isMerchantAuthenticated,
  getStoredMerchant,
  getMerchantStats,
  getMerchantTransactions,
} from "@/services/merchant";

export default function MerchantDashboardPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isMerchantAuthenticated()) {
      router.push("/merchant/login");
      return;
    }
    setMerchant(getStoredMerchant());
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, txRes] = await Promise.all([
        getMerchantStats(),
        getMerchantTransactions(1),
      ]);
      setStats(statsRes);
      setTransactions((txRes.transactions || []).slice(0, 10));
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: "დღის შემოსავალი",
      value: stats?.todayAmount ?? 0,
      suffix: "₾",
      color: "#FFD700",
    },
    {
      label: "სულ შემოსავალი",
      value: stats?.totalAmount ?? 0,
      suffix: "₾",
      color: "#22C55E",
    },
    {
      label: "სულ ტრანზაქციები",
      value: stats?.totalTransactions ?? 0,
      suffix: "",
      color: "#3B82F6",
    },
    {
      label: "კომისია",
      value: stats?.totalCommission ?? 0,
      suffix: "₾",
      color: "#F97316",
    },
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
            დეშბორდი
          </p>
          <h1
            className="text-2xl font-bold mt-1"
            style={{ fontFamily: "var(--font-outfit)", color: "#F1F5F9" }}
          >
            {merchant?.business_name || merchant?.business_name_ka || "მერჩანტი"}
          </h1>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 animate-pulse"
                style={{ background: "#1C1C1E", height: 100 }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl p-4 transition-all duration-200"
                style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {card.label}
                </p>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)", color: card.color }}>
                  {typeof card.value === "number" ? card.value.toFixed(card.suffix === "₾" ? 2 : 0) : card.value}
                  <span className="text-base font-medium ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {card.suffix}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Transactions */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-outfit)", color: "#F1F5F9" }}>
            ბოლო ტრანზაქციები
          </h2>
          <button
            onClick={() => router.push("/merchant/transactions")}
            className="text-xs font-medium transition-all duration-200"
            style={{ color: "#FFD700" }}
          >
            ყველა &rarr;
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 animate-pulse"
                style={{ background: "#1C1C1E", height: 60 }}
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              ტრანზაქციები ჯერ არ არის
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx, i) => (
              <div
                key={tx.id || i}
                className="rounded-xl p-4 flex items-center justify-between transition-all duration-200"
                style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F1F5F9" }}>
                    {(tx.amount ?? 0).toFixed(2)} ₾
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleString("ka-GE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "#F97316" }}>
                    კომისია: {(tx.commissionAmount ?? 0).toFixed(2)} ₾
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <MerchantNav active="dashboard" />
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
