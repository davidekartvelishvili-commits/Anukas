"use client";

import { useState, useEffect } from "react";

/* ── MOCK DATA ── */
const MOCK_STATS = {
  poolBalance: 142580.50,
  poolMinimum: 50000,
  todayTxCount: 1847,
  todayTxAmount: 28450.00,
  todayWinnings: 245.30,
  activeUsers: 312,
  newRegistrations: 47,
};

const POOL_HISTORY = [
  { day: "Mon", value: 138000 },
  { day: "Tue", value: 141200 },
  { day: "Wed", value: 139800 },
  { day: "Thu", value: 143500 },
  { day: "Fri", value: 140200 },
  { day: "Sat", value: 144100 },
  { day: "Sun", value: 142580 },
];

const RECENT_TX = [
  { time: "14:32", user: "Ana M.", merchant: "Stamba Cafe", amount: 15.50, winnings: 1.55, game: "Spin" },
  { time: "14:28", user: "David K.", merchant: "Dunkin'", amount: 8.20, winnings: 0, game: "Drop" },
  { time: "14:25", user: "Nino J.", merchant: "Wendy's", amount: 22.00, winnings: 4.40, game: "Spin" },
  { time: "14:20", user: "Giorgi T.", merchant: "Luca Polare", amount: 35.00, winnings: 0, game: "Step" },
  { time: "14:15", user: "Mariam S.", merchant: "Coffee Lab", amount: 6.50, winnings: 0.65, game: "Spin" },
  { time: "14:10", user: "Luka B.", merchant: "Pasanauri", amount: 45.00, winnings: 0, game: "Drop" },
  { time: "14:05", user: "Elene R.", merchant: "Bread House", amount: 12.00, winnings: 2.40, game: "Step" },
  { time: "13:58", user: "Tornike A.", merchant: "Stamba Cafe", amount: 9.80, winnings: 0, game: "Spin" },
  { time: "13:52", user: "Salome K.", merchant: "GPC", amount: 120.00, winnings: 12.00, game: "Spin" },
  { time: "13:45", user: "Irakli M.", merchant: "Dunkin'", amount: 18.50, winnings: 0, game: "Drop" },
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: "📊", id: "dashboard" },
  { label: "Algorithm", icon: "⚙️", id: "algorithm" },
  { label: "Users", icon: "👥", id: "users" },
  { label: "Merchants", icon: "🏪", id: "merchants" },
  { label: "Transactions", icon: "💳", id: "transactions" },
  { label: "Games", icon: "🎮", id: "games" },
  { label: "Village", icon: "🏘️", id: "village" },
  { label: "Notifications", icon: "🔔", id: "notifications" },
  { label: "Analytics", icon: "📈", id: "analytics" },
  { label: "System", icon: "🔧", id: "system" },
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

export default function AdminPage() {
  const [now, setNow] = useState(new Date());
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Auth placeholder
  // const session = await getServerSession();
  // if (!session?.user?.isAdmin) redirect("/home");

  const avgPercent = MOCK_STATS.todayTxAmount > 0
    ? ((MOCK_STATS.todayWinnings / MOCK_STATS.todayTxAmount) * 100).toFixed(2)
    : "0.00";
  const avgNum = parseFloat(avgPercent);
  const poolHealthy = MOCK_STATS.poolBalance > MOCK_STATS.poolMinimum;

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
              onClick={() => setActiveNav(item.id)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
              style={{
                background: activeNav === item.id ? "#1A1A1A" : "transparent",
                borderLeft: activeNav === item.id ? "3px solid #F9E741" : "3px solid transparent",
              }}
            >
              <span className="text-[16px]">{item.icon}</span>
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
                <button key={item.id} onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
                  style={{ background: activeNav === item.id ? "#1A1A1A" : "transparent", borderLeft: activeNav === item.id ? "3px solid #F9E741" : "3px solid transparent" }}
                >
                  <span className="text-[16px]">{item.icon}</span>
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
                ₾{MOCK_STATS.poolBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] mt-1" style={{ color: poolHealthy ? "#22C55E" : "#EF4444" }}>
                {poolHealthy ? "● Healthy" : "● Below minimum"}
              </p>
            </div>

            {/* Today's Transactions */}
            <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Transactions / დღის</p>
              <p className="text-[24px] font-extrabold leading-none text-white">{MOCK_STATS.todayTxCount.toLocaleString()}</p>
              <p className="text-[11px] mt-1" style={{ color: "#A0A0A0" }}>₾{MOCK_STATS.todayTxAmount.toLocaleString()}</p>
            </div>

            {/* Today's Winnings */}
            <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Winnings / მოგება</p>
              <p className="text-[24px] font-extrabold leading-none" style={{ color: "#22C55E" }}>₾{MOCK_STATS.todayWinnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
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
              <p className="text-[24px] font-extrabold leading-none" style={{ color: "#3B82F6" }}>{MOCK_STATS.activeUsers}</p>
              <p className="text-[11px] mt-1" style={{ color: "#A0A0A0" }}>Unique today</p>
            </div>

            {/* New Registrations */}
            <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>New Signups / ახალი</p>
              <p className="text-[24px] font-extrabold leading-none" style={{ color: "#3B82F6" }}>{MOCK_STATS.newRegistrations}</p>
              <p className="text-[11px] mt-1" style={{ color: "#A0A0A0" }}>Registrations today</p>
            </div>
          </div>

          {/* ── POOL CHART ── */}
          <div className="rounded-[12px] p-4 border mb-6" style={{ background: "#111111", borderColor: "#252525" }}>
            <p className="text-[13px] font-semibold mb-3" style={{ color: "#A0A0A0" }}>Pool Balance — Last 7 Days</p>
            <MiniChart data={POOL_HISTORY} />
            <div className="flex justify-between mt-2">
              {POOL_HISTORY.map((d) => (
                <span key={d.day} className="text-[10px]" style={{ color: "#666666" }}>{d.day}</span>
              ))}
            </div>
          </div>

          {/* ── RECENT TRANSACTIONS ── */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "#252525" }}>
              <p className="text-[13px] font-semibold" style={{ color: "#A0A0A0" }}>Recent Transactions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid #252525" }}>
                    {["Time", "User", "Merchant", "Amount", "Winnings", "Game"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RECENT_TX.map((tx, i) => (
                    <tr key={i} style={{ borderBottom: i < RECENT_TX.length - 1 ? "1px solid #1A1A1A" : "none" }}>
                      <td className="px-4 py-2.5 text-[12px]" style={{ color: "#666666" }}>{tx.time}</td>
                      <td className="px-4 py-2.5 text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{tx.user}</td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ color: "#A0A0A0" }}>{tx.merchant}</td>
                      <td className="px-4 py-2.5 text-[12px] font-medium" style={{ color: "#FFFFFF" }}>₾{tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-[12px] font-medium" style={{ color: tx.winnings > 0 ? "#22C55E" : "#666666" }}>
                        {tx.winnings > 0 ? `₾${tx.winnings.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                          background: tx.game === "Spin" ? "#F9E74120" : tx.game === "Drop" ? "#3B82F620" : "#22C55E20",
                          color: tx.game === "Spin" ? "#F9E741" : tx.game === "Drop" ? "#3B82F6" : "#22C55E",
                        }}>
                          {tx.game}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
