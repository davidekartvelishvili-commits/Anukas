"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeUses,
} from "@/services/admin";

/* ── SVG ICONS (NavIcon) ── */
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="10" y="2" width="6" height="6" rx="1" /><rect x="2" y="10" width="6" height="6" rx="1" /><rect x="10" y="10" width="6" height="6" rx="1" /></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="13" cy="5" r="2" /><path d="M14 10c1.7.5 3 2 3 4" /></svg>,
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /><path d="M7 16v-5h4v5" /></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /><path d="M6 7h6" /><path d="M9 7v8" /></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9V3a1 1 0 011-1h6l7 7-7 7-7-7z" /><circle cx="6" cy="6" r="1.5" fill={c} stroke="none" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="7" r="2.5" /><circle cx="13" cy="7" r="2.5" /><path d="M0.5 15c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" /><path d="M9.5 15c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" /><path d="M7 5l4 0" /><path d="M9 3v4" /></svg>,
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
  { label: "Tickets", id: "tickets", href: "/admin/tickets" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin/system" },
];

const ACTIVE_ID = "promos";

/* ── TYPES ── */
interface PromoCode {
  id: string;
  code: string;
  description: string;
  coinRewardForUser: number;
  coinRewardForCreator: number;
  maxUses: number | null;
  currentUses: number;
  maxUsesPerUser: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface PromoUse {
  id: string;
  promoCodeId: string;
  userId: string;
  coinsRewarded: number;
  usedAt: string;
  userPhone: string;
  userName: string;
}

interface FormData {
  code: string;
  description: string;
  coin_reward_for_user: number;
  coin_reward_for_creator: number;
  max_uses: string;
  max_uses_per_user: number;
  starts_at: string;
  expires_at: string;
}

const emptyForm: FormData = {
  code: "",
  description: "",
  coin_reward_for_user: 0,
  coin_reward_for_creator: 0,
  max_uses: "",
  max_uses_per_user: 1,
  starts_at: "",
  expires_at: "",
};

/* ── INLINE SVG ICONS ── */
function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" /></svg>;
}

function Spinner() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="#333333" strokeWidth="2" />
      <path d="M10 2a8 8 0 016.93 4" stroke="#F9E741" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ka-GE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ka-GE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PromosPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Data
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uses, setUses] = useState<PromoUse[]>([]);
  const [usesLoading, setUsesLoading] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Deactivation confirm
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Clock
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Fetch promo codes
  const fetchPromos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPromoCodes();
      if (res.success) {
        setPromoCodes(res.promoCodes || []);
      } else {
        setError("მონაცემების ჩატვირთვა ვერ მოხერხდა");
      }
    } catch {
      setError("სერვერთან კავშირის შეცდომა");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  // Expand row -> fetch uses
  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setUses([]);
      return;
    }
    setExpandedId(id);
    setUsesLoading(true);
    try {
      const res = await getPromoCodeUses(id);
      if (res.success) {
        setUses(res.uses || []);
      }
    } catch {
      showToast("გამოყენებების ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setUsesLoading(false);
    }
  };

  // Open create modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code,
      description: promo.description || "",
      coin_reward_for_user: promo.coinRewardForUser,
      coin_reward_for_creator: promo.coinRewardForCreator,
      max_uses: promo.maxUses !== null ? String(promo.maxUses) : "",
      max_uses_per_user: promo.maxUsesPerUser,
      starts_at: promo.startsAt ? promo.startsAt.slice(0, 10) : "",
      expires_at: promo.expiresAt ? promo.expiresAt.slice(0, 10) : "",
    });
    setModalOpen(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!form.code.trim()) {
      showToast("კოდი სავალდებულოა");
      return;
    }
    if (!form.starts_at || !form.expires_at) {
      showToast("თარიღები სავალდებულოა");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description.trim(),
        coin_reward_for_user: Number(form.coin_reward_for_user) || 0,
        coin_reward_for_creator: Number(form.coin_reward_for_creator) || 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        max_uses_per_user: Number(form.max_uses_per_user) || 1,
        starts_at: new Date(form.starts_at).toISOString(),
        expires_at: new Date(form.expires_at + "T23:59:59").toISOString(),
      };

      if (editingId) {
        const res = await updatePromoCode(editingId, payload);
        if (res.success) {
          showToast("პრომო კოდი განახლდა");
        } else {
          showToast(res.error || "განახლება ვერ მოხერხდა");
          setSaving(false);
          return;
        }
      } else {
        const res = await createPromoCode(payload);
        if (res.success) {
          showToast("პრომო კოდი შეიქმნა");
        } else {
          showToast(res.error || "შექმნა ვერ მოხერხდა");
          setSaving(false);
          return;
        }
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchPromos();
    } catch {
      showToast("შეცდომა მოხდა");
    } finally {
      setSaving(false);
    }
  };

  // Deactivate
  const handleDeactivate = async () => {
    if (!deactivateId) return;
    setDeactivating(true);
    try {
      const res = await updatePromoCode(deactivateId, { is_active: false });
      if (res.success) {
        showToast("პრომო კოდი გაუქმდა");
        await fetchPromos();
      } else {
        showToast(res.error || "გაუქმება ვერ მოხერხდა");
      }
    } catch {
      showToast("შეცდომა მოხდა");
    } finally {
      setDeactivating(false);
      setDeactivateId(null);
    }
  };

  // Stats
  const totalCodes = promoCodes.length;
  const activeCodes = promoCodes.filter((p) => p.isActive).length;
  const totalUses = promoCodes.reduce((sum, p) => sum + p.currentUses, 0);

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
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-95"
              style={{ background: "#1A1A1A" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="5" x2="15" y2="5" />
                <line x1="3" y1="9" x2="15" y2="9" />
                <line x1="3" y1="13" x2="15" y2="13" />
              </svg>
            </button>
            <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>
              PROMO CODES
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
            {now.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </header>

        <div className="p-4 lg:p-6 space-y-4">
          {/* ── STATS BAR ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[12px] border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium mb-1" style={{ color: "#666666" }}>სულ კოდები</p>
              <p className="text-[24px] font-extrabold" style={{ color: "#FFFFFF" }}>{totalCodes}</p>
            </div>
            <div className="rounded-[12px] border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium mb-1" style={{ color: "#666666" }}>აქტიური</p>
              <p className="text-[24px] font-extrabold" style={{ color: "#22C55E" }}>{activeCodes}</p>
            </div>
            <div className="rounded-[12px] border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[11px] font-medium mb-1" style={{ color: "#666666" }}>გამოყენება</p>
              <p className="text-[24px] font-extrabold" style={{ color: "#F9E741" }}>{totalUses}</p>
            </div>
          </div>

          {/* ── CREATE BUTTON ── */}
          <div className="flex justify-end">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-bold transition-all hover:brightness-110 active:scale-95"
              style={{ background: "#F9E741", color: "#000000" }}
            >
              + შექმნა
            </button>
          </div>

          {/* ── LOADING ── */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          )}

          {/* ── ERROR ── */}
          {error && !loading && (
            <div className="rounded-[12px] border p-6 text-center" style={{ background: "#111111", borderColor: "#252525" }}>
              <p className="text-[14px]" style={{ color: "#EF4444" }}>{error}</p>
              <button
                onClick={fetchPromos}
                className="mt-3 text-[12px] font-medium px-4 py-2 rounded-[8px] transition-all hover:brightness-110 active:scale-95"
                style={{ background: "#1A1A1A", color: "#A0A0A0" }}
              >
                ხელახლა ცდა
              </button>
            </div>
          )}

          {/* ── TABLE ── */}
          {!loading && !error && (
            <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
              {/* Table header */}
              <div
                className="hidden md:grid grid-cols-[1.2fr_1.5fr_0.8fr_1fr_1.2fr_0.7fr] gap-2 px-4 py-3 border-b"
                style={{ borderColor: "#252525" }}
              >
                <span className="text-[11px] font-bold uppercase" style={{ color: "#666666" }}>კოდი</span>
                <span className="text-[11px] font-bold uppercase" style={{ color: "#666666" }}>აღწერა</span>
                <span className="text-[11px] font-bold uppercase" style={{ color: "#666666" }}>ჯილდო</span>
                <span className="text-[11px] font-bold uppercase" style={{ color: "#666666" }}>გამოყენება</span>
                <span className="text-[11px] font-bold uppercase" style={{ color: "#666666" }}>ვადა</span>
                <span className="text-[11px] font-bold uppercase" style={{ color: "#666666" }}>სტატუსი</span>
              </div>

              {promoCodes.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <p className="text-[13px]" style={{ color: "#666666" }}>პრომო კოდები არ მოიძებნა</p>
                </div>
              )}

              {promoCodes.map((promo) => {
                const isExpanded = expandedId === promo.id;
                const isExpired = promo.expiresAt && new Date(promo.expiresAt) < new Date();
                const statusActive = promo.isActive && !isExpired;

                return (
                  <div key={promo.id}>
                    {/* Row */}
                    <div
                      onClick={() => handleExpand(promo.id)}
                      className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_0.8fr_1fr_1.2fr_0.7fr] gap-2 px-4 py-3 border-b cursor-pointer transition-all hover:bg-white/[0.02]"
                      style={{ borderColor: "#252525" }}
                    >
                      {/* Code */}
                      <div className="flex items-center gap-2">
                        <span className="md:hidden text-[10px] font-bold uppercase" style={{ color: "#666666" }}>კოდი:</span>
                        <span className="text-[13px] font-bold tracking-wide" style={{ color: "#F9E741" }}>
                          {promo.code}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="flex items-center">
                        <span className="md:hidden text-[10px] font-bold uppercase mr-2" style={{ color: "#666666" }}>აღწერა:</span>
                        <span className="text-[12px] truncate" style={{ color: "#A0A0A0" }}>
                          {promo.description || "—"}
                        </span>
                      </div>

                      {/* Reward */}
                      <div className="flex items-center">
                        <span className="md:hidden text-[10px] font-bold uppercase mr-2" style={{ color: "#666666" }}>ჯილდო:</span>
                        <span className="text-[13px] font-semibold" style={{ color: "#FFFFFF" }}>
                          {promo.coinRewardForUser}
                        </span>
                      </div>

                      {/* Usage */}
                      <div className="flex items-center">
                        <span className="md:hidden text-[10px] font-bold uppercase mr-2" style={{ color: "#666666" }}>გამოყენება:</span>
                        <span className="text-[13px]" style={{ color: "#A0A0A0" }}>
                          {promo.currentUses}/{promo.maxUses !== null ? promo.maxUses : "∞"}
                        </span>
                      </div>

                      {/* Date range */}
                      <div className="flex items-center">
                        <span className="md:hidden text-[10px] font-bold uppercase mr-2" style={{ color: "#666666" }}>ვადა:</span>
                        <span className="text-[11px]" style={{ color: "#666666" }}>
                          {formatDate(promo.startsAt)} — {formatDate(promo.expiresAt)}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center">
                        <span className="md:hidden text-[10px] font-bold uppercase mr-2" style={{ color: "#666666" }}>სტატუსი:</span>
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{
                            background: statusActive ? "#22C55E20" : "#EF444420",
                            color: statusActive ? "#22C55E" : "#EF4444",
                          }}
                        >
                          {statusActive ? "აქტიური" : isExpired ? "ვადაგასული" : "გაუქმებული"}
                        </span>
                      </div>
                    </div>

                    {/* ── Expanded detail ── */}
                    {isExpanded && (
                      <div className="px-4 py-4 border-b" style={{ background: "#0A0A0A", borderColor: "#252525" }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="rounded-[8px] p-3" style={{ background: "#1A1A1A" }}>
                            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "#666666" }}>მომხმარებლის ჯილდო</p>
                            <p className="text-[16px] font-bold" style={{ color: "#F9E741" }}>{promo.coinRewardForUser} ქოინი</p>
                          </div>
                          <div className="rounded-[8px] p-3" style={{ background: "#1A1A1A" }}>
                            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "#666666" }}>შემქმნელის ჯილდო</p>
                            <p className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>{promo.coinRewardForCreator} ქოინი</p>
                          </div>
                          <div className="rounded-[8px] p-3" style={{ background: "#1A1A1A" }}>
                            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: "#666666" }}>მაქს. 1 მომხმარებელზე</p>
                            <p className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>{promo.maxUsesPerUser}</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 mb-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(promo); }}
                            className="px-4 py-2 rounded-[8px] text-[12px] font-bold transition-all hover:brightness-110 active:scale-95"
                            style={{ background: "#1A1A1A", color: "#F9E741", border: "1px solid #252525" }}
                          >
                            რედაქტირება
                          </button>
                          {promo.isActive && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeactivateId(promo.id); }}
                              className="px-4 py-2 rounded-[8px] text-[12px] font-bold transition-all hover:brightness-110 active:scale-95"
                              style={{ background: "#EF444420", color: "#EF4444", border: "1px solid #EF444440" }}
                            >
                              გაუქმება
                            </button>
                          )}
                        </div>

                        {/* Uses list */}
                        <div>
                          <p className="text-[12px] font-bold mb-2" style={{ color: "#A0A0A0" }}>გამოყენებები</p>
                          {usesLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Spinner />
                            </div>
                          ) : uses.length === 0 ? (
                            <p className="text-[12px] py-3" style={{ color: "#666666" }}>ჯერ არ გამოუყენებიათ</p>
                          ) : (
                            <div className="rounded-[8px] border overflow-hidden" style={{ borderColor: "#252525" }}>
                              <div className="hidden md:grid grid-cols-[1fr_1fr_0.8fr] gap-2 px-3 py-2 border-b" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
                                <span className="text-[10px] font-bold uppercase" style={{ color: "#666666" }}>მომხმარებელი</span>
                                <span className="text-[10px] font-bold uppercase" style={{ color: "#666666" }}>თარიღი</span>
                                <span className="text-[10px] font-bold uppercase" style={{ color: "#666666" }}>ქოინი</span>
                              </div>
                              {uses.map((u) => (
                                <div
                                  key={u.id}
                                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_0.8fr] gap-1 md:gap-2 px-3 py-2 border-b last:border-b-0"
                                  style={{ borderColor: "#252525" }}
                                >
                                  <div>
                                    <span className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{u.userName || "—"}</span>
                                    <span className="text-[11px] ml-2" style={{ color: "#666666" }}>{u.userPhone}</span>
                                  </div>
                                  <span className="text-[11px]" style={{ color: "#A0A0A0" }}>{formatDateTime(u.usedAt)}</span>
                                  <span className="text-[12px] font-bold" style={{ color: "#F9E741" }}>+{u.coinsRewarded}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── TOAST ── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-[10px] shadow-xl text-[13px] font-medium transition-all"
          style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }}
        >
          {toast}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative w-full max-w-[480px] rounded-[16px] border overflow-hidden"
            style={{ background: "#111111", borderColor: "#252525" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#252525" }}>
              <h3 className="text-[15px] font-extrabold" style={{ color: "#FFFFFF" }}>
                {editingId ? "რედაქტირება" : "ახალი პრომო კოდი"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-all hover:bg-white/10 active:scale-90"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Code */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: "#666666" }}>კოდი</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="LAUNCH2026"
                  className="w-full px-3 py-2.5 rounded-[8px] border text-[13px] outline-none transition-all focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: "#666666" }}>აღწერა</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="აღწერა..."
                  className="w-full px-3 py-2.5 rounded-[8px] border text-[13px] outline-none transition-all focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                />
              </div>

              {/* Rewards row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: "#666666" }}>ქოინი მომხმარებლისთვის</label>
                  <input
                    type="number"
                    min="0"
                    value={form.coin_reward_for_user}
                    onChange={(e) => setForm({ ...form, coin_reward_for_user: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-[8px] border text-[13px] outline-none transition-all focus:border-[#F9E741]"
                    style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: "#666666" }}>ქოინი შემქმნელისთვის</label>
                  <input
                    type="number"
                    min="0"
                    value={form.coin_reward_for_creator}
                    onChange={(e) => setForm({ ...form, coin_reward_for_creator: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-[8px] border text-[13px] outline-none transition-all focus:border-[#F9E741]"
                    style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                  />
                </div>
              </div>

              {/* Usage limits row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: "#666666" }}>მაქს. გამოყენება</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="ულიმიტო"
                    className="w-full px-3 py-2.5 rounded-[8px] border text-[13px] outline-none transition-all focus:border-[#F9E741]"
                    style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: "#666666" }}>მაქს. 1 მომხმარებელზე</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses_per_user}
                    onChange={(e) => setForm({ ...form, max_uses_per_user: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-[8px] border text-[13px] outline-none transition-all focus:border-[#F9E741]"
                    style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                  />
                </div>
              </div>

              {/* Date range row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: "#666666" }}>დაწყება</label>
                  <input
                    type="date"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-[8px] border text-[13px] outline-none transition-all focus:border-[#F9E741]"
                    style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF", colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1.5" style={{ color: "#666666" }}>დასრულება</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-[8px] border text-[13px] outline-none transition-all focus:border-[#F9E741]"
                    style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF", colorScheme: "dark" }}
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: "#252525" }}>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-[8px] text-[13px] font-medium transition-all hover:bg-white/5 active:scale-95"
                style={{ color: "#A0A0A0" }}
              >
                გაუქმება
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-[8px] text-[13px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                style={{ background: "#F9E741", color: "#000000" }}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> შენახვა...
                  </span>
                ) : editingId ? "განახლება" : "შექმნა"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DEACTIVATION CONFIRM MODAL ── */}
      {deactivateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeactivateId(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative w-full max-w-[380px] rounded-[16px] border overflow-hidden"
            style={{ background: "#111111", borderColor: "#252525" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "#EF444420" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L1 21h22L12 2z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <circle cx="12" cy="17" r="0.5" fill="#EF4444" />
                </svg>
              </div>
              <h3 className="text-[15px] font-extrabold mb-2" style={{ color: "#FFFFFF" }}>
                დარწმუნებული ხარ?
              </h3>
              <p className="text-[13px] mb-6" style={{ color: "#A0A0A0" }}>
                პრომო კოდი გაუქმდება და მომხმარებლები ვეღარ გამოიყენებენ.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeactivateId(null)}
                  className="px-5 py-2.5 rounded-[8px] text-[13px] font-medium transition-all hover:bg-white/5 active:scale-95"
                  style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}
                >
                  არა, გაუქმება
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={deactivating}
                  className="px-5 py-2.5 rounded-[8px] text-[13px] font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                  style={{ background: "#EF4444", color: "#FFFFFF" }}
                >
                  {deactivating ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> ...
                    </span>
                  ) : "დიახ, გაუქმება"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
