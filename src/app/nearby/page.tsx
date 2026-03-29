"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BottomNav from "@/components/BottomNav";

/* ───────── SVG ICONS ───────── */

function SearchIcon({ color = "#475569" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M15.5 15.5L12.5 12.5" />
    </svg>
  );
}

function MapViewIcon({ color = "#94A3B8" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4l5-2 6 2 5-2v12l-5 2-6-2-5 2V4z" />
      <path d="M6 2v12M12 4v12" />
    </svg>
  );
}

function ListViewIcon({ color = "#94A3B8" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4h14M2 9h14M2 14h14" />
      <circle cx="2" cy="4" r="0.5" fill={color} />
      <circle cx="2" cy="9" r="0.5" fill={color} />
      <circle cx="2" cy="14" r="0.5" fill={color} />
    </svg>
  );
}

function NavigateIcon({ color = "#0A0F1C", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 6l5-4 5 4M8 2v10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="13.5" r="1" fill={color} />
    </svg>
  );
}

function MapPinSmallIcon({ color = "#64748B" }: { color?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
      <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5 2.5 7.25 6 11 6 11s3.5-3.75 3.5-6.5C9.5 2.57 7.93 1 6 1z" />
      <circle cx="6" cy="4.5" r="1.2" />
    </svg>
  );
}

function ClockSmallIcon({ color = "#64748B" }: { color?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
      <circle cx="6" cy="6" r="4.5" />
      <path d="M6 3.5v2.5l1.5 1.5" />
    </svg>
  );
}

function StarSmallIcon({ color = "#FFB800" }: { color?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill={color}>
      <path d="M6 1l1.5 3 3.3.5-2.4 2.3.6 3.2L6 8.5 3 10l.6-3.2L1.2 4.5l3.3-.5L6 1z" />
    </svg>
  );
}

function RecenterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="3" />
      <path d="M9 2v3M9 13v3M2 9h3M13 9h3" />
    </svg>
  );
}

function EmptyMapIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#1C2539" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 18l16-8 16 8 16-8v36l-16 8-16-8-16 8V18z" />
      <path d="M24 10v36M40 18v36" />
      <circle cx="32" cy="28" r="4" stroke="#475569" />
      <path d="M32 32v4" stroke="#475569" />
    </svg>
  );
}

/* ───────── MOCK DATA ───────── */

interface Place {
  id: number;
  name: string;
  category: string;
  categoryKey: string;
  address: string;
  hours: string;
  distance: string;
  distanceM: number;
  chance: number;
  rating: number;
  isOpen: boolean;
  color: string;
  mapX: number;
  mapY: number;
}

const PLACES: Place[] = [
  { id: 1, name: "Coffee Lab", category: "კაფე", categoryKey: "cafe", address: "აღმაშენებლის 152", hours: "08:00 - 22:00", distance: "120მ", distanceM: 120, chance: 80, rating: 4.8, isOpen: true, color: "#6B4226", mapX: 55, mapY: 35 },
  { id: 2, name: "Entrée", category: "რესტორანი", categoryKey: "restaurant", address: "ვაჟა-ფშაველას 71", hours: "11:00 - 23:00", distance: "300მ", distanceM: 300, chance: 60, rating: 4.6, isOpen: true, color: "#8B2252", mapX: 30, mapY: 20 },
  { id: 3, name: "პური გულით", category: "საცხობი", categoryKey: "bakery", address: "წერეთლის 116", hours: "07:00 - 21:00", distance: "450მ", distanceM: 450, chance: 90, rating: 4.9, isOpen: true, color: "#D4882A", mapX: 72, mapY: 55 },
  { id: 4, name: "Stamba Café", category: "კაფე", categoryKey: "cafe", address: "მერაბ კოსტავას 14", hours: "09:00 - 00:00", distance: "600მ", distanceM: 600, chance: 45, rating: 4.5, isOpen: true, color: "#1A3A2E", mapX: 20, mapY: 65 },
  { id: 5, name: "შემოხტა", category: "რესტორანი", categoryKey: "restaurant", address: "ლერმონტოვის 6", hours: "12:00 - 01:00", distance: "800მ", distanceM: 800, chance: 70, rating: 4.7, isOpen: false, color: "#D4442A", mapX: 78, mapY: 25 },
  { id: 6, name: "Bread House", category: "საცხობი", categoryKey: "bakery", address: "რუსთაველის 24", hours: "06:00 - 20:00", distance: "1.1კმ", distanceM: 1100, chance: 55, rating: 4.3, isOpen: true, color: "#A0522D", mapX: 42, mapY: 75 },
  { id: 7, name: "Lolita", category: "კაფე", categoryKey: "cafe", address: "აბაშიძის 14", hours: "10:00 - 23:00", distance: "1.4კმ", distanceM: 1400, chance: 85, rating: 4.4, isOpen: false, color: "#4A1942", mapX: 65, mapY: 80 },
];

const CATEGORIES = [
  { key: "all", label: "ყველა" },
  { key: "cafe", label: "კაფე" },
  { key: "restaurant", label: "რესტორანი" },
  { key: "bakery", label: "საცხობი" },
];

type SortKey = "distance" | "chance" | "rating";

/* ───────── MAIN ───────── */

export default function NearbyPage() {
  const router = useRouter();
  const [view, setView] = useState<"map" | "list">("map");
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("distance");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let result = PLACES;
    if (activeCategory !== "all") result = result.filter((p) => p.categoryKey === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.address.toLowerCase().includes(q));
    }
    if (view === "list") {
      result = [...result].sort((a, b) => {
        if (sortKey === "distance") return a.distanceM - b.distanceM;
        if (sortKey === "chance") return b.chance - a.chance;
        return b.rating - a.rating;
      });
    }
    return result;
  }, [activeCategory, search, sortKey, view]);

  const stagger = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.4s ease-out ${i * 0.08}s`,
  });

  /* ── Full Place Card ── */
  const FullPlaceCard = ({ place, delay = 0 }: { place: Place; delay?: number }) => (
    <div
      className="rounded-[16px] overflow-hidden transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: "#141B2D",
        border: "1px solid #1C2539",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `all 0.4s ease-out ${delay}s`,
      }}
    >
      {/* Color header — clickable to place detail */}
      <div onClick={() => router.push(`/place/${place.id}`)} className="relative h-[100px] cursor-pointer" style={{ background: `linear-gradient(135deg, ${place.color}, ${place.color}AA)` }}>
        {/* Open/Closed badge */}
        <div
          className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={{
            fontFamily: "var(--font-dm-sans)",
            background: place.isOpen ? "rgba(0,232,143,0.2)" : "rgba(255,87,87,0.2)",
            color: place.isOpen ? "#00E88F" : "#FF5757",
            border: `1px solid ${place.isOpen ? "rgba(0,232,143,0.3)" : "rgba(255,87,87,0.3)"}`,
          }}
        >
          {place.isOpen ? "ღიაა" : "დაკეტილია"}
        </div>
        {/* Chance badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-[8px]" style={{ background: "rgba(10,15,28,0.7)" }}>
          <Icon name="spin" size={12} color="#00E88F" />
          <span className="text-[12px] font-bold text-[#00E88F]" style={{ fontFamily: "var(--font-outfit)" }}>{place.chance}%</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-[16px] font-bold text-[#F1F5F9] leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>{place.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[13px] text-[#94A3B8]" style={{ fontFamily: "var(--font-dm-sans)" }}>{place.category}</span>
              <span className="text-[#1C2539]">·</span>
              <span className="text-[13px] text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans)" }}>{place.distance}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StarSmallIcon />
            <span className="text-[13px] text-[#F1F5F9] font-semibold" style={{ fontFamily: "var(--font-dm-sans)" }}>{place.rating}</span>
          </div>
        </div>

        {/* Address + Hours */}
        <div className="flex flex-col gap-1 mb-3.5">
          <div className="flex items-center gap-1.5">
            <MapPinSmallIcon />
            <span className="text-[12px] text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans)" }}>{place.address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClockSmallIcon />
            <span className="text-[12px] text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans)" }}>{place.hours}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button onClick={() => router.push(`/place/${place.id}`)} className="flex-1 h-[40px] rounded-[10px] flex items-center justify-center gap-1.5 text-[13px] font-bold text-[#0A0F1C] transition-all duration-200 active:scale-[0.97]" style={{ fontFamily: "var(--font-outfit)", background: "#00E88F" }}>
            <NavigateIcon />
            მისვლა
          </button>
          <button onClick={() => router.push(`/scan?place=${place.id}`)} className="flex-1 h-[40px] rounded-[10px] flex items-center justify-center gap-1.5 text-[13px] font-bold text-[#00E88F] transition-all duration-200 active:scale-[0.97]" style={{ fontFamily: "var(--font-outfit)", background: "rgba(0,232,143,0.08)", border: "1px solid rgba(0,232,143,0.15)" }}>
            <Icon name="check" size={14} color="#00E88F" />
            ჩეკინი
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Compact Place Card ── */
  const CompactCard = ({ place, onClick }: { place: Place; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-full text-left rounded-[14px] p-3.5 transition-all duration-200 hover:bg-[#1C2539]/50 active:scale-[0.98]"
      style={{ background: "#141B2D", border: "1px solid #1C2539" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[14px] font-semibold text-[#F1F5F9] leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>{place.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[12px] text-[#94A3B8]" style={{ fontFamily: "var(--font-dm-sans)" }}>{place.category}</span>
            <span className="text-[#1C2539]">·</span>
            <span className="text-[12px] text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans)" }}>{place.distance}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <StarSmallIcon />
          <span className="text-[12px] text-[#F1F5F9] font-semibold" style={{ fontFamily: "var(--font-dm-sans)" }}>{place.rating}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ fontFamily: "var(--font-outfit)", background: "rgba(0,232,143,0.1)", color: "#00E88F" }}>
          {place.chance}%
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={{
            fontFamily: "var(--font-dm-sans)",
            background: place.isOpen ? "rgba(0,232,143,0.08)" : "rgba(255,87,87,0.08)",
            color: place.isOpen ? "#00E88F" : "#FF5757",
          }}
        >
          {place.isOpen ? "ღიაა" : "დაკეტილია"}
        </span>
      </div>
    </button>
  );

  return (
    <main className="min-h-[100dvh] bg-[#0A0F1C]">
      <div className="max-w-[430px] mx-auto px-5 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5" style={stagger(0)}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center transition-all duration-200 hover:bg-[#1C2539] active:scale-95"
              style={{ background: "#141B2D", border: "1px solid #1C2539" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4L6 9l5 5" />
              </svg>
            </button>
            <h1 className="text-[20px] font-bold text-[#F1F5F9]" style={{ fontFamily: "var(--font-outfit)" }}>
              ახლომდებარე
            </h1>
          </div>

          {/* Map/List toggle */}
          <div className="flex rounded-[10px] overflow-hidden" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
            <button
              onClick={() => { setView("map"); setSelectedPlace(null); }}
              className="w-[38px] h-[34px] flex items-center justify-center transition-all duration-200"
              style={{ background: view === "map" ? "rgba(0,232,143,0.1)" : "transparent" }}
            >
              <MapViewIcon color={view === "map" ? "#00E88F" : "#94A3B8"} />
            </button>
            <button
              onClick={() => { setView("list"); setSelectedPlace(null); }}
              className="w-[38px] h-[34px] flex items-center justify-center transition-all duration-200"
              style={{ background: view === "list" ? "rgba(0,232,143,0.1)" : "transparent" }}
            >
              <ListViewIcon color={view === "list" ? "#00E88F" : "#94A3B8"} />
            </button>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="mb-4" style={stagger(1)}>
          <div className="flex items-center h-[44px] rounded-[12px] overflow-hidden" style={{ background: "#141B2D", border: "1.5px solid #1C2539" }}>
            <div className="pl-3.5 shrink-0"><SearchIcon /></div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ძებნა..."
              className="flex-1 h-full bg-transparent px-3 text-[14px] text-[#F1F5F9] placeholder-[#334155] outline-none"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="px-3 text-[#64748B] hover:text-[#94A3B8] transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Category pills ── */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide" style={stagger(2)}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-95"
              style={{
                fontFamily: "var(--font-dm-sans)",
                background: activeCategory === cat.key ? "#00E88F" : "#141B2D",
                color: activeCategory === cat.key ? "#0A0F1C" : "#94A3B8",
                border: `1px solid ${activeCategory === cat.key ? "#00E88F" : "#1C2539"}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Result count ── */}
        <p className="text-[13px] text-[#475569] mb-4" style={{ ...stagger(2), fontFamily: "var(--font-dm-sans)" }}>
          {filtered.length} ობიექტი ნაპოვნია
        </p>

        {/* ═════════ MAP VIEW ═════════ */}
        {view === "map" && (
          <div style={stagger(3)}>
            {/* Map container */}
            <div className="relative h-[380px] rounded-[20px] overflow-hidden mb-4" style={{ background: "#0F1629", border: "1px solid #1C2539" }}>
              {/* Grid lines */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {[...Array(12)].map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`} stroke="#F1F5F9" strokeOpacity="0.04" strokeWidth="1" />
                ))}
                {[...Array(8)].map((_, i) => (
                  <line key={`v${i}`} x1={`${(i + 1) * 12}%`} y1="0" x2={`${(i + 1) * 12}%`} y2="100%" stroke="#F1F5F9" strokeOpacity="0.04" strokeWidth="1" />
                ))}
                {/* Road lines */}
                <line x1="10%" y1="45%" x2="90%" y2="45%" stroke="#F1F5F9" strokeOpacity="0.08" strokeWidth="3" />
                <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#F1F5F9" strokeOpacity="0.06" strokeWidth="2.5" />
                <line x1="20%" y1="15%" x2="80%" y2="70%" stroke="#F1F5F9" strokeOpacity="0.05" strokeWidth="2" />
                <line x1="15%" y1="80%" x2="85%" y2="30%" stroke="#F1F5F9" strokeOpacity="0.04" strokeWidth="2" />
              </svg>

              {/* User location */}
              <div className="absolute z-20" style={{ left: "48%", top: "48%", transform: "translate(-50%, -50%)" }}>
                <div className="relative">
                  <div className="w-[16px] h-[16px] rounded-full bg-[#3B82F6]" style={{ border: "3px solid #0A0F1C" }} />
                  <div className="absolute inset-0 w-[16px] h-[16px] rounded-full bg-[#3B82F6] animate-ping opacity-30" />
                </div>
              </div>

              {/* Place pins */}
              {filtered.map((place) => (
                <button
                  key={place.id}
                  onClick={() => setSelectedPlace(selectedPlace?.id === place.id ? null : place)}
                  className="absolute z-10 flex flex-col items-center transition-all duration-200 hover:scale-110 group"
                  style={{
                    left: `${place.mapX}%`,
                    top: `${place.mapY}%`,
                    transform: `translate(-50%, -50%) ${selectedPlace?.id === place.id ? "scale(1.15)" : ""}`,
                  }}
                >
                  {/* Pin square */}
                  <div
                    className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center relative"
                    style={{
                      background: place.isOpen ? "#00E88F" : "#475569",
                      boxShadow: place.isOpen ? "0 0 12px rgba(0,232,143,0.4)" : "none",
                    }}
                  >
                    <span className="text-[11px] font-bold text-[#0A0F1C]" style={{ fontFamily: "var(--font-outfit)" }}>
                      {place.chance}%
                    </span>
                  </div>
                  {/* Triangle tail */}
                  <div className="w-0 h-0 -mt-[1px]" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${place.isOpen ? "#00E88F" : "#475569"}` }} />
                  {/* Name label */}
                  <div className="mt-1 px-1.5 py-0.5 rounded-[4px]" style={{ background: "rgba(10,15,28,0.88)" }}>
                    <span className="text-[10px] text-[#CBD5E1] font-medium whitespace-nowrap" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {place.name}
                    </span>
                  </div>
                </button>
              ))}

              {/* Recenter button */}
              <button className="absolute bottom-3 right-3 w-[36px] h-[36px] rounded-[10px] flex items-center justify-center z-20 transition-all duration-200 hover:bg-[#1C2539] active:scale-95" style={{ background: "#141B2D", border: "1px solid #1C2539" }}>
                <RecenterIcon />
              </button>
            </div>

            {/* Selected place card or compact cards */}
            {selectedPlace ? (
              <div className="animate-slideUp">
                <FullPlaceCard place={selectedPlace} delay={0} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.slice(0, 3).map((place) => (
                  <CompactCard key={place.id} place={place} onClick={() => setSelectedPlace(place)} />
                ))}
                {filtered.length > 3 && (
                  <button
                    onClick={() => setView("list")}
                    className="w-full h-[44px] rounded-[12px] flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#00E88F] transition-all duration-200 active:scale-[0.97]"
                    style={{ fontFamily: "var(--font-dm-sans)", background: "rgba(0,232,143,0.06)", border: "1px solid rgba(0,232,143,0.1)" }}
                  >
                    ყველას ნახვა ({filtered.length})
                    <Icon name="arrow-right" size={14} color="#00E88F" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════ LIST VIEW ═════════ */}
        {view === "list" && (
          <div style={stagger(3)}>
            {/* Sort pills */}
            <div className="flex gap-2 mb-4">
              {([
                { key: "distance" as SortKey, label: "ახლოს" },
                { key: "chance" as SortKey, label: "მაღალი შანსი" },
                { key: "rating" as SortKey, label: "რეიტინგი" },
              ]).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortKey(s.key)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 active:scale-95"
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    background: sortKey === s.key ? "rgba(0,232,143,0.1)" : "#141B2D",
                    color: sortKey === s.key ? "#00E88F" : "#64748B",
                    border: `1px solid ${sortKey === s.key ? "rgba(0,232,143,0.2)" : "#1C2539"}`,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Place cards */}
            {filtered.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filtered.map((place, i) => (
                  <FullPlaceCard key={place.id} place={place} delay={0.05 * i} />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16">
                <EmptyMapIcon />
                <p className="text-[16px] text-[#475569] font-medium mt-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  ობიექტი ვერ მოიძებნა
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
