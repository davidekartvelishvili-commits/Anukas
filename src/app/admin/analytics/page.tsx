"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── SVG NAV ICONS ── */
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
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "Notifications", id: "notifications", href: "/admin/notifications" },
  { label: "Analytics", id: "analytics", href: "/admin/analytics" },
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── MOCK DATA GENERATION ── */
function genDays(n: number) {
  const d = new Date(2026, 2, 29);
  return Array.from({ length: n }, (_, i) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - (n - 1 - i));
    return dt.toISOString().slice(5, 10);
  });
}

const DAYS = genDays(30);

function seeded(base: number, variance: number, len: number) {
  const vals: number[] = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    v += (Math.sin(i * 1.7 + 3) * variance * 0.6) + (Math.cos(i * 0.9) * variance * 0.4);
    v = Math.max(base * 0.4, Math.min(base * 1.8, v));
    vals.push(Math.round(v));
  }
  return vals;
}

const DAU_DATA = seeded(320, 40, 30);
const TX_DATA = seeded(1850, 200, 30);
const POOL_DATA = seeded(142000, 5000, 30);

const DAU_7 = DAU_DATA.slice(-7);
const MAU = 4872;
const AVG_TX = 18.4;
const RETENTION = { day1: 72, day7: 48, day30: 31 };

const PROFIT_DIST = [
  { label: "0.5% მინიმუმი", value: 62, color: "#F9E741" },
  { label: "ბონუსი", value: 30, color: "#22C55E" },
  { label: "100% მოგება", value: 8, color: "#EF4444" },
];

const TOP_SPENDERS = [
  { name: "Ana M.", amount: 4820 },
  { name: "Giorgi T.", amount: 3950 },
  { name: "Nino J.", amount: 3640 },
  { name: "David K.", amount: 3120 },
  { name: "Mariam S.", amount: 2890 },
  { name: "Luka B.", amount: 2650 },
  { name: "Elene R.", amount: 2410 },
  { name: "Tornike A.", amount: 2180 },
  { name: "Salome K.", amount: 1950 },
  { name: "Irakli M.", amount: 1720 },
];

const TOP_WINNERS = [
  { name: "Salome K.", amount: 384 },
  { name: "Ana M.", amount: 312 },
  { name: "Nino J.", amount: 267 },
  { name: "Elene R.", amount: 221 },
  { name: "Giorgi T.", amount: 198 },
  { name: "Luka B.", amount: 175 },
  { name: "David K.", amount: 142 },
  { name: "Mariam S.", amount: 118 },
  { name: "Tornike A.", amount: 95 },
  { name: "Irakli M.", amount: 72 },
];

const TOP_MERCHANTS = [
  { name: "Stamba Cafe", txCount: 1245 },
  { name: "Dunkin'", txCount: 1102 },
  { name: "Luca Polare", txCount: 987 },
  { name: "Coffee Lab", txCount: 854 },
  { name: "Pasanauri", txCount: 721 },
];

/* ── SVG CHART HELPERS ── */
function MiniSparkline({ data, color = "#F9E741" }: { data: number[]; color?: string }) {
  const w = 80, h = 28;
  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LineChart({ data, labels, color = "#F9E741", h = 180 }: { data: number[]; labels: string[]; color?: string; h?: number }) {
  const w = 600, pad = 40, pb = 24;
  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const cw = w - pad, ch = h - pb;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (cw - 10),
    y: 8 + ch - ((v - mn) / range) * (ch - 16),
  }));
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${pts[0].x},${ch + 8} ${line} ${pts[pts.length - 1].x},${ch + 8}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`lg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = 8 + ch - f * (ch - 16);
        const val = Math.round(mn + f * range);
        return (
          <g key={f}>
            <line x1={pad} y1={y} x2={w - 10} y2={y} stroke="#252525" strokeWidth="0.5" />
            <text x={pad - 6} y={y + 3} fill="#666666" fontSize="9" textAnchor="end">{val}</text>
          </g>
        );
      })}
      <polygon points={area} fill={`url(#lg-${color.replace("#", "")})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} opacity={i === pts.length - 1 ? 1 : 0} />
      ))}
      {labels.filter((_, i) => i % 5 === 0).map((l, idx) => {
        const i = idx * 5;
        return <text key={i} x={pts[i]?.x || 0} y={h - 4} fill="#666666" fontSize="8" textAnchor="middle">{l}</text>;
      })}
    </svg>
  );
}

function BarChart({ data, labels, color = "#22C55E", h = 180 }: { data: number[]; labels: string[]; color?: string; h?: number }) {
  const w = 600, pad = 40, pb = 24;
  const mx = Math.max(...data);
  const cw = w - pad - 10, ch = h - pb;
  const barW = (cw / data.length) * 0.65;
  const gap = cw / data.length;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = 8 + ch - f * (ch - 16);
        const val = Math.round(f * mx);
        return (
          <g key={f}>
            <line x1={pad} y1={y} x2={w - 10} y2={y} stroke="#252525" strokeWidth="0.5" />
            <text x={pad - 6} y={y + 3} fill="#666666" fontSize="9" textAnchor="end">{val}</text>
          </g>
        );
      })}
      {data.map((v, i) => {
        const bh = (v / mx) * (ch - 16);
        const x = pad + i * gap + (gap - barW) / 2;
        const y = 8 + ch - bh;
        return <rect key={i} x={x} y={y} width={barW} height={bh} rx="2" fill={color} opacity="0.85" />;
      })}
      {labels.filter((_, i) => i % 5 === 0).map((l, idx) => {
        const i = idx * 5;
        const x = pad + i * gap + gap / 2;
        return <text key={i} x={x} y={h - 4} fill="#666666" fontSize="8" textAnchor="middle">{l}</text>;
      })}
    </svg>
  );
}

function AreaChart({ data, labels, color = "#F9E741", h = 180 }: { data: number[]; labels: string[]; color?: string; h?: number }) {
  const w = 600, pad = 50, pb = 24;
  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const cw = w - pad - 10, ch = h - pb;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * cw,
    y: 8 + ch - ((v - mn) / range) * (ch - 16),
  }));
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${pts[0].x},${ch + 8} ${line} ${pts[pts.length - 1].x},${ch + 8}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`area-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = 8 + ch - f * (ch - 16);
        const val = Math.round(mn + f * range);
        return (
          <g key={f}>
            <line x1={pad} y1={y} x2={w - 10} y2={y} stroke="#252525" strokeWidth="0.5" />
            <text x={pad - 6} y={y + 3} fill="#666666" fontSize="9" textAnchor="end">{val.toLocaleString()}</text>
          </g>
        );
      })}
      <polygon points={area} fill={`url(#area-${color.replace("#", "")})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {labels.filter((_, i) => i % 5 === 0).map((l, idx) => {
        const i = idx * 5;
        return <text key={i} x={pts[i]?.x || 0} y={h - 4} fill="#666666" fontSize="8" textAnchor="middle">{l}</text>;
      })}
    </svg>
  );
}

function DonutChart({ segments, size = 160 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const r = 56, cx = size / 2, cy = size / 2, sw = 18;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cum = 0;
  const arcs = segments.map((seg) => {
    const start = cum / total;
    cum += seg.value;
    const end = cum / total;
    const a1 = (start * 360 - 90) * (Math.PI / 180);
    const a2 = (end * 360 - 90) * (Math.PI / 180);
    const large = end - start > 0.5 ? 1 : 0;
    return {
      ...seg,
      d: `M ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)}`,
      pct: Math.round((seg.value / total) * 100),
    };
  });
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="round" />
        ))}
        <text x={cx} y={cy - 4} fill="#FFFFFF" fontSize="16" fontWeight="bold" textAnchor="middle">{total}%</text>
        <text x={cx} y={cy + 12} fill="#666666" fontSize="9" textAnchor="middle">Total</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
            <span className="text-[11px]" style={{ color: "#A0A0A0" }}>{a.label} ({a.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function AnalyticsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<"7d" | "14d" | "30d">("30d");

  const sliceLen = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
  const slicedDays = DAYS.slice(-sliceLen);
  const slicedDAU = DAU_DATA.slice(-sliceLen);
  const slicedTX = TX_DATA.slice(-sliceLen);
  const slicedPool = POOL_DATA.slice(-sliceLen);

  const currentDAU = DAU_DATA[DAU_DATA.length - 1];
  const dauTrend = ((currentDAU - DAU_7[0]) / DAU_7[0] * 100).toFixed(1);
  const dauUp = Number(dauTrend) >= 0;

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
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150"
              style={{ background: item.id === "analytics" ? "#1A1A1A" : "transparent", borderLeft: item.id === "analytics" ? "3px solid #F9E741" : "3px solid transparent" }}>
              <NavIcon id={item.id} active={item.id === "analytics"} />
              <span className="text-[13px] font-medium" style={{ color: item.id === "analytics" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150"
                  style={{ background: item.id === "analytics" ? "#1A1A1A" : "transparent", borderLeft: item.id === "analytics" ? "3px solid #F9E741" : "3px solid transparent" }}>
                  <NavIcon id={item.id} active={item.id === "analytics"} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === "analytics" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 hover:opacity-80" style={{ background: "#1A1A1A" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="5" x2="15" y2="5" /><line x1="3" y1="9" x2="15" y2="9" /><line x1="3" y1="13" x2="15" y2="13" /></svg>
            </button>
            <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>ANALYTICS</h2>
          </div>
          {/* Date Range Filter */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "#111111" }}>
            {(["7d", "14d", "30d"] as const).map((r) => (
              <button key={r} onClick={() => setDateRange(r)}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150"
                style={{ background: dateRange === r ? "#1A1A1A" : "transparent", color: dateRange === r ? "#F9E741" : "#666666", border: dateRange === r ? "1px solid #252525" : "1px solid transparent" }}>
                {r === "7d" ? "7 დღე" : r === "14d" ? "14 დღე" : "30 დღე"}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-5">
          {/* ── METRIC CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* DAU */}
            <div className="rounded-2xl p-4 border transition-all duration-200 hover:border-[#F9E741]/30" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium" style={{ color: "#666666" }}>DAU</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: dauUp ? "#22C55E20" : "#EF444420", color: dauUp ? "#22C55E" : "#EF4444" }}>
                  {dauUp ? "+" : ""}{dauTrend}%
                </span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-[24px] font-extrabold leading-none" style={{ color: "#FFFFFF" }}>{currentDAU.toLocaleString()}</p>
                <MiniSparkline data={DAU_7} color={dauUp ? "#22C55E" : "#EF4444"} />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: "#666666" }}>7 დღის ტრენდი</p>
            </div>

            {/* MAU */}
            <div className="rounded-2xl p-4 border transition-all duration-200 hover:border-[#F9E741]/30" style={{ background: "#111111", borderColor: "#252525" }}>
              <span className="text-[11px] font-medium" style={{ color: "#666666" }}>MAU</span>
              <p className="text-[24px] font-extrabold leading-none mt-2" style={{ color: "#FFFFFF" }}>{MAU.toLocaleString()}</p>
              <p className="text-[10px] mt-1.5" style={{ color: "#666666" }}>თვიური აქტიური</p>
            </div>

            {/* Avg Transaction */}
            <div className="rounded-2xl p-4 border transition-all duration-200 hover:border-[#F9E741]/30" style={{ background: "#111111", borderColor: "#252525" }}>
              <span className="text-[11px] font-medium" style={{ color: "#666666" }}>საშ. ტრანზაქცია</span>
              <p className="text-[24px] font-extrabold leading-none mt-2" style={{ color: "#FFFFFF" }}>{AVG_TX.toFixed(1)}<span className="text-[14px] ml-0.5" style={{ color: "#A0A0A0" }}>&#8382;</span></p>
              <p className="text-[10px] mt-1.5" style={{ color: "#666666" }}>თანხა / ტრანზაქცია</p>
            </div>

            {/* Retention */}
            <div className="rounded-2xl p-4 border transition-all duration-200 hover:border-[#F9E741]/30" style={{ background: "#111111", borderColor: "#252525" }}>
              <span className="text-[11px] font-medium" style={{ color: "#666666" }}>Retention</span>
              <div className="flex items-end gap-3 mt-2">
                <div>
                  <p className="text-[20px] font-extrabold leading-none" style={{ color: "#22C55E" }}>{RETENTION.day1}%</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "#666666" }}>D1</p>
                </div>
                <div>
                  <p className="text-[16px] font-bold leading-none" style={{ color: "#F9E741" }}>{RETENTION.day7}%</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "#666666" }}>D7</p>
                </div>
                <div>
                  <p className="text-[14px] font-bold leading-none" style={{ color: "#A0A0A0" }}>{RETENTION.day30}%</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "#666666" }}>D30</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── CHARTS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: DAU Line */}
            <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1.5 -mt-0.5"><circle cx="7" cy="6" r="3" /><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>
                  მომხმარებლები
                </h3>
                <span className="text-[10px]" style={{ color: "#666666" }}>DAU / {dateRange}</span>
              </div>
              <LineChart data={slicedDAU} labels={slicedDays} color="#F9E741" />
            </div>

            {/* Chart 2: TX Bar */}
            <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1.5 -mt-0.5"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>
                  ტრანზაქციები
                </h3>
                <span className="text-[10px]" style={{ color: "#666666" }}>დღიური / {dateRange}</span>
              </div>
              <BarChart data={slicedTX} labels={slicedDays} color="#22C55E" />
            </div>

            {/* Chart 3: Pool Area */}
            <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1.5 -mt-0.5"><polyline points="2,14 6,8 10,11 16,4" /><polyline points="12,4 16,4 16,8" /></svg>
                  Pool ისტორია
                </h3>
                <span className="text-[10px]" style={{ color: "#666666" }}>ბალანსი / {dateRange}</span>
              </div>
              <AreaChart data={slicedPool} labels={slicedDays} color="#F9E741" />
            </div>

            {/* Chart 4: Donut */}
            <div className="rounded-2xl p-4 border flex flex-col items-center justify-center" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="w-full flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1.5 -mt-0.5"><circle cx="9" cy="9" r="7" /><path d="M9 2v7l5 3" /></svg>
                  მოგების განაწილება
                </h3>
                <span className="text-[10px]" style={{ color: "#666666" }}>წილი %</span>
              </div>
              <DonutChart segments={PROFIT_DIST} />
            </div>
          </div>

          {/* ── LEADERBOARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Top Spenders */}
            <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,14 6,8 10,11 16,4" /><polyline points="12,4 16,4 16,8" /></svg>
                <h3 className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>Top 10 - დახარჯვა</h3>
              </div>
              <div className="space-y-1.5">
                {TOP_SPENDERS.map((u, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.03]" style={{ borderBottom: i < 9 ? "1px solid #1A1A1A" : "none" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] w-4 text-center font-bold" style={{ color: i < 3 ? "#F9E741" : "#666666" }}>{i + 1}</span>
                      <span className="text-[12px]" style={{ color: "#FFFFFF" }}>{u.name}</span>
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: "#A0A0A0" }}>{u.amount.toLocaleString()} &#8382;</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Winners */}
            <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /></svg>
                <h3 className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>Top 10 - მოგება</h3>
              </div>
              <div className="space-y-1.5">
                {TOP_WINNERS.map((u, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.03]" style={{ borderBottom: i < 9 ? "1px solid #1A1A1A" : "none" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] w-4 text-center font-bold" style={{ color: i < 3 ? "#22C55E" : "#666666" }}>{i + 1}</span>
                      <span className="text-[12px]" style={{ color: "#FFFFFF" }}>{u.name}</span>
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: "#22C55E" }}>+{u.amount} &#8382;</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Merchants */}
            <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /><path d="M7 16v-5h4v5" /></svg>
                <h3 className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>Top 5 - მერჩანტები</h3>
              </div>
              <div className="space-y-2">
                {TOP_MERCHANTS.map((m, i) => {
                  const maxTx = TOP_MERCHANTS[0].txCount;
                  const pct = (m.txCount / maxTx) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-4 text-center font-bold" style={{ color: i < 3 ? "#F9E741" : "#666666" }}>{i + 1}</span>
                          <span className="text-[12px]" style={{ color: "#FFFFFF" }}>{m.name}</span>
                        </div>
                        <span className="text-[11px] font-semibold" style={{ color: "#A0A0A0" }}>{m.txCount.toLocaleString()} tx</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden ml-6" style={{ background: "#1A1A1A" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #F9E741, #F9E741${i > 1 ? "80" : ""})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
