"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMerchants, getMerchant, updateMerchant, simulatePayment } from "@/services/admin";

/* ── SVG ICONS ── */
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="10" y="2" width="6" height="6" rx="1" /><rect x="2" y="10" width="6" height="6" rx="1" /><rect x="10" y="10" width="6" height="6" rx="1" /></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="13" cy="5" r="2" /><path d="M14 10c1.7.5 3 2 3 4" /></svg>,
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /><path d="M7 16v-5h4v5" /><path d="M2 6c0 1.1.9 2 2 2s2-.9 2-2" /><path d="M6 6c0 1.1.9 2 2 2s2-.9 2-2" /><path d="M10 6c0 1.1.9 2 2 2s2-.9 2-2" /></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /><path d="M6 7h6" /><path d="M9 7v8" /></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l2-3h10l2 3" /><rect x="2" y="6" width="14" height="10" rx="1" /><path d="M9 6v10" /><path d="M2 6h14" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2.5" /><circle cx="13" cy="6" r="2.5" /><path d="M1 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /><path d="M9 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /></svg>,
    withdrawals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14V4" /><path d="M5 8l4-4 4 4" /><path d="M3 16h12" /></svg>,
    finance: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l3-2 4 3 3-4 4 3v8" /><path d="M2 16h14" /></svg>,
    village: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l7-5.5L16 8v8" /><path d="M6 16v-4h6v4" /><path d="M1 16h16" /></svg>,
    notifications: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 6.5a4.5 4.5 0 10-9 0c0 5-2.25 6.5-2.25 6.5h13.5s-2.25-1.5-2.25-6.5" /><path d="M7.5 15a1.5 1.5 0 003 0" /></svg>,
    analytics: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,14 6,8 10,11 16,4" /><polyline points="12,4 16,4 16,8" /></svg>,
    system: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5a1.5 1.5 0 011.06.44l1.12.96a1 1 0 00.82.24l1.44-.24a1.5 1.5 0 011.74 1.74l-.24 1.44a1 1 0 00.24.82l.96 1.12a1.5 1.5 0 010 2.12l-.96 1.12a1 1 0 00-.24.82l.24 1.44a1.5 1.5 0 01-1.74 1.74l-1.44-.24a1 1 0 00-.82.24l-1.12.96a1.5 1.5 0 01-2.12 0l-1.12-.96a1 1 0 00-.82-.24l-1.44.24a1.5 1.5 0 01-1.74-1.74l.24-1.44a1 1 0 00-.24-.82l-.96-1.12a1.5 1.5 0 010-2.12l.96-1.12a1 1 0 00.24-.82l-.24-1.44A1.5 1.5 0 015.56 2.9l1.44.24a1 1 0 00.82-.24l1.12-.96A1.5 1.5 0 019 1.5z" /><circle cx="9" cy="9" r="2.5" /></svg>,
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
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── TYPES ── */
interface MerchantItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  commission_percent: number;
  is_active: boolean;
  qr_code: string | null;
  created_at: string;
  total_transactions: number;
  total_commission: number;
}

interface MerchantDetail extends MerchantItem {
  transactions: { id: string; amount: number; commission: number; user_phone: string; created_at: string }[];
}

/* ── TOAST ── */
function Toast({ message, type, onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const color = type === "error" ? "#EF4444" : "#22C55E";
  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="rounded-[8px] px-4 py-3 border flex items-center gap-2" style={{ background: "#1A1A1A", borderColor: color, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
        <span className="text-[13px] font-medium" style={{ color: "#FFFFFF" }}>{message}</span>
        <button onClick={onClose} className="ml-2 transition-all hover:opacity-70">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="9" y2="9" /><line x1="9" y1="3" x2="3" y2="9" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ── MAIN ── */
export default function MerchantsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "all">("pending");

  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Simulate modal
  const [showSimulate, setShowSimulate] = useState(false);
  const [simPhone, setSimPhone] = useState("");
  const [simMerchantId, setSimMerchantId] = useState("");
  const [simAmount, setSimAmount] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [activeMerchants, setActiveMerchants] = useState<MerchantItem[]>([]);

  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  /* ── Fetch ── */
  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMerchants(activeTab, currentPage);
      setMerchants(data.merchants || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { setMerchants([]); }
    finally { setLoading(false); }
  }, [activeTab, currentPage]);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);
  useEffect(() => { setCurrentPage(1); setSelectedId(null); setDetail(null); }, [activeTab]);

  /* ── Detail ── */
  const toggleDetail = async (id: string) => {
    if (selectedId === id) { setSelectedId(null); setDetail(null); return; }
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await getMerchant(id) as any;
      setDetail(data);
    } catch { showToast("დეტალები ვერ ჩაიტვირთა", "error"); }
    finally { setDetailLoading(false); }
  };

  /* ── Actions ── */
  const [approvedCode, setApprovedCode] = useState<string | null>(null);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      const result = await updateMerchant(id, { is_active: action === "approve" }) as any;
      if (action === "approve" && result.merchant?.merchantCode) {
        setApprovedCode(result.merchant.merchantCode);
      } else {
        showToast(action === "approve" ? "\u10D2\u10D0\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D3\u10D0" : "\u10E3\u10D0\u10E0\u10E7\u10DD\u10E4\u10D8\u10DA\u10D8\u10D0");
      }
      fetchMerchants();
    } catch (e: any) { showToast(e.message || "\u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D0", "error"); }
    finally { setActionLoading(null); }
  };

  /* ── Simulate ── */
  const openSimulate = async () => {
    setShowSimulate(true);
    try {
      const data = await getMerchants("active", 1);
      setActiveMerchants(data.merchants || []);
    } catch { /* */ }
  };

  const handleSimulate = async () => {
    if (!simPhone || !simMerchantId || !simAmount) return;
    setSimLoading(true);
    try {
      await simulatePayment(simPhone, simMerchantId, Number(simAmount));
      showToast("გადახდა სიმულირებულია");
      setShowSimulate(false);
      setSimPhone(""); setSimMerchantId(""); setSimAmount("");
      fetchMerchants();
    } catch (e: any) { showToast(e.message || "შეცდომა", "error"); }
    finally { setSimLoading(false); }
  };

  const tabs: { key: "pending" | "active" | "all"; label: string }[] = [
    { key: "pending", label: "მოლოდინში" },
    { key: "active", label: "აქტიური" },
    { key: "all", label: "ყველა" },
  ];

  const inputStyle: React.CSSProperties = { background: "#111111", border: "1px solid #252525", borderRadius: 8, color: "#FFFFFF", padding: "10px 14px", fontSize: 14, width: "100%", outline: "none", fontFamily: "system-ui, -apple-system, sans-serif" };

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 top-0 left-0 h-[100dvh] w-[240px] flex flex-col border-r transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} style={{ background: "#0A0A0A", borderColor: "#1A1A1A" }}>
        <div className="p-5 border-b" style={{ borderColor: "#1A1A1A" }}>
          <span className="text-[15px] font-bold tracking-wide" style={{ color: "#F9E741" }}>SHANSI</span>
          <span className="text-[11px] ml-2" style={{ color: "#666" }}>Admin</span>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.id === "merchants";
            return (
              <button key={item.id} onClick={() => router.push(item.href)} className="w-full flex items-center gap-3 px-5 py-[10px] transition-all duration-150 hover:bg-white/5" style={{ background: active ? "#F9E74110" : "transparent" }}>
                <NavIcon id={item.id} active={active} />
                <span className="text-[13px]" style={{ color: active ? "#F9E741" : "#A0A0A0" }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-8 h-14 border-b" style={{ borderColor: "#1A1A1A", background: "#0A0A0A" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="7" x2="18" y2="7" /><line x1="4" y1="11" x2="18" y2="11" /><line x1="4" y1="15" x2="18" y2="15" /></svg>
            </button>
            <h1 className="text-[16px] font-semibold" style={{ color: "#FFFFFF" }}>Merchants</h1>
          </div>
          <button onClick={openSimulate} className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all hover:opacity-80" style={{ background: "#F9E741", color: "#000000" }}>
            სიმულაცია
          </button>
        </header>

        <div className="p-4 lg:p-8">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-[10px] mb-6 w-fit" style={{ background: "#111111" }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150" style={{ background: activeTab === t.key ? "#F9E741" : "transparent", color: activeTab === t.key ? "#000" : "#A0A0A0" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
            </div>
          ) : merchants.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[14px]" style={{ color: "#666" }}>მერჩანტები არ მოიძებნა</p>
            </div>
          ) : (
            <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #252525" }}>
                      {["ID", "\u10E1\u10D0\u10EE\u10D4\u10DA\u10D8", "\u10D9\u10D0\u10E2\u10D4\u10D2\u10DD\u10E0\u10D8\u10D0", "\u10D9\u10DD\u10DB\u10D8\u10E1\u10D8\u10D0 %", "TX", "\u10E1\u10E2\u10D0\u10E2\u10E3\u10E1\u10D8", ""].map((h) => (
                        <th key={h} className="px-3 py-3 text-[11px] font-medium" style={{ color: "#666" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.map((m: any) => (
                      <>
                        <tr key={m.id} onClick={() => toggleDetail(m.id)} className="cursor-pointer transition-all hover:bg-white/5" style={{ borderBottom: "1px solid #1A1A1A" }}>
                          <td className="px-3 py-3 text-[12px] font-mono font-bold" style={{ color: "#F9E741" }}>{m.merchantCode || "—"}</td>
                          <td className="px-3 py-3 text-[13px]" style={{ color: "#FFF" }}>{m.businessName || m.name}</td>
                          <td className="px-3 py-3 text-[12px]" style={{ color: "#A0A0A0" }}>{m.category || "—"}</td>
                          <td className="px-3 py-3 text-[12px]" style={{ color: "#F9E741" }}>{m.commissionPercent ?? m.commission_percent}%</td>
                          <td className="px-3 py-3 text-[12px]" style={{ color: "#A0A0A0" }}>{m.totalTransactions ?? m.total_transactions ?? 0}</td>
                          <td className="px-3 py-3">
                            <span className="inline-block px-2 py-1 rounded-[6px] text-[11px] font-medium" style={{ background: m.isActive ? "rgba(34,197,94,0.15)" : "rgba(249,231,65,0.15)", color: m.isActive ? "#22C55E" : "#F9E741" }}>
                              {m.isActive ? "\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D8" : "\u10DB\u10DD\u10DA\u10DD\u10D3\u10D8\u10DC\u10E8\u10D8"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              {!m.isActive ? (
                                <button disabled={actionLoading === m.id} onClick={() => handleAction(m.id, "approve")} className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all hover:opacity-80" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
                                  {actionLoading === m.id ? "..." : "\u10D3\u10D0\u10DB\u10E2\u10D9\u10D8\u10EA\u10D4\u10D1\u10D0"}
                                </button>
                              ) : (
                                <button disabled={actionLoading === m.id} onClick={() => handleAction(m.id, "reject")} className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all hover:opacity-80" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                                  {actionLoading === m.id ? "..." : "\u10D2\u10D0\u10D7\u10D8\u10E8\u10D5\u10D0"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {selectedId === m.id && (
                          <tr key={`${m.id}-detail`}>
                            <td colSpan={7} className="px-4 py-4" style={{ background: "#1A1A1A" }}>
                              {detailLoading ? (
                                <div className="flex justify-center py-4">
                                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
                                </div>
                              ) : detail ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10DB\u10D4\u10E0\u10E9\u10D0\u10DC\u10E2 ID"}</p>
                                    <p className="text-[16px] font-mono font-bold" style={{ color: "#F9E741" }}>{detail.merchant?.merchantCode || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10E2\u10D4\u10DA\u10D4\u10E4\u10DD\u10DC\u10D8"}</p>
                                    <p className="text-[13px]" style={{ color: "#FFF" }}>{detail.merchant?.phone || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10D4\u10DA-\u10E4\u10DD\u10E1\u10E2\u10D0"}</p>
                                    <p className="text-[13px]" style={{ color: "#FFF" }}>{detail.merchant?.email || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8"}</p>
                                    <p className="text-[13px]" style={{ color: "#FFF" }}>{detail.merchant?.address || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10E1\u10D0\u10D9\u10DD\u10DC\u10E2\u10D0\u10E5\u10E2\u10DD \u10DE\u10D8\u10E0\u10D8"}</p>
                                    <p className="text-[13px]" style={{ color: "#FFF" }}>{detail.merchant?.contactPerson || "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10D9\u10DD\u10DB\u10D8\u10E1\u10D8\u10D0 %"}</p>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min="0" max="100" step="0.5"
                                        defaultValue={detail.merchant?.commissionPercent ?? 3}
                                        onBlur={async (e) => {
                                          const val = parseFloat(e.target.value);
                                          if (!isNaN(val) && val >= 0 && val <= 100) {
                                            try {
                                              await updateMerchant(detail.merchant.id, { commission_percent: val });
                                              showToast("\u10D9\u10DD\u10DB\u10D8\u10E1\u10D8\u10D0 \u10D2\u10D0\u10DC\u10D0\u10EE\u10DA\u10D3\u10D0!");
                                              fetchMerchants();
                                            } catch { showToast("\u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D0", "error"); }
                                          }
                                        }}
                                        className="w-16 text-[13px] px-2 py-1 rounded-[6px] outline-none text-center"
                                        style={{ background: "#252525", color: "#F9E741", border: "1px solid #333" }}
                                      />
                                      <span className="text-[13px]" style={{ color: "#666" }}>%</span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10EF\u10D0\u10DB\u10E3\u10E0\u10D8 \u10D9\u10DD\u10DB\u10D8\u10E1\u10D8\u10D0"}</p>
                                    <p className="text-[13px]" style={{ color: "#22C55E" }}>{detail.stats?.totalCommission?.toFixed(2) || "0.00"} {"\u20BE"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10E0\u10D4\u10D2\u10D8\u10E1\u10E2\u10E0\u10D0\u10EA\u10D8\u10D0"}</p>
                                    <p className="text-[13px]" style={{ color: "#FFF" }}>{detail.merchant?.createdAt ? new Date(detail.merchant.createdAt).toLocaleDateString("ka-GE") : "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>PIN</p>
                                    <p className="text-[13px]" style={{ color: detail.merchant?.pinHash ? "#22C55E" : "#EF4444" }}>{detail.merchant?.pinHash ? "\u10D3\u10D0\u10E7\u10D4\u10DC\u10D4\u10D1\u10E3\u10DA\u10D8\u10D0" : "\u10D0\u10E0 \u10D0\u10E0\u10D8\u10E1 \u10D3\u10D0\u10E7\u10D4\u10DC\u10D4\u10D1\u10E3\u10DA\u10D8"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10E1\u10E2\u10D0\u10E2\u10E3\u10E1\u10D8"}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[13px] font-medium" style={{ color: detail.merchant?.isActive ? "#22C55E" : "#EF4444" }}>
                                        {detail.merchant?.isActive ? "\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D8" : "\u10D0\u10E0\u10D0\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D8"}
                                      </span>
                                    </div>
                                  </div>
                                  {detail.transactions && detail.transactions.length > 0 && (
                                    <div className="col-span-full mt-2">
                                      <p className="text-[12px] font-medium mb-2" style={{ color: "#A0A0A0" }}>{"\u10D1\u10DD\u10DA\u10DD \u10E2\u10E0\u10D0\u10DC\u10D6\u10D0\u10E5\u10EA\u10D8\u10D4\u10D1\u10D8"}</p>
                                      <div className="space-y-1">
                                        {detail.transactions.slice(0, 5).map((tx: any) => (
                                          <div key={tx.id} className="flex justify-between text-[12px] py-1 border-b" style={{ borderColor: "#252525" }}>
                                            <span style={{ color: "#A0A0A0" }}>{tx.userPhone || "—"}</span>
                                            <span style={{ color: "#FFF" }}>{tx.amount?.toFixed(2)} {"\u20BE"}</span>
                                            <span style={{ color: "#22C55E" }}>{tx.commissionAmount?.toFixed(2)} {"\u20BE"}</span>
                                            <span style={{ color: "#666" }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("ka-GE") : ""}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t" style={{ borderColor: "#252525" }}>
                  <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1.5 rounded-[6px] text-[12px] transition-all hover:bg-white/5 disabled:opacity-30" style={{ color: "#A0A0A0", border: "1px solid #252525" }}>
                    წინა
                  </button>
                  <span className="text-[12px] px-2" style={{ color: "#666" }}>{currentPage} / {totalPages}</span>
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1.5 rounded-[6px] text-[12px] transition-all hover:bg-white/5 disabled:opacity-30" style={{ color: "#A0A0A0", border: "1px solid #252525" }}>
                    შემდეგი
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Simulate Modal */}
      {showSimulate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[420px] rounded-[12px] border p-6" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold" style={{ color: "#FFF" }}>გადახდის სიმულაცია</h3>
              <button onClick={() => setShowSimulate(false)} className="transition-all hover:opacity-70">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="13" y2="13" /><line x1="13" y1="5" x2="5" y2="13" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <input value={simPhone} onChange={(e) => setSimPhone(e.target.value)} placeholder="ტელეფონი (+995...)" style={inputStyle} />
              <select value={simMerchantId} onChange={(e) => setSimMerchantId(e.target.value)} style={{ ...inputStyle, appearance: "none" as const }}>
                <option value="">მერჩანტი</option>
                {activeMerchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input value={simAmount} onChange={(e) => setSimAmount(e.target.value)} placeholder="თანხა ₾" type="number" style={inputStyle} />
            </div>
            <button onClick={handleSimulate} disabled={simLoading || !simPhone || !simMerchantId || !simAmount} className="w-full mt-4 py-3 rounded-[8px] text-[14px] font-semibold transition-all hover:opacity-80 disabled:opacity-40" style={{ background: "#F9E741", color: "#000" }}>
              {simLoading ? "იგზავნება..." : "სიმულაცია"}
            </button>
          </div>
        </div>
      )}

      {/* Approved merchant ID modal */}
      {approvedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setApprovedCode(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-[90%] max-w-[380px] text-center" style={{ background: "#111111", border: "1px solid #22C55E40" }} onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="8,16 14,22 24,10" /></svg>
            </div>
            <h3 className="text-[18px] font-bold mb-2" style={{ color: "#FFFFFF" }}>{"\u10DB\u10D4\u10E0\u10E9\u10D0\u10DC\u10E2\u10D8 \u10D3\u10D0\u10DB\u10E2\u10D9\u10D8\u10EA\u10D4\u10D1\u10E3\u10DA\u10D8\u10D0!"}</h3>
            <p className="text-[13px] mb-4" style={{ color: "#A0A0A0" }}>{"\u10DB\u10D4\u10E0\u10E9\u10D0\u10DC\u10E2\u10D8\u10E1 ID \u10D2\u10D0\u10E3\u10D2\u10D6\u10D0\u10D5\u10DC\u10D4\u10D7 \u10DB\u10D4\u10E0\u10E9\u10D0\u10DC\u10E2\u10E1:"}</p>
            <div className="rounded-[12px] px-4 py-3 mb-4" style={{ background: "#1A1A1A", border: "1px solid #252525" }}>
              <p className="text-[28px] font-extrabold tracking-[3px] font-mono" style={{ color: "#F9E741" }}>{approvedCode}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(approvedCode); showToast("\u10D3\u10D0\u10D9\u10DD\u10DE\u10D8\u10E0\u10D3\u10D0!"); }}
              className="px-6 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all hover:opacity-80 mb-3"
              style={{ background: "#F9E741", color: "#000" }}
            >{"\u10D3\u10D0\u10D9\u10DD\u10DE\u10D8\u10E0\u10D4\u10D1\u10D0"}</button>
            <br />
            <button onClick={() => setApprovedCode(null)} className="text-[13px] mt-2" style={{ color: "#666666" }}>{"\u10D3\u10D0\u10EE\u10E3\u10E0\u10D5\u10D0"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
