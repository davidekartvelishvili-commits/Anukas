"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BackHeader from "@/components/BackHeader";
import BottomNav from "@/components/BottomNav";

/* ───────── SVG ICONS ───────── */

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v10M5 8l4 4 4-4" />
      <path d="M2 13v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M2 6.5h12" />
      <path d="M5.5 1.5v2M10.5 1.5v2" />
    </svg>
  );
}

function ChevronDownIcon({ color = "#64748B", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 5.5l3.5 3.5 3.5-3.5" />
    </svg>
  );
}

function TrendingUpIcon({ color = "#00E88F" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12l4-4 3 3 5-5" />
      <path d="M10 6h4v4" />
    </svg>
  );
}

function CrownIcon({ color = "#FFD700" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 13l2-7 4 3 1-7 1 7 4-3 2 7H2z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3 14h12v1.5a1 1 0 01-1 1H4a1 1 0 01-1-1V14z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

function EmptyClockIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#1C2539" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="32" cy="32" r="24" />
      <path d="M32 18v14l8 8" />
    </svg>
  );
}

function WalletSmallIcon({ color = "#00E88F" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="4" width="13" height="10" rx="1.5" />
      <path d="M1.5 7h13" />
      <circle cx="12" cy="10" r="0.8" fill={color} stroke="none" />
    </svg>
  );
}

/* ───────── TYPES + DATA ───────── */

type TxStatus = "won" | "lost" | "jackpot" | "pending";

interface Transaction {
  id: number;
  place: string;
  category: string;
  amount: number;
  cashback: number;
  percent: number;
  status: TxStatus;
  time: string;
  date: string;
  dateLabel: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: 1, place: "Coffee Lab", category: "კაფე", amount: 4.50, cashback: 3.60, percent: 80, status: "won", time: "14:23", date: "2026-03-27", dateLabel: "დღეს, 27 მარტი" },
  { id: 2, place: "Pizza House", category: "რესტორანი", amount: 22.00, cashback: 0, percent: 0, status: "lost", time: "12:05", date: "2026-03-27", dateLabel: "დღეს, 27 მარტი" },
  { id: 3, place: "პური გულით", category: "საცხობი", amount: 3.20, cashback: 3.20, percent: 100, status: "jackpot", time: "09:15", date: "2026-03-27", dateLabel: "დღეს, 27 მარტი" },
  { id: 4, place: "Stamba Café", category: "კაფე", amount: 8.90, cashback: 0, percent: 0, status: "pending", time: "18:40", date: "2026-03-27", dateLabel: "დღეს, 27 მარტი" },
  { id: 5, place: "Nike Store", category: "მაღაზია", amount: 89.00, cashback: 44.50, percent: 50, status: "won", time: "16:30", date: "2026-03-26", dateLabel: "გუშინ, 26 მარტი" },
  { id: 6, place: "Entrée", category: "რესტორანი", amount: 45.00, cashback: 0, percent: 0, status: "lost", time: "13:20", date: "2026-03-26", dateLabel: "გუშინ, 26 მარტი" },
  { id: 7, place: "შემოხტა", category: "რესტორანი", amount: 32.50, cashback: 16.25, percent: 50, status: "won", time: "20:10", date: "2026-03-26", dateLabel: "გუშინ, 26 მარტი" },
  { id: 8, place: "Lolita", category: "კაფე", amount: 6.00, cashback: 6.00, percent: 100, status: "jackpot", time: "11:45", date: "2026-03-25", dateLabel: "25 მარტი" },
  { id: 9, place: "Bread House", category: "საცხობი", amount: 2.80, cashback: 0.56, percent: 20, status: "won", time: "08:30", date: "2026-03-25", dateLabel: "25 მარტი" },
  { id: 10, place: "Coffee Lab", category: "კაფე", amount: 5.20, cashback: 0, percent: 0, status: "lost", time: "15:00", date: "2026-03-25", dateLabel: "25 მარტი" },
  { id: 11, place: "Cinema City", category: "გართობა", amount: 15.00, cashback: 10.50, percent: 70, status: "won", time: "19:00", date: "2026-03-24", dateLabel: "24 მარტი" },
  { id: 12, place: "Stamba Café", category: "კაფე", amount: 7.50, cashback: 0, percent: 0, status: "lost", time: "10:15", date: "2026-03-24", dateLabel: "24 მარტი" },
];

type FilterKey = "all" | "won" | "lost" | "jackpot" | "pending";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "ყველა" },
  { key: "won", label: "მოგებული" },
  { key: "lost", label: "წაგებული" },
  { key: "jackpot", label: "ჯეკპოტი" },
  { key: "pending", label: "მომლოდინე" },
];

/* ───────── MAIN ───────── */

export default function HistoryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Filter
  const filtered = useMemo(() => {
    if (activeFilter === "all") return TRANSACTIONS;
    if (activeFilter === "won") return TRANSACTIONS.filter((t) => t.status === "won");
    if (activeFilter === "lost") return TRANSACTIONS.filter((t) => t.status === "lost");
    if (activeFilter === "jackpot") return TRANSACTIONS.filter((t) => t.status === "jackpot");
    return TRANSACTIONS.filter((t) => t.status === "pending");
  }, [activeFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, { label: string; transactions: Transaction[] }> = {};
    filtered.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = { label: tx.dateLabel, transactions: [] };
      groups[tx.date].transactions.push(tx);
    });
    return Object.entries(groups);
  }, [filtered]);

  // Stats (from ALL transactions, not filtered)
  const stats = useMemo(() => {
    const totalSpent = TRANSACTIONS.reduce((s, t) => s + t.amount, 0);
    const totalWon = TRANSACTIONS.reduce((s, t) => s + t.cashback, 0);
    const wonCount = TRANSACTIONS.filter((t) => t.status === "won" || t.status === "jackpot").length;
    const decidedCount = TRANSACTIONS.filter((t) => t.status !== "pending").length;
    const winRate = decidedCount > 0 ? Math.round((wonCount / decidedCount) * 100) : 0;
    return { totalSpent, totalWon, winRate };
  }, []);

  const stagger = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.4s ease-out ${i * 0.08}s`,
  });

  const getStatusIcon = (status: TxStatus) => {
    switch (status) {
      case "won":
        return { icon: <Icon name="check" size={18} color="#00E88F" />, bg: "rgba(0,232,143,0.06)", border: "rgba(0,232,143,0.12)" };
      case "lost":
        return { icon: <Icon name="x" size={18} color="#FF5757" />, bg: "rgba(255,87,87,0.06)", border: "rgba(255,87,87,0.12)" };
      case "jackpot":
        return { icon: <CrownIcon />, bg: "rgba(255,215,0,0.06)", border: "rgba(255,215,0,0.12)" };
      case "pending":
        return { icon: <Icon name="clock" size={18} color="#FFB800" />, bg: "rgba(255,184,0,0.06)", border: "rgba(255,184,0,0.12)" };
    }
  };

  const getResultText = (tx: Transaction) => {
    if (tx.status === "pending") return { text: "მიმდინარე", color: "#FFB800" };
    if (tx.status === "lost") return { text: "0%", color: "rgba(255,87,87,0.56)" };
    if (tx.status === "jackpot") return { text: `+${tx.cashback.toFixed(2)}₾ (${tx.percent}%)`, color: "#FFD700" };
    return { text: `+${tx.cashback.toFixed(2)}₾ (${tx.percent}%)`, color: "#00E88F" };
  };

  const getStatusBadge = (status: TxStatus) => {
    const map = {
      won: { text: "მოგებული", bg: "rgba(0,232,143,0.1)", color: "#00E88F" },
      lost: { text: "წაგებული", bg: "rgba(255,87,87,0.1)", color: "#FF5757" },
      jackpot: { text: "ჯეკპოტი", bg: "rgba(255,215,0,0.1)", color: "#FFD700" },
      pending: { text: "მომლოდინე", bg: "rgba(255,184,0,0.1)", color: "#FFB800" },
    };
    return map[status];
  };

  const getSpinColor = (percent: number) => {
    if (percent === 0) return "#FF5757";
    if (percent >= 100) return "#FFD700";
    if (percent >= 50) return "#00E88F";
    return "#00C777";
  };

  return (
    <main className="min-h-[100dvh] bg-[#0A0F1C]">
      <div className="max-w-[430px] mx-auto px-5 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>

        {/* ── Header ── */}
        <div style={stagger(0)}>
          <BackHeader
            title="ისტორია"
            rightAction={
              <button
                className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center transition-all duration-200 hover:bg-[#1C2539] active:scale-95"
                style={{ background: "#141B2D", border: "1px solid #1C2539" }}
              >
                <DownloadIcon />
              </button>
            }
          />
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-2.5 mb-5" style={stagger(1)}>
          {/* Spent */}
          <div className="rounded-[14px] p-3.5" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center mb-2.5" style={{ background: "rgba(0,232,143,0.1)" }}>
              <WalletSmallIcon color="#00E88F" />
            </div>
            <p className="text-[11px] text-[#475569] mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>დახარჯული</p>
            <p className="text-[18px] sm:text-[20px] font-bold text-[#F1F5F9] leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>
              {stats.totalSpent.toFixed(0)}₾
            </p>
          </div>

          {/* Won */}
          <div className="rounded-[14px] p-3.5" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center mb-2.5" style={{ background: "rgba(0,232,143,0.1)" }}>
              <TrendingUpIcon color="#00E88F" />
            </div>
            <p className="text-[11px] text-[#475569] mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>მოგებული</p>
            <p className="text-[18px] sm:text-[20px] font-bold text-[#00E88F] leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>
              {stats.totalWon.toFixed(0)}₾
            </p>
          </div>

          {/* Win rate */}
          <div className="rounded-[14px] p-3.5" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center mb-2.5" style={{ background: "rgba(255,184,0,0.1)" }}>
              <Icon name="spin" size={16} color="#FFB800" />
            </div>
            <p className="text-[11px] text-[#475569] mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>მოგების %</p>
            <p className="text-[18px] sm:text-[20px] font-bold text-[#FFB800] leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>
              {stats.winRate}%
            </p>
          </div>
        </div>

        {/* ── Period selector ── */}
        <button
          className="w-full flex items-center justify-between h-[44px] rounded-[12px] px-3.5 mb-4 transition-all duration-200 hover:bg-[#1C2539]/50 active:scale-[0.98]"
          style={{ ...stagger(2), background: "#141B2D", border: "1px solid #1C2539" }}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon />
            <span className="text-[14px] text-[#CBD5E1] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
              ეს თვე — მარტი 2026
            </span>
          </div>
          <ChevronDownIcon />
        </button>

        {/* ── Filter pills ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide" style={stagger(3)}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setActiveFilter(f.key); setExpandedId(null); }}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-95"
              style={{
                fontFamily: "var(--font-dm-sans)",
                background: activeFilter === f.key ? "#00E88F" : "#141B2D",
                color: activeFilter === f.key ? "#0A0F1C" : "#94A3B8",
                border: `1px solid ${activeFilter === f.key ? "#00E88F" : "#1C2539"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Transaction list ── */}
        {grouped.length > 0 ? (
          <div className="flex flex-col gap-5">
            {grouped.map(([date, group], gi) => {
              const dayTotal = group.transactions.reduce((s, t) => s + t.amount, 0);
              return (
                <div key={date} style={stagger(4 + gi)}>
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[13px] font-bold text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {group.label}
                    </span>
                    <span className="text-[12px] text-[#334155]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      -{dayTotal.toFixed(2)}₾
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2.5">
                    {group.transactions.map((tx) => {
                      const si = getStatusIcon(tx.status);
                      const result = getResultText(tx);
                      const isExpanded = expandedId === tx.id;
                      const isJackpot = tx.status === "jackpot";
                      const badge = getStatusBadge(tx.status);

                      return (
                        <div key={tx.id}>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                            className={`w-full text-left rounded-[14px] p-3.5 transition-all duration-200 active:scale-[0.98] ${isJackpot ? "animate-jackpotGlow" : ""}`}
                            style={{
                              background: isJackpot ? "linear-gradient(135deg, #141B2D, #1C1F10)" : "#141B2D",
                              border: `1px solid ${isJackpot ? "rgba(255,215,0,0.2)" : "#1C2539"}`,
                              borderBottomLeftRadius: isExpanded ? 0 : 14,
                              borderBottomRightRadius: isExpanded ? 0 : 14,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Status icon */}
                                <div
                                  className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center shrink-0"
                                  style={{ background: si.bg, border: `1px solid ${si.border}` }}
                                >
                                  {si.icon}
                                </div>

                                {/* Info */}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-[15px] font-bold text-[#F1F5F9] leading-tight" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                      {tx.place}
                                    </p>
                                    {isJackpot && (
                                      <span className="px-1.5 py-px rounded-[4px] text-[9px] font-bold text-[#FFD700]" style={{ fontFamily: "var(--font-outfit)", background: "rgba(255,215,0,0.15)" }}>
                                        JACKPOT
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[12px] text-[#475569] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                    {tx.category} · {tx.time}
                                  </p>
                                </div>
                              </div>

                              {/* Amount + result */}
                              <div className="text-right shrink-0">
                                <p className="text-[15px] font-bold text-[#F1F5F9]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                  {tx.amount.toFixed(2)}₾
                                </p>
                                <p className="text-[12px] font-semibold mt-0.5" style={{ fontFamily: "var(--font-dm-sans)", color: result.color }}>
                                  {result.text}
                                </p>
                              </div>
                            </div>
                          </button>

                          {/* Expanded details */}
                          <div
                            className="overflow-hidden transition-all duration-300 ease-out"
                            style={{
                              maxHeight: isExpanded ? 220 : 0,
                              opacity: isExpanded ? 1 : 0,
                            }}
                          >
                            <div
                              className="px-3.5 pb-3.5 pt-3 rounded-b-[14px] flex flex-col gap-2.5"
                              style={{
                                background: isJackpot ? "linear-gradient(135deg, #141B2D, #1C1F10)" : "#141B2D",
                                borderLeft: `1px solid ${isJackpot ? "rgba(255,215,0,0.2)" : "#1C2539"}`,
                                borderRight: `1px solid ${isJackpot ? "rgba(255,215,0,0.2)" : "#1C2539"}`,
                                borderBottom: `1px solid ${isJackpot ? "rgba(255,215,0,0.2)" : "#1C2539"}`,
                                borderTop: "1px solid #1C2539",
                              }}
                            >
                              {/* Detail rows */}
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>თანხა</span>
                                <span className="text-[13px] text-[#CBD5E1] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>{tx.amount.toFixed(2)}₾</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>სპინის შედეგი</span>
                                <span className="text-[13px] font-bold" style={{ fontFamily: "var(--font-outfit)", color: getSpinColor(tx.percent) }}>{tx.percent}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>მოგება</span>
                                <span className="text-[13px] font-medium" style={{ fontFamily: "var(--font-dm-sans)", color: tx.cashback > 0 ? (isJackpot ? "#FFD700" : "#00E88F") : "#475569" }}>
                                  {tx.cashback > 0 ? `${tx.cashback.toFixed(2)}₾` : "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>სტატუსი</span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ fontFamily: "var(--font-dm-sans)", background: badge.bg, color: badge.color }}>
                                  {badge.text}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>დრო</span>
                                <span className="text-[13px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>{tx.time}</span>
                              </div>

                              {/* Cashback progress bar */}
                              {tx.status !== "pending" && (
                                <div className="mt-1">
                                  <div className="w-full h-[6px] rounded-full bg-[#0A0F1C] overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-700 ease-out"
                                      style={{
                                        width: `${tx.percent}%`,
                                        background: isJackpot
                                          ? "linear-gradient(90deg, #FFD700, #FFA500)"
                                          : tx.percent > 0
                                          ? "linear-gradient(90deg, #00E88F, #00C777)"
                                          : "#FF5757",
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20" style={stagger(4)}>
            <EmptyClockIcon />
            <p className="text-[16px] text-[#475569] font-medium mt-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
              ტრანზაქცია ვერ მოიძებნა
            </p>
          </div>
        )}

        {/* ── Load more ── */}
        {grouped.length > 0 && (
          <button
            className="w-full h-[44px] rounded-[12px] flex items-center justify-center gap-1.5 text-[14px] font-medium text-[#64748B] mt-5 transition-all duration-200 hover:bg-[#1C2539]/50 active:scale-[0.97]"
            style={{ ...stagger(8), fontFamily: "var(--font-dm-sans)", background: "#141B2D", border: "1px solid #1C2539" }}
          >
            მეტის ჩატვირთვა
            <ChevronDownIcon color="#64748B" />
          </button>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
