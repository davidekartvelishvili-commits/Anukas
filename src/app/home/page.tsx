"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCoinBalance, getCashBalance, exchange as doExchange, seedTestUser } from "@/services/balance";
import { getMe, getStoredToken } from "@/services/auth";
import { apiFetch } from "@/services/api";
import AuthGuard from "@/components/AuthGuard";
import Ticket, { type TicketData } from "@/components/Ticket";

/* ───────── ICONS ───────── */

function CashIcon() {
  return (
    <img src="/images/lari-icon.png" alt="₾" width={38} height={38} style={{ objectFit: "contain" }} />
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#FFFFFF" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  );
}

function GamesIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#FFFFFF" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="7" r="2.5" />
      <circle cx="7" cy="17" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </svg>
  );
}

function CardIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#FFFFFF" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/trophy.png"
      alt="trophy"
      width={36}
      height={36}
      style={{ objectFit: "contain" }}
    />
  );
}

/* ───────── GAMES DATA ───────── */

const ALL_GAMES = [
  { id: 1, name: "Midnight Machine", gameType: "slot", color: "#4338CA", gradient: "linear-gradient(135deg, #4338CA, #6366F1)" },
  { id: 3, name: "Lucky Step", gameType: "chicken_rush", color: "#1a237e", gradient: "linear-gradient(135deg, #1a237e, #7c4dff)" },
  { id: 4, name: "Lucky Drop", gameType: "plinko", color: "#1a237e", gradient: "linear-gradient(135deg, #1a237e, #7c4dff)" },
  { id: 5, name: "Air Hockey", gameType: "air_hockey", color: "#0A0F1C", gradient: "linear-gradient(135deg, #0A0F1C, #1C2539)" },
];

/* ───────── COUNTDOWN HOOK ───────── */

function useCountdown(hours: number) {
  const target = useRef(Date.now() + hours * 3600 * 1000);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.current - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

/* ───────── MAIN ───────── */

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [cashBalance, setCashBalanceState] = useState(0);
  const [coinBalance, setCoinBalanceState] = useState(0);
  const [gender, setGender] = useState("Male");
  const [activeGameTypes, setActiveGameTypes] = useState<string[]>(["slot", "plinko", "chicken_rush", "air_hockey"]);
  const [promoCount, setPromoCount] = useState(0);
  const [mysteryBoxEnabled, setMysteryBoxEnabled] = useState(true);
  const [liveTickets, setLiveTickets] = useState<TicketData[]>([]);
  const [recentWins, setRecentWins] = useState<{ id: string; name: string; coins: number; game: string; createdAt: string }[]>([]);
  const countdown = useCountdown(15.58);

  // "Seen" tracking — hide badge after user visits /promos on a given day
  const todayKey = () => {
    const d = new Date();
    return `promos_seen_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const [promoSeenToday, setPromoSeenToday] = useState(false);

  useEffect(() => {
    seedTestUser();
    setActiveTab(0);
    // Read cached values immediately for fast render
    setCashBalanceState(getCashBalance());
    setCoinBalanceState(getCoinBalance());
    // Then fetch fresh from server and sync
    if (getStoredToken()) {
      getMe().then((data: any) => {
        if (data?.user) {
          setCoinBalanceState(data.user.coinBalance ?? 0);
          setCashBalanceState(data.user.balance ?? 0);
        }
      }).catch(() => {});
      // Fetch active games
      apiFetch("/games/config").then((data: any) => {
        if (data?.games) {
          // Merge server-enabled game types with always-on games (Air Hockey
          // is standalone — no game_config row, always available).
          const serverTypes: string[] = data.games.filter((g: any) => g.isActive).map((g: any) => g.gameType);
          const alwaysOn = ["air_hockey"];
          setActiveGameTypes(Array.from(new Set([...serverTypes, ...alwaysOn])));
        }
      }).catch(() => {});
    }

    // Fetch real promo (offer) count — public endpoint, no auth needed
    apiFetch("/offers?active=true").then((data: any) => {
      if (data?.success && Array.isArray(data.offers)) {
        setPromoCount(data.offers.length);
      }
    }).catch(() => {});

    // Fetch feature flags (mystery box on/off)
    apiFetch("/public/features").then((data: any) => {
      if (data?.success && data.features) {
        setMysteryBoxEnabled(data.features.mysteryBoxEnabled !== false);
      }
    }).catch(() => {});

    // Fetch live tickets from backend + user's claimed ticket state
    // so we can show real QR codes + "used" state for redeemed ones.
    Promise.all([
      apiFetch("/public/tickets").catch(() => null),
      apiFetch("/user/tickets/my").catch(() => null),
    ]).then(([pub, my]: any[]) => {
      const templates: any[] = (pub?.success && Array.isArray(pub.tickets)) ? pub.tickets : [];
      const mine: any[] = (my?.success && Array.isArray(my.tickets)) ? my.tickets : [];
      // Index user's claims by ticket template id
      const claimByTemplate = new Map<string, any>();
      for (const ut of mine) claimByTemplate.set(ut.ticketId, ut);
      // Merge: attach claim info onto each template (qrCode + redeemed)
      const merged = templates.map((t) => {
        const claim = claimByTemplate.get(t.id);
        return {
          ...t,
          _userTicketId: claim?.id || null,
          _qrCode: claim?.qrCode || null,
          _used: !!claim?.redeemedAt,
        };
      });
      setLiveTickets(merged);
    });

    // Check if user has already visited /promos today — hide badge if so
    try {
      if (typeof window !== "undefined" && localStorage.getItem(todayKey()) === "1") {
        setPromoSeenToday(true);
      }
    } catch {}
    const saved = localStorage.getItem("user-gender");
    if (saved) setGender(saved);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Live Recent Wins — polls every 8 seconds, no page refresh needed.
  useEffect(() => {
    let alive = true;
    const fetchWins = () => {
      apiFetch("/public/recent-wins").then((data: any) => {
        if (alive && data?.success && Array.isArray(data.wins)) {
          setRecentWins(data.wins);
        }
      }).catch(() => {});
    };
    fetchWins();
    const interval = setInterval(fetchWins, 8000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  const avatarSrc = gender === "Female" ? "/images/profile-avatar-female.png" : gender === "Other" ? "/images/profile-avatar-other.png" : "/images/profile-avatar.png";

  const stagger = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.5s ease-out ${i * 0.08}s`,
  });

  return (
    <AuthGuard>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="min-h-[100dvh] bg-black pb-[90px]">
        <div className="max-w-[430px] mx-auto px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>

          {/* ── Header: balances + avatar ── */}
          <div className="flex items-center justify-between mb-6" style={stagger(0)}>
            <div className="flex items-center gap-2">
              {/* Coin balance (for playing games) */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full" style={{ background: "#1C1C1E" }}>
                <img src="/images/coin-icon.png" alt="Coin" width={22} height={22} style={{ objectFit: "contain" }} />
                <span className="text-[14px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>{coinBalance.toLocaleString()}</span>
              </div>
              {/* Lari balance (winnings) */}
              <button
                onClick={() => setShowBalanceModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 active:scale-[0.95]"
                style={{ background: "#1C1C1E" }}
              >
                <CashIcon />
                <span className="text-[14px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>{cashBalance.toFixed(2)}</span>
              </button>
            </div>
            <div
              className="w-[48px] h-[48px] rounded-full overflow-hidden cursor-pointer active:scale-[0.95] transition-transform"
              style={{ background: "linear-gradient(135deg, #C4E0F9, #E8D5F5)" }}
              onClick={() => router.push("/profile")}
            >
              <img
                src={avatarSrc}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* ── Featured Games ── */}
          <div style={stagger(1)}>
            <h2 className="text-[22px] font-bold text-white mb-4" style={{ fontFamily: "var(--font-outfit)" }}>
              Featured Games
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {ALL_GAMES.filter(g => activeGameTypes.includes(g.gameType)).map((game) => (
                <div
                  key={game.id}
                  className="shrink-0 w-[130px] h-[130px] rounded-[36px] relative overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
                  style={{ background: game.gradient }}
                  onClick={() => { if (game.id === 1) router.push("/games/midnight-machine"); if (game.id === 3) router.push("/games/chicken-rush"); if (game.id === 4) router.push("/games/lucky-drop"); if (game.id === 5) router.push("/games/air-hockey"); }}
                >
                  {/* Video cover for Midnight Machine */}
                  {(game.id === 1 || game.id === 2) ? (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                      src={game.id === 1 ? "/images/onboarding/slot-machine.mp4" : "/images/onboarding/coverd21.mp4"}
                    />
                  ) : game.id === 3 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src="/images/lucky-step-cover.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : game.id === 4 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src="/images/lucky-drop-cover.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : game.id === 5 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src="/images/air-hockey-cover.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-[20%] left-[10%] w-[60px] h-[60px] rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />
                      <div className="absolute bottom-[15%] right-[15%] w-[40px] h-[40px] rounded-[10px] rotate-45" style={{ background: "rgba(255,255,255,0.2)" }} />
                    </div>
                  )}
                  {/* Game name */}
                  <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>
                    <span className="text-[16px] font-bold text-white leading-tight" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                      {game.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Today's Promo Inbox ── */}
          <div
            className="mt-6 flex items-center justify-between px-5 py-5 rounded-[20px] cursor-pointer active:scale-[0.98] transition-transform"
            style={{ ...stagger(2), background: "#A8E06C" }}
            onClick={() => {
              // Mark as seen for the day — badge won't reappear until tomorrow
              try {
                if (typeof window !== "undefined") {
                  localStorage.setItem(todayKey(), "1");
                }
              } catch {}
              setPromoSeenToday(true);
              router.push("/promos");
            }}
          >
            <div className="flex items-center gap-3">
              <TrophyIcon />
              <span className="text-[17px] font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-outfit)" }}>
                Today&apos;s Promo Inbox
              </span>
            </div>
            {!promoSeenToday && promoCount > 0 && (
              <div className="w-[28px] h-[28px] rounded-full bg-[#EF4444] flex items-center justify-center">
                <span className="text-[13px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                  {promoCount}
                </span>
              </div>
            )}
          </div>

          {/* ── Live Recent Wins ── */}
          {recentWins.length > 0 && (
            <div className="mt-5" style={stagger(2)}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
                <h3 className="text-[14px] font-bold" style={{ color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}>
                  Live Wins
                </h3>
              </div>
              <div className="flex flex-col gap-1.5">
                {recentWins.map((win) => {
                  // Time ago
                  let ago = "";
                  try {
                    const d = new Date(win.createdAt.includes("T") ? win.createdAt : win.createdAt.replace(" ", "T") + "Z");
                    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
                    if (sec < 60) ago = "ახლა";
                    else if (sec < 3600) ago = `${Math.floor(sec / 60)} წთ`;
                    else if (sec < 86400) ago = `${Math.floor(sec / 3600)} სთ`;
                    else ago = `${Math.floor(sec / 86400)} დღე`;
                  } catch { ago = ""; }
                  return (
                    <div
                      key={win.id}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px]"
                      style={{ background: "#141B2D" }}
                    >
                      <div
                        className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "#1C2539" }}
                      >
                        <span className="text-[11px] font-bold" style={{ color: "#F1F5F9", fontFamily: "var(--font-outfit)" }}>
                          {win.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{win.name}</span>
                          <span style={{ color: "#64748B" }}> — {win.game}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <img src="/images/coin-icon.png" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
                        <span className="text-[13px] font-bold" style={{ color: "#FFE500", fontFamily: "var(--font-outfit)" }}>
                          +{win.coins.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: "#475569", fontFamily: "var(--font-dm-sans)" }}>
                        {ago}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Shansi Drops (admin-managed via /admin/tickets) ── */}
          {liveTickets.length > 0 && (
            <div className="mt-6" style={stagger(3)}>
              <h2 className="text-[22px] font-bold text-white mb-4" style={{ fontFamily: "var(--font-outfit)" }}>
                Shansi Drops
              </h2>
            </div>
          )}
          {liveTickets.length > 0 && (
            <div
              className="-mx-4 overflow-x-auto scrollbar-hide"
              style={{
                ...stagger(3),
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <div className="flex gap-4" style={{ width: "max-content" }}>
                {liveTickets.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      scrollSnapAlign: "center",
                      scrollSnapStop: "always",
                      flexShrink: 0,
                    }}
                  >
                    <Ticket
                      data={t}
                      qrCode={(t as any)._qrCode || undefined}
                      used={!!(t as any)._used}
                      onActivate={async () => {
                        try {
                          const res: any = await apiFetch(`/user/tickets/${t.id}/activate`, { method: "POST" });
                          if (res?.success && res.userTicket?.qrCode) {
                            // Patch this ticket in-place so the next render
                            // shows a real QR (instead of placeholder). No
                            // full refetch needed.
                            setLiveTickets((prev) =>
                              prev.map((x) =>
                                x.id === t.id
                                  ? { ...x, _qrCode: res.userTicket.qrCode, _userTicketId: res.userTicket.id }
                                  : x
                              )
                            );
                          }
                        } catch {}
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Mystery Box ── */}
          {mysteryBoxEnabled && (
          <div
            className="mt-6 rounded-[20px] overflow-hidden relative cursor-pointer active:scale-[0.98] transition-transform"
            style={{ ...stagger(3), background: "#E8C840", minHeight: 220 }}
            onClick={() => router.push("/mystery-box")}
          >
            <div className="p-5 relative z-10">
              <p className="text-[15px] font-semibold text-[#1A1A1A] opacity-80" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Mystery Box
              </p>
              <p className="text-[36px] font-black text-[#1A1A1A] mt-1 tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                {countdown}
              </p>
            </div>
            {/* Cube visual */}
            <div className="absolute right-2 bottom-2 w-[180px] h-[180px] flex items-center justify-center" style={{ perspective: "400px" }}>
              <div
                className="relative w-[120px] h-[120px]"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateX(-15deg) rotateY(25deg)",
                  animation: "rotateSlow 12s linear infinite",
                }}
              >
                {/* Front — ₾ */}
                <div className="absolute inset-0 rounded-[14px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A1A1A, #2D2D2D)", border: "2px solid #3A3A3A", transform: "translateZ(60px)", backfaceVisibility: "hidden", boxShadow: "0 0 20px rgba(77,201,246,0.3)" }}>
                  <div className="absolute inset-1 rounded-[12px] border border-[#4dc9f6] opacity-20" />
                  <span className="text-[40px] font-black text-[#FFE500]" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 0 20px rgba(255,229,0,0.5)" }}>₾</span>
                </div>
                {/* Right — ? */}
                <div className="absolute inset-0 rounded-[14px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A1A1A, #222)", border: "2px solid #333", transform: "rotateY(90deg) translateZ(60px)", backfaceVisibility: "hidden", boxShadow: "0 0 15px rgba(255,184,0,0.2)" }}>
                  <div className="absolute inset-1 rounded-[12px] border border-[#FFB800] opacity-15" />
                  <div className="absolute top-2 left-1 w-1 h-[80%] rounded-full bg-[#4dc9f6] opacity-30" />
                  <span className="text-[40px] font-black text-[#FFB800]" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 0 20px rgba(255,184,0,0.4)" }}>?</span>
                </div>
                {/* Back — ₾ */}
                <div className="absolute inset-0 rounded-[14px] flex items-center justify-center" style={{ background: "#1A1A1A", border: "2px solid #333", transform: "rotateY(180deg) translateZ(60px)", backfaceVisibility: "hidden", boxShadow: "0 0 15px rgba(0,232,143,0.2)" }}>
                  <div className="absolute inset-1 rounded-[12px] border border-[#00E88F] opacity-15" />
                  <span className="text-[40px] font-black text-[#00E88F]" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 0 20px rgba(0,232,143,0.4)" }}>₾</span>
                </div>
                {/* Left — ? */}
                <div className="absolute inset-0 rounded-[14px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #222, #1A1A1A)", border: "2px solid #333", transform: "rotateY(-90deg) translateZ(60px)", backfaceVisibility: "hidden", boxShadow: "0 0 15px rgba(168,85,247,0.2)" }}>
                  <div className="absolute inset-1 rounded-[12px] border border-[#A855F7] opacity-15" />
                  <div className="absolute top-2 right-1 w-1 h-[80%] rounded-full bg-[#4dc9f6] opacity-30" />
                  <span className="text-[40px] font-black text-[#A855F7]" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 0 20px rgba(168,85,247,0.4)" }}>?</span>
                </div>
                {/* Top */}
                <div className="absolute inset-0 rounded-[14px]" style={{ background: "#222", border: "2px solid #3A3A3A", transform: "rotateX(90deg) translateZ(60px)", backfaceVisibility: "hidden" }} />
                {/* Bottom */}
                <div className="absolute inset-0 rounded-[14px]" style={{ background: "#111", border: "2px solid #222", transform: "rotateX(-90deg) translateZ(60px)", backfaceVisibility: "hidden" }} />
              </div>
            </div>
          </div>
          )}

        </div>

        {/* ── Bottom Tab Bar — floating glass island ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
          <div
            className="flex items-center px-2 py-1.5 rounded-full gap-0"
            style={{
              background: "rgba(30, 30, 30, 0.75)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
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
            ].map(({ label, idx, icon }) => {
              const isActive = idx === activeTab;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab(idx);
                    if (idx === 1) router.push("/games");
                    if (idx === 2) router.push("/scan");
                  }}
                  className="flex flex-col items-center px-3.5 py-1.5 rounded-full transition-all duration-200"
                  style={{ background: isActive ? "rgba(255,255,255,0.1)" : "transparent" }}
                >
                  {icon(isActive)}
                  <span
                    className="text-[10px] mt-1 font-medium"
                    style={{ fontFamily: "var(--font-dm-sans)", color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.4)" }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>

      {/* ── Balance Modal ── */}
      {showBalanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowBalanceModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Modal */}
          <div
            className="relative w-full max-w-[430px] rounded-t-[36px] pb-8 pt-3 px-5"
            style={{
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-[36px] h-[5px] rounded-full bg-white/30 mx-auto mb-5" />

            {/* Title */}
            <h3
              className="text-white text-[20px] font-bold text-center mb-6"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Select an Option
            </h3>

            {/* Options */}
            <div className="flex gap-3 mb-6">
              {/* Exchange */}
              <button
                className="flex-1 flex flex-col items-center gap-3 py-6 rounded-[28px] transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onClick={() => {
                  setShowBalanceModal(false);
                  setExchangeAmount("");
                  setShowExchange(true);
                }}
              >
                <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 16l-4-4 4-4" />
                    <path d="M3 12h14" />
                    <path d="M17 8l4 4-4 4" />
                    <path d="M21 12H7" />
                  </svg>
                </div>
                <span
                  className="text-white text-[14px] font-semibold"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Exchange
                </span>
              </button>

              {/* Redeem Balance */}
              <button
                className="flex-1 flex flex-col items-center gap-3 py-6 rounded-[28px] transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onClick={() => {
                  setShowBalanceModal(false);
                  router.push("/redeem");
                }}
              >
                <div className="w-[52px] h-[52px] rounded-full bg-[#3A3A3C] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </div>
                <span
                  className="text-[#999] text-[14px] font-semibold"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Redeem Balance
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Exchange Popup (bottom sheet) ── */}
      {showExchange && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowExchange(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-[430px] rounded-t-[36px] pb-8 pt-3 px-5"
            style={{
              background: "rgba(30, 30, 30, 0.55)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-[36px] h-[5px] rounded-full bg-white/30 mx-auto mb-5" />

            <h3 className="text-white text-[20px] font-bold text-center mb-6" style={{ fontFamily: "var(--font-outfit)" }}>
              Exchange
            </h3>

            {/* Cash input line */}
            <div className="flex items-center py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="w-[60px] shrink-0 flex items-center justify-center">
                <img src="/images/lari-icon.png" alt="₾" width={75} height={75} style={{ objectFit: "contain" }} />
              </div>
              <input
                type="number"
                placeholder="0"
                value={exchangeAmount}
                onChange={(e) => setExchangeAmount(e.target.value)}
                className="flex-1 bg-transparent text-white text-[22px] font-bold outline-none ml-2"
                style={{ fontFamily: "var(--font-outfit)" }}
                min={0}
                max={cashBalance}
              />
              <span className="text-[15px] text-[#999] font-semibold shrink-0" style={{ fontFamily: "var(--font-dm-sans)" }}>Balance: {cashBalance.toFixed(2)} ₾</span>
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#F9E741" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 4v12M6 12l4 4 4-4" />
              </svg>
            </div>

            {/* Coin output line */}
            <div className="flex items-center py-3 border-b mb-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="w-[60px] shrink-0 flex items-center justify-center">
                <img src="/images/coin-icon.png" alt="Coin" width={42} height={42} style={{ objectFit: "contain" }} />
              </div>
              <span className="flex-1 text-white text-[22px] font-bold ml-2" style={{ fontFamily: "var(--font-outfit)" }}>
                {exchangeAmount ? (parseFloat(exchangeAmount) * 100).toLocaleString() : "0"}
              </span>
              <span className="text-[15px] text-[#999] font-semibold shrink-0" style={{ fontFamily: "var(--font-dm-sans)" }}>Coins</span>
            </div>

            {/* Rate */}
            <p className="text-[13px] text-[#999] text-center mb-5" style={{ fontFamily: "var(--font-dm-sans)" }}>
              1₾ Cash = 100 Coin
            </p>

            {/* Exchange button */}
            <button
              onClick={() => {
                const amt = parseFloat(exchangeAmount);
                if (doExchange(amt)) {
                  setCashBalanceState(getCashBalance());
                  setCoinBalanceState(getCoinBalance());
                  setShowExchange(false);
                  setExchangeAmount("");
                }
              }}
              disabled={!exchangeAmount || parseFloat(exchangeAmount) <= 0 || parseFloat(exchangeAmount) > cashBalance}
              className="mx-auto block px-10 py-8 rounded-full text-[16px] font-bold transition-all active:scale-[0.97] disabled:opacity-40"
              style={{ background: "#F9E741", color: "#000", fontFamily: "var(--font-outfit)" }}
            >
              Exchange
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </AuthGuard>
  );
}
