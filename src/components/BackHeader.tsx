"use client";

import { useRouter } from "next/navigation";

interface BackHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export default function BackHeader({ title, rightAction }: BackHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center transition-all duration-200 hover:bg-[#1C2539] active:scale-95"
          style={{ background: "#141B2D", border: "1px solid #1C2539" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4L6 9l5 5" />
          </svg>
        </button>
        <h1
          className="text-[20px] font-bold text-[#F1F5F9]"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          {title}
        </h1>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
}
