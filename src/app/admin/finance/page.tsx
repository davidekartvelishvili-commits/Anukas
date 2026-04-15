"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getFinanceData, getPoolFundingHistory, fundPoolWithNote, getUserFinance, resetLegacyCommissions } from "@/services/admin";

/* ── ICONS ── */
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="10" y="2" width="6" height="6" rx="1" /><rect x="2" y="10" width="6" height="6" rx="1" /><rect x="10" y="10" width="6" height="6" rx="1" /></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" /></svg>,
    "algorithm-test": <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2v5l-3 5h10l-3-5V2" /><path d="M5 2h8" /><circle cx="9" cy="14" r="2" /></svg>,
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
  { label: "Algo Test", id: "algorithm-test", href: "/admin/algorithm-test" },
  { label: "Users", id: "users", href: "/admin/users" },
  { label: "Merchants", id: "merchants", href: "/admin/merchants" },
  { label: "Transactions", id: "transactions", href: "/admin/transactions" },
  { label: "Games", id: "games", href: "/admin/games" },
  { label: "Offers", id: "offers", href: "/admin/offers" },
  { label: "Shansi Drops", id: "tickets", href: "/admin/tickets" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── HELPERS ── */
const fmt = (n: number) => Number(n || 0).toFixed(2);
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (d: number) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0, 10); };
const startOfMonth = () => { const x = new Date(); x.setDate(1); return x.toISOString().slice(0, 10); };
const startOfWeek = () => { const x = new Date(); x.setDate(x.getDate() - x.getDay()); return x.toISOString().slice(0, 10); };

/* ── CHARTS ── */
function LineChart({ data }: { data: { date: string; commission: number; paidOut: number }[] }) {
  if (!data?.length) return null;
  const W = 600, H = 180, P = 30;
  const maxV = Math.max(1, ...data.map(d => Math.max(d.commission, d.paidOut)));
  const xStep = (W - P * 2) / (data.length - 1 || 1);
  const path = (key: "commission" | "paidOut") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${P + i * xStep} ${H - P - (d[key] / maxV) * (H - P * 2)}`).join(" ");
  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`}>
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#252525" strokeWidth="1" />
        <line x1={P} y1={P} x2={P} y2={H - P} stroke="#252525" strokeWidth="1" />
        <path d={path("commission")} fill="none" stroke="#22C55E" strokeWidth="2" />
        <path d={path("paidOut")} fill="none" stroke="#EF4444" strokeWidth="2" />
        {data.map((d, i) => i % 5 === 0 && (
          <text key={i} x={P + i * xStep} y={H - P + 14} fill="#555" fontSize="9" textAnchor="middle">{d.date.slice(5)}</text>
        ))}
      </svg>
      <div className="flex gap-4 text-[11px] mt-1">
        <div className="flex items-center gap-1"><div className="w-3 h-0.5" style={{ background: "#22C55E" }} /><span style={{ color: "#A0A0A0" }}>საკომისიო</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-0.5" style={{ background: "#EF4444" }} /><span style={{ color: "#A0A0A0" }}>გაცემული</span></div>
      </div>
    </div>
  );
}

function PieChart({ data }: { data: { name: string; total: number }[] }) {
  if (!data?.length) return <p className="text-[12px]" style={{ color: "#666" }}>მონაცემები არ არის</p>;
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) return <p className="text-[12px]" style={{ color: "#666" }}>მონაცემები არ არის</p>;
  const colors = ["#F9E741", "#22C55E", "#3B82F6", "#EF4444", "#A855F7", "#F59E0B", "#06B6D4", "#EC4899"];
  let angle = -90;
  const cx = 70, cy = 70, r = 60;
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width="140" height="140">
        {data.slice(0, 8).map((d, i) => {
          const slice = (d.total / total) * 360;
          const a1 = (angle * Math.PI) / 180;
          const a2 = ((angle + slice) * Math.PI) / 180;
          const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
          const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
          const large = slice > 180 ? 1 : 0;
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
          angle += slice;
          return <path key={i} d={path} fill={colors[i % colors.length]} stroke="#111" strokeWidth="1" />;
        })}
      </svg>
      <div className="flex-1 min-w-0 space-y-1">
        {data.slice(0, 8).map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="truncate" style={{ color: "#A0A0A0" }}>{d.name}</span>
            <span className="ml-auto font-semibold" style={{ color: "#FFF" }}>{fmt(d.total)}₾</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MAIN ── */
export default function FinancePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(today());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [poolHistory, setPoolHistory] = useState<any[]>([]);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");

  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, any>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getFinanceData(from, to, page, searchQuery) as any;
      if (d.success) setData(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [from, to, page, searchQuery]);

  const loadPoolHistory = useCallback(async () => {
    try {
      const d = await getPoolFundingHistory() as any;
      if (d.success) setPoolHistory(d.fundings || []);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadPoolHistory(); }, [loadPoolHistory]);

  const setQuickFilter = (type: string) => {
    setPage(1);
    if (type === "today") { setFrom(today()); setTo(today()); }
    else if (type === "week") { setFrom(startOfWeek()); setTo(today()); }
    else if (type === "month") { setFrom(startOfMonth()); setTo(today()); }
    else if (type === "3months") { setFrom(daysAgo(90)); setTo(today()); }
    else if (type === "all") { setFrom(""); setTo(""); }
  };

  const handleFund = async () => {
    const amt = parseFloat(fundAmount);
    if (!amt || amt <= 0) return;
    try {
      await fundPoolWithNote(amt, fundNote || undefined);
      setShowFundModal(false);
      setFundAmount(""); setFundNote("");
      // Reload BOTH finance data (refreshes all summary cards) and pool history
      await Promise.all([loadData(), loadPoolHistory()]);
    } catch (e: any) { alert(e.message); }
  };

  const toggleUserExpand = async (userId: string) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    if (!userDetails[userId]) {
      try {
        const d = await getUserFinance(userId) as any;
        if (d.success) setUserDetails(prev => ({ ...prev, [userId]: d.user }));
      } catch {}
    }
  };

  const exportCSV = () => {
    if (!data?.transactions) return;
    const rows = [
      ["TX ID", "მერჩანტი", "მომხმარებელი", "თანხა", "საკომისიო", "საკომისიო %", "მოგება", "სტატუსი", "თარიღი"],
      ...data.transactions.map((t: any) => [
        t.id, t.merchantName, t.userPhone || t.userName,
        fmt(t.amount), fmt(t.commissionAmount), fmt(t.commissionPercent),
        fmt(t.userWinnings), t.commissionStatus, t.createdAt,
      ]),
    ];
    const csv = rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `finance-${from || "all"}-${to || "all"}.csv`;
    a.click();
  };

  const summary = data?.summary;
  const charts = data?.charts;
  const transactions = data?.transactions || [];
  const pagination = data?.pagination;

  const statusBadge = (s: string) => {
    if (s === "in_pool") return { bg: "#3B82F620", color: "#3B82F6", label: "პულში შეტანილი" };
    if (s === "transferred") return { bg: "#22C55E20", color: "#22C55E", label: "შესრულებული" };
    return { bg: "#F59E0B20", color: "#F59E0B", label: "მოლოდინში" };
  };

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static z-40 top-0 left-0 h-[100dvh] w-[240px] flex flex-col border-r transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} style={{ background: "#0A0A0A", borderColor: "#1A1A1A" }}>
        <div className="p-5 border-b" style={{ borderColor: "#1A1A1A" }}>
          <span className="text-[15px] font-bold tracking-wide" style={{ color: "#F9E741" }}>SHANSI</span>
          <span className="text-[11px] ml-2" style={{ color: "#666" }}>Admin</span>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.id === "finance";
            return (
              <button key={item.id} onClick={() => router.push(item.href)} className="w-full flex items-center gap-3 px-5 py-[10px] transition-all duration-150 hover:bg-white/5" style={{ background: active ? "#F9E74110" : "transparent" }}>
                <NavIcon id={item.id} active={active} />
                <span className="text-[13px]" style={{ color: active ? "#F9E741" : "#A0A0A0" }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="flex items-center px-4 lg:px-8 h-14 border-b" style={{ borderColor: "#1A1A1A", background: "#0A0A0A" }}>
          <button className="lg:hidden p-1 mr-3" onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="7" x2="18" y2="7" /><line x1="4" y1="11" x2="18" y2="11" /><line x1="4" y1="15" x2="18" y2="15" /></svg>
          </button>
          <h1 className="text-[16px] font-semibold flex-1" style={{ color: "#FFFFFF" }}>ფინანსები</h1>
          <button
            onClick={async () => {
              if (!confirm("Legacy pending კომისიების გასწორება (ერთჯერადი)?\n\nესვმარკავს ძველ pending რიგებს როგორც in_pool — pool-ის totalFunded-ის მიხედვით.")) return;
              try {
                const r = await resetLegacyCommissions() as any;
                alert(`გასწორდა ${r.cleared} ჩანაწერი (${r.consumed}₾ / ${r.totalFunded}₾)`);
                loadData();
              } catch (e: any) { alert(e.message); }
            }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:opacity-80 mr-2"
            style={{ background: "#1A1A1A", color: "#F59E0B", border: "1px solid #252525" }}
            title="ერთჯერადი fix legacy pending commissions"
          >Legacy Fix</button>
          <button onClick={exportCSV} className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:opacity-80" style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>ექსპორტი</button>
        </header>

        <div className="p-4 lg:p-6 space-y-5">

          {/* DATE FILTERS + SEARCH */}
          <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {[
                { id: "today", label: "დღეს" },
                { id: "week", label: "ეს კვირა" },
                { id: "month", label: "ეს თვე" },
                { id: "3months", label: "ბოლო 3 თვე" },
                { id: "all", label: "ყველა" },
              ].map(b => (
                <button key={b.id} onClick={() => setQuickFilter(b.id)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:opacity-80"
                  style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>{b.label}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "#666" }}>დან:</span>
                <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="rounded-lg px-2 py-1.5 text-[12px] outline-none" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "#666" }}>მდე:</span>
                <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="rounded-lg px-2 py-1.5 text-[12px] outline-none" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); setPage(1); setSearchQuery(searchInput.trim()); }}
                className="flex items-center gap-2 flex-1 min-w-[200px]"
              >
                <input
                  type="text"
                  placeholder="ძებნა: ტელ., სახელი, transaction ID"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-1.5 text-[12px] outline-none"
                  style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }}
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: "#F9E741", color: "#000" }}>ძებნა</button>
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchInput(""); setSearchQuery(""); setPage(1); }} className="px-3 py-1.5 rounded-lg text-[12px]" style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>×</button>
                )}
              </form>
            </div>
          </div>

          {loading && !data ? (
            <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} /></div>
          ) : summary && (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Pool — large prominent, spans 2 cols on lg */}
                <div className="md:col-span-2 lg:col-span-2 rounded-2xl p-5 border" style={{
                  background: summary.poolStatus === "healthy" ? "#22C55E15" : summary.poolStatus === "low" ? "#F59E0B15" : "#EF444415",
                  borderColor: summary.poolStatus === "healthy" ? "#22C55E40" : summary.poolStatus === "low" ? "#F59E0B40" : "#EF444440"
                }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] mb-1" style={{ color: "#A0A0A0" }}>Pool მიმდინარე ბალანსი</p>
                      <p className="text-[36px] font-extrabold leading-tight" style={{ color: summary.poolStatus === "healthy" ? "#22C55E" : summary.poolStatus === "low" ? "#F59E0B" : "#EF4444" }}>
                        {fmt(summary.poolBalance)}<span className="text-[20px] ml-1">₾</span>
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: "#666" }}>
                        ზღვარი: {fmt(summary.poolMinThreshold)}₾ · მოლოდინში: <span style={{ color: "#F59E0B" }}>{fmt(summary.pendingCommission)}₾</span>
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold" style={{
                        background: summary.poolStatus === "healthy" ? "#22C55E20" : summary.poolStatus === "low" ? "#F59E0B20" : "#EF444420",
                        color: summary.poolStatus === "healthy" ? "#22C55E" : summary.poolStatus === "low" ? "#F59E0B" : "#EF4444",
                      }}>
                        {summary.poolStatus === "healthy" ? "● ჯანსაღი" : summary.poolStatus === "low" ? "● დაბალი" : "● კრიტიკული"}
                      </div>
                    </div>
                    <button onClick={() => setShowFundModal(true)} className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-90 shrink-0"
                      style={{ background: "#F9E741", color: "#000" }}>+ შევსება</button>
                  </div>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <p className="text-[11px] mb-1" style={{ color: "#A0A0A0" }}>ჯამური საკომისიო</p>
                  <p className="text-[22px] font-bold" style={{ color: "#22C55E" }}>{fmt(summary.totalCommission)}<span className="text-[14px] ml-0.5">₾</span></p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>გამოთვლილი ყველა ტრანზაქციიდან</p>
                </div>
                <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <p className="text-[11px] mb-1" style={{ color: "#A0A0A0" }}>მოლოდინში</p>
                  <p className="text-[22px] font-bold" style={{ color: "#F59E0B" }}>{fmt(summary.pendingCommission)}<span className="text-[14px] ml-0.5">₾</span></p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>მერჩანტებიდან მისაღები</p>
                </div>
                <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <p className="text-[11px] mb-1" style={{ color: "#A0A0A0" }}>მიღებული</p>
                  <p className="text-[22px] font-bold" style={{ color: "#3B82F6" }}>{fmt(summary.received)}<span className="text-[14px] ml-0.5">₾</span></p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>რეალურად ჩამოსული თანხა</p>
                </div>
                <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <p className="text-[11px] mb-1" style={{ color: "#A0A0A0" }}>გაცემული (მოგებები)</p>
                  <p className="text-[22px] font-bold" style={{ color: "#EF4444" }}>{fmt(summary.totalPaidOut)}<span className="text-[14px] ml-0.5">₾</span></p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>მომხმარებლების მოგებები</p>
                </div>
                <div className="rounded-2xl p-4 border" style={{
                  background: summary.profit >= 0 ? "#22C55E10" : "#EF444410",
                  borderColor: summary.profit >= 0 ? "#22C55E40" : "#EF444440"
                }}>
                  <p className="text-[11px] mb-1" style={{ color: "#A0A0A0" }}>მოგება (წმინდა)</p>
                  <p className="text-[22px] font-bold" style={{ color: summary.profit >= 0 ? "#22C55E" : "#EF4444" }}>
                    {summary.profit >= 0 ? "+" : ""}{fmt(summary.profit)}<span className="text-[14px] ml-0.5">₾</span>
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>მიღებული − გაცემული</p>
                </div>
              </div>

              {/* CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[13px] font-bold mb-3" style={{ color: "#FFF" }}>დღიური საკომისიო vs გაცემული (30 დღე)</h3>
                  <LineChart data={charts?.daily || []} />
                </div>
                <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[13px] font-bold mb-3" style={{ color: "#FFF" }}>საკომისიო მერჩანტების მიხედვით</h3>
                  <PieChart data={charts?.merchantBreakdown || []} />
                </div>
              </div>

              {/* TRANSACTIONS TABLE */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
                <h3 className="text-[14px] font-bold p-4" style={{ color: "#FFF" }}>გადახდის ტრანზაქციები</h3>
                {transactions.length === 0 ? (
                  <p className="text-center py-8 text-[12px]" style={{ color: "#666" }}>ტრანზაქციები არ მოიძებნა</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12px]">
                        <thead>
                          <tr style={{ borderBottom: "1px solid #252525" }}>
                            {["TX ID", "მერჩანტი", "მომხმარებელი", "თანხა ₾", "საკომისიო ₾", "საკ. %", "მოგება ₾", "სტატუსი", "თარიღი", ""].map((h) => (
                              <th key={h} className="px-3 py-2.5 font-medium" style={{ color: "#666" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx: any) => {
                            const badge = statusBadge(tx.commissionStatus);
                            const expanded = expandedUser === tx.userId;
                            const ud = userDetails[tx.userId];
                            return (
                              <>
                                <tr key={tx.id} style={{ borderBottom: "1px solid #1A1A1A" }} className="hover:bg-white/[0.02]">
                                  <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: "#666" }} title={tx.id}>
                                    <button onClick={() => { navigator.clipboard?.writeText(tx.id); }} className="hover:text-yellow-300">{tx.id.slice(0, 8)}…</button>
                                  </td>
                                  <td className="px-3 py-2.5" style={{ color: "#FFF" }}>{tx.merchantName}</td>
                                  <td className="px-3 py-2.5" style={{ color: "#A0A0A0" }}>{tx.userPhone || tx.userName || "—"}</td>
                                  <td className="px-3 py-2.5 font-medium" style={{ color: "#FFF" }}>{fmt(tx.amount)}</td>
                                  <td className="px-3 py-2.5 font-semibold" style={{ color: "#22C55E" }}>{fmt(tx.commissionAmount)}</td>
                                  <td className="px-3 py-2.5" style={{ color: "#A0A0A0" }}>{fmt(tx.commissionPercent)}%</td>
                                  <td className="px-3 py-2.5 font-medium" style={{ color: tx.userWinnings > 0 ? "#F9E741" : "#666" }}>{fmt(tx.userWinnings)}</td>
                                  <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span></td>
                                  <td className="px-3 py-2.5" style={{ color: "#666" }}>{new Date(tx.createdAt).toLocaleDateString("ka-GE", { month: "short", day: "numeric" })}</td>
                                  <td className="px-3 py-2.5">
                                    <button onClick={() => toggleUserExpand(tx.userId)} className="text-[10px] px-2 py-0.5 rounded-md transition-all hover:opacity-80" style={{ background: "#1A1A1A", color: "#F9E741", border: "1px solid #252525" }}>
                                      {expanded ? "▲" : "▼"}
                                    </button>
                                  </td>
                                </tr>
                                {expanded && ud && (
                                  <tr key={`${tx.id}-detail`} style={{ background: "#0A0A0A" }}>
                                    <td colSpan={10} className="px-3 py-3">
                                      <p className="text-[10px] mb-2 font-mono" style={{ color: "#666" }}>Transaction ID: <span style={{ color: "#F9E741" }}>{tx.id}</span></p>
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[11px]">
                                        <div><span style={{ color: "#666" }}>ჯამური ხარჯი:</span> <b style={{ color: "#FFF" }}>{fmt(ud.totalSpend)}₾</b></div>
                                        <div><span style={{ color: "#666" }}>ჯამური მოგება:</span> <b style={{ color: "#22C55E" }}>{fmt(ud.totalWon)}₾</b></div>
                                        <div><span style={{ color: "#666" }}>მოგების %:</span> <b style={{ color: "#F9E741" }}>{ud.winPercent}%</b></div>
                                        <div><span style={{ color: "#666" }}>თამაშები:</span> <b style={{ color: "#FFF" }}>{ud.gamesPlayed}</b></div>
                                        <div><span style={{ color: "#666" }}>ბონუს რაუნდები:</span> <b style={{ color: "#FFF" }}>{ud.bonusRounds}</b></div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {pagination?.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 p-4 border-t" style={{ borderColor: "#252525" }}>
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-[12px] disabled:opacity-30" style={{ color: "#A0A0A0", border: "1px solid #252525" }}>წინა</button>
                        <span className="text-[12px] px-2" style={{ color: "#666" }}>{page} / {pagination.totalPages}</span>
                        <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-[12px] disabled:opacity-30" style={{ color: "#A0A0A0", border: "1px solid #252525" }}>შემდეგი</button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* POOL FUNDING HISTORY */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
                <h3 className="text-[14px] font-bold p-4" style={{ color: "#FFF" }}>პულის შევსების ისტორია</h3>
                {poolHistory.length === 0 ? (
                  <p className="text-center py-8 text-[12px]" style={{ color: "#666" }}>ჯერ შევსება არ ყოფილა</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr style={{ borderBottom: "1px solid #252525" }}>
                          {["თარიღი", "თანხა", "ადმინი", "შენიშვნა"].map(h => (
                            <th key={h} className="px-4 py-2.5 font-medium" style={{ color: "#666" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {poolHistory.map((f) => (
                          <tr key={f.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                            <td className="px-4 py-2.5" style={{ color: "#A0A0A0" }}>{new Date(f.createdAt).toLocaleString("ka-GE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="px-4 py-2.5 font-bold" style={{ color: "#22C55E" }}>+{fmt(f.amount)}₾</td>
                            <td className="px-4 py-2.5" style={{ color: "#FFF" }}>{f.adminName || "—"}</td>
                            <td className="px-4 py-2.5" style={{ color: "#666" }}>{f.note || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* FUND POOL MODAL */}
        {showFundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowFundModal(false)}>
            <div className="rounded-2xl p-5 w-full max-w-md border" style={{ background: "#111111", borderColor: "#252525" }} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-[16px] font-bold mb-3" style={{ color: "#FFF" }}>პულში თანხის შეტანა</h3>
              <div className="rounded-xl p-3 mb-4" style={{ background: "#F59E0B15", border: "1px solid #F59E0B40" }}>
                <p className="text-[11px]" style={{ color: "#A0A0A0" }}>მოლოდინის ბალანსი</p>
                <p className="text-[18px] font-bold" style={{ color: "#F59E0B" }}>{fmt(summary?.pendingCommission || 0)}₾</p>
              </div>
              <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>თანხა (₾)</label>
              <input type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="0.00"
                className="w-full rounded-lg px-3 py-2.5 text-[14px] outline-none mb-3"
                style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} step="0.01" />
              <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>შენიშვნა (არასავალდებულო)</label>
              <input type="text" value={fundNote} onChange={(e) => setFundNote(e.target.value)} placeholder="..."
                className="w-full rounded-lg px-3 py-2.5 text-[14px] outline-none mb-4"
                style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
              {parseFloat(fundAmount) > (summary?.pendingCommission || 0) && (
                <p className="text-[11px] mb-3" style={{ color: "#F59E0B" }}>⚠ თანხა მოლოდინის ბალანსს აჭარბებს</p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowFundModal(false)} className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>გაუქმება</button>
                <button onClick={handleFund} className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-bold" style={{ background: "#F9E741", color: "#000" }}>დადასტურება</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
