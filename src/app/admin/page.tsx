"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import { getDashboard, getDashboardGameHistory, getPoolHistory, logoutAdmin } from "@/services/admin";

/* ── DEFAULT STATS (replaced by API on mount) ── */
const MOCK_STATS = {
  poolBalance: 0,
  poolMinimum: 1000,
  todayTxCount: 0,
  todayTxAmount: 0,
  todayWinnings: 0,
  activeUsers: 0,
  newRegistrations: 0,
};

const GAME_TYPE_LABELS: Record<string, string> = {
  slot: "Midnight Machine",
  plinko: "Lucky Drop",
  chicken_rush: "Lucky Step",
};
const GAME_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  slot: { bg: "#F9E74120", color: "#F9E741" },
  plinko: { bg: "#3B82F620", color: "#3B82F6" },
  chicken_rush: { bg: "#22C55E20", color: "#22C55E" },
};

/* ── SVG ICONS ── */
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="10" y="2" width="6" height="6" rx="1" /><rect x="2" y="10" width="6" height="6" rx="1" /><rect x="10" y="10" width="6" height="6" rx="1" /></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="13" cy="5" r="2" /><path d="M14 10c1.7.5 3 2 3 4" /></svg>,
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /><path d="M7 16v-5h4v5" /><path d="M2 6c0 1.1.9 2 2 2s2-.9 2-2" /><path d="M6 6c0 1.1.9 2 2 2s2-.9 2-2" /><path d="M10 6c0 1.1.9 2 2 2s2-.9 2-2" /></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /><path d="M6 7h6" /><path d="M9 7v8" /></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l2-3h10l2 3" /><rect x="2" y="6" width="14" height="10" rx="1" /><path d="M9 6v10" /><path d="M2 6h14" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2.5" /><circle cx="13" cy="6" r="2.5" /><path d="M1 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /><path d="M9 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /></svg>,
    withdrawals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14V4" /><path d="M5 8l4-4 4 4" /><path d="M3 16h12" /></svg>,
    finance: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l3-2 4 3 3-4 4 3v8" /><path d="M2 16h14" /></svg>,
    village: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l7-5.5L16 8v8" /><path d="M6 16v-4h6v4" /><path d="M1 16h16" /></svg>,
    notifications: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 6.5a4.5 4.5 0 10-9 0c0 5-2.25 6.5-2.25 6.5h13.5s-2.25-1.5-2.25-6.5" /><path d="M7.5 15a1.5 1.5 0 003 0" /></svg>,
    analytics: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,14 6,8 10,11 16,4" /><polyline points="12,4 16,4 16,8" /></svg>,
    system: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5a1.5 1.5 0 011.06.44l1.12.96a1 1 0 00.82.24l1.44-.24a1.5 1.5 0 011.74 1.74l-.24 1.44a1 1 0 00.24.82l.96 1.12a1.5 1.5 0 010 2.12l-.96 1.12a1 1 0 00-.24.82l.24 1.44a1.5 1.5 0 01-1.74 1.74l-1.44-.24a1 1 0 00-.82.24l-1.12.96a1.5 1.5 0 01-2.12 0l-1.12-.96a1 1 0 00-.82-.24l-1.44.24a1.5 1.5 0 01-1.74-1.74l.24-1.44a1 1 0 00-.24-.82l-.96-1.12a1.5 1.5 0 010-2.12l.96-1.12a1 1 0 00.24-.82l-.24-1.44A1.5 1.5 0 015.56 2.9l1.44.24a1 1 0 00.82-.24l1.12-.96A1.5 1.5 0 019 1.5z" /><circle cx="9" cy="9" r="2.5" /></svg>,
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
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── SIMPLE SVG CHART ── */
function MiniChart({ data }: { data: { day: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const w = 100;
  const h = 40;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((d.value - min) / range) * h * 0.8 - h * 0.1,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = pathD + ` L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[120px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F9E741" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F9E741" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke="#F9E741" strokeWidth="0.8" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="#F9E741" />
      ))}
    </svg>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(MOCK_STATS);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [poolHistory, setPoolHistory] = useState<{ day: string; value: number }[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Fetch real dashboard data
  useEffect(() => {
    getDashboard().then((data: any) => {
      if (data.success && data.dashboard) {
        const d = data.dashboard;
        setStats({
          poolBalance: d.poolBalance || 0,
          poolMinimum: 1000,
          todayTxCount: d.gamesToday || 0,
          todayTxAmount: d.totalCashbackPaid || 0,
          todayWinnings: d.totalCashbackPaid || 0,
          activeUsers: d.totalUsers || 0,
          newRegistrations: 0,
        });
      }
    }).catch(() => {});

    // Fetch recent game history
    getDashboardGameHistory(20).then((data: any) => {
      if (data.success) setRecentGames(data.history || []);
    }).catch(() => {}).finally(() => setLoadingTx(false));

    // Fetch pool history
    getPoolHistory(7).then((data: any) => {
      if (data.success && data.history) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let runningBalance = data.currentPoolBalance || 0;
        // Build chart: reverse to calculate backwards from current balance
        const reversed = [...data.history].reverse();
        const chartPoints: { day: string; value: number }[] = [];
        for (const entry of reversed) {
          chartPoints.unshift({ day: dayNames[new Date(entry.date).getDay()], value: Math.max(0, runningBalance) });
          runningBalance += entry.totalWon; // add back what was won (going backwards)
        }
        setPoolHistory(chartPoints);
      }
    }).catch(() => {}).finally(() => setLoadingChart(false));
  }, []);

  const avgPercent = stats.todayTxAmount > 0
    ? ((stats.todayWinnings / stats.todayTxAmount) * 100).toFixed(2)
    : "0.00";
  const avgNum = parseFloat(avgPercent);
  const poolHealthy = stats.poolBalance > stats.poolMinimum;

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ── SIDEBAR (Desktop) ── */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r" style={{ background: "#111111", borderColor: "#252525" }}>
        <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
          <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>
            SHANSI
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>Admin Panel</p>
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); router.push(item.href); }}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
              style={{
                background: activeNav === item.id ? "#1A1A1A" : "transparent",
                borderLeft: activeNav === item.id ? "3px solid #F9E741" : "3px solid transparent",
              }}
            >
              <NavIcon id={item.id} active={activeNav === item.id} />
              <span className="text-[13px] font-medium" style={{ color: activeNav === item.id ? "#FFFFFF" : "#A0A0A0" }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
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
                <button key={item.id} onClick={() => { setActiveNav(item.id); setSidebarOpen(false); router.push(item.href); }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
                  style={{ background: activeNav === item.id ? "#1A1A1A" : "transparent", borderLeft: activeNav === item.id ? "3px solid #F9E741" : "3px solid transparent" }}
                >
                  <NavIcon id={item.id} active={activeNav === item.id} />
                  <span className="text-[13px] font-medium" style={{ color: activeNav === item.id ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 py-3 border-b" style={{ background: "#000000", borderColor: "#252525" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md" style={{ background: "#1A1A1A" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="5" x2="15" y2="5" /><line x1="3" y1="9" x2="15" y2="9" /><line x1="3" y1="13" x2="15" y2="13" /></svg>
            </button>
            <h2 className="text-[18px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>SHANSI ADMIN</h2>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-medium" style={{ color: "#FFFFFF" }}>
              {now.toLocaleDateString("ka-GE", { weekday: "short", day: "numeric", month: "short" })}
            </p>
            <p className="text-[11px]" style={{ color: "#666666" }}>
              {now.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6">
            {/* Pool Balance */}
            <div className="col-span-2 lg:col-span-1 rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Pool Balance / ლაივ</p>
              <p className="text-[32px] lg:text-[36px] font-extrabold leading-none" style={{
                color: poolHealthy ? "#F9E741" : "#EF4444",
                textShadow: poolHealthy ? "0 0 20px rgba(249,231,65,0.3)" : "0 0 20px rgba(239,68,68,0.3)",
                animation: "pulse 3s ease-in-out infinite",
              }}>
                ₾{stats.poolBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] mt-1" style={{ color: poolHealthy ? "#22C55E" : "#EF4444" }}>
                {poolHealthy ? "● Healthy" : "● Below minimum"}
              </p>
            </div>

            {/* Today's Transactions */}
            <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Transactions / დღის</p>
              <p className="text-[24px] font-extrabold leading-none text-white">{stats.todayTxCount.toLocaleString()}</p>
              <p className="text-[11px] mt-1" style={{ color: "#A0A0A0" }}>₾{stats.todayTxAmount.toLocaleString()}</p>
            </div>

            {/* Today's Winnings */}
            <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Winnings / მოგება</p>
              <p className="text-[24px] font-extrabold leading-none" style={{ color: "#22C55E" }}>₾{stats.todayWinnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] mt-1" style={{ color: "#A0A0A0" }}>Paid out today</p>
            </div>

            {/* Average % */}
            <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Average % / მიმდინარე</p>
              <p className="text-[24px] font-extrabold leading-none" style={{ color: avgNum < 1 ? "#22C55E" : avgNum < 1.5 ? "#F9E741" : "#EF4444" }}>
                {avgPercent}%
              </p>
              <p className="text-[11px] mt-1" style={{ color: "#A0A0A0" }}>Target: &lt;1%</p>
            </div>

            {/* Active Users */}
            <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Active Users / აქტიური</p>
              <p className="text-[24px] font-extrabold leading-none" style={{ color: "#3B82F6" }}>{stats.activeUsers}</p>
              <p className="text-[11px] mt-1" style={{ color: "#A0A0A0" }}>Unique today</p>
            </div>

            {/* New Registrations */}
            <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>New Signups / ახალი</p>
              <p className="text-[24px] font-extrabold leading-none" style={{ color: "#3B82F6" }}>{stats.newRegistrations}</p>
              <p className="text-[11px] mt-1" style={{ color: "#A0A0A0" }}>Registrations today</p>
            </div>
          </div>

          {/* ── POOL CHART ── */}
          <div className="rounded-[12px] p-4 border mb-6" style={{ background: "#111111", borderColor: "#252525" }}>
            <p className="text-[13px] font-semibold mb-3" style={{ color: "#A0A0A0" }}>Pool Balance — Last 7 Days</p>
            {loadingChart ? (
              <div className="flex items-center justify-center h-[120px]">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
              </div>
            ) : poolHistory.length > 0 ? (
              <>
                <MiniChart data={poolHistory} />
                <div className="flex justify-between mt-2">
                  {poolHistory.map((d, i) => (
                    <span key={i} className="text-[10px]" style={{ color: "#666666" }}>{d.day}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[120px]">
                <p className="text-[12px]" style={{ color: "#666666" }}>No pool data yet</p>
              </div>
            )}
          </div>

          {/* ── RECENT TRANSACTIONS ── */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#252525" }}>
              <p className="text-[13px] font-semibold" style={{ color: "#A0A0A0" }}>Recent Games</p>
            </div>
            {loadingTx ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
                <span className="ml-2 text-[12px]" style={{ color: "#666666" }}>Loading...</span>
              </div>
            ) : recentGames.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px]" style={{ color: "#666666" }}>{"\u10EF\u10D4\u10E0 \u10D0\u10E0 \u10D0\u10E0\u10D8\u10E1 \u10E2\u10E0\u10D0\u10DC\u10D6\u10D0\u10E5\u10EA\u10D8\u10D4\u10D1\u10D8"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #252525" }}>
                      {["\u10DB\u10DD\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10D4\u10DA\u10D8", "\u10D7\u10D0\u10DB\u10D0\u10E8\u10D8", "\u10E5\u10DD\u10D8\u10DC\u10D8", "\u10DB\u10DD\u10D2\u10D4\u10D1\u10D0", "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentGames.map((g: any, i: number) => {
                      const gameColors = GAME_TYPE_COLORS[g.gameType] || { bg: "#A0A0A020", color: "#A0A0A0" };
                      return (
                        <tr key={g.id || i} style={{ borderBottom: i < recentGames.length - 1 ? "1px solid #1A1A1A" : "none" }}>
                          <td className="px-4 py-2.5 text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{g.userName || g.userPhone || "Unknown"}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: gameColors.bg, color: gameColors.color }}>
                              {GAME_TYPE_LABELS[g.gameType] || g.gameType}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[12px] font-medium" style={{ color: "#F9E741" }}>{g.betAmount?.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-[12px] font-medium" style={{ color: g.winAmount > 0 ? "#22C55E" : "#666666" }}>
                            {g.winAmount > 0 ? `\u20BE${g.winAmount.toFixed(2)}` : "\u2014"}
                          </td>
                          <td className="px-4 py-2.5 text-[12px]" style={{ color: "#666666" }}>
                            {g.createdAt ? new Date(g.createdAt).toLocaleString("ka-GE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboardContent />
    </AdminAuthGuard>
  );
}
