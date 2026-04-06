"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGameConfig, updateGameConfig, getPool, fundPool, getMasterSwitch, setMasterSwitch } from "@/services/admin";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

/* ── SVG ICONS (same as dashboard) ── */
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
  { label: "Users", id: "users", href: "/admin" },
  { label: "Merchants", id: "merchants", href: "/admin" },
  { label: "Transactions", id: "transactions", href: "/admin" },
  { label: "Games", id: "games", href: "/admin" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin" },
  { label: "Notifications", id: "notifications", href: "/admin" },
  { label: "Analytics", id: "analytics", href: "/admin" },
  { label: "System", id: "system", href: "/admin" },
];

/* ── PARAMETER CONFIG ── */
interface Param {
  key: string;
  label: string;
  value: number;
  suffix: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

function AlgorithmContent() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Pool
  const [poolBalance, setPoolBalance] = useState(0);
  const [poolTotalFunded, setPoolTotalFunded] = useState(0);
  const [poolTotalWon, setPoolTotalWon] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState("");

  // Master switch
  const [winningsEnabled, setWinningsEnabled] = useState(true);
  const [showConfirmOff, setShowConfirmOff] = useState(false);

  // Params
  const [params, setParams] = useState<Param[]>([
    { key: "avgReturnPercent", label: "საშუალო დაბრუნება %", value: 85, suffix: "%", description: "საშუალოდ რამდენი % უბრუნდება მომხმარებელს ყოველი გადახდიდან", min: 0.1, max: 100, step: 0.1 },
    { key: "maxWinPerUser", label: "მაქს. მოგება 1 ადამიანზე", value: 100, suffix: "₾", description: "ერთ თამაშზე მაქსიმუმ რამდენის მოგება შეუძლია", min: 1, max: 1000, step: 1 },
    { key: "poolMinimumThreshold", label: "Pool მინიმუმის ზღვარი", value: 1000, suffix: "₾", description: "ამ თანხაზე ქვემოთ ბონუს მოგებები ავტომატურად ჩერდება, მხოლოდ 0.5% მინიმუმი გაიცემა", min: 0, max: 10000, step: 1 },
    { key: "fullReturnThreshold", label: "100% ზღვარი (დაბალი თანხა)", value: 5, suffix: "₾", description: "ამ თანხამდე გადახდებზე 100% დაბრუნების შანსი მაღალია (~20%)", min: 1, max: 50, step: 0.5 },
    { key: "minReturnPercent", label: "მინიმუმ გარანტირებული დაბრუნება %", value: 0.5, suffix: "%", description: "ყველა მომხმარებელი ყოველ თამაშზე მინიმუმ ამდენ %-ს იგებს", min: 0.1, max: 5, step: 0.1 },
  ]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [gameTypes, setGameTypes] = useState<string[]>([]);

  // How it works
  const [howOpen, setHowOpen] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Fetch real data on mount
  useEffect(() => {
    getPool().then((data: any) => {
      if (data.success && data.pool) {
        setPoolBalance(data.pool.balance || 0);
        setPoolTotalFunded(data.pool.totalFunded || 0);
        setPoolTotalWon(data.pool.totalWon || 0);
      }
    }).catch(() => {});

    getGameConfig().then((data: any) => {
      if (data.success && data.configs && data.configs.length > 0) {
        const c = data.configs[0];
        setGameTypes(data.configs.map((g: any) => g.gameType));
        setParams((prev) => prev.map((p) => {
          const val = c[p.key];
          return val !== undefined ? { ...p, value: val } : p;
        }));
      }
    }).catch(() => {});

    getMasterSwitch().then((data: any) => {
      if (data.success !== undefined) setWinningsEnabled(data.enabled);
    }).catch(() => {});
  }, []);

  const poolMinimum = params.find((p) => p.key === "poolMinimumThreshold")?.value || 1000;
  const poolHealthPercent = Math.min(100, (poolBalance / Math.max(poolMinimum * 5, 1)) * 100);
  const poolColor = poolBalance > poolMinimum * 3 ? "#22C55E" : poolBalance > poolMinimum ? "#F97316" : "#EF4444";

  const handleSaveParam = async (key: string) => {
    const p = params.find((p) => p.key === key);
    if (!p) return;
    const clamped = Math.min(p.max, Math.max(p.min, editValue));

    // Update all game types
    try {
      for (const gt of gameTypes) {
        await updateGameConfig(gt, { [key]: clamped });
      }
      setParams((prev) => prev.map((p) => p.key === key ? { ...p, value: clamped } : p));
      setEditingKey(null);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch {}
  };

  const handleFundPool = async () => {
    const amt = parseFloat(addAmount);
    if (amt > 0) {
      try {
        const data = await fundPool(amt) as any;
        if (data.success) {
          setPoolBalance(data.newBalance);
          setPoolTotalFunded((prev) => prev + amt);
          setAddAmount("");
          setShowAddModal(false);
        }
      } catch {}
    }
  };

  const handleToggleWinnings = async (enable: boolean) => {
    try {
      await setMasterSwitch(enable);
      setWinningsEnabled(enable);
      setShowConfirmOff(false);
    } catch {}
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
              style={{ background: item.id === "algorithm" ? "#1A1A1A" : "transparent", borderLeft: item.id === "algorithm" ? "3px solid #F9E741" : "3px solid transparent" }}>
              <NavIcon id={item.id} active={item.id === "algorithm"} />
              <span className="text-[13px] font-medium" style={{ color: item.id === "algorithm" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
                  style={{ background: item.id === "algorithm" ? "#1A1A1A" : "transparent", borderLeft: item.id === "algorithm" ? "3px solid #F9E741" : "3px solid transparent" }}>
                  <NavIcon id={item.id} active={item.id === "algorithm"} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === "algorithm" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md" style={{ background: "#1A1A1A" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="5" x2="15" y2="5" /><line x1="3" y1="9" x2="15" y2="9" /><line x1="3" y1="13" x2="15" y2="13" /></svg>
            </button>
            <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>ALGORITHM CONTROL</h2>
          </div>
          <p className="text-[11px]" style={{ color: "#666666" }}>{now.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
        </header>

        <div className="p-4 lg:p-6 space-y-4">

          {/* ═══ SECTION 1: POOL STATUS ═══ */}
          <div className="rounded-[12px] p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>Pool Balance / ქილის ბალანსი</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: poolColor + "20", color: poolColor }}>
                {poolBalance > poolMinimum * 3 ? "Healthy" : poolBalance > poolMinimum ? "Warning" : "Critical"}
              </span>
            </div>
            <p className="text-[36px] lg:text-[42px] font-extrabold leading-none mb-3" style={{ color: "#F9E741", textShadow: "0 0 25px rgba(249,231,65,0.3)", animation: "pulse 3s ease-in-out infinite" }}>
              ₾{poolBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            {/* Health bar */}
            <div className="w-full h-[6px] rounded-full mb-3" style={{ background: "#252525" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${poolHealthPercent}%`, background: poolColor }} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px]" style={{ color: "#A0A0A0" }}>მინიმუმის ზღვარი: <span className="text-white font-semibold">{poolMinimum}₾</span></p>
                <p className="text-[12px]" style={{ color: "#A0A0A0" }}>სტატუსი: <span style={{ color: winningsEnabled ? "#22C55E" : "#EF4444" }}>{winningsEnabled ? "აქტიური" : "შეჩერებული"}</span></p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-[8px] text-[13px] font-bold transition-all active:scale-[0.97]" style={{ background: "#F9E741", color: "#000000" }}>
                თანხის დამატება
              </button>
            </div>
          </div>

          {/* ═══ SECTION 2: MASTER SWITCH ═══ */}
          <div className="rounded-[12px] p-5 border-2 transition-all" style={{ background: "#111111", borderColor: winningsEnabled ? "#22C55E" : "#EF4444" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold mb-1" style={{ color: "#FFFFFF" }}>Master Switch</p>
                <div className="flex items-center gap-2">
                  {!winningsEnabled && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 1.5L1 14h14L8 1.5z" /><line x1="8" y1="6" x2="8" y2="9" /><circle cx="8" cy="11.5" r="0.5" fill="#EF4444" />
                    </svg>
                  )}
                  <p className="text-[13px] font-medium" style={{ color: winningsEnabled ? "#22C55E" : "#EF4444" }}>
                    {winningsEnabled ? "მოგებები აქტიურია" : "მოგებები შეჩერებულია"}
                  </p>
                </div>
              </div>
              {/* Toggle */}
              <button
                onClick={() => { if (winningsEnabled) { setShowConfirmOff(true); } else { handleToggleWinnings(true); } }}
                className="relative w-[56px] h-[30px] rounded-full transition-all duration-300"
                style={{ background: winningsEnabled ? "#22C55E" : "#EF4444" }}
              >
                <div className="absolute top-[3px] w-[24px] h-[24px] rounded-full bg-white transition-all duration-300" style={{ left: winningsEnabled ? "29px" : "3px" }} />
              </button>
            </div>
          </div>

          {/* ═══ SECTION 3: ALGORITHM PARAMETERS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {params.map((p) => {
              const isEditing = editingKey === p.key;
              const isSaved = savedKey === p.key;
              const isPoolWarning = p.key === "poolMinThreshold" && poolBalance < p.value * 2;

              return (
                <div key={p.key} className="rounded-[12px] p-4 border transition-all" style={{ background: "#111111", borderColor: isEditing ? "#F9E741" : isPoolWarning ? "#F97316" : "#252525" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] font-semibold" style={{ color: "#A0A0A0" }}>{p.label}</p>
                    {isSaved && <span className="text-[11px] font-medium" style={{ color: "#22C55E" }}>შენახულია</span>}
                    {!isEditing && !isSaved && (
                      <button onClick={() => { setEditingKey(p.key); setEditValue(p.value); }} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#1A1A1A" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setEditValue(Math.max(p.min, editValue - p.step))} className="w-8 h-8 rounded-md flex items-center justify-center text-[18px] font-bold" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>-</button>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                          className="flex-1 text-center text-[22px] font-extrabold rounded-md py-1 outline-none"
                          style={{ background: "#1A1A1A", color: "#F9E741", border: "1px solid #F9E741" }}
                          min={p.min} max={p.max} step={p.step}
                        />
                        <button onClick={() => setEditValue(Math.min(p.max, editValue + p.step))} className="w-8 h-8 rounded-md flex items-center justify-center text-[18px] font-bold" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>+</button>
                      </div>
                      <p className="text-[10px] mb-2" style={{ color: "#666666" }}>Range: {p.min}{p.suffix} — {p.max}{p.suffix}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveParam(p.key)} className="flex-1 py-2 rounded-[8px] text-[12px] font-bold" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                        <button onClick={() => setEditingKey(null)} className="flex-1 py-2 rounded-[8px] text-[12px] font-bold" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-[28px] font-extrabold leading-none mb-2" style={{ color: "#F9E741" }}>
                        {p.value}{p.suffix}
                      </p>
                      <p className="text-[11px] leading-relaxed" style={{ color: "#666666" }}>{p.description}</p>
                      {isPoolWarning && <p className="text-[11px] mt-2 font-medium" style={{ color: "#F97316" }}>Pool ახლოს არის ამ ზღვართან</p>}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* ═══ HOW IT WORKS ═══ */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <button onClick={() => setHowOpen(!howOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left">
              <span className="text-[13px] font-semibold" style={{ color: "#A0A0A0" }}>როგორ მუშაობს</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" style={{ transform: howOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                <polyline points="3,5 7,9 11,5" />
              </svg>
            </button>
            {howOpen && (
              <div className="px-4 pb-4 text-[12px] leading-relaxed" style={{ color: "#666666" }}>
                მომხმარებელი იხდის → მინიმუმ 0.5% იგებს ყოველთვის → ქილის ბალანსიდან გამომდინარე ბონუს მოგებაც შეიძლება მოიგოს → დაბალ თანხებზე (&lt; 100% ზღვარი) ხშირად 100% ბრუნდება
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── ADD FUNDS MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-[90%] max-w-[360px]" style={{ background: "#111111", border: "1px solid #252525" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-white mb-4">თანხის დამატება</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[18px] font-bold" style={{ color: "#A0A0A0" }}>₾</span>
              <input
                type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 text-[20px] font-bold rounded-[8px] px-3 py-2 outline-none"
                style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFundPool}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold" style={{ background: "#F9E741", color: "#000" }}
              >
                დადასტურება
              </button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-[8px] text-[14px] font-bold" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                გაუქმება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM OFF MODAL ── */}
      {showConfirmOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowConfirmOff(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-[90%] max-w-[360px] border-2" style={{ background: "#111111", borderColor: "#EF4444" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2L1 18h18L10 2z" /><line x1="10" y1="8" x2="10" y2="12" /><circle cx="10" cy="15" r="0.5" fill="#EF4444" />
              </svg>
              <h3 className="text-[16px] font-bold" style={{ color: "#EF4444" }}>გაფრთხილება</h3>
            </div>
            <p className="text-[13px] mb-4 leading-relaxed" style={{ color: "#A0A0A0" }}>
              დარწმუნებული ხარ? ყველა მომხმარებლისთვის შეჩერდება მოგებები
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleWinnings(false)}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold" style={{ background: "#EF4444", color: "#FFFFFF" }}
              >
                გამორთვა
              </button>
              <button onClick={() => setShowConfirmOff(false)} className="flex-1 py-3 rounded-[8px] text-[14px] font-bold" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                გაუქმება
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.85; } }`}</style>
    </div>
  );
}

export default function AlgorithmPage() {
  return (
    <AdminAuthGuard>
      <AlgorithmContent />
    </AdminAuthGuard>
  );
}
