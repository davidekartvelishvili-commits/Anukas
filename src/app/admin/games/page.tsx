"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getGameConfig, updateGameConfig } from "@/services/admin";

/* ── SVG ICONS (NavIcon) ── */
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
  { label: "Shansi Drops", id: "tickets", href: "/admin/tickets" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin" },
];

/* ── Game SVG Icons ── */
function SlotMachineIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="24" height="20" rx="3" />
      <rect x="8" y="10" width="5" height="8" rx="1" />
      <rect x="13.5" y="10" width="5" height="8" rx="1" />
      <rect x="19" y="10" width="5" height="8" rx="1" />
      <circle cx="16" cy="23" r="1.5" fill="#F9E741" />
      <path d="M26 10l28 8" stroke="#F9E741" strokeWidth="2" />
    </svg>
  );
}

function LuckyDropIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4c0 0-8 8-8 16a8 8 0 0016 0c0-8-8-16-8-16z" />
      <path d="M12 20a4 4 0 004 4" />
    </svg>
  );
}

function LuckyStepIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 26h6v-6H6z" />
      <path d="M13 20h6v-8h-6z" />
      <path d="M20 12h6v-6h-6z" />
      <path d="M9 20V14" />
      <path d="M16 12V8" />
    </svg>
  );
}

function ComingSoonIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="12" />
      <path d="M16 10v6l4 2" />
    </svg>
  );
}

function CardDropIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="18" rx="2" />
      <path d="M7 4V2h10v14h-2" />
      <path d="M7 12l3 3 4-5" />
    </svg>
  );
}

/* ── Game data interface ── */
interface GameData {
  id: string;
  name: string;
  nameKa: string;
  icon: JSX.Element;
  enabled: boolean;
  playsToday: number;
  playsTotal: number;
  totalWon: number;
  avgWin: number;
  xpPerPlay: number;
}

export default function GamesPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const GAME_META: Record<string, { name: string; nameKa: string; icon: JSX.Element }> = {
    slot: { name: "Midnight Machine", nameKa: "\u10E1\u10DA\u10DD\u10E2 \u10DB\u10D0\u10DC\u10E5\u10D0\u10DC\u10D0", icon: <SlotMachineIcon /> },
    plinko: { name: "Lucky Drop", nameKa: "\u10D8\u10E6\u10D1\u10DA\u10D8\u10D0\u10DC\u10D8 \u10EC\u10D5\u10D4\u10D7\u10D8", icon: <LuckyDropIcon /> },
    chicken_rush: { name: "Lucky Step", nameKa: "\u10D8\u10E6\u10D1\u10DA\u10D8\u10D0\u10DC\u10D8 \u10DC\u10D0\u10D1\u10D8\u10EF\u10D8", icon: <LuckyStepIcon /> },
  };

  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmToggle, setConfirmToggle] = useState<{ gameType: string; currentEnabled: boolean } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [toggling, setToggling] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchGames = useCallback(async () => {
    try {
      const data = await getGameConfig();
      if (data.configs) {
        setGames(data.configs.map((c: any) => {
          const meta = GAME_META[c.gameType] || { name: c.gameType, nameKa: c.gameType, icon: <SlotMachineIcon /> };
          return {
            id: c.gameType,
            name: meta.name,
            nameKa: meta.nameKa,
            icon: meta.icon,
            enabled: c.isActive,
            // REAL stats from backend
            playsToday: c.stats?.playsToday ?? 0,
            playsTotal: c.stats?.playsTotal ?? 0,
            totalWon: c.stats?.totalWon ?? 0,
            avgWin: c.stats?.avgWin ?? 0,
            xpPerPlay: 10,
          };
        }));
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const [editingXp, setEditingXp] = useState<string | null>(null);
  const [xpValue, setXpValue] = useState(0);
  const [savedXp, setSavedXp] = useState<string | null>(null);

  const [cardDropChance, setCardDropChance] = useState(5);
  const [editingCardDrop, setEditingCardDrop] = useState(false);
  const [cardDropValue, setCardDropValue] = useState(5);
  const [cardDropSaved, setCardDropSaved] = useState(false);

  const toggleGame = (id: string) => {
    const game = games.find(g => g.id === id);
    if (game) setConfirmToggle({ gameType: id, currentEnabled: game.enabled });
  };

  const confirmToggleAction = async () => {
    if (!confirmToggle) return;
    setToggling(true);
    try {
      await updateGameConfig(confirmToggle.gameType, { isActive: !confirmToggle.currentEnabled });
      showToast(
        confirmToggle.currentEnabled
          ? `${GAME_META[confirmToggle.gameType]?.name || confirmToggle.gameType} \u10D2\u10D0\u10D7\u10D8\u10E8\u10E3\u10DA\u10D8\u10D0 \u2014 \u10DB\u10DD\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10DA\u10D4\u10D1\u10E1 \u10D0\u10E0 \u10D3\u10D0\u10D8\u10DC\u10D0\u10EE\u10D0\u10D5\u10D4\u10DC`
          : `${GAME_META[confirmToggle.gameType]?.name || confirmToggle.gameType} \u10D2\u10D0\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D3\u10D0`,
        "success"
      );
      fetchGames();
    } catch (e: any) {
      showToast(e.message || "\u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D0", "error");
    } finally {
      setToggling(false);
      setConfirmToggle(null);
    }
  };

  const handleSaveXp = (id: string) => {
    const clamped = Math.min(100, Math.max(1, xpValue));
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, xpPerPlay: clamped } : g))
    );
    setEditingXp(null);
    setSavedXp(id);
    setTimeout(() => setSavedXp(null), 2000);
  };

  const handleSaveCardDrop = () => {
    const clamped = Math.min(100, Math.max(0.1, cardDropValue));
    setCardDropChance(clamped);
    setEditingCardDrop(false);
    setCardDropSaved(true);
    setTimeout(() => setCardDropSaved(false), 2000);
  };

  const ACTIVE_ID = "games";

  return (
    <div
      className="min-h-[100dvh] flex"
      style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* ── SIDEBAR (Desktop) ── */}
      <aside
        className="hidden lg:flex flex-col w-[220px] shrink-0 border-r"
        style={{ background: "#111111", borderColor: "#252525" }}
      >
        <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
          <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>
            SHANSI
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>
            Admin Panel
          </p>
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
              style={{
                background: item.id === ACTIVE_ID ? "#1A1A1A" : "transparent",
                borderLeft: item.id === ACTIVE_ID ? "3px solid #F9E741" : "3px solid transparent",
              }}
            >
              <NavIcon id={item.id} active={item.id === ACTIVE_ID} />
              <span
                className="text-[13px] font-medium"
                style={{ color: item.id === ACTIVE_ID ? "#FFFFFF" : "#A0A0A0" }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── MOBILE SIDEBAR ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[250px] border-r flex flex-col"
            style={{ background: "#111111", borderColor: "#252525" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
              <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>
                SHANSI
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>
                Admin Panel
              </p>
            </div>
            <nav className="flex-1 py-3">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
                  style={{
                    background: item.id === ACTIVE_ID ? "#1A1A1A" : "transparent",
                    borderLeft: item.id === ACTIVE_ID ? "3px solid #F9E741" : "3px solid transparent",
                  }}
                >
                  <NavIcon id={item.id} active={item.id === ACTIVE_ID} />
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: item.id === ACTIVE_ID ? "#FFFFFF" : "#A0A0A0" }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 py-3 border-b"
          style={{ background: "#000000", borderColor: "#252525" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md"
              style={{ background: "#1A1A1A" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="5" x2="15" y2="5" />
                <line x1="3" y1="9" x2="15" y2="9" />
                <line x1="3" y1="13" x2="15" y2="13" />
              </svg>
            </button>
            <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>
              GAMES MANAGEMENT
            </h2>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
            {games.filter((g) => g.enabled).length}/{games.length} Active
          </span>
        </header>

        <div className="p-4 lg:p-6 space-y-4">

          {/* ═══ GAME CARDS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {games.map((game) => {
              const isEditingXp = editingXp === game.id;
              const isSaved = savedXp === game.id;

              return (
                <div
                  key={game.id}
                  className="rounded-[12px] border transition-all"
                  style={{
                    background: "#111111",
                    borderColor: game.enabled ? "#252525" : "#1A1A1A",
                    opacity: game.enabled ? 1 : 0.6,
                  }}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#252525" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                        style={{ background: game.enabled ? "#F9E74115" : "#1A1A1A" }}
                      >
                        {game.icon}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold" style={{ color: "#FFFFFF" }}>
                          {game.name}
                        </p>
                        <p className="text-[11px]" style={{ color: "#666666" }}>
                          {game.nameKa}
                        </p>
                      </div>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => toggleGame(game.id)}
                      className="relative w-[48px] h-[26px] rounded-full transition-all duration-300"
                      style={{ background: game.enabled ? "#22C55E" : "#333333" }}
                    >
                      <div
                        className="absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white transition-all duration-300"
                        style={{ left: game.enabled ? "25px" : "3px" }}
                      />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[8px] p-3" style={{ background: "#1A1A1A" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#666666" }}>
                          Plays Today
                        </p>
                        <p className="text-[18px] font-extrabold" style={{ color: "#FFFFFF" }}>
                          {game.playsToday.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-[8px] p-3" style={{ background: "#1A1A1A" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#666666" }}>
                          Plays Total
                        </p>
                        <p className="text-[18px] font-extrabold" style={{ color: "#FFFFFF" }}>
                          {game.playsTotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-[8px] p-3" style={{ background: "#1A1A1A" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#666666" }}>
                          Total Won
                        </p>
                        <p className="text-[16px] font-extrabold" style={{ color: "#F9E741" }}>
                          {game.totalWon.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="rounded-[8px] p-3" style={{ background: "#1A1A1A" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#666666" }}>
                          Avg Win
                        </p>
                        <p className="text-[16px] font-extrabold" style={{ color: "#A0A0A0" }}>
                          {game.avgWin.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* XP Per Play */}
                    <div
                      className="rounded-[8px] p-3 border transition-all"
                      style={{
                        background: "#1A1A1A",
                        borderColor: isEditingXp ? "#F9E741" : "#252525",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "#666666" }}>
                          XP Reward / Play
                        </p>
                        {isSaved && (
                          <span className="text-[10px] font-medium" style={{ color: "#22C55E" }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                              <polyline points="2,6 5,9 10,3" />
                            </svg>
                            Saved
                          </span>
                        )}
                      </div>

                      {isEditingXp ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setXpValue(Math.max(1, xpValue - 1))}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[16px] font-bold transition-all hover:opacity-80 active:scale-95"
                              style={{ background: "#252525", color: "#A0A0A0" }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={xpValue}
                              onChange={(e) => setXpValue(parseInt(e.target.value) || 0)}
                              className="flex-1 text-center text-[20px] font-extrabold rounded-md py-1 outline-none"
                              style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }}
                              min={1}
                              max={100}
                            />
                            <button
                              onClick={() => setXpValue(Math.min(100, xpValue + 1))}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[16px] font-bold transition-all hover:opacity-80 active:scale-95"
                              style={{ background: "#252525", color: "#A0A0A0" }}
                            >
                              +
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveXp(game.id)}
                              className="flex-1 py-1.5 rounded-[8px] text-[11px] font-bold transition-all hover:opacity-90 active:scale-[0.97]"
                              style={{ background: "#F9E741", color: "#000" }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingXp(null)}
                              className="flex-1 py-1.5 rounded-[8px] text-[11px] font-bold transition-all hover:opacity-80"
                              style={{ background: "#252525", color: "#A0A0A0" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-[22px] font-extrabold" style={{ color: "#F9E741" }}>
                            {game.xpPerPlay} XP
                          </p>
                          <button
                            onClick={() => {
                              setEditingXp(game.id);
                              setXpValue(game.xpPerPlay);
                            }}
                            className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
                            style={{ background: "#252525" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ CARD DROP RATE ═══ */}
          <div
            className="rounded-[12px] p-5 border transition-all"
            style={{
              background: "#111111",
              borderColor: editingCardDrop ? "#F9E741" : "#252525",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: "#F9E74115" }}
              >
                <CardDropIcon />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: "#FFFFFF" }}>
                  Attack Card Drop Chance
                </p>
                <p className="text-[11px]" style={{ color: "#666666" }}>
                  თამაშის შემდეგ Attack ბარათის მოპოვების შანსი
                </p>
              </div>
              {cardDropSaved && (
                <span className="ml-auto text-[11px] font-medium flex items-center gap-1" style={{ color: "#22C55E" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                  Saved
                </span>
              )}
            </div>

            {editingCardDrop ? (
              <div className="max-w-[360px] space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={cardDropValue}
                    onChange={(e) => setCardDropValue(parseFloat(e.target.value) || 0)}
                    className="w-[120px] text-center text-[24px] font-extrabold rounded-[8px] px-3 py-2 outline-none"
                    style={{ background: "#1A1A1A", color: "#F9E741", border: "1px solid #F9E741" }}
                    min={0.1}
                    max={100}
                    step={0.1}
                  />
                  <span className="text-[20px] font-bold" style={{ color: "#A0A0A0" }}>
                    %
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: "#666666" }}>
                  Range: 0.1% -- 100%
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCardDrop}
                    className="px-6 py-2 rounded-[8px] text-[12px] font-bold transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: "#F9E741", color: "#000" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingCardDrop(false);
                      setCardDropValue(cardDropChance);
                    }}
                    className="px-6 py-2 rounded-[8px] text-[12px] font-bold transition-all hover:opacity-80"
                    style={{ background: "#1A1A1A", color: "#A0A0A0" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-[32px] font-extrabold" style={{ color: "#F9E741" }}>
                  {cardDropChance}%
                </p>
                <button
                  onClick={() => {
                    setEditingCardDrop(true);
                    setCardDropValue(cardDropChance);
                  }}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* ═══ COMING SOON ═══ */}
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#666666" }}>
              Coming Soon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "Wheel of Fortune", nameKa: "ბედის ბორბალი" },
                { name: "Scratch Cards", nameKa: "სქრეჩ ბარათები" },
                { name: "Daily Challenge", nameKa: "დღის გამოწვევა" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="rounded-[12px] p-4 border flex items-center gap-3"
                  style={{ background: "#111111", borderColor: "#1A1A1A", opacity: 0.5 }}
                >
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                    style={{ background: "#1A1A1A" }}
                  >
                    <ComingSoonIcon />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold" style={{ color: "#A0A0A0" }}>
                      {item.name}
                    </p>
                    <p className="text-[11px]" style={{ color: "#666666" }}>
                      {item.nameKa}
                    </p>
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                    style={{ background: "#F9E74115", color: "#F9E741" }}
                  >
                    მალე დაემატება
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ ADD NEW GAME BUTTON ═══ */}
          <button
            disabled
            className="w-full rounded-[12px] p-4 border border-dashed flex items-center justify-center gap-2 transition-all"
            style={{
              background: "transparent",
              borderColor: "#252525",
              opacity: 0.4,
              cursor: "not-allowed",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round">
              <line x1="9" y1="3" x2="9" y2="15" />
              <line x1="3" y1="9" x2="15" y2="9" />
            </svg>
            <span className="text-[13px] font-bold" style={{ color: "#666666" }}>
              ახალი თამაშის დამატება
            </span>
          </button>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-[12px] shadow-lg transition-all" style={{ background: toast.type === "success" ? "#22C55E20" : "#EF444420", border: `1px solid ${toast.type === "success" ? "#22C55E40" : "#EF444440"}` }}>
          <p className="text-[13px] font-medium" style={{ color: toast.type === "success" ? "#22C55E" : "#EF4444" }}>{toast.message}</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setConfirmToggle(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-[90%] max-w-[360px]" style={{ background: "#111111", border: `1px solid ${confirmToggle.currentEnabled ? "#EF444440" : "#22C55E40"}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              {confirmToggle.currentEnabled ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M10 2L1 18h18L10 2z" /><line x1="10" y1="8" x2="10" y2="12" /><circle cx="10" cy="15" r="0.5" fill="#EF4444" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="4,10 8,14 16,6" /></svg>
              )}
              <h3 className="text-[16px] font-bold" style={{ color: confirmToggle.currentEnabled ? "#EF4444" : "#22C55E" }}>
                {confirmToggle.currentEnabled ? "\u10D7\u10D0\u10DB\u10D0\u10E8\u10D8\u10E1 \u10D2\u10D0\u10D7\u10D8\u10E8\u10D5\u10D0" : "\u10D7\u10D0\u10DB\u10D0\u10E8\u10D8\u10E1 \u10D2\u10D0\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D4\u10D1\u10D0"}
              </h3>
            </div>
            <p className="text-[13px] mb-4 leading-relaxed" style={{ color: "#A0A0A0" }}>
              {confirmToggle.currentEnabled
                ? <><span className="font-bold text-white">{GAME_META[confirmToggle.gameType]?.name}</span> {"\u10D2\u10D0\u10D8\u10D7\u10D8\u10E8\u10D4\u10D1\u10D0 \u10D3\u10D0 \u10DB\u10DD\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10DA\u10D4\u10D1\u10E1 \u10D0\u10E0 \u10D3\u10D0\u10D8\u10DC\u10D0\u10EE\u10D0\u10D5\u10D4\u10DC. \u10D3\u10D0\u10E0\u10EC\u10DB\u10E3\u10DC\u10D4\u10D1\u10E3\u10DA\u10D8 \u10EE\u10D0\u10E0?"}</>
                : <><span className="font-bold text-white">{GAME_META[confirmToggle.gameType]?.name}</span> {"\u10D2\u10D0\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D3\u10D4\u10D1\u10D0 \u10D3\u10D0 \u10DB\u10DD\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10DA\u10D4\u10D1\u10E1 \u10D3\u10D0\u10D8\u10DC\u10D0\u10EE\u10D0\u10D5\u10D4\u10DC. \u10D3\u10D0\u10E0\u10EC\u10DB\u10E3\u10DC\u10D4\u10D1\u10E3\u10DA\u10D8 \u10EE\u10D0\u10E0?"}</>
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmToggleAction}
                disabled={toggling}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: confirmToggle.currentEnabled ? "#EF4444" : "#22C55E", color: "#FFFFFF" }}
              >
                {toggling ? "..." : confirmToggle.currentEnabled ? "\u10D2\u10D0\u10D7\u10D8\u10E8\u10D5\u10D0" : "\u10D2\u10D0\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D4\u10D1\u10D0"}
              </button>
              <button onClick={() => setConfirmToggle(null)} className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                {"\u10D2\u10D0\u10E3\u10E5\u10DB\u10D4\u10D1\u10D0"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
