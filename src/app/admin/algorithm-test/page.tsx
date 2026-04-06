"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { startSimulation, pollSimulation, getSimulationHistory, getGameConfig } from "@/services/admin";
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
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "Notifications", id: "notifications", href: "/admin/notifications" },
  { label: "Analytics", id: "analytics", href: "/admin/analytics" },
  { label: "System", id: "system", href: "/admin/system" },
];

const CURRENT_PAGE = "algorithm-test";

/* ── HISTOGRAM BAR CHART ── */
function Histogram({ data, maxCount }: { data: { range: string; count: number }[]; maxCount: number }) {
  if (!data || data.length === 0) return null;
  const barW = Math.max(20, Math.floor(600 / data.length));
  const chartH = 160;
  return (
    <div className="overflow-x-auto">
      <svg width={data.length * (barW + 4) + 40} height={chartH + 40} viewBox={`0 0 ${data.length * (barW + 4) + 40} ${chartH + 40}`}>
        {data.map((d, i) => {
          const h = maxCount > 0 ? (d.count / maxCount) * chartH : 0;
          const x = 20 + i * (barW + 4);
          const y = chartH - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx={3} fill="#F9E741" opacity={0.8} />
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fill="#666" fontSize="8">{d.count}</text>
              {i % 3 === 0 && (
                <text x={x + barW / 2} y={chartH + 28} textAnchor="middle" fill="#555" fontSize="7">{d.range.split("-")[0]}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── CHECK ITEM ── */
function CheckItem({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[16px]">{pass ? "\u2705" : "\u274C"}</span>
      <span className="text-[13px]" style={{ color: pass ? "#22C55E" : "#EF4444" }}>{label}</span>
    </div>
  );
}

/* ── STAT CARD ── */
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

  // Input controls
  const [userCount, setUserCount] = useState(1000);
  const [minSpend, setMinSpend] = useState(1);
  const [maxSpend, setMaxSpend] = useState(100);

  // Game types
  const [availableGameTypes, setAvailableGameTypes] = useState<string[]>([]);
  const [selectedGameTypes, setSelectedGameTypes] = useState<string[]>(["plinko"]);

  // Algorithm parameters (loaded from DB, editable for test)
  const [useCustomParams, setUseCustomParams] = useState(false);
  const [algoParams, setAlgoParams] = useState({
    avgReturnPercent: 0.5,
    maxWinPerUser: 100,
    poolMinimumThreshold: 1000,
    fullReturnThreshold: 5,
    minReturnPercent: 0.5,
  });
  const [dbParams, setDbParams] = useState(algoParams); // original from DB

  // Job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    loadHistory();
    // Load game config from DB
    getGameConfig().then((data: any) => {
      if (data.success && data.configs && data.configs.length > 0) {
        const types = data.configs.map((c: any) => c.gameType);
        setAvailableGameTypes(types);
        setSelectedGameTypes(types.length > 0 ? [types[0]] : ["plinko"]);
        const c = data.configs[0];
        const p = {
          avgReturnPercent: c.avgReturnPercent ?? 0.5,
          maxWinPerUser: c.maxWinPerUser ?? 100,
          poolMinimumThreshold: c.poolMinimumThreshold ?? 1000,
          fullReturnThreshold: c.fullReturnThreshold ?? 5,
          minReturnPercent: c.minReturnPercent ?? 0.5,
        };
        setAlgoParams(p);
        setDbParams(p);
      }
    }).catch(() => {});
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getSimulationHistory() as any;
      if (data.success) setHistory(data.runs || []);
    } catch {}
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const data = await pollSimulation(id) as any;
        if (data.success) {
          setProgress(data.progress || 0);
          setTotal(data.total || 0);
          if (data.status === "complete" && data.results) {
            setResults(data.results);
            setRunning(false);
            stopPolling();
            loadHistory();
          } else if (data.status === "error") {
            setError(data.results?.error || "Simulation failed");
            setRunning(false);
            stopPolling();
          }
        }
      } catch (err: any) {
        setError(err.message);
        setRunning(false);
        stopPolling();
      }
    }, 2000);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    setResults(null);
    setError(null);
    setProgress(0);
    setTotal(userCount);

    try {
      const params: any = { userCount, minSpend, maxSpend, gameTypes: selectedGameTypes };
      if (useCustomParams) {
        params.avgReturnPercent = algoParams.avgReturnPercent;
        params.maxWinPerUser = algoParams.maxWinPerUser;
        params.poolMinimumThreshold = algoParams.poolMinimumThreshold;
        params.fullReturnThreshold = algoParams.fullReturnThreshold;
        params.minReturnPercent = algoParams.minReturnPercent;
      }
      const data = await startSimulation(params) as any;
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        startPolling(data.jobId);
      } else {
        throw new Error(data.message || "Failed to start");
      }
    } catch (err: any) {
      setError(err.message);
      setRunning(false);
    }
  };

  const r = results; // shorthand
  const allPassed = r?.checks && Object.values(r.checks).every(Boolean);
  const maxHistogramCount = r?.histogram ? Math.max(...r.histogram.map((h: any) => h.count)) : 0;

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r" style={{ background: "#111111", borderColor: "#252525" }}>
        <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
          <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>SHANSI</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>Admin Panel</p>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
              style={{ background: item.id === CURRENT_PAGE ? "#1A1A1A" : "transparent", borderLeft: item.id === CURRENT_PAGE ? "3px solid #F9E741" : "3px solid transparent" }}>
              <NavIcon id={item.id} active={item.id === CURRENT_PAGE} />
              <span className="text-[13px] font-medium" style={{ color: item.id === CURRENT_PAGE ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside className="absolute left-0 top-0 bottom-0 w-[250px] border-r flex flex-col" style={{ background: "#111111", borderColor: "#252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
              <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>SHANSI</h1>
              <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>Admin Panel</p>
            </div>
            <nav className="flex-1 py-3 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <button key={item.id} onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
                  style={{ background: item.id === CURRENT_PAGE ? "#1A1A1A" : "transparent", borderLeft: item.id === CURRENT_PAGE ? "3px solid #F9E741" : "3px solid transparent" }}>
                  <NavIcon id={item.id} active={item.id === CURRENT_PAGE} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === CURRENT_PAGE ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 py-3 border-b" style={{ background: "#000000", borderColor: "#252525" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md" style={{ background: "#1A1A1A" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="5" x2="15" y2="5" /><line x1="3" y1="9" x2="15" y2="9" /><line x1="3" y1="13" x2="15" y2="13" /></svg>
            </button>
            <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>ALGORITHM TEST</h2>
          </div>
          <p className="text-[11px]" style={{ color: "#666666" }}>{now.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* ── INPUT CONTROLS ── */}
          <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFFFFF" }}>სიმულაციის პარამეტრები</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* User count */}
              <div>
                <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>მომხმარებლების რაოდენობა</label>
                <input
                  type="number" value={userCount} onChange={(e) => setUserCount(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full rounded-[10px] px-3 py-2.5 text-[14px] outline-none"
                  style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFFFFF" }}
                />
                <div className="flex gap-2 mt-2">
                  {[100, 1000, 5000, 10000].map((n) => (
                    <button key={n} onClick={() => setUserCount(n)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                      style={{ background: userCount === n ? "#F9E741" : "#1A1A1A", color: userCount === n ? "#000" : "#A0A0A0", border: "1px solid #252525" }}>
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min spend */}
              <div>
                <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>მინ. ხარჯი (₾)</label>
                <input
                  type="number" value={minSpend} onChange={(e) => setMinSpend(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  className="w-full rounded-[10px] px-3 py-2.5 text-[14px] outline-none"
                  style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFFFFF" }}
                  step="0.5"
                />
              </div>

              {/* Max spend */}
              <div>
                <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>მაქს. ხარჯი (₾)</label>
                <input
                  type="number" value={maxSpend} onChange={(e) => setMaxSpend(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  className="w-full rounded-[10px] px-3 py-2.5 text-[14px] outline-none"
                  style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFFFFF" }}
                  step="0.5"
                />
              </div>
            </div>

            {/* Game type selection */}
            <div className="mb-4">
              <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>თამაშის ტიპი</label>
              <div className="flex flex-wrap gap-2">
                {(availableGameTypes.length > 0 ? availableGameTypes : ["plinko", "slot", "chicken_rush"]).map((gt) => {
                  const selected = selectedGameTypes.includes(gt);
                  const labels: Record<string, string> = { plinko: "Lucky Drop", slot: "Slot", chicken_rush: "Lucky Step" };
                  return (
                    <button key={gt} onClick={() => {
                      if (selected && selectedGameTypes.length > 1) {
                        setSelectedGameTypes(selectedGameTypes.filter(t => t !== gt));
                      } else if (!selected) {
                        setSelectedGameTypes([...selectedGameTypes, gt]);
                      }
                    }}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                      style={{ background: selected ? "#F9E741" : "#1A1A1A", color: selected ? "#000" : "#A0A0A0", border: `1px solid ${selected ? "#F9E741" : "#252525"}` }}>
                      {labels[gt] || gt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Algorithm parameters */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <label className="text-[12px] font-medium" style={{ color: "#A0A0A0" }}>ალგორითმის პარამეტრები</label>
                <button onClick={() => { setUseCustomParams(!useCustomParams); if (useCustomParams) setAlgoParams(dbParams); }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: useCustomParams ? "#F9E741" : "#1A1A1A", color: useCustomParams ? "#000" : "#A0A0A0", border: "1px solid #252525" }}>
                  {useCustomParams ? "Custom" : "DB-დან"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { key: "avgReturnPercent", label: "საშუალო დაბრუნება %", suffix: "%", step: 0.1 },
                  { key: "maxWinPerUser", label: "მაქს. მოგება", suffix: "₾", step: 1 },
                  { key: "poolMinimumThreshold", label: "Pool მინიმუმი", suffix: "₾", step: 10 },
                  { key: "fullReturnThreshold", label: "100% ზღვარი", suffix: "₾", step: 0.5 },
                  { key: "minReturnPercent", label: "მინ. გარანტია %", suffix: "%", step: 0.1 },
                ].map(({ key, label, suffix, step }) => (
                  <div key={key}>
                    <label className="text-[10px] block mb-1" style={{ color: "#666666" }}>{label}</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={(algoParams as any)[key]}
                        onChange={(e) => setAlgoParams({ ...algoParams, [key]: parseFloat(e.target.value) || 0 })}
                        disabled={!useCustomParams}
                        step={step}
                        className="w-full rounded-[8px] px-2 py-1.5 text-[13px] outline-none"
                        style={{ background: useCustomParams ? "#1A1A1A" : "#0A0A0A", border: "1px solid #252525", color: useCustomParams ? "#FFFFFF" : "#666666", opacity: useCustomParams ? 1 : 0.6 }}
                      />
                      <span className="text-[11px] shrink-0" style={{ color: "#666" }}>{suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
              {!useCustomParams && (
                <p className="text-[10px] mt-1.5" style={{ color: "#555" }}>DB-ში შენახული პარამეტრები გამოიყენება. დააჭირეთ "Custom" ცვლილებისთვის.</p>
              )}
            </div>

            <button
              onClick={handleRun} disabled={running}
              className="w-full md:w-auto px-8 py-3 rounded-xl text-[14px] font-bold transition-all duration-150"
              style={{ background: running ? "#333" : "#F9E741", color: running ? "#666" : "#000", cursor: running ? "not-allowed" : "pointer" }}>
              {running ? "მიმდინარეობს..." : "ტესტის გაშვება"}
            </button>

            {/* Progress */}
            {running && (
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
                  <span className="text-[13px]" style={{ color: "#A0A0A0" }}>
                    სიმულაცია მიმდინარეობს... {progress}/{total} მომხმარებელი
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#1A1A1A" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ background: "#F9E741", width: `${total > 0 ? (progress / total) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg text-[13px]" style={{ background: "#EF444420", color: "#EF4444" }}>{error}</div>
            )}
          </div>

          {/* ── RESULTS ── */}
          {r && (
            <>
              {/* Overall pass/fail banner */}
              <div className="rounded-2xl p-4 border" style={{ background: allPassed ? "#22C55E10" : "#EF444410", borderColor: allPassed ? "#22C55E40" : "#EF444440" }}>
                <div className="flex items-center gap-3">
                  <span className="text-[24px]">{allPassed ? "\u2705" : "\u26A0\uFE0F"}</span>
                  <div>
                    <p className="text-[16px] font-bold" style={{ color: allPassed ? "#22C55E" : "#EF4444" }}>
                      {allPassed ? "ყველა ტესტი წარმატებულია" : "ზოგიერთი ტესტი ვერ გაიარა"}
                    </p>
                    <p className="text-[11px]" style={{ color: "#A0A0A0" }}>
                      {r.userCount.toLocaleString()} მომხმარებელი | {r.minSpend}-{r.maxSpend}₾ | {r.durationMs}ms
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatCard
                  label="საშუალო დაბრუნება %"
                  value={`${r.actualAvgReturnPercent}%`}
                  sub={`target: ${r.targetAvgReturnPercent}%`}
                  color={Math.abs(r.actualAvgReturnPercent - r.targetAvgReturnPercent) <= 0.5 ? "#22C55E" : "#EF4444"}
                />
                <StatCard
                  label="მინიმუმ გარანტია"
                  value={`${r.userCount - r.guaranteeMissCount}/${r.userCount}`}
                  sub="მომხმარებელმა მიიღო მინიმუმი"
                  color={r.guaranteeMissCount === 0 ? "#22C55E" : "#EF4444"}
                />
                <StatCard
                  label="მაქს. მოგების დარღვევა"
                  value={`${r.maxWinViolationCount}`}
                  sub="მომხმარებელი"
                  color={r.maxWinViolationCount === 0 ? "#22C55E" : "#EF4444"}
                />
                <StatCard
                  label="გარანტიის Top-up"
                  value={`${r.bonusRoundCount}`}
                  sub="მომხმარებელს დაემატა"
                  color="#3B82F6"
                />
                <StatCard
                  label="Pool ბალანსი"
                  value={`${r.poolEndBalance.toFixed(2)}₾`}
                  sub={`in: ${r.poolTotalIn.toFixed(2)} | out: ${r.poolTotalOut.toFixed(2)}`}
                  color={r.poolEndBalance >= 0 ? "#22C55E" : "#EF4444"}
                />
              </div>

              {/* Detailed stats + checks side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Stats */}
                <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFFFFF" }}>დეტალური სტატისტიკა</h3>
                  <div className="space-y-3">
                    {[
                      { label: "მინიმუმ მოგება", value: `${r.minCashback}₾` },
                      { label: "მაქსიმუმ მოგება", value: `${r.maxCashback}₾` },
                      { label: "მედიანა", value: `${r.medianCashback}₾` },
                      { label: "საშუალო", value: `${r.meanCashback}₾` },
                      { label: "Pool შემოსავალი", value: `${r.poolTotalIn.toFixed(2)}₾` },
                      { label: "Pool გასავალი", value: `${r.poolTotalOut.toFixed(2)}₾` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "#1A1A1A" }}>
                        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{label}</span>
                        <span className="text-[13px] font-semibold" style={{ color: "#FFFFFF" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pass/Fail checklist */}
                <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFFFFF" }}>ტესტის შედეგები</h3>
                  <div className="space-y-1">
                    <CheckItem pass={r.checks.avgReturnMatch} label={`საშუალო დაბრუნება % ემთხვევა target-ს (±0.5%): ${r.actualAvgReturnPercent}% vs ${r.targetAvgReturnPercent}%`} />
                    <CheckItem pass={r.checks.allGuaranteesMet} label={`ყველა მომხმარებელმა მიიღო მინიმუმ გარანტია (${r.guaranteeMissCount} miss)`} />
                    <CheckItem pass={r.checks.noMaxWinViolations} label={`არცერთმა არ გადააჭარბა მაქს. მოგებას (${r.maxWinViolationCount} violation)`} />
                    <CheckItem pass={r.checks.poolNotNegative} label={`Pool არ წავიდა მინუსში (${r.poolEndBalance.toFixed(2)}₾)`} />
                    <CheckItem pass={r.checks.fullReturnThresholdWorks} label="100% threshold მუშაობს" />
                    <CheckItem pass={r.checks.masterSwitchOffTest} label="Master switch OFF — 0 ბონუს cash (გარანტიის გარდა)" />
                  </div>
                </div>
              </div>

              {/* Histogram */}
              <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
                <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFFFFF" }}>მოგების განაწილება</h3>
                <Histogram data={r.histogram} maxCount={maxHistogramCount} />
                <p className="text-[11px] mt-2" style={{ color: "#666666" }}>X: cashback რეინჯი | Y: მომხმარებლების რაოდენობა</p>
              </div>
            </>
          )}

          {/* ── TEST HISTORY ── */}
          <div className="rounded-2xl p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFFFFF" }}>ტესტის ისტორია</h3>
            {history.length === 0 ? (
              <p className="text-[12px]" style={{ color: "#666666" }}>ჯერ ტესტი არ ჩატარებულა</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #252525" }}>
                      <th className="text-left py-2 px-2 font-medium" style={{ color: "#666666" }}>თარიღი</th>
                      <th className="text-left py-2 px-2 font-medium" style={{ color: "#666666" }}>მომხმარებლები</th>
                      <th className="text-left py-2 px-2 font-medium" style={{ color: "#666666" }}>ხარჯის რეინჯი</th>
                      <th className="text-left py-2 px-2 font-medium" style={{ color: "#666666" }}>სტატუსი</th>
                      <th className="text-left py-2 px-2 font-medium" style={{ color: "#666666" }}>შედეგი</th>
                      <th className="text-left py-2 px-2 font-medium" style={{ color: "#666666" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((run) => {
                      const allOk = run.results?.checks && Object.values(run.results.checks).every(Boolean);
                      const expanded = expandedHistoryId === run.id;
                      return (
                        <tr key={run.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                          <td className="py-2 px-2" style={{ color: "#A0A0A0" }}>
                            {run.createdAt ? new Date(run.createdAt).toLocaleString("ka-GE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                          </td>
                          <td className="py-2 px-2" style={{ color: "#FFFFFF" }}>{run.userCount?.toLocaleString()}</td>
                          <td className="py-2 px-2" style={{ color: "#FFFFFF" }}>{run.minSpend}-{run.maxSpend}₾</td>
                          <td className="py-2 px-2">
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium" style={{
                              background: run.status === "complete" ? "#22C55E20" : run.status === "running" ? "#F9E74120" : "#EF444420",
                              color: run.status === "complete" ? "#22C55E" : run.status === "running" ? "#F9E741" : "#EF4444",
                            }}>
                              {run.status === "complete" ? "done" : run.status === "running" ? `${run.progress}/${run.userCount}` : "error"}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            {run.status === "complete" && (
                              <span className="text-[12px]" style={{ color: allOk ? "#22C55E" : "#EF4444" }}>
                                {allOk ? "PASS" : "FAIL"}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            {run.status === "complete" && run.results && (
                              <button
                                onClick={() => setExpandedHistoryId(expanded ? null : run.id)}
                                className="text-[11px] px-2 py-0.5 rounded-md transition-all"
                                style={{ background: "#1A1A1A", color: "#F9E741", border: "1px solid #252525" }}>
                                {expanded ? "დახურვა" : "დეტალები"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Expanded details for history item */}
                {history.map((run) => {
                  if (expandedHistoryId !== run.id || !run.results) return null;
                  const hr = run.results;
                  return (
                    <div key={`detail-${run.id}`} className="mt-3 p-4 rounded-xl" style={{ background: "#0A0A0A", border: "1px solid #252525" }}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                        <div><span style={{ color: "#666" }}>Avg Return:</span> <span style={{ color: "#FFF" }}>{hr.actualAvgReturnPercent}%</span></div>
                        <div><span style={{ color: "#666" }}>Guarantee Miss:</span> <span style={{ color: hr.guaranteeMissCount === 0 ? "#22C55E" : "#EF4444" }}>{hr.guaranteeMissCount}</span></div>
                        <div><span style={{ color: "#666" }}>Max Win Violations:</span> <span style={{ color: hr.maxWinViolationCount === 0 ? "#22C55E" : "#EF4444" }}>{hr.maxWinViolationCount}</span></div>
                        <div><span style={{ color: "#666" }}>Pool End:</span> <span style={{ color: "#FFF" }}>{hr.poolEndBalance?.toFixed(2)}₾</span></div>
                        <div><span style={{ color: "#666" }}>Min Cashback:</span> <span style={{ color: "#FFF" }}>{hr.minCashback}₾</span></div>
                        <div><span style={{ color: "#666" }}>Max Cashback:</span> <span style={{ color: "#FFF" }}>{hr.maxCashback}₾</span></div>
                        <div><span style={{ color: "#666" }}>Median:</span> <span style={{ color: "#FFF" }}>{hr.medianCashback}₾</span></div>
                        <div><span style={{ color: "#666" }}>Mean:</span> <span style={{ color: "#FFF" }}>{hr.meanCashback}₾</span></div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {hr.checks && Object.entries(hr.checks).map(([key, val]) => (
                          <span key={key} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: val ? "#22C55E15" : "#EF444415", color: val ? "#22C55E" : "#EF4444" }}>
                            {val ? "\u2713" : "\u2717"} {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AlgoTestPage() {
  return (
    <AdminAuthGuard>
      <AlgoTestContent />
    </AdminAuthGuard>
  );
}
