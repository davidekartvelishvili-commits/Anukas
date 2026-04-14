"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getReferralConfig, updateReferralConfig, getReferrals } from "@/services/admin";

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
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 9.11V9a7 7 0 10-2.06 4.94" /><path d="M10 6l-4 6" /><circle cx="7" cy="7.5" r="1" /><circle cx="11" cy="10.5" r="1" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5" /><path d="M1 15c0-2.8 2.2-5 5-5s5 2.2 5 5" /><circle cx="13.5" cy="6.5" r="2" /><path d="M13.5 10.5c1.9 0 3.5 1.3 3.5 3" /></svg>,
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
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin/system" },
];

const ACTIVE_ID = "referrals";

/* ── INTERFACES ── */
interface ReferralConfig {
  id: string;
  referrerRewardCoins: number;
  referredRewardCoins: number;
  bonusEveryN?: number;
  bonusRewardCoins?: number;
  signupRewardLari?: number;
  shareMessageTemplate?: string;
  isActive: boolean;
  updatedAt: string;
}

interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  referrerCoinsRewarded: number;
  referredCoinsRewarded: number;
  createdAt: string;
  referrerPhone: string;
  referrerName: string;
  referredPhone: string;
  referredName: string;
}

interface TopReferrer {
  userId: string;
  phone: string;
  name: string;
  totalReferrals: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

interface Stats {
  totalReferrals: number;
  totalCoinsGiven: number;
}

/* ── PAGE ── */
export default function ReferralsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clockStr, setClockStr] = useState("");

  // Config state
  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [editReferrer, setEditReferrer] = useState(0);
  const [editReferred, setEditReferred] = useState(0);
  const [editBonusEveryN, setEditBonusEveryN] = useState(5);
  const [editBonusCoins, setEditBonusCoins] = useState(500);
  const [editSignupLari, setEditSignupLari] = useState(10);
  const [editShareTemplate, setEditShareTemplate] = useState("Join me on Shansi! Use my referral code: {code} to get _ ₾");
  const [editActive, setEditActive] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);

  // Referrals state
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0 });
  const [stats, setStats] = useState<Stats>({ totalReferrals: 0, totalCoinsGiven: 0 });
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClockStr(now.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // Fetch config
  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await getReferralConfig();
      if (res.success && res.config) {
        const c = res.config;
        setConfig(c);
        setEditReferrer(c.referrerRewardCoins);
        setEditReferred(c.referredRewardCoins);
        setEditBonusEveryN(c.bonusEveryN ?? 5);
        setEditBonusCoins(c.bonusRewardCoins ?? 500);
        setEditSignupLari(c.signupRewardLari ?? 10);
        setEditShareTemplate(c.shareMessageTemplate || "Join me on Shansi! Use my referral code: {code} to get _ ₾");
        setEditActive(c.isActive);
      }
    } catch {
      showToast("კონფიგურაციის ჩატვირთვა ვერ მოხერხდა", "error");
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // Fetch referrals
  const fetchReferrals = useCallback(async (page: number) => {
    setListLoading(true);
    try {
      const res = await getReferrals(page);
      if (res.success) {
        setReferrals(res.referrals || []);
        setPagination(res.pagination || { page, limit: 20, total: 0 });
        setStats(res.stats || { totalReferrals: 0, totalCoinsGiven: 0 });
        setTopReferrers(res.topReferrers || []);
      }
    } catch {
      showToast("რეფერალების ჩატვირთვა ვერ მოხერხდა", "error");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchReferrals(1);
  }, [fetchConfig, fetchReferrals]);

  // Save config
  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const res = await updateReferralConfig({
        referrer_reward_coins: editReferrer,
        referred_reward_coins: editReferred,
        bonus_every_n: editBonusEveryN,
        bonus_reward_coins: editBonusCoins,
        signup_reward_lari: editSignupLari,
        share_message_template: editShareTemplate,
        is_active: editActive,
      });
      if (res.success) {
        showToast("კონფიგურაცია შენახულია", "success");
        fetchConfig();
      } else {
        showToast("შენახვა ვერ მოხერხდა", "error");
      }
    } catch {
      showToast("შენახვა ვერ მოხერხდა", "error");
    } finally {
      setConfigSaving(false);
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const handlePage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchReferrals(p);
  };

  const topReferrer = topReferrers.length > 0 ? topReferrers[0] : null;

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ── SIDEBAR (Desktop) ── */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r" style={{ background: "#111111", borderColor: "#252525" }}>
        <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
          <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>SHANSI</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>Admin Panel</p>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
              style={{ background: item.id === ACTIVE_ID ? "#1A1A1A" : "transparent", borderLeft: item.id === ACTIVE_ID ? "3px solid #F9E741" : "3px solid transparent" }}>
              <NavIcon id={item.id} active={item.id === ACTIVE_ID} />
              <span className="text-[13px] font-medium" style={{ color: item.id === ACTIVE_ID ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
            <nav className="flex-1 py-3 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <button key={item.id} onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all"
                  style={{ background: item.id === ACTIVE_ID ? "#1A1A1A" : "transparent", borderLeft: item.id === ACTIVE_ID ? "3px solid #F9E741" : "3px solid transparent" }}>
                  <NavIcon id={item.id} active={item.id === ACTIVE_ID} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === ACTIVE_ID ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 18c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="15" cy="7" r="2.5" /><path d="M15 12c2.2 0 4 1.6 4 3.5" /></svg>
              <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>REFERRALS</h2>
            </div>
          </div>
          <div className="text-[13px] font-mono" style={{ color: "#666666" }}>{clockStr}</div>
        </header>

        <div className="p-4 lg:p-6 space-y-5">

          {/* ═══ REFERRAL CONFIG CARD ═══ */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center gap-2 px-4 lg:px-5 py-3 border-b" style={{ borderColor: "#252525" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7" /><path d="M9 5v4l2.5 2.5" /></svg>
              <p className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>რეფერალის კონფიგურაცია</p>
              {config && (
                <span className="text-[11px] px-2 py-0.5 rounded-full ml-auto" style={{ background: editActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: editActive ? "#22C55E" : "#EF4444" }}>
                  {editActive ? "აქტიური" : "გამორთული"}
                </span>
              )}
            </div>
            <div className="p-4 lg:p-5">
              {configLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {/* Referrer reward */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666666" }}>რეფერერის ჯილდო (ქოინი)</label>
                    <input type="number" value={editReferrer} onChange={(e) => setEditReferrer(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[8px] border text-[14px] font-medium outline-none transition-all focus:border-[#F9E741]"
                      style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }} />
                  </div>
                  {/* Referred reward */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666666" }}>მოწვეულის ჯილდო (ქოინი)</label>
                    <input type="number" value={editReferred} onChange={(e) => setEditReferred(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[8px] border text-[14px] font-medium outline-none transition-all focus:border-[#F9E741]"
                      style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }} />
                  </div>
                  {/* Signup Lari (shown in share message + profile) */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666666" }}>Signup ჯილდო (₾)</label>
                    <input type="number" min="0" value={editSignupLari} onChange={(e) => setEditSignupLari(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[8px] border text-[14px] font-medium outline-none transition-all focus:border-[#F9E741]"
                      style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }} />
                    <p className="text-[10px] mt-1" style={{ color: "#555" }}>ჩანს share-ში და პროფილზე</p>
                  </div>
                  {/* Bonus every N */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666666" }}>ბონუსი ყოველ N-ე</label>
                    <input type="number" min="1" value={editBonusEveryN} onChange={(e) => setEditBonusEveryN(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[8px] border text-[14px] font-medium outline-none transition-all focus:border-[#F9E741]"
                      style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }} />
                  </div>
                  {/* Bonus coins */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666666" }}>ბონუს ქოინი</label>
                    <input type="number" min="0" value={editBonusCoins} onChange={(e) => setEditBonusCoins(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[8px] border text-[14px] font-medium outline-none transition-all focus:border-[#F9E741]"
                      style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }} />
                  </div>
                  {/* Toggle + Save */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666666" }}>სტატუსი</label>
                      <button onClick={() => setEditActive(!editActive)}
                        className="relative w-[48px] h-[26px] rounded-full transition-all"
                        style={{ background: editActive ? "#22C55E" : "#333333" }}>
                        <div className="absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white transition-all"
                          style={{ left: editActive ? "25px" : "3px" }} />
                      </button>
                    </div>
                    <button onClick={handleSaveConfig} disabled={configSaving}
                      className="mt-3 px-4 py-2 rounded-[8px] text-[13px] font-bold transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
                      style={{ background: "#F9E741", color: "#000000" }}>
                      {configSaving ? "ინახება..." : "შენახვა"}
                    </button>
                  </div>
                </div>
              )}

              {/* Share message template */}
              {!configLoading && (
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid #252525" }}>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666666" }}>
                    share-ის შეტყობინება
                  </label>
                  <textarea
                    rows={2}
                    value={editShareTemplate}
                    onChange={(e) => setEditShareTemplate(e.target.value)}
                    placeholder="Join me on Shansi! Use my referral code: {code} to get _ ₾"
                    className="w-full px-3 py-2 rounded-[8px] border text-[14px] outline-none transition-all focus:border-[#F9E741] resize-none"
                    style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF", fontFamily: "inherit" }}
                  />
                  <p className="text-[11px] mt-1.5" style={{ color: "#666" }}>
                    ჩასასვლები: <code style={{ color: "#F9E741" }}>{"{code}"}</code> = მომხმარებლის რეფერალ კოდი,{" "}
                    <code style={{ color: "#F9E741" }}>_</code> = Signup ლარი (ზემოთ დაყენებული ₾ რიცხვი).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═══ STATS CARDS ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Referrals */}
            <div className="rounded-[12px] border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="4.5" r="2.5" /><path d="M0.5 14c0-2.8 2.2-5 5-5s5 2.2 5 5" /><circle cx="12" cy="5.5" r="2" /><path d="M12 9.5c1.9 0 3.5 1.3 3.5 3" /></svg>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>სულ რეფერალები</p>
              </div>
              <p className="text-[28px] font-extrabold" style={{ color: "#FFFFFF" }}>{stats.totalReferrals}</p>
            </div>
            {/* Total Coins Given */}
            <div className="rounded-[12px] border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6" /><path d="M8 4.5v7M5.5 6.5h5c0-1.1-1.1-2-2.5-2s-2.5.9-2.5 2 1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2H5.5" /></svg>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>სულ გაცემული ქოინი</p>
              </div>
              <p className="text-[28px] font-extrabold" style={{ color: "#F9E741" }}>{stats.totalCoinsGiven.toLocaleString()}</p>
            </div>
            {/* Top Referrer */}
            <div className="rounded-[12px] border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.8 3.8 14l.8-4.7L1.2 6l4.7-.7L8 1z" /></svg>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>ტოპ რეფერერი</p>
              </div>
              {topReferrer ? (
                <>
                  <p className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>{topReferrer.name || topReferrer.phone}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "#A0A0A0" }}>{topReferrer.phone} - {topReferrer.totalReferrals} მოწვეული</p>
                </>
              ) : (
                <p className="text-[14px]" style={{ color: "#666666" }}>--</p>
              )}
            </div>
          </div>

          {/* ═══ TOP REFERRERS LEADERBOARD ═══ */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center gap-2 px-4 lg:px-5 py-3 border-b" style={{ borderColor: "#252525" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2l2.5 5 5.5.8-4 3.9.9 5.3L9 14.4l-4.9 2.6.9-5.3-4-3.9 5.5-.8L9 2z" /></svg>
              <p className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>ტოპ რეფერერები</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>Top {Math.min(10, topReferrers.length)}</span>
            </div>
            <div className="p-4 lg:p-5">
              {topReferrers.length === 0 ? (
                <p className="text-center py-4 text-[13px]" style={{ color: "#666666" }}>მონაცემები არ არის</p>
              ) : (
                <div className="space-y-2">
                  {topReferrers.slice(0, 10).map((ref, idx) => {
                    const rank = idx + 1;
                    const rankColor = rank === 1 ? "#F9E741" : rank === 2 ? "#A0A0A0" : rank === 3 ? "#CD7F32" : "#666666";
                    return (
                      <div key={ref.userId} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all hover:brightness-110" style={{ background: "#1A1A1A" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0"
                          style={{ background: rank <= 3 ? rankColor + "22" : "#252525", color: rankColor, border: rank <= 3 ? `1.5px solid ${rankColor}` : "1.5px solid #333" }}>
                          {rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: "#FFFFFF" }}>{ref.name || "Unknown"}</p>
                          <p className="text-[11px]" style={{ color: "#666666" }}>{ref.phone}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[14px] font-bold" style={{ color: "#F9E741" }}>{ref.totalReferrals}</p>
                          <p className="text-[10px]" style={{ color: "#666666" }}>მოწვეული</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ═══ REFERRALS TABLE ═══ */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-b" style={{ borderColor: "#252525" }}>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="14" height="12" rx="2" /><path d="M2 7h14" /><path d="M7 7v8" /></svg>
                <p className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>რეფერალების სია</p>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>{pagination.total} სულ</span>
              </div>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
              </div>
            ) : referrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="16" /><path d="M14 16h12M14 22h8" /></svg>
                <p className="mt-3 text-[13px]" style={{ color: "#666666" }}>რეფერალები არ მოიძებნა</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr style={{ background: "#1A1A1A" }}>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>რეფერერი</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>მოწვეული</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>კოდი</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>ჯილდო</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666666" }}>თარიღი</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref) => (
                      <tr key={ref.id} className="transition-all hover:brightness-110" style={{ borderBottom: "1px solid #1A1A1A" }}>
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-medium" style={{ color: "#FFFFFF" }}>{ref.referrerName || "--"}</p>
                          <p className="text-[11px]" style={{ color: "#666666" }}>{ref.referrerPhone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[13px] font-medium" style={{ color: "#FFFFFF" }}>{ref.referredName || "--"}</p>
                          <p className="text-[11px]" style={{ color: "#666666" }}>{ref.referredPhone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-[6px] text-[12px] font-mono font-medium" style={{ background: "#1A1A1A", color: "#F9E741", border: "1px solid #252525" }}>
                            {ref.referralCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[12px]">
                            <span style={{ color: "#22C55E" }}>+{ref.referrerCoinsRewarded}</span>
                            <span style={{ color: "#666666" }}> / </span>
                            <span style={{ color: "#22C55E" }}>+{ref.referredCoinsRewarded}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12px]" style={{ color: "#A0A0A0" }}>
                            {new Date(ref.createdAt).toLocaleDateString("ka-GE")}
                          </p>
                          <p className="text-[11px]" style={{ color: "#666666" }}>
                            {new Date(ref.createdAt).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-t" style={{ borderColor: "#252525" }}>
                <p className="text-[12px]" style={{ color: "#666666" }}>
                  გვერდი {pagination.page} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePage(pagination.page - 1)} disabled={pagination.page <= 1}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-30"
                    style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,3 5,7 9,11" /></svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (pagination.page <= 3) {
                      page = i + 1;
                    } else if (pagination.page >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = pagination.page - 2 + i;
                    }
                    return (
                      <button key={page} onClick={() => handlePage(page)}
                        className="w-8 h-8 rounded-[8px] text-[12px] font-semibold transition-all hover:brightness-110 active:scale-[0.97]"
                        style={{
                          background: page === pagination.page ? "#F9E741" : "#1A1A1A",
                          color: page === pagination.page ? "#000000" : "#A0A0A0",
                          border: page === pagination.page ? "none" : "1px solid #252525",
                        }}>
                        {page}
                      </button>
                    );
                  })}
                  <button onClick={() => handlePage(pagination.page + 1)} disabled={pagination.page >= totalPages}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-30"
                    style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5,3 9,7 5,11" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
          <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg" style={{ background: toast.type === "success" ? "#111111" : "#111111", border: `1px solid ${toast.type === "success" ? "#22C55E" : "#EF4444"}` }}>
            {toast.type === "success" ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5,8 6.5,11 12.5,5" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6" /><line x1="6" y1="6" x2="10" y2="10" /><line x1="10" y1="6" x2="6" y2="10" /></svg>
            )}
            <span className="text-[13px] font-medium" style={{ color: toast.type === "success" ? "#22C55E" : "#EF4444" }}>{toast.message}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
