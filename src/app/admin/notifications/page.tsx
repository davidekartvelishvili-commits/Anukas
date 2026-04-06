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
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "Notifications", id: "notifications", href: "/admin/notifications" },
  { label: "Analytics", id: "analytics", href: "/admin/analytics" },
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── MOCK DATA ── */
interface Notification {
  id: number;
  date: string;
  title: string;
  message: string;
  target: "all" | "user";
  targetUser?: string;
  sentCount: number;
  status: "delivered" | "failed";
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, date: "2026-03-29 14:30", title: "სისტემური განახლება", message: "პლატფორმა განახლდა ახალი ფუნქციონალით. გთხოვთ შეამოწმოთ თქვენი პროფილი და დარწმუნდით, რომ ყველაფერი სწორად მუშაობს.", target: "all", sentCount: 12480, status: "delivered" },
  { id: 2, date: "2026-03-29 12:15", title: "ბონუს კამპანია", message: "დღეს ყველა გადახდაზე x2 ქეშბექი! არ გამოტოვოთ ეს შესაძლებლობა და ისარგებლეთ გაზრდილი ქეშბექით.", target: "all", sentCount: 12480, status: "delivered" },
  { id: 3, date: "2026-03-28 18:00", title: "თქვენი ქეშბექი მზადაა", message: "თქვენ დაგროვდათ 45.50 ლარი ქეშბექი. გადადით აპლიკაციაში და გაიტანეთ თანხა თქვენს ანგარიშზე.", target: "user", targetUser: "giorgi.k@mail.com", sentCount: 1, status: "delivered" },
  { id: 4, date: "2026-03-28 10:00", title: "ახალი მერჩანტი", message: "Glovo-ში გადახდისას ახლა 5% ქეშბექს მიიღებთ! დაიწყეთ შეკვეთა და ისარგებლეთ ბონუსით.", target: "all", sentCount: 12478, status: "delivered" },
  { id: 5, date: "2026-03-27 16:45", title: "უსაფრთხოების შეტყობინება", message: "თქვენს ანგარიშზე უჩვეულო აქტივობა დაფიქსირდა. გთხოვთ შეცვალოთ პაროლი უსაფრთხოების მიზნით.", target: "user", targetUser: "nino.m@gmail.com", sentCount: 1, status: "delivered" },
  { id: 6, date: "2026-03-27 09:30", title: "კვირის სპეციალური შეთავაზება", message: "ამ კვირას მაკდონალდსში 10% ქეშბექი! მოიწვიეთ მეგობრებიც და მიიღეთ დამატებითი ბონუსი.", target: "all", sentCount: 12475, status: "delivered" },
  { id: 7, date: "2026-03-26 20:00", title: "სოფლის თამაშის განახლება", message: "სოფლის თამაშს ახალი შენობები დაემატა! შედით და აშენეთ ახალი სტრუქტურები თქვენს სოფელში.", target: "all", sentCount: 11200, status: "failed" },
  { id: 8, date: "2026-03-26 14:20", title: "გადახდის წარუმატებლობა", message: "თქვენი ბოლო გადახდა ვერ დამუშავდა. გთხოვთ სცადოთ თავიდან ან დაუკავშირდით მხარდაჭერის ჯგუფს.", target: "user", targetUser: "dato.b@yahoo.com", sentCount: 1, status: "delivered" },
  { id: 9, date: "2026-03-25 11:00", title: "აპლიკაციის განახლება", message: "ახალი ვერსია ხელმისაწვდომია! განაახლეთ აპლიკაცია უახლესი ფუნქციონალისა და გაუმჯობესებული სტაბილურობისთვის.", target: "all", sentCount: 12470, status: "delivered" },
  { id: 10, date: "2026-03-25 08:15", title: "მოგების მიღება", message: "გილოცავთ! თამაშში 25.00 ლარი მოიგეთ. თანხა ავტომატურად დაემატა თქვენს ბალანსს.", target: "user", targetUser: "ana.t@gmail.com", sentCount: 1, status: "delivered" },
  { id: 11, date: "2026-03-24 17:30", title: "ტექნიკური სამუშაოები", message: "26 მარტს, 02:00-04:00 საათებში იგეგმება ტექნიკური სამუშაოები. აპლიკაცია დროებით მიუწვდომელი იქნება.", target: "all", sentCount: 12465, status: "delivered" },
  { id: 12, date: "2026-03-24 10:00", title: "რეფერალის ბონუსი", message: "თქვენმა მეგობარმა დარეგისტრირდა თქვენი ლინკით! 5.00 ლარი ბონუსი დაემატა თქვენს ანგარიშს.", target: "user", targetUser: "luka.g@mail.com", sentCount: 1, status: "delivered" },
  { id: 13, date: "2026-03-23 15:00", title: "Black Friday წინასწარი", message: "მზად იყავით Black Friday-სთვის! 29 მარტიდან ყველა მერჩანტზე გაორმაგებული ქეშბექი გელოდებათ.", target: "all", sentCount: 10800, status: "failed" },
  { id: 14, date: "2026-03-23 09:45", title: "ანგარიშის ვერიფიკაცია", message: "თქვენი ანგარიშის ვერიფიკაცია წარმატებით დასრულდა. ახლა შეგიძლიათ ისარგებლოთ ყველა ფუნქციით.", target: "user", targetUser: "mari.s@outlook.com", sentCount: 1, status: "delivered" },
  { id: 15, date: "2026-03-22 13:00", title: "ახალი თამაშის რეჟიმი", message: "Spin & Win თამაშში ახალი რეჟიმი დაემატა! სცადეთ ახალი ბონუს რაუნდი და მოიგეთ x5 მეტი.", target: "all", sentCount: 12450, status: "delivered" },
];

const ITEMS_PER_PAGE = 6;

export default function NotificationsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Send form
  const [targetType, setTargetType] = useState<"all" | "user">("all");
  const [userSearch, setUserSearch] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // History
  const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const paginatedNotifs = notifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSend = () => {
    setSendSuccess(true);
    setShowConfirmModal(false);
    setNotifTitle("");
    setNotifMessage("");
    setUserSearch("");
    setTargetType("all");
    setTimeout(() => setSendSuccess(false), 3000);
  };

  const canSend = notifTitle.trim() && notifMessage.trim() && (targetType === "all" || userSearch.trim());

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "..." : text;

  const ACTIVE_ID = "notifications";

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
            <nav className="flex-1 py-3">
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 7.5a5 5 0 10-10 0c0 5.5-2.5 7.5-2.5 7.5h15s-2.5-2-2.5-7.5" />
                <path d="M8.5 17a2 2 0 003 0" />
              </svg>
              <h2 className="text-[16px] font-extrabold tracking-wider" style={{ color: "#F9E741" }}>NOTIFICATIONS</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
              {notifications.length} total
            </span>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-4">

          {/* ═══ SUCCESS BANNER ═══ */}
          {sendSuccess && (
            <div className="rounded-[12px] p-4 border flex items-center gap-3" style={{ background: "#22C55E10", borderColor: "#22C55E40" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8" />
                <polyline points="7,10 9,12 13,8" />
              </svg>
              <p className="text-[13px] font-medium" style={{ color: "#22C55E" }}>შეტყობინება წარმატებით გაიგზავნა!</p>
            </div>
          )}

          {/* ═══ SECTION 1: SEND NOTIFICATION ═══ */}
          <div className="rounded-[12px] p-5 border" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 2L8 10" />
                <path d="M16 2l-5 14-3-6-6-3 14-5z" />
              </svg>
              <p className="text-[14px] font-bold" style={{ color: "#FFFFFF" }}>შეტყობინების გაგზავნა</p>
            </div>

            {/* Target selection */}
            <div className="mb-4">
              <p className="text-[12px] font-medium mb-2" style={{ color: "#A0A0A0" }}>მიმღები</p>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all"
                    style={{ borderColor: targetType === "all" ? "#F9E741" : "#252525", background: targetType === "all" ? "#F9E74120" : "transparent" }}
                    onClick={() => setTargetType("all")}
                  >
                    {targetType === "all" && <div className="w-[8px] h-[8px] rounded-full" style={{ background: "#F9E741" }} />}
                  </div>
                  <span className="text-[13px] transition-all" style={{ color: targetType === "all" ? "#FFFFFF" : "#A0A0A0" }} onClick={() => setTargetType("all")}>
                    ყველას
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all"
                    style={{ borderColor: targetType === "user" ? "#F9E741" : "#252525", background: targetType === "user" ? "#F9E74120" : "transparent" }}
                    onClick={() => setTargetType("user")}
                  >
                    {targetType === "user" && <div className="w-[8px] h-[8px] rounded-full" style={{ background: "#F9E741" }} />}
                  </div>
                  <span className="text-[13px] transition-all" style={{ color: targetType === "user" ? "#FFFFFF" : "#A0A0A0" }} onClick={() => setTargetType("user")}>
                    კონკრეტული მომხმარებელი
                  </span>
                </label>
              </div>
            </div>

            {/* User search (conditional) */}
            {targetType === "user" && (
              <div className="mb-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="7" cy="7" r="4.5" />
                    <line x1="10.5" y1="10.5" x2="14" y2="14" />
                  </svg>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="მომხმარებლის ძიება (email, ტელეფონი, ID)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-[8px] text-[13px] outline-none transition-all focus:ring-1"
                    style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525", caretColor: "#F9E741" }}
                    onFocus={(e) => (e.target.style.borderColor = "#F9E741")}
                    onBlur={(e) => (e.target.style.borderColor = "#252525")}
                  />
                </div>
              </div>
            )}

            {/* Title input */}
            <div className="mb-3">
              <p className="text-[12px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>სათაური</p>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="შეტყობინების სათაური..."
                className="w-full px-4 py-2.5 rounded-[8px] text-[13px] outline-none transition-all focus:ring-1"
                style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525", caretColor: "#F9E741" }}
                onFocus={(e) => (e.target.style.borderColor = "#F9E741")}
                onBlur={(e) => (e.target.style.borderColor = "#252525")}
              />
            </div>

            {/* Message textarea */}
            <div className="mb-4">
              <p className="text-[12px] font-medium mb-1.5" style={{ color: "#A0A0A0" }}>ტექსტი</p>
              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="შეტყობინების ტექსტი..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-[8px] text-[13px] outline-none transition-all focus:ring-1 resize-none"
                style={{ background: "#1A1A1A", color: "#FFFFFF", border: "1px solid #252525", caretColor: "#F9E741" }}
                onFocus={(e) => (e.target.style.borderColor = "#F9E741")}
                onBlur={(e) => (e.target.style.borderColor = "#252525")}
              />
              <p className="text-[11px] text-right mt-1" style={{ color: "#666666" }}>{notifMessage.length} / 500</p>
            </div>

            {/* Send button */}
            <button
              onClick={() => canSend && setShowConfirmModal(true)}
              className="w-full md:w-auto px-8 py-3 rounded-[12px] text-[14px] font-bold transition-all active:scale-[0.97]"
              style={{
                background: canSend ? "#F9E741" : "#252525",
                color: canSend ? "#000000" : "#666666",
                cursor: canSend ? "pointer" : "not-allowed",
                boxShadow: canSend ? "0 0 20px rgba(249,231,65,0.2)" : "none",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2L7 9" />
                  <path d="M14 2l-4.5 12-2.5-5.5L2 6l12-4z" />
                </svg>
                გაგზავნა
              </span>
            </button>
          </div>

          {/* ═══ SECTION 2: HISTORY TABLE ═══ */}
          <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#252525" }}>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <polyline points="8,4 8,8 11,10" />
                </svg>
                <p className="text-[13px] font-bold" style={{ color: "#FFFFFF" }}>ისტორია</p>
              </div>
              <p className="text-[11px]" style={{ color: "#666666" }}>
                {notifications.length} შეტყობინება
              </p>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #252525" }}>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>თარიღი</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>სათაური</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>ტექსტი</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>მიმღები</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>გაგზ.</th>
                    <th className="text-center px-4 py-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>სტატუსი</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedNotifs.map((n) => (
                    <tr
                      key={n.id}
                      onClick={() => setSelectedNotif(n)}
                      className="transition-all cursor-pointer"
                      style={{ borderBottom: "1px solid #1A1A1A" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1A")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: "#666666" }}>{n.date}</td>
                      <td className="px-4 py-3 text-[13px] font-medium" style={{ color: "#FFFFFF" }}>{n.title}</td>
                      <td className="px-4 py-3 text-[12px] max-w-[200px]" style={{ color: "#A0A0A0" }}>{truncate(n.message, 50)}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{
                          background: n.target === "all" ? "#F9E74115" : "#3B82F615",
                          color: n.target === "all" ? "#F9E741" : "#3B82F6",
                        }}>
                          {n.target === "all" ? "ყველა" : n.targetUser || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-right font-medium" style={{ color: "#A0A0A0" }}>{n.sentCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{
                          background: n.status === "delivered" ? "#22C55E15" : "#EF444415",
                          color: n.status === "delivered" ? "#22C55E" : "#EF4444",
                        }}>
                          {n.status === "delivered" ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2.5,6 5,8.5 9.5,4" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="3" y1="3" x2="9" y2="9" />
                              <line x1="9" y1="3" x2="3" y2="9" />
                            </svg>
                          )}
                          {n.status === "delivered" ? "delivered" : "failed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "#1A1A1A" }}>
              {paginatedNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotif(n)}
                  className="px-4 py-3 transition-all active:scale-[0.99] cursor-pointer"
                  style={{ borderColor: "#1A1A1A" }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[13px] font-medium" style={{ color: "#FFFFFF" }}>{n.title}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2" style={{
                      background: n.status === "delivered" ? "#22C55E15" : "#EF444415",
                      color: n.status === "delivered" ? "#22C55E" : "#EF4444",
                    }}>
                      {n.status === "delivered" ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="2,5 4,7 8,3" /></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2.5" y1="2.5" x2="7.5" y2="7.5" /><line x1="7.5" y1="2.5" x2="2.5" y2="7.5" /></svg>
                      )}
                      {n.status}
                    </span>
                  </div>
                  <p className="text-[12px] mb-2" style={{ color: "#A0A0A0" }}>{truncate(n.message, 60)}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: "#666666" }}>{n.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                        background: n.target === "all" ? "#F9E74115" : "#3B82F615",
                        color: n.target === "all" ? "#F9E741" : "#3B82F6",
                      }}>
                        {n.target === "all" ? "ყველა" : "user"}
                      </span>
                      <span className="text-[10px]" style={{ color: "#666666" }}>{n.sentCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#252525" }}>
              <p className="text-[11px]" style={{ color: "#666666" }}>
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, notifications.length)} / {notifications.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                  style={{ background: currentPage === 1 ? "transparent" : "#1A1A1A", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={currentPage === 1 ? "#333333" : "#A0A0A0"} strokeWidth="2" strokeLinecap="round"><polyline points="9,3 5,7 9,11" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-[12px] font-medium transition-all"
                    style={{
                      background: page === currentPage ? "#F9E741" : "#1A1A1A",
                      color: page === currentPage ? "#000000" : "#A0A0A0",
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                  style={{ background: currentPage === totalPages ? "transparent" : "#1A1A1A", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={currentPage === totalPages ? "#333333" : "#A0A0A0"} strokeWidth="2" strokeLinecap="round"><polyline points="5,3 9,7 5,11" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── CONFIRM SEND MODAL ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirmModal(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-full max-w-[420px]" style={{ background: "#111111", border: "1px solid #252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2L9 11" />
                <path d="M18 2l-5 16-3.5-7.5L2 7l16-5z" />
              </svg>
              <h3 className="text-[16px] font-bold" style={{ color: "#FFFFFF" }}>გაგზავნის დადასტურება</h3>
            </div>

            {/* Preview */}
            <div className="rounded-[8px] p-4 mb-4" style={{ background: "#1A1A1A", border: "1px solid #252525" }}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#666666" }}>Preview</p>
              </div>
              <p className="text-[14px] font-bold mb-1" style={{ color: "#FFFFFF" }}>{notifTitle}</p>
              <p className="text-[12px] leading-relaxed mb-3" style={{ color: "#A0A0A0" }}>{notifMessage}</p>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="5" r="2.5" />
                  <path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" />
                </svg>
                <p className="text-[11px]" style={{ color: "#666666" }}>
                  {targetType === "all" ? "ყველა მომხმარებელი (~12,480)" : userSearch}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSend}
                className="flex-1 py-3 rounded-[12px] text-[14px] font-bold transition-all active:scale-[0.97]"
                style={{ background: "#F9E741", color: "#000000" }}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="2.5,7 5.5,10 11.5,4" /></svg>
                  დადასტურება
                </span>
              </button>
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-[12px] text-[14px] font-bold transition-all active:scale-[0.97]" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
                გაუქმება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FULL MESSAGE MODAL ── */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedNotif(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative rounded-[16px] p-6 w-full max-w-[480px]" style={{ background: "#111111", border: "1px solid #252525" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px]" style={{ color: "#666666" }}>{selectedNotif.date}</p>
              <button onClick={() => setSelectedNotif(null)} className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-[#1A1A1A]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="3" x2="11" y2="11" /><line x1="11" y1="3" x2="3" y2="11" />
                </svg>
              </button>
            </div>

            <h3 className="text-[18px] font-bold mb-3" style={{ color: "#FFFFFF" }}>{selectedNotif.title}</h3>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#A0A0A0" }}>{selectedNotif.message}</p>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{
                background: selectedNotif.target === "all" ? "#F9E74115" : "#3B82F615",
                color: selectedNotif.target === "all" ? "#F9E741" : "#3B82F6",
              }}>
                {selectedNotif.target === "all" ? "ყველა" : selectedNotif.targetUser || "user"}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{
                background: selectedNotif.status === "delivered" ? "#22C55E15" : "#EF444415",
                color: selectedNotif.status === "delivered" ? "#22C55E" : "#EF4444",
              }}>
                {selectedNotif.status === "delivered" ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="2.5,6 5,8.5 9.5,4" /></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="3" x2="9" y2="9" /><line x1="9" y1="3" x2="3" y2="9" /></svg>
                )}
                {selectedNotif.status}
              </span>
              <span className="text-[11px]" style={{ color: "#666666" }}>
                {selectedNotif.sentCount.toLocaleString()} sent
              </span>
            </div>

            <button onClick={() => setSelectedNotif(null)} className="w-full py-2.5 rounded-[8px] text-[13px] font-medium transition-all active:scale-[0.97]" style={{ background: "#1A1A1A", color: "#A0A0A0" }}>
              დახურვა
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
