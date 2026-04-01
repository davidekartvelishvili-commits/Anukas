"use client";

import { useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";

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
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "Notifications", id: "notifications", href: "/admin/notifications" },
  { label: "Analytics", id: "analytics", href: "/admin/analytics" },
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── MOCK DATA: 100 TRANSACTIONS ── */
const MERCHANTS = ["Stamba Cafe", "Dunkin'", "Wendy's", "Luca Polare", "Coffee Lab", "Pasanauri", "Bread House", "GPC", "Goodwill", "Nikora"];
const USERS = ["Ana M.", "David K.", "Nino J.", "Giorgi T.", "Mariam S.", "Luka B.", "Elene R.", "Tornike A.", "Salome K.", "Irakli M.", "Tamara G.", "Nikoloz P.", "Ketevan D.", "Sandro V.", "Natia L.", "Levan C.", "Maia Z.", "Zurab N.", "Tamar B.", "Giga F."];
const GAME_TYPES: ("Spin" | "Drop" | "Step")[] = ["Spin", "Drop", "Step"];
const RESULT_TYPES: ("won_minimum" | "won_bonus" | "won_100" | "no_win")[] = ["won_minimum", "won_bonus", "won_100", "no_win"];
const STATUSES: ("completed" | "pending" | "failed")[] = ["completed", "completed", "completed", "completed", "completed", "completed", "completed", "completed", "pending", "failed"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Transaction {
  id: number;
  code: string;
  timestamp: Date;
  user: string;
  merchant: string;
  amount: number;
  winnings: number;
  winPercent: number;
  gameType: "Spin" | "Drop" | "Step";
  resultType: "won_minimum" | "won_bonus" | "won_100" | "no_win";
  status: "completed" | "pending" | "failed";
  algorithmSeed: number;
  poolAtTime: number;
  tierApplied: string;
}

function generateTransactions(): Transaction[] {
  const rng = seededRandom(42);
  const txs: Transaction[] = [];
  const baseDate = new Date(2026, 2, 29, 14, 30, 0);

  for (let i = 0; i < 100; i++) {
    const amount = Math.round((rng() * 200 + 1.5) * 100) / 100;
    const resultType = RESULT_TYPES[Math.floor(rng() * RESULT_TYPES.length)];
    let winPercent = 0;
    let winnings = 0;

    if (resultType === "won_minimum") {
      winPercent = 0.5;
      winnings = Math.round(amount * 0.005 * 100) / 100;
    } else if (resultType === "won_bonus") {
      winPercent = Math.round((rng() * 8 + 1) * 100) / 100;
      winnings = Math.round(amount * (winPercent / 100) * 100) / 100;
    } else if (resultType === "won_100") {
      winPercent = 100;
      winnings = amount;
    }

    const minutesBack = i * 3 + Math.floor(rng() * 3);
    const txDate = new Date(baseDate.getTime() - minutesBack * 60000);

    txs.push({
      id: i + 1,
      code: `TX-${(100000 + Math.floor(rng() * 900000)).toString()}`,
      timestamp: txDate,
      user: USERS[Math.floor(rng() * USERS.length)],
      merchant: MERCHANTS[Math.floor(rng() * MERCHANTS.length)],
      amount,
      winnings,
      winPercent,
      gameType: GAME_TYPES[Math.floor(rng() * GAME_TYPES.length)],
      resultType,
      status: STATUSES[Math.floor(rng() * STATUSES.length)],
      algorithmSeed: Math.floor(rng() * 999999),
      poolAtTime: Math.round((120000 + rng() * 30000) * 100) / 100,
      tierApplied: amount < 5 ? "Low-Amount (100% eligible)" : amount < 50 ? "Standard" : "High-Amount (capped)",
    });
  }
  return txs;
}

const ALL_TRANSACTIONS = generateTransactions();

/* ── RESULT TYPE LABELS ── */
const RESULT_LABELS: Record<string, string> = {
  all: "All / ყველა",
  won_minimum: "Won Minimum / მინიმუმი",
  won_bonus: "Won Bonus / ბონუსი",
  won_100: "Won 100% / სრული",
  no_win: "No Win / არ მოიგო",
};

/* ── GAME BADGE COLORS ── */
const GAME_COLORS: Record<string, { bg: string; color: string }> = {
  Spin: { bg: "#F9E74120", color: "#F9E741" },
  Drop: { bg: "#3B82F620", color: "#3B82F6" },
  Step: { bg: "#22C55E20", color: "#22C55E" },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  completed: { bg: "#22C55E18", color: "#22C55E" },
  pending: { bg: "#F9E74118", color: "#F9E741" },
  failed: { bg: "#EF444418", color: "#EF4444" },
};

/* ── MAIN PAGE ── */
export default function TransactionsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Filters */
  const [searchCode, setSearchCode] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [merchantFilter, setMerchantFilter] = useState("all");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Pagination */
  const [page, setPage] = useState(1);
  const perPage = 50;

  /* Expanded rows */
  const [expandedId, setExpandedId] = useState<number | null>(null);

  /* Filtered data */
  const filtered = useMemo(() => {
    return ALL_TRANSACTIONS.filter((tx) => {
      if (searchCode && !tx.code.toLowerCase().includes(searchCode.toLowerCase())) return false;
      if (merchantFilter !== "all" && tx.merchant !== merchantFilter) return false;
      if (resultFilter !== "all" && tx.resultType !== resultFilter) return false;
      if (amountMin && tx.amount < parseFloat(amountMin)) return false;
      if (amountMax && tx.amount > parseFloat(amountMax)) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (tx.timestamp < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (tx.timestamp > to) return false;
      }
      return true;
    });
  }, [searchCode, merchantFilter, resultFilter, amountMin, amountMax, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  /* Summary stats */
  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0);
  const totalWinnings = filtered.reduce((s, t) => s + t.winnings, 0);
  const avgPercent = totalAmount > 0 ? (totalWinnings / totalAmount) * 100 : 0;

  /* CSV Export */
  const handleExport = () => {
    const header = "Code,Time,User,Merchant,Amount,Winnings,Win%,Game,Result,Status\n";
    const rows = filtered.map((tx) =>
      `${tx.code},${tx.timestamp.toISOString()},${tx.user},${tx.merchant},${tx.amount},${tx.winnings},${tx.winPercent},${tx.gameType},${tx.resultType},${tx.status}`
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
            CSV ექსპორტი
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
              value={searchCode}
              onChange={(e) => { setSearchCode(e.target.value); setPage(1); }}
              placeholder="ტრანზაქციის კოდით ძიება / Search by TX code..."
              className="w-full pl-11 pr-4 py-3 rounded-[12px] text-[14px] font-medium outline-none transition-all focus:ring-2"
              style={{ background: "#111111", color: "#FFFFFF", border: "1px solid #252525", caretColor: "#F9E741" }}
              onFocus={(e) => (e.target.style.borderColor = "#F9E741")}
              onBlur={(e) => (e.target.style.borderColor = "#252525")}
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
            ფილტრები / Filters
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
              <polyline points="3,4 6,7 9,4" />
            </svg>
          </button>

          {filtersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              {/* Date Range */}
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#666666" }}>თარიღი (დან)</label>
                <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-[8px] text-[12px] outline-none transition-all"
                  style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#666666" }}>თარიღი (მდე)</label>
                <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-[8px] text-[12px] outline-none transition-all"
                  style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }} />
              </div>

              {/* Merchant */}
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#666666" }}>მერჩანტი</label>
                <select value={merchantFilter} onChange={(e) => { setMerchantFilter(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-[8px] text-[12px] outline-none transition-all appearance-none cursor-pointer"
                  style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }}>
                  <option value="all">ყველა / All</option>
                  {MERCHANTS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Result Type */}
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#666666" }}>შედეგი</label>
                <select value={resultFilter} onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-[8px] text-[12px] outline-none transition-all appearance-none cursor-pointer"
                  style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }}>
                  {Object.entries(RESULT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#666666" }}>თანხა მინ.</label>
                <input type="number" value={amountMin} onChange={(e) => { setAmountMin(e.target.value); setPage(1); }}
                  placeholder="0.00" min="0" step="0.01"
                  className="w-full px-3 py-2 rounded-[8px] text-[12px] outline-none transition-all"
                  style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }} />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#666666" }}>თანხა მაქს.</label>
                <input type="number" value={amountMax} onChange={(e) => { setAmountMax(e.target.value); setPage(1); }}
                  placeholder="999.99" min="0" step="0.01"
                  className="w-full px-3 py-2 rounded-[8px] text-[12px] outline-none transition-all"
                  style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }} />
              </div>

              {/* Clear */}
              <div className="flex items-end lg:col-span-2">
                <button onClick={() => { setSearchCode(""); setDateFrom(""); setDateTo(""); setMerchantFilter("all"); setAmountMin(""); setAmountMax(""); setResultFilter("all"); setPage(1); }}
                  className="px-4 py-2 rounded-[8px] text-[12px] font-semibold transition-all active:scale-[0.97] hover:brightness-125"
                  style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>
                  ფილტრების გასუფთავება / Clear
                </button>
              </div>
            </div>
          )}

          {/* ═══ SUMMARY BAR ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-[12px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#666666" }}>ნაჩვენები TX</p>
              <p className="text-[20px] font-extrabold leading-none" style={{ color: "#FFFFFF" }}>{filtered.length}</p>
            </div>
            <div className="rounded-[12px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#666666" }}>ჯამი თანხა</p>
              <p className="text-[20px] font-extrabold leading-none" style={{ color: "#FFFFFF" }}>{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[12px] font-semibold" style={{ color: "#666666" }}>GEL</span></p>
            </div>
            <div className="rounded-[12px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#666666" }}>ჯამი მოგება</p>
              <p className="text-[20px] font-extrabold leading-none" style={{ color: "#22C55E" }}>{totalWinnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[12px] font-semibold" style={{ color: "#666666" }}>GEL</span></p>
            </div>
            <div className="rounded-[12px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#666666" }}>საშუალო %</p>
              <p className="text-[20px] font-extrabold leading-none" style={{ color: avgPercent < 1 ? "#22C55E" : avgPercent < 2 ? "#F9E741" : "#EF4444" }}>{avgPercent.toFixed(2)}%</p>
            </div>
          </div>

          {/* ═══ TRANSACTIONS TABLE ═══ */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid #252525" }}>
                    {["", "TX Code", "დრო", "მომხმ.", "მერჩანტი", "თანხა", "მოგება", "Win %", "თამაში", "სტატუსი"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-[13px]" style={{ color: "#666666" }}>
                        ტრანზაქციები ვერ მოიძებნა / No transactions found
                      </td>
                    </tr>
                  )}
                  {paginated.map((tx) => {
                    const isExpanded = expandedId === tx.id;
                    const gameCol = GAME_COLORS[tx.gameType];
                    const statusCol = STATUS_COLORS[tx.status];

                    return (
                      <Fragment key={tx.id}>
                        <tr
                          className="transition-all cursor-pointer hover:brightness-110"
                          style={{ borderBottom: "1px solid #1A1A1A", background: isExpanded ? "#1A1A1A" : "transparent" }}
                          onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                        >
                          {/* Expand icon */}
                          <td className="pl-3 pr-1 py-2.5">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"
                              style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                              <polyline points="4,2 8,6 4,10" />
                            </svg>
                          </td>
                          <td className="px-3 py-2.5 text-[12px] font-mono font-medium" style={{ color: "#F9E741" }}>{tx.code}</td>
                          <td className="px-3 py-2.5 text-[11px]" style={{ color: "#666666" }}>
                            {tx.timestamp.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-3 py-2.5 text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{tx.user}</td>
                          <td className="px-3 py-2.5 text-[12px]" style={{ color: "#A0A0A0" }}>{tx.merchant}</td>
                          <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: "#FFFFFF" }}>{tx.amount.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: tx.winnings > 0 ? "#22C55E" : "#666666" }}>
                            {tx.winnings > 0 ? tx.winnings.toFixed(2) : "--"}
                          </td>
                          <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: tx.winPercent === 100 ? "#F9E741" : tx.winPercent > 0 ? "#22C55E" : "#666666" }}>
                            {tx.winPercent > 0 ? `${tx.winPercent}%` : "--"}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: gameCol.bg, color: gameCol.color }}>
                              {tx.gameType}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: statusCol.bg, color: statusCol.color }}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <tr style={{ borderBottom: "1px solid #252525" }}>
                            <td colSpan={10} className="px-4 py-4" style={{ background: "#0D0D0D" }}>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Transaction Details */}
                                <div className="rounded-[8px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666666" }}>ტრანზაქციის დეტალები</p>
                                  <div className="space-y-1.5 text-[12px]">
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>კოდი:</span>
                                      <span className="font-mono font-medium" style={{ color: "#F9E741" }}>{tx.code}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>თარიღი:</span>
                                      <span style={{ color: "#A0A0A0" }}>{tx.timestamp.toLocaleDateString("ka-GE")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>დრო:</span>
                                      <span style={{ color: "#A0A0A0" }}>{tx.timestamp.toLocaleTimeString("ka-GE")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>თანხა:</span>
                                      <span className="font-semibold" style={{ color: "#FFFFFF" }}>{tx.amount.toFixed(2)} GEL</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>მოგება:</span>
                                      <span className="font-semibold" style={{ color: tx.winnings > 0 ? "#22C55E" : "#666666" }}>{tx.winnings > 0 ? `${tx.winnings.toFixed(2)} GEL` : "--"}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Algorithm Decision */}
                                <div className="rounded-[8px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666666" }}>ალგორითმის გადაწყვეტილება</p>
                                  <div className="space-y-1.5 text-[12px]">
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>Seed:</span>
                                      <span className="font-mono" style={{ color: "#A0A0A0" }}>{tx.algorithmSeed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>Pool (TX time):</span>
                                      <span style={{ color: "#A0A0A0" }}>{tx.poolAtTime.toLocaleString("en-US", { minimumFractionDigits: 2 })} GEL</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>Tier:</span>
                                      <span style={{ color: "#F9E741" }}>{tx.tierApplied}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>Result:</span>
                                      <span className="font-semibold" style={{ color: tx.resultType === "no_win" ? "#EF4444" : "#22C55E" }}>
                                        {tx.resultType === "won_minimum" ? "Min 0.5%" : tx.resultType === "won_bonus" ? `Bonus ${tx.winPercent}%` : tx.resultType === "won_100" ? "Full 100%" : "No Win"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* User & Merchant */}
                                <div className="rounded-[8px] p-3 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#666666" }}>მომხმარებელი & მერჩანტი</p>
                                  <div className="space-y-1.5 text-[12px]">
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>User:</span>
                                      <span className="font-medium" style={{ color: "#FFFFFF" }}>{tx.user}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>Merchant:</span>
                                      <span style={{ color: "#A0A0A0" }}>{tx.merchant}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>Game:</span>
                                      <span style={{ color: GAME_COLORS[tx.gameType].color }}>{tx.gameType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span style={{ color: "#666666" }}>Status:</span>
                                      <span className="font-semibold capitalize" style={{ color: STATUS_COLORS[tx.status].color }}>{tx.status}</span>
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

            {/* ═══ PAGINATION ═══ */}
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#252525" }}>
              <p className="text-[11px]" style={{ color: "#666666" }}>
                {filtered.length > 0 ? `${(currentPage - 1) * perPage + 1}-${Math.min(currentPage * perPage, filtered.length)} / ${filtered.length}` : "0 results"}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><polyline points="9,3 5,7 9,11" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-[12px] font-semibold transition-all active:scale-95"
                    style={{ background: p === currentPage ? "#F9E741" : "#1A1A1A", color: p === currentPage ? "#000000" : "#A0A0A0" }}>
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
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
