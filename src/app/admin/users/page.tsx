"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUsers, getUser, adjustBalance, updateUserStatus, resetUserVillage, deleteUser } from "@/services/admin";

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
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin/system" },
];

const PAGE_SIZE = 20;

/* ── INLINE SVG ICONS ── */
function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="14" y2="14" /></svg>;
}
function ChevronDown() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round"><polyline points="3,5 7,9 11,5" /></svg>;
}
function ChevronUp() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round"><polyline points="3,9 7,5 11,9" /></svg>;
}
function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" /></svg>;
}
function UserIcon() {
  return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="12" r="5" /><path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10" /></svg>;
}
function ShieldIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1L2 3.5v3.5c0 3.5 2.1 6.2 5 7 2.9-.8 5-3.5 5-7V3.5L7 1z" /></svg>;
}
function WarningIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L1 18h18L10 2z" /><line x1="10" y1="8" x2="10" y2="12" /><circle cx="10" cy="15" r="0.5" fill="#EF4444" /></svg>;
}
function CoinIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="5.5" /><text x="7" y="10" textAnchor="middle" fontSize="7" fill="#F9E741" stroke="none" fontWeight="bold">C</text></svg>;
}
function CashIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="12" height="8" rx="1.5" /><circle cx="7" cy="7" r="2" /></svg>;
}

/* ── TYPES ── */
interface UserListItem {
  id: string;
  phone: string;
  name: string | null;
  coin_balance: number;
  cash_balance: number;
  is_active: boolean;
  created_at: string;
  total_games_played: number;
  total_cash_won: number;
  total_coins_spent: number;
  last_active: string | null;
}

interface GameHistoryItem {
  id: string;
  gameType: string;
  betAmount: number;
  winAmount: number;
  createdAt: string;
}

interface UserDetailData {
  user: UserListItem;
  gameHistory: GameHistoryItem[];
  activeTransaction: {
    coins_remaining: number;
    total_cash_won: number;
    guaranteed_minimum: number;
  } | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Data
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<UserDetailData | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);

  // Balance modal
  const [balanceModal, setBalanceModal] = useState<{
    userId: string;
    userName: string;
    type: "coin" | "cash";
    currentBalance: number;
  } | null>(null);
  const [balanceAction, setBalanceAction] = useState<"add" | "subtract">("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");

  // Block modal
  const [blockModal, setBlockModal] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [savedAction, setSavedAction] = useState<string | null>(null);

  // Clock
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers(currentPage, debouncedSearch || undefined, statusFilter !== "all" ? statusFilter : undefined);
      setUsersList(data.users || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter]);

  // Expand user detail
  const handleExpand = async (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(userId);
    setExpandedLoading(true);
    try {
      const data = await getUser(userId);
      setExpandedData(data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setExpandedLoading(false);
    }
  };

  // Balance adjustment
  const handleAdjustBalance = async () => {
    if (!balanceModal || !balanceAmount || !balanceReason.trim()) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) return;
    setActionLoading(true);
    try {
      await adjustBalance(balanceModal.userId, balanceModal.type, balanceAction, amount, balanceReason.trim());
      setBalanceModal(null);
      setBalanceAmount("");
      setBalanceReason("");
      setBalanceAction("add");
      showToast(balanceModal.type === "coin" ? "ქოინი განახლდა" : "ქეში განახლდა");
      fetchUsers();
      if (expandedId === balanceModal.userId) {
        const data = await getUser(balanceModal.userId);
        setExpandedData(data);
      }
    } catch (err: any) {
      showToast(err.message || "შეცდომა");
    } finally {
      setActionLoading(false);
    }
  };

  // Block/unblock
  const handleToggleBlock = async (userId: string) => {
    const user = usersList.find((u) => u.id === userId);
    if (!user) return;
    setActionLoading(true);
    try {
      await updateUserStatus(userId, !user.is_active);
      setBlockModal(null);
      showToast(user.is_active ? "მომხმარებელი დაბლოკილია" : "მომხმარებელი განბლოკილია");
      fetchUsers();
      if (expandedId === userId) {
        const data = await getUser(userId);
        setExpandedData(data);
      }
    } catch (err: any) {
      showToast(err.message || "შეცდომა");
    } finally {
      setActionLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSavedAction(msg);
    setTimeout(() => setSavedAction(null), 2500);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Preview balance for modal
  const previewBalance = balanceModal ? (() => {
    const amt = parseFloat(balanceAmount) || 0;
    return balanceAction === "add"
      ? balanceModal.currentBalance + amt
      : Math.max(0, balanceModal.currentBalance - amt);
  })() : 0;

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
              style={{ background: item.id === "users" ? "#1A1A1A" : "transparent", borderLeft: item.id === "users" ? "3px solid #F9E741" : "3px solid transparent" }}>
              <NavIcon id={item.id} active={item.id === "users"} />
              <span className="text-[13px] font-medium" style={{ color: item.id === "users" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
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
                  style={{ background: item.id === "users" ? "#1A1A1A" : "transparent", borderLeft: item.id === "users" ? "3px solid #F9E741" : "3px solid transparent" }}>
                  <NavIcon id={item.id} active={item.id === "users"} />
                  <span className="text-[13px] font-medium" style={{ color: item.id === "users" ? "#FFFFFF" : "#A0A0A0" }}>{item.label}</span>
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
            <h2 className="text-[16px] lg:text-[18px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>USER MANAGEMENT</h2>
          </div>
          <div className="flex items-center gap-3">
            {savedAction && (
              <span className="text-[11px] font-medium px-2 py-1 rounded-md" style={{ background: "#22C55E20", color: "#22C55E" }}>{savedAction}</span>
            )}
            <div className="text-right">
              <p className="text-[13px] font-medium" style={{ color: "#FFFFFF" }}>
                {now.toLocaleDateString("ka-GE", { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <p className="text-[11px]" style={{ color: "#666666" }}>
                {now.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {/* ── SEARCH & FILTERS ── */}
          <div className="rounded-[12px] p-4 border mb-4" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 flex items-center gap-2 rounded-[8px] px-3 py-2" style={{ background: "#1A1A1A", border: "1px solid #252525" }}>
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[13px]"
                  style={{ color: "#FFFFFF" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="transition-all hover:opacity-70"><CloseIcon /></button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex gap-1 rounded-[8px] p-1" style={{ background: "#1A1A1A" }}>
                {(["all", "active", "blocked"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all"
                    style={{
                      background: statusFilter === s ? (s === "blocked" ? "#EF4444" : s === "active" ? "#22C55E" : "#F9E741") : "transparent",
                      color: statusFilter === s ? (s === "blocked" || s === "active" ? "#FFFFFF" : "#000000") : "#A0A0A0",
                    }}
                  >
                    {s === "all" ? "All" : s === "active" ? "Active" : "Blocked"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px]" style={{ color: "#666666" }}>
                {totalCount} user{totalCount !== 1 ? "s" : ""} found
              </p>
              <p className="text-[11px]" style={{ color: "#666666" }}>
                Page {currentPage} of {totalPages || 1}
              </p>
            </div>
          </div>

          {/* ── USERS TABLE ── */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
                <span className="ml-3 text-[13px]" style={{ color: "#666666" }}>Loading...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #252525" }}>
                      {["\u10E1\u10D0\u10EE\u10D4\u10DA\u10D8", "\u10E2\u10D4\u10DA\u10D4\u10E4\u10DD\u10DC\u10D8", "\u10E5\u10DD\u10D8\u10DC\u10D8", "\u10E5\u10D4\u10E8\u10D8", "\u10D7\u10D0\u10DB\u10D0\u10E8\u10D4\u10D1\u10D8", "\u10DB\u10DD\u10D2\u10D4\u10D1\u10D0", "\u10E1\u10E2\u10D0\u10E2\u10E3\u10E1\u10D8", "\u10D1\u10DD\u10DA\u10DD \u10D0\u10E5\u10E2."].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => {
                      const isExpanded = expandedId === user.id;
                      const displayName = user.name || user.phone;
                      const status = user.is_active ? "active" : "blocked";
                      return (
                        <tr key={user.id} style={{ cursor: "pointer" }} onClick={() => handleExpand(user.id)}>
                          <td colSpan={8} className="p-0">
                            {/* Row */}
                            <div className="flex items-center transition-all hover:bg-[#1A1A1A]" style={{ borderBottom: "1px solid #1A1A1A" }}>
                              <div className="flex-1 grid grid-cols-8 min-w-[900px]">
                                <div className="px-4 py-3 flex items-center gap-2">
                                  <span className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{displayName}</span>
                                </div>
                                <div className="px-4 py-3">
                                  <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{user.phone}</span>
                                </div>
                                <div className="px-4 py-3">
                                  <span className="text-[12px] font-bold" style={{ color: "#F9E741" }}>{user.coin_balance}</span>
                                </div>
                                <div className="px-4 py-3">
                                  <span className="text-[12px] font-medium" style={{ color: "#22C55E" }}>{user.cash_balance.toFixed(2)} &#8382;</span>
                                </div>
                                <div className="px-4 py-3">
                                  <span className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{user.total_games_played}</span>
                                </div>
                                <div className="px-4 py-3">
                                  <span className="text-[12px] font-medium" style={{ color: "#22C55E" }}>{user.total_cash_won.toFixed(2)} &#8382;</span>
                                </div>
                                <div className="px-4 py-3">
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                                    style={{
                                      background: status === "active" ? "#22C55E20" : "#EF444420",
                                      color: status === "active" ? "#22C55E" : "#EF4444",
                                    }}
                                  >
                                    {status}
                                  </span>
                                </div>
                                <div className="px-4 py-3 flex items-center gap-2">
                                  <span className="text-[11px]" style={{ color: "#A0A0A0" }}>
                                    {user.last_active ? new Date(user.last_active).toLocaleDateString("ka-GE", { day: "numeric", month: "short" }) : "-"}
                                  </span>
                                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Detail */}
                            {isExpanded && (
                              <div
                                className="px-4 py-4 border-t"
                                style={{ background: "#0A0A0A", borderColor: "#252525" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {expandedLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
                                    <span className="ml-2 text-[12px]" style={{ color: "#666666" }}>Loading...</span>
                                  </div>
                                ) : expandedData ? (
                                  <>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                      {/* Profile */}
                                      <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center" style={{ background: "#1A1A1A", border: "2px solid #252525" }}>
                                            <UserIcon />
                                          </div>
                                          <div>
                                            <p className="text-[14px] font-bold" style={{ color: "#FFFFFF" }}>{expandedData.user.name || "No Name"}</p>
                                            <p className="text-[11px]" style={{ color: "#666666" }}>{expandedData.user.phone}</p>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-[11px]" style={{ color: "#666666" }}>Joined</span>
                                            <span className="text-[11px] font-medium" style={{ color: "#A0A0A0" }}>{new Date(expandedData.user.created_at).toLocaleDateString("ka-GE")}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-[11px]" style={{ color: "#666666" }}>Coin Balance</span>
                                            <span className="text-[11px] font-bold" style={{ color: "#F9E741" }}>{expandedData.user.coin_balance}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-[11px]" style={{ color: "#666666" }}>Cash Balance</span>
                                            <span className="text-[11px] font-bold" style={{ color: "#22C55E" }}>{expandedData.user.cash_balance.toFixed(2)} &#8382;</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-[11px]" style={{ color: "#666666" }}>Status</span>
                                            <span className="text-[11px] font-bold" style={{ color: expandedData.user.is_active ? "#22C55E" : "#EF4444" }}>
                                              {expandedData.user.is_active ? "Active" : "Blocked"}
                                            </span>
                                          </div>
                                          {expandedData.activeTransaction && (
                                            <>
                                              <div className="border-t pt-2 mt-2" style={{ borderColor: "#252525" }}>
                                                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#666666" }}>Active Transaction</p>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-[11px]" style={{ color: "#666666" }}>Coins Left</span>
                                                <span className="text-[11px] font-medium" style={{ color: "#F9E741" }}>{expandedData.activeTransaction.coins_remaining}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-[11px]" style={{ color: "#666666" }}>Cash Won</span>
                                                <span className="text-[11px] font-medium" style={{ color: "#22C55E" }}>{expandedData.activeTransaction.total_cash_won.toFixed(2)} &#8382;</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-[11px]" style={{ color: "#666666" }}>Guarantee</span>
                                                <span className="text-[11px] font-medium" style={{ color: "#A0A0A0" }}>{expandedData.activeTransaction.guaranteed_minimum.toFixed(2)} &#8382;</span>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Stats */}
                                      <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                        <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "#666666" }}>Statistics</p>
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-[11px]" style={{ color: "#666666" }}>Total Games</p>
                                            <p className="text-[20px] font-extrabold" style={{ color: "#FFFFFF" }}>{expandedData.user.total_games_played}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px]" style={{ color: "#666666" }}>Total Cash Won</p>
                                            <p className="text-[20px] font-extrabold" style={{ color: "#22C55E" }}>{expandedData.user.total_cash_won.toFixed(2)} &#8382;</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px]" style={{ color: "#666666" }}>Total Coins Spent</p>
                                            <p className="text-[16px] font-bold" style={{ color: "#F9E741" }}>{expandedData.user.total_coins_spent.toFixed(2)}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px]" style={{ color: "#666666" }}>Games in History</p>
                                            <p className="text-[16px] font-bold" style={{ color: "#A0A0A0" }}>{expandedData.gameHistory.length}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Game History */}
                                      <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                        <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "#666666" }}>Recent Games</p>
                                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                                          {expandedData.gameHistory.length === 0 ? (
                                            <p className="text-[12px] py-4 text-center" style={{ color: "#444444" }}>No game history</p>
                                          ) : (
                                            expandedData.gameHistory.map((g) => (
                                              <div key={g.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#1A1A1A" }}>
                                                <div>
                                                  <p className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{g.gameType}</p>
                                                  <p className="text-[10px]" style={{ color: "#666666" }}>{new Date(g.createdAt).toLocaleString("ka-GE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                                                </div>
                                                <div className="text-right">
                                                  <p className="text-[12px] font-medium" style={{ color: "#F9E741" }}>{g.betAmount.toFixed(2)} bet</p>
                                                  <p className="text-[10px] font-medium" style={{ color: g.winAmount > 0 ? "#22C55E" : "#666666" }}>
                                                    {g.winAmount > 0 ? `+${g.winAmount.toFixed(2)} \u20BE` : "No win"}
                                                  </p>
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Admin Actions */}
                                    <div className="mt-4 rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                      <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "#666666" }}>Admin Actions</p>
                                      <div className="flex flex-wrap gap-2">
                                        {/* Coin Management */}
                                        <button
                                          onClick={() => {
                                            setBalanceModal({
                                              userId: user.id,
                                              userName: expandedData.user.name || expandedData.user.phone,
                                              type: "coin",
                                              currentBalance: expandedData.user.coin_balance,
                                            });
                                            setBalanceAction("add");
                                            setBalanceAmount("");
                                            setBalanceReason("");
                                          }}
                                          className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 active:scale-95"
                                          style={{ background: "#F9E74120", color: "#F9E741", border: "1px solid #F9E74140" }}
                                        >
                                          <CoinIcon />
                                          {"\u10E5\u10DD\u10D8\u10DC\u10D8\u10E1 \u10DB\u10D0\u10E0\u10D7\u10D5\u10D0"}
                                        </button>

                                        {/* Cash Management */}
                                        <button
                                          onClick={() => {
                                            setBalanceModal({
                                              userId: user.id,
                                              userName: expandedData.user.name || expandedData.user.phone,
                                              type: "cash",
                                              currentBalance: expandedData.user.cash_balance,
                                            });
                                            setBalanceAction("add");
                                            setBalanceAmount("");
                                            setBalanceReason("");
                                          }}
                                          className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 active:scale-95"
                                          style={{ background: "#22C55E20", color: "#22C55E", border: "1px solid #22C55E40" }}
                                        >
                                          <CashIcon />
                                          {"\u10E5\u10D4\u10E8\u10D8\u10E1 \u10DB\u10D0\u10E0\u10D7\u10D5\u10D0"}
                                        </button>

                                        {/* Reset Village */}
                                        <button
                                          onClick={async () => {
                                            const ok = window.confirm(
                                              `Reset village progress for ${expandedData.user.name || expandedData.user.phone}?\n\nAll purchased buildings & stars will be cleared. This does NOT refund coins.`
                                            );
                                            if (!ok) return;
                                            try {
                                              await resetUserVillage(user.id);
                                              showToast("\u10D5\u10D8\u10DA\u10D8\u10EF\u10D8 \u10D2\u10D0\u10EC\u10DB\u10D4\u10DC\u10D3\u10D0 \u10E7\u10D5\u10D4\u10DA\u10D0 \u10D7\u10D0\u10D5\u10D8\u10D3\u10D0\u10DC");
                                            } catch {
                                              showToast("\u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D0 \u10D2\u10D0\u10EC\u10DB\u10D4\u10DC\u10D3\u10D8\u10E1\u10D0\u10E1");
                                            }
                                          }}
                                          className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 active:scale-95"
                                          style={{ background: "#A855F720", color: "#A855F7", border: "1px solid #A855F740" }}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 11l8-7 8 7v10a1 1 0 01-1 1h-5v-6h-4v6H4a1 1 0 01-1-1z" />
                                          </svg>
                                          {"\u10D5\u10D8\u10DA\u10D8\u10EF\u10D8\u10E1 \u10D2\u10D0\u10EC\u10DB\u10D4\u10DC\u10D3\u10D0"}
                                        </button>

                                        {/* Block / Unblock */}
                                        <button
                                          onClick={() => setBlockModal(user.id)}
                                          className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 active:scale-95"
                                          style={{
                                            background: user.is_active ? "#EF444420" : "#22C55E20",
                                            color: user.is_active ? "#EF4444" : "#22C55E",
                                            border: `1px solid ${user.is_active ? "#EF444440" : "#22C55E40"}`,
                                          }}
                                        >
                                          <ShieldIcon />
                                          {user.is_active ? "\u10D3\u10D0\u10D1\u10DA\u10DD\u10D9\u10D5\u10D0" : "\u10D2\u10D0\u10DC\u10D1\u10DA\u10DD\u10D9\u10D5\u10D0"}
                                        </button>

                                        {/* Delete user (hard delete with all related data) */}
                                        <button
                                          onClick={() => setDeleteModal(user.id)}
                                          className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 active:scale-95"
                                          style={{
                                            background: "#7F1D1D",
                                            color: "#FCA5A5",
                                            border: "1px solid #991B1B",
                                          }}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                            <path d="M10 11v6" />
                                            <path d="M14 11v6" />
                                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                          </svg>
                                          {"\u10EC\u10D0\u10E8\u10DA\u10D0"}
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                ) : null}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {usersList.length === 0 && !loading && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <p className="text-[14px] font-medium" style={{ color: "#666666" }}>No users found</p>
                          <p className="text-[12px] mt-1" style={{ color: "#444444" }}>Try adjusting your search or filters</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all active:scale-95"
                style={{
                  background: currentPage === 1 ? "#111111" : "#1A1A1A",
                  color: currentPage === 1 ? "#444444" : "#A0A0A0",
                  border: "1px solid #252525",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9,3 5,7 9,11" /></svg>
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page: number;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 rounded-[8px] text-[12px] font-bold transition-all active:scale-95"
                    style={{
                      background: currentPage === page ? "#F9E741" : "#1A1A1A",
                      color: currentPage === page ? "#000000" : "#A0A0A0",
                      border: currentPage === page ? "1px solid #F9E741" : "1px solid #252525",
                    }}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all active:scale-95"
                style={{
                  background: currentPage === totalPages ? "#111111" : "#1A1A1A",
                  color: currentPage === totalPages ? "#444444" : "#A0A0A0",
                  border: "1px solid #252525",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="5,3 9,7 5,11" /></svg>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── BALANCE ADJUSTMENT MODAL ── */}
      {balanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setBalanceModal(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-[90%] max-w-[400px]" style={{ background: "#111111", border: `1px solid ${balanceModal.type === "coin" ? "#F9E74140" : "#22C55E40"}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              {balanceModal.type === "coin" ? <CoinIcon /> : <CashIcon />}
              <h3 className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>
                {balanceModal.type === "coin" ? "\u10E5\u10DD\u10D8\u10DC\u10D8\u10E1 \u10DB\u10D0\u10E0\u10D7\u10D5\u10D0" : "\u10E5\u10D4\u10E8\u10D8\u10E1 \u10DB\u10D0\u10E0\u10D7\u10D5\u10D0"}
              </h3>
            </div>

            <p className="text-[12px] mb-1" style={{ color: "#666666" }}>
              User: <span style={{ color: "#FFFFFF" }}>{balanceModal.userName}</span>
            </p>
            <p className="text-[12px] mb-4" style={{ color: "#666666" }}>
              Current: <span className="font-bold" style={{ color: balanceModal.type === "coin" ? "#F9E741" : "#22C55E" }}>
                {balanceModal.type === "coin" ? balanceModal.currentBalance : `${balanceModal.currentBalance.toFixed(2)} \u20BE`}
              </span>
            </p>

            {/* Action toggle */}
            <div className="flex gap-1 rounded-[8px] p-1 mb-4" style={{ background: "#1A1A1A" }}>
              <button
                onClick={() => setBalanceAction("add")}
                className="flex-1 px-3 py-2 rounded-[6px] text-[12px] font-medium transition-all"
                style={{
                  background: balanceAction === "add" ? "#22C55E" : "transparent",
                  color: balanceAction === "add" ? "#FFFFFF" : "#A0A0A0",
                }}
              >
                {"\u10D3\u10D0\u10DB\u10D0\u10E2\u10D4\u10D1\u10D0"}
              </button>
              <button
                onClick={() => setBalanceAction("subtract")}
                className="flex-1 px-3 py-2 rounded-[6px] text-[12px] font-medium transition-all"
                style={{
                  background: balanceAction === "subtract" ? "#EF4444" : "transparent",
                  color: balanceAction === "subtract" ? "#FFFFFF" : "#A0A0A0",
                }}
              >
                {"\u10E9\u10D0\u10DB\u10DD\u10ED\u10E0\u10D0"}
              </button>
            </div>

            {/* Amount */}
            <div className="mb-3">
              <label className="text-[11px] block mb-1" style={{ color: "#666666" }}>{"\u10E0\u10D0\u10DD\u10D3\u10D4\u10DC\u10DD\u10D1\u10D0"}</label>
              <input
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="0"
                min="0"
                step={balanceModal.type === "cash" ? "0.01" : "1"}
                className="w-full text-[18px] font-bold rounded-[8px] px-3 py-2 outline-none"
                style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }}
              />
            </div>

            {/* Reason */}
            <div className="mb-4">
              <label className="text-[11px] block mb-1" style={{ color: "#666666" }}>{"\u10DB\u10D8\u10D6\u10D4\u10D6\u10D8"} *</label>
              <input
                type="text"
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                placeholder={"\u10DB\u10D8\u10E3\u10D7\u10D8\u10D7\u10D4\u10D7 \u10DB\u10D8\u10D6\u10D4\u10D6\u10D8..."}
                className="w-full text-[13px] rounded-[8px] px-3 py-2 outline-none"
                style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }}
              />
            </div>

            {/* Preview */}
            {balanceAmount && parseFloat(balanceAmount) > 0 && (
              <div className="rounded-[8px] px-3 py-2 mb-4" style={{ background: "#1A1A1A", border: "1px solid #252525" }}>
                <p className="text-[11px]" style={{ color: "#666666" }}>
                  {"\u10D0\u10EE\u10D0\u10DA\u10D8 \u10D1\u10D0\u10DA\u10D0\u10DC\u10E1\u10D8:"}{" "}
                  <span className="font-bold text-[13px]" style={{ color: balanceModal.type === "coin" ? "#F9E741" : "#22C55E" }}>
                    {balanceModal.type === "coin" ? `${previewBalance} \u10E5\u10DD\u10D8\u10DC\u10D8` : `${previewBalance.toFixed(2)}\u20BE`}
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAdjustBalance}
                disabled={actionLoading || !balanceAmount || !balanceReason.trim() || parseFloat(balanceAmount) <= 0}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: balanceModal.type === "coin" ? "#F9E741" : "#22C55E", color: balanceModal.type === "coin" ? "#000000" : "#FFFFFF" }}
              >
                {actionLoading ? "..." : "\u10D3\u10D0\u10D3\u10D0\u10E1\u10E2\u10E3\u10E0\u10D4\u10D1\u10D0"}
              </button>
              <button onClick={() => setBalanceModal(null)} className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                {"\u10D2\u10D0\u10E3\u10E5\u10DB\u10D4\u10D1\u10D0"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK/UNBLOCK CONFIRM MODAL ── */}
      {blockModal !== null && (() => {
        const targetUser = usersList.find((u) => u.id === blockModal);
        if (!targetUser) return null;
        const isBlocking = targetUser.is_active;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setBlockModal(null)}>
            <div className="absolute inset-0 bg-black/70" />
            <div className="relative rounded-[16px] p-6 w-[90%] max-w-[360px] border-2" style={{ background: "#111111", borderColor: isBlocking ? "#EF4444" : "#22C55E" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-3">
                {isBlocking ? <WarningIcon /> : <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4,10 8,14 16,6" /></svg>}
                <h3 className="text-[16px] font-bold" style={{ color: isBlocking ? "#EF4444" : "#22C55E" }}>
                  {isBlocking ? "\u10D3\u10D0\u10D1\u10DA\u10DD\u10D9\u10D5\u10D0" : "\u10D2\u10D0\u10DC\u10D1\u10DA\u10DD\u10D9\u10D5\u10D0"}
                </h3>
              </div>
              <p className="text-[13px] mb-4 leading-relaxed" style={{ color: "#A0A0A0" }}>
                {"\u10D3\u10D0\u10E0\u10EC\u10DB\u10E3\u10DC\u10D4\u10D1\u10E3\u10DA\u10D8 \u10EE\u10D0\u10E0?"}{" "}
                <span className="font-bold text-white">{targetUser.name || targetUser.phone}</span>
                {isBlocking
                  ? " \u10D5\u10D4\u10E0 \u10E8\u10D4\u10EB\u10DA\u10D4\u10D1\u10E1 \u10D0\u10DE\u10DA\u10D8\u10D9\u10D0\u10EA\u10D8\u10D8\u10E1 \u10D2\u10D0\u10DB\u10DD\u10E7\u10D4\u10DC\u10D4\u10D1\u10D0\u10E1."
                  : " \u10D3\u10D0\u10E3\u10D1\u10E0\u10E3\u10DC\u10D3\u10D4\u10D1\u10D0 \u10D0\u10DE\u10DA\u10D8\u10D9\u10D0\u10EA\u10D8\u10D0\u10E8\u10D8."
                }
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleBlock(blockModal)}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: isBlocking ? "#EF4444" : "#22C55E", color: "#FFFFFF" }}
                >
                  {actionLoading ? "..." : isBlocking ? "\u10D3\u10D0\u10D1\u10DA\u10DD\u10D9\u10D5\u10D0" : "\u10D2\u10D0\u10DC\u10D1\u10DA\u10DD\u10D9\u10D5\u10D0"}
                </button>
                <button onClick={() => setBlockModal(null)} className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                  {"\u10D2\u10D0\u10E3\u10E5\u10DB\u10D4\u10D1\u10D0"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete user confirmation modal */}
      {deleteModal !== null && (() => {
        const targetUser = usersList.find((u) => u.id === deleteModal);
        if (!targetUser) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => !deleting && setDeleteModal(null)}>
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />
            <div onClick={(e) => e.stopPropagation()} className="relative w-[92%] max-w-[400px] rounded-[16px] p-5 border" style={{ background: "#0F0F0F", borderColor: "#7F1D1D" }}>
              <div className="flex items-center gap-2 mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
                <h3 className="text-[16px] font-bold" style={{ color: "#EF4444" }}>
                  მომხმარებლის წაშლა
                </h3>
              </div>
              <p className="text-[13px] mb-4 leading-relaxed" style={{ color: "#A0A0A0" }}>
                სრულად წავშალოთ{" "}
                <span className="font-bold text-white">{targetUser.name || targetUser.phone}</span>
                ? წაიშლება ყველა მონაცემი (ბალანსი, ტრანზაქციები, ვილიჯი, რეფერალები, სესიები). მოქმედება შეუქცევადია.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (deleting) return;
                    setDeleting(true);
                    try {
                      await deleteUser(deleteModal);
                      showToast("მომხმარებელი წაიშალა");
                      setDeleteModal(null);
                      setExpandedId(null);
                      fetchUsers();
                    } catch (e: any) {
                      showToast(e?.message || "შეცდომა წაშლისას");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "#EF4444", color: "#FFFFFF" }}
                >
                  {deleting ? "იშლება..." : "წაშლა"}
                </button>
                <button
                  onClick={() => !deleting && setDeleteModal(null)}
                  className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95"
                  style={{ background: "#1A1A1A", color: "#A0A0A0" }}
                >
                  გაუქმება
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
