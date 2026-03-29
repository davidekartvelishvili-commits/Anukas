"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ───────── COUNTDOWN HOOK ───────── */
function useCountdown(totalSeconds: number) {
  const [secs, setSecs] = useState(totalSeconds);
  useEffect(() => {
    const iv = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function CountdownText({ seconds, className, style }: { seconds: number; className?: string; style?: React.CSSProperties }) {
  const display = useCountdown(seconds);
  return <span className={className} style={style}>{display}</span>;
}

/* ───────── DATA ───────── */
const allDeals = [
  { id: 0, merchant: "Stamba Cafe", category: "Cafe", rate: 40, endsIn: 19800, color: "#1a5c3a", image: "/images/stamba-cafe.png", description: "2x cashback on coffee today only", bgColor: "#F5D547", exclusive: true, textColor: "#1A1A1A" },
  { id: 1, merchant: "Dunkin'", category: "Cafe", rate: 35, endsIn: 6300, color: "#5c4a1a", image: "/images/dunkin-logo.jpg", description: "Extra cashback on donuts & coffee", bgColor: "#FF6B2B", exclusive: false, textColor: "#FFFFFF" },
  { id: 2, merchant: "Wendy's", category: "Fast Food", rate: 25, endsIn: 3600, color: "#5c1a1a", image: "/images/wendys-logo.png", description: "Boosted cashback on all meals", bgColor: "#E8002A", exclusive: false, textColor: "#FFFFFF" },
  { id: 3, merchant: "Luca Polare", category: "Restaurant", rate: 30, endsIn: 9000, color: "#5c1a3a", image: "", description: "Special gelato cashback deal", bgColor: "#9B59B6", exclusive: false, textColor: "#FFFFFF" },
  { id: 4, merchant: "GPC", category: "Store", rate: 20, endsIn: 14400, color: "#1a3a5c", image: "", description: "Extra cashback on groceries", bgColor: "#2980B9", exclusive: false, textColor: "#FFFFFF" },
];

const partnerPromos = [
  { id: 1, merchant: "Stamba Cafe", category: "Cafe", distance: "120m", normalRate: 10, boostedRate: 25, endsAt: "23:59", color: "#1a5c3a", image: "/images/stamba-cafe.png" },
  { id: 2, merchant: "Dunkin'", category: "Cafe", distance: "250m", normalRate: 8, boostedRate: 20, endsAt: "23:59", color: "#5c4a1a", image: "/images/dunkin-logo.jpg" },
  { id: 3, merchant: "Wendy's", category: "Fast Food", distance: "350m", normalRate: 5, boostedRate: 15, endsAt: "18:00", color: "#5c1a1a", image: "/images/wendys-logo.png" },
  { id: 4, merchant: "Luca Polare", category: "Restaurant", distance: "500m", normalRate: 8, boostedRate: 20, endsAt: "23:59", color: "#5c1a3a", image: "" },
  { id: 5, merchant: "Bread House", category: "Bakery", distance: "800m", normalRate: 5, boostedRate: 15, endsAt: "18:00", color: "#1a3a5c", image: "" },
  { id: 6, merchant: "Coffee Lab", category: "Cafe", distance: "1km", normalRate: 12, boostedRate: 30, endsAt: "20:00", color: "#3a5c1a", image: "" },
  { id: 7, merchant: "Pasanauri", category: "Restaurant", distance: "1.2km", normalRate: 6, boostedRate: 18, endsAt: "23:59", color: "#5c3a1a", image: "" },
];

const recentWins = [
  { id: 1, name: "Ana M.", pct: 45, place: "Stamba Cafe", time: "12 min ago" },
  { id: 2, name: "David K.", pct: 30, place: "Dunkin'", time: "28 min ago" },
  { id: 3, name: "Nino J.", pct: 100, place: "Luca Polare", time: "1 hr ago" },
];

const categories = ["All", "Cafe", "Restaurant", "Store", "Entertainment"];

/* ───────── MAIN ───────── */
export default function PromosPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [snapDuration, setSnapDuration] = useState(250);
  const touchStartX = useRef(0);
  const containerWidth = useRef(0);
  const spinRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const featured = allDeals[featuredIdx];
  const flashDeals = allDeals.filter((_, i) => i !== featuredIdx);

  const nextIdx = (featuredIdx + 1) % allDeals.length;
  const prevIdx = (featuredIdx - 1 + allDeals.length) % allDeals.length;
  const nextDeal = allDeals[nextIdx];
  const prevDeal = allDeals[prevIdx];

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsSnapping(false);
    touchStartX.current = e.touches[0].clientX;
    const el = e.currentTarget as HTMLElement;
    containerWidth.current = el.offsetWidth;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.touches[0].clientX;
    setDragX(diff);
  };

  const handleTouchEnd = () => {
    setSnapDuration(250);
    const threshold = containerWidth.current * 0.2;
    if (Math.abs(dragX) > threshold) {
      const direction = dragX > 0 ? 1 : -1;
      setIsSnapping(true);
      setDragX(direction * containerWidth.current * 1.05);
      setTimeout(() => {
        setFeaturedIdx((prev) => (prev + direction + allDeals.length) % allDeals.length);
        setDragX(0);
        setIsSnapping(false);
      }, 250);
    } else {
      setIsSnapping(true);
      setDragX(0);
      setTimeout(() => setIsSnapping(false), 250);
    }
  };

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    if (spinRef.current) clearTimeout(spinRef.current);

    const totalSpins = 15 + Math.floor(Math.random() * 10);
    let count = 0;
    const w = containerWidth.current || 380;

    const doTick = () => {
      count++;
      const progress = count / totalSpins;
      const duration = 80 + Math.pow(progress, 2.5) * 500;
      setSnapDuration(duration);

      setIsSnapping(false);
      setDragX(0);

      requestAnimationFrame(() => {
        setIsSnapping(true);
        setDragX(w * 1.05);

        setTimeout(() => {
          setFeaturedIdx((prev) => (prev + 1) % allDeals.length);
          setDragX(0);
          setIsSnapping(false);

          if (count >= totalSpins) {
            setIsSpinning(false);
            setHasSpun(true);
            setSnapDuration(250);
            return;
          }

          spinRef.current = setTimeout(doTick, 30);
        }, duration);
      });
    };

    spinRef.current = setTimeout(doTick, 50);
  };

  useEffect(() => {
    return () => { if (spinRef.current) clearTimeout(spinRef.current); };
  }, []);

  const renderCardContent = (deal: typeof allDeals[0], blur = false) => (
    <div style={{ filter: blur ? "blur(12px)" : "none", transition: "filter 0.5s ease-out" }}>
      <div className="mb-3 h-[22px]">
        {deal.exclusive && (
          <span
            className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: "#C5E84D", color: "#1A1A1A", fontFamily: "var(--font-dm-sans)" }}
          >
            Exclusive
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div className="flex-1">
          <h2 className="text-[22px] font-bold mb-1" style={{ fontFamily: "var(--font-outfit)", color: deal.textColor }}>
            {deal.merchant}
          </h2>
          <p className="text-[14px] mb-4" style={{ color: deal.textColor === "#FFFFFF" ? "rgba(255,255,255,0.7)" : "rgba(26,26,26,0.7)", fontFamily: "var(--font-dm-sans)" }}>
            {deal.description}
          </p>
          <div className="flex items-center gap-1 mb-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={deal.textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 12V4M5 7l3-3 3 3" />
            </svg>
            <span className="text-[28px] font-bold" style={{ fontFamily: "var(--font-outfit)", color: deal.textColor }}>
              {deal.rate}%
            </span>
          </div>
          <CountdownText
            seconds={deal.endsIn}
            className="text-[32px] font-bold"
            style={{ fontFamily: "var(--font-outfit)", letterSpacing: "1px", color: deal.textColor }}
          />
        </div>
        <div className="w-[80px] h-[80px] rounded-[16px] shrink-0 ml-4 overflow-hidden flex items-center justify-center" style={{ background: deal.image ? "#FFFFFF" : deal.color }}>
          {deal.image ? (
            <img src={deal.image} alt={deal.merchant} className="w-[80%] h-[80%] object-contain" />
          ) : (
            <span className="text-white text-[24px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
              {deal.merchant.charAt(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const stagger = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.5s ease-out ${i * 0.08}s`,
  });

  const filteredPartners = activeCategory === "All"
    ? partnerPromos
    : partnerPromos.filter((p) => p.category === activeCategory);

  return (
    <>
      <style>{`
        html, body { background: #000000 !important; }
        @keyframes pulse-dot { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
      <meta name="theme-color" content="#000000" />

      <main className="min-h-[100dvh] bg-black pb-[100px]">
        <div
          className="max-w-[430px] mx-auto px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          {/* ── 1. Header ── */}
          <div className="flex items-center justify-between mb-6" style={stagger(0)}>
            <button
              onClick={() => router.back()}
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
              style={{ background: "#1C1C1E" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6" />
              </svg>
            </button>
            <h1
              className="text-white text-[20px] font-bold"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Today&apos;s Promos
            </h1>
            <div className="w-[28px] h-[28px] rounded-full bg-[#EF4444] flex items-center justify-center">
              <span className="text-[13px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>5</span>
            </div>
          </div>

          {/* ── 2. Category pills ── */}
          <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide" style={stagger(1)}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-4 py-2 rounded-full transition-all duration-200 active:scale-[0.95]"
                style={{
                  background: activeCategory === cat ? "#C5E84D" : "#1C1C1E",
                }}
              >
                <span
                  className={`text-[14px] font-semibold ${activeCategory === cat ? "text-[#1A1A1A]" : "text-[#9CA3AF]"}`}
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {cat}
                </span>
              </button>
            ))}
          </div>

          {/* ── 3. Featured promo hero (swipeable 3D) ── */}
          <div
            className="relative mb-2 overflow-hidden"
            style={{ ...stagger(2) }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Next card (always rendered, off-screen right) */}
            <div
              className="absolute inset-0 rounded-[28px] p-5 overflow-hidden"
              style={{
                background: nextDeal.bgColor,
                transform: `translateX(${(containerWidth.current || 400) - dragX + 20}px)`,
                transition: isSnapping ? `transform ${snapDuration}ms ease-out` : "none",
              }}
            >
              {renderCardContent(nextDeal, !hasSpun)}
            </div>
            {/* Prev card (always rendered, off-screen left) */}
            <div
              className="absolute inset-0 rounded-[28px] p-5 overflow-hidden"
              style={{
                background: prevDeal.bgColor,
                transform: `translateX(${-(containerWidth.current || 400) - dragX - 20}px)`,
                transition: isSnapping ? `transform ${snapDuration}ms ease-out` : "none",
              }}
            >
              {renderCardContent(prevDeal, !hasSpun)}
            </div>
            {/* Current card */}
            <div
              className="rounded-[28px] p-5 relative overflow-hidden"
              style={{
                background: featured.bgColor,
                transform: `translateX(${-dragX}px)`,
                transition: isSnapping ? `transform ${snapDuration}ms ease-out` : "none",
              }}
            >
              {renderCardContent(featured, !hasSpun)}
            </div>
          </div>

          {/* Swipe dots */}
          <div className="flex justify-center gap-1.5 mb-4" style={stagger(2)}>
            {allDeals.map((_, i) => (
              <div
                key={i}
                className="w-[6px] h-[6px] rounded-full transition-all duration-300"
                style={{ background: i === featuredIdx ? "#FFFFFF" : "rgba(255,255,255,0.2)" }}
              />
            ))}
          </div>

          {/* Spin button */}
          <div className="flex justify-center mb-6" style={stagger(2)}>
            <button
              onClick={handleSpin}
              className="px-8 py-5 rounded-full active:scale-[0.95] transition-transform"
              style={{
                background: isSpinning
                  ? "rgba(197,232,77,0.5)"
                  : hasSpun
                    ? "#C5E84D"
                    : "linear-gradient(90deg, #C5E84D 0%, #F5D547 25%, #FFFFFF 50%, #F5D547 75%, #C5E84D 100%)",
                backgroundSize: hasSpun ? "100%" : "200% 100%",
                animation: !hasSpun && !isSpinning ? "shine 2s linear infinite" : "none",
              }}
            >
              <span
                className="text-[#1A1A1A] text-[16px] font-bold"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {isSpinning ? "SPINNING..." : "SPIN"}
              </span>
            </button>
          </div>

          {/* ── 4. Flash Deals ── */}
          <div style={stagger(3)}>
            <h2
              className="text-white text-[22px] font-bold mb-4"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Flash Deals
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-6">
              {flashDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="shrink-0 w-[130px] h-[130px] rounded-[36px] relative overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
                  style={{ background: deal.color }}
                >
                  {deal.image && (
                    <img src={deal.image} alt={deal.merchant} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)` }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span
                      className="text-white text-[14px] font-bold block mb-1"
                      style={{ fontFamily: "var(--font-outfit)", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                    >
                      {deal.merchant}
                    </span>
                    <span
                      className="text-[#C5E84D] text-[16px] font-bold block mb-1"
                      style={{ fontFamily: "var(--font-outfit)" }}
                    >
                      {deal.rate}%
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-[6px] h-[6px] rounded-full"
                        style={{ background: "#C5E84D", animation: "pulse-dot 2s ease-in-out infinite" }}
                      />
                      <CountdownText
                        seconds={deal.endsIn}
                        className="text-[11px]"
                        style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-dm-sans)" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. Partner Promos ── */}
          <div style={stagger(4)}>
            <h2
              className="text-white text-[22px] font-bold mb-4"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Partner Promos
            </h2>
            <div className="flex flex-col mb-6">
              {filteredPartners.map((promo, i) => (
                <div key={promo.id}>
                  <div className="flex items-center gap-3 py-4 cursor-pointer active:opacity-70 transition-opacity">
                  <div
                    className="w-[70px] h-[70px] rounded-[24px] shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: promo.image ? (promo.merchant === "Wendy's" ? "#E8002A" : "#FFFFFF") : promo.color }}
                  >
                    {promo.image && (
                      <img src={promo.image} alt={promo.merchant} className="w-[80%] h-[80%] object-contain m-auto" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className="text-white text-[15px] font-bold truncate"
                        style={{ fontFamily: "var(--font-outfit)" }}
                      >
                        {promo.merchant}
                      </span>
                      <span
                        className="text-[#9CA3AF] text-[12px] shrink-0 ml-2"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        {promo.distance}
                      </span>
                    </div>
                    <p
                      className="text-[#9CA3AF] text-[13px] mb-1"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {promo.category}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[#9CA3AF] text-[13px] line-through"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        {promo.normalRate}%
                      </span>
                      <span
                        className="text-[#C5E84D] text-[13px] font-bold px-2 py-0.5 rounded-[8px]"
                        style={{ background: "rgba(197,232,77,0.13)", fontFamily: "var(--font-dm-sans)" }}
                      >
                        {promo.boostedRate}%
                      </span>
                      <span
                        className="text-[#9CA3AF] text-[11px] ml-auto"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        until {promo.endsAt}
                      </span>
                    </div>
                  </div>
                  </div>
                  {i < filteredPartners.length - 1 && (
                    <div className="h-[0.5px]" style={{ background: "rgba(255,255,255,0.08)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 6. Recent Wins ── */}
          <div style={stagger(5)}>
            <h2
              className="text-white text-[22px] font-bold mb-4"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Recent Wins
            </h2>
            <div className="flex flex-col gap-2 mb-6">
              {recentWins.map((win) => (
                <div
                  key={win.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-[12px]"
                  style={{ background: "#1C1C1E" }}
                >
                  <div
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#3A3A3A" }}
                  >
                    <span className="text-white text-[11px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
                      {win.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      <span className="text-white font-bold">{win.name}</span>
                      <span className="text-[#9CA3AF]"> won {win.pct}% — {win.place}</span>
                    </span>
                  </div>
                  <span
                    className="text-[#9CA3AF] text-[11px] shrink-0"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {win.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 7. Referral card ── */}
          <div
            className="flex items-center justify-between p-4 rounded-[16px] mb-20"
            style={{ ...stagger(6), background: "#C5E84D" }}
          >
            <span
              className="text-[#1A1A1A] text-[15px] font-bold flex-1 mr-3"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Invite a friend — you both get 3x spins this week
            </span>
            <button
              className="shrink-0 px-4 py-2 rounded-full active:scale-[0.95] transition-transform"
              style={{ background: "#1A1A1A" }}
            >
              <span
                className="text-[#C5E84D] text-[13px] font-bold"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Share
              </span>
            </button>
          </div>
        </div>

        {/* ── Bottom Nav ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))", ...stagger(6) }}>
          <div
            className="flex items-center px-2 py-1.5 rounded-full gap-0"
            style={{
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(5px) saturate(200%)",
              WebkitBackdropFilter: "blur(5px) saturate(200%)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            {[
              { label: "Home", idx: 0, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l8-7 8 7" /><path d="M5 9.5v8a1 1 0 001 1h3v-4h4v4h3a1 1 0 001-1v-8" />
                </svg>
              )},
              { label: "Games", idx: 1, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="7" cy="7" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                  <circle cx="15" cy="7" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                  <circle cx="7" cy="15" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                  <circle cx="15" cy="15" r="2.2" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" />
                </svg>
              )},
              { label: "Scan", idx: 2, icon: (a: boolean) => (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7V4a2 2 0 012-2h3" />
                  <path d="M15 2h3a2 2 0 012 2v3" />
                  <path d="M20 15v3a2 2 0 01-2 2h-3" />
                  <path d="M7 20H4a2 2 0 01-2-2v-3" />
                  <line x1="2" y1="11" x2="20" y2="11" />
                </svg>
              )},
            ].map(({ label, idx, icon }) => (
              <button
                key={idx}
                onClick={() => {
                  if (idx === 0) router.push("/home");
                  if (idx === 1) router.push("/games");
                }}
                className="flex flex-col items-center px-5 py-1.5 rounded-full transition-all duration-200"
              >
                {icon(false)}
                <span
                  className="text-[10px] mt-1 font-medium"
                  style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.4)" }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </main>
    </>
  );
}
