"use client";

import { useState } from "react";
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

/* ── INTERFACES ── */
interface Level {
  level: number;
  xpRequired: number;
  winChance: number;
  maxWin: number;
}

interface Attack {
  date: string;
  attacker: string;
  victim: string;
  result: "success" | "failed" | "blocked";
}

/* ── MOCK DATA ── */
function generateLevels(): Level[] {
  return Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    xpRequired: i === 0 ? 0 : Math.round((i + 1) * (i + 1) * 50),
    winChance: Math.min(95, 30 + i * 3.5),
    maxWin: Math.round(5 + i * 2.5),
  }));
}

function generateAttacks(): Attack[] {
  const names = ["გიორგი", "ნინო", "დავითი", "მარიამ", "ალექსი", "ანა", "ლუკა", "სოფო", "ნიკა", "თამარ", "ბექა", "ელენე"];
  const results: Attack["result"][] = ["success", "failed", "blocked"];
  return Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setHours(d.getHours() - i * 3 - Math.floor(Math.random() * 5));
    return {
      date: d.toLocaleDateString("ka-GE") + " " + d.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }),
      attacker: names[i % names.length],
      victim: names[(i + 3) % names.length],
      result: results[i % 3],
    };
  });
}

/* ── PAGE ── */
export default function VillagePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Level Configuration
  const [levels, setLevels] = useState<Level[]>(generateLevels);
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [editLevelData, setEditLevelData] = useState<Level | null>(null);

  // XP Configuration
  const [xpPerFreeGame, setXpPerFreeGame] = useState(10);
  const [xpPerMerchantTx, setXpPerMerchantTx] = useState(25);
  const [xpForShield, setXpForShield] = useState(50);
  const [editingXp, setEditingXp] = useState<string | null>(null);

  // Attack Configuration
  const [cardsNeeded, setCardsNeeded] = useState(3);
  const [levelDrop, setLevelDrop] = useState(1);
  const [sameLevelRestriction, setSameLevelRestriction] = useState(true);
  const [xpBonus, setXpBonus] = useState(15);
  const [editingAttackField, setEditingAttackField] = useState<string | null>(null);

  // Free Games
  const [dailyCount, setDailyCount] = useState(5);
  const [resetTime, setResetTime] = useState("00:00");
  const [editingFreeField, setEditingFreeField] = useState<string | null>(null);

  // Attack History
  const [attacks] = useState<Attack[]>(generateAttacks);

  // Saved feedback
  const [savedField, setSavedField] = useState<string | null>(null);
  const showSaved = (field: string) => {
    setSavedField(field);
    setTimeout(() => setSavedField(null), 2000);
  };

  const handleLevelEdit = (lvl: number) => {
    const l = levels.find((l) => l.level === lvl);
    if (l) {
      setEditingLevel(lvl);
      setEditLevelData({ ...l });
    }
  };

  const handleLevelSave = () => {
    if (!editLevelData) return;
    setLevels((prev) => prev.map((l) => (l.level === editLevelData.level ? { ...editLevelData } : l)));
    setEditingLevel(null);
    setEditLevelData(null);
    showSaved("level-" + editLevelData.level);
  };

  const handleAddLevel = () => {
    const next = levels.length + 1;
    const prev = levels[levels.length - 1];
    setLevels((old) => [
      ...old,
      {
        level: next,
        xpRequired: Math.round((prev?.xpRequired || 0) + next * next * 50),
        winChance: Math.min(95, (prev?.winChance || 30) + 3.5),
        maxWin: Math.round((prev?.maxWin || 5) + 2.5),
      },
    ]);
  };

  const resultColor = (r: Attack["result"]) => {
    if (r === "success") return "#22C55E";
    if (r === "failed") return "#EF4444";
    return "#F9E741";
  };

  const resultLabel = (r: Attack["result"]) => {
    if (r === "success") return "წარმატება";
    if (r === "failed") return "წარუმატებელი";
    return "დაბლოკილი";
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
              style={{ background: item.id === "village" ? "#1A1A1A" : "transparent", borderLeft: item.id === "village" ? "3px solid #F9E741" : "3px solid transparent" }}>
              <NavIcon id={item.id} active={item.id === "village"} />
              <span className="text-[13px] font-medium" style={{ color: item.id === "village" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
                  style={{ background: item.id === "village" ? "#1A1A1A" : "transparent", borderLeft: item.id === "village" ? "3px solid #F9E741" : "3px solid transparent" }}>
                  <NavIcon id={item.id} active={item.id === "village"} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === "village" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18V9l8-6.5L18 9v9" /><path d="M7 18v-5h6v5" /></svg>
              <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>VILLAGE / LEVELS</h2>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-5">

          {/* ═══ SECTION 1: LEVEL CONFIGURATION ═══ */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-b" style={{ borderColor: "#252525" }}>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 14h3v-4H2v4zM7.5 14h3V7h-3v7zM13 14h3V3h-3v11z" />
                </svg>
                <p className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>Level Configuration</p>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>{levels.length} levels</span>
              </div>
              <button onClick={handleAddLevel} className="px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition-all hover:brightness-110 active:scale-[0.97]" style={{ background: "#F9E741", color: "#000" }}>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round"><line x1="7" y1="2" x2="7" y2="12" /><line x1="2" y1="7" x2="12" y2="7" /></svg>
                  ლეველის დამატება
                </span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr style={{ background: "#1A1A1A" }}>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>Level</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>XP Required</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>Win Chance %</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>Max Win</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((l) => {
                    const isEditing = editingLevel === l.level;
                    const isSaved = savedField === "level-" + l.level;
                    return (
                      <tr key={l.level} className="transition-all" style={{ borderBottom: "1px solid #1A1A1A", background: isEditing ? "#1A1A1A" : "transparent" }}>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold" style={{ background: "#F9E741" + "20", color: "#F9E741" }}>{l.level}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {isEditing ? (
                            <input type="number" value={editLevelData?.xpRequired || 0} onChange={(e) => setEditLevelData((d) => d ? { ...d, xpRequired: parseInt(e.target.value) || 0 } : d)}
                              className="w-[100px] px-2 py-1 rounded-[6px] text-[13px] font-semibold outline-none" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} />
                          ) : (
                            <span className="text-[13px] font-semibold" style={{ color: "#FFFFFF" }}>{l.xpRequired.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {isEditing ? (
                            <input type="number" value={editLevelData?.winChance || 0} onChange={(e) => setEditLevelData((d) => d ? { ...d, winChance: parseFloat(e.target.value) || 0 } : d)}
                              className="w-[80px] px-2 py-1 rounded-[6px] text-[13px] font-semibold outline-none" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} step="0.5" />
                          ) : (
                            <span className="text-[13px]" style={{ color: "#A0A0A0" }}>{l.winChance.toFixed(1)}%</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {isEditing ? (
                            <input type="number" value={editLevelData?.maxWin || 0} onChange={(e) => setEditLevelData((d) => d ? { ...d, maxWin: parseFloat(e.target.value) || 0 } : d)}
                              className="w-[80px] px-2 py-1 rounded-[6px] text-[13px] font-semibold outline-none" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} step="0.5" />
                          ) : (
                            <span className="text-[13px] font-medium" style={{ color: "#22C55E" }}>{l.maxWin.toFixed(1)} &#8382;</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <button onClick={handleLevelSave} className="px-3 py-1 rounded-[6px] text-[11px] font-bold transition-all hover:brightness-110 active:scale-95" style={{ background: "#22C55E", color: "#fff" }}>Save</button>
                              <button onClick={() => { setEditingLevel(null); setEditLevelData(null); }} className="px-3 py-1 rounded-[6px] text-[11px] font-bold transition-all active:scale-95" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                            </div>
                          ) : isSaved ? (
                            <span className="text-[11px] font-medium" style={{ color: "#22C55E" }}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1"><polyline points="2,7 5.5,10.5 12,4" /></svg>
                              Saved
                            </span>
                          ) : (
                            <button onClick={() => handleLevelEdit(l.level)} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525] active:scale-95" style={{ background: "#1A1A1A" }}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ SECTION 2: XP CONFIGURATION ═══ */}
          <div className="rounded-[12px] p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="9,1 11.5,6 17,7 13,11 14,17 9,14 4,17 5,11 1,7 6.5,6" />
              </svg>
              <p className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>XP Configuration</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* XP per free game */}
              <div className="rounded-[10px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: editingXp === "freeGame" ? "#F9E741" : "#252525" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium" style={{ color: "#666666" }}>XP / Free Game</p>
                  {savedField === "xp-freeGame" && <span className="text-[10px]" style={{ color: "#22C55E" }}>Saved</span>}
                </div>
                {editingXp === "freeGame" ? (
                  <div>
                    <input type="number" value={xpPerFreeGame} onChange={(e) => setXpPerFreeGame(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-[6px] text-[20px] font-extrabold outline-none mb-2" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingXp(null); showSaved("xp-freeGame"); }} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                      <button onClick={() => setEditingXp(null)} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-[24px] font-extrabold" style={{ color: "#F9E741" }}>{xpPerFreeGame}</p>
                    <button onClick={() => setEditingXp("freeGame")} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525] active:scale-95" style={{ background: "#252525" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* XP per merchant tx */}
              <div className="rounded-[10px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: editingXp === "merchantTx" ? "#F9E741" : "#252525" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium" style={{ color: "#666666" }}>XP / Merchant TX</p>
                  {savedField === "xp-merchantTx" && <span className="text-[10px]" style={{ color: "#22C55E" }}>Saved</span>}
                </div>
                {editingXp === "merchantTx" ? (
                  <div>
                    <input type="number" value={xpPerMerchantTx} onChange={(e) => setXpPerMerchantTx(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-[6px] text-[20px] font-extrabold outline-none mb-2" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingXp(null); showSaved("xp-merchantTx"); }} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                      <button onClick={() => setEditingXp(null)} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-[24px] font-extrabold" style={{ color: "#F9E741" }}>{xpPerMerchantTx}</p>
                    <button onClick={() => setEditingXp("merchantTx")} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525] active:scale-95" style={{ background: "#252525" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* XP for shield */}
              <div className="rounded-[10px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: editingXp === "shield" ? "#F9E741" : "#252525" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium" style={{ color: "#666666" }}>XP / Shield</p>
                  {savedField === "xp-shield" && <span className="text-[10px]" style={{ color: "#22C55E" }}>Saved</span>}
                </div>
                {editingXp === "shield" ? (
                  <div>
                    <input type="number" value={xpForShield} onChange={(e) => setXpForShield(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-[6px] text-[20px] font-extrabold outline-none mb-2" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingXp(null); showSaved("xp-shield"); }} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                      <button onClick={() => setEditingXp(null)} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-[24px] font-extrabold" style={{ color: "#F9E741" }}>{xpForShield}</p>
                    <button onClick={() => setEditingXp("shield")} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525] active:scale-95" style={{ background: "#252525" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ SECTION 3: ATTACK CONFIGURATION ═══ */}
          <div className="rounded-[12px] p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2l3 3-8.5 8.5-4 1 1-4L13 2z" /><path d="M11 4l3 3" />
              </svg>
              <p className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>Attack Configuration</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cards needed */}
              <div className="rounded-[10px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: editingAttackField === "cards" ? "#F9E741" : "#252525" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium" style={{ color: "#666666" }}>Cards Needed for Attack</p>
                  {savedField === "atk-cards" && <span className="text-[10px]" style={{ color: "#22C55E" }}>Saved</span>}
                </div>
                {editingAttackField === "cards" ? (
                  <div>
                    <input type="number" value={cardsNeeded} onChange={(e) => setCardsNeeded(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-[6px] text-[20px] font-extrabold outline-none mb-2" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} min="1" max="10" />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingAttackField(null); showSaved("atk-cards"); }} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                      <button onClick={() => setEditingAttackField(null)} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-[24px] font-extrabold" style={{ color: "#F9E741" }}>{cardsNeeded}</p>
                    <button onClick={() => setEditingAttackField("cards")} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525] active:scale-95" style={{ background: "#252525" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Level drop */}
              <div className="rounded-[10px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: editingAttackField === "levelDrop" ? "#F9E741" : "#252525" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium" style={{ color: "#666666" }}>Level Drop on Attack</p>
                  {savedField === "atk-levelDrop" && <span className="text-[10px]" style={{ color: "#22C55E" }}>Saved</span>}
                </div>
                {editingAttackField === "levelDrop" ? (
                  <div>
                    <input type="number" value={levelDrop} onChange={(e) => setLevelDrop(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-[6px] text-[20px] font-extrabold outline-none mb-2" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} min="0" max="5" />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingAttackField(null); showSaved("atk-levelDrop"); }} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                      <button onClick={() => setEditingAttackField(null)} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-[24px] font-extrabold" style={{ color: "#EF4444" }}>-{levelDrop}</p>
                    <button onClick={() => setEditingAttackField("levelDrop")} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525] active:scale-95" style={{ background: "#252525" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Same level restriction toggle */}
              <div className="rounded-[10px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium mb-1" style={{ color: "#666666" }}>Same Level Restriction</p>
                    <p className="text-[12px] font-semibold" style={{ color: sameLevelRestriction ? "#22C55E" : "#A0A0A0" }}>
                      {sameLevelRestriction ? "Active - same level only" : "Disabled - any level"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSameLevelRestriction(!sameLevelRestriction)}
                    className="relative w-[48px] h-[26px] rounded-full transition-all duration-300 active:scale-95"
                    style={{ background: sameLevelRestriction ? "#22C55E" : "#252525" }}
                  >
                    <div className="absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white transition-all duration-300" style={{ left: sameLevelRestriction ? "25px" : "3px" }} />
                  </button>
                </div>
              </div>

              {/* XP bonus */}
              <div className="rounded-[10px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: editingAttackField === "xpBonus" ? "#F9E741" : "#252525" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium" style={{ color: "#666666" }}>XP Bonus on Attack Win</p>
                  {savedField === "atk-xpBonus" && <span className="text-[10px]" style={{ color: "#22C55E" }}>Saved</span>}
                </div>
                {editingAttackField === "xpBonus" ? (
                  <div>
                    <input type="number" value={xpBonus} onChange={(e) => setXpBonus(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-[6px] text-[20px] font-extrabold outline-none mb-2" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} min="0" max="200" />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingAttackField(null); showSaved("atk-xpBonus"); }} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                      <button onClick={() => setEditingAttackField(null)} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-[24px] font-extrabold" style={{ color: "#F9E741" }}>+{xpBonus} XP</p>
                    <button onClick={() => setEditingAttackField("xpBonus")} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525] active:scale-95" style={{ background: "#252525" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ SECTION 4: FREE GAMES ═══ */}
          <div className="rounded-[12px] p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h6l3 4-6 8-6-8 3-4z" />
              </svg>
              <p className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>Free Games</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Daily count */}
              <div className="rounded-[10px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: editingFreeField === "dailyCount" ? "#F9E741" : "#252525" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium" style={{ color: "#666666" }}>Daily Free Games Count</p>
                  {savedField === "free-dailyCount" && <span className="text-[10px]" style={{ color: "#22C55E" }}>Saved</span>}
                </div>
                {editingFreeField === "dailyCount" ? (
                  <div>
                    <input type="number" value={dailyCount} onChange={(e) => setDailyCount(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-[6px] text-[20px] font-extrabold outline-none mb-2" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }} min="0" max="50" />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingFreeField(null); showSaved("free-dailyCount"); }} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                      <button onClick={() => setEditingFreeField(null)} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-[24px] font-extrabold" style={{ color: "#F9E741" }}>{dailyCount}</p>
                    <button onClick={() => setEditingFreeField("dailyCount")} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525] active:scale-95" style={{ background: "#252525" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Reset time */}
              <div className="rounded-[10px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: editingFreeField === "resetTime" ? "#F9E741" : "#252525" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium" style={{ color: "#666666" }}>Daily Reset Time</p>
                  {savedField === "free-resetTime" && <span className="text-[10px]" style={{ color: "#22C55E" }}>Saved</span>}
                </div>
                {editingFreeField === "resetTime" ? (
                  <div>
                    <input type="time" value={resetTime} onChange={(e) => setResetTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] text-[20px] font-extrabold outline-none mb-2" style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741", colorScheme: "dark" }} />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingFreeField(null); showSaved("free-resetTime"); }} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                      <button onClick={() => setEditingFreeField(null)} className="flex-1 py-1.5 rounded-[6px] text-[11px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-[24px] font-extrabold" style={{ color: "#F9E741" }}>{resetTime}</p>
                    <button onClick={() => setEditingFreeField("resetTime")} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525] active:scale-95" style={{ background: "#252525" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ SECTION 5: ATTACK HISTORY ═══ */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center gap-2 px-4 lg:px-5 py-3 border-b" style={{ borderColor: "#252525" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="9" r="7" /><path d="M9 5v4l3 2" />
              </svg>
              <p className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>Attack History</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>Recent 10</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr style={{ background: "#1A1A1A" }}>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>Date</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>Attacker</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>Victim</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {attacks.map((a, i) => (
                    <tr key={i} className="transition-all hover:bg-[#1A1A1A]/50" style={{ borderBottom: "1px solid #1A1A1A" }}>
                      <td className="px-4 py-2.5 text-[12px]" style={{ color: "#A0A0A0" }}>{a.date}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" />
                          </svg>
                          <span className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{a.attacker}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 1.5v3M4.5 7C2 7 1 9 1 10.5h12C13 9 12 7 9.5 7" /><circle cx="7" cy="4" r="2.5" />
                          </svg>
                          <span className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{a.victim}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: resultColor(a.result) + "15", color: resultColor(a.result) }}>
                          {resultLabel(a.result)}
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
    </div>
  );
}
