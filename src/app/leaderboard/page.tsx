"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import BackHeader from "@/components/BackHeader";
import BottomNav from "@/components/BottomNav";
import Icon from "@/components/Icon";
import AuthGuard from "@/components/AuthGuard";

/* ───────── LEVEL SYSTEM ───────── */

const LEVELS: Record<number, { name: string; color: string }> = {
  1: { name: "ბრინჯაო", color: "#CD7F32" },
  2: { name: "ვერცხლი", color: "#A8A9AD" },
  3: { name: "ოქრო", color: "#FFD700" },
  4: { name: "პლატინა", color: "#00CED1" },
  5: { name: "ბრილიანტი", color: "#FF4500" },
};

const RANK_COLORS = ["#FFD700", "#A8A9AD", "#CD7F32"];

/* ───────── SVG ICONS ───────── */

function ChevronDownIcon({ color = "#64748B", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 5.5l3.5 3.5 3.5-3.5" />
    </svg>
  );
}

function CrownIcon({ size = 20, color = "#FFD700" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M2 14l2.5-7 4 3.5L10 3l1.5 7.5 4-3.5L18 14H2z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3 15h14v1.5a1 1 0 01-1 1H4a1 1 0 01-1-1V15z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

function MedalIcon({ color = "#A8A9AD" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="10" r="4.5" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.2" />
      <path d="M5 2l1.5 5M11 2l-1.5 5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.5 9l1 1.5L10 8.5" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DiamondIcon({ size = 12, color = "#FF4500" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M6 1L10.5 5L6 11L1.5 5L6 1z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1" strokeLinejoin="round" />
      <path d="M1.5 5h9" stroke={color} strokeWidth="0.8" />
      <path d="M4 1l-2.5 4M8 1l2.5 4M6 1v10" stroke={color} strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}

function QuestionIcon({ color = "#94A3B8" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7" />
      <path d="M7 7a2 2 0 013.5 1.5c0 1.5-2 1.5-2 3" />
      <circle cx="9" cy="13.5" r="0.5" fill={color} stroke="none" />
    </svg>
  );
}

/* ───────── MOCK DATA ───────── */

interface LeaderUser {
  id: number;
  name: string;
  refs: number;
  level: number;
}

const USERS: LeaderUser[] = [
  { id: 1, name: "ნინო მამულაშვილი", refs: 1847, level: 5 },
  { id: 2, name: "დავით კაპანაძე", refs: 1612, level: 5 },
  { id: 3, name: "მარიამ ბერიძე", refs: 1523, level: 5 },
  { id: 4, name: "გიორგი ჩიკვაიძე", refs: 487, level: 4 },
  { id: 5, name: "ანა გელაშვილი", refs: 312, level: 4 },
  { id: 6, name: "ლუკა თევდორაძე", refs: 198, level: 3 },
  { id: 7, name: "სოფო მაისურაძე", refs: 145, level: 3 },
  { id: 8, name: "ნიკა ხარაიშვილი", refs: 89, level: 3 },
  { id: 9, name: "თამარ წერეთელი", refs: 76, level: 2 },
  { id: 10, name: "ალექსანდრე ლომიძე", refs: 54, level: 2 },
  { id: 11, name: "ელენე ჯაფარიძე", refs: 43, level: 2 },
  { id: 12, name: "ბექა სულაბერიძე", refs: 38, level: 2 },
  { id: 13, name: "ქეთი ნოზაძე", refs: 31, level: 2 },
  { id: 14, name: "ზურაბ მაღრაძე", refs: 28, level: 1 },
  { id: 15, name: "ნათია ბუჩუკური", refs: 25, level: 1 },
  { id: 16, name: "ირაკლი მჭედლიშვილი", refs: 22, level: 1 },
  { id: 17, name: "მაკა ხუციშვილი", refs: 19, level: 1 },
  { id: 18, name: "შოთა ქვარცხავა", refs: 17, level: 1 },
  { id: 19, name: "ლიზა ფაღავა", refs: 15, level: 1 },
  { id: 20, name: "გიგა ხეთაგური", refs: 14, level: 1 },
];

const MY_RANK = 42;
const MY_USER: LeaderUser = { id: 99, name: "გიორგი", refs: 12, level: 2 };

/* ───────── HELPERS ───────── */

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#14B8A6"];
  return colors[Math.abs(hash) % colors.length];
}

function LevelBadge({ level, small }: { level: number; small?: boolean }) {
  const lvl = LEVELS[level];
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${small ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]"}`}
      style={{ fontFamily: "var(--font-outfit)", background: `${lvl.color}15`, color: lvl.color }}
    >
      Lv.{level}
    </span>
  );
}

/* ───────── MAIN ───────── */

export default function LeaderboardPage() {
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState(1); // 0=week, 1=month, 2=all
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const top3 = USERS.slice(0, 3);
  const restUsers = USERS.slice(3);
  const influencers = USERS.filter((u) => u.refs >= 1500);

  const totalParticipants = USERS.length + 30; // mock extras
  const totalRefs = USERS.reduce((s, u) => s + u.refs, 0) + MY_USER.refs;
  const avgRefs = Math.round(totalRefs / totalParticipants);

  const periods = ["ეს კვირა", "ეს თვე", "ყველა დრო"];

  const stagger = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.45s ease-out ${i * 0.08}s`,
  });

  return (
    <AuthGuard>
    <main className="min-h-[100dvh] bg-[#0A0F1C] pb-[110px]">
      <div className="max-w-[430px] mx-auto px-5" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>

        {/* ── Header ── */}
        <div style={stagger(0)}>
          <BackHeader
            title="ლიდერბორდი"
            rightAction={
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] transition-all duration-200 hover:bg-[#1C2539] active:scale-95" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
                <span className="text-[13px] text-[#CBD5E1] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>მარტი 2026</span>
                <ChevronDownIcon />
              </button>
            }
          />
        </div>

        {/* ── Period tabs ── */}
        <div className="flex gap-2 mb-5" style={stagger(1)}>
          {periods.map((p, i) => (
            <button
              key={p}
              onClick={() => setActivePeriod(i)}
              className="flex-1 py-2 rounded-[10px] text-[13px] font-bold text-center transition-all duration-200 active:scale-95"
              style={{
                fontFamily: "var(--font-dm-sans)",
                background: activePeriod === i ? "#00E88F" : "#141B2D",
                color: activePeriod === i ? "#0A0F1C" : "#94A3B8",
                border: `1px solid ${activePeriod === i ? "#00E88F" : "#1C2539"}`,
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* ══════ TOP 3 PODIUM ══════ */}
        <div className="rounded-[20px] p-6 pt-8 mb-4" style={{ ...stagger(2), background: "#141B2D", border: "1px solid #1C2539" }}>
          <div className="flex items-end justify-center gap-3">
            {/* #2 — Left */}
            <div className="flex flex-col items-center flex-1">
              <MedalIcon color="#A8A9AD" />
              <div className="relative mt-1">
                <div
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[16px] font-bold"
                  style={{ fontFamily: "var(--font-outfit)", background: nameToColor(top3[1].name) + "20", color: nameToColor(top3[1].name), border: "2.5px solid #A8A9AD" }}
                >
                  {getInitials(top3[1].name)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold" style={{ fontFamily: "var(--font-outfit)", background: "#A8A9AD", color: "#0A0F1C" }}>2</div>
              </div>
              <p className="text-[13px] font-bold text-[#F1F5F9] mt-2 text-center leading-tight truncate max-w-[80px]" style={{ fontFamily: "var(--font-dm-sans)" }}>{top3[1].name.split(" ")[0]}</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>{top3[1].refs} რეფერალი</p>
              <div className="mt-1.5"><LevelBadge level={top3[1].level} small /></div>
            </div>

            {/* #1 — Center (raised) */}
            <div className="flex flex-col items-center flex-1 -mt-6">
              <CrownIcon size={24} />
              <div className="relative mt-1">
                <div
                  className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[20px] font-bold animate-goldGlow"
                  style={{ fontFamily: "var(--font-outfit)", background: nameToColor(top3[0].name) + "20", color: nameToColor(top3[0].name), border: "2.5px solid #FFD700" }}
                >
                  {getInitials(top3[0].name)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-[20px] h-[20px] rounded-full flex items-center justify-center text-[11px] font-bold" style={{ fontFamily: "var(--font-outfit)", background: "#FFD700", color: "#0A0F1C" }}>1</div>
              </div>
              <p className="text-[16px] font-bold text-[#F1F5F9] mt-2 text-center leading-tight truncate max-w-[90px]" style={{ fontFamily: "var(--font-dm-sans)" }}>{top3[0].name.split(" ")[0]}</p>
              <p className="text-[12px] text-[#94A3B8] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>{top3[0].refs} რეფერალი</p>
              <div className="mt-1.5"><LevelBadge level={top3[0].level} /></div>
            </div>

            {/* #3 — Right */}
            <div className="flex flex-col items-center flex-1">
              <MedalIcon color="#CD7F32" />
              <div className="relative mt-1">
                <div
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[16px] font-bold"
                  style={{ fontFamily: "var(--font-outfit)", background: nameToColor(top3[2].name) + "20", color: nameToColor(top3[2].name), border: "2.5px solid #CD7F32" }}
                >
                  {getInitials(top3[2].name)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold" style={{ fontFamily: "var(--font-outfit)", background: "#CD7F32", color: "#0A0F1C" }}>3</div>
              </div>
              <p className="text-[13px] font-bold text-[#F1F5F9] mt-2 text-center leading-tight truncate max-w-[80px]" style={{ fontFamily: "var(--font-dm-sans)" }}>{top3[2].name.split(" ")[0]}</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>{top3[2].refs} რეფერალი</p>
              <div className="mt-1.5"><LevelBadge level={top3[2].level} small /></div>
            </div>
          </div>
        </div>

        {/* ══════ YOUR RANK ══════ */}
        <div
          className="flex items-center justify-between p-3.5 rounded-[14px] mb-4"
          style={{ ...stagger(3), background: "rgba(0,232,143,0.04)", border: "1px solid rgba(0,232,143,0.12)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-[13px] font-bold shrink-0" style={{ fontFamily: "var(--font-outfit)", background: "rgba(0,232,143,0.1)", color: "#00E88F" }}>
              {MY_RANK}
            </div>
            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[14px] font-bold shrink-0" style={{ fontFamily: "var(--font-outfit)", background: "rgba(0,232,143,0.12)", color: "#00E88F", border: "2px solid rgba(0,232,143,0.3)" }}>
              {getInitials(MY_USER.name)}
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight" style={{ fontFamily: "var(--font-dm-sans)", color: "#00E88F" }}>
                {MY_USER.name} <span className="text-[#94A3B8] font-normal text-[12px]">(შენ)</span>
              </p>
              <p className="text-[11px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{MY_USER.refs} რეფერალი</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LevelBadge level={MY_USER.level} />
            <button onClick={() => router.push("/profile")} className="text-[#475569] hover:text-[#94A3B8] transition-colors">
              <Icon name="arrow-right" size={16} color="#475569" />
            </button>
          </div>
        </div>

        {/* ══════ STATS BAR ══════ */}
        <div className="grid grid-cols-3 rounded-[12px] overflow-hidden mb-5" style={{ ...stagger(4), background: "#141B2D", border: "1px solid #1C2539" }}>
          <div className="p-3 text-center" style={{ borderRight: "1px solid #1C2539" }}>
            <p className="text-[12px] text-[#475569] mb-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>მონაწილეები</p>
            <p className="text-[15px] font-bold text-[#F1F5F9]" style={{ fontFamily: "var(--font-outfit)" }}>{totalParticipants}</p>
          </div>
          <div className="p-3 text-center" style={{ borderRight: "1px solid #1C2539" }}>
            <p className="text-[12px] text-[#475569] mb-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>ჯამ. რეფერალი</p>
            <p className="text-[15px] font-bold text-[#F1F5F9]" style={{ fontFamily: "var(--font-outfit)" }}>{totalRefs.toLocaleString()}</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[12px] text-[#475569] mb-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>საშ. რეფერალი</p>
            <p className="text-[15px] font-bold text-[#F1F5F9]" style={{ fontFamily: "var(--font-outfit)" }}>{avgRefs}</p>
          </div>
        </div>

        {/* ══════ FULL RANKING LIST (4+) ══════ */}
        <div className="flex flex-col gap-1.5 mb-6" style={stagger(5)}>
          {restUsers.map((user, idx) => {
            const rank = idx + 4;
            const isTop10 = rank <= 10;
            const isInfluencer = user.refs >= 1500;
            const borderLeftColor = isTop10
              ? rank <= 5 ? "#FFD700" : rank <= 7 ? "#A8A9AD" : "#CD7F32"
              : undefined;

            return (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-[12px] py-3 px-3.5 transition-all duration-200"
                style={{
                  background: "#141B2D",
                  border: "1px solid #1C2539",
                  borderLeft: isTop10 ? `3px solid ${borderLeftColor}` : "1px solid #1C2539",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(12px)",
                  transition: `all 0.35s ease-out ${(6 + idx * 0.04) * 0.08}s`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ fontFamily: "var(--font-outfit)", background: "#1C2539", color: isTop10 ? "#F1F5F9" : "#475569" }}
                  >
                    {rank}
                  </div>
                  <div
                    className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ fontFamily: "var(--font-outfit)", background: nameToColor(user.name) + "20", color: nameToColor(user.name) }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-[14px] font-bold text-[#F1F5F9] leading-tight truncate max-w-[130px]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {user.name.split(" ")[0]} {user.name.split(" ")[1]?.[0]}.
                      </p>
                      {isInfluencer && <DiamondIcon />}
                    </div>
                    <p className="text-[11px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{user.refs} რეფერალი</p>
                  </div>
                </div>
                <LevelBadge level={user.level} small />
              </div>
            );
          })}
        </div>

        {/* ══════ INFLUENCER SECTION ══════ */}
        <div className="mb-6" style={stagger(7)}>
          <div className="flex items-center gap-2 mb-3">
            <DiamondIcon size={16} />
            <span className="text-[16px] font-bold text-[#F1F5F9]" style={{ fontFamily: "var(--font-outfit)" }}>ინფლუენსერები</span>
          </div>

          <div className="rounded-[16px] overflow-hidden" style={{ background: "linear-gradient(135deg, #141B2D, #1C1F10)", border: "1px solid rgba(255,69,0,0.12)" }}>
            <div className="px-4 pt-3.5 pb-2">
              <p className="text-[13px] text-[#94A3B8]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                1500+ რეფერალით მიიღე ინფლუენსერის სტატუსი
              </p>
            </div>

            {influencers.map((user, i) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: "1px solid rgba(255,69,0,0.08)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                    style={{ fontFamily: "var(--font-outfit)", background: nameToColor(user.name) + "20", color: nameToColor(user.name), border: "2px solid rgba(255,69,0,0.3)" }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[14px] font-bold text-[#F1F5F9] leading-tight" style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {user.name.split(" ")[0]} {user.name.split(" ")[1]?.[0]}.
                      </p>
                      <DiamondIcon />
                    </div>
                    <p className="text-[11px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{user.refs} რეფერალი</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LevelBadge level={user.level} small />
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ fontFamily: "var(--font-outfit)", background: "rgba(255,69,0,0.12)", color: "#FF4500" }}>
                    ინფლუენსერი
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════ HOW IT WORKS ══════ */}
        <div className="rounded-[14px] overflow-hidden mb-6" style={{ ...stagger(8), background: "#141B2D", border: "1px solid #1C2539" }}>
          <button
            onClick={() => setHowItWorksOpen(!howItWorksOpen)}
            className="w-full flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-[#1C2539]/30"
          >
            <div className="flex items-center gap-2">
              <QuestionIcon />
              <span className="text-[15px] text-[#F1F5F9] font-semibold" style={{ fontFamily: "var(--font-outfit)" }}>
                როგორ მუშაობს?
              </span>
            </div>
            <div className="transition-transform duration-200" style={{ transform: howItWorksOpen ? "rotate(180deg)" : "rotate(0)" }}>
              <ChevronDownIcon />
            </div>
          </button>

          <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: howItWorksOpen ? 250 : 0, opacity: howItWorksOpen ? 1 : 0 }}>
            <div className="px-4 pb-4 flex flex-col gap-3.5" style={{ borderTop: "1px solid #1C2539" }}>
              <div className="pt-3.5" />
              {[
                "გაუზიარე შენი კოდი მეგობრებს",
                "როცა დარეგისტრირდებიან, ორივეს მიიღებთ 10 XP-ს",
                "მეტი რეფერალი = მაღალი ლეველი = მეტი ქეშბექის შანსი",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold"
                    style={{ fontFamily: "var(--font-outfit)", background: "rgba(0,232,143,0.1)", color: "#00E88F" }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-[14px] text-[#CBD5E1] leading-relaxed pt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
    </AuthGuard>
  );
}
