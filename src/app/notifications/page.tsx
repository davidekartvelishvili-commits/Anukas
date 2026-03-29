"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import BackHeader from "@/components/BackHeader";
import BottomNav from "@/components/BottomNav";
import Icon from "@/components/Icon";

/* ───────── LEVELS ───────── */

const LEVELS: Record<number, { name: string; color: string }> = {
  1: { name: "ბრინჯაო", color: "#CD7F32" },
  2: { name: "ვერცხლი", color: "#A8A9AD" },
  3: { name: "ოქრო", color: "#FFD700" },
  4: { name: "პლატინა", color: "#00CED1" },
  5: { name: "ბრილიანტი", color: "#FF4500" },
};

/* ───────── SVG ICONS ───────── */

function CrownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M2 14l2.5-7 4 3.5L10 3l1.5 7.5 4-3.5L18 14H2z" fill="#FFD700" fillOpacity="0.3" stroke="#FFD700" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3 15h14v1.5a1 1 0 01-1 1H4a1 1 0 01-1-1V15z" fill="#FFD700" fillOpacity="0.2" stroke="#FFD700" strokeWidth="1.3" />
    </svg>
  );
}

function TagIcon({ color = "#FFB800" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9.5V3a1 1 0 011-1h6.5L16 8.5 9.5 15 2 9.5z" />
      <circle cx="6" cy="6" r="1" fill={color} stroke="none" />
    </svg>
  );
}

function EmptyBellIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#1C2539" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M36 16A12 12 0 0012 16c0 14-6 18-6 18h36s-6-4-6-18" />
      <path d="M27.46 38a4 4 0 01-6.92 0" />
    </svg>
  );
}

/* ───────── TYPES ───────── */

type NotifType = "win" | "jackpot" | "lost" | "levelup" | "referral" | "referral_chain" | "promotion" | "streak";
type FilterKey = "all" | "wins" | "level" | "referral" | "promo";

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  subtitle: string;
  time: string;
  date: string; // "today" | "yesterday" | "week" | "older"
  read: boolean;
  amount?: string;
  percent?: number;
  placeId?: number;
  oldLevel?: number;
  newLevel?: number;
  xp?: number;
  actionLabel?: string;
}

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "ყველა" },
  { key: "wins", label: "მოგებები" },
  { key: "level", label: "ლეველი" },
  { key: "referral", label: "რეფერალი" },
  { key: "promo", label: "აქციები" },
];

function typeToFilter(type: NotifType): FilterKey {
  if (type === "win" || type === "jackpot" || type === "lost") return "wins";
  if (type === "levelup") return "level";
  if (type === "referral" || type === "referral_chain") return "referral";
  if (type === "promotion") return "promo";
  if (type === "streak") return "level";
  return "all";
}

/* ───────── MOCK DATA ───────── */

const INITIAL_NOTIFS: Notification[] = [
  // Today
  { id: 1, type: "jackpot", title: "ჯეკპოტი — 100% ქეშბექი!", subtitle: "პური გულით-ში 5.80₾ დაგიბრუნდა", time: "12 წთ წინ", date: "today", read: false, amount: "+5.80₾", percent: 100, placeId: 3 },
  { id: 2, type: "win", title: "მოიგე 30% ქეშბექი", subtitle: "Stamba Café-ში 3.75₾ დაგიბრუნდა", time: "1 სთ წინ", date: "today", read: false, amount: "+3.75₾", percent: 30, placeId: 4 },
  { id: 3, type: "lost", title: "ამჯერად ვერ მოიგე", subtitle: "Goodwill — ცადე ხელახლა", time: "2 სთ წინ", date: "today", read: false, placeId: 5 },
  { id: 4, type: "referral", title: "ახალი რეფერალი!", subtitle: "ანა მ. შემოგვიერთდა შენი კოდით — +10 XP", time: "3 სთ წინ", date: "today", read: false, xp: 10 },
  // Yesterday
  { id: 5, type: "levelup", title: "ლეველი აიმაღლე!", subtitle: "ახლა Lv.2 ვერცხლი ხარ — შანსი გაიზარდა 75%-მდე", time: "გუშინ, 18:30", date: "yesterday", read: false, oldLevel: 1, newLevel: 2 },
  { id: 6, type: "win", title: "მოიგე 15% ქეშბექი", subtitle: "Luca Polare-ში 4.20₾ დაგიბრუნდა", time: "გუშინ, 14:15", date: "yesterday", read: false, amount: "+4.20₾", percent: 15, placeId: 6 },
  { id: 7, type: "promotion", title: "ახალი პარტნიორი!", subtitle: "Café Littera ახლა Covrd-ზეა — 20% ბონუს შანსი 3 დღით", time: "გუშინ, 10:00", date: "yesterday", read: true, placeId: 7, actionLabel: "ნახვა" },
  { id: 8, type: "referral_chain", title: "ჯაჭვური რეფერალი!", subtitle: "შენი რეფერალის რეფერალი — +5 XP", time: "გუშინ, 09:20", date: "yesterday", read: true, xp: 5 },
  // This week
  { id: 9, type: "win", title: "მოიგე 50% ქეშბექი", subtitle: "შემოხტა-ში 16.25₾ დაგიბრუნდა", time: "3 დღის წინ", date: "week", read: true, amount: "+16.25₾", percent: 50, placeId: 5 },
  { id: 10, type: "win", title: "მოიგე 20% ქეშბექი", subtitle: "Bread House-ში 0.56₾ დაგიბრუნდა", time: "4 დღის წინ", date: "week", read: true, amount: "+0.56₾", percent: 20, placeId: 6 },
  { id: 11, type: "lost", title: "ამჯერად ვერ მოიგე", subtitle: "Coffee Lab — ცადე ხელახლა", time: "4 დღის წინ", date: "week", read: true, placeId: 1 },
  { id: 12, type: "streak", title: "7-დღიანი სტრიქი!", subtitle: "ზედიზედ 7 დღე ჩეკინი — ბონუს სპინი მიღებულია", time: "5 დღის წინ", date: "week", read: true },
  { id: 13, type: "referral", title: "ახალი რეფერალი!", subtitle: "ლუკა თ. შემოგვიერთდა შენი კოდით — +10 XP", time: "6 დღის წინ", date: "week", read: true, xp: 10 },
  // Older
  { id: 14, type: "promotion", title: "სპეციალური აქცია", subtitle: "Nike Store — 2x ქეშბექის შანსი შაბათ-კვირას", time: "2 კვირის წინ", date: "older", read: true, placeId: 3, actionLabel: "ნახვა" },
  { id: 15, type: "referral", title: "ახალი რეფერალი!", subtitle: "მარიამ ბ. შემოგვიერთდა შენი კოდით — +10 XP", time: "3 კვირის წინ", date: "older", read: true, xp: 10 },
];

const DATE_LABELS: Record<string, string> = {
  today: "დღეს",
  yesterday: "გუშინ",
  week: "ამ კვირაში",
  older: "ადრინდელი",
};

/* ───────── MAIN ───────── */

export default function NotificationsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return notifs;
    return notifs.filter((n) => typeToFilter(n.type) === activeFilter);
  }, [activeFilter, notifs]);

  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    const order = ["today", "yesterday", "week", "older"];
    order.forEach((d) => {
      const items = filtered.filter((n) => n.date === d);
      if (items.length > 0) groups[d] = items;
    });
    return Object.entries(groups);
  }, [filtered]);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, wins: 0, level: 0, referral: 0, promo: 0 };
    notifs.filter((n) => !n.read).forEach((n) => {
      counts.all++;
      counts[typeToFilter(n.type)]++;
    });
    return counts;
  }, [notifs]);

  const markAllRead = useCallback(() => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: number) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleTap = (n: Notification) => {
    markRead(n.id);
    if (n.type === "win" || n.type === "jackpot" || n.type === "lost") router.push("/history");
    else if (n.type === "levelup" || n.type === "streak") router.push("/profile");
    else if (n.type === "referral" || n.type === "referral_chain") router.push("/leaderboard");
    else if (n.type === "promotion" && n.placeId) router.push(`/place/${n.placeId}`);
  };

  const getIcon = (n: Notification) => {
    switch (n.type) {
      case "win": return { icon: <Icon name="check" size={18} color="#00E88F" />, bg: "rgba(0,232,143,0.06)", border: "rgba(0,232,143,0.12)" };
      case "jackpot": return { icon: <CrownIcon />, bg: "rgba(255,215,0,0.06)", border: "rgba(255,215,0,0.12)" };
      case "lost": return { icon: <Icon name="x" size={18} color="#FF5757" />, bg: "rgba(255,87,87,0.06)", border: "rgba(255,87,87,0.12)" };
      case "levelup": {
        const c = LEVELS[n.newLevel || 2].color;
        return { icon: <Icon name="flame" size={18} color={c} />, bg: `${c}10`, border: `${c}20` };
      }
      case "referral": return { icon: <Icon name="users" size={18} color="#3B82F6" />, bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.12)" };
      case "referral_chain": return { icon: <Icon name="users" size={18} color="#60A5FA" />, bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.12)" };
      case "promotion": return { icon: <TagIcon />, bg: "rgba(255,184,0,0.06)", border: "rgba(255,184,0,0.12)" };
      case "streak": return { icon: <Icon name="star" size={18} color="#A855F7" />, bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.12)" };
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#0A0F1C] pb-[110px]">
      <div className="max-w-[430px] mx-auto px-5" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>

        {/* ── Header ── */}
        <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s" }}>
          <BackHeader
            title="შეტყობინებები"
            rightAction={
              unreadCounts.all > 0 ? (
                <button onClick={markAllRead} className="text-[13px] text-[#00E88F] font-medium hover:underline transition-opacity active:opacity-60" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  წაკითხულად მონიშვნა
                </button>
              ) : undefined
            }
          />
        </div>

        {/* ── Filter tabs ── */}
        <div
          className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "all 0.4s ease-out 0.05s" }}
        >
          {FILTER_TABS.map((tab) => {
            const count = unreadCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[13px] font-bold transition-all duration-200 active:scale-95"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  background: activeFilter === tab.key ? "#00E88F" : "#141B2D",
                  color: activeFilter === tab.key ? "#0A0F1C" : "#94A3B8",
                  border: `1px solid ${activeFilter === tab.key ? "#00E88F" : "#1C2539"}`,
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className="min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                    style={{
                      background: activeFilter === tab.key ? "#0A0F1C" : "#FF5757",
                      color: activeFilter === tab.key ? "#00E88F" : "#FFFFFF",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Notification list ── */}
        {grouped.length > 0 ? (
          <div className="flex flex-col">
            {grouped.map(([dateKey, items], gi) => (
              <div key={dateKey}>
                {/* Date header */}
                <p
                  className="text-[13px] font-bold text-[#64748B] mb-2.5 px-1"
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    marginTop: gi > 0 ? 20 : 0,
                    opacity: visible ? 1 : 0,
                    transition: `opacity 0.3s ease-out ${0.1 + gi * 0.05}s`,
                  }}
                >
                  {DATE_LABELS[dateKey]}
                </p>

                <div className="flex flex-col gap-2.5">
                  {items.map((n, ni) => {
                    const iconData = getIcon(n);
                    const isJackpot = n.type === "jackpot";
                    const isPromo = n.type === "promotion";
                    const isLost = n.type === "lost";
                    const isLevelUp = n.type === "levelup";

                    return (
                      <button
                        key={n.id}
                        onClick={() => handleTap(n)}
                        className={`w-full text-left rounded-[14px] p-3.5 transition-all duration-200 active:scale-[0.98] ${isJackpot ? "animate-jackpotGlow" : ""}`}
                        style={{
                          background: isJackpot
                            ? "linear-gradient(135deg, #141B2D, #1C1F10)"
                            : n.read ? "#141B2D" : "#0F1E2D",
                          border: isJackpot
                            ? "1px solid rgba(255,215,0,0.15)"
                            : isPromo
                            ? "1px solid #1C2539"
                            : "1px solid #1C2539",
                          borderLeft: !n.read
                            ? "3px solid #00E88F"
                            : isPromo
                            ? "3px solid #FFB800"
                            : "1px solid #1C2539",
                          opacity: visible
                            ? isLost && n.read ? 0.7 : 1
                            : 0,
                          transform: visible ? "translateY(0)" : "translateY(16px)",
                          transition: `all 0.35s ease-out ${(0.12 + gi * 0.06 + ni * 0.03)}s`,
                        }}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div
                            className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0"
                            style={{ background: iconData.bg, border: `1px solid ${iconData.border}` }}
                          >
                            {iconData.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className="text-[15px] font-bold leading-tight truncate"
                                  style={{
                                    fontFamily: "var(--font-outfit)",
                                    color: isJackpot ? "#FFD700" : "#F1F5F9",
                                  }}
                                >
                                  {n.title}
                                </p>
                                <p className="text-[13px] text-[#94A3B8] mt-1 leading-snug" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                  {isLevelUp && n.newLevel ? (
                                    <>
                                      ახლა Lv.{n.newLevel}{" "}
                                      <span style={{ color: LEVELS[n.newLevel].color, fontWeight: 600 }}>
                                        {LEVELS[n.newLevel].name}
                                      </span>{" "}
                                      ხარ — შანსი გაიზარდა 75%-მდე
                                    </>
                                  ) : (
                                    n.subtitle
                                  )}
                                </p>

                                {/* Level up progress bar */}
                                {isLevelUp && n.oldLevel && n.newLevel && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-[10px] font-bold" style={{ fontFamily: "var(--font-outfit)", color: LEVELS[n.oldLevel].color }}>
                                      Lv.{n.oldLevel}
                                    </span>
                                    <div className="flex-1 h-[6px] rounded-full bg-[#0A0F1C] overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: "100%",
                                          background: `linear-gradient(90deg, ${LEVELS[n.oldLevel].color}, ${LEVELS[n.newLevel].color})`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold" style={{ fontFamily: "var(--font-outfit)", color: LEVELS[n.newLevel].color }}>
                                      Lv.{n.newLevel}
                                    </span>
                                  </div>
                                )}

                                {/* Promo action button */}
                                {n.actionLabel && (
                                  <span
                                    className="inline-flex items-center mt-2 px-2.5 py-1 rounded-[8px] text-[12px] font-bold"
                                    style={{ fontFamily: "var(--font-dm-sans)", background: "rgba(255,184,0,0.08)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.15)" }}
                                  >
                                    {n.actionLabel}
                                  </span>
                                )}
                              </div>

                              {/* Right side */}
                              <div className="shrink-0 flex flex-col items-end gap-1">
                                <span className="text-[11px] text-[#475569] whitespace-nowrap" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                  {n.time}
                                </span>

                                {/* Amount for wins */}
                                {n.amount && (
                                  <span
                                    className="text-[13px] font-bold"
                                    style={{ fontFamily: "var(--font-dm-sans)", color: isJackpot ? "#FFD700" : "#00E88F" }}
                                  >
                                    {n.amount}
                                  </span>
                                )}

                                {/* XP badge for referrals */}
                                {n.xp && (
                                  <span
                                    className="px-2 py-0.5 rounded-[6px] text-[12px] font-bold"
                                    style={{
                                      fontFamily: "var(--font-outfit)",
                                      background: n.type === "referral_chain" ? "rgba(96,165,250,0.1)" : "rgba(59,130,246,0.1)",
                                      color: n.type === "referral_chain" ? "#60A5FA" : "#3B82F6",
                                    }}
                                  >
                                    +{n.xp} XP
                                  </span>
                                )}

                                {/* Streak badge */}
                                {n.type === "streak" && (
                                  <span
                                    className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold whitespace-nowrap"
                                    style={{ fontFamily: "var(--font-dm-sans)", background: "rgba(168,85,247,0.1)", color: "#A855F7" }}
                                  >
                                    ბონუს სპინი
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center py-20"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-out 0.15s" }}
          >
            <EmptyBellIcon />
            <p className="text-[16px] font-bold text-[#475569] mt-4" style={{ fontFamily: "var(--font-outfit)" }}>
              შეტყობინება არ არის
            </p>
            <p className="text-[13px] text-[#334155] mt-1 text-center max-w-[240px]" style={{ fontFamily: "var(--font-dm-sans)" }}>
              აქ გამოჩნდება შენი მოგებები, ლეველები და სიახლეები
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
