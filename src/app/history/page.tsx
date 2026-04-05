"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BackHeader from "@/components/BackHeader";
import BottomNav from "@/components/BottomNav";
import { getGameHistory } from "@/services/games";

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

/* ───────── TYPES ───────── */

const GAME_LABELS: Record<string, string> = { slot: "Midnight Machine", plinko: "Lucky Drop", chicken_rush: "Lucky Step" };

type FilterKey = "all" | "won" | "lost";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "\u10E7\u10D5\u10D4\u10DA\u10D0" },
  { key: "won", label: "\u10DB\u10DD\u10D2\u10D4\u10D1\u10E3\u10DA\u10D8" },
  { key: "lost", label: "\u10EC\u10D0\u10D2\u10D4\u10D1\u10E3\u10DA\u10D8" },
];

/* ───────── MAIN ───────── */

export default function HistoryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Fetch game history
  const fetchHistory = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await getGameHistory(pageNum) as any;
      const items = data.history || [];
      if (append) setGames((prev) => [...prev, ...items]);
      else setGames(items);
      setHasMore(items.length >= (data.pagination?.limit || 20));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  };

  // Filter
  const filtered = activeFilter === "all" ? games
    : activeFilter === "won" ? games.filter((g: any) => g.winAmount > 0)
    : games.filter((g: any) => g.winAmount === 0);

  // Group by date
  const grouped = (() => {
    const groups: Record<string, { label: string; transactions: any[] }> = {};
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    filtered.forEach((g: any) => {
      const date = g.createdAt ? g.createdAt.split("T")[0] : "unknown";
      if (!groups[date]) {
        let label = date;
        if (date === today) label = "\u10D3\u10E6\u10D4\u10E1";
        else if (date === yesterday) label = "\u10D2\u10E3\u10E8\u10D8\u10DC";
        else {
          const d = new Date(date);
          label = d.toLocaleDateString("ka-GE", { day: "numeric", month: "long" });
        }
        groups[date] = { label, transactions: [] };
      }
      groups[date].transactions.push(g);
    });
    return Object.entries(groups);
  })();

  // Stats
  const totalBet = games.reduce((s: number, g: any) => s + (g.betAmount || 0), 0);
  const totalWon = games.reduce((s: number, g: any) => s + (g.winAmount || 0), 0);
  const wonCount = games.filter((g: any) => g.winAmount > 0).length;
  const winRate = games.length > 0 ? Math.round((wonCount / games.length) * 100) : 0;

  const stagger = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.4s ease-out ${i * 0.08}s`,
  });

  const getStatusIcon = (won: boolean) => {
    return won
      ? { icon: <Icon name="check" size={18} color="#00E88F" />, bg: "rgba(0,232,143,0.06)", border: "rgba(0,232,143,0.12)" }
      : { icon: <Icon name="x" size={18} color="#FF5757" />, bg: "rgba(255,87,87,0.06)", border: "rgba(255,87,87,0.12)" };
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
              {totalBet.toFixed(2)}₾
            </p>
          </div>

          {/* Won */}
          <div className="rounded-[14px] p-3.5" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center mb-2.5" style={{ background: "rgba(0,232,143,0.1)" }}>
              <TrendingUpIcon color="#00E88F" />
            </div>
            <p className="text-[11px] text-[#475569] mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>მოგებული</p>
            <p className="text-[18px] sm:text-[20px] font-bold text-[#00E88F] leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>
              {totalWon.toFixed(2)}₾
            </p>
          </div>

          {/* Win rate */}
          <div className="rounded-[14px] p-3.5" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
            <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center mb-2.5" style={{ background: "rgba(255,184,0,0.1)" }}>
              <Icon name="spin" size={16} color="#FFB800" />
            </div>
            <p className="text-[11px] text-[#475569] mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>მოგების %</p>
            <p className="text-[18px] sm:text-[20px] font-bold text-[#FFB800] leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>
              {winRate}%
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20" style={stagger(4)}>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00E88F", borderTopColor: "transparent" }} />
            <p className="text-[14px] text-[#475569] mt-4" style={{ fontFamily: "var(--font-dm-sans)" }}>Loading...</p>
          </div>
        ) : grouped.length > 0 ? (
          <div className="flex flex-col gap-5">
            {grouped.map(([date, group], gi) => {
              const dayBet = group.transactions.reduce((s: number, t: any) => s + (t.betAmount || 0), 0);
              return (
                <div key={date} style={stagger(4 + gi)}>
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[13px] font-bold text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {group.label}
                    </span>
                    <span className="text-[12px] text-[#334155]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {dayBet.toFixed(2)} bet
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2.5">
                    {group.transactions.map((g: any) => {
                      const won = g.winAmount > 0;
                      const si = getStatusIcon(won);
                      const isExpanded = expandedId === g.id;
                      const gameLabel = GAME_LABELS[g.gameType] || g.gameType;
                      const timeStr = g.createdAt ? new Date(g.createdAt).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }) : "";

                      return (
                        <div key={g.id}>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : g.id)}
                            className="w-full text-left rounded-[14px] p-3.5 transition-all duration-200 active:scale-[0.98]"
                            style={{
                              background: "#141B2D",
                              border: "1px solid #1C2539",
                              borderBottomLeftRadius: isExpanded ? 0 : 14,
                              borderBottomRightRadius: isExpanded ? 0 : 14,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center shrink-0"
                                  style={{ background: si.bg, border: `1px solid ${si.border}` }}
                                >
                                  {si.icon}
                                </div>
                                <div>
                                  <p className="text-[15px] font-bold text-[#F1F5F9] leading-tight" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                    {gameLabel}
                                  </p>
                                  <p className="text-[12px] text-[#475569] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                    {timeStr}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[15px] font-bold text-[#F1F5F9]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                  {g.betAmount?.toFixed(2)} coin
                                </p>
                                <p className="text-[12px] font-semibold mt-0.5" style={{ fontFamily: "var(--font-dm-sans)", color: won ? "#00E88F" : "rgba(255,87,87,0.56)" }}>
                                  {won ? `+${g.winAmount.toFixed(2)}\u20BE` : "\u2014"}
                                </p>
                              </div>
                            </div>
                          </button>

                          {/* Expanded details */}
                          <div
                            className="overflow-hidden transition-all duration-300 ease-out"
                            style={{ maxHeight: isExpanded ? 200 : 0, opacity: isExpanded ? 1 : 0 }}
                          >
                            <div
                              className="px-3.5 pb-3.5 pt-3 rounded-b-[14px] flex flex-col gap-2.5"
                              style={{ background: "#141B2D", borderLeft: "1px solid #1C2539", borderRight: "1px solid #1C2539", borderBottom: "1px solid #1C2539", borderTop: "1px solid #1C2539" }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{"\u10D7\u10D0\u10DB\u10D0\u10E8\u10D8"}</span>
                                <span className="text-[13px] text-[#CBD5E1] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>{gameLabel}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{"\u10E4\u10E1\u10DD\u10DC\u10D8"}</span>
                                <span className="text-[13px] font-bold" style={{ fontFamily: "var(--font-outfit)", color: "#F9E741" }}>{g.betAmount?.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{"\u10DB\u10DD\u10D2\u10D4\u10D1\u10D0"}</span>
                                <span className="text-[13px] font-medium" style={{ fontFamily: "var(--font-dm-sans)", color: won ? "#00E88F" : "#475569" }}>
                                  {won ? `${g.winAmount.toFixed(2)}\u20BE` : "\u2014"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{"\u10E1\u10E2\u10D0\u10E2\u10E3\u10E1\u10D8"}</span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{
                                  fontFamily: "var(--font-dm-sans)",
                                  background: won ? "rgba(0,232,143,0.1)" : "rgba(255,87,87,0.1)",
                                  color: won ? "#00E88F" : "#FF5757",
                                }}>
                                  {won ? "\u10DB\u10DD\u10D2\u10D4\u10D1\u10E3\u10DA\u10D8" : "\u10EC\u10D0\u10D2\u10D4\u10D1\u10E3\u10DA\u10D8"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{"\u10D3\u10E0\u10DD"}</span>
                                <span className="text-[13px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>{timeStr}</span>
                              </div>
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
          <div className="flex flex-col items-center justify-center py-20" style={stagger(4)}>
            <EmptyClockIcon />
            <p className="text-[16px] text-[#475569] font-medium mt-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
              {"\u10EF\u10D4\u10E0 \u10D0\u10E0 \u10D2\u10D0\u10E5\u10D5\u10E1 \u10D7\u10D0\u10DB\u10D0\u10E8\u10D4\u10D1\u10D8\u10E1 \u10D8\u10E1\u10E2\u10DD\u10E0\u10D8\u10D0"}
            </p>
          </div>
        )}

        {/* ── Load more ── */}
        {!loading && hasMore && games.length > 0 && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full h-[44px] rounded-[12px] flex items-center justify-center gap-1.5 text-[14px] font-medium text-[#64748B] mt-5 transition-all duration-200 hover:bg-[#1C2539]/50 active:scale-[0.97] disabled:opacity-50"
            style={{ ...stagger(8), fontFamily: "var(--font-dm-sans)", background: "#141B2D", border: "1px solid #1C2539" }}
          >
            {loadingMore ? "..." : "\u10DB\u10D4\u10E2\u10D8\u10E1 \u10E9\u10D0\u10E2\u10D5\u10D8\u10E0\u10D7\u10D5\u10D0"}
            {!loadingMore && <ChevronDownIcon color="#64748B" />}
          </button>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
