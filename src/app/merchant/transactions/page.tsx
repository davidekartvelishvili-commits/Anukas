"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isMerchantAuthenticated,
  getMerchantTransactions,
} from "@/services/merchant";

export default function MerchantTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!isMerchantAuthenticated()) {
      router.push("/merchant/login");
      return;
    }
    loadTransactions(1);
  }, []);

  async function loadTransactions(p: number) {
    const isFirst = p === 1;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await getMerchantTransactions(p);
      const txs = res.transactions || [];
      if (isFirst) {
        setTransactions(txs);
      } else {
        setTransactions((prev) => [...prev, ...txs]);
      }
      setHasMore(txs.length >= 20);
      setPage(p);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

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
            ტრანზაქციები
          </h1>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 animate-pulse"
                style={{ background: "#1C1C1E", height: 72 }}
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              ტრანზაქციები ჯერ არ არის
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="flex items-center px-4 py-2 mb-1">
              <span className="flex-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                თანხა
              </span>
              <span className="w-20 text-xs font-medium text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                კომისია
              </span>
              <span className="w-28 text-xs font-medium text-right" style={{ color: "rgba(255,255,255,0.35)" }}>
                თარიღი
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {transactions.map((tx, i) => (
                <div
                  key={tx.id || i}
                  className="rounded-xl p-4 flex items-center transition-all duration-200"
                  style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex-1">
                    <p className="text-base font-semibold" style={{ color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}>
                      {(tx.amount ?? 0).toFixed(2)} ₾
                    </p>
                  </div>
                  <div className="w-20 text-center">
                    <p className="text-sm" style={{ color: "#F97316" }}>
                      {(tx.commission ?? 0).toFixed(2)} ₾
                    </p>
                  </div>
                  <div className="w-28 text-right">
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {tx.created_at
                        ? new Date(tx.created_at).toLocaleString("ka-GE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {tx.created_at
                        ? new Date(tx.created_at).toLocaleString("ka-GE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => loadTransactions(page + 1)}
                disabled={loadingMore}
                className="w-full mt-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "rgba(255,215,0,0.08)",
                  color: "#FFD700",
                  border: "1px solid rgba(255,215,0,0.2)",
                }}
              >
                {loadingMore ? "იტვირთება..." : "მეტის ჩატვირთვა"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <MerchantNav active="transactions" />
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
