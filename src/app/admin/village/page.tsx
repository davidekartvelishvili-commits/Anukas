"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getVillageLevels, createVillageLevel, updateVillageLevel, deleteVillageLevel,
  getVillageCards, createVillageCard, updateVillageCard, deleteVillageCard,
  getVillageConfig, updateVillageConfig,
  getVillageAttacks, getVillageStats,
} from "@/services/admin";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="10" y="2" width="6" height="6" rx="1" /><rect x="2" y="10" width="6" height="6" rx="1" /><rect x="10" y="10" width="6" height="6" rx="1" /></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2" /></svg>,
    "algorithm-test": <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2v5l-3 5h10l-3-5V2" /><circle cx="9" cy="14" r="2" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>,
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="14" height="10" rx="1" /><path d="M9 6v10" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2.5" /><circle cx="13" cy="6" r="2.5" /></svg>,
    withdrawals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14V4M5 8l4-4 4 4" /></svg>,
    finance: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l3-2 4 3 3-4 4 3v8" /></svg>,
    village: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l7-5.5L16 8v8" /><path d="M6 16v-4h6v4" /></svg>,
    system: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="2.5" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2" /></svg>,
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
  { label: "System", id: "system", href: "/admin/system" },
];
const CURRENT = "village";

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF", rare: "#3B82F6", epic: "#A855F7", legendary: "#F59E0B",
};

function VillageContent() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<"levels" | "cards" | "settings" | "stats" | "attacks">("levels");

  // Levels
  const [levels, setLevels] = useState<any[]>([]);
  const [editLvl, setEditLvl] = useState<string | null>(null);
  const [editLvlData, setEditLvlData] = useState<any>(null);
  const [showAddLvl, setShowAddLvl] = useState(false);
  const [newLvl, setNewLvl] = useState({ levelNumber: "", starsRequired: "", maxWinAmount: "", description: "" });

  // Cards
  const [cards, setCards] = useState<any[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ name: "", rarity: "common", imageUrl: "", starValue: "", coinCost: "" });

  // Config
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configDirty, setConfigDirty] = useState<Record<string, string>>({});

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Attacks
  const [attacks, setAttacks] = useState<any[]>([]);
  const [attacksPage, setAttacksPage] = useState(1);

  const loadAll = useCallback(async () => {
    try {
      const [l, ca, co, s, a] = await Promise.all([
        getVillageLevels(), getVillageCards(), getVillageConfig(),
        getVillageStats(), getVillageAttacks(1),
      ]) as any[];
      if (l.success) setLevels(l.levels);
      if (ca.success) setCards(ca.cards);
      if (co.success) { setConfig(co.config); setConfigDirty(co.config); }
      if (s.success) setStats(s.stats);
      if (a.success) setAttacks(a.attacks);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Levels handlers
  const handleSaveLvl = async (id: string) => {
    if (!editLvlData) return;
    await updateVillageLevel(id, editLvlData);
    setEditLvl(null);
    setEditLvlData(null);
    loadAll();
  };
  const handleAddLvl = async () => {
    await createVillageLevel({
      levelNumber: parseInt(newLvl.levelNumber),
      starsRequired: parseInt(newLvl.starsRequired),
      maxWinAmount: parseFloat(newLvl.maxWinAmount),
      description: newLvl.description,
    });
    setShowAddLvl(false);
    setNewLvl({ levelNumber: "", starsRequired: "", maxWinAmount: "", description: "" });
    loadAll();
  };
  const handleDelLvl = async (id: string) => {
    if (!confirm("წაშალო ეს ლეველი?")) return;
    await deleteVillageLevel(id);
    loadAll();
  };

  // Cards handlers
  const handleAddCard = async () => {
    await createVillageCard({
      name: newCard.name, rarity: newCard.rarity, imageUrl: newCard.imageUrl || undefined,
      starValue: parseInt(newCard.starValue), coinCost: parseInt(newCard.coinCost),
    });
    setShowAddCard(false);
    setNewCard({ name: "", rarity: "common", imageUrl: "", starValue: "", coinCost: "" });
    loadAll();
  };
  const handleToggleCard = async (id: string, isActive: boolean) => {
    await updateVillageCard(id, { isActive: !isActive });
    loadAll();
  };
  const handleDelCard = async (id: string) => {
    if (!confirm("წაშალო ეს ბარათი?")) return;
    await deleteVillageCard(id);
    loadAll();
  };

  // Config handlers
  const handleSaveConfig = async () => {
    await updateVillageConfig(configDirty);
    setConfig(configDirty);
    alert("შენახულია");
  };

  const loadAttacksPage = async (p: number) => {
    setAttacksPage(p);
    const a = await getVillageAttacks(p) as any;
    if (a.success) setAttacks(a.attacks);
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
            const active = item.id === CURRENT;
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
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#A0A0A0" strokeWidth="1.5"><line x1="4" y1="7" x2="18" y2="7" /><line x1="4" y1="11" x2="18" y2="11" /><line x1="4" y1="15" x2="18" y2="15" /></svg>
          </button>
          <h1 className="text-[16px] font-semibold flex-1" style={{ color: "#FFFFFF" }}>სოფელი</h1>
        </header>

        <div className="p-4 lg:p-6">
          {/* TABS */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { id: "levels", label: "ლეველები" },
              { id: "cards", label: "ბარათები" },
              { id: "settings", label: "პარამეტრები" },
              { id: "stats", label: "სტატისტიკა" },
              { id: "attacks", label: "შეტევები" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)} className="px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{ background: tab === t.id ? "#F9E741" : "#1A1A1A", color: tab === t.id ? "#000" : "#A0A0A0", border: `1px solid ${tab === t.id ? "#F9E741" : "#252525"}` }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* LEVELS TAB */}
          {tab === "levels" && (
            <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold" style={{ color: "#FFF" }}>ლეველების კონფიგურაცია</h3>
                <button onClick={() => setShowAddLvl(true)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ background: "#F9E741", color: "#000" }}>+ ახალი ლეველი</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead><tr style={{ borderBottom: "1px solid #252525" }}>
                    {["ლეველი", "⭐ საჭირო", "მაქს. მოგება ₾", "აღწერა", "მოქმედება"].map(h => <th key={h} className="px-3 py-2 font-medium" style={{ color: "#666" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {levels.map(l => {
                      const editing = editLvl === l.id;
                      return (
                        <tr key={l.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                          <td className="px-3 py-2 font-bold" style={{ color: "#F9E741" }}>L{l.levelNumber}</td>
                          <td className="px-3 py-2" style={{ color: "#FFF" }}>
                            {editing ? <input type="number" value={editLvlData?.starsRequired || 0} onChange={(e) => setEditLvlData({ ...editLvlData, starsRequired: parseInt(e.target.value) })} className="w-20 rounded px-2 py-1" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} /> : `⭐ ${l.starsRequired}`}
                          </td>
                          <td className="px-3 py-2" style={{ color: "#FFF" }}>
                            {editing ? <input type="number" step="0.5" value={editLvlData?.maxWinAmount || 0} onChange={(e) => setEditLvlData({ ...editLvlData, maxWinAmount: parseFloat(e.target.value) })} className="w-20 rounded px-2 py-1" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} /> : `${l.maxWinAmount}₾`}
                          </td>
                          <td className="px-3 py-2" style={{ color: "#A0A0A0" }}>
                            {editing ? <input type="text" value={editLvlData?.description || ""} onChange={(e) => setEditLvlData({ ...editLvlData, description: e.target.value })} className="w-full rounded px-2 py-1" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} /> : (l.description || "—")}
                          </td>
                          <td className="px-3 py-2">
                            {editing ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleSaveLvl(l.id)} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "#22C55E20", color: "#22C55E" }}>✓</button>
                                <button onClick={() => { setEditLvl(null); setEditLvlData(null); }} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>×</button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <button onClick={() => { setEditLvl(l.id); setEditLvlData(l); }} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "#1A1A1A", color: "#F9E741", border: "1px solid #252525" }}>edit</button>
                                <button onClick={() => handleDelLvl(l.id)} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "#1A1A1A", color: "#EF4444", border: "1px solid #252525" }}>del</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CARDS TAB */}
          {tab === "cards" && (
            <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold" style={{ color: "#FFF" }}>ბარათების კატალოგი</h3>
                <button onClick={() => setShowAddCard(true)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ background: "#F9E741", color: "#000" }}>+ ახალი ბარათი</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {cards.map(c => (
                  <div key={c.id} className="rounded-xl p-3 border" style={{ background: "#0A0A0A", borderColor: RARITY_COLORS[c.rarity] + "40" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold" style={{ background: RARITY_COLORS[c.rarity] + "20", color: RARITY_COLORS[c.rarity] }}>{c.rarity}</span>
                      <button onClick={() => handleToggleCard(c.id, c.isActive)} className="text-[10px] px-2 py-0.5 rounded" style={{ background: c.isActive ? "#22C55E20" : "#1A1A1A", color: c.isActive ? "#22C55E" : "#666" }}>
                        {c.isActive ? "active" : "inactive"}
                      </button>
                    </div>
                    {c.imageUrl && <img src={c.imageUrl} alt={c.name} className="w-full h-24 object-cover rounded mb-2" />}
                    <p className="text-[14px] font-bold" style={{ color: "#FFF" }}>{c.name}</p>
                    <div className="flex justify-between mt-2 text-[12px]">
                      <span style={{ color: "#A0A0A0" }}>⭐ {c.starValue}</span>
                      <span style={{ color: "#F9E741" }}>{c.coinCost} ქოინი</span>
                    </div>
                    <button onClick={() => handleDelCard(c.id)} className="mt-2 w-full text-[10px] py-1 rounded" style={{ background: "#1A1A1A", color: "#EF4444", border: "1px solid #252525" }}>წაშლა</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {tab === "settings" && (
            <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
              <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFF" }}>სოფლის პარამეტრები</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "shield_cost_stars", label: "ფარის ფასი (⭐ ვარსკვლავი)" },
                  { key: "attack_cards_needed", label: "შეტევისთვის საჭირო ბარათი" },
                  { key: "attack_star_bonus", label: "შეტევის წარმატების ბონუსი (⭐)" },
                  { key: "attack_success_rate", label: "შეტევის წარმატების %" },
                ].map(s => (
                  <div key={s.key}>
                    <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>{s.label}</label>
                    <input type="number" value={configDirty[s.key] || ""} onChange={(e) => setConfigDirty({ ...configDirty, [s.key]: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-[14px] outline-none"
                      style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveConfig} className="mt-4 px-6 py-2 rounded-xl text-[13px] font-bold" style={{ background: "#F9E741", color: "#000" }}>შენახვა</button>
            </div>
          )}

          {/* STATS TAB */}
          {tab === "stats" && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
                  <p className="text-[11px]" style={{ color: "#666" }}>შეტევები დღეს</p>
                  <p className="text-[22px] font-bold" style={{ color: "#EF4444" }}>{stats.attacksToday}</p>
                </div>
                <div className="rounded-2xl border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
                  <p className="text-[11px]" style={{ color: "#666" }}>შეტევები კვირაში</p>
                  <p className="text-[22px] font-bold" style={{ color: "#EF4444" }}>{stats.attacksWeek}</p>
                </div>
                <div className="rounded-2xl border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
                  <p className="text-[11px]" style={{ color: "#666" }}>ბარათები დღეს</p>
                  <p className="text-[22px] font-bold" style={{ color: "#22C55E" }}>{stats.cardsBoughtToday}</p>
                </div>
                <div className="rounded-2xl border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
                  <p className="text-[11px]" style={{ color: "#666" }}>ბარათები კვირაში</p>
                  <p className="text-[22px] font-bold" style={{ color: "#22C55E" }}>{stats.cardsBoughtWeek}</p>
                </div>
              </div>

              <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                <h3 className="text-[13px] font-bold mb-3" style={{ color: "#FFF" }}>მომხმარებლები ლეველების მიხედვით</h3>
                {stats.usersPerLevel?.length === 0 ? <p className="text-[12px]" style={{ color: "#666" }}>მონაცემები არ არის</p> : (
                  <div className="space-y-1.5">
                    {stats.usersPerLevel.map((u: any) => {
                      const max = Math.max(...stats.usersPerLevel.map((x: any) => x.count));
                      return (
                        <div key={u.level} className="flex items-center gap-2">
                          <span className="w-12 text-[11px]" style={{ color: "#A0A0A0" }}>L{u.level}</span>
                          <div className="flex-1 h-5 rounded" style={{ background: "#0A0A0A" }}>
                            <div className="h-full rounded" style={{ background: "#F9E741", width: `${(u.count / max) * 100}%` }} />
                          </div>
                          <span className="w-12 text-right text-[11px]" style={{ color: "#FFF" }}>{u.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                <h3 className="text-[13px] font-bold mb-3" style={{ color: "#FFF" }}>ყველაზე პოპულარული ბარათები</h3>
                {stats.topCards?.length === 0 ? <p className="text-[12px]" style={{ color: "#666" }}>მონაცემები არ არის</p> : (
                  <table className="w-full text-[12px]">
                    <tbody>
                      {stats.topCards.map((c: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid #1A1A1A" }}>
                          <td className="py-2" style={{ color: "#666" }}>#{i + 1}</td>
                          <td className="py-2" style={{ color: "#FFF" }}>{c.name}</td>
                          <td className="py-2" style={{ color: RARITY_COLORS[c.rarity] || "#666" }}>{c.rarity}</td>
                          <td className="py-2 text-right" style={{ color: "#F9E741" }}>{c.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ATTACKS TAB */}
          {tab === "attacks" && (
            <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
              <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFF" }}>შეტევების ისტორია</h3>
              {attacks.length === 0 ? <p className="text-[12px]" style={{ color: "#666" }}>შეტევები არ არის</p> : (
                <table className="w-full text-left text-[12px]">
                  <thead><tr style={{ borderBottom: "1px solid #252525" }}>
                    {["თარიღი", "თავდამსხმელი", "მსხვერპლი", "ლეველი", "შედეგი", "⭐"].map(h => <th key={h} className="px-3 py-2 font-medium" style={{ color: "#666" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {attacks.map(a => {
                      const color = a.attackResult === "success" ? "#22C55E" : a.attackResult === "blocked" ? "#3B82F6" : "#EF4444";
                      return (
                        <tr key={a.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                          <td className="px-3 py-2" style={{ color: "#A0A0A0" }}>{new Date(a.createdAt).toLocaleString("ka-GE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="px-3 py-2" style={{ color: "#FFF" }}>{a.attackerName}</td>
                          <td className="px-3 py-2" style={{ color: "#FFF" }}>{a.victimName}</td>
                          <td className="px-3 py-2" style={{ color: "#F9E741" }}>L{a.attackerLevel}</td>
                          <td className="px-3 py-2"><span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: color + "20", color }}>{a.attackResult}</span></td>
                          <td className="px-3 py-2 text-right" style={{ color: "#F9E741" }}>{a.starsAwarded}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* ADD LEVEL MODAL */}
        {showAddLvl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowAddLvl(false)}>
            <div className="rounded-2xl p-5 w-full max-w-md border" style={{ background: "#111111", borderColor: "#252525" }} onClick={e => e.stopPropagation()}>
              <h3 className="text-[16px] font-bold mb-3" style={{ color: "#FFF" }}>ახალი ლეველი</h3>
              {[
                { k: "levelNumber", l: "ლეველი", t: "number" },
                { k: "starsRequired", l: "⭐ საჭირო", t: "number" },
                { k: "maxWinAmount", l: "მაქს. მოგება ₾", t: "number" },
                { k: "description", l: "აღწერა", t: "text" },
              ].map(f => (
                <div key={f.k} className="mb-3">
                  <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>{f.l}</label>
                  <input type={f.t} value={(newLvl as any)[f.k]} onChange={(e) => setNewLvl({ ...newLvl, [f.k]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-[14px] outline-none"
                    style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowAddLvl(false)} className="flex-1 px-4 py-2 rounded-xl text-[13px]" style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>გაუქმება</button>
                <button onClick={handleAddLvl} className="flex-1 px-4 py-2 rounded-xl text-[13px] font-bold" style={{ background: "#F9E741", color: "#000" }}>დამატება</button>
              </div>
            </div>
          </div>
        )}

        {/* ADD CARD MODAL */}
        {showAddCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowAddCard(false)}>
            <div className="rounded-2xl p-5 w-full max-w-md border" style={{ background: "#111111", borderColor: "#252525" }} onClick={e => e.stopPropagation()}>
              <h3 className="text-[16px] font-bold mb-3" style={{ color: "#FFF" }}>ახალი ბარათი</h3>
              <div className="mb-3">
                <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>სახელი</label>
                <input value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} className="w-full rounded-lg px-3 py-2 text-[14px] outline-none" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
              </div>
              <div className="mb-3">
                <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>იშვიათობა</label>
                <select value={newCard.rarity} onChange={e => setNewCard({ ...newCard, rarity: e.target.value })} className="w-full rounded-lg px-3 py-2 text-[14px] outline-none" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }}>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>სურათის URL (არასავალდებულო)</label>
                <input value={newCard.imageUrl} onChange={e => setNewCard({ ...newCard, imageUrl: e.target.value })} className="w-full rounded-lg px-3 py-2 text-[14px] outline-none" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>⭐ ვარსკვლავი</label>
                  <input type="number" value={newCard.starValue} onChange={e => setNewCard({ ...newCard, starValue: e.target.value })} className="w-full rounded-lg px-3 py-2 text-[14px] outline-none" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
                </div>
                <div>
                  <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>ქოინი</label>
                  <input type="number" value={newCard.coinCost} onChange={e => setNewCard({ ...newCard, coinCost: e.target.value })} className="w-full rounded-lg px-3 py-2 text-[14px] outline-none" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowAddCard(false)} className="flex-1 px-4 py-2 rounded-xl text-[13px]" style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>გაუქმება</button>
                <button onClick={handleAddCard} className="flex-1 px-4 py-2 rounded-xl text-[13px] font-bold" style={{ background: "#F9E741", color: "#000" }}>დამატება</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function VillagePage() {
  return <AdminAuthGuard><VillageContent /></AdminAuthGuard>;
}
