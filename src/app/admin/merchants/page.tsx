"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getMerchants, getMerchant, updateMerchant, simulatePayment, createMerchant, getMerchantProducts, createMerchantProduct, updateMerchantProduct, deleteMerchantProduct } from "@/services/admin";

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
  { label: "Offers", id: "offers", href: "/admin/offers" },
  { label: "Shansi Drops", id: "tickets", href: "/admin/tickets" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "Analytics", id: "analytics", href: "/admin/analytics" },
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

// Image upload helper — converts file to base64, resized to max 400x400
async function fileToCompressedBase64(file: File, maxDim = 400, quality = 0.85): Promise<string> {
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

  // Create merchant modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [cForm, setCForm] = useState({
    business_name: "",
    business_name_ka: "",
    category: "other",
    phone: "+995",
    email: "",
    address: "",
    contact_person: "",
    commission_percent: "3",
  });
  const [cLogo, setCLogo] = useState<string>("");
  const [cLogoLoading, setCLogoLoading] = useState(false);
  const cLogoInputRef = useRef<HTMLInputElement>(null);
  // Detail-view logo editor (per-merchant)
  const detailLogoInputRef = useRef<HTMLInputElement>(null);
  const [editingLogoFor, setEditingLogoFor] = useState<string | null>(null);
  const [detailLogoLoading, setDetailLogoLoading] = useState(false);

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", image_url: "" });
  const [productImageLoading, setProductImageLoading] = useState(false);
  const productImageRef = useRef<HTMLInputElement>(null);

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
      const [data, prods] = await Promise.all([getMerchant(id), getMerchantProducts(id)]) as any[];
      setDetail({ ...data, products: prods.products || [] });
    } catch { showToast("დეტალები ვერ ჩაიტვირთა", "error"); }
    finally { setDetailLoading(false); }
  };

  const refreshProducts = async (merchantId: string) => {
    const prods = await getMerchantProducts(merchantId) as any;
    setDetail((prev: any) => prev ? ({ ...prev, products: prods.products || [] }) : prev);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all hover:opacity-80"
              style={{ background: "#F9E741", color: "#000000" }}
            >
              + ახალი მერჩანტი
            </button>
            <button
              onClick={openSimulate}
              className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all hover:opacity-80"
              style={{ background: "transparent", color: "#F9E741", border: "1px solid #F9E74140" }}
            >
              სიმულაცია
            </button>
          </div>
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
                          <td className="px-3 py-3 text-[13px]" style={{ color: "#FFF" }}>
                            <div className="flex items-center gap-2">
                              {m.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.logoUrl} alt="" className="w-7 h-7 rounded-[6px] object-cover shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: "#252525" }}>
                                  <span className="text-[10px]" style={{ color: "#666" }}>{(m.businessName || m.name || "?").slice(0, 1).toUpperCase()}</span>
                                </div>
                              )}
                              <span>{m.businessName || m.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[12px]" style={{ color: "#A0A0A0" }}>{m.category || "—"}</td>
                          <td className="px-3 py-3 text-[12px]">
                            {m.commissionEnabled === false ? (
                              <span style={{ color: "#666", textDecoration: "line-through" }}>{m.commissionPercent ?? m.commission_percent}%</span>
                            ) : (
                              <span style={{ color: "#F9E741" }}>{m.commissionPercent ?? m.commission_percent}%</span>
                            )}
                          </td>
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
                                  {/* Logo editor */}
                                  <div className="md:col-span-3">
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>ლოგო</p>
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-[72px] h-[72px] rounded-[10px] overflow-hidden flex items-center justify-center shrink-0"
                                        style={{ background: "#1C1C1E", border: "1px solid #2A2A2A" }}
                                      >
                                        {detail.merchant?.logoUrl ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={detail.merchant.logoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <circle cx="9" cy="9" r="2" />
                                            <path d="M21 15l-5-5L5 21" />
                                          </svg>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingLogoFor(detail.merchant.id);
                                            detailLogoInputRef.current?.click();
                                          }}
                                          disabled={detailLogoLoading && editingLogoFor === detail.merchant.id}
                                          className="px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 disabled:opacity-50"
                                          style={{ background: "#F9E74120", color: "#F9E741", border: "1px solid #F9E74140" }}
                                        >
                                          {detailLogoLoading && editingLogoFor === detail.merchant.id
                                            ? "იტვირთება..."
                                            : detail.merchant?.logoUrl ? "შეცვლა" : "ატვირთვა"}
                                        </button>
                                        {detail.merchant?.logoUrl && (
                                          <button
                                            onClick={async () => {
                                              if (!window.confirm("ლოგოს წაშლა?")) return;
                                              try {
                                                await updateMerchant(detail.merchant.id, { logo_url: null });
                                                showToast("ლოგო წაიშალა");
                                                fetchMerchants();
                                              } catch { showToast("შეცდომა", "error"); }
                                            }}
                                            className="px-3 py-2 rounded-[8px] text-[12px] font-medium"
                                            style={{ background: "#EF444420", color: "#EF4444" }}
                                          >
                                            წაშლა
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

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
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10D9\u10DD\u10DB\u10D8\u10E1\u10D8\u10D8\u10E1 \u10E1\u10E2\u10D0\u10E2\u10E3\u10E1\u10D8"}</p>
                                    <button
                                      onClick={async () => {
                                        const current = detail.merchant?.commissionEnabled !== false;
                                        try {
                                          await updateMerchant(detail.merchant.id, { commission_enabled: !current });
                                          showToast(!current ? "\u10D9\u10DD\u10DB\u10D8\u10E1\u10D8\u10D0 \u10E9\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8\u10D0" : "\u10D9\u10DD\u10DB\u10D8\u10E1\u10D8\u10D0 \u10D2\u10D0\u10DB\u10DD\u10E0\u10D7\u10E3\u10DA\u10D8\u10D0");
                                          fetchMerchants();
                                        } catch { showToast("\u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D0", "error"); }
                                      }}
                                      className="relative inline-flex items-center rounded-full transition-all duration-200"
                                      style={{
                                        width: 44,
                                        height: 24,
                                        background: detail.merchant?.commissionEnabled !== false ? "#22C55E" : "#444",
                                      }}
                                    >
                                      <span
                                        className="inline-block rounded-full bg-white transition-all duration-200"
                                        style={{
                                          width: 18,
                                          height: 18,
                                          transform: `translateX(${detail.merchant?.commissionEnabled !== false ? 22 : 4}px)`,
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                        }}
                                      />
                                    </button>
                                    <p className="text-[11px] mt-1" style={{ color: detail.merchant?.commissionEnabled !== false ? "#22C55E" : "#EF4444" }}>
                                      {detail.merchant?.commissionEnabled !== false
                                        ? "\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D8"
                                        : "\u10D2\u10D0\u10DB\u10DD\u10E0\u10D7\u10E3\u10DA\u10D8"}
                                    </p>
                                  </div>

                                  {/* Show on promos toggle */}
                                  <div>
                                    <p className="text-[11px] mb-1" style={{ color: "#666" }}>პრომოზე ჩვენება</p>
                                    <button
                                      onClick={async () => {
                                        const current = detail.merchant?.showOnPromos === true;
                                        try {
                                          await updateMerchant(detail.merchant.id, { show_on_promos: !current });
                                          showToast(!current ? "პრომოზე დაემატა" : "პრომოდან წაიშალა");
                                          fetchMerchants();
                                          const refreshed = await getMerchant(detail.merchant.id) as any;
                                          setDetail(refreshed);
                                        } catch { showToast("შეცდომა", "error"); }
                                      }}
                                      className="relative inline-flex items-center rounded-full transition-all duration-200"
                                      style={{
                                        width: 44,
                                        height: 24,
                                        background: detail.merchant?.showOnPromos === true ? "#22C55E" : "#444",
                                      }}
                                    >
                                      <span
                                        className="inline-block rounded-full bg-white transition-all duration-200"
                                        style={{
                                          width: 18,
                                          height: 18,
                                          transform: `translateX(${detail.merchant?.showOnPromos === true ? 22 : 4}px)`,
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                        }}
                                      />
                                    </button>
                                    <p className="text-[11px] mt-1" style={{ color: detail.merchant?.showOnPromos === true ? "#22C55E" : "#EF4444" }}>
                                      {detail.merchant?.showOnPromos === true ? "ჩართულია" : "გამორთულია"}
                                    </p>
                                  </div>

                                  {detail.merchant?.commissionEnabled !== false && (
                                    <div>
                                      <p className="text-[11px] mb-1" style={{ color: "#666" }}>{"\u10EF\u10D0\u10DB\u10E3\u10E0\u10D8 \u10D9\u10DD\u10DB\u10D8\u10E1\u10D8\u10D0"}</p>
                                      <p className="text-[13px]" style={{ color: "#22C55E" }}>{detail.stats?.totalCommission?.toFixed(2) || "0.00"} {"\u20BE"}</p>
                                    </div>
                                  )}
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
                                  {/* Products section */}
                                  {detail.merchant && (
                                    <div className="col-span-full mt-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <p className="text-[14px] font-bold" style={{ color: "#FFF" }}>პროდუქტები</p>
                                        <button
                                          onClick={() => {
                                            setEditingProduct(null);
                                            setProductForm({ name: "", price: "", image_url: "" });
                                            setShowProductForm(true);
                                          }}
                                          className="text-[12px] px-4 py-1.5 rounded-full font-bold"
                                          style={{ background: "#F9E741", color: "#000" }}
                                        >
                                          + დამატება
                                        </button>
                                      </div>

                                      {/* Product form (add / edit) */}
                                      {showProductForm && (
                                        <div className="rounded-[12px] p-4 mb-4" style={{ background: "#0F0F0F", border: "1px solid #252525" }}>
                                          <p className="text-[13px] font-bold mb-3" style={{ color: "#FFF" }}>
                                            {editingProduct ? "რედაქტირება" : "ახალი პროდუქტი"}
                                          </p>
                                          <div className="flex flex-col gap-3">
                                            <div>
                                              <label className="text-[11px] mb-1 block font-semibold uppercase" style={{ color: "#666" }}>სახელი</label>
                                              <input
                                                type="text"
                                                value={productForm.name}
                                                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                                placeholder="კარტოფილი ფრი"
                                                className="w-full rounded-[8px] px-3 py-2.5 text-[13px] outline-none"
                                                style={{ background: "#1C1C1E", color: "#FFF", border: "1px solid #252525" }}
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[11px] mb-1 block font-semibold uppercase" style={{ color: "#666" }}>ფასი (₾)</label>
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={productForm.price}
                                                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                                placeholder="4.45"
                                                className="w-full rounded-[8px] px-3 py-2.5 text-[13px] outline-none"
                                                style={{ background: "#1C1C1E", color: "#FFF", border: "1px solid #252525" }}
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[11px] mb-1 block font-semibold uppercase" style={{ color: "#666" }}>სურათი</label>
                                              <input
                                                ref={productImageRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                  const file = e.target.files?.[0];
                                                  if (!file) return;
                                                  setProductImageLoading(true);
                                                  try {
                                                    const base64 = await fileToCompressedBase64(file, 600, 0.85);
                                                    setProductForm((prev) => ({ ...prev, image_url: base64 }));
                                                  } catch { showToast("სურათი ვერ აიტვირთა", "error"); }
                                                  finally { setProductImageLoading(false); }
                                                }}
                                              />
                                              <div className="flex items-center gap-3">
                                                {productForm.image_url && (
                                                  <img src={productForm.image_url} alt="" className="w-[48px] h-[48px] rounded-[8px] object-cover shrink-0" />
                                                )}
                                                <button
                                                  onClick={() => productImageRef.current?.click()}
                                                  disabled={productImageLoading}
                                                  className="px-4 py-2 rounded-[8px] text-[12px] font-semibold"
                                                  style={{ background: "#1C1C1E", color: "#FFF", border: "1px solid #252525" }}
                                                >
                                                  {productImageLoading ? "იტვირთება..." : productForm.image_url ? "შეცვლა" : "ატვირთვა"}
                                                </button>
                                                {productForm.image_url && (
                                                  <button
                                                    onClick={() => setProductForm((prev) => ({ ...prev, image_url: "" }))}
                                                    className="text-[11px] px-2 py-1 rounded"
                                                    style={{ color: "#EF4444" }}
                                                  >
                                                    წაშლა
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                              <button
                                                onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                                                className="flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold"
                                                style={{ background: "#1C1C1E", color: "#A0A0A0", border: "1px solid #252525" }}
                                              >
                                                გაუქმება
                                              </button>
                                              <button
                                                onClick={async () => {
                                                  if (!productForm.name || !productForm.price) { showToast("შეავსეთ სახელი და ფასი", "error"); return; }
                                                  const price = parseFloat(productForm.price);
                                                  if (isNaN(price)) { showToast("არასწორი ფასი", "error"); return; }
                                                  try {
                                                    if (editingProduct) {
                                                      await updateMerchantProduct(detail.merchant.id, editingProduct.id, {
                                                        name: productForm.name,
                                                        price,
                                                        image_url: productForm.image_url || null,
                                                      });
                                                      showToast("შენახულია");
                                                    } else {
                                                      await createMerchantProduct(detail.merchant.id, {
                                                        name: productForm.name,
                                                        price,
                                                        image_url: productForm.image_url || null,
                                                      });
                                                      showToast("პროდუქტი დაემატა");
                                                    }
                                                    setShowProductForm(false);
                                                    setEditingProduct(null);
                                                    setProductForm({ name: "", price: "", image_url: "" });
                                                    await refreshProducts(detail.merchant.id);
                                                  } catch { showToast("შეცდომა", "error"); }
                                                }}
                                                className="flex-1 py-2.5 rounded-[8px] text-[13px] font-bold"
                                                style={{ background: "#F9E741", color: "#000" }}
                                              >
                                                {editingProduct ? "შენახვა" : "დამატება"}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Product list */}
                                      {detail.products && detail.products.length > 0 ? (
                                        <div className="space-y-2">
                                          {detail.products.map((p: any) => (
                                            <div key={p.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: "#0F0F0F", border: "1px solid #1A1A1A" }}>
                                              <div className="w-[50px] h-[50px] rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#1C1C1E" }}>
                                                {p.imageUrl ? (
                                                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                  <span className="text-[18px]">🍽</span>
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold truncate" style={{ color: "#FFF" }}>{p.name}</p>
                                                <p className="text-[12px] font-bold" style={{ color: "#F9E741" }}>{p.price?.toFixed(2)} ₾</p>
                                              </div>
                                              <button
                                                onClick={() => {
                                                  setEditingProduct(p);
                                                  setProductForm({ name: p.name, price: String(p.price), image_url: p.imageUrl || "" });
                                                  setShowProductForm(true);
                                                }}
                                                className="text-[11px] px-3 py-1.5 rounded-[6px] font-semibold"
                                                style={{ background: "#1C1C1E", color: "#F9E741", border: "1px solid #252525" }}
                                              >
                                                ✏️
                                              </button>
                                              <button
                                                onClick={async () => {
                                                  if (!confirm("წაშლა?")) return;
                                                  try {
                                                    await deleteMerchantProduct(detail.merchant.id, p.id);
                                                    showToast("წაიშალა");
                                                    await refreshProducts(detail.merchant.id);
                                                  } catch { showToast("შეცდომა", "error"); }
                                                }}
                                                className="text-[11px] px-2 py-1.5 rounded-[6px]"
                                                style={{ background: "#1C1C1E", color: "#EF4444", border: "1px solid #252525" }}
                                              >
                                                🗑
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : !showProductForm ? (
                                        <p className="text-[12px]" style={{ color: "#555" }}>პროდუქტები არ არის დამატებული</p>
                                      ) : null}
                                    </div>
                                  )}

                                  {detail.transactions && detail.transactions.length > 0 && (() => {
                                    const showCommission = detail.merchant?.commissionEnabled !== false;
                                    return (
                                      <div className="col-span-full mt-2">
                                        <p className="text-[12px] font-medium mb-2" style={{ color: "#A0A0A0" }}>{"\u10D1\u10DD\u10DA\u10DD \u10E2\u10E0\u10D0\u10DC\u10D6\u10D0\u10E5\u10EA\u10D8\u10D4\u10D1\u10D8"}</p>
                                        <div className="space-y-1">
                                          {detail.transactions.slice(0, 5).map((tx: any) => (
                                            <div key={tx.id} className="flex justify-between text-[12px] py-1 border-b" style={{ borderColor: "#252525" }}>
                                              <span style={{ color: "#A0A0A0" }}>{tx.userPhone || "—"}</span>
                                              <span style={{ color: "#FFF" }}>{tx.amount?.toFixed(2)} {"\u20BE"}</span>
                                              {showCommission && (
                                                <span style={{ color: "#22C55E" }}>{tx.commissionAmount?.toFixed(2)} {"\u20BE"}</span>
                                              )}
                                              <span style={{ color: "#666" }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("ka-GE") : ""}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
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

      {/* Hidden file input for per-merchant detail logo upload */}
      <input
        ref={detailLogoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          const mid = editingLogoFor;
          if (!f || !mid) return;
          setDetailLogoLoading(true);
          try {
            const b64 = await fileToCompressedBase64(f);
            await updateMerchant(mid, { logo_url: b64 });
            showToast("ლოგო განახლდა");
            fetchMerchants();
          } catch {
            showToast("სურათის ატვირთვა ვერ მოხერხდა", "error");
          } finally {
            setDetailLogoLoading(false);
            setEditingLogoFor(null);
            if (detailLogoInputRef.current) detailLogoInputRef.current.value = "";
          }
        }}
      />

      {/* Create Merchant Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[480px] rounded-[12px] border p-6 max-h-[90vh] overflow-y-auto" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold" style={{ color: "#FFF" }}>ახალი მერჩანტი</h3>
              <button onClick={() => setCreateOpen(false)} className="transition-all hover:opacity-70">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="13" y2="13" /><line x1="13" y1="5" x2="5" y2="13" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              {/* Logo upload */}
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ლოგო</label>
                <div
                  onClick={() => cLogoInputRef.current?.click()}
                  className="flex items-center gap-3 p-2 rounded-[8px] cursor-pointer transition-all hover:brightness-110"
                  style={{ background: "#111", border: "1px dashed #333" }}
                >
                  <div
                    className="w-[64px] h-[64px] rounded-[8px] flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: "#1C1C1E" }}
                  >
                    {cLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cLogo} alt="logo" className="w-full h-full object-cover" />
                    ) : cLogoLoading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: cLogo ? "#22C55E" : "#A0A0A0" }}>
                      {cLogo ? "ლოგო ატვირთულია" : "აირჩიეთ ლოგო"}
                    </p>
                    <p className="text-[11px]" style={{ color: "#666" }}>PNG, JPG, ან WebP (max 400×400)</p>
                  </div>
                  {cLogo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCLogo(""); }}
                      className="px-2 py-1 rounded-[6px] text-[11px] font-medium"
                      style={{ background: "#EF444420", color: "#EF4444" }}
                    >
                      წაშლა
                    </button>
                  )}
                </div>
                <input
                  ref={cLogoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setCLogoLoading(true);
                    try {
                      const b64 = await fileToCompressedBase64(f);
                      setCLogo(b64);
                    } catch {
                      showToast("სურათის ატვირთვა ვერ მოხერხდა", "error");
                    } finally {
                      setCLogoLoading(false);
                      if (cLogoInputRef.current) cLogoInputRef.current.value = "";
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ბიზნესის სახელი *</label>
                <input value={cForm.business_name} onChange={(e) => setCForm((p) => ({ ...p, business_name: e.target.value }))} placeholder="Business name" style={inputStyle} />
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ქართული სახელი</label>
                <input value={cForm.business_name_ka} onChange={(e) => setCForm((p) => ({ ...p, business_name_ka: e.target.value }))} placeholder="ქართული დასახელება" style={inputStyle} />
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ტელეფონი *</label>
                <input value={cForm.phone} onChange={(e) => setCForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+995..." style={inputStyle} />
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>კატეგორია</label>
                <select value={cForm.category} onChange={(e) => setCForm((p) => ({ ...p, category: e.target.value }))} style={{ ...inputStyle, appearance: "none" as const }}>
                  <option value="food">საკვები</option>
                  <option value="retail">საცალო</option>
                  <option value="cafe">კაფე</option>
                  <option value="restaurant">რესტორანი</option>
                  <option value="pharmacy">აფთიაქი</option>
                  <option value="grocery">სასურსათო</option>
                  <option value="entertainment">გართობა</option>
                  <option value="other">სხვა</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>კომისია %</label>
                  <input type="number" step="0.5" min="0" max="100" value={cForm.commission_percent} onChange={(e) => setCForm((p) => ({ ...p, commission_percent: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>საკონტაქტო პირი</label>
                  <input value={cForm.contact_person} onChange={(e) => setCForm((p) => ({ ...p, contact_person: e.target.value }))} placeholder="Contact person" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ელ-ფოსტა</label>
                <input type="email" value={cForm.email} onChange={(e) => setCForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" style={inputStyle} />
              </div>
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>მისამართი</label>
                <input value={cForm.address} onChange={(e) => setCForm((p) => ({ ...p, address: e.target.value }))} placeholder="Address" style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setCreateOpen(false)}
                className="flex-1 py-2.5 rounded-[8px] text-[13px] font-medium transition-all hover:brightness-110"
                style={{ background: "#252525", color: "#A0A0A0" }}
              >
                გაუქმება
              </button>
              <button
                onClick={async () => {
                  if (!cForm.business_name.trim() || !cForm.phone.trim()) {
                    showToast("სახელი და ტელეფონი სავალდებულოა", "error");
                    return;
                  }
                  setCreateLoading(true);
                  try {
                    await createMerchant({
                      business_name: cForm.business_name.trim(),
                      business_name_ka: cForm.business_name_ka.trim() || undefined,
                      category: cForm.category,
                      phone: cForm.phone.trim(),
                      email: cForm.email.trim() || undefined,
                      address: cForm.address.trim() || undefined,
                      contact_person: cForm.contact_person.trim() || undefined,
                      commission_percent: parseFloat(cForm.commission_percent) || 3,
                      logo_url: cLogo || undefined,
                    });
                    showToast("მერჩანტი დაემატა");
                    setCreateOpen(false);
                    setCForm({
                      business_name: "", business_name_ka: "", category: "other",
                      phone: "+995", email: "", address: "", contact_person: "",
                      commission_percent: "3",
                    });
                    setCLogo("");
                    fetchMerchants();
                  } catch (e: any) {
                    showToast(e.message || "შეცდომა", "error");
                  } finally {
                    setCreateLoading(false);
                  }
                }}
                disabled={createLoading}
                className="flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: "#F9E741", color: "#000" }}
              >
                {createLoading ? "იქმნება..." : "შექმნა"}
              </button>
            </div>
          </div>
        </div>
      )}

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
