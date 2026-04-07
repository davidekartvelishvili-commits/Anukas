"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { startSimulation, pollSimulation, getSimulationHistory, getGameConfig, getPool } from "@/services/admin";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

/* ── SVG ICONS ── */
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
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "System", id: "system", href: "/admin/system" },
];
const CURRENT_PAGE = "algorithm-test";

const SCENARIOS = [
  { id: "low", label: "დაბალი ხარჯი", range: "1-5₾" },
  { id: "medium", label: "საშუალო ხარჯი", range: "5-20₾" },
  { id: "high", label: "მაღალი ხარჯი", range: "20-100₾" },
  { id: "mixed", label: "შერეული", range: "1-100₾" },
];

function Histogram({ data, maxCount }: { data: { range: string; count: number }[]; maxCount: number }) {
  if (!data || data.length === 0) return null;
  const barW = Math.max(24, Math.floor(560 / data.length));
  const chartH = 140;
  return (
    <div className="overflow-x-auto">
      <svg width={data.length * (barW + 4) + 40} height={chartH + 40}>
        {data.map((d, i) => {
          const h = maxCount > 0 ? (d.count / maxCount) * chartH : 0;
          const x = 20 + i * (barW + 4);
          return (
            <g key={i}>
              <rect x={x} y={chartH - h} width={barW} height={h} rx={3} fill="#F9E741" opacity={0.8} />
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fill="#666" fontSize="9">{d.count}</text>
              {i % 2 === 0 && <text x={x + barW / 2} y={chartH + 28} textAnchor="middle" fill="#555" fontSize="7">{d.range.split("-")[0]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CheckItem({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[16px]">{pass ? "\u2705" : "\u274C"}</span>
      <span className="text-[13px]" style={{ color: pass ? "#22C55E" : "#EF4444" }}>{label}</span>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
      <p className="text-[11px] mb-1" style={{ color: "#666666" }}>{label}</p>
      <p className="text-[20px] font-bold" style={{ color: color || "#FFFFFF" }}>{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: "#A0A0A0" }}>{sub}</p>}
    </div>
  );
}

function AlgoTestContent() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  const [userCount, setUserCount] = useState(1000);
  const [scenario, setScenario] = useState("mixed");
  const [availableGameTypes, setAvailableGameTypes] = useState<string[]>([]);
  const [selectedGameTypes, setSelectedGameTypes] = useState<string[]>(["plinko"]);

  // Live DB params (read-only display)
  const [dbParams, setDbParams] = useState<any>(null);
  const [poolBalance, setPoolBalance] = useState(0);

  // Job
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);

  useEffect(() => {
    loadHistory();
    getGameConfig().then((data: any) => {
      if (data.success && data.configs?.length > 0) {
        setAvailableGameTypes(data.configs.map((c: any) => c.gameType));
        setSelectedGameTypes([data.configs[0].gameType]);
        setDbParams(data.configs[0]);
      }
    }).catch(() => {});
    getPool().then((data: any) => {
      if (data.success && data.pool) setPoolBalance(data.pool.balance || 0);
    }).catch(() => {});
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getSimulationHistory() as any;
      if (data.success) setHistory(data.runs || []);
    } catch {}
  };

  const stopPolling = useCallback(() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }, []);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const data = await pollSimulation(id) as any;
        if (data.success) {
          setProgress(data.progress || 0);
          setTotal(data.total || 0);
          if (data.status === "complete" && data.results) { setResults(data.results); setRunning(false); stopPolling(); loadHistory(); }
          else if (data.status === "error") { setError(data.results?.error || "Simulation failed"); setRunning(false); stopPolling(); }
        }
      } catch (err: any) { setError(err.message); setRunning(false); stopPolling(); }
    }, 2000);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleRun = async () => {
    if (running) return;
    setRunning(true); setResults(null); setError(null); setProgress(0); setTotal(userCount); setShowLog(false);
    try {
      const data = await startSimulation({ userCount, scenario, gameTypes: selectedGameTypes }) as any;
      if (data.success && data.jobId) startPolling(data.jobId);
      else throw new Error(data.message || "Failed to start");
    } catch (err: any) { setError(err.message); setRunning(false); }
  };

  const r = results;
  const allPassed = r?.checks && Object.values(r.checks).every(Boolean);
  const maxHist = r?.histogram ? Math.max(...r.histogram.map((h: any) => h.count)) : 0;
  const gameLabels: Record<string, string> = { plinko: "Lucky Drop", slot: "Slot", chicken_rush: "Lucky Step" };

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r" style={{ background: "#111111", borderColor: "#252525" }}>
        <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
          <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>SHANSI</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>Admin Panel</p>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => router.push(item.href)} className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
              style={{ background: item.id === CURRENT_PAGE ? "#1A1A1A" : "transparent", borderLeft: item.id === CURRENT_PAGE ? "3px solid #F9E741" : "3px solid transparent" }}>
              <NavIcon id={item.id} active={item.id === CURRENT_PAGE} />
              <span className="text-[13px] font-medium" style={{ color: item.id === CURRENT_PAGE ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside className="absolute left-0 top-0 bottom-0 w-[250px] border-r flex flex-col" style={{ background: "#111111", borderColor: "#252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b" style={{ borderColor: "#252525" }}><h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>SHANSI</h1></div>
            <nav className="flex-1 py-3 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <button key={item.id} onClick={() => { router.push(item.href); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
                  style={{ background: item.id === CURRENT_PAGE ? "#1A1A1A" : "transparent", borderLeft: item.id === CURRENT_PAGE ? "3px solid #F9E741" : "3px solid transparent" }}>
                  <NavIcon id={item.id} active={item.id === CURRENT_PAGE} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === CURRENT_PAGE ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 py-3 border-b" style={{ background: "#000000", borderColor: "#252525" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md" style={{ background: "#1A1A1A" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="5" x2="15" y2="5" /><line x1="3" y1="9" x2="15" y2="9" /><line x1="3" y1="13" x2="15" y2="13" /></svg>
            </button>
            <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>ALGORITHM TEST</h2>
          </div>
          <p className="text-[11px]" style={{ color: "#666666" }}>{now.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
        </header>

        <div className="p-4 lg:p-6 space-y-5">

          {/* ── CURRENT DB PARAMS (read-only) ── */}
          {dbParams && (
            <div className="rounded-2xl p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[14px] font-bold" style={{ color: "#FFFFFF" }}>მიმდინარე პარამეტრები</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "#3B82F620", color: "#3B82F6" }}>DB-დან</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "საშუალო დაბრუნება", val: `${dbParams.avgReturnPercent}%` },
                  { label: "მაქს. მოგება", val: `${dbParams.maxWinPerUser}₾` },
                  { label: "Pool მინიმუმი", val: `${dbParams.poolMinimumThreshold}₾` },
                  { label: "100% ზღვარი", val: `${dbParams.fullReturnThreshold}₾` },
                  { label: "მინ. გარანტია", val: `${dbParams.minReturnPercent}%` },
                  { label: "Pool ბალანსი", val: `${poolBalance.toFixed(2)}₾` },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl p-2.5" style={{ background: "#0A0A0A", border: "1px solid #1A1A1A" }}>
                    <p className="text-[9px] mb-0.5" style={{ color: "#555" }}>{label}</p>
                    <p className="text-[15px] font-bold" style={{ color: "#F9E741" }}>{val}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color: "#444" }}>სიმულაცია ამ პარამეტრებს იყენებს. ცვლილებისთვის — Algorithm Settings.</p>
            </div>
          )}

          {/* ── CONTROLS ── */}
          <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFFFFF" }}>სიმულაცია</h3>

            {/* User count */}
            <div className="mb-4">
              <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>მომხმარებლების რაოდენობა</label>
              <div className="flex flex-wrap gap-2">
                {[100, 1000, 5000, 10000].map((n) => (
                  <button key={n} onClick={() => setUserCount(n)} className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                    style={{ background: userCount === n ? "#F9E741" : "#1A1A1A", color: userCount === n ? "#000" : "#A0A0A0", border: `1px solid ${userCount === n ? "#F9E741" : "#252525"}` }}>
                    {n.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario */}
            <div className="mb-4">
              <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>ხარჯის სცენარი</label>
              <div className="flex flex-wrap gap-2">
                {SCENARIOS.map((s) => (
                  <button key={s.id} onClick={() => setScenario(s.id)} className="px-4 py-2 rounded-xl text-[12px] font-medium transition-all"
                    style={{ background: scenario === s.id ? "#F9E741" : "#1A1A1A", color: scenario === s.id ? "#000" : "#A0A0A0", border: `1px solid ${scenario === s.id ? "#F9E741" : "#252525"}` }}>
                    {s.label} <span className="opacity-60">({s.range})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Game types */}
            <div className="mb-5">
              <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>თამაშის ტიპი</label>
              <div className="flex flex-wrap gap-2">
                {(availableGameTypes.length > 0 ? availableGameTypes : ["plinko", "slot", "chicken_rush"]).map((gt) => {
                  const sel = selectedGameTypes.includes(gt);
                  return (
                    <button key={gt} onClick={() => sel && selectedGameTypes.length > 1 ? setSelectedGameTypes(selectedGameTypes.filter(t => t !== gt)) : !sel ? setSelectedGameTypes([...selectedGameTypes, gt]) : null}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                      style={{ background: sel ? "#F9E741" : "#1A1A1A", color: sel ? "#000" : "#A0A0A0", border: `1px solid ${sel ? "#F9E741" : "#252525"}` }}>
                      {gameLabels[gt] || gt}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleRun} disabled={running} className="w-full md:w-auto px-8 py-3 rounded-xl text-[14px] font-bold transition-all duration-150"
              style={{ background: running ? "#333" : "#F9E741", color: running ? "#666" : "#000", cursor: running ? "not-allowed" : "pointer" }}>
              {running ? "მიმდინარეობს..." : "ტესტის გაშვება"}
            </button>

            {running && (
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
                  <span className="text-[13px]" style={{ color: "#A0A0A0" }}>სიმულაცია მიმდინარეობს... {progress}/{total}</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#1A1A1A" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ background: "#F9E741", width: `${total > 0 ? (progress / total) * 100 : 0}%` }} />
                </div>
              </div>
            )}
            {error && <div className="mt-3 px-3 py-2 rounded-lg text-[13px]" style={{ background: "#EF444420", color: "#EF4444" }}>{error}</div>}
          </div>

          {/* ── RESULTS ── */}
          {r && (
            <>
              <div className="rounded-2xl p-4 border" style={{ background: allPassed ? "#22C55E10" : "#EF444410", borderColor: allPassed ? "#22C55E40" : "#EF444440" }}>
                <div className="flex items-center gap-3">
                  <span className="text-[24px]">{allPassed ? "\u2705" : "\u26A0\uFE0F"}</span>
                  <div>
                    <p className="text-[16px] font-bold" style={{ color: allPassed ? "#22C55E" : "#EF4444" }}>
                      {allPassed ? "ყველა ტესტი წარმატებულია" : "ზოგიერთი ტესტი ვერ გაიარა"}
                    </p>
                    <p className="text-[11px]" style={{ color: "#A0A0A0" }}>
                      {r.userCount.toLocaleString()} მომხმარებელი | {r.scenario} | {(r.gameTypes || []).map((g: string) => gameLabels[g] || g).join(", ")} | {r.durationMs}ms
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatCard label="საშუალო დაბრუნება %" value={`${r.actualAvgReturnPercent}%`} sub={`target: ${r.targetAvgReturnPercent}%`}
                  color={Math.abs(r.actualAvgReturnPercent - r.targetAvgReturnPercent) <= 0.5 ? "#22C55E" : "#EF4444"} />
                <StatCard label="მინიმუმ გარანტია" value={`${r.userCount - r.guaranteeMissCount}/${r.userCount}`} sub="მომხმარებელმა მიიღო" color={r.guaranteeMissCount === 0 ? "#22C55E" : "#EF4444"} />
                <StatCard label="გარანტიის Top-up" value={`${r.guaranteeTopUpCount}`} sub="მომხმარებელს დაემატა" color="#3B82F6" />
                <StatCard label="Pool საწყისი" value={`${r.poolStartBalance.toFixed(2)}₾`} sub={`გაცემა: ${r.poolTotalPaidOut.toFixed(2)}₾`} />
                <StatCard label="Pool დარჩენილი" value={`${r.poolEndBalance.toFixed(2)}₾`} color={r.poolEndBalance >= 0 ? "#22C55E" : "#EF4444"} />
              </div>

              {/* Stats + Checks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFFFFF" }}>სტატისტიკა</h3>
                  {[
                    { l: "ჯამური ხარჯი", v: `${r.totalSpend?.toFixed(2)}₾` },
                    { l: "ჯამური გაცემა", v: `${r.totalCashWon?.toFixed(2)}₾` },
                    { l: "მინ. cashback", v: `${r.minCashback}₾` },
                    { l: "მაქს. cashback", v: `${r.maxCashback}₾` },
                    { l: "მედიანა", v: `${r.medianCashback}₾` },
                    { l: "საშუალო", v: `${r.meanCashback}₾` },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex justify-between py-1.5 border-b" style={{ borderColor: "#1A1A1A" }}>
                      <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{l}</span>
                      <span className="text-[13px] font-semibold" style={{ color: "#FFFFFF" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFFFFF" }}>ტესტები</h3>
                  <CheckItem pass={r.checks.avgReturnMatch} label={`საშუალო დაბრუნება: ${r.actualAvgReturnPercent}% vs ${r.targetAvgReturnPercent}% (±0.5%)`} />
                  <CheckItem pass={r.checks.allGuaranteesMet} label={`გარანტია: ${r.guaranteeMissCount} miss`} />
                  <CheckItem pass={r.checks.noMaxWinViolations} label={`მაქს. მოგება: ${r.maxWinViolationCount} violation`} />
                  <CheckItem pass={r.checks.poolNotNegative} label={`Pool: ${r.poolEndBalance.toFixed(2)}₾`} />
                  <CheckItem pass={r.checks.masterSwitchOffTest} label="Master OFF = 0 ბონუს" />
                </div>
              </div>

              {/* Histogram */}
              <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
                <h3 className="text-[14px] font-bold mb-3" style={{ color: "#FFFFFF" }}>მოგების განაწილება</h3>
                <Histogram data={r.histogram} maxCount={maxHist} />
              </div>

              {/* ── SAMPLE USER LOG (proof) ── */}
              {r.sampleUsers && r.sampleUsers.length > 0 && (
                <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <button onClick={() => setShowLog(!showLog)} className="flex items-center gap-2 w-full text-left">
                    <span className="text-[14px] font-bold" style={{ color: "#FFFFFF" }}>სიმულაციის ლოგი (პირველი 10 მომხმარებელი)</span>
                    <span className="text-[12px]" style={{ color: "#666" }}>{showLog ? "▲" : "▼"}</span>
                  </button>
                  <p className="text-[10px] mt-1 mb-3" style={{ color: "#555" }}>რეალური ალგორითმის შედეგები — ხელით შეგიძლიათ გადაამოწმოთ</p>

                  {showLog && (
                    <div className="space-y-2">
                      {r.sampleUsers.map((u: any) => {
                        const expectedMin = (u.spendAmount * (r.config?.minReturnPercent || 0) / 100);
                        return (
                          <div key={u.index} className="rounded-xl p-3 text-[11px]" style={{ background: "#0A0A0A", border: "1px solid #1A1A1A" }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-bold" style={{ color: "#F9E741" }}>User #{u.index}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: u.guaranteeMet ? "#22C55E20" : "#EF444420", color: u.guaranteeMet ? "#22C55E" : "#EF4444" }}>
                                {u.guaranteeMet ? "GUARANTEE MET" : "GUARANTEE MISS"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5" style={{ color: "#A0A0A0" }}>
                              <span>ხარჯი: <b style={{ color: "#FFF" }}>{u.spendAmount}₾</b></span>
                              <span>თამაშები: <b style={{ color: "#FFF" }}>{u.gamesPlayed}</b> ({u.gamesWon} win)</span>
                              <span>ბუნებრივი: <b style={{ color: "#FFF" }}>{u.naturalCashback}₾</b></span>
                              <span>გარანტია: <b style={{ color: "#FFF" }}>{u.guaranteedMinimum}₾</b></span>
                              <span>Top-up: <b style={{ color: u.guaranteeTopUp > 0 ? "#F9E741" : "#FFF" }}>{u.guaranteeTopUp}₾</b></span>
                              <span>საბოლოო: <b style={{ color: "#22C55E" }}>{u.finalCashback}₾</b></span>
                              <span className="md:col-span-2" style={{ color: "#555" }}>მოსალოდნელი მინ: {expectedMin.toFixed(4)}₾</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── HISTORY ── */}
          <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFFFFF" }}>ისტორია</h3>
            {history.length === 0 ? (
              <p className="text-[12px]" style={{ color: "#666" }}>ჯერ ტესტი არ ჩატარებულა</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr style={{ borderBottom: "1px solid #252525" }}>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "#666" }}>თარიღი</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "#666" }}>მომხმ.</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "#666" }}>სცენარი</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "#666" }}>სტატუსი</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "#666" }}>შედეგი</th>
                  </tr></thead>
                  <tbody>{history.map((run) => {
                    const ok = run.results?.checks && Object.values(run.results.checks).every(Boolean);
                    return (
                      <tr key={run.id} style={{ borderBottom: "1px solid #1A1A1A" }} className="cursor-pointer hover:opacity-80" onClick={() => setExpandedHistoryId(expandedHistoryId === run.id ? null : run.id)}>
                        <td className="py-2 px-2" style={{ color: "#A0A0A0" }}>{run.createdAt ? new Date(run.createdAt).toLocaleString("ka-GE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                        <td className="py-2 px-2" style={{ color: "#FFF" }}>{run.userCount?.toLocaleString()}</td>
                        <td className="py-2 px-2" style={{ color: "#FFF" }}>{run.results?.scenario || `${run.minSpend}-${run.maxSpend}₾`}</td>
                        <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: run.status === "complete" ? "#22C55E20" : "#F9E74120", color: run.status === "complete" ? "#22C55E" : "#F9E741" }}>{run.status === "complete" ? "done" : `${run.progress}/${run.userCount}`}</span></td>
                        <td className="py-2 px-2"><span style={{ color: ok ? "#22C55E" : run.status === "complete" ? "#EF4444" : "#666" }}>{run.status === "complete" ? (ok ? "PASS" : "FAIL") : "..."}</span></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
                {history.map((run) => expandedHistoryId === run.id && run.results ? (
                  <div key={`d-${run.id}`} className="mt-2 p-3 rounded-xl text-[11px]" style={{ background: "#0A0A0A", border: "1px solid #1A1A1A" }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2" style={{ color: "#A0A0A0" }}>
                      <div>Avg Return: <b style={{ color: "#FFF" }}>{run.results.actualAvgReturnPercent}%</b></div>
                      <div>Guarantee Miss: <b style={{ color: run.results.guaranteeMissCount === 0 ? "#22C55E" : "#EF4444" }}>{run.results.guaranteeMissCount}</b></div>
                      <div>Pool End: <b style={{ color: "#FFF" }}>{run.results.poolEndBalance?.toFixed(2)}₾</b></div>
                      <div>Total Spend: <b style={{ color: "#FFF" }}>{run.results.totalSpend?.toFixed(2)}₾</b></div>
                    </div>
                  </div>
                ) : null)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AlgoTestPage() {
  return <AdminAuthGuard><AlgoTestContent /></AdminAuthGuard>;
}
