"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { getGameHistory } from "@/services/admin";

/* ── SVG ICONS ── */
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="10" y="2" width="6" height="6" rx="1" /><rect x="2" y="10" width="6" height="6" rx="1" /><rect x="10" y="10" width="6" height="6" rx="1" /></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="13" cy="5" r="2" /><path d="M14 10c1.7.5 3 2 3 4" /></svg>,
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /><path d="M7 16v-5h4v5" /></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l2-3h10l2 3" /><rect x="2" y="6" width="14" height="10" rx="1" /><path d="M9 6v10" /><path d="M2 6h14" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2.5" /><circle cx="13" cy="6" r="2.5" /><path d="M1 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /><path d="M9 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /></svg>,
    withdrawals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14V4" /><path d="M5 8l4-4 4 4" /><path d="M3 16h12" /></svg>,
    finance: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l3-2 4 3 3-4 4 3v8" /><path d="M2 16h14" /></svg>,
    village: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l7-5.5L16 8v8" /><path d="M6 16v-4h6v4" /></svg>,
    notifications: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 6.5a4.5 4.5 0 10-9 0c0 5-2.25 6.5-2.25 6.5h13.5s-2.25-1.5-2.25-6.5" /><path d="M7.5 15a1.5 1.5 0 003 0" /></svg>,
    analytics: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,14 6,8 10,11 16,4" /><polyline points="12,4 16,4 16,8" /></svg>,
    system: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="2.5" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" /></svg>,
  };
  return icons[id] || null;
}

const NAV_ITEMS = [
  { label: "Dashboard", id: "dashboard", href: "/admin" },
  { label: "Algorithm", id: "algorithm", href: "/admin/algorithm" },
  { label: "Users", id: "users", href: "/admin/users" },
  { label: "Merchants", id: "merchants", href: "/admin/merchants" },
  { label: "Transactions", id: "transactions", href: "/admin/transactions" },
  { label: "Games", id: "games", href: "/admin/games" },
  { label: "Offers", id: "offers", href: "/admin/offers" },
  { label: "Tickets", id: "tickets", href: "/admin/tickets" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin/system" },
];

const GAME_TYPE_LABELS: Record<string, string> = { slot: "Midnight Machine", plinko: "Lucky Drop", chicken_rush: "Lucky Step" };
const GAME_COLORS: Record<string, { bg: string; color: string }> = {
  slot: { bg: "#F9E74120", color: "#F9E741" },
  plinko: { bg: "#3B82F620", color: "#3B82F6" },
  chicken_rush: { bg: "#22C55E20", color: "#22C55E" },
};

const PER_PAGE = 20;

export default function TransactionsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Data */
  const [history, setHistory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Pagination */
  const [page, setPage] = useState(1);

  /* Expanded rows */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  /* Fetch data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = { page, limit: PER_PAGE };
      if (gameFilter !== "all") filters.game_type = gameFilter;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      if (debouncedSearch) filters.search = debouncedSearch;

      const data = await getGameHistory(filters);
      setHistory(data.history || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, gameFilter, dateFrom, dateTo, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch, gameFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  /* Summary stats */
  const totalBet = history.reduce((s, t) => s + (t.betAmount || 0), 0);
  const totalWin = history.reduce((s, t) => s + (t.winAmount || 0), 0);
  const avgPercent = totalBet > 0 ? (totalWin / totalBet) * 100 : 0;

  /* CSV Export */
  const handleExport = () => {
    const header = "ID,Time,User,Phone,Game,Bet,Win,PoolBefore,PoolAfter\n";
    const rows = history.map((tx: any) =>
      `${tx.id},${tx.createdAt},${tx.userName || ""},${tx.userPhone || ""},${tx.gameType},${tx.betAmount},${tx.winAmount},${tx.poolBalanceBefore || ""},${tx.poolBalanceAfter || ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ── SIDEBAR (Desktop) ── */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r" style={{ background: "#111111", borderColor: "#252525" }}>
        <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
          <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>SHANSI</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>Admin Panel</p>
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
              style={{ background: item.id === "transactions" ? "#1A1A1A" : "transparent", borderLeft: item.id === "transactions" ? "3px solid #F9E741" : "3px solid transparent" }}>
              <NavIcon id={item.id} active={item.id === "transactions"} />
              <span className="text-[13px] font-medium" style={{ color: item.id === "transactions" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── MOBILE SIDEBAR ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside className="absolute left-0 top-0 bottom-0 w-[250px] border-r flex flex-col" style={{ background: "#111111", borderColor: "#252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
              <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>SHANSI</h1>
              <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>Admin Panel</p>
            </div>
            <nav className="flex-1 py-3">
              {NAV_ITEMS.map((item) => (
                <button key={item.id} onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
                  style={{ background: item.id === "transactions" ? "#1A1A1A" : "transparent", borderLeft: item.id === "transactions" ? "3px solid #F9E741" : "3px solid transparent" }}>
                  <NavIcon id={item.id} active={item.id === "transactions"} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === "transactions" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 py-3 border-b" style={{ background: "#000000", borderColor: "#252525" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-95" style={{ background: "#1A1A1A" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="5" x2="15" y2="5" /><line x1="3" y1="9" x2="15" y2="9" /><line x1="3" y1="13" x2="15" y2="13" /></svg>
            </button>
            <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>TRANSACTIONS</h2>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12px] font-bold transition-all active:scale-[0.97] hover:brightness-110" style={{ background: "#F9E741", color: "#000000" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1v8M4 6l3 3 3-3" /><path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
            </svg>
            CSV
          </button>
        </header>

        <div className="p-4 lg:p-6 space-y-4">

          {/* ═══ SEARCH BAR ═══ */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="5.5" /><path d="M12.5 12.5L16 16" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={"\u10DB\u10DD\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10DA\u10D8\u10E1 \u10EB\u10D8\u10D4\u10D1\u10D0 / Search user..."}
              className="w-full pl-11 pr-4 py-3 rounded-[12px] text-[14px] font-medium outline-none transition-all focus:ring-2"
              style={{ background: "#111111", color: "#FFFFFF", border: "1px solid #252525", caretColor: "#F9E741" }}
            />
          </div>

          {/* ═══ FILTERS TOGGLE ═══ */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-[12px] font-semibold transition-all hover:brightness-125"
            style={{ color: "#A0A0A0" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 2h12M3 5h8M5 8h4M6 11h2" />
            </svg>
            {"\u10E4\u10D8\u10DA\u10E2\u10E0\u10D4\u10D1\u10D8 / Filters"}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
              <polyline points="3,4 6,7 9,4" />
            </svg>
          </button>

          {filtersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#666666" }}>{"\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8 (\u10D3\u10D0\u10DC)"}</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] text-[12px] outline-none transition-all"
                  style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#666666" }}>{"\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8 (\u10DB\u10D3\u10D4)"}</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] text-[12px] outline-none transition-all"
                  style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#666666" }}>{"\u10D7\u10D0\u10DB\u10D0\u10E8\u10D8"}</label>
                <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] text-[12px] outline-none transition-all appearance-none cursor-pointer"
                  style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }}>
                  <option value="all">{"\u10E7\u10D5\u10D4\u10DA\u10D0 / All"}</option>
                  <option value="slot">Midnight Machine</option>
                  <option value="plinko">Lucky Drop</option>
                  <option value="chicken_rush">Lucky Step</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setGameFilter("all"); }}
                  className="px-4 py-2 rounded-[8px] text-[12px] font-semibold transition-all active:scale-[0.97] hover:brightness-125"
                  style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>
                  {"\u10D2\u10D0\u10E1\u10E3\u10E4\u10D7\u10D0\u10D5\u10D4\u10D1\u10D0 / Clear"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ SUMMARY BAR ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-[12px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#666666" }}>{"\u10E1\u10E3\u10DA TX"}</p>
              <p className="text-[20px] font-extrabold leading-none" style={{ color: "#FFFFFF" }}>{total}</p>
            </div>
            <div className="rounded-[12px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#666666" }}>{"\u10EF\u10D0\u10DB\u10D8 \u10E4\u10E1\u10DD\u10DC\u10D8"}</p>
              <p className="text-[20px] font-extrabold leading-none" style={{ color: "#FFFFFF" }}>{totalBet.toFixed(2)}</p>
            </div>
            <div className="rounded-[12px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#666666" }}>{"\u10EF\u10D0\u10DB\u10D8 \u10DB\u10DD\u10D2\u10D4\u10D1\u10D0"}</p>
              <p className="text-[20px] font-extrabold leading-none" style={{ color: "#22C55E" }}>{totalWin.toFixed(2)} <span className="text-[12px] font-semibold" style={{ color: "#666666" }}>GEL</span></p>
            </div>
            <div className="rounded-[12px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#666666" }}>{"\u10E1\u10D0\u10E8\u10E3\u10D0\u10DA\u10DD %"}</p>
              <p className="text-[20px] font-extrabold leading-none" style={{ color: avgPercent < 1 ? "#22C55E" : avgPercent < 2 ? "#F9E741" : "#EF4444" }}>{avgPercent.toFixed(2)}%</p>
            </div>
          </div>

          {/* ═══ TRANSACTIONS TABLE ═══ */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
                <span className="ml-3 text-[13px]" style={{ color: "#666666" }}>Loading...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #252525" }}>
                      {["", "\u10DB\u10DD\u10DB\u10EE\u10DB.", "\u10D7\u10D0\u10DB\u10D0\u10E8\u10D8", "\u10E4\u10E1\u10DD\u10DC\u10D8", "\u10DB\u10DD\u10D2\u10D4\u10D1\u10D0", "\u10DE\u10E3\u10DA\u10D8 (before)", "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-[13px]" style={{ color: "#666666" }}>
                          {"\u10E2\u10E0\u10D0\u10DC\u10D6\u10D0\u10E5\u10EA\u10D8\u10D4\u10D1\u10D8 \u10EF\u10D4\u10E0 \u10D0\u10E0 \u10D0\u10E0\u10D8\u10E1"}
                        </td>
                      </tr>
                    )}
                    {history.map((tx: any, i: number) => {
                      const isExpanded = expandedId === tx.id;
                      const gameCol = GAME_COLORS[tx.gameType] || { bg: "#A0A0A020", color: "#A0A0A0" };

                      return (
                        <Fragment key={tx.id || i}>
                          <tr
                            className="transition-all cursor-pointer hover:brightness-110"
                            style={{ borderBottom: "1px solid #1A1A1A", background: isExpanded ? "#1A1A1A" : "transparent" }}
                            onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                          >
                            <td className="pl-3 pr-1 py-2.5">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"
                                style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                                <polyline points="4,2 8,6 4,10" />
                              </svg>
                            </td>
                            <td className="px-3 py-2.5 text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{tx.userName || tx.userPhone || "Unknown"}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: gameCol.bg, color: gameCol.color }}>
                                {GAME_TYPE_LABELS[tx.gameType] || tx.gameType}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: "#F9E741" }}>{tx.betAmount?.toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: tx.winAmount > 0 ? "#22C55E" : "#666666" }}>
                              {tx.winAmount > 0 ? `${tx.winAmount.toFixed(2)} \u20BE` : "\u2014"}
                            </td>
                            <td className="px-3 py-2.5 text-[11px]" style={{ color: "#A0A0A0" }}>
                              {tx.poolBalanceBefore != null ? tx.poolBalanceBefore.toFixed(2) : "\u2014"}
                            </td>
                            <td className="px-3 py-2.5 text-[11px]" style={{ color: "#666666" }}>
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleString("ka-GE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr style={{ borderBottom: "1px solid #252525" }}>
                              <td colSpan={7} className="px-4 py-4" style={{ background: "#0D0D0D" }}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="rounded-[8px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666666" }}>{"\u10D3\u10D4\u10E2\u10D0\u10DA\u10D4\u10D1\u10D8"}</p>
                                    <div className="space-y-1.5 text-[12px]">
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>ID:</span>
                                        <span className="font-mono text-[10px]" style={{ color: "#F9E741" }}>{tx.id}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>{"\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8"}:</span>
                                        <span style={{ color: "#A0A0A0" }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleString("ka-GE") : ""}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>{"\u10E4\u10E1\u10DD\u10DC\u10D8"}:</span>
                                        <span className="font-semibold" style={{ color: "#F9E741" }}>{tx.betAmount?.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>{"\u10DB\u10DD\u10D2\u10D4\u10D1\u10D0"}:</span>
                                        <span className="font-semibold" style={{ color: tx.winAmount > 0 ? "#22C55E" : "#666666" }}>{tx.winAmount > 0 ? `${tx.winAmount.toFixed(2)} \u20BE` : "\u2014"}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="rounded-[8px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666666" }}>{"\u10DE\u10E3\u10DA\u10D8"}</p>
                                    <div className="space-y-1.5 text-[12px]">
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>Before:</span>
                                        <span style={{ color: "#A0A0A0" }}>{tx.poolBalanceBefore != null ? `${tx.poolBalanceBefore.toFixed(2)} \u20BE` : "\u2014"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>After:</span>
                                        <span style={{ color: "#A0A0A0" }}>{tx.poolBalanceAfter != null ? `${tx.poolBalanceAfter.toFixed(2)} \u20BE` : "\u2014"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>Change:</span>
                                        <span className="font-semibold" style={{ color: tx.winAmount > 0 ? "#EF4444" : "#666666" }}>
                                          {tx.poolBalanceBefore != null && tx.poolBalanceAfter != null ? `${(tx.poolBalanceAfter - tx.poolBalanceBefore).toFixed(2)} \u20BE` : "\u2014"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="rounded-[8px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666666" }}>{"\u10DB\u10DD\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10D4\u10DA\u10D8"}</p>
                                    <div className="space-y-1.5 text-[12px]">
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>User:</span>
                                        <span className="font-medium" style={{ color: "#FFFFFF" }}>{tx.userName || "\u2014"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>Phone:</span>
                                        <span style={{ color: "#A0A0A0" }}>{tx.userPhone || "\u2014"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span style={{ color: "#666666" }}>Game:</span>
                                        <span style={{ color: gameCol.color }}>{GAME_TYPE_LABELS[tx.gameType] || tx.gameType}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ═══ PAGINATION ═══ */}
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#252525" }}>
              <p className="text-[11px]" style={{ color: "#666666" }}>
                {total > 0 ? `${(page - 1) * PER_PAGE + 1}-${Math.min(page * PER_PAGE, total)} / ${total}` : "0 results"}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><polyline points="9,3 5,7 9,11" /></svg>
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-[12px] font-semibold transition-all active:scale-95"
                      style={{ background: p === page ? "#F9E741" : "#1A1A1A", color: p === page ? "#000000" : "#A0A0A0" }}>
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><polyline points="5,3 9,7 5,11" /></svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
