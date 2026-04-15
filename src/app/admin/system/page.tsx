"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/services/adminApi";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

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
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── SECTION ICONS ── */
function AdminsIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a3 3 0 110 6 3 3 0 010-6z" /><path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" /><path d="M14.5 3.5a2 2 0 110 4" /><path d="M17 11c1.3.6 2.3 1.8 2.5 3.3" /></svg>;
}
function LogIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M7 7h6M7 10h6M7 13h4" /></svg>;
}
function ExportIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v10M10 3l-3 3M10 3l3 3" /><path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" /></svg>;
}
function SettingsIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="3" /><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4.1 4.1l1.4 1.4M14.5 14.5l1.4 1.4M4.1 15.9l1.4-1.4M14.5 5.5l1.4-1.4" /></svg>;
}
function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5l2.5 2.5L5 11.5H2.5V9L10 1.5z" /></svg>;
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 4h9M5 4V2.5h4V4M3.5 4v8a1 1 0 001 1h5a1 1 0 001-1V4" /></svg>;
}
function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>;
}
function ChevronLeft() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4l-4 4 4 4" /></svg>;
}
function ChevronRight() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l4 4-4 4" /></svg>;
}
function DownloadIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8M8 10l-3-3M8 10l3-3" /><path d="M2 12v1.5h12V12" /></svg>;
}
function FilterIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 2h12L8.5 7.5V12L5.5 11V7.5L1 2z" /></svg>;
}
function WarningIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L1.5 17h17L10 2z" /><path d="M10 8v4M10 14v.5" /></svg>;
}

/* ── TYPES ── */
interface Admin {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
}

interface LogEntry {
  id: number;
  date: string;
  time: string;
  adminName: string;
  action: string;
  actionType: string;
}

const ACTION_TYPES = ["ყველა", "ავტორიზაცია", "მომხმარებლები", "მერჩანტები", "ალგორითმი", "სისტემა", "ექსპორტი"];

// Real admin logs are now fetched from /admin/logs
const MOCK_LOGS: LogEntry[] = [];

const ADMIN_NAMES_FILTER = ["ყველა"];

/* ── PAGE ── */
function SystemContent() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"admins" | "logs" | "export" | "settings">("admins");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Admin Accounts state
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", role: "admin" as "super_admin" | "admin", password: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Load admins from API
  useEffect(() => {
    adminFetch("/admin/admins")
      .then((data: any) => {
        if (data.success && data.admins) {
          setAdmins(data.admins);
        }
      })
      .catch(() => {});
    // Check if current user is super_admin
    try {
      const stored = localStorage.getItem("adminToken");
      if (stored) {
        const payload = JSON.parse(atob(stored.split(".")[1]));
        setIsSuperAdmin(payload.role === "super_admin");
      }
    } catch {}
  }, []);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(""), 3000); };

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) return;
    try {
      const data = await adminFetch("/admin/admins/create", {
        method: "POST",
        body: JSON.stringify({ name: newAdmin.name, email: newAdmin.email, password: newAdmin.password, role: newAdmin.role }),
      }) as any;
      if (data.success) {
        setAdmins((prev) => [...prev, { ...data.admin, isActive: true, createdAt: new Date().toISOString() }]);
        setShowAddModal(false);
        setNewAdmin({ name: "", email: "", role: "admin", password: "" });
        showSuccess("Admin created successfully");
      }
    } catch (err: any) {
      showError(err.message || "Failed to create admin");
    }
  };

  const handleDeactivateAdmin = async (id: string) => {
    try {
      await adminFetch(`/admin/admins/${id}`, { method: "DELETE" });
      setAdmins((prev) => prev.map((a) => a.id === id ? { ...a, isActive: false } : a));
      setDeleteConfirmId(null);
      showSuccess("Admin deactivated");
    } catch (err: any) {
      showError(err.message || "Failed to deactivate");
    }
  };

  // Activity Log state
  const [logPage, setLogPage] = useState(1);
  const [logFilterAdmin, setLogFilterAdmin] = useState("ყველა");
  const [logFilterType, setLogFilterType] = useState("ყველა");
  const [logFilterDate, setLogFilterDate] = useState("");
  const LOGS_PER_PAGE = 8;
  const [realLogs, setRealLogs] = useState<LogEntry[]>([]);
  useEffect(() => {
    adminFetch("/admin/logs?limit=200").then((data: any) => {
      if (data.success && data.logs) {
        setRealLogs(data.logs.map((l: any, i: number) => {
          const d = new Date(l.createdAt);
          return {
            id: i + 1,
            date: d.toISOString().slice(0, 10),
            time: d.toTimeString().slice(0, 5),
            adminName: l.adminName || "—",
            action: l.action + (l.details ? ` — ${l.details}` : ""),
            actionType: l.action.split("_")[0] || "სისტემა",
          };
        }));
      }
    }).catch(() => {});
  }, []);

  // Data Export state
  const [exportDateFrom, setExportDateFrom] = useState("2026-03-01");
  const [exportDateTo, setExportDateTo] = useState("2026-03-29");
  const [exportingType, setExportingType] = useState<string | null>(null);

  // App Settings state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [showForceUpdateConfirm, setShowForceUpdateConfirm] = useState(false);

  // Filtered logs (real)
  const filteredLogs = realLogs.filter((log) => {
    if (logFilterAdmin !== "ყველა" && log.adminName !== logFilterAdmin) return false;
    if (logFilterType !== "ყველა" && log.actionType !== logFilterType) return false;
    if (logFilterDate && log.date !== logFilterDate) return false;
    return true;
  });
  const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE));
  const pagedLogs = filteredLogs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE);

  // Handlers
  // handleCreateAdmin replaced by handleCreateAdmin above

  function handleEditAdmin() {
    if (!editingAdmin) return;
    setAdmins(admins.map((a) => (a.id === editingAdmin.id ? editingAdmin : a)));
    setEditingAdmin(null);
  }


  function handleExport(type: string) {
    setExportingType(type);
    setTimeout(() => setExportingType(null), 1500);
  }

  const sectionTabs: { key: typeof activeSection; label: string; icon: () => JSX.Element }[] = [
    { key: "admins", label: "ადმინები", icon: AdminsIcon },
    { key: "logs", label: "აქტივობის ლოგი", icon: LogIcon },
    { key: "export", label: "მონაცემების ექსპორტი", icon: ExportIcon },
    { key: "settings", label: "აპის პარამეტრები", icon: SettingsIcon },
  ];

  const defaultColor = { bg: "#A0A0A020", text: "#A0A0A0" };
  const roleColors: Record<string, { bg: string; text: string }> = {
    super: { bg: "#F9E74120", text: "#F9E741" },
    super_admin: { bg: "#F9E74120", text: "#F9E741" },
    admin: { bg: "#3B82F620", text: "#3B82F6" },
    viewer: { bg: "#A0A0A020", text: "#A0A0A0" },
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
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-200 hover:bg-[#1A1A1A]"
              style={{
                background: item.id === "system" ? "#1A1A1A" : "transparent",
                borderLeft: item.id === "system" ? "3px solid #F9E741" : "3px solid transparent",
              }}
            >
              <NavIcon id={item.id} active={item.id === "system"} />
              <span className="text-[13px] font-medium" style={{ color: item.id === "system" ? "#FFFFFF" : "#A0A0A0" }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[250px] border-r flex flex-col"
            style={{ background: "#111111", borderColor: "#252525" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b" style={{ borderColor: "#252525" }}>
              <h1 className="text-[20px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>SHANSI</h1>
              <p className="text-[11px] mt-0.5" style={{ color: "#666666" }}>Admin Panel</p>
            </div>
            <nav className="flex-1 py-3">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSidebarOpen(false); router.push(item.href); }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-200 hover:bg-[#1A1A1A]"
                  style={{
                    background: item.id === "system" ? "#1A1A1A" : "transparent",
                    borderLeft: item.id === "system" ? "3px solid #F9E741" : "3px solid transparent",
                  }}
                >
                  <NavIcon id={item.id} active={item.id === "system"} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === "system" ? "#FFFFFF" : "#A0A0A0" }}>
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
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 py-3 border-b" style={{ background: "#000000", borderColor: "#252525" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-[#252525]" style={{ background: "#1A1A1A" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="5" x2="15" y2="5" /><line x1="3" y1="9" x2="15" y2="9" /><line x1="3" y1="13" x2="15" y2="13" /></svg>
            </button>
            <div>
              <h2 className="text-[18px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>System</h2>
              <p className="text-[11px]" style={{ color: "#666666" }}>სისტემის მართვა</p>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {/* ── SECTION TABS ── */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {sectionTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-medium whitespace-nowrap transition-all duration-200 border shrink-0"
                  style={{
                    background: isActive ? "#1A1A1A" : "transparent",
                    borderColor: isActive ? "#F9E741" : "#252525",
                    color: isActive ? "#FFFFFF" : "#A0A0A0",
                  }}
                >
                  <Icon />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ════════════════════════════════════════ */}
          {/* SECTION 1: ADMIN ACCOUNTS               */}
          {/* ════════════════════════════════════════ */}
          {activeSection === "admins" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold" style={{ color: "#FFFFFF" }}>ადმინ ანგარიშები</h3>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-[12px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #F9E741, #E5D336)", color: "#000000" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>
                  ახალი ადმინის დამატება
                </button>
              </div>

              <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #252525" }}>
                        {["სახელი", "ელ-ფოსტა", "როლი", "ბოლო შესვლა", "სტატუსი", "მოქმედებები"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin, i) => (
                        <tr key={admin.id} className="transition-all duration-200 hover:bg-[#1A1A1A]" style={{ borderBottom: i < admins.length - 1 ? "1px solid #1A1A1A" : "none" }}>
                          <td className="px-4 py-3 text-[13px] font-medium" style={{ color: "#FFFFFF" }}>{admin.name}</td>
                          <td className="px-4 py-3 text-[12px]" style={{ color: "#A0A0A0" }}>{admin.email}</td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: (roleColors[admin.role] || defaultColor).bg, color: (roleColors[admin.role] || defaultColor).text }}>
                              {admin.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[12px]" style={{ color: "#666666" }}>{admin.createdAt?.split("T")[0] || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: admin.isActive ? "#22C55E" : "#666666" }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: admin.isActive ? "#22C55E" : "#666666" }} />
                              {admin.isActive ? "აქტიური" : "არააქტიური"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingAdmin({ ...admin })}
                                className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-[#252525]"
                                style={{ color: "#A0A0A0" }}
                                title="რედაქტირება"
                              >
                                <EditIcon />
                              </button>
                              {true && (
                                <button
                                  onClick={() => setDeleteConfirmId(admin.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-[#EF444420]"
                                  style={{ color: "#EF4444" }}
                                  title="წაშლა"
                                >
                                  <TrashIcon />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* SECTION 2: ACTIVITY LOG                  */}
          {/* ════════════════════════════════════════ */}
          {activeSection === "logs" && (
            <div>
              <h3 className="text-[15px] font-bold mb-4" style={{ color: "#FFFFFF" }}>აქტივობის ლოგი</h3>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium" style={{ color: "#666666" }}><FilterIcon /></span>
                  <select
                    value={logFilterAdmin}
                    onChange={(e) => { setLogFilterAdmin(e.target.value); setLogPage(1); }}
                    className="text-[12px] px-3 py-1.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                    style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                  >
                    {ADMIN_NAMES_FILTER.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <select
                  value={logFilterType}
                  onChange={(e) => { setLogFilterType(e.target.value); setLogPage(1); }}
                  className="text-[12px] px-3 py-1.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                >
                  {ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="date"
                  value={logFilterDate}
                  onChange={(e) => { setLogFilterDate(e.target.value); setLogPage(1); }}
                  className="text-[12px] px-3 py-1.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                />
                {(logFilterAdmin !== "ყველა" || logFilterType !== "ყველა" || logFilterDate) && (
                  <button
                    onClick={() => { setLogFilterAdmin("ყველა"); setLogFilterType("ყველა"); setLogFilterDate(""); setLogPage(1); }}
                    className="text-[11px] px-3 py-1.5 rounded-[8px] transition-all duration-200 hover:bg-[#252525]"
                    style={{ color: "#EF4444" }}
                  >
                    ფილტრის გასუფთავება
                  </button>
                )}
              </div>

              <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #252525" }}>
                        {["თარიღი", "დრო", "ადმინი", "მოქმედება", "ტიპი"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-[13px]" style={{ color: "#666666" }}>ჩანაწერები არ მოიძებნა</td>
                        </tr>
                      )}
                      {pagedLogs.map((log, i) => (
                        <tr key={log.id} className="transition-all duration-200 hover:bg-[#1A1A1A]" style={{ borderBottom: i < pagedLogs.length - 1 ? "1px solid #1A1A1A" : "none" }}>
                          <td className="px-4 py-2.5 text-[12px]" style={{ color: "#666666" }}>{log.date}</td>
                          <td className="px-4 py-2.5 text-[12px]" style={{ color: "#A0A0A0" }}>{log.time}</td>
                          <td className="px-4 py-2.5 text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{log.adminName}</td>
                          <td className="px-4 py-2.5 text-[12px]" style={{ color: "#A0A0A0" }}>{log.action}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#1A1A1A", color: "#A0A0A0", border: "1px solid #252525" }}>
                              {log.actionType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#252525" }}>
                  <p className="text-[11px]" style={{ color: "#666666" }}>
                    {filteredLogs.length} ჩანაწერიდან {Math.min((logPage - 1) * LOGS_PER_PAGE + 1, filteredLogs.length)}-{Math.min(logPage * LOGS_PER_PAGE, filteredLogs.length)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLogPage(Math.max(1, logPage - 1))}
                      disabled={logPage === 1}
                      className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-[#252525] disabled:opacity-30"
                      style={{ color: "#A0A0A0" }}
                    >
                      <ChevronLeft />
                    </button>
                    {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setLogPage(p)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-[12px] font-medium transition-all duration-200"
                        style={{
                          background: p === logPage ? "#F9E741" : "transparent",
                          color: p === logPage ? "#000000" : "#A0A0A0",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setLogPage(Math.min(totalLogPages, logPage + 1))}
                      disabled={logPage === totalLogPages}
                      className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-[#252525] disabled:opacity-30"
                      style={{ color: "#A0A0A0" }}
                    >
                      <ChevronRight />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* SECTION 3: DATA EXPORT                   */}
          {/* ════════════════════════════════════════ */}
          {activeSection === "export" && (
            <div>
              <h3 className="text-[15px] font-bold mb-4" style={{ color: "#FFFFFF" }}>მონაცემების ექსპორტი</h3>

              {/* Date Range */}
              <div className="rounded-[12px] border p-4 mb-4" style={{ background: "#111111", borderColor: "#252525" }}>
                <p className="text-[12px] font-medium mb-3" style={{ color: "#A0A0A0" }}>თარიღის დიაპაზონი</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: "#666666" }}>დან:</span>
                    <input
                      type="date"
                      value={exportDateFrom}
                      onChange={(e) => setExportDateFrom(e.target.value)}
                      className="text-[12px] px-3 py-2 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                      style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: "#666666" }}>მდე:</span>
                    <input
                      type="date"
                      value={exportDateTo}
                      onChange={(e) => setExportDateTo(e.target.value)}
                      className="text-[12px] px-3 py-2 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                      style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                    />
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { type: "users", label: "მომხმარებლების ექსპორტი", desc: "CSV ფორმატით, სახელი, ელ-ფოსტა, ტელეფონი, რეგისტრაცია, ბალანსი", count: "12,847" },
                  { type: "transactions", label: "ტრანზაქციების ექსპორტი", desc: "CSV ფორმატით, მომხმარებელი, მერჩანტი, თანხა, მოგება, თარიღი", count: "284,591" },
                  { type: "merchants", label: "მერჩანტების ექსპორტი", desc: "CSV ფორმატით, სახელი, კატეგორია, კომისია, ტრანზაქციები, შემოსავალი", count: "156" },
                ].map((item) => (
                  <div key={item.type} className="rounded-[12px] border p-5 flex flex-col transition-all duration-200 hover:border-[#F9E741]/30" style={{ background: "#111111", borderColor: "#252525" }}>
                    <p className="text-[14px] font-semibold mb-1" style={{ color: "#FFFFFF" }}>{item.label}</p>
                    <p className="text-[11px] mb-3 flex-1" style={{ color: "#666666" }}>{item.desc}</p>
                    <p className="text-[11px] mb-3" style={{ color: "#A0A0A0" }}>ჩანაწერები: <span style={{ color: "#F9E741" }}>{item.count}</span></p>
                    <button
                      onClick={() => handleExport(item.type)}
                      disabled={exportingType !== null}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #F9E741, #E5D336)", color: "#000000" }}
                    >
                      {exportingType === item.type ? (
                        <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 14 14" className="animate-spin">
                            <circle cx="7" cy="7" r="5" fill="none" stroke="#000" strokeWidth="2" strokeDasharray="20 10" />
                          </svg>
                          ექსპორტირდება...
                        </span>
                      ) : (
                        <>
                          <DownloadIcon />
                          CSV ჩამოტვირთვა
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* SECTION 4: APP SETTINGS                  */}
          {/* ════════════════════════════════════════ */}
          {activeSection === "settings" && (
            <div>
              <h3 className="text-[15px] font-bold mb-4" style={{ color: "#FFFFFF" }}>აპის პარამეტრები</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Version Display */}
                <div className="rounded-[12px] border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                  <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "#666666" }}>აპლიკაციის ვერსია</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[28px] font-extrabold" style={{ color: "#F9E741" }}>v2.4.0</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#22C55E20", color: "#22C55E" }}>stable</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px]" style={{ color: "#666666" }}>Build: <span style={{ color: "#A0A0A0" }}>2026.03.28.1847</span></p>
                    <p className="text-[11px]" style={{ color: "#666666" }}>API: <span style={{ color: "#A0A0A0" }}>v3.1</span></p>
                    <p className="text-[11px]" style={{ color: "#666666" }}>Environment: <span style={{ color: "#A0A0A0" }}>Production</span></p>
                  </div>
                </div>

                {/* Maintenance Mode */}
                <div className="rounded-[12px] border p-5" style={{ background: "#111111", borderColor: maintenanceMode ? "#EF4444" : "#252525" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>ტექნიკური რეჟიმი</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                      background: maintenanceMode ? "#EF444420" : "#22C55E20",
                      color: maintenanceMode ? "#EF4444" : "#22C55E",
                    }}>
                      {maintenanceMode ? "ჩართულია" : "გამორთულია"}
                    </span>
                  </div>
                  <p className="text-[12px] mb-4" style={{ color: "#A0A0A0" }}>
                    ჩართვისას მომხმარებლები ვერ შევლენ აპლიკაციაში. ნაჩვენები იქნება შეტყობინება: &ldquo;აპი დროებით მიუწვდომელია&rdquo;
                  </p>
                  <button
                    onClick={() => setShowMaintenanceConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-[12px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95 border"
                    style={{
                      background: maintenanceMode ? "#EF444415" : "#1A1A1A",
                      borderColor: maintenanceMode ? "#EF4444" : "#252525",
                      color: maintenanceMode ? "#EF4444" : "#A0A0A0",
                    }}
                  >
                    {maintenanceMode ? "გამორთვა" : "ჩართვა"}
                  </button>
                </div>

                {/* Force Update */}
                <div className="rounded-[12px] border p-5 lg:col-span-2" style={{ background: "#111111", borderColor: forceUpdate ? "#F9E741" : "#252525" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>იძულებითი განახლება</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                      background: forceUpdate ? "#F9E74120" : "#A0A0A020",
                      color: forceUpdate ? "#F9E741" : "#A0A0A0",
                    }}>
                      {forceUpdate ? "ჩართულია" : "გამორთულია"}
                    </span>
                  </div>
                  <p className="text-[12px] mb-4" style={{ color: "#A0A0A0" }}>
                    ჩართვისას ძველი ვერსიის მომხმარებლებს მოეთხოვებათ აპლიკაციის განახლება. მინიმალური ვერსია: <span style={{ color: "#F9E741" }}>v2.4.0</span>
                  </p>
                  <button
                    onClick={() => setShowForceUpdateConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-[12px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95 border"
                    style={{
                      background: forceUpdate ? "#F9E74115" : "#1A1A1A",
                      borderColor: forceUpdate ? "#F9E741" : "#252525",
                      color: forceUpdate ? "#F9E741" : "#A0A0A0",
                    }}
                  >
                    {forceUpdate ? "გამორთვა" : "ჩართვა"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ════════════════════════════════════════ */}
      {/* MODALS                                   */}
      {/* ════════════════════════════════════════ */}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md rounded-[16px] border p-6" style={{ background: "#111111", borderColor: "#252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>ახალი ადმინის დამატება</h3>
              <button onClick={() => setShowAddModal(false)} className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-[#252525]" style={{ color: "#666666" }}>
                <CloseIcon />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>სახელი</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full text-[13px] px-3 py-2.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                  placeholder="სახელი გვარი"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>ელ-ფოსტა</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full text-[13px] px-3 py-2.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                  placeholder="email@shansi.ge"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>როლი</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as Admin["role"] })}
                  className="w-full text-[13px] px-3 py-2.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>პაროლი</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full text-[13px] px-3 py-2.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                  placeholder="მინ. 8 სიმბოლო"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold border transition-all duration-200 hover:bg-[#1A1A1A]"
                style={{ borderColor: "#252525", color: "#A0A0A0" }}
              >
                გაუქმება
              </button>
              <button
                onClick={handleCreateAdmin}
                className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg, #F9E741, #E5D336)", color: "#000000" }}
              >
                დამატება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingAdmin(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md rounded-[16px] border p-6" style={{ background: "#111111", borderColor: "#252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>ადმინის რედაქტირება</h3>
              <button onClick={() => setEditingAdmin(null)} className="w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-[#252525]" style={{ color: "#666666" }}>
                <CloseIcon />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>სახელი</label>
                <input
                  type="text"
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                  className="w-full text-[13px] px-3 py-2.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>ელ-ფოსტა</label>
                <input
                  type="email"
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                  className="w-full text-[13px] px-3 py-2.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>როლი</label>
                <select
                  value={editingAdmin.role}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value as Admin["role"] })}
                  className="w-full text-[13px] px-3 py-2.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>სტატუსი</label>
                <select
                  value={editingAdmin.isActive ? "active" : "inactive"}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, isActive: e.target.value === "active" })}
                  className="w-full text-[13px] px-3 py-2.5 rounded-[8px] border outline-none transition-all duration-200 focus:border-[#F9E741]"
                  style={{ background: "#1A1A1A", borderColor: "#252525", color: "#FFFFFF" }}
                >
                  <option value="active">აქტიური</option>
                  <option value="inactive">არააქტიური</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingAdmin(null)}
                className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold border transition-all duration-200 hover:bg-[#1A1A1A]"
                style={{ borderColor: "#252525", color: "#A0A0A0" }}
              >
                გაუქმება
              </button>
              <button
                onClick={handleEditAdmin}
                className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg, #F9E741, #E5D336)", color: "#000000" }}
              >
                შენახვა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-[16px] border p-6" style={{ background: "#111111", borderColor: "#252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "#EF444420" }}>
                <WarningIcon />
              </div>
              <h3 className="text-[16px] font-bold mb-2" style={{ color: "#FFFFFF" }}>ადმინის წაშლა</h3>
              <p className="text-[13px] mb-1" style={{ color: "#A0A0A0" }}>
                ნამდვილად გსურთ ადმინის წაშლა?
              </p>
              <p className="text-[12px] font-semibold mb-5" style={{ color: "#EF4444" }}>
                {admins.find((a) => a.id === deleteConfirmId)?.name}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold border transition-all duration-200 hover:bg-[#1A1A1A]"
                  style={{ borderColor: "#252525", color: "#A0A0A0" }}
                >
                  გაუქმება
                </button>
                <button
                  onClick={() => handleDeactivateAdmin(deleteConfirmId!)}
                  className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
                  style={{ background: "#EF4444", color: "#FFFFFF" }}
                >
                  წაშლა
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Mode Confirm Modal */}
      {showMaintenanceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowMaintenanceConfirm(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-[16px] border p-6" style={{ background: "#111111", borderColor: "#252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: maintenanceMode ? "#22C55E20" : "#EF444420" }}>
                <WarningIcon />
              </div>
              <h3 className="text-[16px] font-bold mb-2" style={{ color: "#FFFFFF" }}>
                {maintenanceMode ? "ტექნიკური რეჟიმის გამორთვა" : "ტექნიკური რეჟიმის ჩართვა"}
              </h3>
              <p className="text-[13px] mb-5" style={{ color: "#A0A0A0" }}>
                {maintenanceMode
                  ? "აპლიკაცია კვლავ ხელმისაწვდომი გახდება მომხმარებლებისთვის."
                  : "მომხმარებლებს ნაჩვენებს იქნება: \"აპი დროებით მიუწვდომელია\""
                }
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowMaintenanceConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold border transition-all duration-200 hover:bg-[#1A1A1A]"
                  style={{ borderColor: "#252525", color: "#A0A0A0" }}
                >
                  გაუქმება
                </button>
                <button
                  onClick={() => { setMaintenanceMode(!maintenanceMode); setShowMaintenanceConfirm(false); }}
                  className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
                  style={{
                    background: maintenanceMode ? "#22C55E" : "#EF4444",
                    color: "#FFFFFF",
                  }}
                >
                  {maintenanceMode ? "გამორთვა" : "ჩართვა"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Force Update Confirm Modal */}
      {showForceUpdateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForceUpdateConfirm(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-[16px] border p-6" style={{ background: "#111111", borderColor: "#252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "#F9E74120" }}>
                <SettingsIcon />
              </div>
              <h3 className="text-[16px] font-bold mb-2" style={{ color: "#FFFFFF" }}>
                {forceUpdate ? "იძულებითი განახლების გამორთვა" : "იძულებითი განახლების ჩართვა"}
              </h3>
              <p className="text-[13px] mb-5" style={{ color: "#A0A0A0" }}>
                {forceUpdate
                  ? "მომხმარებლებს აღარ მოეთხოვებათ აპლიკაციის განახლება."
                  : "ძველი ვერსიის მომხმარებლებს მოეთხოვებათ განახლება v2.4.0-მდე."
                }
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowForceUpdateConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold border transition-all duration-200 hover:bg-[#1A1A1A]"
                  style={{ borderColor: "#252525", color: "#A0A0A0" }}
                >
                  გაუქმება
                </button>
                <button
                  onClick={() => { setForceUpdate(!forceUpdate); setShowForceUpdateConfirm(false); }}
                  className="flex-1 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #F9E741, #E5D336)", color: "#000000" }}
                >
                  {forceUpdate ? "გამორთვა" : "ჩართვა"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-[8px] text-[13px] font-medium" style={{ background: "#22C55E20", color: "#22C55E", border: "1px solid #22C55E40" }}>{successMsg}</div>
      )}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-[8px] text-[13px] font-medium" style={{ background: "#EF444420", color: "#EF4444", border: "1px solid #EF444440" }}>{errorMsg}</div>
      )}
    </div>
  );
}

export default function SystemPage() {
  return (
    <AdminAuthGuard>
      <SystemContent />
    </AdminAuthGuard>
  );
}
