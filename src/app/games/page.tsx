"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ───────── GAMES DATA ───────── */

const ALL_GAMES = [
  { id: "midnight-machine", name: "Midnight Machine", gradient: "linear-gradient(135deg, #4338CA, #6366F1)", media: "/images/onboarding/slot-machine.mp4", type: "video" as const },
  { id: "coverd-21", name: "Coverd 21", gradient: "linear-gradient(135deg, #B45309, #D97706)", media: "/images/onboarding/coverd21.mp4", type: "video" as const },
  { id: "chicken-rush", name: "Chicken Rush", gradient: "linear-gradient(135deg, #DC2626, #F59E0B)", media: "/images/onboarding/chicken-rush.webp", type: "image" as const },
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

const NEWLY_ADDED = ["cctv-game", "buffalo-extreme", "black-friday", "treasure-hunt"];
const FAN_FAVORITES = ["wild-tiger", "crash-x", "wanted", "chicken-rush"];
const COVERD_FAVORITES = ["coverd-21", "midnight-machine"];

function getGame(id: string) {
  return ALL_GAMES.find((g) => g.id === id)!;
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
  const [mode, setMode] = useState<"cash" | "practice">("cash");

  useEffect(() => {
    setPlayedGames(getPlayedGames());
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handlePlay = (id: string) => {
    markGamePlayed(id);
    setPlayedGames(getPlayedGames());
  };

  const handleTabChange = (idx: number) => {
    setActiveTab(idx);
    if (idx === 0) router.push("/home");
  };

  const stagger = (i: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.5s ease-out ${i * 0.08}s`,
  });

  const favoriteGames = playedGames.map((id) => getGame(id)).filter(Boolean);

  return (
    <>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="min-h-[100dvh] bg-black pb-[90px]">
        <div className="max-w-[430px] mx-auto px-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-5" style={stagger(0)}>
            <div className="flex-1" />
            <div className="flex items-center gap-1 rounded-full overflow-hidden p-1" style={{ background: "#1C1C1E" }}>
              <button
                onClick={() => setMode("cash")}
                className="flex items-center justify-center gap-1 px-3 py-1.5 transition-all duration-200 rounded-full min-w-[80px]"
                style={{ background: mode === "cash" ? "#FFFFFF" : "transparent" }}
              >
                <CashIcon />
                <span className={`text-[11px] font-bold ${mode === "cash" ? "text-black" : "text-white"}`} style={{ fontFamily: "var(--font-outfit)" }}>28</span>
              </button>
              <button
                onClick={() => setMode("practice")}
                className="flex items-center justify-center gap-1 px-3 py-1.5 transition-all duration-200 rounded-full min-w-[80px]"
                style={{ background: mode === "practice" ? "#FFFFFF" : "transparent" }}
              >
                <span className="text-[12px]">🪙</span>
                <span className={`text-[11px] font-bold ${mode === "practice" ? "text-black" : "text-white"}`} style={{ fontFamily: "var(--font-dm-sans)" }}>Practice</span>
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
            {mode === "cash" ? "Play for Cash" : "Practice Mode"}
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
              { label: "My Card", idx: 2, icon: (a: boolean) => (
                <svg width="24" height="22" viewBox="0 0 24 22" fill={a ? "#FFF" : "none"} stroke={a ? "#FFF" : "rgba(255,255,255,0.4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="14" rx="3" />
                  {!a && <path d="M2 9h20" />}
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
    </>
  );
}
