"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import BackHeader from "@/components/BackHeader";
import BottomNav from "@/components/BottomNav";
import Icon from "@/components/Icon";
import { apiFetch } from "@/services/api";
import AuthGuard from "@/components/AuthGuard";

/* ───────── TYPES ───────── */

interface Activity {
  type: string;
  title: string;
  description: string;
  amount?: number;
  coins?: number;
  color: string;
  createdAt: string;
}

type FilterKey = "all" | "payments" | "games" | "withdrawals" | "other";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "\u10E7\u10D5\u10D4\u10DA\u10D0" },
  { key: "payments", label: "\u10D2\u10D0\u10D3\u10D0\u10EE\u10D3\u10D4\u10D1\u10D8" },
  { key: "games", label: "\u10D7\u10D0\u10DB\u10D0\u10E8\u10D4\u10D1\u10D8" },
  { key: "withdrawals", label: "\u10D2\u10D0\u10DB\u10DD\u10E2\u10D0\u10DC\u10D4\u10D1\u10D8" },
  { key: "other", label: "\u10E1\u10EE\u10D5\u10D0" },
];

function typeToFilter(type: string): FilterKey {
  if (type === "payment") return "payments";
  if (type === "game_win" || type === "game_loss") return "games";
  if (type === "withdrawal") return "withdrawals";
  return "other";
}

/* ───────── MAIN ───────── */

export default function NotificationsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    apiFetch("/user/activity?limit=50").then((data: any) => {
      if (data.success) setActivities(data.activities || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return activities;
    return activities.filter((a) => typeToFilter(a.type) === activeFilter);
  }, [activeFilter, activities]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, { label: string; items: Activity[] }> = {};
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    filtered.forEach((a) => {
      const date = a.createdAt?.split("T")[0] || a.createdAt?.split(" ")[0] || "unknown";
      if (!groups[date]) {
        let label = date;
        if (date === today) label = "\u10D3\u10E6\u10D4\u10E1";
        else if (date === yesterday) label = "\u10D2\u10E3\u10E8\u10D8\u10DC";
        else {
          const d = new Date(date);
          label = d.toLocaleDateString("ka-GE", { day: "numeric", month: "long" });
        }
        groups[date] = { label, items: [] };
      }
      groups[date].items.push(a);
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const getIcon = (a: Activity) => {
    switch (a.type) {
      case "payment": return { icon: <Icon name="wallet" size={18} color="#3B82F6" />, bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.12)" };
      case "game_win": return { icon: <Icon name="check" size={18} color="#00E88F" />, bg: "rgba(0,232,143,0.06)", border: "rgba(0,232,143,0.12)" };
      case "game_loss": return { icon: <Icon name="x" size={18} color="#FF5757" />, bg: "rgba(255,87,87,0.06)", border: "rgba(255,87,87,0.12)" };
      case "withdrawal": return { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"><path d="M9 14V4M5 8l4-4 4 4M3 16h12" /></svg>, bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.12)" };
      case "referral": return { icon: <Icon name="users" size={18} color="#A855F7" />, bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.12)" };
      case "promo": return { icon: <Icon name="star" size={18} color="#FFB800" />, bg: "rgba(255,184,0,0.06)", border: "rgba(255,184,0,0.12)" };
      default: return { icon: <Icon name="bell" size={18} color="#94A3B8" />, bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.12)" };
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  const stagger = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `all 0.4s ease-out ${i * 0.06}s`,
  });

  return (
    <AuthGuard>
    <main className="min-h-[100dvh] bg-[#0A0F1C] pb-[110px]">
      <div className="max-w-[430px] mx-auto px-5" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>

        {/* Header */}
        <div style={stagger(0)}>
          <BackHeader title={"\u10D0\u10E5\u10E2\u10D8\u10D5\u10DD\u10D1\u10D0"} />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide" style={stagger(1)}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="shrink-0 px-3.5 py-1.5 rounded-[10px] text-[13px] font-bold transition-all duration-200 active:scale-95"
              style={{
                fontFamily: "var(--font-dm-sans)",
                background: activeFilter === tab.key ? "#00E88F" : "#141B2D",
                color: activeFilter === tab.key ? "#0A0F1C" : "#94A3B8",
                border: `1px solid ${activeFilter === tab.key ? "#00E88F" : "#1C2539"}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20" style={stagger(2)}>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00E88F", borderTopColor: "transparent" }} />
          </div>
        ) : grouped.length > 0 ? (
          <div className="flex flex-col gap-5">
            {grouped.map(([date, group], gi) => (
              <div key={date} style={stagger(2 + gi)}>
                {/* Date header */}
                <p className="text-[13px] font-bold mb-2.5 px-1" style={{ color: "#64748B", fontFamily: "var(--font-dm-sans)" }}>
                  {group.label}
                </p>

                {/* Activity cards */}
                <div className="flex flex-col gap-2">
                  {group.items.map((a, i) => {
                    const ic = getIcon(a);
                    return (
                      <button
                        key={`${date}-${i}`}
                        onClick={() => {
                          if (a.type === "game_win" || a.type === "game_loss") router.push("/history");
                          else if (a.type === "payment") router.push("/history");
                          else if (a.type === "withdrawal") router.push("/wallet");
                          else if (a.type === "referral") router.push("/referral-code");
                        }}
                        className="w-full text-left rounded-[14px] p-3.5 transition-all duration-200 active:scale-[0.98]"
                        style={{ background: "#141B2D", border: "1px solid #1C2539" }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center shrink-0"
                              style={{ background: ic.bg, border: `1px solid ${ic.border}` }}
                            >
                              {ic.icon}
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-[#F1F5F9] leading-tight" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                {a.title}
                              </p>
                              <p className="text-[12px] text-[#64748B] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                                {a.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            {a.coins && (
                              <p className="text-[13px] font-bold" style={{ color: "#FFD700", fontFamily: "var(--font-outfit)" }}>
                                +{a.coins}
                              </p>
                            )}
                            {a.amount && !a.coins && (
                              <p className="text-[13px] font-bold" style={{ color: a.color, fontFamily: "var(--font-outfit)" }}>
                                {a.type === "withdrawal" ? "-" : "+"}{a.amount.toFixed(2)}{"\u20BE"}
                              </p>
                            )}
                            <p className="text-[10px] text-[#475569] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                              {formatTime(a.createdAt)}
                            </p>
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
          <div className="flex flex-col items-center justify-center py-20" style={stagger(2)}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#1C2539" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="32" cy="32" r="24" />
              <path d="M32 18v14l8 8" />
            </svg>
            <p className="text-[16px] text-[#475569] font-medium mt-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
              {"\u10EF\u10D4\u10E0 \u10D0\u10E0 \u10D0\u10E0\u10D8\u10E1 \u10D0\u10E5\u10E2\u10D8\u10D5\u10DD\u10D1\u10D0"}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
    </AuthGuard>
  );
}
