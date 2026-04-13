"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCoinBalance, getCashBalance } from "@/services/balance";
import { apiFetch } from "@/services/api";
import { getStoredToken } from "@/services/auth";
import AuthGuard from "@/components/AuthGuard";

/* ───────── GAMES DATA ───────── */

const ALL_GAMES = [
  { id: "midnight-machine", gameType: "slot", name: "Midnight Machine", gradient: "linear-gradient(135deg, #4338CA, #6366F1)", media: "/images/onboarding/slot-machine.mp4", type: "video" as const },
  { id: "coverd-21", gameType: null, name: "Coverd 21", gradient: "linear-gradient(135deg, #B45309, #D97706)", media: "/images/onboarding/coverd21.mp4", type: "video" as const },
  { id: "chicken-rush", gameType: "chicken_rush", name: "Lucky Step", gradient: "linear-gradient(135deg, #1a237e, #7c4dff)", media: "/images/lucky-step-cover.png", type: "image" as const },
  { id: "lucky-drop", gameType: "plinko", name: "Lucky Drop", gradient: "linear-gradient(135deg, #1a237e, #7c4dff)", media: "/images/lucky-drop-cover.png", type: "image" as const },
  { id: "wonder-wheel", name: "Wonder Wheel", gradient: "linear-gradient(135deg, #7C3AED, #A855F7)", media: "", type: "gradient" as const },
  { id: "suns-n-moons", name: "Suns N Moons", gradient: "linear-gradient(135deg, #6B7280, #9CA3AF)", media: "", type: "gradient" as const },
  { id: "cctv-game", name: "CCTV Game", gradient: "linear-gradient(135deg, #1E40AF, #3B82F6)", media: "", type: "gradient" as const },
  { id: "buffalo-extreme", name: "Buffalo Extreme", gradient: "linear-gradient(135deg, #D97706, #F59E0B)", media: "", type: "gradient" as const },
  { id: "black-friday", name: "Black Friday", gradient: "linear-gradient(135deg, #1F2937, #4B5563)", media: "", type: "gradient" as const },
  { id: "wild-tiger", name: "Wild Tiger 2", gradient: "linear-gradient(135deg, #DC2626, #EF4444)", media: "", type: "gradient" as const },
  { id: "crash-x", name: "Crash X", gradient: "linear-gradient(135deg, #059669, #10B981)", media: "", type: "gradient" as const },
  { id: "wanted", name: "Wanted", gradient: "linear-gradient(135deg, #78350F, #92400E)", media: "", type: "gradient" as const },
  { id: "treasure-hunt", name: "Treasure Hunt", gradient: "linear-gradient(135deg, #0E7490, #06B6D4)", media: "", type: "gradient" as const },
];

const NEWLY_ADDED = ["lucky-drop", "chicken-rush"];
const FAN_FAVORITES = ["midnight-machine", "lucky-drop", "chicken-rush"];
const COVERD_FAVORITES = ["midnight-machine"];

function getGame(id: string) {
  return ALL_GAMES.find((g) => g.id === id);
}

/* ───────── LOCAL STORAGE HELPERS ───────── */

function getPlayedGames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("playedGames") || "[]");
  } catch {
    return [];
  }
}

function markGamePlayed(id: string) {
  const played = getPlayedGames();
  if (!played.includes(id)) {
    played.unshift(id);
    localStorage.setItem("playedGames", JSON.stringify(played));
  }
}

/* ───────── ICONS ───────── */

function CashIcon() {
  return (
    <img src="/images/lari-icon.png" alt="₾" width={38} height={38} style={{ objectFit: "contain" }} />
  );
}

function FireIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2C10 2 6 6.5 6 10.5C6 13 7.8 15 10 15C12.2 15 14 13 14 10.5C14 6.5 10 2 10 2Z" fill="#FF6B35" />
      <path d="M10 7C10 7 8 9.5 8 11.5C8 12.9 8.9 14 10 14C11.1 14 12 12.9 12 11.5C12 9.5 10 7 10 7Z" fill="#FFD700" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="#FFD700">
      <path d="M10 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L10 14.2l-4.8 2.4.9-5.3L2.3 7.6l5.3-.8L10 2z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FF6B9D" strokeWidth="1.8">
      <path d="M10 17s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" fill="rgba(255,107,157,0.15)" />
    </svg>
  );
}

/* ───────── GAME CARD ───────── */

function GameCard({ game, size = "medium", onPlay }: {
  game: typeof ALL_GAMES[0];
  size?: "medium" | "large";
  onPlay: (id: string) => void;
}) {
  const sizeClass = size === "large"
    ? "w-[calc(50%-6px)] aspect-[1/1.1]"
    : "w-[130px] h-[130px] shrink-0";

  return (
    <div
      className={`${sizeClass} rounded-[36px] relative overflow-hidden cursor-pointer active:scale-[0.97] transition-transform`}
      style={{ background: game.gradient }}
      onClick={() => onPlay(game.id)}
    >
      {game.type === "video" ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={game.media}
        />
      ) : game.type === "image" ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={game.media} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[20%] left-[10%] w-[50px] h-[50px] rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />
          <div className="absolute bottom-[15%] right-[15%] w-[35px] h-[35px] rounded-[10px] rotate-45" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>
        <span className="text-[16px] font-bold text-white leading-tight" style={{ fontFamily: "var(--font-outfit)", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
          {game.name}
        </span>
      </div>
    </div>
  );
}

/* ───────── SECTION HEADER ───────── */

function SectionHeader({ icon, title, showSeeAll = false }: {
  icon: React.ReactNode;
  title: string;
  showSeeAll?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-[19px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
          {title}
        </h2>
      </div>
      {showSeeAll && (
        <button className="text-[14px] text-[#9CA3AF] font-medium transition-colors hover:text-white" style={{ fontFamily: "var(--font-dm-sans)" }}>
          See All
        </button>
      )}
    </div>
  );
}

/* ───────── MAIN ───────── */

export default function GamesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [playedGames, setPlayedGames] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const [cash, setCash] = useState(0);
  const [mode, setMode] = useState<"cash" | "coins">("coins");
  const [showCashNotif, setShowCashNotif] = useState(false);
  const [activeGameTypes, setActiveGameTypes] = useState<string[]>(["slot", "plinko", "chicken_rush"]);

  useEffect(() => {
    setCoins(getCoinBalance());
    setCash(getCashBalance());
    setPlayedGames(getPlayedGames());
    if (getStoredToken()) {
      apiFetch("/games/config").then((data: any) => {
        if (data?.games) {
          setActiveGameTypes(data.games.filter((g: any) => g.isActive).map((g: any) => g.gameType));
        }
      }).catch(() => {});
    }
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handlePlay = (id: string) => {
    markGamePlayed(id);
    setPlayedGames(getPlayedGames());
    if (id === "midnight-machine") router.push("/games/midnight-machine");
    if (id === "lucky-drop") router.push("/games/lucky-drop");
    if (id === "chicken-rush") router.push("/games/chicken-rush");
  };

  const handleTabChange = (idx: number) => {
    setActiveTab(idx);
    if (idx === 0) router.push("/home");
    if (idx === 2) router.push("/scan");
  };

  const stagger = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.5s ease-out ${i * 0.08}s`,
  });

  const favoriteGames = playedGames.map((id) => getGame(id)).filter((g): g is NonNullable<typeof g> => !!g && (!g.gameType || activeGameTypes.includes(g.gameType)));

  return (
    <AuthGuard>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="min-h-[100dvh] bg-black pb-[90px]">
        <div className="max-w-[430px] mx-auto px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-5" style={stagger(0)}>
            <div className="flex-1" />
            <div className="flex items-center gap-1 rounded-full overflow-hidden p-1" style={{ background: "#1C1C1E" }}>
              <button
                onClick={() => setShowCashNotif(true)}
                className="flex items-center justify-center gap-1 px-3 py-1.5 transition-all duration-200 rounded-full min-w-[80px]"
                style={{ background: mode === "cash" ? "#FFFFFF" : "transparent" }}
              >
                <CashIcon />
                <span className={`text-[11px] font-bold ${mode === "cash" ? "text-black" : "text-white"}`} style={{ fontFamily: "var(--font-outfit)" }}>{cash.toFixed(2)}</span>
              </button>
              <button
                onClick={() => setMode("coins")}
                className="flex items-center justify-center gap-1 px-3 py-1.5 transition-all duration-200 rounded-full min-w-[80px]"
                style={{ background: mode === "coins" ? "#FFFFFF" : "transparent" }}
              >
                <img src="/images/coin-icon.png" alt="Coin" width={16} height={16} style={{ objectFit: "contain" }} />
                <span className={`text-[11px] font-bold ${mode === "coins" ? "text-black" : "text-white"}`} style={{ fontFamily: "var(--font-outfit)" }}>{coins.toLocaleString()}</span>
              </button>
            </div>
            <div className="flex-1 flex justify-end">
              <div className="w-[44px] h-[44px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: "#1C1C1E" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="9" r="4" fill="#FFD700" />
                  <circle cx="15" cy="9" r="4" fill="#FFD700" opacity="0.7" />
                  <circle cx="12" cy="15" r="4" fill="#FFD700" opacity="0.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Play for Cash label ── */}
          <p className="text-white text-center text-[19px] font-bold mb-6" style={{ ...stagger(0), fontFamily: "var(--font-outfit)" }}>
            Play with Coins
          </p>

          {/* ── Your Favorites ── */}
          <div style={stagger(1)}>
            <SectionHeader
              icon={<FireIcon />}
              title="Your Favorites"
              showSeeAll={favoriteGames.length > 0}
            />
            {favoriteGames.length === 0 ? (
              <div className="mb-4" style={{ minHeight: 100 }} />
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-4">
                {favoriteGames.map((game) => (
                  <GameCard key={game.id} game={game} onPlay={handlePlay} />
                ))}
              </div>
            )}
          </div>

          {/* ── Newly Added ── */}
          <div style={stagger(2)} className="mt-2">
            <SectionHeader icon={<StarIcon />} title="Newly Added" />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-4">
              {NEWLY_ADDED.map((id) => {
                const game = getGame(id);
                if (!game || (game.gameType && !activeGameTypes.includes(game.gameType))) return null;
                return <GameCard key={id} game={game} onPlay={handlePlay} />;
              })}
            </div>
          </div>

          {/* ── Fan Favorites ── */}
          <div style={stagger(3)} className="mt-2">
            <SectionHeader icon={<FireIcon />} title="Fan Favorites" showSeeAll />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-4">
              {FAN_FAVORITES.map((id) => {
                const game = getGame(id);
                if (!game || (game.gameType && !activeGameTypes.includes(game.gameType))) return null;
                return <GameCard key={id} game={game} onPlay={handlePlay} />;
              })}
            </div>
          </div>

          {/* ── Coverd Favorites ── */}
          <div style={stagger(4)} className="mt-2">
            <SectionHeader icon={<HeartIcon />} title="Coverd Favorites" />
            <div className="flex gap-3 flex-wrap mb-4">
              {COVERD_FAVORITES.map((id) => {
                const game = getGame(id);
                if (!game || (game.gameType && !activeGameTypes.includes(game.gameType))) return null;
                return <GameCard key={id} game={game} size="large" onPlay={handlePlay} />;
              })}
            </div>
          </div>

        </div>

        {/* ── Bottom Tab Bar ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
          <div
            className="flex items-center px-2 py-1.5 rounded-full gap-0"
            style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(50px) saturate(200%) brightness(1.1)",
              WebkitBackdropFilter: "blur(50px) saturate(200%) brightness(1.1)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 0.5px 0 rgba(255,255,255,0.1), inset 0 -0.5px 0 rgba(0,0,0,0.2)",
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
                  onClick={() => handleTabChange(idx)}
                  className="flex flex-col items-center px-5 py-1.5 rounded-full transition-all duration-200"
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

      {/* Cash notification popup */}
      {showCashNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowCashNotif(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative rounded-[20px] px-8 py-10 flex flex-col items-center max-w-[320px] w-full"
            style={{
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
              border: "1px solid rgba(255,255,255,0.2)",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img src="/images/coin-icon.png" alt="Coin" width={48} height={48} style={{ objectFit: "contain" }} className="mb-4" />
            <h3
              className="text-white text-[20px] font-bold text-center mb-2"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Coins Only
            </h3>
            <p
              className="text-[#999] text-[14px] text-center"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Games are available only with Coins
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </AuthGuard>
  );
}
