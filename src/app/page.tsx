"use client";

import React, { useState } from "react";
import localFont from "next/font/local";

const dachiFont = localFont({
  src: "./fonts/DachiTheLynx.otf",
  variable: "--font-dachi",
});

// SVG circular progress
function CircularProgress({
  size,
  strokeWidth,
  progress,
  color,
  bgColor,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  bgColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke={bgColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {progress > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
    </svg>
  );
}

const activities = [
  { emoji: "🏃", name: "სირბილი" },
  { emoji: "🚶", name: "სეირნობა" },
  { emoji: "🏊", name: "ცურვა" },
  { emoji: "🚴", name: "ველოსიპედი" },
  { emoji: "🧘", name: "იოგა" },
  { emoji: "🏋️", name: "ძალოვანი" },
  { emoji: "⚽", name: "ფეხბურთი" },
  { emoji: "🎾", name: "ჩოგბურთი" },
  { emoji: "🏀", name: "კალათბურთი" },
  { emoji: "💃", name: "ცეკვა" },
  { emoji: "🥊", name: "კრივი" },
  { emoji: "⛷️", name: "თხილამური" },
  { emoji: "🧗", name: "ალპინიზმი" },
  { emoji: "🤸", name: "ტანვარჯიში" },
];

// Bottom sheet modal for adding food
function AddFoodSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-slideUp">
        <div className="bg-white rounded-t-[24px] px-5 pt-3 pb-10">
          {/* Handle */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-[5px] rounded-full bg-[#ddd]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[22px] font-extrabold text-[#2d2d2d]">
              დაამატე საკვები
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {/* Text search */}
            <button className="flex items-center gap-4 p-4 rounded-2xl border border-[#FFE0B2] bg-[#FFF8F0]">
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#F57C00] flex items-center justify-center shrink-0">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h10M4 18h14" />
                  <circle cx="19" cy="12" r="3" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-[17px] font-bold text-[#2d2d2d] block">
                  ტექსტით
                </span>
                <span className="text-[13px] text-[#999]">ჩაწერე</span>
              </div>
            </button>

            {/* Camera */}
            <button className="flex items-center gap-4 p-4 rounded-2xl border border-[#BBDEFB] bg-[#F0F7FF]">
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#42A5F5] flex items-center justify-center shrink-0">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-[17px] font-bold text-[#2d2d2d] block">
                  კამერა
                </span>
                <span className="text-[13px] text-[#999]">გადაულე ფოტო</span>
              </div>
            </button>

            {/* Gallery */}
            <button className="flex items-center gap-4 p-4 rounded-2xl border border-[#D1C4E9] bg-[#F5F0FF]">
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#7E57C2] flex items-center justify-center shrink-0">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12l5-5 5 5" />
                  <path d="M12 7v10" />
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-[17px] font-bold text-[#2d2d2d] block">
                  გალერეა
                </span>
                <span className="text-[13px] text-[#999]">
                  ატვირთე ფოტო
                </span>
              </div>
            </button>

            {/* Favorites */}
            <button className="flex items-center gap-4 p-4 rounded-2xl border border-[#C8E6C9] bg-[#F0FFF0]">
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#4CAF50] flex items-center justify-center shrink-0">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-[17px] font-bold text-[#2d2d2d] block">
                  ფავორიტები
                </span>
                <span className="text-[13px] text-[#999]">შენი კერძები</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Settings bottom sheet
function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [weightGoalType, setWeightGoalType] = useState<
    "კლება" | "შენარჩუნება"
  >("კლება");
  const [regime, setRegime] = useState<"standard" | "fast">("standard");

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-slideUp">
        <div className="bg-white rounded-t-[24px] px-5 pt-3 pb-8">
          {/* Handle */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-[5px] rounded-full bg-[#ddd]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[22px] font-extrabold text-[#2d2d2d]">
              კალორიების რედაქტირება
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Weight goal type */}
          <p className="text-[15px] font-semibold text-[#2d2d2d] mb-2.5">
            წონის მიზანი
          </p>
          <div className="flex rounded-2xl border border-[#e0e0e0] overflow-hidden mb-5">
            {(["კლება", "შენარჩუნება"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setWeightGoalType(type)}
                className={`flex-1 py-3 text-[14px] font-semibold transition-colors ${
                  weightGoalType === type
                    ? "bg-[#E8F5E9] text-[#4CAF50] border border-[#4CAF50] rounded-2xl -m-px z-10"
                    : "text-[#888]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Regime - only shown for კლება and მატება */}
          {weightGoalType !== "შენარჩუნება" && (
            <>
              <p className="text-[15px] font-semibold text-[#2d2d2d] mb-2.5">
                რეჟიმი
              </p>
              <div className="flex rounded-2xl border border-[#e0e0e0] overflow-hidden mb-5">
                <button
                  onClick={() => setRegime("standard")}
                  className={`flex-1 py-3 px-3 flex flex-col items-center rounded-2xl transition-colors ${
                    regime === "standard"
                      ? "bg-[#8BC34A] text-white -m-px z-10 border border-[#7CB342]"
                      : "text-[#888]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={regime === "standard" ? "#fff" : "#888"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="text-[14px] font-bold">სტანდარტული</span>
                  </div>
                  <span
                    className={`text-[11px] ${
                      regime === "standard" ? "text-white/80" : "text-[#aaa]"
                    }`}
                  >
                    კვირაში 0.5 კგ
                  </span>
                </button>
                <button
                  onClick={() => setRegime("fast")}
                  className={`flex-1 py-3 px-3 flex flex-col items-center rounded-2xl transition-colors ${
                    regime === "fast"
                      ? "bg-[#8BC34A] text-white -m-px z-10 border border-[#7CB342]"
                      : "text-[#888]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={regime === "fast" ? "#fff" : "#888"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
                    </svg>
                    <span className="text-[14px] font-bold">სწრაფი</span>
                  </div>
                  <span
                    className={`text-[11px] ${
                      regime === "fast" ? "text-white/80" : "text-[#aaa]"
                    }`}
                  >
                    კვირაში 0.8 - 1 კგ
                  </span>
                </button>
              </div>
            </>
          )}

          {/* Daily limit */}
          <p className="text-[15px] font-semibold text-[#2d2d2d] mb-2.5">
            დღიური ლიმიტი
          </p>
          <div className="flex items-center p-4 rounded-2xl border border-[#e0e0e0] mb-2">
            <div className="w-10 h-10 rounded-full bg-[#FFF3E0] flex items-center justify-center mr-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#FF6B35"
                stroke="#FF6B35"
                strokeWidth="1"
              >
                <path d="M12 22c4.97 0 8-3.582 8-8 0-4.418-4-8-4-8s0 4-4 4c-2 0-2-2-2-2S6 11.582 6 14c0 4.418 2.03 8 6 8z" />
              </svg>
            </div>
            <span className="text-[15px] text-[#888] flex-1">სულ:</span>
            <span className="text-[32px] font-bold text-[#2d2d2d] leading-none">
              {weightGoalType === "შენარჩუნება"
                ? 2273
                : regime === "fast"
                ? 1676
                : 1976}
            </span>
            <span className="text-[15px] text-[#888] ml-2">კკალ</span>
          </div>
          <p className="text-[12px] text-[#aaa] text-center mb-5">
            ცვლილება ავტომატურად გადაითვლის მაკროებს
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-[#e0e0e0] text-[16px] font-bold text-[#2d2d2d]"
            >
              გაუქმება
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-[#4CAF50] text-[16px] font-bold text-white"
            >
              შენახვა
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CaloriesPage() {
  const [waterMl, setWaterMl] = useState(0);
  const [weight, setWeight] = useState(65.0);
  const [showAddFood, setShowAddFood] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const waterGoal = 2145;
  const waterPercent = Math.round((waterMl / waterGoal) * 100);

  return (
    <div
      className={`${dachiFont.variable} min-h-screen bg-[#f5f5f5] max-w-md mx-auto flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
        <h1
          className="text-[22px] text-[#2d2d2d]"
          style={{ fontFamily: "var(--font-dachi)" }}
        >
          ანუკას კალორიები
        </h1>
        <button className="w-11 h-11 rounded-full border-[1.5px] border-gray-300 flex items-center justify-center bg-white">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#333"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-28">
        {/* Main Calories Card */}
        <div className="bg-white rounded-[20px] p-5 pt-4 mb-3 shadow-sm">
          {/* Title */}
          <div className="flex items-center justify-center mb-3 relative">
            <span className="flex-1" />
            <h2 className="text-[22px] font-extrabold text-[#2d2d2d] text-center">
              დღეს
            </h2>
            <span className="flex-1 flex justify-end">
              <button onClick={() => setShowSettings(true)}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#bbb"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </button>
            </span>
          </div>

          {/* Big circular progress */}
          <div className="flex justify-center mb-5 relative">
            <CircularProgress
              size={200}
              strokeWidth={10}
              progress={0}
              color="#4CAF50"
              bgColor="#e8e8e8"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm text-[#b0b0b0]">დაგრჩა</span>
              <span className="text-[46px] font-bold text-[#4CAF50] leading-[52px]">
                1976
              </span>
              <span className="text-sm text-[#b0b0b0] -mt-0.5">კკალ</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex justify-around mb-3 px-2.5">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-0.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="#FF6B35"
                  stroke="#FF6B35"
                  strokeWidth="1"
                >
                  <path d="M12 22c4.97 0 8-3.582 8-8 0-4.418-4-8-4-8s0 4-4 4c-2 0-2-2-2-2S6 11.582 6 14c0 4.418 2.03 8 6 8z" />
                </svg>
                <span className="text-[13px] text-[#999]">მიღებული</span>
              </div>
              <span className="text-[38px] font-bold text-[#2d2d2d] leading-[44px]">
                0
              </span>
              <span className="text-[13px] text-[#b0b0b0] -mt-0.5">კკალ</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-0.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#888"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" fill="#888" />
                </svg>
                <span className="text-[13px] text-[#999]">მიზანი</span>
              </div>
              <span className="text-[38px] font-bold text-[#2d2d2d] leading-[44px]">
                1976
              </span>
              <span className="text-[13px] text-[#b0b0b0] -mt-0.5">კკალ</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#ebebeb] mx-2 my-3.5" />

          {/* Macros */}
          <div className="flex justify-around pb-1.5 px-1">
            {/* Carbs */}
            <div className="flex flex-col items-center">
              <div className="relative w-[82px] h-[82px] flex items-center justify-center mb-2">
                <CircularProgress
                  size={82}
                  strokeWidth={6}
                  progress={0}
                  color="#E8A0BF"
                  bgColor="#F5DFE9"
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-[20px] font-bold text-[#2d2d2d] leading-6">
                    0
                  </span>
                  <span className="text-[11px] text-[#aaa] -mt-px">
                    / 246გ
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#777]">ნახშირწყლები</span>
            </div>
            {/* Fats */}
            <div className="flex flex-col items-center">
              <div className="relative w-[82px] h-[82px] flex items-center justify-center mb-2">
                <CircularProgress
                  size={82}
                  strokeWidth={6}
                  progress={0}
                  color="#90B8DE"
                  bgColor="#DAEAF8"
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-[20px] font-bold text-[#2d2d2d] leading-6">
                    0
                  </span>
                  <span className="text-[11px] text-[#aaa] -mt-px">
                    / 51გ
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#777]">ცხიმები</span>
            </div>
            {/* Protein */}
            <div className="flex flex-col items-center">
              <div className="relative w-[82px] h-[82px] flex items-center justify-center mb-2">
                <CircularProgress
                  size={82}
                  strokeWidth={6}
                  progress={0}
                  color="#E8D5A0"
                  bgColor="#F5EDDA"
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-[20px] font-bold text-[#2d2d2d] leading-6">
                    0
                  </span>
                  <span className="text-[11px] text-[#aaa] -mt-px">
                    / 133გ
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#777]">ცილები</span>
            </div>
          </div>
        </div>

        {/* Meal Cards */}
        {[
          { emoji: "🍳", title: "საუზმე", bg: "#FFF3E0" },
          { emoji: "🍲", title: "სადილი", bg: "#FFF3E0" },
          { emoji: "🥗", title: "ვახშამი", bg: "#F1F8E9" },
          { emoji: "🥜", title: "სნეკი", bg: "#FFF3E0" },
        ].map((meal) => (
          <div
            key={meal.title}
            className="bg-white rounded-[18px] px-4 py-4 mb-2.5 flex items-center shadow-sm"
          >
            <div
              className="w-[50px] h-[50px] rounded-[15px] flex items-center justify-center"
              style={{ backgroundColor: meal.bg }}
            >
              <span className="text-[26px]">{meal.emoji}</span>
            </div>
            <span className="text-lg font-bold text-[#2d2d2d] ml-3.5 flex-1">
              {meal.title}
            </span>
            <button
              onClick={() => setShowAddFood(true)}
              className="w-9 h-9 rounded-full border-[1.5px] border-[#e0e0e0] flex items-center justify-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#bbb"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        ))}

        {/* Water Section */}
        <div className="bg-white rounded-[20px] p-5 mt-1.5 mb-3 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[22px]">💧</span>
              <span className="text-[20px] font-extrabold text-[#2d2d2d]">
                წყალი
              </span>
            </div>
            <div className="bg-[#E8F5E9] px-3 py-1 rounded-xl">
              <span className="text-[13px] font-bold text-[#4CAF50]">
                {waterPercent}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-3.5">
            <div>
              <div className="flex items-baseline">
                <span className="text-[42px] font-bold text-[#1E88E5] leading-[48px]">
                  {waterMl}
                </span>
                <span className="text-base text-[#888] ml-1.5">მლ</span>
              </div>
              <span className="text-[13px] text-[#aaa] mt-0.5">
                მიზანი: {waterGoal} მლ
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setWaterMl(Math.max(0, waterMl - 250))}
                className="w-11 h-11 rounded-full border-[1.5px] border-[#e0e0e0] flex items-center justify-center"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#555"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M5 12h14" />
                </svg>
              </button>
              <div className="w-[52px] h-[52px] rounded-full bg-[#E3F2FD] flex items-center justify-center">
                <span className="text-2xl">💧</span>
              </div>
              <button
                onClick={() => setWaterMl(waterMl + 250)}
                className="w-11 h-11 rounded-full border-[1.5px] border-[#e0e0e0] flex items-center justify-center"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#555"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
          <div className="h-2 bg-[#E3F2FD] rounded-full overflow-hidden">
            <div
              className="h-2 bg-[#42A5F5] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(waterPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Weight Section */}
        <div className="bg-white rounded-[20px] p-5 mb-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[20px]">⚖️</span>
            <span className="text-[20px] font-extrabold text-[#2d2d2d]">
              წონა
            </span>
          </div>
          <p className="text-[13px] text-[#aaa] mb-3.5">მიზანი: 58 კგ</p>
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={() => setWeight(Math.max(0, +(weight - 0.1).toFixed(1)))}
              className="w-[46px] h-[46px] rounded-full border-2 border-[#FFCC80] flex items-center justify-center"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F57C00"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M5 12h14" />
              </svg>
            </button>
            <span className="text-[34px] font-bold text-[#2d2d2d]">
              {weight.toFixed(1)}{" "}
              <span className="text-[20px] font-semibold">კგ</span>
            </span>
            <button
              onClick={() => setWeight(+(weight + 0.1).toFixed(1))}
              className="w-[46px] h-[46px] rounded-full border-2 border-[#FFCC80] flex items-center justify-center"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F57C00"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Activity Section */}
        <div className="bg-white rounded-[20px] p-5 mb-3 shadow-sm">
          <div className="flex justify-between items-center mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">⚡</span>
              <span className="text-[20px] font-extrabold text-[#2d2d2d]">
                აქტივობა
              </span>
            </div>
            <button className="flex items-center border-[1.5px] border-[#F57C00] rounded-full px-3.5 py-1.5">
              <span className="text-sm font-bold text-[#F57C00]">+ </span>
              <span className="text-[13px] font-semibold text-[#F57C00]">
                დამატება
              </span>
            </button>
          </div>
          {/* Activity carousel */}
          <div className="overflow-x-auto mb-3.5 -mx-1 scrollbar-hide">
            <div className="flex gap-2.5 px-1" style={{ width: "max-content" }}>
              {activities.map((a) => (
                <button
                  key={a.name}
                  className="flex items-center gap-1.5 bg-[#f5f5f5] rounded-full px-3.5 py-2 shrink-0"
                >
                  <span className="text-base">{a.emoji}</span>
                  <span className="text-[13px] font-semibold text-[#555]">
                    {a.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="h-px bg-[#ebebeb] mb-3.5" />
          <p className="text-[13px] text-[#bbb]">ვარჯიში არ დამატებულა</p>
        </div>
      </div>

      {/* Sheets */}
      <AddFoodSheet open={showAddFood} onClose={() => setShowAddFood(false)} />
      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)} />

      {/* FAB */}
      <button
        onClick={() => setShowAddFood(true)}
        className="fixed bottom-24 right-6 w-[62px] h-[62px] rounded-full bg-[#4CAF50] flex items-center justify-center shadow-lg shadow-green-800/35 z-10 max-w-md"
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex px-1.5 pt-1.5 pb-5 max-w-md mx-auto">
        <button className="flex-1 flex flex-col items-center py-2 rounded-[20px] mx-0.5 bg-[#f0f0f0]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span className="text-[11px] text-[#333] mt-1 font-bold">
            დღიური
          </span>
        </button>
        <button className="flex-1 flex flex-col items-center py-2 rounded-[20px] mx-0.5">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 2C12 2 12 8 12 10M8 2C8 2 7 7 10 9M16 2C16 2 17 7 14 9" />
            <path d="M7 12h10c0 5-2.24 9-5 9s-5-4-5-9z" />
          </svg>
          <span className="text-[11px] text-[#999] mt-1 font-medium">
            კვება
          </span>
        </button>
        <button className="flex-1 flex flex-col items-center py-2 rounded-[20px] mx-0.5">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="2"
          >
            <rect x="3" y="12" width="4" height="9" rx="1" />
            <rect x="10" y="7" width="4" height="14" rx="1" />
            <rect x="17" y="3" width="4" height="18" rx="1" />
          </svg>
          <span className="text-[11px] text-[#999] mt-1 font-medium">
            პროგრესი
          </span>
        </button>
        <button className="flex-1 flex flex-col items-center py-2 rounded-[20px] mx-0.5">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" />
          </svg>
          <span className="text-[11px] text-[#999] mt-1 font-medium">
            ასისტენტი
          </span>
        </button>
      </div>
    </div>
  );
}
