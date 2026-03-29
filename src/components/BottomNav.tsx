"use client";

import { useRouter, usePathname } from "next/navigation";
import Icon from "./Icon";

const TABS = [
  { icon: "home" as const, label: "მთავარი", path: "/home" },
  { icon: "scan" as const, label: "სკანი", path: "/scan" },
  { icon: "game" as const, label: "თამაში", path: "/game" },
  { icon: "user" as const, label: "პროფილი", path: "/profile" },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0F1C]"
      style={{ borderTop: "1px solid #1C2539" }}
    >
      <div
        className="max-w-[430px] mx-auto flex"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
      >
        {TABS.map((tab) => {
          const isActive = pathname === tab.path || pathname.startsWith(tab.path + "/");
          return (
            <button
              key={tab.icon}
              onClick={() => router.push(tab.path)}
              className="flex-1 flex flex-col items-center pt-2 pb-1 relative transition-colors duration-200"
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[24px] h-[3px] rounded-full bg-[#00E88F]" />
              )}
              <Icon name={tab.icon} size={22} color={isActive ? "#00E88F" : "#475569"} />
              <span
                className="text-[11px] mt-1 font-medium"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  color: isActive ? "#00E88F" : "#475569",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
