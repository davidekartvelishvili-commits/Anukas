"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

/* ───────── SVG ICONS ───────── */

function HeartIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={filled ? "#FF5757" : "none"} stroke={filled ? "#FF5757" : "#F1F5F9"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17.5s-7-4.5-7-9a4 4 0 017-2.5 4 4 0 017 2.5c0 4.5-7 9-7 9z" />
    </svg>
  );
}

function ShareIcon({ color = "#F1F5F9", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2.5" />
      <circle cx="5" cy="9" r="2.5" />
      <circle cx="13" cy="14" r="2.5" />
      <path d="M7.3 10.2l3.4 2.6M10.7 5.2L7.3 7.8" />
    </svg>
  );
}

function PhoneIcon({ color = "#00E88F", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5H4.5A1.5 1.5 0 003 4v8a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0013 12V4a1.5 1.5 0 00-1.5-1.5H10" />
      <path d="M6 2.5h4v1.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V2.5z" />
      <circle cx="8" cy="11" r="0.5" fill={color} />
    </svg>
  );
}

function MapPinIcon({ color = "#3B82F6" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round">
      <path d="M8 1.5C5.8 1.5 4 3.3 4 5.5 4 8.5 8 14 8 14s4-5.5 4-8.5C12 3.3 10.2 1.5 8 1.5z" />
      <circle cx="8" cy="5.5" r="1.5" />
    </svg>
  );
}

function ClockIcon({ color = "#FFB800" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 2" />
    </svg>
  );
}

function UsersIcon({ color = "#94A3B8" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" />
      <circle cx="12" cy="5.5" r="2" />
      <path d="M15 14a4 4 0 00-3-3.87" />
    </svg>
  );
}

function MenuIcon({ color = "#00E88F" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h12M3 9h8M3 13h10" />
    </svg>
  );
}

function NavigateIcon({ color = "#3B82F6" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6l5-4 5 4M8 2v10" />
      <circle cx="8" cy="13.5" r="1" fill={color} />
    </svg>
  );
}

function CrownSmallIcon({ color = "#FFD700" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1.5 10l1.5-5 3 2.5L7 2l1 5.5 3-2.5 1.5 5H1.5z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function StarFull({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="#FFB800">
      <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4L7 10.3 3.4 12l.7-4L1.2 5.2l4-.6L7 1z" />
    </svg>
  );
}

function StarHalf({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14">
      <defs>
        <linearGradient id="halfStar">
          <stop offset="50%" stopColor="#FFB800" />
          <stop offset="50%" stopColor="#1C2539" />
        </linearGradient>
      </defs>
      <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4L7 10.3 3.4 12l.7-4L1.2 5.2l4-.6L7 1z" fill="url(#halfStar)" stroke="#FFB800" strokeWidth="0.5" />
    </svg>
  );
}

function StarEmpty({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="#1C2539" stroke="#475569" strokeWidth="0.8">
      <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4L7 10.3 3.4 12l.7-4L1.2 5.2l4-.6L7 1z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ───────── COMPONENTS ───────── */

function RatingStars({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<StarFull key={i} />);
    else if (rating >= i - 0.5) stars.push(<StarHalf key={i} />);
    else stars.push(<StarEmpty key={i} />);
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

/* ───────── MOCK DATA ───────── */

const PLACE = {
  id: 1,
  name: "Stamba Café",
  category: "კაფე",
  color: "#1A3A2E",
  address: "მერაბ კოსტავას 14, თბილისი",
  hours: "09:00 — 00:00",
  phone: "+995 32 202 0101",
  distance: "600მ",
  chance: 75,
  rating: 4.6,
  reviewCount: 234,
  isOpen: true,
  checkins: 1847,
  description: "Stamba Hotel-ის ქვედა სართულზე მდებარე კაფე, რომელიც ცნობილია უნიკალური ინტერიერით, ხარისხიანი ყავით და სპეციალური სეზონური მენიუთი. იდეალური ადგილი როგორც საქმიანი შეხვედრებისთვის, ასევე მეგობრებთან დასასვენებლად.",
  tags: ["ყავა", "ბრანჩი", "დესერტი", "Wi-Fi", "ტერასა", "ბარი"],
  level: 2,
  levelName: "ვერცხლი",
  levelColor: "#A8A9AD",
};

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  popular: boolean;
}

const MENU_CATEGORIES = ["ყველა", "ყავა", "საუზმე", "დესერტი", "სასმელი"];

const MENU: MenuItem[] = [
  { id: 1, name: "კაპუჩინო", category: "ყავა", price: 8.50, popular: true },
  { id: 2, name: "ესპრესო", category: "ყავა", price: 5.00, popular: false },
  { id: 3, name: "ლატე", category: "ყავა", price: 9.00, popular: false },
  { id: 4, name: "ავოკადო ტოსტი", category: "საუზმე", price: 14.50, popular: true },
  { id: 5, name: "გრანოლა ბოულ", category: "საუზმე", price: 12.00, popular: false },
  { id: 6, name: "ჩიზქეიქი", category: "დესერტი", price: 11.00, popular: true },
  { id: 7, name: "ტირამისუ", category: "დესერტი", price: 13.50, popular: false },
  { id: 8, name: "ლემონეიდი", category: "სასმელი", price: 7.00, popular: false },
];

const RECENT_WINS = [
  { id: 1, name: "ნინო მ.", percent: 80, jackpot: false, time: "14 წთ წინ" },
  { id: 2, name: "დავით კ.", percent: 100, jackpot: true, time: "1 სთ წინ" },
  { id: 3, name: "მარიამ ბ.", percent: 45, jackpot: false, time: "2 სთ წინ" },
  { id: 4, name: "გიორგი ლ.", percent: 20, jackpot: false, time: "3 სთ წინ" },
];

/* ───────── MAIN ───────── */

export default function PlacePage() {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [menuCat, setMenuCat] = useState("ყველა");
  const [checkinState, setCheckinState] = useState<"idle" | "loading" | "success">("idle");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const filteredMenu = menuCat === "ყველა" ? MENU : MENU.filter((m) => m.category === menuCat);

  const handleCheckin = () => {
    setCheckinState("loading");
    setTimeout(() => {
      setCheckinState("success");
      // Navigate to spin game after success
      setTimeout(() => router.push("/game?spin=new"), 1200);
    }, 1500);
  };

  const stagger = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.45s ease-out ${i * 0.08}s`,
  });

  return (
    <main className="min-h-[100dvh] bg-[#0A0F1C] pb-[100px]">

      {/* ══════ HERO ══════ */}
      <div className="relative h-[220px] overflow-hidden">
        {/* Background color */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${PLACE.color}, ${PLACE.color}CC)` }} />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,15,28,0.6) 0%, transparent 40%, transparent 60%, rgba(10,15,28,0.85) 100%)" }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 z-10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
          <button onClick={() => router.back()} className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center backdrop-blur-md transition-all duration-200 active:scale-95" style={{ background: "rgba(10,15,28,0.5)" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F1F5F9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4L6 9l5 5" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setLiked(!liked)} className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center backdrop-blur-md transition-all duration-200 active:scale-95" style={{ background: "rgba(10,15,28,0.5)" }}>
              <HeartIcon filled={liked} />
            </button>
            <button className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center backdrop-blur-md transition-all duration-200 active:scale-95" style={{ background: "rgba(10,15,28,0.5)" }}>
              <ShareIcon />
            </button>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-4 left-5 right-5 z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ fontFamily: "var(--font-dm-sans)", background: PLACE.isOpen ? "rgba(0,232,143,0.2)" : "rgba(255,87,87,0.2)", color: PLACE.isOpen ? "#00E88F" : "#FF5757", border: `1px solid ${PLACE.isOpen ? "rgba(0,232,143,0.3)" : "rgba(255,87,87,0.3)"}` }}>
              {PLACE.isOpen ? "ღიაა" : "დაკეტილია"}
            </span>
            <span className="text-[12px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>{PLACE.category}</span>
          </div>
          <h1 className="text-[26px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>{PLACE.name}</h1>
        </div>
      </div>

      <div className="max-w-[430px] mx-auto px-5">

        {/* ══════ STAT CARDS ══════ */}
        <div className="grid grid-cols-3 gap-2 -mt-5 mb-5 relative z-10" style={stagger(0)}>
          {/* Rating */}
          <div className="rounded-[14px] p-3 flex flex-col items-center" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
            <RatingStars rating={PLACE.rating} />
            <span className="text-[18px] font-bold text-[#F1F5F9] mt-1.5" style={{ fontFamily: "var(--font-outfit)" }}>{PLACE.rating}</span>
            <span className="text-[10px] text-[#475569] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>{PLACE.reviewCount} შეფასება</span>
          </div>

          {/* Distance */}
          <div className="rounded-[14px] p-3 flex flex-col items-center" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
            <MapPinIcon color="#3B82F6" />
            <span className="text-[18px] font-bold text-[#F1F5F9] mt-1.5" style={{ fontFamily: "var(--font-outfit)" }}>{PLACE.distance}</span>
            <span className="text-[10px] text-[#475569] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>მანძილი</span>
          </div>

          {/* Chance */}
          <div className="rounded-[14px] p-3 flex flex-col items-center" style={{ background: "#0F2922", border: "1px solid rgba(0,232,143,0.12)" }}>
            <Icon name="spin" size={16} color="#00E88F" />
            <span className="text-[18px] font-bold text-[#00E88F] mt-1.5" style={{ fontFamily: "var(--font-outfit)" }}>{PLACE.chance}%</span>
            <span className="text-[10px] text-[#475569] mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>ქეშბექის შანსი</span>
          </div>
        </div>

        {/* ══════ LEVEL BONUS ══════ */}
        <div className="flex items-center gap-3 p-3.5 rounded-[12px] mb-5" style={{ ...stagger(1), background: "#141B2D", border: "1px solid #1C2539" }}>
          <div className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `${PLACE.levelColor}20` }}>
            <Icon name="flame" size={16} color={PLACE.levelColor} />
          </div>
          <p className="text-[13px] text-[#CBD5E1] leading-tight" style={{ fontFamily: "var(--font-dm-sans)" }}>
            შენი <span style={{ color: PLACE.levelColor }} className="font-semibold">{PLACE.levelName}</span> ლეველით მოგების შანსი{" "}
            <span className="text-[#00E88F] font-bold">{PLACE.chance}%</span>-ია
          </p>
        </div>

        {/* ══════ DESCRIPTION ══════ */}
        <p className="text-[14px] text-[#CBD5E1] leading-[1.6] mb-4" style={{ ...stagger(2), fontFamily: "var(--font-dm-sans)" }}>
          {PLACE.description}
        </p>

        {/* ══════ TAGS ══════ */}
        <div className="flex flex-wrap gap-2 mb-5" style={stagger(2)}>
          {PLACE.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-[12px] text-[#94A3B8] font-medium" style={{ fontFamily: "var(--font-dm-sans)", background: "#141B2D", border: "1px solid #1C2539" }}>
              {tag}
            </span>
          ))}
        </div>

        {/* ══════ INFO ROWS ══════ */}
        <div className="rounded-[16px] overflow-hidden mb-5" style={{ ...stagger(3), background: "#141B2D", border: "1px solid #1C2539" }}>
          {/* Address */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #1C2539" }}>
            <div className="flex items-center gap-3">
              <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.1)" }}>
                <MapPinIcon />
              </div>
              <span className="text-[14px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>{PLACE.address}</span>
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PLACE.address)}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#3B82F6] font-semibold hover:underline shrink-0 ml-2" style={{ fontFamily: "var(--font-dm-sans)" }}>რუკა</a>
          </div>

          {/* Hours */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #1C2539" }}>
            <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,184,0,0.1)" }}>
              <ClockIcon />
            </div>
            <span className="text-[14px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>{PLACE.hours}</span>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #1C2539" }}>
            <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "rgba(0,232,143,0.1)" }}>
              <PhoneIcon />
            </div>
            <span className="text-[14px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>{PLACE.phone}</span>
          </div>

          {/* Check-ins */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "rgba(148,163,184,0.1)" }}>
                <UsersIcon />
              </div>
              <span className="text-[14px] text-[#CBD5E1]" style={{ fontFamily: "var(--font-dm-sans)" }}>ჩეკინი</span>
            </div>
            <span className="text-[14px] text-[#94A3B8] font-semibold" style={{ fontFamily: "var(--font-outfit)" }}>{PLACE.checkins.toLocaleString()}</span>
          </div>
        </div>

        {/* ══════ ACTION BUTTONS ══════ */}
        <div className="grid grid-cols-3 gap-2.5 mb-6" style={stagger(4)}>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PLACE.address)}`} target="_blank" rel="noopener noreferrer" className="h-[44px] rounded-[12px] flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#3B82F6] transition-all duration-200 active:scale-95" style={{ fontFamily: "var(--font-dm-sans)", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <NavigateIcon />
            მისვლა
          </a>
          <a href={`tel:${PLACE.phone.replace(/\s/g, "")}`} className="h-[44px] rounded-[12px] flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#94A3B8] transition-all duration-200 active:scale-95" style={{ fontFamily: "var(--font-dm-sans)", background: "#141B2D", border: "1px solid #1C2539" }}>
            <PhoneIcon color="#94A3B8" />
            დარეკვა
          </a>
          <button onClick={() => { if (navigator.share) navigator.share({ title: PLACE.name, text: PLACE.description, url: window.location.href }); }} className="h-[44px] rounded-[12px] flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#94A3B8] transition-all duration-200 active:scale-95" style={{ fontFamily: "var(--font-dm-sans)", background: "#141B2D", border: "1px solid #1C2539" }}>
            <ShareIcon color="#94A3B8" size={14} />
            გაზიარება
          </button>
        </div>

        {/* ══════ MENU ══════ */}
        <div className="mb-6" style={stagger(5)}>
          <div className="flex items-center gap-2 mb-3">
            <MenuIcon />
            <span className="text-[16px] text-[#F1F5F9] font-semibold" style={{ fontFamily: "var(--font-outfit)" }}>მენიუ</span>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setMenuCat(cat)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 active:scale-95"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  background: menuCat === cat ? "#00E88F" : "#141B2D",
                  color: menuCat === cat ? "#0A0F1C" : "#94A3B8",
                  border: `1px solid ${menuCat === cat ? "#00E88F" : "#1C2539"}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu items */}
          <div className="flex flex-col gap-2">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-[12px]"
                style={{ background: "#141B2D", border: "1px solid #1C2539" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(0,232,143,0.08)" }}>
                    <span className="text-[14px] font-bold text-[#00E88F]" style={{ fontFamily: "var(--font-outfit)" }}>
                      {item.name[0]}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] text-[#F1F5F9] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>{item.name}</span>
                      {item.popular && (
                        <span className="px-1.5 py-px rounded-[4px] text-[9px] font-bold text-[#FFD700]" style={{ fontFamily: "var(--font-outfit)", background: "rgba(255,215,0,0.15)" }}>
                          TOP
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{item.category}</span>
                  </div>
                </div>
                <span className="text-[15px] font-bold text-[#F1F5F9]" style={{ fontFamily: "var(--font-outfit)" }}>
                  {item.price.toFixed(2)}₾
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════ RECENT WINS ══════ */}
        <div className="mb-6" style={stagger(6)}>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="spin" size={18} color="#FFB800" />
            <span className="text-[16px] text-[#F1F5F9] font-semibold" style={{ fontFamily: "var(--font-outfit)" }}>ბოლო მოგებები აქ</span>
          </div>

          <div className="rounded-[16px] overflow-hidden" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
            {RECENT_WINS.map((win, i) => (
              <div
                key={win.id}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < RECENT_WINS.length - 1 ? "1px solid #1C2539" : "none" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center" style={{ background: win.jackpot ? "rgba(255,215,0,0.1)" : "rgba(0,232,143,0.08)" }}>
                    {win.jackpot ? <CrownSmallIcon /> : <Icon name="check" size={14} color="#00E88F" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] text-[#F1F5F9] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>{win.name}</span>
                      {win.jackpot && (
                        <span className="px-1.5 py-px rounded-[4px] text-[9px] font-bold text-[#FFD700]" style={{ fontFamily: "var(--font-outfit)", background: "rgba(255,215,0,0.15)" }}>
                          JACKPOT
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#475569]" style={{ fontFamily: "var(--font-dm-sans)" }}>{win.time}</span>
                  </div>
                </div>
                <span className="text-[14px] font-bold" style={{ fontFamily: "var(--font-outfit)", color: win.jackpot ? "#FFD700" : "#00E88F" }}>
                  {win.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ FIXED BOTTOM CHECK-IN ══════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="h-[24px]" style={{ background: "linear-gradient(to bottom, transparent, #0A0F1C)" }} />
        <div className="bg-[#0A0F1C] px-5 pb-[max(16px,env(safe-area-inset-bottom,16px))]">
          <div className="max-w-[430px] mx-auto">
            {checkinState === "success" ? (
              <div
                className="w-full h-[56px] rounded-[16px] flex items-center justify-center gap-2.5"
                style={{ background: "rgba(0,232,143,0.08)", border: "1px solid rgba(0,232,143,0.2)" }}
              >
                <div className="animate-checkinSuccess">
                  <Icon name="check" size={22} color="#00E88F" />
                </div>
                <span className="text-[16px] font-bold text-[#00E88F]" style={{ fontFamily: "var(--font-outfit)" }}>
                  ჩეკინი წარმატებულია
                </span>
              </div>
            ) : (
              <button
                onClick={handleCheckin}
                disabled={checkinState === "loading"}
                className={`w-full h-[56px] rounded-[16px] text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] ${checkinState === "idle" ? "animate-checkinPulse" : ""}`}
                style={{
                  fontFamily: "var(--font-outfit)",
                  background: "linear-gradient(135deg, #00E88F, #00C777)",
                  color: "#0A0F1C",
                  boxShadow: "0 4px 24px rgba(0,232,143,0.35)",
                }}
              >
                {checkinState === "loading" ? (
                  <Spinner />
                ) : (
                  <>
                    <Icon name="scan" size={20} color="#0A0F1C" />
                    ჩეკინი — მოიგე {PLACE.chance}%-მდე
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
