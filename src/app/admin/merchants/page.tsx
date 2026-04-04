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
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /><path d="M7 16v-5h4v5" /><path d="M2 6c0 1.1.9 2 2 2s2-.9 2-2" /><path d="M6 6c0 1.1.9 2 2 2s2-.9 2-2" /><path d="M10 6c0 1.1.9 2 2 2s2-.9 2-2" /></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /><path d="M6 7h6" /><path d="M9 7v8" /></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l2-3h10l2 3" /><rect x="2" y="6" width="14" height="10" rx="1" /><path d="M9 6v10" /><path d="M2 6h14" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2.5" /><circle cx="13" cy="6" r="2.5" /><path d="M1 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /><path d="M9 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /></svg>,
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
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "Notifications", id: "notifications", href: "/admin/notifications" },
  { label: "Analytics", id: "analytics", href: "/admin/analytics" },
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── MOCK DATA ── */
interface PendingMerchant {
  id: number;
  name: string;
  llcCode: string;
  category: string;
  location: string;
  contact: string;
  phone: string;
  submittedAt: string;
}

interface ActiveMerchant {
  id: number;
  name: string;
  category: string;
  location: string;
  totalTx: number;
  totalAmount: number;
  commission: number;
  commissionPercent: number;
  isActive: boolean;
  contact: string;
  phone: string;
  llcCode: string;
  joinedAt: string;
}

const INITIAL_PENDING: PendingMerchant[] = [
  { id: 101, name: "Stamba Cafe", llcCode: "LLC-2024-4821", category: "კაფე / რესტორანი", location: "თბილისი, ვაკე", contact: "ანა მეტრეველი", phone: "+995 599 12 34 56", submittedAt: "2026-03-27" },
  { id: 102, name: "Book House Tbilisi", llcCode: "LLC-2024-5519", category: "წიგნების მაღაზია", location: "თბილისი, საბურთალო", contact: "გიორგი ხარაიშვილი", phone: "+995 577 44 55 66", submittedAt: "2026-03-26" },
  { id: 103, name: "Green Market", llcCode: "LLC-2025-0012", category: "სუპერმარკეტი", location: "ბათუმი, ცენტრი", contact: "ნინო ჯაფარიძე", phone: "+995 555 77 88 99", submittedAt: "2026-03-25" },
  { id: 104, name: "AutoFix Garage", llcCode: "LLC-2024-8834", category: "ავტო სერვისი", location: "თბილისი, გლდანი", contact: "დავით ბერიძე", phone: "+995 591 22 33 44", submittedAt: "2026-03-24" },
  { id: 105, name: "Bella Pizza", llcCode: "LLC-2025-0078", category: "კაფე / რესტორანი", location: "ქუთაისი, ცენტრი", contact: "მარიამ სულხანიშვილი", phone: "+995 568 99 00 11", submittedAt: "2026-03-23" },
];

const INITIAL_ACTIVE: ActiveMerchant[] = [
  { id: 1, name: "Luca Polare", category: "კაფე / რესტორანი", location: "თბილისი, ვერა", totalTx: 4820, totalAmount: 72450.0, commission: 1449.0, commissionPercent: 2.0, isActive: true, contact: "ლუკა პოლარე", phone: "+995 599 11 22 33", llcCode: "LLC-2023-1122", joinedAt: "2025-06-15" },
  { id: 2, name: "Coffee Lab", category: "კაფე", location: "თბილისი, საბურთალო", totalTx: 3210, totalAmount: 28890.0, commission: 577.8, commissionPercent: 2.0, isActive: true, contact: "ელენე რუხაძე", phone: "+995 577 33 44 55", llcCode: "LLC-2023-2233", joinedAt: "2025-07-01" },
  { id: 3, name: "Dunkin' Georgia", category: "ფასტფუდი", location: "თბილისი, დიდუბე", totalTx: 8920, totalAmount: 124880.0, commission: 3746.4, commissionPercent: 3.0, isActive: true, contact: "თორნიკე ანანიძე", phone: "+995 591 55 66 77", llcCode: "LLC-2023-3344", joinedAt: "2025-05-20" },
  { id: 4, name: "Wendy's Tbilisi", category: "ფასტფუდი", location: "თბილისი, ისანი", totalTx: 6450, totalAmount: 96750.0, commission: 2418.75, commissionPercent: 2.5, isActive: true, contact: "ირაკლი მაისურაძე", phone: "+995 555 88 99 00", llcCode: "LLC-2023-4455", joinedAt: "2025-08-10" },
  { id: 5, name: "GPC Electronics", category: "ელექტრონიკა", location: "თბილისი, გლდანი", totalTx: 1280, totalAmount: 256000.0, commission: 5120.0, commissionPercent: 2.0, isActive: true, contact: "სალომე კვირკველია", phone: "+995 568 11 22 33", llcCode: "LLC-2024-5566", joinedAt: "2025-09-01" },
  { id: 6, name: "Pasanauri", category: "რესტორანი", location: "თბილისი, მთაწმინდა", totalTx: 5670, totalAmount: 113400.0, commission: 2835.0, commissionPercent: 2.5, isActive: true, contact: "ნიკა ფასანაური", phone: "+995 599 44 55 66", llcCode: "LLC-2023-6677", joinedAt: "2025-04-15" },
  { id: 7, name: "Bread House", category: "პურის მაღაზია", location: "თბილისი, ნაძალადევი", totalTx: 9340, totalAmount: 46700.0, commission: 934.0, commissionPercent: 2.0, isActive: false, contact: "ზურა ბრედაშვილი", phone: "+995 577 66 77 88", llcCode: "LLC-2024-7788", joinedAt: "2025-10-20" },
  { id: 8, name: "Wolt Market", category: "დელივერი", location: "თბილისი, ვაკე", totalTx: 12450, totalAmount: 186750.0, commission: 5602.5, commissionPercent: 3.0, isActive: true, contact: "ანდრია ვოლტი", phone: "+995 591 88 99 00", llcCode: "LLC-2023-8899", joinedAt: "2025-03-01" },
  { id: 9, name: "Magti Sport", category: "სპორტი", location: "ბათუმი, ცენტრი", totalTx: 2100, totalAmount: 63000.0, commission: 1260.0, commissionPercent: 2.0, isActive: true, contact: "გვანცა მაღთიფლიძე", phone: "+995 555 00 11 22", llcCode: "LLC-2024-9900", joinedAt: "2025-11-05" },
  { id: 10, name: "Smart Pharmacy", category: "აფთიაქი", location: "თბილისი, ვაკე", totalTx: 7820, totalAmount: 117300.0, commission: 2346.0, commissionPercent: 2.0, isActive: true, contact: "თამარ სმარტაშვილი", phone: "+995 568 33 44 55", llcCode: "LLC-2024-0011", joinedAt: "2025-12-01" },
];

/* ── MAIN PAGE ── */
export default function MerchantsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");

  const [pendingMerchants, setPendingMerchants] = useState<PendingMerchant[]>(INITIAL_PENDING);
  const [activeMerchants, setActiveMerchants] = useState<ActiveMerchant[]>(INITIAL_ACTIVE);

  // Modals
  const [confirmAction, setConfirmAction] = useState<{ type: "activate" | "reject"; merchant: PendingMerchant } | null>(null);

  // Detail panel
  const [selectedMerchant, setSelectedMerchant] = useState<ActiveMerchant | null>(null);
  const [editCommission, setEditCommission] = useState<number>(0);
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  /* Handlers */
  const handleActivate = (merchant: PendingMerchant) => {
    setPendingMerchants((prev) => prev.filter((m) => m.id !== merchant.id));
    setActiveMerchants((prev) => [
      ...prev,
      {
        id: merchant.id,
        name: merchant.name,
        category: merchant.category,
        location: merchant.location,
        totalTx: 0,
        totalAmount: 0,
        commission: 0,
        commissionPercent: 2.0,
        isActive: true,
        contact: merchant.contact,
        phone: merchant.phone,
        llcCode: merchant.llcCode,
        joinedAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setConfirmAction(null);
  };

  const handleReject = (merchant: PendingMerchant) => {
    setPendingMerchants((prev) => prev.filter((m) => m.id !== merchant.id));
    setConfirmAction(null);
  };

  const toggleMerchantActive = (id: number) => {
    setActiveMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    );
    if (selectedMerchant?.id === id) {
      setSelectedMerchant((prev) => prev ? { ...prev, isActive: !prev.isActive } : null);
    }
  };

  const handleSaveCommission = () => {
    if (!selectedMerchant) return;
    const clamped = Math.min(10, Math.max(0.5, editCommission));
    setActiveMerchants((prev) =>
      prev.map((m) => (m.id === selectedMerchant.id ? { ...m, commissionPercent: clamped } : m))
    );
    setSelectedMerchant((prev) => prev ? { ...prev, commissionPercent: clamped } : null);
    setIsEditingCommission(false);
  };

  const handleDeactivateMerchant = () => {
    if (!selectedMerchant) return;
    setActiveMerchants((prev) =>
      prev.map((m) => (m.id === selectedMerchant.id ? { ...m, isActive: false } : m))
    );
    setSelectedMerchant((prev) => prev ? { ...prev, isActive: false } : null);
    setShowDeactivateConfirm(false);
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
              style={{ background: item.id === "merchants" ? "#1A1A1A" : "transparent", borderLeft: item.id === "merchants" ? "3px solid #F9E741" : "3px solid transparent" }}>
              <NavIcon id={item.id} active={item.id === "merchants"} />
              <span className="text-[13px] font-medium" style={{ color: item.id === "merchants" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
                  style={{ background: item.id === "merchants" ? "#1A1A1A" : "transparent", borderLeft: item.id === "merchants" ? "3px solid #F9E741" : "3px solid transparent" }}>
                  <NavIcon id={item.id} active={item.id === "merchants"} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === "merchants" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 py-3 border-b" style={{ background: "#000000", borderColor: "#252525" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-95" style={{ background: "#1A1A1A" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="5" x2="15" y2="5" /><line x1="3" y1="9" x2="15" y2="9" /><line x1="3" y1="13" x2="15" y2="13" /></svg>
            </button>
            <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>MERCHANTS</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
              {activeMerchants.filter((m) => m.isActive).length} active
            </span>
            <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: pendingMerchants.length > 0 ? "#F9E74120" : "#1A1A1A", color: pendingMerchants.length > 0 ? "#F9E741" : "#666666" }}>
              {pendingMerchants.length} pending
            </span>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {/* ── TABS ── */}
          <div className="flex gap-1 mb-5 p-1 rounded-[10px]" style={{ background: "#111111" }}>
            <button
              onClick={() => setActiveTab("pending")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all"
              style={{
                background: activeTab === "pending" ? "#1A1A1A" : "transparent",
                color: activeTab === "pending" ? "#FFFFFF" : "#666666",
                boxShadow: activeTab === "pending" ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={activeTab === "pending" ? "#F9E741" : "#666666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6.5" /><path d="M8 4.5v4l2.5 1.5" />
              </svg>
              Pending
              {pendingMerchants.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#F9E741", color: "#000000" }}>
                  {pendingMerchants.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all"
              style={{
                background: activeTab === "active" ? "#1A1A1A" : "transparent",
                color: activeTab === "active" ? "#FFFFFF" : "#666666",
                boxShadow: activeTab === "active" ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={activeTab === "active" ? "#22C55E" : "#666666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.5 4.5l-7 7L3 8" />
              </svg>
              Active
            </button>
          </div>

          {/* ═══ PENDING TAB ═══ */}
          {activeTab === "pending" && (
            <div className="space-y-3">
              {pendingMerchants.length === 0 ? (
                <div className="rounded-[12px] p-8 border text-center" style={{ background: "#111111", borderColor: "#252525" }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                    <circle cx="20" cy="20" r="16" /><path d="M14 20l4 4 8-8" />
                  </svg>
                  <p className="text-[14px] font-semibold" style={{ color: "#A0A0A0" }}>No pending merchants</p>
                  <p className="text-[12px] mt-1" style={{ color: "#666666" }}>All merchant applications have been reviewed</p>
                </div>
              ) : (
                pendingMerchants.map((m) => (
                  <div key={m.id} className="rounded-[12px] p-4 border transition-all hover:border-[#333333]" style={{ background: "#111111", borderColor: "#252525" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-[15px] font-bold" style={{ color: "#FFFFFF" }}>{m.name}</h3>
                        <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>Submitted: {m.submittedAt}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F9E74120", color: "#F9E741" }}>
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="1" width="10" height="12" rx="1" /><path d="M5 4h4M5 7h4M5 10h2" />
                        </svg>
                        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{m.llcCode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 1C4.5 1 2.5 3 2.5 5.5C2.5 9.5 7 13 7 13s4.5-3.5 4.5-7.5C11.5 3 9.5 1 7 1z" /><circle cx="7" cy="5.5" r="1.5" />
                        </svg>
                        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{m.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6l1-3.5h8L12 6" /><path d="M2 6v6h10V6" /><path d="M5.5 12V9h3v3" />
                        </svg>
                        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{m.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="7" cy="4" r="2.5" /><path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" />
                        </svg>
                        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{m.contact}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1.5 2.5h3l1.5 3-2 1.5a9 9 0 004.5 4.5l1.5-2 3 1.5v3a1 1 0 01-1 1C5.5 14 0 8.5 0 3.5a1 1 0 011-1h.5z" />
                        </svg>
                        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{m.phone}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmAction({ type: "activate", merchant: m })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[8px] text-[12px] font-bold transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{ background: "#22C55E", color: "#FFFFFF" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4l-5.5 6L3 7.5" />
                        </svg>
                        აქტივაცია
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: "reject", merchant: m })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[8px] text-[12px] font-bold transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{ background: "#EF4444", color: "#FFFFFF" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="3.5" y1="3.5" x2="10.5" y2="10.5" /><line x1="10.5" y1="3.5" x2="3.5" y2="10.5" />
                        </svg>
                        უარყოფა
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ ACTIVE TAB ═══ */}
          {activeTab === "active" && (
            <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #252525" }}>
                      {["Business Name", "Category", "Location", "Total Tx", "Total \u20BE", "Commission \u20BE", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeMerchants.map((m, i) => (
                      <tr
                        key={m.id}
                        onClick={() => { setSelectedMerchant(m); setEditCommission(m.commissionPercent); setIsEditingCommission(false); }}
                        className="cursor-pointer transition-all hover:bg-[#1A1A1A]"
                        style={{ borderBottom: i < activeMerchants.length - 1 ? "1px solid #1A1A1A" : "none" }}
                      >
                        <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: "#FFFFFF" }}>{m.name}</td>
                        <td className="px-4 py-3 text-[12px]" style={{ color: "#A0A0A0" }}>{m.category}</td>
                        <td className="px-4 py-3 text-[12px]" style={{ color: "#A0A0A0" }}>{m.location}</td>
                        <td className="px-4 py-3 text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{m.totalTx.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{m.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-[12px] font-medium" style={{ color: "#F9E741" }}>{m.commission.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleMerchantActive(m.id); }}
                            className="relative w-[40px] h-[22px] rounded-full transition-all duration-300"
                            style={{ background: m.isActive ? "#22C55E" : "#333333" }}
                          >
                            <div className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-300" style={{ left: m.isActive ? "20px" : "2px" }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── CONFIRM MODAL (Activate / Reject) ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative rounded-[16px] p-6 w-full max-w-[380px] border-2"
            style={{
              background: "#111111",
              borderColor: confirmAction.type === "activate" ? "#22C55E" : "#EF4444",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              {confirmAction.type === "activate" ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="10" r="8" /><path d="M7 10l2 2 4-4" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2L1 18h18L10 2z" /><line x1="10" y1="8" x2="10" y2="12" /><circle cx="10" cy="15" r="0.5" fill="#EF4444" />
                </svg>
              )}
              <h3 className="text-[16px] font-bold" style={{ color: confirmAction.type === "activate" ? "#22C55E" : "#EF4444" }}>
                {confirmAction.type === "activate" ? "მერჩანტის აქტივაცია" : "მერჩანტის უარყოფა"}
              </h3>
            </div>
            <p className="text-[13px] mb-1 font-semibold" style={{ color: "#FFFFFF" }}>
              {confirmAction.merchant.name}
            </p>
            <p className="text-[12px] mb-4 leading-relaxed" style={{ color: "#A0A0A0" }}>
              {confirmAction.type === "activate"
                ? "დარწმუნებული ხარ რომ გინდა ამ მერჩანტის აქტივაცია? ის დაუყოვნებლივ შეძლებს ტრანზაქციების მიღებას."
                : "დარწმუნებული ხარ რომ გინდა ამ მერჩანტის განაცხადის უარყოფა? ეს მოქმედება ვერ გაუქმდება."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  confirmAction.type === "activate"
                    ? handleActivate(confirmAction.merchant)
                    : handleReject(confirmAction.merchant)
                }
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-[0.97]"
                style={{
                  background: confirmAction.type === "activate" ? "#22C55E" : "#EF4444",
                  color: "#FFFFFF",
                }}
              >
                {confirmAction.type === "activate" ? "აქტივაცია" : "უარყოფა"}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-[0.97]"
                style={{ background: "#1A1A1A", color: "#A0A0A0" }}
              >
                გაუქმება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MERCHANT DETAIL PANEL ── */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:justify-end" onClick={() => setSelectedMerchant(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full lg:w-[420px] max-h-[90dvh] lg:max-h-full lg:h-full overflow-y-auto rounded-t-[20px] lg:rounded-none border-t lg:border-t-0 lg:border-l"
            style={{ background: "#111111", borderColor: "#252525" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b" style={{ background: "#111111", borderColor: "#252525" }}>
              <h3 className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>Merchant Details</h3>
              <button onClick={() => setSelectedMerchant(null)} className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:bg-[#1A1A1A]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Business Info */}
              <div className="rounded-[12px] p-4 border" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[18px] font-bold" style={{ color: "#FFFFFF" }}>{selectedMerchant.name}</h4>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: selectedMerchant.isActive ? "#22C55E20" : "#EF444420",
                      color: selectedMerchant.isActive ? "#22C55E" : "#EF4444",
                    }}
                  >
                    {selectedMerchant.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="1" width="10" height="12" rx="1" /><path d="M5 4h4M5 7h4M5 10h2" /></svg>, label: "LLC Code", value: selectedMerchant.llcCode },
                    { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1-3.5h8L12 6" /><path d="M2 6v6h10V6" /></svg>, label: "Category", value: selectedMerchant.category },
                    { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1C4.5 1 2.5 3 2.5 5.5C2.5 9.5 7 13 7 13s4.5-3.5 4.5-7.5C11.5 3 9.5 1 7 1z" /><circle cx="7" cy="5.5" r="1.5" /></svg>, label: "Location", value: selectedMerchant.location },
                    { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="4" r="2.5" /><path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" /></svg>, label: "Contact", value: selectedMerchant.contact },
                    { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 2.5h3l1.5 3-2 1.5a9 9 0 004.5 4.5l1.5-2 3 1.5v3a1 1 0 01-1 1C5.5 14 0 8.5 0 3.5a1 1 0 011-1h.5z" /></svg>, label: "Phone", value: selectedMerchant.phone },
                    { icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2.5" width="11" height="9" rx="1" /><path d="M1.5 5h11" /><path d="M4.5 2.5v-1M9.5 2.5v-1" /></svg>, label: "Joined", value: selectedMerchant.joinedAt },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      {row.icon}
                      <span className="text-[11px]" style={{ color: "#666666" }}>{row.label}:</span>
                      <span className="text-[12px] font-medium" style={{ color: "#A0A0A0" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[12px] p-3 border" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Total Transactions</p>
                  <p className="text-[20px] font-extrabold" style={{ color: "#FFFFFF" }}>{selectedMerchant.totalTx.toLocaleString()}</p>
                </div>
                <div className="rounded-[12px] p-3 border" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Total Amount</p>
                  <p className="text-[20px] font-extrabold" style={{ color: "#FFFFFF" }}>{selectedMerchant.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px]" style={{ color: "#666666" }}>GEL</p>
                </div>
                <div className="rounded-[12px] p-3 border col-span-2" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Commission Earned</p>
                  <p className="text-[24px] font-extrabold" style={{ color: "#F9E741" }}>{selectedMerchant.commission.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px]" style={{ color: "#666666" }}>GEL ({selectedMerchant.commissionPercent}%)</p>
                </div>
              </div>

              {/* Commission Editor */}
              <div className="rounded-[12px] p-4 border transition-all" style={{ background: "#1A1A1A", borderColor: isEditingCommission ? "#F9E741" : "#252525" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-semibold" style={{ color: "#A0A0A0" }}>Commission %</p>
                  {!isEditingCommission && (
                    <button
                      onClick={() => { setIsEditingCommission(true); setEditCommission(selectedMerchant.commissionPercent); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#252525]"
                      style={{ background: "#252525" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 1.5l2.5 2.5M1.5 12.5l.5-2L9.5 3l2.5 2.5L4.5 13l-3 .5z" />
                      </svg>
                    </button>
                  )}
                </div>
                {isEditingCommission ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => setEditCommission(Math.max(0.5, editCommission - 0.5))} className="w-8 h-8 rounded-md flex items-center justify-center text-[18px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>-</button>
                      <input
                        type="number"
                        value={editCommission}
                        onChange={(e) => setEditCommission(parseFloat(e.target.value) || 0)}
                        className="flex-1 text-center text-[22px] font-extrabold rounded-md py-1 outline-none"
                        style={{ background: "#252525", color: "#F9E741", border: "1px solid #F9E741" }}
                        min={0.5} max={10} step={0.5}
                      />
                      <button onClick={() => setEditCommission(Math.min(10, editCommission + 0.5))} className="w-8 h-8 rounded-md flex items-center justify-center text-[18px] font-bold" style={{ background: "#252525", color: "#A0A0A0" }}>+</button>
                    </div>
                    <p className="text-[10px] mb-2" style={{ color: "#666666" }}>Range: 0.5% — 10%</p>
                    <div className="flex gap-2">
                      <button onClick={handleSaveCommission} className="flex-1 py-2 rounded-[8px] text-[12px] font-bold transition-all active:scale-[0.97]" style={{ background: "#F9E741", color: "#000" }}>Save</button>
                      <button onClick={() => setIsEditingCommission(false)} className="flex-1 py-2 rounded-[8px] text-[12px] font-bold transition-all active:scale-[0.97]" style={{ background: "#252525", color: "#A0A0A0" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[28px] font-extrabold" style={{ color: "#F9E741" }}>{selectedMerchant.commissionPercent}%</p>
                )}
              </div>

              {/* Deactivate Button */}
              {selectedMerchant.isActive && (
                <button
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-bold border transition-all hover:bg-[#EF444410] active:scale-[0.98]"
                  style={{ background: "transparent", borderColor: "#EF4444", color: "#EF4444" }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="6.5" /><line x1="5" y1="8" x2="11" y2="8" />
                  </svg>
                  მერჩანტის დეაქტივაცია
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DEACTIVATE CONFIRM MODAL ── */}
      {showDeactivateConfirm && selectedMerchant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowDeactivateConfirm(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-full max-w-[380px] border-2" style={{ background: "#111111", borderColor: "#EF4444" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2L1 18h18L10 2z" /><line x1="10" y1="8" x2="10" y2="12" /><circle cx="10" cy="15" r="0.5" fill="#EF4444" />
              </svg>
              <h3 className="text-[16px] font-bold" style={{ color: "#EF4444" }}>მერჩანტის დეაქტივაცია</h3>
            </div>
            <p className="text-[13px] mb-1 font-semibold" style={{ color: "#FFFFFF" }}>{selectedMerchant.name}</p>
            <p className="text-[12px] mb-4 leading-relaxed" style={{ color: "#A0A0A0" }}>
              დარწმუნებული ხარ? მერჩანტი ვერ შეძლებს ტრანზაქციების მიღებას დეაქტივაციის შემდეგ.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeactivateMerchant}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-[0.97]"
                style={{ background: "#EF4444", color: "#FFFFFF" }}
              >
                დეაქტივაცია
              </button>
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-[0.97]"
                style={{ background: "#1A1A1A", color: "#A0A0A0" }}
              >
                გაუქმება
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
