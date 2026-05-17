"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch } from "@/services/api";

interface ApiOffer {
  id: string;
  merchantId: string;
  offerType: "featured" | "flash" | "partner";
  boostedRate: number;
  normalRate: number;
  title: string | null;
  description: string | null;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  merchant?: {
    id: string;
    merchantCode: string | null;
    businessName: string;
    businessNameKa: string | null;
    category: string;
    logoUrl: string | null;
  } | null;
}

interface ApiWin {
  id: string;
  name: string;
  pct: number;
  place: string;
  logoUrl: string | null;
  createdAt: string;
}

// Assign a stable bg color per merchant category for hero cards
function bgForCategory(cat?: string): { bgColor: string; textColor: string } {
  switch ((cat || "").toLowerCase()) {
    case "cafe": return { bgColor: "#F5D547", textColor: "#1A1A1A" };
    case "restaurant": return { bgColor: "#9B59B6", textColor: "#FFFFFF" };
    case "food":
    case "fast food": return { bgColor: "#E8002A", textColor: "#FFFFFF" };
    case "grocery": return { bgColor: "#2980B9", textColor: "#FFFFFF" };
    case "pharmacy": return { bgColor: "#16A085", textColor: "#FFFFFF" };
    case "entertainment": return { bgColor: "#E67E22", textColor: "#FFFFFF" };
    default: return { bgColor: "#FF6B2B", textColor: "#FFFFFF" };
  }
}

function secondsUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}

function timeHHMM(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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

const categories = ["All", "Cafe", "Restaurant", "Store", "Entertainment"];

/* Deal shape used by existing render code */
interface Deal {
  id: string;
  merchant: string;
  category: string;
  rate: number;
  endsIn: number;
  color: string;
  image: string;
  description: string;
  bgColor: string;
  exclusive: boolean;
  textColor: string;
}

interface Partner {
  id: string;
  merchant: string;
  category: string;
  distance: string;
  normalRate: number;
  boostedRate: number;
  endsAt: string;
  color: string;
  image: string;
}

interface Win {
  id: string;
  name: string;
  pct: number;
  place: string;
  time: string;
}

function offerToDeal(o: ApiOffer): Deal {
  const bg = bgForCategory(o.merchant?.category);
  return {
    id: o.id,
    merchant: o.merchant?.businessName || "Merchant",
    category: o.merchant?.category || "Store",
    rate: o.boostedRate,
    endsIn: secondsUntil(o.endsAt),
    color: "#1a5c3a",
    image: o.merchant?.logoUrl || "",
    description: o.description || o.title || "",
    bgColor: bg.bgColor,
    exclusive: o.offerType === "featured",
    textColor: bg.textColor,
  };
}

function offerToPartner(o: ApiOffer): Partner {
  return {
    id: o.id,
    merchant: o.merchant?.businessName || "Merchant",
    category: o.merchant?.category || "Store",
    distance: "—",
    normalRate: o.normalRate || 0,
    boostedRate: o.boostedRate,
    endsAt: timeHHMM(o.endsAt),
    color: "#1a5c3a",
    image: o.merchant?.logoUrl || "",
  };
}

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

  // API-loaded offers
  const [featuredDeals, setFeaturedDeals] = useState<Deal[]>([]);
  const [flashDealsAll, setFlashDealsAll] = useState<Deal[]>([]);
  const [partnerPromos, setPartnerPromos] = useState<Partner[]>([]);
  const [recentWins, setRecentWins] = useState<Win[]>([]);
  const [partnerMerchants, setPartnerMerchants] = useState<{ id: string; businessName: string; businessNameKa: string | null; category: string; logoUrl: string | null; products?: { id: string; name: string; price: number; imageUrl: string | null; sortOrder?: number }[] }[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Fetch real offers + recent wins
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [featRes, flashRes, partRes, winsRes, merchRes] = await Promise.all([
          apiFetch<{ offers: ApiOffer[] }>(`/offers?type=featured&active=true`).catch(() => ({ offers: [] })),
          apiFetch<{ offers: ApiOffer[] }>(`/offers?type=flash&active=true`).catch(() => ({ offers: [] })),
          apiFetch<{ offers: ApiOffer[] }>(`/offers?type=partner&active=true`).catch(() => ({ offers: [] })),
          apiFetch<{ wins: ApiWin[] }>(`/offers/recent-wins?limit=10`).catch(() => ({ wins: [] })),
          apiFetch<{ merchants: any[] }>(`/public/partner-merchants`).catch(() => ({ merchants: [] })),
        ]);
        if (!alive) return;
        setFeaturedDeals((featRes.offers || []).map(offerToDeal));
        setFlashDealsAll((flashRes.offers || []).map(offerToDeal));
        setPartnerPromos((partRes.offers || []).map(offerToPartner));
        setRecentWins((winsRes.wins || []).map((w) => ({
          id: w.id, name: w.name, pct: w.pct, place: w.place, time: timeAgo(w.createdAt),
        })));
        setPartnerMerchants(merchRes.merchants || []);
      } catch {
        // swallow
      }
    })();
    return () => { alive = false; };
  }, []);

  // Featured carousel pulls from featured offers (fallback to flash if no featured)
  const allDeals = featuredDeals.length > 0 ? featuredDeals : flashDealsAll;
  const featured = allDeals[featuredIdx] as Deal | undefined;
  // Flash strip = all flash offers (exclude the one currently featured to avoid dup)
  const flashDeals = flashDealsAll.filter((d) => !featured || d.id !== featured.id);

  const nextIdx = allDeals.length > 0 ? (featuredIdx + 1) % allDeals.length : 0;
  const prevIdx = allDeals.length > 0 ? (featuredIdx - 1 + allDeals.length) % allDeals.length : 0;
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
        setFeaturedIdx((prev) => allDeals.length > 0 ? (prev + direction + allDeals.length) % allDeals.length : 0);
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

    const totalSpins = 20 + Math.floor(Math.random() * 10);
    let count = 0;
    const w = containerWidth.current || 380;

    const doTick = () => {
      count++;
      const progress = count / totalSpins;
      const duration = 30 + Math.pow(progress, 3) * 600;
      setSnapDuration(duration);

      setIsSnapping(false);
      setDragX(0);

      requestAnimationFrame(() => {
        setIsSnapping(true);
        setDragX(w * 1.05);

        setTimeout(() => {
          setFeaturedIdx((prev) => allDeals.length > 0 ? (prev + 1) % allDeals.length : 0);
          setDragX(0);
          setIsSnapping(false);

          if (count >= totalSpins) {
            setIsSpinning(false);
            setHasSpun(true);
            setSnapDuration(250);
            return;
          }

          spinRef.current = setTimeout(doTick, 10);
        }, duration);
      });
    };

    spinRef.current = setTimeout(doTick, 10);
  };

  useEffect(() => {
    return () => { if (spinRef.current) clearTimeout(spinRef.current); };
  }, []);

  const renderCardContent = (deal: Deal, blur = false) => (
    <div className="flex flex-col h-full min-h-[180px]" style={{ filter: blur ? "blur(12px)" : "none", transition: "filter 0.5s ease-out" }}>
      {/* Top: logo + name below */}
      <div className="mb-auto">
        <div className="w-[76px] h-[76px] rounded-[18px] overflow-hidden flex items-center justify-center mb-2" style={{ background: deal.image ? "#FFFFFF" : deal.color }}>
          {deal.image ? (
            <img src={deal.image} alt={deal.merchant} className="w-[80%] h-[80%] object-contain" />
          ) : (
            <span className="text-white text-[26px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
              {deal.merchant.charAt(0)}
            </span>
          )}
        </div>
        <h2 className="text-[20px] font-bold" style={{ fontFamily: "var(--font-outfit)", color: deal.textColor }}>
          {deal.merchant}
        </h2>
      </div>

      {/* Bottom: % left, countdown right */}
      <div className="flex items-end justify-between mt-4">
        <div className="flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={deal.textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12V4M5 7l3-3 3 3" />
          </svg>
          <span className="text-[32px] font-bold" style={{ fontFamily: "var(--font-outfit)", color: deal.textColor }}>
            {deal.rate}%
          </span>
        </div>
        <CountdownText
          seconds={deal.endsIn}
          className="text-[24px] font-bold"
          style={{ fontFamily: "var(--font-outfit)", letterSpacing: "1px", color: deal.textColor }}
        />
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
    <AuthGuard>
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
            {(() => {
              const total = featuredDeals.length + flashDealsAll.length + partnerPromos.length;
              if (total <= 0) return <div className="w-[28px]" />;
              return (
                <div className="w-[28px] h-[28px] rounded-full bg-[#EF4444] flex items-center justify-center">
                  <span className="text-[13px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                    {total}
                  </span>
                </div>
              );
            })()}
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
          {featured && prevDeal && nextDeal && (
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
          )}

          {/* Swipe dots */}
          {allDeals.length > 0 && (
          <div className="flex justify-center gap-1.5 mb-4" style={stagger(2)}>
            {allDeals.map((_, i) => (
              <div
                key={i}
                className="w-[6px] h-[6px] rounded-full transition-all duration-300"
                style={{ background: i === featuredIdx ? "#FFFFFF" : "rgba(255,255,255,0.2)" }}
              />
            ))}
          </div>
          )}

          {/* Spin button */}
          {featured && (
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
          )}

          {/* ── 4. Flash Deals ── */}
          {flashDeals.length > 0 && (
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
          )}

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
                    style={{ background: promo.image ? "#FFFFFF" : promo.color }}
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

          {/* ── 5b. Partner Merchants grouped by category ── */}
          {(() => {
            const grouped: Record<string, typeof partnerMerchants> = {};
            partnerMerchants.forEach((m) => {
              const cat = m.category || "other";
              if (!grouped[cat]) grouped[cat] = [];
              grouped[cat].push(m);
            });
            const categoryLabels: Record<string, string> = {
              cafe: "Cafes",
              restaurant: "Restaurants",
              grocery: "Grocery",
              entertainment: "Entertainment",
              game_lounge: "Game Lounges",
              autoservice: "Autoservice",
              other: "Other",
            };
            return Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={stagger(5)} className="mb-6">
                <h2
                  className="text-white text-[20px] font-bold mb-4 uppercase tracking-wide"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  {categoryLabels[cat] || cat}
                </h2>
                <div className="flex flex-col gap-5">
                  {items.map((m) => {
                    const bg = bgForCategory(m.category);
                    const products = m.products || [];
                    return (
                      <div key={m.id}>
                        {/* Header: logo + name + arrow — no card background */}
                        <div className="flex items-center gap-3 mb-3 cursor-pointer active:opacity-70 transition-opacity">
                          <div
                            className="w-[44px] h-[44px] rounded-[12px] overflow-hidden flex items-center justify-center shrink-0"
                            style={{ background: m.logoUrl ? "#FFFFFF" : bg.bgColor }}
                          >
                            {m.logoUrl ? (
                              <img src={m.logoUrl} alt={m.businessName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[18px] font-bold" style={{ color: bg.textColor, fontFamily: "var(--font-outfit)" }}>
                                {m.businessName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white text-[16px] font-bold truncate" style={{ fontFamily: "var(--font-outfit)" }}>
                              {m.businessName}
                            </h3>
                            {m.businessNameKa && (
                              <p className="text-[12px] truncate" style={{ color: "#9CA3AF", fontFamily: "var(--font-dm-sans)" }}>
                                {m.businessNameKa}
                              </p>
                            )}
                          </div>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <path d="M7 4l6 6-6 6" />
                          </svg>
                        </div>

                        {/* Products: big, 2 small stacked, big, ... */}
                        {products.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {(() => {
                              // Group products into chunks: big ones solo, consecutive smalls paired
                              const chunks: { type: "big" | "small-pair"; items: typeof products }[] = [];
                              let smallBuffer: typeof products = [];
                              const flushSmalls = () => {
                                while (smallBuffer.length >= 2) {
                                  chunks.push({ type: "small-pair", items: [smallBuffer.shift()!, smallBuffer.shift()!] });
                                }
                                if (smallBuffer.length === 1) {
                                  chunks.push({ type: "small-pair", items: [smallBuffer.shift()!] });
                                }
                              };
                              products.forEach((p) => {
                                const isBig = (p as any).sortOrder === 0 || (p as any).sortOrder === undefined;
                                if (isBig) {
                                  flushSmalls();
                                  chunks.push({ type: "big", items: [p] });
                                } else {
                                  smallBuffer.push(p);
                                }
                              });
                              flushSmalls();
                              return chunks.map((chunk, ci) => {
                                if (chunk.type === "big") {
                                  const p = chunk.items[0];
                                  return (
                                    <div key={`c${ci}`} className="shrink-0 rounded-[14px] overflow-hidden relative" style={{ width: 280, height: 210 }}>
                                      {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: "#1C1C1E" }}>
                                          <span className="text-[32px]">🍽</span>
                                        </div>
                                      )}
                                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
                                        <span
                                          className="inline-block px-2.5 py-1 rounded-full text-[12px] font-bold"
                                          style={{ background: "rgba(249,231,65,0.9)", color: "#1A1A1A", fontFamily: "var(--font-dm-sans)" }}
                                        >
                                          {p.name} · ₾{p.price.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={`c${ci}`} className="shrink-0 flex flex-col gap-2" style={{ width: 105 }}>
                                      {chunk.items.map((p) => (
                                        <div key={p.id} className="rounded-[12px] overflow-hidden relative" style={{ height: 87 }}>
                                          {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: "#1C1C1E" }}>
                                              <span className="text-[20px]">🍽</span>
                                            </div>
                                          )}
                                          <div className="absolute bottom-0 right-0 px-2 py-1">
                                            <span
                                              className="text-[11px] font-bold px-1.5 py-0.5 rounded-[6px]"
                                              style={{ background: "rgba(0,0,0,0.7)", color: "#F9E741", fontFamily: "var(--font-dm-sans)" }}
                                            >
                                              ₾{p.price.toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

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
    </AuthGuard>
  );
}
