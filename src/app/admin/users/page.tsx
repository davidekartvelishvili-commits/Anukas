"use client";

import { useState, useEffect } from "react";
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
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "Notifications", id: "notifications", href: "/admin/notifications" },
  { label: "Analytics", id: "analytics", href: "/admin/analytics" },
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── MOCK USERS ── */
interface MockUser {
  id: number;
  name: string;
  phone: string;
  gender: "male" | "female";
  level: number;
  xp: number;
  totalSpent: number;
  totalWon: number;
  lastActive: string;
  status: "active" | "blocked";
  joined: string;
  transactions: { date: string; merchant: string; amount: number; won: number; game: string }[];
}

const MOCK_USERS: MockUser[] = [
  { id: 1, name: "Ana Mgeladze", phone: "+995 555 12 34 01", gender: "female", level: 8, xp: 7200, totalSpent: 4850.30, totalWon: 312.50, lastActive: "2026-03-29 14:12", status: "active", joined: "2025-09-12", transactions: [{ date: "2026-03-29", merchant: "Stamba Cafe", amount: 25.50, won: 2.55, game: "Spin" }, { date: "2026-03-28", merchant: "Dunkin'", amount: 12.00, won: 0, game: "Drop" }, { date: "2026-03-27", merchant: "Luca Polare", amount: 45.00, won: 4.50, game: "Step" }] },
  { id: 2, name: "David Kapanadze", phone: "+995 555 12 34 02", gender: "male", level: 12, xp: 15600, totalSpent: 12450.00, totalWon: 890.20, lastActive: "2026-03-29 13:45", status: "active", joined: "2025-06-01", transactions: [{ date: "2026-03-29", merchant: "Pasanauri", amount: 65.00, won: 6.50, game: "Spin" }, { date: "2026-03-28", merchant: "GPC", amount: 230.00, won: 0, game: "Drop" }] },
  { id: 3, name: "Nino Janelidze", phone: "+995 555 12 34 03", gender: "female", level: 5, xp: 3200, totalSpent: 2100.50, totalWon: 145.80, lastActive: "2026-03-29 12:30", status: "active", joined: "2025-11-20", transactions: [{ date: "2026-03-29", merchant: "Coffee Lab", amount: 8.50, won: 0.85, game: "Spin" }] },
  { id: 4, name: "Giorgi Tsereteli", phone: "+995 555 12 34 04", gender: "male", level: 3, xp: 1800, totalSpent: 980.00, totalWon: 52.30, lastActive: "2026-03-28 18:20", status: "active", joined: "2026-01-15", transactions: [{ date: "2026-03-28", merchant: "Bread House", amount: 15.00, won: 1.50, game: "Step" }] },
  { id: 5, name: "Mariam Sukhitashvili", phone: "+995 555 12 34 05", gender: "female", level: 15, xp: 22400, totalSpent: 18900.00, totalWon: 1450.00, lastActive: "2026-03-29 14:50", status: "active", joined: "2025-03-10", transactions: [{ date: "2026-03-29", merchant: "Stamba Cafe", amount: 18.00, won: 1.80, game: "Spin" }, { date: "2026-03-29", merchant: "GPC", amount: 340.00, won: 34.00, game: "Spin" }] },
  { id: 6, name: "Luka Beridze", phone: "+995 555 12 34 06", gender: "male", level: 7, xp: 5400, totalSpent: 3200.40, totalWon: 198.60, lastActive: "2026-03-27 09:15", status: "blocked", joined: "2025-08-22", transactions: [{ date: "2026-03-27", merchant: "Wendy's", amount: 22.00, won: 0, game: "Drop" }] },
  { id: 7, name: "Elene Rurua", phone: "+995 555 12 34 07", gender: "female", level: 10, xp: 11200, totalSpent: 8500.00, totalWon: 620.40, lastActive: "2026-03-29 11:08", status: "active", joined: "2025-07-05", transactions: [{ date: "2026-03-29", merchant: "Luca Polare", amount: 32.00, won: 3.20, game: "Spin" }] },
  { id: 8, name: "Tornike Avaliani", phone: "+995 555 12 34 08", gender: "male", level: 2, xp: 900, totalSpent: 450.00, totalWon: 22.50, lastActive: "2026-03-25 16:40", status: "active", joined: "2026-02-28", transactions: [{ date: "2026-03-25", merchant: "Coffee Lab", amount: 6.00, won: 0, game: "Step" }] },
  { id: 9, name: "Salome Kvachadze", phone: "+995 555 12 34 09", gender: "female", level: 18, xp: 34000, totalSpent: 28900.00, totalWon: 2100.00, lastActive: "2026-03-29 15:02", status: "active", joined: "2025-01-20", transactions: [{ date: "2026-03-29", merchant: "Pasanauri", amount: 78.00, won: 7.80, game: "Spin" }, { date: "2026-03-29", merchant: "Dunkin'", amount: 14.50, won: 0, game: "Drop" }] },
  { id: 10, name: "Irakli Metreveli", phone: "+995 555 12 34 10", gender: "male", level: 6, xp: 4100, totalSpent: 2800.00, totalWon: 168.00, lastActive: "2026-03-29 10:22", status: "active", joined: "2025-10-08", transactions: [{ date: "2026-03-29", merchant: "Bread House", amount: 20.00, won: 2.00, game: "Step" }] },
  { id: 11, name: "Tamara Goglidze", phone: "+995 555 12 34 11", gender: "female", level: 4, xp: 2400, totalSpent: 1500.00, totalWon: 78.90, lastActive: "2026-03-28 20:15", status: "active", joined: "2025-12-01", transactions: [{ date: "2026-03-28", merchant: "Stamba Cafe", amount: 12.00, won: 0, game: "Drop" }] },
  { id: 12, name: "Nikoloz Chkheidze", phone: "+995 555 12 34 12", gender: "male", level: 9, xp: 8800, totalSpent: 6700.00, totalWon: 445.50, lastActive: "2026-03-29 08:30", status: "active", joined: "2025-05-17", transactions: [{ date: "2026-03-29", merchant: "GPC", amount: 150.00, won: 15.00, game: "Spin" }] },
  { id: 13, name: "Ketevan Lortkipanidze", phone: "+995 555 12 34 13", gender: "female", level: 1, xp: 400, totalSpent: 220.00, totalWon: 11.00, lastActive: "2026-03-26 14:45", status: "active", joined: "2026-03-10", transactions: [{ date: "2026-03-26", merchant: "Coffee Lab", amount: 7.50, won: 0.75, game: "Spin" }] },
  { id: 14, name: "Zurab Papashvili", phone: "+995 555 12 34 14", gender: "male", level: 14, xp: 19800, totalSpent: 15200.00, totalWon: 1120.00, lastActive: "2026-03-29 13:10", status: "active", joined: "2025-04-22", transactions: [{ date: "2026-03-29", merchant: "Pasanauri", amount: 55.00, won: 5.50, game: "Spin" }, { date: "2026-03-28", merchant: "Wendy's", amount: 18.00, won: 0, game: "Drop" }] },
  { id: 15, name: "Natia Khmaladze", phone: "+995 555 12 34 15", gender: "female", level: 11, xp: 13500, totalSpent: 9800.00, totalWon: 720.00, lastActive: "2026-03-29 12:55", status: "blocked", joined: "2025-06-30", transactions: [{ date: "2026-03-27", merchant: "Luca Polare", amount: 28.00, won: 2.80, game: "Step" }] },
  { id: 16, name: "Levan Gabashvili", phone: "+995 555 12 34 16", gender: "male", level: 20, xp: 45000, totalSpent: 42000.00, totalWon: 3200.00, lastActive: "2026-03-29 15:30", status: "active", joined: "2024-11-05", transactions: [{ date: "2026-03-29", merchant: "GPC", amount: 520.00, won: 52.00, game: "Spin" }, { date: "2026-03-29", merchant: "Stamba Cafe", amount: 35.00, won: 3.50, game: "Spin" }, { date: "2026-03-28", merchant: "Pasanauri", amount: 90.00, won: 0, game: "Drop" }] },
  { id: 17, name: "Maia Dzneladze", phone: "+995 555 12 34 17", gender: "female", level: 6, xp: 4500, totalSpent: 3100.00, totalWon: 186.00, lastActive: "2026-03-28 17:40", status: "active", joined: "2025-09-28", transactions: [{ date: "2026-03-28", merchant: "Bread House", amount: 10.00, won: 1.00, game: "Step" }] },
  { id: 18, name: "Giga Shanidze", phone: "+995 555 12 34 18", gender: "male", level: 3, xp: 1600, totalSpent: 870.00, totalWon: 43.50, lastActive: "2026-03-24 11:20", status: "blocked", joined: "2026-01-08", transactions: [{ date: "2026-03-24", merchant: "Dunkin'", amount: 9.00, won: 0, game: "Drop" }] },
  { id: 19, name: "Tamar Berishvili", phone: "+995 555 12 34 19", gender: "female", level: 13, xp: 17200, totalSpent: 13500.00, totalWon: 980.00, lastActive: "2026-03-29 09:45", status: "active", joined: "2025-05-12", transactions: [{ date: "2026-03-29", merchant: "Coffee Lab", amount: 11.00, won: 1.10, game: "Spin" }, { date: "2026-03-28", merchant: "Wendy's", amount: 25.00, won: 2.50, game: "Step" }] },
  { id: 20, name: "Beka Topuria", phone: "+995 555 12 34 20", gender: "male", level: 8, xp: 7000, totalSpent: 5200.00, totalWon: 340.00, lastActive: "2026-03-29 14:25", status: "active", joined: "2025-08-01", transactions: [{ date: "2026-03-29", merchant: "Luca Polare", amount: 40.00, won: 4.00, game: "Spin" }] },
  { id: 21, name: "Sopo Jikia", phone: "+995 555 12 34 21", gender: "female", level: 7, xp: 5800, totalSpent: 3900.00, totalWon: 234.00, lastActive: "2026-03-29 11:50", status: "active", joined: "2025-10-15", transactions: [{ date: "2026-03-29", merchant: "Stamba Cafe", amount: 14.00, won: 0, game: "Drop" }] },
  { id: 22, name: "Archil Datunashvili", phone: "+995 555 12 34 22", gender: "male", level: 16, xp: 26000, totalSpent: 22000.00, totalWon: 1680.00, lastActive: "2026-03-29 15:10", status: "active", joined: "2025-02-18", transactions: [{ date: "2026-03-29", merchant: "GPC", amount: 280.00, won: 28.00, game: "Spin" }, { date: "2026-03-29", merchant: "Pasanauri", amount: 48.00, won: 0, game: "Drop" }] },
  { id: 23, name: "Lina Gelashvili", phone: "+995 555 12 34 23", gender: "female", level: 2, xp: 800, totalSpent: 380.00, totalWon: 19.00, lastActive: "2026-03-27 15:30", status: "active", joined: "2026-02-20", transactions: [{ date: "2026-03-27", merchant: "Coffee Lab", amount: 5.50, won: 0.55, game: "Spin" }] },
  { id: 24, name: "Dato Mchedlishvili", phone: "+995 555 12 34 24", gender: "male", level: 5, xp: 3400, totalSpent: 2300.00, totalWon: 138.00, lastActive: "2026-03-28 19:00", status: "active", joined: "2025-11-10", transactions: [{ date: "2026-03-28", merchant: "Bread House", amount: 18.00, won: 1.80, game: "Step" }] },
  { id: 25, name: "Nana Tsiklauri", phone: "+995 555 12 34 25", gender: "female", level: 9, xp: 9200, totalSpent: 7100.00, totalWon: 498.00, lastActive: "2026-03-29 10:05", status: "active", joined: "2025-07-20", transactions: [{ date: "2026-03-29", merchant: "Dunkin'", amount: 11.50, won: 0, game: "Drop" }, { date: "2026-03-28", merchant: "Stamba Cafe", amount: 22.00, won: 2.20, game: "Spin" }] },
  { id: 26, name: "Revaz Khvichia", phone: "+995 555 12 34 26", gender: "male", level: 11, xp: 14000, totalSpent: 10500.00, totalWon: 756.00, lastActive: "2026-03-29 13:35", status: "blocked", joined: "2025-06-15", transactions: [{ date: "2026-03-26", merchant: "GPC", amount: 190.00, won: 19.00, game: "Spin" }] },
  { id: 27, name: "Eka Lomidze", phone: "+995 555 12 34 27", gender: "female", level: 4, xp: 2100, totalSpent: 1350.00, totalWon: 67.50, lastActive: "2026-03-28 08:50", status: "active", joined: "2025-12-20", transactions: [{ date: "2026-03-28", merchant: "Wendy's", amount: 16.00, won: 0, game: "Drop" }] },
  { id: 28, name: "Mamuka Nadiradze", phone: "+995 555 12 34 28", gender: "male", level: 17, xp: 30000, totalSpent: 25500.00, totalWon: 1920.00, lastActive: "2026-03-29 14:58", status: "active", joined: "2025-01-30", transactions: [{ date: "2026-03-29", merchant: "Pasanauri", amount: 72.00, won: 7.20, game: "Spin" }, { date: "2026-03-29", merchant: "Luca Polare", amount: 38.00, won: 0, game: "Drop" }, { date: "2026-03-28", merchant: "Coffee Lab", amount: 9.00, won: 0.90, game: "Spin" }] },
  { id: 29, name: "Rusudan Khizanishvili", phone: "+995 555 12 34 29", gender: "female", level: 10, xp: 11800, totalSpent: 8900.00, totalWon: 645.00, lastActive: "2026-03-29 12:15", status: "active", joined: "2025-07-10", transactions: [{ date: "2026-03-29", merchant: "Stamba Cafe", amount: 20.00, won: 2.00, game: "Step" }] },
  { id: 30, name: "Vakhtang Gorgadze", phone: "+995 555 12 34 30", gender: "male", level: 1, xp: 300, totalSpent: 150.00, totalWon: 7.50, lastActive: "2026-03-26 10:30", status: "active", joined: "2026-03-15", transactions: [{ date: "2026-03-26", merchant: "Bread House", amount: 8.00, won: 0, game: "Drop" }] },
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
function StarIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="7,1 8.8,5.2 13,5.6 9.8,8.4 10.8,13 7,10.6 3.2,13 4.2,8.4 1,5.6 5.2,5.2" /></svg>;
}
function LockIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="8" height="6" rx="1" /><path d="M5 6V4.5a2 2 0 014 0V6" /></svg>;
}
function WarningIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L1 18h18L10 2z" /><line x1="10" y1="8" x2="10" y2="12" /><circle cx="10" cy="15" r="0.5" fill="#EF4444" /></svg>;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Search & Filters
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Expanded row
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Users state (mutable for admin actions)
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);

  // Admin action modals
  const [xpModal, setXpModal] = useState<{ userId: number; amount: string } | null>(null);
  const [levelModal, setLevelModal] = useState<{ userId: number; newLevel: number } | null>(null);
  const [pinResetModal, setPinResetModal] = useState<number | null>(null);
  const [blockModal, setBlockModal] = useState<number | null>(null);

  // Saved feedback
  const [savedAction, setSavedAction] = useState<string | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Filter logic
  const filtered = users.filter((u) => {
    const matchesSearch = search === "" || u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search);
    const matchesGender = genderFilter === "all" || u.gender === genderFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesGender && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, genderFilter, statusFilter]);

  // Admin action handlers
  const handleGrantXp = (userId: number, amount: number) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, xp: u.xp + amount } : u));
    setXpModal(null);
    setSavedAction(`+${amount} XP granted`);
    setTimeout(() => setSavedAction(null), 2000);
  };

  const handleChangeLevel = (userId: number, newLevel: number) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, level: newLevel } : u));
    setLevelModal(null);
    setSavedAction(`Level changed to ${newLevel}`);
    setTimeout(() => setSavedAction(null), 2000);
  };

  const handlePinReset = (userId: number) => {
    setPinResetModal(null);
    setSavedAction("PIN reset successfully");
    setTimeout(() => setSavedAction(null), 2000);
  };

  const handleToggleBlock = (userId: number) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: u.status === "active" ? "blocked" : "active" } : u));
    setBlockModal(null);
    const user = users.find((u) => u.id === userId);
    setSavedAction(user?.status === "active" ? "User blocked" : "User unblocked");
    setTimeout(() => setSavedAction(null), 2000);
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

              {/* Gender Filter */}
              <div className="flex gap-1 rounded-[8px] p-1" style={{ background: "#1A1A1A" }}>
                {(["all", "male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all"
                    style={{
                      background: genderFilter === g ? "#F9E741" : "transparent",
                      color: genderFilter === g ? "#000000" : "#A0A0A0",
                    }}
                  >
                    {g === "all" ? "All" : g === "male" ? "Male" : "Female"}
                  </button>
                ))}
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
                {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
              </p>
              <p className="text-[11px]" style={{ color: "#666666" }}>
                Page {currentPage} of {totalPages || 1}
              </p>
            </div>
          </div>

          {/* ── USERS TABLE ── */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid #252525" }}>
                    {["Name", "Phone", "Level", "Total Spent", "Total Won", "Last Active", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user) => {
                    const isExpanded = expandedId === user.id;
                    return (
                      <tr key={user.id} style={{ cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : user.id)}>
                        <td colSpan={7} className="p-0">
                          {/* Row */}
                          <div className="flex items-center transition-all hover:bg-[#1A1A1A]" style={{ borderBottom: "1px solid #1A1A1A" }}>
                            <div className="flex-1 grid grid-cols-7 min-w-[800px]">
                              <div className="px-4 py-3 flex items-center gap-2">
                                <span className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{user.name}</span>
                              </div>
                              <div className="px-4 py-3">
                                <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{user.phone}</span>
                              </div>
                              <div className="px-4 py-3">
                                <span className="text-[12px] font-bold" style={{ color: "#F9E741" }}>Lv.{user.level}</span>
                              </div>
                              <div className="px-4 py-3">
                                <span className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{user.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })} &#8382;</span>
                              </div>
                              <div className="px-4 py-3">
                                <span className="text-[12px] font-medium" style={{ color: "#22C55E" }}>{user.totalWon.toLocaleString("en-US", { minimumFractionDigits: 2 })} &#8382;</span>
                              </div>
                              <div className="px-4 py-3">
                                <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{user.lastActive}</span>
                              </div>
                              <div className="px-4 py-3 flex items-center gap-2">
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                                  style={{
                                    background: user.status === "active" ? "#22C55E20" : "#EF444420",
                                    color: user.status === "active" ? "#22C55E" : "#EF4444",
                                  }}
                                >
                                  {user.status}
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
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Profile */}
                                <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center" style={{ background: "#1A1A1A", border: "2px solid #252525" }}>
                                      <UserIcon />
                                    </div>
                                    <div>
                                      <p className="text-[14px] font-bold" style={{ color: "#FFFFFF" }}>{user.name}</p>
                                      <p className="text-[11px]" style={{ color: "#666666" }}>{user.phone}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-[11px]" style={{ color: "#666666" }}>Gender</span>
                                      <span className="text-[11px] font-medium" style={{ color: "#A0A0A0" }}>{user.gender === "male" ? "Male" : "Female"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[11px]" style={{ color: "#666666" }}>Joined</span>
                                      <span className="text-[11px] font-medium" style={{ color: "#A0A0A0" }}>{user.joined}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[11px]" style={{ color: "#666666" }}>XP</span>
                                      <span className="text-[11px] font-bold" style={{ color: "#F9E741" }}>{user.xp.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[11px]" style={{ color: "#666666" }}>Level</span>
                                      <span className="text-[11px] font-bold" style={{ color: "#F9E741" }}>{user.level}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Stats */}
                                <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                  <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "#666666" }}>Statistics</p>
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-[11px]" style={{ color: "#666666" }}>Total Spent</p>
                                      <p className="text-[20px] font-extrabold" style={{ color: "#FFFFFF" }}>{user.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })} &#8382;</p>
                                    </div>
                                    <div>
                                      <p className="text-[11px]" style={{ color: "#666666" }}>Total Won</p>
                                      <p className="text-[20px] font-extrabold" style={{ color: "#22C55E" }}>{user.totalWon.toLocaleString("en-US", { minimumFractionDigits: 2 })} &#8382;</p>
                                    </div>
                                    <div>
                                      <p className="text-[11px]" style={{ color: "#666666" }}>Win Rate</p>
                                      <p className="text-[16px] font-bold" style={{ color: "#F9E741" }}>{user.totalSpent > 0 ? ((user.totalWon / user.totalSpent) * 100).toFixed(2) : "0.00"}%</p>
                                    </div>
                                    <div>
                                      <p className="text-[11px]" style={{ color: "#666666" }}>Transactions</p>
                                      <p className="text-[16px] font-bold" style={{ color: "#A0A0A0" }}>{user.transactions.length}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Transaction History */}
                                <div className="rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                  <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "#666666" }}>Recent Transactions</p>
                                  <div className="space-y-2">
                                    {user.transactions.map((tx, i) => (
                                      <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#1A1A1A" }}>
                                        <div>
                                          <p className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{tx.merchant}</p>
                                          <p className="text-[10px]" style={{ color: "#666666" }}>{tx.date} - {tx.game}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[12px] font-medium" style={{ color: "#FFFFFF" }}>{tx.amount.toFixed(2)} &#8382;</p>
                                          <p className="text-[10px] font-medium" style={{ color: tx.won > 0 ? "#22C55E" : "#666666" }}>
                                            {tx.won > 0 ? `+${tx.won.toFixed(2)} &#8382;` : "No win"}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Admin Actions */}
                              <div className="mt-4 rounded-[12px] p-4 border" style={{ background: "#111111", borderColor: "#252525" }}>
                                <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "#666666" }}>Admin Actions</p>
                                <div className="flex flex-wrap gap-2">
                                  {/* Grant XP */}
                                  <button
                                    onClick={() => setXpModal({ userId: user.id, amount: "" })}
                                    className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 active:scale-95"
                                    style={{ background: "#F9E74120", color: "#F9E741", border: "1px solid #F9E74140" }}
                                  >
                                    <StarIcon />
                                    Grant XP
                                  </button>

                                  {/* Change Level */}
                                  <button
                                    onClick={() => setLevelModal({ userId: user.id, newLevel: user.level })}
                                    className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 active:scale-95"
                                    style={{ background: "#F9E74120", color: "#F9E741", border: "1px solid #F9E74140" }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,10 7,4 12,10" /></svg>
                                    Change Level
                                  </button>

                                  {/* PIN Reset */}
                                  <button
                                    onClick={() => setPinResetModal(user.id)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 active:scale-95"
                                    style={{ background: "#A0A0A020", color: "#A0A0A0", border: "1px solid #A0A0A040" }}
                                  >
                                    <LockIcon />
                                    Reset PIN
                                  </button>

                                  {/* Block / Unblock */}
                                  <button
                                    onClick={() => setBlockModal(user.id)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all hover:brightness-110 active:scale-95"
                                    style={{
                                      background: user.status === "active" ? "#EF444420" : "#22C55E20",
                                      color: user.status === "active" ? "#EF4444" : "#22C55E",
                                      border: `1px solid ${user.status === "active" ? "#EF444440" : "#22C55E40"}`,
                                    }}
                                  >
                                    <ShieldIcon />
                                    {user.status === "active" ? "Block User" : "Unblock User"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <p className="text-[14px] font-medium" style={{ color: "#666666" }}>No users found</p>
                        <p className="text-[12px] mt-1" style={{ color: "#444444" }}>Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
              ))}

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

      {/* ── XP GRANT MODAL ── */}
      {xpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setXpModal(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-[90%] max-w-[360px]" style={{ background: "#111111", border: "1px solid #252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <StarIcon />
              <h3 className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>Grant XP</h3>
            </div>
            <p className="text-[12px] mb-3" style={{ color: "#666666" }}>
              User: {users.find((u) => u.id === xpModal.userId)?.name}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[14px] font-bold" style={{ color: "#F9E741" }}>XP</span>
              <input
                type="number"
                value={xpModal.amount}
                onChange={(e) => setXpModal({ ...xpModal, amount: e.target.value })}
                placeholder="Amount"
                className="flex-1 text-[18px] font-bold rounded-[8px] px-3 py-2 outline-none"
                style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const amt = parseInt(xpModal.amount);
                  if (amt > 0) handleGrantXp(xpModal.userId, amt);
                }}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95"
                style={{ background: "#F9E741", color: "#000000" }}
              >
                Confirm
              </button>
              <button onClick={() => setXpModal(null)} className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEVEL CHANGE MODAL ── */}
      {levelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setLevelModal(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-[90%] max-w-[360px]" style={{ background: "#111111", border: "1px solid #252525" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold mb-2" style={{ color: "#FFFFFF" }}>Change Level</h3>
            <p className="text-[12px] mb-3" style={{ color: "#666666" }}>
              User: {users.find((u) => u.id === levelModal.userId)?.name}
            </p>
            <p className="text-[11px] mb-2" style={{ color: "#666666" }}>
              Current Level: <span style={{ color: "#F9E741" }}>{users.find((u) => u.id === levelModal.userId)?.level}</span>
            </p>
            <select
              value={levelModal.newLevel}
              onChange={(e) => setLevelModal({ ...levelModal, newLevel: parseInt(e.target.value) })}
              className="w-full rounded-[8px] px-3 py-3 text-[14px] font-bold outline-none mb-4 appearance-none"
              style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525" }}
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((lvl) => (
                <option key={lvl} value={lvl}>Level {lvl}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => handleChangeLevel(levelModal.userId, levelModal.newLevel)}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95"
                style={{ background: "#F9E741", color: "#000000" }}
              >
                Confirm
              </button>
              <button onClick={() => setLevelModal(null)} className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PIN RESET MODAL ── */}
      {pinResetModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPinResetModal(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-[90%] max-w-[360px]" style={{ background: "#111111", border: "1px solid #252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <LockIcon />
              <h3 className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>Reset PIN</h3>
            </div>
            <p className="text-[13px] mb-4 leading-relaxed" style={{ color: "#A0A0A0" }}>
              Are you sure you want to reset the PIN for <span className="font-bold text-white">{users.find((u) => u.id === pinResetModal)?.name}</span>? They will need to set a new PIN on next login.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePinReset(pinResetModal)}
                className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95"
                style={{ background: "#F9E741", color: "#000000" }}
              >
                Reset PIN
              </button>
              <button onClick={() => setPinResetModal(null)} className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK/UNBLOCK CONFIRM MODAL ── */}
      {blockModal !== null && (() => {
        const targetUser = users.find((u) => u.id === blockModal);
        const isBlocking = targetUser?.status === "active";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setBlockModal(null)}>
            <div className="absolute inset-0 bg-black/70" />
            <div className="relative rounded-[16px] p-6 w-[90%] max-w-[360px] border-2" style={{ background: "#111111", borderColor: isBlocking ? "#EF4444" : "#22C55E" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-3">
                {isBlocking ? <WarningIcon /> : <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4,10 8,14 16,6" /></svg>}
                <h3 className="text-[16px] font-bold" style={{ color: isBlocking ? "#EF4444" : "#22C55E" }}>
                  {isBlocking ? "Block User" : "Unblock User"}
                </h3>
              </div>
              <p className="text-[13px] mb-4 leading-relaxed" style={{ color: "#A0A0A0" }}>
                {isBlocking
                  ? <>Are you sure you want to block <span className="font-bold text-white">{targetUser?.name}</span>? They will not be able to use the app.</>
                  : <>Are you sure you want to unblock <span className="font-bold text-white">{targetUser?.name}</span>? They will regain access to the app.</>
                }
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleBlock(blockModal)}
                  className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95"
                  style={{ background: isBlocking ? "#EF4444" : "#22C55E", color: "#FFFFFF" }}
                >
                  {isBlocking ? "Block" : "Unblock"}
                </button>
                <button onClick={() => setBlockModal(null)} className="flex-1 py-3 rounded-[8px] text-[14px] font-bold transition-all active:scale-95" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
