"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getVillagesList, getVillageDetail, createVillage, updateVillage, deleteVillage, updateVillageBuilding,
  getVillageLevels, createVillageLevel, updateVillageLevel, deleteVillageLevel,
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
  { label: "Offers", id: "offers", href: "/admin/offers" },
  { label: "Tickets", id: "tickets", href: "/admin/tickets" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin/system" },
];
const CURRENT = "village";

// Image upload helper — converts file to base64, resized to max 500x500
async function fileToCompressedBase64(file: File, maxDim = 500, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function VillageContent() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<"villages" | "levels" | "settings" | "stats" | "attacks">("villages");

  // Villages
  const [villagesList, setVillagesList] = useState<any[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<any>(null);
  const [showAddVillage, setShowAddVillage] = useState(false);
  const [newVillageName, setNewVillageName] = useState("");
  const [newVillageTheme, setNewVillageTheme] = useState("");

  // Levels (existing system)
  const [levels, setLevels] = useState<any[]>([]);
  const [editLvl, setEditLvl] = useState<string | null>(null);
  const [editLvlData, setEditLvlData] = useState<any>(null);

  // Config
  const [configDirty, setConfigDirty] = useState<Record<string, string>>({});

  // Stats / attacks
  const [stats, setStats] = useState<any>(null);
  const [attacks, setAttacks] = useState<any[]>([]);

  const loadVillages = useCallback(async () => {
    try {
      const r = await getVillagesList() as any;
      if (r.success) {
        setVillagesList(r.villages);
        if (!selectedVillageId && r.villages[0]) {
          setSelectedVillageId(r.villages[0].id);
          setSelectedVillage(r.villages[0]);
        } else if (selectedVillageId) {
          const v = r.villages.find((x: any) => x.id === selectedVillageId);
          if (v) setSelectedVillage(v);
        }
      }
    } catch (e) { console.error(e); }
  }, [selectedVillageId]);

  const loadOther = useCallback(async () => {
    try {
      const [l, co, s, a] = await Promise.all([
        getVillageLevels(), getVillageConfig(), getVillageStats(), getVillageAttacks(1),
      ]) as any[];
      if (l.success) setLevels(l.levels);
      if (co.success) setConfigDirty(co.config);
      if (s.success) setStats(s.stats);
      if (a.success) setAttacks(a.attacks);
    } catch {}
  }, []);

  useEffect(() => { loadVillages(); }, [loadVillages]);
  useEffect(() => { loadOther(); }, [loadOther]);

  const handleAddVillage = async () => {
    if (!newVillageName.trim()) return;
    try {
      await createVillage({ name: newVillageName, theme: newVillageTheme || undefined });
      setShowAddVillage(false);
      setNewVillageName("");
      setNewVillageTheme("");
      loadVillages();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteVillage = async (id: string) => {
    if (!confirm("წავშალო ეს ვილიჯი?")) return;
    try {
      await deleteVillage(id);
      setSelectedVillageId(null);
      setSelectedVillage(null);
      loadVillages();
    } catch (e: any) { alert(e.message); }
  };

  // Building edit handlers
  const handleSaveBuildingField = async (buildingId: string, field: string, value: any) => {
    if (!selectedVillage) return;
    try {
      await updateVillageBuilding(selectedVillage.id, buildingId, { [field]: value });
      // Optimistic update
      setSelectedVillage((v: any) => ({
        ...v,
        buildings: v.buildings.map((b: any) => b.id === buildingId ? { ...b, [field]: value } : b),
      }));
    } catch (e: any) { alert(e.message); }
  };

  const handleImageUpload = async (buildingId: string, starField: string, file: File) => {
    try {
      const base64 = await fileToCompressedBase64(file);
      await handleSaveBuildingField(buildingId, starField, base64);
    } catch (e: any) { alert("სურათის დატვირთვა ვერ მოხერხდა: " + e.message); }
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
              { id: "villages", label: "ვილიჯები" },
              { id: "levels", label: "ლეველები" },
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

          {/* VILLAGES TAB */}
          {tab === "villages" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold" style={{ color: "#FFF" }}>ვილიჯების სია</h3>
                <button onClick={() => setShowAddVillage(true)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ background: "#F9E741", color: "#000" }}>+ ახალი ვილიჯი</button>
              </div>

              {/* Village picker tabs */}
              <div className="flex flex-wrap gap-2">
                {villagesList.map(v => (
                  <button key={v.id} onClick={() => { setSelectedVillageId(v.id); setSelectedVillage(v); }}
                    className="px-4 py-2 rounded-xl text-[12px] font-medium"
                    style={{
                      background: selectedVillageId === v.id ? "#F9E741" : "#1A1A1A",
                      color: selectedVillageId === v.id ? "#000" : "#A0A0A0",
                      border: `1px solid ${selectedVillageId === v.id ? "#F9E741" : "#252525"}`
                    }}>
                    L{v.position} · {v.name}
                  </button>
                ))}
              </div>

              {/* Selected village editor */}
              {selectedVillage && (
                <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <input
                        defaultValue={selectedVillage.name}
                        onBlur={async (e) => {
                          if (e.target.value !== selectedVillage.name) {
                            await updateVillage(selectedVillage.id, { name: e.target.value });
                            loadVillages();
                          }
                        }}
                        className="text-[18px] font-bold bg-transparent outline-none border-b"
                        style={{ color: "#F9E741", borderColor: "#252525" }}
                      />
                      <p className="text-[11px] mt-1" style={{ color: "#666" }}>
                        Position L{selectedVillage.position} · Theme: {selectedVillage.theme || "—"}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteVillage(selectedVillage.id)} className="px-3 py-1.5 rounded-lg text-[11px]" style={{ background: "#1A1A1A", color: "#EF4444", border: "1px solid #252525" }}>
                      წაშლა
                    </button>
                  </div>

                  {/* 5 buildings, each row = 4 stars */}
                  <div className="space-y-5">
                    {selectedVillage.buildings?.map((b: any) => (
                      <BuildingEditor key={b.id} building={b}
                        onFieldSave={(field, value) => handleSaveBuildingField(b.id, field, value)}
                        onImageUpload={(starField, file) => handleImageUpload(b.id, starField, file)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LEVELS TAB (existing) */}
          {tab === "levels" && (
            <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
              <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFF" }}>მაქს. მოგების ლიმიტი ლეველის მიხედვით</h3>
              <p className="text-[11px] mb-4" style={{ color: "#666" }}>ეს ცხრილი განსაზღვრავს თითოეული ლეველის (= ვილიჯის) მაქსიმუმ მოგებას ალგორითმში</p>
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
                                <button onClick={async () => { await updateVillageLevel(l.id, editLvlData); setEditLvl(null); setEditLvlData(null); loadOther(); }} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "#22C55E20", color: "#22C55E" }}>✓</button>
                                <button onClick={() => { setEditLvl(null); setEditLvlData(null); }} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>×</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditLvl(l.id); setEditLvlData(l); }} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "#1A1A1A", color: "#F9E741", border: "1px solid #252525" }}>edit</button>
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
              <button onClick={async () => { await updateVillageConfig(configDirty); alert("შენახულია"); }} className="mt-4 px-6 py-2 rounded-xl text-[13px] font-bold" style={{ background: "#F9E741", color: "#000" }}>შენახვა</button>
            </div>
          )}

          {/* STATS TAB */}
          {tab === "stats" && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "შეტევები დღეს", val: stats.attacksToday, color: "#EF4444" },
                  { label: "შეტევები კვირაში", val: stats.attacksWeek, color: "#EF4444" },
                  { label: "ბარათები დღეს", val: stats.cardsBoughtToday, color: "#22C55E" },
                  { label: "ბარათები კვირაში", val: stats.cardsBoughtWeek, color: "#22C55E" },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
                    <p className="text-[11px]" style={{ color: "#666" }}>{s.label}</p>
                    <p className="text-[22px] font-bold" style={{ color: s.color }}>{s.val}</p>
                  </div>
                ))}
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
                    {["თარიღი", "თავდამსხმელი", "მსხვერპლი", "ლეველი", "შედეგი"].map(h => <th key={h} className="px-3 py-2 font-medium" style={{ color: "#666" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {attacks.map(a => (
                      <tr key={a.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                        <td className="px-3 py-2" style={{ color: "#A0A0A0" }}>{new Date(a.createdAt).toLocaleString("ka-GE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="px-3 py-2" style={{ color: "#FFF" }}>{a.attackerName}</td>
                        <td className="px-3 py-2" style={{ color: "#FFF" }}>{a.victimName}</td>
                        <td className="px-3 py-2" style={{ color: "#F9E741" }}>L{a.attackerLevel}</td>
                        <td className="px-3 py-2">{a.attackResult}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* ADD VILLAGE MODAL */}
        {showAddVillage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowAddVillage(false)}>
            <div className="rounded-2xl p-5 w-full max-w-md border" style={{ background: "#111111", borderColor: "#252525" }} onClick={e => e.stopPropagation()}>
              <h3 className="text-[16px] font-bold mb-3" style={{ color: "#FFF" }}>ახალი ვილიჯი</h3>
              <p className="text-[10px] mb-3" style={{ color: "#666" }}>5 ბილდინგი ავტომატურად შეიქმნება. შემდეგ შეცვალე სახელები და დატვირთე სურათები.</p>
              <div className="mb-3">
                <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>სახელი</label>
                <input value={newVillageName} onChange={e => setNewVillageName(e.target.value)} className="w-full rounded-lg px-3 py-2 text-[14px]" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
              </div>
              <div className="mb-4">
                <label className="text-[11px] block mb-1.5" style={{ color: "#A0A0A0" }}>თემა (georgian, egyptian, ...)</label>
                <input value={newVillageTheme} onChange={e => setNewVillageTheme(e.target.value)} className="w-full rounded-lg px-3 py-2 text-[14px]" style={{ background: "#1A1A1A", border: "1px solid #252525", color: "#FFF" }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddVillage(false)} className="flex-1 px-4 py-2 rounded-xl text-[13px]" style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>გაუქმება</button>
                <button onClick={handleAddVillage} className="flex-1 px-4 py-2 rounded-xl text-[13px] font-bold" style={{ background: "#F9E741", color: "#000" }}>დამატება</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Building editor: 4 stars in a row, each with image upload + name + cost ──
function BuildingEditor({ building, onFieldSave, onImageUpload }: {
  building: any;
  onFieldSave: (field: string, value: any) => void;
  onImageUpload: (starField: string, file: File) => void;
}) {
  const [name, setName] = useState(building.name);
  const stars = [1, 2, 3, 4];

  return (
    <div className="rounded-xl p-4" style={{ background: "#0A0A0A", border: "1px solid #1A1A1A" }}>
      <div className="mb-3">
        <label className="text-[10px]" style={{ color: "#666" }}>ბილდინგის სახელი</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => name !== building.name && onFieldSave("name", name)}
          className="block w-full md:w-64 rounded-lg px-3 py-1.5 text-[14px] font-bold mt-1"
          style={{ background: "#111", border: "1px solid #252525", color: "#F9E741" }}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stars.map(star => (
          <StarSlot key={star} building={building} star={star}
            onFieldSave={onFieldSave}
            onImageUpload={onImageUpload}
          />
        ))}
      </div>
    </div>
  );
}

function StarSlot({ building, star, onFieldSave, onImageUpload }: {
  building: any; star: number;
  onFieldSave: (field: string, value: any) => void;
  onImageUpload: (starField: string, file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const nameKey = `star${star}Name` as const;
  const costKey = `star${star}Cost` as const;
  const imgKey = `star${star}Image` as const;
  const [name, setName] = useState(building[nameKey] || "");
  const [cost, setCost] = useState(building[costKey] || 0);
  const image = building[imgKey];

  return (
    <div className="rounded-lg p-2" style={{ background: "#111", border: "1px solid #252525" }}>
      <div className="text-[10px] mb-1.5 font-bold" style={{ color: "#F9E741" }}>{"⭐".repeat(star)}</div>
      <div
        onClick={() => fileRef.current?.click()}
        className="aspect-square rounded-md mb-2 flex items-center justify-center cursor-pointer overflow-hidden"
        style={{ background: "#0A0A0A", border: "1px dashed #333" }}
      >
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px]" style={{ color: "#555" }}>+ სურათი</span>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageUpload(imgKey, f); }} />
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={() => name !== building[nameKey] && onFieldSave(nameKey, name)}
        placeholder="სახელი"
        className="w-full rounded px-2 py-1 text-[10px] mb-1"
        style={{ background: "#0A0A0A", border: "1px solid #252525", color: "#FFF" }}
      />
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={cost}
          onChange={e => setCost(parseInt(e.target.value) || 0)}
          onBlur={() => cost !== building[costKey] && onFieldSave(costKey, cost)}
          className="flex-1 rounded px-2 py-1 text-[10px]"
          style={{ background: "#0A0A0A", border: "1px solid #252525", color: "#FFF" }}
        />
        <span className="text-[9px]" style={{ color: "#666" }}>ქოინი</span>
      </div>
      {image && (
        <button
          onClick={() => onFieldSave(imgKey, null)}
          className="w-full mt-1 text-[9px] py-0.5 rounded"
          style={{ background: "#0A0A0A", color: "#EF4444", border: "1px solid #252525" }}
        >
          წაშლა
        </button>
      )}
    </div>
  );
}

export default function VillagePage() {
  return <AdminAuthGuard><VillageContent /></AdminAuthGuard>;
}
