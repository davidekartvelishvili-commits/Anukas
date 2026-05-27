"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import localFont from "next/font/local";

const dachiFont = localFont({
  src: "./fonts/DachiTheLynx.otf",
  variable: "--font-dachi",
});

// Animated number that rolls up/down like a slot machine
function AnimatedNumber({
  value,
  className,
  duration = 600,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const animRef = useRef<number | null>(null);
  const startRef = useRef(value);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    startRef.current = display;
    startTimeRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(
        startRef.current + (value - startRef.current) * eased
      );
      setDisplay(current);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}

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

// Food item type
interface FoodItem {
  name: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  portion: string;
  meal: string;
  time: string;
}

// Activity item type
interface ActivityItem {
  name: string;
  emoji: string;
  duration: number; // minutes
  caloriesBurned: number;
  time: string;
}

// Calorie burn rates per minute for each activity
const activityCalRates: Record<string, number> = {
  "სირბილი": 10,
  "სეირნობა": 4,
  "ცურვა": 8,
  "ველოსიპედი": 7,
  "იოგა": 3,
  "ძალოვანი": 6,
  "ფეხბურთი": 9,
  "ჩოგბურთი": 8,
  "კალათბურთი": 8,
  "ცეკვა": 5,
  "კრივი": 10,
  "თხილამური": 7,
  "ალპინიზმი": 9,
  "ტანვარჯიში": 5,
};

// Bottom sheet modal for adding food
function AddFoodSheet({
  open,
  onClose,
  onAdd,
  currentMeal,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: FoodItem) => void;
  currentMeal: string;
}) {
  const [mode, setMode] = useState<"menu" | "text" | "result">("menu");
  const [textInput, setTextInput] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(currentMeal);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodItem | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setMode("menu");
        setTextInput("");
        setResult(null);
        setError("");
        setSelectedMeal(currentMeal);
      }, 300);
    }
  }, [open]);

  async function analyzeFood(text?: string, image?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      // Handle array (multiple items) - take first for now
      const item = Array.isArray(data) ? data[0] : data;
      const now = new Date();
      setResult({
        ...item,
        meal: currentMeal,
        time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      });
      setMode("result");
    } catch {
      setError("შეცდომა. სცადე თავიდან.");
    }
    setLoading(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      analyzeFood(undefined, reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-slideUp">
        <div className="bg-white rounded-t-[24px] px-5 pt-3 pb-10">
          <div className="flex justify-center mb-5">
            <div className="w-10 h-[5px] rounded-full bg-[#ddd]" />
          </div>

          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[22px] font-extrabold text-[#2d2d2d]">
              {mode === "result" ? "ნაპოვნია" : "დაამატე საკვები"}
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-10">
              <div className="w-10 h-10 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[15px] text-[#888]">Claude ანალიზს აკეთებს...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-6">
              <p className="text-[15px] text-red-500 mb-4">{error}</p>
              <button
                onClick={() => { setError(""); setMode("menu"); }}
                className="px-6 py-2.5 rounded-xl bg-[#f0f0f0] text-[14px] font-bold text-[#555]"
              >
                თავიდან სცადე
              </button>
            </div>
          )}

          {/* Menu mode */}
          {mode === "menu" && !loading && !error && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setMode("text")}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[#FFE0B2] bg-[#FFF8F0]"
              >
                <div className="w-[52px] h-[52px] rounded-[16px] bg-[#F57C00] flex items-center justify-center shrink-0">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h16M4 12h10M4 18h14" />
                    <circle cx="19" cy="12" r="3" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-[17px] font-bold text-[#2d2d2d] block">ტექსტით</span>
                  <span className="text-[13px] text-[#999]">ჩაწერე</span>
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[#BBDEFB] bg-[#F0F7FF]"
              >
                <div className="w-[52px] h-[52px] rounded-[16px] bg-[#42A5F5] flex items-center justify-center shrink-0">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-[17px] font-bold text-[#2d2d2d] block">კამერა / გალერეა</span>
                  <span className="text-[13px] text-[#999]">გადაიღე ან ატვირთე ფოტო</span>
                </div>
              </button>
            </div>
          )}

          {/* Text input mode */}
          {mode === "text" && !loading && !error && (
            <div>
              <p className="text-[14px] text-[#888] mb-3">
                ჩაწერე რა შეჭამე (მაგ: &quot;ხაჭაპური&quot;, &quot;2 კვერცხი და პური&quot;)
              </p>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="მაგ: ერთი თეფში ხინკალი, სალათი..."
                className="w-full p-4 rounded-2xl border border-[#e0e0e0] text-[16px] text-[#2d2d2d] resize-none outline-none focus:border-[#4CAF50] transition-colors"
                rows={3}
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setMode("menu")}
                  className="flex-1 py-3 rounded-2xl border border-[#e0e0e0] text-[15px] font-bold text-[#888]"
                >
                  უკან
                </button>
                <button
                  onClick={() => textInput.trim() && analyzeFood(textInput)}
                  disabled={!textInput.trim()}
                  className="flex-1 py-3 rounded-2xl bg-[#4CAF50] text-[15px] font-bold text-white disabled:opacity-40"
                >
                  გაანალიზე
                </button>
              </div>
            </div>
          )}

          {/* Result mode */}
          {mode === "result" && result && !loading && (
            <div>
              {/* Calorie summary card */}
              <div className="bg-[#f9f9f9] rounded-2xl p-4 mb-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF6B35" stroke="#FF6B35" strokeWidth="1">
                    <path d="M12 22c4.97 0 8-3.582 8-8 0-4.418-4-8-4-8s0 4-4 4c-2 0-2-2-2-2S6 11.582 6 14c0 4.418 2.03 8 6 8z" />
                  </svg>
                  <span className="text-[32px] font-bold text-[#2d2d2d]">{result.calories}</span>
                  <span className="text-[16px] text-[#999] mt-2">კკალ</span>
                </div>
                <div className="flex justify-around">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#E8D5A0]" />
                    <span className="text-[14px] font-bold text-[#2d2d2d]">{result.protein}გ</span>
                    <span className="text-[12px] text-[#999]">ცილა</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#E8A0BF]" />
                    <span className="text-[14px] font-bold text-[#2d2d2d]">{result.carbs}გ</span>
                    <span className="text-[12px] text-[#999]">ნახშ.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#90B8DE]" />
                    <span className="text-[14px] font-bold text-[#2d2d2d]">{result.fat}გ</span>
                    <span className="text-[12px] text-[#999]">ცხიმი</span>
                  </div>
                </div>
              </div>

              {/* Ingredient row with delete */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-[14px] font-bold text-[#2d2d2d]">1 ინგრედიენტი</p>
              </div>
              <div className="bg-[#f9f9f9] rounded-2xl px-4 py-3 mb-5 flex items-center">
                <div className="w-8 h-8 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center mr-3 text-[12px] font-bold text-[#888]">1</div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-[#2d2d2d]">{result.name} <span className="font-normal text-[#999]">{result.portion}</span></p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-[11px]"><span className="text-[#E8D5A0]">{'\u25CF'}</span> {result.protein}გ</span>
                    <span className="text-[11px]"><span className="text-[#E8A0BF]">{'\u25CF'}</span> {result.carbs}გ</span>
                    <span className="text-[11px]"><span className="text-[#90B8DE]">{'\u25CF'}</span> {result.fat}გ</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-1">
                    <p className="text-[16px] font-bold text-[#2d2d2d]">{result.calories}</p>
                    <p className="text-[10px] text-[#999]">კკალ</p>
                  </div>
                  <button
                    onClick={() => { setResult(null); setMode("menu"); }}
                    className="w-9 h-9 rounded-xl bg-[#FEE2E2] flex items-center justify-center"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Meal selector */}
              <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                {["საუზმე", "სადილი", "ვახშამი", "სნეკი"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMeal(m)}
                    className={`px-5 py-2.5 rounded-full text-[13px] font-bold shrink-0 transition-colors ${
                      selectedMeal === m
                        ? "bg-[#E8F5E9] text-[#4CAF50] border border-[#4CAF50]"
                        : "bg-[#f5f5f5] text-[#888] border border-[#e0e0e0]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl border border-[#e0e0e0] text-[15px] font-bold text-[#888]"
                >
                  დაბრუნება
                </button>
                <button
                  onClick={() => { onAdd({ ...result, meal: selectedMeal }); onClose(); }}
                  className="flex-[2] py-3.5 rounded-2xl bg-[#8BC34A] text-[15px] font-bold text-white flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  დღიურში დამატება
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Activity add bottom sheet
function AddActivitySheet({
  open,
  onClose,
  onAdd,
  initialActivity,
  initialTab,
  goalCalories,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: ActivityItem) => void;
  initialActivity: { emoji: string; name: string } | null;
  initialTab: "quick" | "text";
  goalCalories: number;
}) {
  const [tab, setTab] = useState<"quick" | "text">(initialTab);
  const [selectedActivity, setSelectedActivity] = useState(initialActivity || activities[0]);
  const [duration, setDuration] = useState(30);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastBurned, setLastBurned] = useState(0);

  // Reset when opened with new props
  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSelectedActivity(initialActivity || activities[0]);
      setDuration(30);
      setTextInput("");
      setError("");
      setLoading(false);
      setShowSuccess(false);
    }
  }, [open, initialActivity, initialTab]);

  const calRate = activityCalRates[selectedActivity.name] || 5;
  const calculatedCalories = Math.round(calRate * duration);

  function handleQuickSave() {
    const now = new Date();
    const item: ActivityItem = {
      name: selectedActivity.name,
      emoji: selectedActivity.emoji,
      duration,
      caloriesBurned: calculatedCalories,
      time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
    };
    onAdd(item);
    setLastBurned(calculatedCalories);
    setShowSuccess(true);
  }

  async function handleTextSave() {
    if (!textInput.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      const now = new Date();
      // Find matching emoji from activities list
      const matchedActivity = activities.find((a) => a.name === data.name);
      const item: ActivityItem = {
        name: data.name,
        emoji: matchedActivity?.emoji || "🏃",
        duration: data.duration,
        caloriesBurned: data.caloriesBurned,
        time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      };
      onAdd(item);
      setLastBurned(data.caloriesBurned);
      setShowSuccess(true);
    } catch {
      setError("შეცდომა. სცადე თავიდან.");
    }
    setLoading(false);
  }

  if (!open) return null;

  // Success popup
  if (showSuccess) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setShowSuccess(false); onClose(); }} />
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#FFF3E0] flex items-center justify-center mb-4">
                <span className="text-[32px]">🔥</span>
              </div>
              <h3 className="text-[22px] font-extrabold text-[#2d2d2d] mb-2">ვარჯიში ითვლება!</h3>
              <p className="text-[14px] text-[#888] mb-4">
                როცა კალორიას წვავთ, თქვენი დღიური კალორიების მიზანი იმატებს.
              </p>
              <div className="bg-[#f9f9f9] rounded-2xl p-4 mb-5 w-full text-left">
                <p className="text-[14px] font-bold text-[#2d2d2d] mb-1">რატომ?</p>
                <p className="text-[13px] text-[#666]">
                  თუ დღეს <span className="font-bold">{goalCalories}</span> კკალ გჭირდებათ და <span className="font-bold text-[#F57C00]">{lastBurned}</span> დაწვით, ესეიგი <span className="font-bold text-[#4CAF50]">{goalCalories + lastBurned}</span> უნდა მიიღოთ რომ დამწვარი კალორია ანაზღაურდეს.
                </p>
              </div>
              <button
                onClick={() => { setShowSuccess(false); onClose(); }}
                className="w-full py-3.5 rounded-2xl bg-[#F57C00] text-[16px] font-bold text-white"
              >
                გავიგე
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-slideUp">
        <div className="bg-white rounded-t-[24px] px-5 pt-3 pb-10">
          <div className="flex justify-center mb-5">
            <div className="w-10 h-[5px] rounded-full bg-[#ddd]" />
          </div>

          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[22px] font-extrabold text-[#2d2d2d]">
              ვარჯიშის დამატება
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex rounded-2xl border border-[#e0e0e0] overflow-hidden mb-5">
            <button
              onClick={() => setTab("quick")}
              className={`flex-1 py-2.5 text-[14px] font-semibold transition-colors ${
                tab === "quick"
                  ? "bg-[#FFF3E0] text-[#F57C00] border border-[#F57C00] rounded-2xl -m-px z-10"
                  : "text-[#888]"
              }`}
            >
              ⚡ სწრაფი
            </button>
            <button
              onClick={() => setTab("text")}
              className={`flex-1 py-2.5 text-[14px] font-semibold transition-colors ${
                tab === "text"
                  ? "bg-[#FFF3E0] text-[#F57C00] border border-[#F57C00] rounded-2xl -m-px z-10"
                  : "text-[#888]"
              }`}
            >
              ✏️ ტექსტი
            </button>
          </div>

          {/* Quick tab */}
          {tab === "quick" && (
            <div>
              {/* Activity selector */}
              <div className="overflow-x-auto mb-4 -mx-1 scrollbar-hide">
                <div className="flex gap-2 px-1" style={{ width: "max-content" }}>
                  {activities.map((a) => (
                    <button
                      key={a.name}
                      onClick={() => setSelectedActivity(a)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 shrink-0 transition-colors ${
                        selectedActivity.name === a.name
                          ? "bg-[#FFF3E0] border border-[#F57C00]"
                          : "bg-[#f5f5f5]"
                      }`}
                    >
                      <span className="text-base">{a.emoji}</span>
                      <span className={`text-[13px] font-semibold ${
                        selectedActivity.name === a.name ? "text-[#F57C00]" : "text-[#555]"
                      }`}>
                        {a.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected activity display */}
              <div className="bg-[#f9f9f9] rounded-2xl p-4 mb-4 text-center">
                <span className="text-[40px]">{selectedActivity.emoji}</span>
                <p className="text-[18px] font-bold text-[#2d2d2d] mt-1">{selectedActivity.name}</p>
              </div>

              {/* Duration input */}
              <div className="mb-4">
                <p className="text-[14px] font-semibold text-[#2d2d2d] mb-2">ხანგრძლივობა</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDuration(Math.max(5, duration - 5))}
                    className="w-10 h-10 rounded-full border-[1.5px] border-[#e0e0e0] flex items-center justify-center"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={duration}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setDuration(Math.max(1, Math.min(300, v)));
                      }}
                      className="text-[32px] font-bold text-[#2d2d2d] text-center bg-transparent outline-none w-20"
                    />
                    <span className="text-[16px] text-[#999]">წუთი</span>
                  </div>
                  <button
                    onClick={() => setDuration(Math.min(300, duration + 5))}
                    className="w-10 h-10 rounded-full border-[1.5px] border-[#e0e0e0] flex items-center justify-center"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Calculated calories */}
              <div className="bg-[#FFF3E0] rounded-2xl p-4 mb-5 flex items-center justify-center gap-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF6B35" stroke="#FF6B35" strokeWidth="1">
                  <path d="M12 22c4.97 0 8-3.582 8-8 0-4.418-4-8-4-8s0 4-4 4c-2 0-2-2-2-2S6 11.582 6 14c0 4.418 2.03 8 6 8z" />
                </svg>
                <span className="text-[32px] font-bold text-[#F57C00]">{calculatedCalories}</span>
                <span className="text-[16px] text-[#999] mt-2">კკალ დაიწვება</span>
              </div>

              {/* Save button */}
              <button
                onClick={handleQuickSave}
                className="w-full py-3.5 rounded-2xl bg-[#4CAF50] text-[16px] font-bold text-white flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                შენახვა
              </button>
            </div>
          )}

          {/* Text tab */}
          {tab === "text" && !loading && !error && (
            <div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="მაგ: ვირბინე 20 წუთი, 30 squat..."
                className="w-full p-4 rounded-2xl border border-[#e0e0e0] text-[16px] text-[#2d2d2d] resize-none outline-none focus:border-[#F57C00] transition-colors"
                rows={3}
                autoFocus
              />
              <p className="text-[13px] text-[#999] mt-2 mb-4 flex items-center gap-1">
                ⚡ AI გამოთვლის კალორიებს ავტომატურად
              </p>
              <button
                onClick={handleTextSave}
                disabled={!textInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-[#4CAF50] text-[16px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                შენახვა
              </button>
            </div>
          )}

          {/* Loading */}
          {tab === "text" && loading && (
            <div className="flex flex-col items-center py-10">
              <div className="w-10 h-10 border-4 border-[#F57C00] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[15px] text-[#888]">Claude ანალიზს აკეთებს...</p>
            </div>
          )}

          {/* Error */}
          {tab === "text" && error && !loading && (
            <div className="text-center py-6">
              <p className="text-[15px] text-red-500 mb-4">{error}</p>
              <button
                onClick={() => setError("")}
                className="px-6 py-2.5 rounded-xl bg-[#f0f0f0] text-[14px] font-bold text-[#555]"
              >
                თავიდან სცადე
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Settings bottom sheet
function SettingsSheet({
  open,
  onClose,
  profile,
  regime,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  profile: ProfileData;
  regime: "standard" | "fast";
  onSave: (goal: string, regime: "standard" | "fast") => void;
}) {
  const [weightGoalType, setWeightGoalType] = useState<
    "კლება" | "შენარჩუნება"
  >(profile.goal === "შენარჩუნება" ? "შენარჩუნება" : "კლება");
  const [localRegime, setLocalRegime] = useState(regime);

  // Recalculate preview calories based on local selections
  const previewProfile = { ...profile, goal: weightGoalType === "კლება" ? "წონის დაკლება" : "შენარჩუნება" };
  const previewCalories = calculateCalories(previewProfile, localRegime);

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
                  onClick={() => setLocalRegime("standard")}
                  className={`flex-1 py-3 px-3 flex flex-col items-center rounded-2xl transition-colors ${
                    localRegime === "standard"
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
                      stroke={localRegime === "standard" ? "#fff" : "#888"}
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
                      localRegime === "standard" ? "text-white/80" : "text-[#aaa]"
                    }`}
                  >
                    კვირაში 0.5 კგ
                  </span>
                </button>
                <button
                  onClick={() => setLocalRegime("fast")}
                  className={`flex-1 py-3 px-3 flex flex-col items-center rounded-2xl transition-colors ${
                    localRegime === "fast"
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
                      stroke={localRegime === "fast" ? "#fff" : "#888"}
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
                    </svg>
                    <span className="text-[14px] font-bold">სწრაფი</span>
                  </div>
                  <span
                    className={`text-[11px] ${
                      localRegime === "fast" ? "text-white/80" : "text-[#aaa]"
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
              {previewCalories}
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
              onClick={() => {
                const newGoal = weightGoalType === "კლება" ? "წონის დაკლება" : "შენარჩუნება";
                onSave(newGoal, localRegime);
                onClose();
              }}
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

// Weight goals bottom sheet
function WeightGoalsSheet({
  open,
  onClose,
  startingWeight,
  targetWeight,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  startingWeight: number;
  targetWeight: number;
  onSave: (startingWeight: number, targetWeight: number) => void;
}) {
  const [localStarting, setLocalStarting] = useState(startingWeight);
  const [localTarget, setLocalTarget] = useState(targetWeight);

  useEffect(() => {
    if (open) {
      setLocalStarting(startingWeight);
      setLocalTarget(targetWeight);
    }
  }, [open, startingWeight, targetWeight]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-slideUp">
        <div className="bg-white rounded-t-[24px] px-5 pt-3 pb-8">
          <div className="flex justify-center mb-5">
            <div className="w-10 h-[5px] rounded-full bg-[#ddd]" />
          </div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[22px] font-extrabold text-[#2d2d2d]">
              წონის მიზნები
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Starting weight */}
          <p className="text-[15px] font-semibold text-[#2d2d2d] mb-2">საწყისი წონა</p>
          <div className="flex items-center p-4 rounded-2xl border border-[#e0e0e0] mb-4">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={localStarting}
              onChange={(e) => setLocalStarting(parseFloat(e.target.value) || 0)}
              className="text-[24px] font-bold text-[#2d2d2d] bg-transparent outline-none flex-1 w-0"
            />
            <span className="text-[16px] text-[#999] ml-2">კგ</span>
          </div>

          {/* Target weight */}
          <p className="text-[15px] font-semibold text-[#2d2d2d] mb-2">სამიზნე წონა</p>
          <div className="flex items-center p-4 rounded-2xl border border-[#e0e0e0] mb-6">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={localTarget}
              onChange={(e) => setLocalTarget(parseFloat(e.target.value) || 0)}
              className="text-[24px] font-bold text-[#2d2d2d] bg-transparent outline-none flex-1 w-0"
            />
            <span className="text-[16px] text-[#999] ml-2">კგ</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-[#e0e0e0] text-[16px] font-bold text-[#2d2d2d]"
            >
              გაუქმება
            </button>
            <button
              onClick={() => {
                onSave(localStarting, localTarget);
                onClose();
              }}
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

// Historical data types
interface HistoryDay {
  date: string;
  weight: number | null;
  foods: FoodItem[];
  waterMl: number;
  userActivities: ActivityItem[];
  goalCalories?: number;
}

// Progress page component
function ProgressPage({
  profile,
  regime,
  onWeightGoalsSave,
  phone,
}: {
  profile: ProfileData;
  regime: "standard" | "fast";
  onWeightGoalsSave: (startingWeight: number, targetWeight: number) => void;
  phone: string;
}) {
  const [historyData, setHistoryData] = useState<HistoryDay[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showWeightGoals, setShowWeightGoals] = useState(false);

  const startingWeight = parseFloat((profile as ProfileData & { startingWeight?: string }).startingWeight || profile.weight) || 65;
  const targetWeight = parseFloat((profile as ProfileData & { targetWeight?: string }).targetWeight || "58") || 58;
  const goalCalories = calculateCalories(profile, regime);

  useEffect(() => {
    setLoadingHistory(true);
    fetch(`/api/data?phone=${phone}&history=1`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHistoryData(data);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [phone]);

  // Weight data points (only days with actual weight data)
  const weightPoints = historyData
    .filter((d) => d.weight !== null && d.weight > 0)
    .map((d) => ({ date: d.date, weight: d.weight as number }));

  // Calorie data: last 10 days — each day carries its own goal from that date
  const caloriePoints = historyData
    .slice(-10)
    .map((d) => ({
      date: d.date,
      consumed: (d.foods || []).reduce((s: number, f: FoodItem) => s + (f.calories || 0), 0),
      dayGoal: d.goalCalories || goalCalories, // use stored goal, fallback to current
    }));

  // Current weight (latest recorded)
  const currentWeight = weightPoints.length > 0 ? weightPoints[weightPoints.length - 1].weight : startingWeight;
  const weightDiff = currentWeight - startingWeight;

  // Activities this week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
  const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
  const weekActivities = historyData
    .filter((d) => d.date >= weekStartStr)
    .flatMap((d) => (d.userActivities || []).map((a: ActivityItem) => ({ ...a, date: d.date })));
  const weekBurned = weekActivities.reduce((s: number, a: ActivityItem) => s + (a.caloriesBurned || 0), 0);

  if (loadingHistory) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- Weight chart SVG ---
  const wChartW = 320, wChartH = 160, wPadL = 40, wPadR = 15, wPadT = 15, wPadB = 25;
  const wPlotW = wChartW - wPadL - wPadR;
  const wPlotH = wChartH - wPadT - wPadB;
  let wMin = Math.min(...weightPoints.map((p) => p.weight), targetWeight) - 1;
  let wMax = Math.max(...weightPoints.map((p) => p.weight), startingWeight) + 1;
  if (wMin === wMax) { wMin -= 2; wMax += 2; }
  const wRange = wMax - wMin;

  const wLinePath = weightPoints.length > 1
    ? weightPoints.map((p, i) => {
        const x = wPadL + (i / (weightPoints.length - 1)) * wPlotW;
        const y = wPadT + (1 - (p.weight - wMin) / wRange) * wPlotH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ")
    : "";

  const wAreaPath = weightPoints.length > 1
    ? wLinePath +
      ` L${(wPadL + wPlotW).toFixed(1)},${(wPadT + wPlotH).toFixed(1)} L${wPadL},${(wPadT + wPlotH).toFixed(1)} Z`
    : "";

  // Y-axis ticks for weight
  const wTicks = 4;
  const wTickValues = Array.from({ length: wTicks }, (_, i) => wMin + (wRange * i) / (wTicks - 1));

  // --- Calories bar chart SVG ---
  const cChartW = 320, cChartH = 160, cPadL = 40, cPadR = 15, cPadT = 15, cPadB = 25;
  const cPlotW = cChartW - cPadL - cPadR;
  const cPlotH = cChartH - cPadT - cPadB;
  const cMaxVal = Math.max(...caloriePoints.map((p) => Math.max(p.consumed, p.dayGoal)), 100) * 1.15;
  const barWidth = caloriePoints.length > 0 ? Math.min(24, (cPlotW / caloriePoints.length) * 0.6) : 20;
  const barGap = caloriePoints.length > 0 ? cPlotW / caloriePoints.length : 30;

  // Y-axis ticks for calories
  const cTicks = 4;
  const cTickValues = Array.from({ length: cTicks }, (_, i) => Math.round((cMaxVal * i) / (cTicks - 1)));

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-28">
        {/* Weight Card */}
        <div className="bg-white rounded-[20px] p-5 mb-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[20px] font-extrabold text-[#2d2d2d]">წონა</span>
            <button onClick={() => setShowWeightGoals(true)} className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>

          {/* Current weight display */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[42px] font-bold text-[#2d2d2d] leading-[48px]">{currentWeight.toFixed(1)}</span>
            <span className="text-[18px] text-[#999]">კგ</span>
            <span className={`text-[14px] font-bold px-2.5 py-0.5 rounded-full ml-1 ${weightDiff <= 0 ? "bg-[#E8F5E9] text-[#4CAF50]" : "bg-[#FEE2E2] text-[#EF4444]"}`}>
              {weightDiff <= 0 ? "" : "+"}{weightDiff.toFixed(1)} კგ
            </span>
          </div>

          {/* Weight chart */}
          {weightPoints.length >= 2 ? (
            <svg viewBox={`0 0 ${wChartW} ${wChartH}`} className="w-full" style={{ maxHeight: 180 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F57C00" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F57C00" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Grid lines + Y labels */}
              {wTickValues.map((v, i) => {
                const y = wPadT + (1 - (v - wMin) / wRange) * wPlotH;
                return (
                  <g key={i}>
                    <line x1={wPadL} y1={y} x2={wChartW - wPadR} y2={y} stroke="#e8e8e8" strokeWidth="1" strokeDasharray="4 3" />
                    <text x={wPadL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#aaa">{v.toFixed(0)}</text>
                  </g>
                );
              })}
              {/* Area fill */}
              <path d={wAreaPath} fill="url(#wGrad)" />
              {/* Line */}
              <path d={wLinePath} fill="none" stroke="#F57C00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Dots */}
              {weightPoints.map((p, i) => {
                const x = wPadL + (i / (weightPoints.length - 1)) * wPlotW;
                const y = wPadT + (1 - (p.weight - wMin) / wRange) * wPlotH;
                return <circle key={i} cx={x} cy={y} r="3.5" fill="#F57C00" stroke="#fff" strokeWidth="1.5" />;
              })}
              {/* X-axis date labels (first, mid, last) */}
              {[0, Math.floor(weightPoints.length / 2), weightPoints.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((idx) => {
                const x = wPadL + (idx / (weightPoints.length - 1)) * wPlotW;
                const label = weightPoints[idx].date.slice(5); // MM-DD
                return <text key={idx} x={x} y={wChartH - 4} textAnchor="middle" fontSize="10" fill="#aaa">{label}</text>;
              })}
            </svg>
          ) : (
            <p className="text-[13px] text-[#bbb] text-center py-6">არასაკმარისი მონაცემი გრაფიკისთვის</p>
          )}

          {/* Start / target labels */}
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[12px] text-[#999]">საწყისი: {startingWeight} კგ</span>
            <span className="text-[12px] text-[#999]">მიზანი: {targetWeight} კგ</span>
          </div>
        </div>

        {/* Calories Card */}
        <div className="bg-white rounded-[20px] p-5 mb-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[20px] font-extrabold text-[#2d2d2d]">კალორიები</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]" />
                <span className="text-[11px] text-[#888]">ნორმაში</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                <span className="text-[11px] text-[#888]">მიზანი</span>
              </div>
            </div>
          </div>

          {caloriePoints.length > 0 ? (
            <svg viewBox={`0 0 ${cChartW} ${cChartH}`} className="w-full" style={{ maxHeight: 200 }}>
              {/* Y-axis labels and grid */}
              {cTickValues.map((v, i) => {
                const y = cPadT + (1 - v / cMaxVal) * cPlotH;
                return (
                  <g key={i}>
                    <line x1={cPadL} y1={y} x2={cChartW - cPadR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                    <text x={wPadL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#bbb">{v}</text>
                  </g>
                );
              })}
              {/* Bars: gray goal background + green/red consumed overlay */}
              {caloriePoints.map((p, i) => {
                const x = cPadL + barGap * i + (barGap - barWidth) / 2;
                // Use this day's stored goal, not the current global goal
                const dayGoal = p.dayGoal;
                const goalBarH = (dayGoal / cMaxVal) * cPlotH;
                const goalY = cPadT + cPlotH - goalBarH;
                const consumedH = (p.consumed / cMaxVal) * cPlotH;
                const consumedY = cPadT + cPlotH - consumedH;
                const withinGoal = p.consumed <= dayGoal * 1.05;
                return (
                  <g key={i}>
                    {/* Goal background bar (light gray) */}
                    <rect x={x} y={goalY} width={barWidth} height={goalBarH} rx={4} fill="#ececec" />
                    {/* Consumed bar on top — green if within that day's goal, red if over */}
                    {p.consumed > 0 && (
                      <rect x={x} y={consumedY} width={barWidth} height={consumedH} rx={4} fill={withinGoal ? "#4CAF50" : "#E53935"} />
                    )}
                    {/* Day label */}
                    <text x={x + barWidth / 2} y={cChartH - 4} textAnchor="middle" fontSize="10" fill="#bbb">
                      {parseInt(p.date.slice(8), 10)}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <p className="text-[13px] text-[#bbb] text-center py-6">არ არის მონაცემი</p>
          )}
        </div>

        {/* Activity Card — bar chart matching calorie card style */}
        <div className="bg-white rounded-[20px] p-5 mb-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[20px]">🔥</span>
            <span className="text-[20px] font-extrabold text-[#2d2d2d]">აქტივობა</span>
          </div>

          {(() => {
            // Build activity burned data for last 10 days
            const actPoints = historyData.slice(-10).map((d) => ({
              date: d.date,
              burned: (d.userActivities || []).reduce((s: number, a: ActivityItem) => s + (a.caloriesBurned || 0), 0),
            }));
            const aMaxVal = Math.max(...actPoints.map((p) => p.burned), 50) * 1.2;
            const aTicks = 5;
            const aTickValues = Array.from({ length: aTicks }, (_, i) => Math.round((aMaxVal * i) / (aTicks - 1)));
            const aBarGap = actPoints.length > 0 ? cPlotW / actPoints.length : 30;
            const aBarW = actPoints.length > 0 ? Math.min(24, aBarGap * 0.6) : 20;

            return actPoints.length > 0 ? (
              <svg viewBox={`0 0 ${cChartW} ${cChartH}`} className="w-full" style={{ maxHeight: 200 }}>
                {/* Y-axis labels and grid */}
                {aTickValues.map((v, i) => {
                  const y = cPadT + (1 - v / aMaxVal) * cPlotH;
                  return (
                    <g key={i}>
                      <line x1={cPadL} y1={y} x2={cChartW - cPadR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                      <text x={cPadL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#bbb">{v}</text>
                    </g>
                  );
                })}
                {/* Bars */}
                {actPoints.map((p, i) => {
                  const x = cPadL + aBarGap * i + (aBarGap - aBarW) / 2;
                  const barH = p.burned > 0 ? (p.burned / aMaxVal) * cPlotH : 3;
                  const y = cPadT + cPlotH - barH;
                  return (
                    <g key={i}>
                      <rect
                        x={x} y={y} width={aBarW} height={barH} rx={4}
                        fill={p.burned > 0 ? "#F57C00" : "#e8e8e8"}
                      />
                      <text x={x + aBarW / 2} y={cChartH - 4} textAnchor="middle" fontSize="10" fill="#bbb">
                        {parseInt(p.date.slice(8), 10)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <p className="text-[13px] text-[#bbb] text-center py-6">არ არის მონაცემი</p>
            );
          })()}
        </div>
      </div>

      <WeightGoalsSheet
        open={showWeightGoals}
        onClose={() => setShowWeightGoals(false)}
        startingWeight={startingWeight}
        targetWeight={targetWeight}
        onSave={onWeightGoalsSave}
      />
    </>
  );
}

// Profile page
// Profile data type
interface ProfileData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
  activityLevel: string;
  startingWeight?: string;
  targetWeight?: string;
  manualGoalCalories?: string;
}

// Mifflin-St Jeor calorie calculator
// regime: "standard" = -500 kcal (0.5kg/week), "fast" = -750 kcal (0.8-1kg/week)
function calculateCalories(
  profile: ProfileData,
  regime: "standard" | "fast"
): number {
  const age = Number(profile.age) || 0;
  const h = Number(profile.height) || 0;
  const w = Number(profile.weight) || 0;
  if (!age || !h || !w) return 1976; // fallback

  // BMR (Mifflin-St Jeor)
  let bmr: number;
  if (profile.gender === "მამრობითი") {
    bmr = 10 * w + 6.25 * h - 5 * age + 5;
  } else {
    bmr = 10 * w + 6.25 * h - 5 * age - 161;
  }

  // Activity multiplier
  let multiplier = 1.55;
  if (profile.activityLevel.startsWith("მცირე")) multiplier = 1.375;
  else if (profile.activityLevel.startsWith("საშუალო")) multiplier = 1.55;
  else if (profile.activityLevel.startsWith("მაღალი")) multiplier = 1.725;

  const tdee = Math.round(bmr * multiplier);

  // Goal adjustment
  if (profile.goal === "წონის დაკლება") {
    const deficit = regime === "fast" ? 750 : 500;
    return tdee - deficit;
  }
  return tdee; // შენარჩუნება — no deficit regardless of regime
}

// Macro split from calories (50% carbs, 20% fat, 30% protein)
function calculateMacros(calories: number) {
  return {
    carbs: Math.round((calories * 0.5) / 4),
    fat: Math.round((calories * 0.2) / 9),
    protein: Math.round((calories * 0.3) / 4),
  };
}

// Inline PIN input for profile page PIN change
function PinInputInline({ onSubmit, error }: { onSubmit: (pin: string) => void; error?: string }) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (pin.length === 6) {
      onSubmit(pin);
      setTimeout(() => setPin(""), 300);
    }
  }, [pin, onSubmit]);

  return (
    <div className="flex flex-col items-center px-8">
      {/* Dots */}
      <div className={`flex gap-3 mb-6 ${error ? "animate-shake" : ""}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors ${
              i < pin.length ? "bg-[#4CAF50]" : "bg-[#e0e0e0]"
            }`}
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-[14px] mb-4">{error}</p>}
      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button
            key={n}
            onClick={() => pin.length < 6 && setPin(pin + n)}
            className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[22px] font-bold text-[#2d2d2d]"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          onClick={() => pin.length < 6 && setPin(pin + "0")}
          className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[22px] font-bold text-[#2d2d2d]"
        >
          0
        </button>
        <button
          onClick={() => setPin(pin.slice(0, -1))}
          className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ProfilePage({
  onBack,
  profile,
  onSave,
  onLogout,
  phone,
}: {
  onBack: () => void;
  profile: ProfileData;
  onSave: (data: ProfileData) => void;
  onLogout?: () => void;
  phone?: string;
}) {
  const [changingPin, setChangingPin] = useState(false);
  const [pinStep, setPinStep] = useState<"current" | "new" | "confirm">("current");
  const [newPin, setNewPin] = useState("");
  const [pinError, setPinError] = useState("");

  async function handlePinSubmit(pin: string) {
    if (pinStep === "current") {
      // Verify current pin
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", phone, pin }),
      });
      if (res.ok) {
        setPinStep("new");
        setPinError("");
      } else {
        setPinError("არასწორი პინი");
      }
    } else if (pinStep === "new") {
      setNewPin(pin);
      setPinStep("confirm");
      setPinError("");
    } else if (pinStep === "confirm") {
      if (pin === newPin) {
        // Save new pin
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "changePin", phone, newPin: pin }),
        });
        setChangingPin(false);
        setPinStep("current");
        setNewPin("");
        setPinError("");
      } else {
        setPinError("პინები არ ემთხვევა");
      }
    }
  }

  if (changingPin) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <div className="flex items-center px-5 py-4 bg-white">
          <button
            onClick={() => { setChangingPin(false); setPinStep("current"); setPinError(""); }}
            className="w-11 h-11 rounded-full border border-[#e0e0e0] flex items-center justify-center mr-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[22px] font-extrabold text-[#2d2d2d] flex-1 text-center mr-[60px]">
            {pinStep === "current" ? "მიმდინარე პინი" : pinStep === "new" ? "ახალი პინი" : "გაიმეორეთ პინი"}
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <PinInputInline onSubmit={handlePinSubmit} error={pinError} />
        </div>
      </div>
    );
  }
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState(profile.gender);
  const [showGender, setShowGender] = useState(false);
  const [height, setHeight] = useState(profile.height);
  const [profileWeight, setProfileWeight] = useState(profile.weight);
  const [goal, setGoal] = useState(profile.goal);
  const [showGoal, setShowGoal] = useState(false);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [showActivity, setShowActivity] = useState(false);

  const genderOptions = ["მამრობითი", "მდედრობითი"];
  const goalOptions = ["წონის დაკლება", "შენარჩუნება"];
  const activityOptions = [
    "მცირე (1-2 დღე/კვირაში ვარჯიში)",
    "საშუალო (3-5 დღე/კვირაში ვარჯიში)",
    "მაღალი (6-7 დღე/კვირაში ვარჯიში)",
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 py-4 bg-white">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full border border-[#e0e0e0] flex items-center justify-center mr-4"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-[22px] font-extrabold text-[#2d2d2d] flex-1 text-center mr-[60px]">
          პროფილი
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8">
        {/* Body data */}
        <p className="text-[14px] font-bold text-[#999] mb-3 uppercase tracking-wide">
          სხეულის მონაცემები
        </p>
        <div className="bg-white rounded-2xl overflow-hidden mb-6 shadow-sm">
          {/* Age */}
          <div className="flex items-center px-4 py-4 border-b border-[#f0f0f0]">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center mr-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-[12px] text-[#999] block">ასაკი</span>
              <input
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
                className="text-[18px] font-bold text-[#2d2d2d] bg-transparent outline-none w-20"
              />
            </div>
            <span className="text-[14px] text-[#bbb]">წ</span>
          </div>
          {/* Gender */}
          <div className="relative">
            <button
              onClick={() => setShowGender(!showGender)}
              className="flex items-center px-4 py-4 border-b border-[#f0f0f0] w-full text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="7" r="4" />
                  <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                  <circle cx="17" cy="7" r="4" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-[12px] text-[#999] block">სქესი</span>
                <span className="text-[18px] font-bold text-[#2d2d2d]">{gender}</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                <path d={showGender ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>
            {showGender && (
              <div className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {genderOptions.map((g) => (
                  <button
                    key={g}
                    onClick={() => { setGender(g); setShowGender(false); }}
                    className={`w-full text-left px-14 py-3 text-[15px] ${
                      gender === g ? "text-[#4CAF50] font-bold" : "text-[#555]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Height */}
          <div className="flex items-center px-4 py-4 border-b border-[#f0f0f0]">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center mr-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8M12 3v18M17 8l-5-5-5 5" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-[12px] text-[#999] block">სიმაღლე</span>
              <input
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, ""))}
                className="text-[18px] font-bold text-[#2d2d2d] bg-transparent outline-none w-20"
              />
            </div>
            <span className="text-[14px] text-[#bbb]">სმ</span>
          </div>
          {/* Weight */}
          <div className="flex items-center px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center mr-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M8 6h2v2M16 18h-2v-2" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-[12px] text-[#999] block">წონა</span>
              <input
                inputMode="numeric"
                value={profileWeight}
                onChange={(e) => setProfileWeight(e.target.value.replace(/[^0-9]/g, ""))}
                className="text-[18px] font-bold text-[#2d2d2d] bg-transparent outline-none w-20"
              />
            </div>
            <span className="text-[14px] text-[#bbb]">კგ</span>
          </div>
        </div>

        {/* Goals */}
        <p className="text-[14px] font-bold text-[#999] mb-3 uppercase tracking-wide">
          მიზნები
        </p>
        <div className="bg-white rounded-2xl overflow-hidden mb-8 shadow-sm">
          {/* Goal */}
          <div className="relative">
            <button
              onClick={() => setShowGoal(!showGoal)}
              className="flex items-center px-4 py-4 border-b border-[#f0f0f0] w-full text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" fill="#4CAF50" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-[12px] text-[#999] block">მიზანი</span>
                <span className="text-[16px] font-bold text-[#2d2d2d]">{goal}</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                <path d={showGoal ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>
            {showGoal && (
              <div className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {goalOptions.map((g) => (
                  <button
                    key={g}
                    onClick={() => { setGoal(g); setShowGoal(false); }}
                    className={`w-full text-left px-14 py-3 text-[15px] ${
                      goal === g ? "text-[#4CAF50] font-bold" : "text-[#555]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Activity level */}
          <div className="relative">
            <button
              onClick={() => setShowActivity(!showActivity)}
              className="flex items-center px-4 py-4 w-full text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round">
                  <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-[12px] text-[#999] block">აქტიურობის დონე</span>
                <span className="text-[14px] font-bold text-[#2d2d2d]">{activityLevel}</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                <path d={showActivity ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>
            {showActivity && (
              <div className="bg-[#fafafa]">
                {activityOptions.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setActivityLevel(a); setShowActivity(false); }}
                    className={`w-full text-left px-14 py-3 text-[14px] ${
                      activityLevel === a ? "text-[#4CAF50] font-bold" : "text-[#555]"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={() => {
            onSave({ age, gender, height, weight: profileWeight, goal, activityLevel });
            onBack();
          }}
          className="w-full py-4 rounded-2xl bg-[#8BC34A] text-white text-[17px] font-bold flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          შენახვა
        </button>

        {/* Change PIN button */}
        {phone && (
          <button
            onClick={() => setChangingPin(true)}
            className="w-full py-4 rounded-2xl border border-[#e0e0e0] text-[#555] text-[16px] font-bold mt-4 flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            პინის შეცვლა
          </button>
        )}

        {/* Logout button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full py-4 rounded-2xl border border-red-300 text-red-500 text-[16px] font-bold mt-3 flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            გამოსვლა
          </button>
        )}
      </div>
    </div>
  );
}

// Feed item for challenge page
interface FeedItem {
  id: string;
  date: string;
  type: "goal_achieved" | "activity" | "water_goal" | "weight_milestone" | "over_limit" | "streak";
  emoji: string;
  title: string;
  detail?: string;
  stats?: string;
  color: string; // accent color for the card border-left or badge
  userName?: string; // for multi-user challenge feed
}

interface AllUsersHistoryItem {
  phone: string;
  name: string;
  date: string;
  foods: FoodItem[];
  waterMl: number;
  weight: number | null;
  userActivities: ActivityItem[];
  goalCalories: number | null;
}

// Challenge / Social Feed page
function ChallengePage({
  profile,
  regime,
  phone,
}: {
  profile: ProfileData;
  regime: "standard" | "fast";
  phone: string;
}) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("anukas-hidden-feed");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [loading, setLoading] = useState(true);

  function hideItem(id: string) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("anukas-hidden-feed", JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }

  useEffect(() => {
    async function loadFeed() {
      try {
        const res = await fetch("/api/data?allUsersHistory=1");
        const allData: AllUsersHistoryItem[] = await res.json();

        // Group data by user phone
        const userMap = new Map<string, { name: string; days: AllUsersHistoryItem[] }>();
        for (const item of allData) {
          if (!userMap.has(item.phone)) {
            userMap.set(item.phone, { name: item.name, days: [] });
          }
          userMap.get(item.phone)!.days.push(item);
        }

        const items: FeedItem[] = [];
        const fallbackGoal = calculateCalories(profile, regime);

        // Process each user's data
        const entries = Array.from(userMap.entries());
        for (const [userPhone, userData] of entries) {
          const userName = userData.name;
          const history = userData.days.sort((a: AllUsersHistoryItem, b: AllUsersHistoryItem) => b.date.localeCompare(a.date));

          // Calculate streak for this user
          let streakCount = 0;
          for (const day of history) {
            const consumed = (day.foods || []).reduce((s: number, f: FoodItem) => s + (f.calories || 0), 0);
            const dayGoal = day.goalCalories || fallbackGoal;
            if (consumed > 0 && consumed <= dayGoal) {
              streakCount++;
            } else if (consumed > 0) {
              break;
            }
          }

          for (const day of history) {
            const consumed = (day.foods || []).reduce((s: number, f: FoodItem) => s + (f.calories || 0), 0);
            const dayGoal = day.goalCalories || fallbackGoal;
            const hasFoods = (day.foods || []).length > 0;
            const hasActivities = (day.userActivities || []).length > 0;
            const hasAnyData = hasFoods || hasActivities || (day.waterMl && day.waterMl > 0);

            if (!hasAnyData) continue;

            // Daily goal achieved or over limit
            if (hasFoods && consumed > 0) {
              if (consumed <= dayGoal) {
                items.push({
                  id: `goal-${userPhone}-${day.date}`,
                  date: day.date,
                  type: "goal_achieved",
                  emoji: "\u{1F3C6}",
                  title: "\u10D3\u10E6\u10D8\u10E3\u10E0\u10D8 \u10DB\u10D8\u10D6\u10D0\u10DC\u10D8 \u10DB\u10D8\u10E6\u10EC\u10D4\u10E3\u10DA\u10D8\u10D0!",
                  stats: `${consumed} / ${dayGoal} \u10D9\u10D9\u10D0\u10DA`,
                  color: "#4CAF50",
                  userName,
                });
              } else {
                items.push({
                  id: `over-${userPhone}-${day.date}`,
                  date: day.date,
                  type: "over_limit",
                  emoji: "\u274C",
                  title: "\u10D9\u10D0\u10DA\u10DD\u10E0\u10D8\u10D4\u10D1\u10D8\u10E1 \u10DA\u10D8\u10DB\u10D8\u10E2\u10D8 \u10D2\u10D0\u10D3\u10D0\u10ED\u10D0\u10E0\u10D1\u10D4\u10D1\u10E3\u10DA\u10D8\u10D0",
                  stats: `${consumed} / ${dayGoal} \u10D9\u10D9\u10D0\u10DA (+${consumed - dayGoal})`,
                  color: "#FF5722",
                  userName,
                });
              }
            }

            // Activities
            for (const act of (day.userActivities || [])) {
              items.push({
                id: `act-${userPhone}-${day.date}-${act.name}-${act.time}`,
                date: day.date,
                type: "activity",
                emoji: act.emoji || "\u{1F3C3}",
                title: `${act.emoji || "\u{1F3C3}"} ${act.name}`,
                detail: `${act.duration} \u10EC\u10D7, ${act.caloriesBurned} \u10D9\u10D9\u10D0\u10DA \u10D3\u10D0\u10D8\u10EC\u10D5\u10D0`,
                color: "#FF9800",
                userName,
              });
            }

            // Water goal
            const waterGoal = Math.round(65 * 33); // default water goal
            if (day.waterMl && day.waterMl >= waterGoal) {
              items.push({
                id: `water-${userPhone}-${day.date}`,
                date: day.date,
                type: "water_goal",
                emoji: "\u{1F4A7}",
                title: "\u10EC\u10E7\u10DA\u10D8\u10E1 \u10DB\u10D8\u10D6\u10D0\u10DC\u10D8 \u10DB\u10D8\u10E6\u10EC\u10D4\u10E3\u10DA\u10D8\u10D0!",
                stats: `${day.waterMl} / ${waterGoal} \u10DB\u10DA`,
                color: "#2196F3",
                userName,
              });
            }
          }

          // Add streak card for this user if >= 2
          if (streakCount >= 2) {
            items.push({
              id: `streak-${userPhone}`,
              date: new Date().toISOString().split("T")[0],
              type: "streak",
              emoji: "\u{1F525}",
              title: `${streakCount} \u10D3\u10E6\u10D8\u10D0\u10DC\u10D8 \u10E1\u10D4\u10E0\u10D8\u10D0! \u{1F525}`,
              detail: "\u10D6\u10D4\u10D3\u10D8\u10D6\u10D4\u10D3 \u10DB\u10D8\u10D6\u10D0\u10DC\u10E1 \u10D0\u10E6\u10EC\u10D4\u10D5",
              color: "#FF6D00",
              userName,
            });
          }
        }

        // Sort all items by date (newest first), streaks at top
        items.sort((a, b) => {
          if (a.type === "streak" && b.type !== "streak") return -1;
          if (b.type === "streak" && a.type !== "streak") return 1;
          return b.date.localeCompare(a.date);
        });

        setFeedItems(items);
      } catch {
        setFeedItems([]);
      }
      setLoading(false);
    }
    loadFeed();
  }, [profile, regime]);

  // Format date for display
  function formatDate(dateStr: string): string {
    const months = [
      "\u10D8\u10D0\u10DC", "\u10D7\u10D4\u10D1", "\u10DB\u10D0\u10E0", "\u10D0\u10DE\u10E0",
      "\u10DB\u10D0\u10D8", "\u10D8\u10D5\u10DC", "\u10D8\u10D5\u10DA", "\u10D0\u10D2\u10D5",
      "\u10E1\u10D4\u10E5", "\u10DD\u10E5\u10E2", "\u10DC\u10DD\u10D4", "\u10D3\u10D4\u10D9"
    ];
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }

  // Reaction emojis per type
  function getReactions(type: FeedItem["type"]): string[] {
    switch (type) {
      case "goal_achieved": return ["\u{1F4AA}", "\u{1F389}", "\u{1F525}"];
      case "activity": return ["\u{1F4AA}", "\u{1F525}"];
      case "water_goal": return ["\u{1F4A7}", "\u{1F44F}"];
      case "weight_milestone": return ["\u{1F389}", "\u2B50"];
      case "over_limit": return ["\u{1F4AA}", "\u{1F91E}"];
      case "streak": return ["\u{1F525}", "\u{1F3C6}", "\u{1F4AA}"];
      default: return ["\u{1F4AA}"];
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center pb-28">
        <div className="text-center px-8">
          <span className="text-[56px] block mb-4">{"\u{1F3C6}"}</span>
          <p className="text-[20px] font-extrabold text-[#2d2d2d] mb-2">
            {"\u10E8\u10D4\u10DC\u10D8 \u10DB\u10D8\u10E6\u10EC\u10D4\u10D5\u10D4\u10D1\u10D8 \u10D0\u10E5 \u10D2\u10D0\u10DB\u10DD\u10E9\u10DC\u10D3\u10D4\u10D1\u10D0!"}
          </p>
          <p className="text-[15px] text-[#999] leading-relaxed">
            {"\u10D3\u10D0\u10D8\u10EC\u10E7\u10D4 \u10D3\u10E6\u10D8\u10E3\u10E0\u10D8\u10E1 \u10E8\u10D4\u10D5\u10E1\u10D4\u10D1\u10D0 \u2014 \u10E9\u10D0\u10EC\u10D4\u10E0\u10D4 \u10E1\u10D0\u10D9\u10D5\u10D4\u10D1\u10D8, \u10D3\u10D0\u10DA\u10D8\u10D4 \u10EC\u10E7\u10D0\u10DA\u10D8, \u10D8\u10D5\u10D0\u10E0\u10EF\u10D8\u10E8\u10D4 \u10D3\u10D0 \u10DB\u10D8\u10E6\u10EC\u10D4\u10D5\u10D4\u10D1\u10D8 \u10D0\u10E5 \u10D2\u10D0\u10DB\u10DD\u10E9\u10DC\u10D3\u10D4\u10D1\u10D0!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-28 px-4 pt-3">
      {/* Feed header */}
      <div className="mb-4">
        <h2 className="text-[22px] font-extrabold text-[#2d2d2d]">{"\u{1F3C6} \u10E9\u10D4\u10DA\u10D4\u10DC\u10EF\u10D8"}</h2>
        <p className="text-[14px] text-[#999] mt-0.5">{"\u10E8\u10D4\u10DC\u10D8 \u10DB\u10D8\u10E6\u10EC\u10D4\u10D5\u10D4\u10D1\u10D8 \u10D3\u10D0 \u10DE\u10E0\u10DD\u10D2\u10E0\u10D4\u10E1\u10D8"}</p>
      </div>

      {/* Feed cards */}
      <div className="flex flex-col gap-3">
        {feedItems.filter((item) => !hiddenIds.has(item.id)).map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[20px] shadow-sm border border-[#f0f0f0] overflow-hidden"
          >
            {/* Top row: avatar + name + date + hide button */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold text-white" style={{ backgroundColor: item.color }}>
                  {(item.userName || "\u10D0\u10DC\u10E3\u10D9\u10D0").charAt(0).toUpperCase()}
                </div>
                <span className="text-[15px] font-bold text-[#2d2d2d]">{item.userName || "\u10D0\u10DC\u10E3\u10D9\u10D0"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#999]">{formatDate(item.date)}</span>
                <button
                  onClick={() => hideItem(item.id)}
                  className="w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center"
                  title="დამალვა"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M2 2l20 20" stroke="#bbb" strokeWidth="2.5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Achievement content */}
            <div className="px-4 pb-2">
              <p className="text-[17px] font-bold text-[#2d2d2d]">
                {item.type === "activity" ? item.title : `${item.emoji} ${item.title}`}
              </p>
              {item.detail && (
                <p className="text-[14px] text-[#666] mt-1">{item.detail}</p>
              )}
            </div>

            {/* Stats row if relevant */}
            {item.stats && (
              <div className="px-4 pb-2">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-bold"
                  style={{
                    backgroundColor: item.color + "15",
                    color: item.color,
                  }}
                >
                  {"\u{1F4CA}"} {item.stats}
                </div>
              </div>
            )}

            {/* Reaction area */}
            <div className="px-4 pb-3.5 pt-1 flex gap-1.5">
              {getReactions(item.type).map((r, i) => (
                <span
                  key={i}
                  className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[14px]"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const defaultProfile: ProfileData = {
  age: "34",
  gender: "მამრობითი",
  height: "165",
  weight: "60",
  goal: "წონის დაკლება",
  activityLevel: "საშუალო (3-5 დღე/კვირაში ვარჯიში)",
};

// Helper: get today's date as YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Helper: get the Monday-Sunday week containing a given date
// Generate array of dates: 60 days before today + today
function getCalendarDays(): string[] {
  const today = new Date();
  const days: string[] = [];
  for (let i = -60; i <= 0; i++) {
    const dd = new Date(today);
    dd.setDate(today.getDate() + i);
    days.push(
      `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`
    );
  }
  return days;
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  return (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
}

const GEO_DAY_ABBR = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];

function WeekCalendar({
  selectedDate,
  onSelect,
  daysWithData,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  daysWithData: string[];
}) {
  const todayStr = getTodayStr();
  const calendarDays = getCalendarDays();
  const dataSet = new Set(daysWithData);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didScroll = useRef(false);

  // Auto-scroll to selected date on mount
  useEffect(() => {
    if (!didScroll.current && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-date="${selectedDate}"]`);
      if (el) {
        el.scrollIntoView({ inline: "center", block: "nearest" });
        didScroll.current = true;
      }
    }
  }, [selectedDate]);

  return (
    <div className="bg-white border-b border-gray-200 py-2.5">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-2 gap-1"
      >
        {calendarDays.map((dateStr) => {
          const dayNum = parseInt(dateStr.split("-")[2], 10);
          const dayOfWeek = getDayOfWeek(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const hasData = dataSet.has(dateStr);

          return (
            <button
              key={dateStr}
              data-date={dateStr}
              disabled={isFuture}
              onClick={() => !isFuture && onSelect(dateStr)}
              className="flex flex-col items-center gap-0.5 min-w-[44px] shrink-0 py-0.5"
            >
              <span
                className={`text-[11px] font-semibold ${
                  isSelected
                    ? "text-[#4CAF50]"
                    : isFuture
                    ? "text-[#d0d0d0]"
                    : "text-[#999]"
                }`}
              >
                {GEO_DAY_ABBR[dayOfWeek]}
              </span>
              <div
                className={`w-[36px] h-[36px] rounded-full flex items-center justify-center ${
                  isSelected
                    ? "bg-[#4CAF50]"
                    : isToday
                    ? "border-2 border-[#4CAF50]"
                    : ""
                }`}
              >
                <span
                  className={`text-[15px] font-bold ${
                    isSelected
                      ? "text-white"
                      : isToday
                      ? "text-[#4CAF50]"
                      : isFuture
                      ? "text-[#d0d0d0]"
                      : "text-[#555]"
                  }`}
                >
                  {dayNum}
                </span>
              </div>
              <div className="h-[6px] flex items-center justify-center">
                {hasData && !isSelected && (
                  <div className="w-[5px] h-[5px] rounded-full bg-[#4CAF50]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Save to server (debounced via ref) - separate for global and daily
let saveGlobalTimeout: ReturnType<typeof setTimeout> | null = null;
function saveGlobal(phone: string, profile: ProfileData, regime: "standard" | "fast") {
  if (saveGlobalTimeout) clearTimeout(saveGlobalTimeout);
  saveGlobalTimeout = setTimeout(() => {
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "global", phone, profile, regime }),
    }).catch(() => {});
  }, 500);
}

let saveDailyTimeout: ReturnType<typeof setTimeout> | null = null;
function saveDaily(
  phone: string,
  date: string,
  foods: FoodItem[],
  waterMl: number,
  weight: number,
  userActivities: ActivityItem[],
  goalCalories?: number
) {
  if (saveDailyTimeout) clearTimeout(saveDailyTimeout);
  saveDailyTimeout = setTimeout(() => {
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "daily", phone, date, foods, waterMl, weight, userActivities, goalCalories }),
    }).catch(() => {});
  }, 500);
}

// =============================================
// AUTH COMPONENTS: Login, PIN, Onboarding
// =============================================

function LoginPage({ onPhoneVerified, onNewUser }: { onPhoneVerified: (phone: string) => void; onNewUser: (phone: string) => void }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!phone.trim() || phone.length < 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.exists) {
        onPhoneVerified(phone.trim());
      } else {
        onNewUser(phone.trim());
      }
    } catch {
      setError("შეცდომა. სცადეთ თავიდან.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#8BC34A] flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-[24px] p-8 shadow-xl">
        <img src="/logo.png" className="h-16 mx-auto mb-6" alt="anukas" />

        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px]">📱</span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="ტელეფონის ნომერი"
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#e0e0e0] text-[16px] text-[#2d2d2d] outline-none focus:border-[#8BC34A] transition-colors"
            autoFocus
          />
        </div>

        {error && <p className="text-red-500 text-[14px] text-center mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || phone.length < 6}
          className="w-full py-4 rounded-2xl bg-[#8BC34A] text-white text-[17px] font-bold disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "შესვლა"
          )}
        </button>
      </div>
    </div>
  );
}

function PinPage({
  phone,
  mode,
  onSuccess,
  onBack,
  confirmPin,
}: {
  phone: string;
  mode: "login" | "create" | "confirm";
  onSuccess: (pin: string, userData?: { name: string }) => void;
  onBack: () => void;
  confirmPin?: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const title =
    mode === "login" ? "შეიყვანეთ პინი" :
    mode === "create" ? "შექმენით პინი" :
    "გაიმეორეთ პინი";

  useEffect(() => {
    if (pin.length === 6) {
      handlePinComplete(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  async function handlePinComplete(enteredPin: string) {
    if (mode === "login") {
      setLoading(true);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", phone, pin: enteredPin }),
        });
        const data = await res.json();
        if (data.ok) {
          onSuccess(enteredPin, data.user ? { name: data.user.name } : undefined);
        } else {
          triggerError(data.error || "არასწორი პინი");
        }
      } catch {
        triggerError("შეცდომა. სცადეთ თავიდან.");
      }
      setLoading(false);
    } else if (mode === "create") {
      onSuccess(enteredPin);
    } else if (mode === "confirm") {
      if (enteredPin === confirmPin) {
        onSuccess(enteredPin);
      } else {
        triggerError("პინები არ ემთხვევა");
      }
    }
  }

  function triggerError(msg: string) {
    setError(msg);
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      setPin("");
      setError("");
    }, 800);
  }

  function handleDigit(d: string) {
    if (pin.length < 6 && !loading) {
      setPin((prev) => prev + d);
    }
  }

  function handleBackspace() {
    setPin((prev) => prev.slice(0, -1));
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-4 py-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-[#e0e0e0] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-10 px-6">
        <h2 className="text-[24px] font-extrabold text-[#2d2d2d] mb-8">{title}</h2>

        {/* PIN dots */}
        <div className={`flex gap-4 mb-4 ${shaking ? "animate-shake" : ""}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                i < pin.length ? "bg-[#8BC34A] scale-110" : "bg-[#e0e0e0]"
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-[14px] mb-4">{error}</p>}

        {loading && (
          <div className="w-8 h-8 border-4 border-[#8BC34A] border-t-transparent rounded-full animate-spin mb-4" />
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(String(n))}
              className="w-full aspect-square rounded-full bg-[#f5f5f5] text-[24px] font-bold text-[#2d2d2d] flex items-center justify-center active:bg-[#e0e0e0] transition-colors"
            >
              {n}
            </button>
          ))}
          <div /> {/* empty space */}
          <button
            onClick={() => handleDigit("0")}
            className="w-full aspect-square rounded-full bg-[#f5f5f5] text-[24px] font-bold text-[#2d2d2d] flex items-center justify-center active:bg-[#e0e0e0] transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-full aspect-square rounded-full flex items-center justify-center"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface OnboardingProfile {
  name: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  goal: string;
  activityLevel: string;
}

function OnboardingPage({
  phone,
  onComplete,
  onBack,
}: {
  phone: string;
  onComplete: (user: { phone: string; name: string }) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  const [data, setData] = useState<OnboardingProfile>({
    name: "",
    gender: "",
    age: 25,
    height: 170,
    weight: 70,
    targetWeight: 65,
    goal: "",
    activityLevel: "",
  });
  const [pinMode, setPinMode] = useState<"create" | "confirm" | null>(null);
  const [createdPin, setCreatedPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function goNext() {
    if (step < totalSteps) setStep(step + 1);
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
    else onBack();
  }

  function finishOnboarding() {
    setPinMode("create");
  }

  async function handleRegister(pin: string) {
    setLoading(true);
    setError("");
    try {
      const profilePayload = {
        age: String(data.age),
        gender: data.gender === "ქალი" ? "მდედრობითი" : "მამრობითი",
        height: String(data.height),
        weight: String(data.weight),
        goal: data.goal,
        activityLevel: data.activityLevel,
        startingWeight: String(data.weight),
        targetWeight: String(data.targetWeight),
      };
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          phone,
          pin,
          name: data.name,
          profile: profilePayload,
        }),
      });
      const result = await res.json();
      if (result.ok) {
        localStorage.setItem("anukas-auth-session", JSON.stringify({ phone, name: data.name }));
        onComplete({ phone, name: data.name });
      } else {
        setError(result.error || "რეგისტრაცია ვერ მოხერხდა");
        setPinMode(null);
      }
    } catch {
      setError("შეცდომა. სცადეთ თავიდან.");
      setPinMode(null);
    }
    setLoading(false);
  }

  // PIN flow
  if (pinMode === "create") {
    return (
      <PinPage
        phone={phone}
        mode="create"
        onSuccess={(pin) => {
          setCreatedPin(pin);
          setPinMode("confirm");
        }}
        onBack={() => setPinMode(null)}
      />
    );
  }
  if (pinMode === "confirm") {
    return (
      <PinPage
        phone={phone}
        mode="confirm"
        confirmPin={createdPin}
        onSuccess={(pin) => handleRegister(pin)}
        onBack={() => setPinMode("create")}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8BC34A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const genderImg = data.gender === "ქალი" ? "/girl.jpg" : "/boy.jpg";

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      {/* Top bar with back, progress, step counter */}
      <div className="flex items-center px-4 py-4 gap-3">
        <button onClick={goBack} className="text-[15px] font-bold text-[#888] shrink-0">
          {"< უკან"}
        </button>
        <div className="flex-1 h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#8BC34A] rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-[14px] font-bold text-[#888] shrink-0">{step}/{totalSteps}</span>
      </div>

      {error && <p className="text-red-500 text-[14px] text-center px-6 mb-2">{error}</p>}

      <div className="flex-1 flex flex-col px-6 pt-6">
        {/* Step 1: Name */}
        {step === 1 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-[28px] font-extrabold text-[#2d2d2d] mb-8">თქვენი სახელი</h2>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="სახელი"
              className="w-full px-5 py-4 rounded-2xl border border-[#e0e0e0] text-[18px] text-[#2d2d2d] outline-none focus:border-[#8BC34A] transition-colors mb-8"
              autoFocus
            />
            <div className="mt-auto pb-8">
              <button
                onClick={goNext}
                disabled={!data.name.trim()}
                className="w-full py-4 rounded-2xl bg-[#8BC34A] text-white text-[17px] font-bold disabled:opacity-40"
              >
                {"შემდეგი →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Gender */}
        {step === 2 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-[28px] font-extrabold text-[#2d2d2d] mb-6 text-center">თქვენი სქესი</h2>
            <div className="flex flex-col gap-4 mb-6">
              {[
                { label: "ქალი", img: "/girl.jpg" },
                { label: "კაცი", img: "/boy.jpg" },
              ].map((g) => (
                <button
                  key={g.label}
                  onClick={() => {
                    setData({ ...data, gender: g.label });
                    setTimeout(goNext, 200);
                  }}
                  className={`w-full py-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    data.gender === g.label
                      ? "border-[#8BC34A] bg-[#f0f9e8]"
                      : "border-[#e0e0e0] bg-white"
                  }`}
                >
                  <img src={g.img} alt={g.label} className="h-40 object-contain" />
                  <span className="text-[20px] font-extrabold text-[#3d4f6f]">{g.label}</span>
                </button>
              ))}
            </div>
            <div className="bg-[#E8F5FD] rounded-2xl p-4 flex items-start gap-3 mt-auto mb-8">
              <div className="w-6 h-6 rounded-full bg-[#c8e6c9] flex items-center justify-center shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              </div>
              <p className="text-[13px] text-[#555] leading-relaxed">
                ეს ინფორმაცია გვეხმარება დღიური კალორიების გამოთვლაში
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Age */}
        {step === 3 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-[28px] font-extrabold text-[#2d2d2d] mb-6">თქვენი ასაკი</h2>
            <div className="flex flex-col items-center my-6">
              <img src={genderImg} alt="" className="h-48 object-contain mb-4" />
              <span className="text-[48px] font-extrabold text-[#8BC34A]">{data.age}</span>
              <span className="text-[18px] text-[#999]">წლის</span>
            </div>
            <div className="px-2 mb-4">
              <input
                type="range"
                min={18}
                max={100}
                value={data.age}
                onChange={(e) => setData({ ...data, age: parseInt(e.target.value) })}
                className="green-slider w-full"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[13px] text-[#999]">18</span>
                <span className="text-[13px] text-[#999]">59</span>
                <span className="text-[13px] text-[#999]">100</span>
              </div>
            </div>
            <div className="mt-auto pb-8">
              <button onClick={goNext} className="w-full py-4 rounded-2xl bg-[#8BC34A] text-white text-[17px] font-bold">
                {"შემდეგი →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Height */}
        {step === 4 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-[28px] font-extrabold text-[#2d2d2d] mb-6">თქვენი სიმაღლე</h2>
            <div className="flex flex-col items-center my-8">
              <span className="text-[56px] font-extrabold text-[#8BC34A]">{data.height}</span>
              <span className="text-[18px] text-[#999]">სმ</span>
            </div>
            <div className="px-2 mb-4">
              <input
                type="range"
                min={120}
                max={220}
                value={data.height}
                onChange={(e) => setData({ ...data, height: parseInt(e.target.value) })}
                className="green-slider w-full"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[13px] text-[#999]">120</span>
                <span className="text-[13px] text-[#999]">170</span>
                <span className="text-[13px] text-[#999]">220</span>
              </div>
            </div>
            <div className="mt-auto pb-8">
              <button onClick={goNext} className="w-full py-4 rounded-2xl bg-[#8BC34A] text-white text-[17px] font-bold">
                {"შემდეგი →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Weight */}
        {step === 5 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-[28px] font-extrabold text-[#2d2d2d] mb-6">თქვენი წონა</h2>
            <div className="flex flex-col items-center my-8">
              <span className="text-[56px] font-extrabold text-[#8BC34A]">{data.weight}</span>
              <span className="text-[18px] text-[#999]">კგ</span>
            </div>
            <div className="px-2 mb-4">
              <input
                type="range"
                min={30}
                max={200}
                value={data.weight}
                onChange={(e) => setData({ ...data, weight: parseInt(e.target.value) })}
                className="green-slider w-full"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[13px] text-[#999]">30</span>
                <span className="text-[13px] text-[#999]">115</span>
                <span className="text-[13px] text-[#999]">200</span>
              </div>
            </div>
            <div className="mt-auto pb-8">
              <button onClick={goNext} className="w-full py-4 rounded-2xl bg-[#8BC34A] text-white text-[17px] font-bold">
                {"შემდეგი →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Target Weight */}
        {step === 6 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-[28px] font-extrabold text-[#2d2d2d] mb-6">სამიზნე წონა</h2>
            <div className="flex flex-col items-center my-8">
              <span className="text-[56px] font-extrabold text-[#8BC34A]">{data.targetWeight}</span>
              <span className="text-[18px] text-[#999]">კგ</span>
            </div>
            <div className="px-2 mb-4">
              <input
                type="range"
                min={30}
                max={200}
                value={data.targetWeight}
                onChange={(e) => setData({ ...data, targetWeight: parseInt(e.target.value) })}
                className="green-slider w-full"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[13px] text-[#999]">30</span>
                <span className="text-[13px] text-[#999]">115</span>
                <span className="text-[13px] text-[#999]">200</span>
              </div>
            </div>
            <div className="mt-auto pb-8">
              <button onClick={goNext} className="w-full py-4 rounded-2xl bg-[#8BC34A] text-white text-[17px] font-bold">
                {"შემდეგი →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Goal */}
        {step === 7 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-[28px] font-extrabold text-[#2d2d2d] mb-8">თქვენი მიზანი</h2>
            <div className="flex flex-col gap-4">
              {[
                { label: "წონის დაკლება", icon: "📉" },
                { label: "შენარჩუნება", icon: "⚖️" },
              ].map((g) => (
                <button
                  key={g.label}
                  onClick={() => {
                    setData({ ...data, goal: g.label });
                    setTimeout(goNext, 200);
                  }}
                  className={`py-6 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${
                    data.goal === g.label
                      ? "border-[#8BC34A] bg-[#f0f9e8]"
                      : "border-[#e0e0e0] bg-white"
                  }`}
                >
                  <span className="text-[32px]">{g.icon}</span>
                  <span className="text-[18px] font-bold text-[#2d2d2d]">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Activity Level */}
        {step === 8 && (
          <div className="flex flex-col flex-1">
            <h2 className="text-[28px] font-extrabold text-[#2d2d2d] mb-6">აქტიურობის დონე</h2>
            <div className="flex flex-col gap-3 mb-6">
              {[
                { label: "მცირე (1-2 დღე/კვირაში ვარჯიში)", short: "მცირე", desc: "ძირითადად მჯდომარე ცხოვრების წესი", icon: "🚶" },
                { label: "საშუალო (3-5 დღე/კვირაში ვარჯიში)", short: "საშუალო", desc: "კვირაში 3-5 ვარჯიში", icon: "🏃" },
                { label: "მაღალი (6-7 დღე/კვირაში ვარჯიში)", short: "მაღალი", desc: "ყოველდღიური აქტიური ვარჯიში", icon: "🏋️" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => setData({ ...data, activityLevel: a.label })}
                  className={`p-5 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${
                    data.activityLevel === a.label
                      ? "border-[#8BC34A] bg-[#f0f9e8]"
                      : "border-[#e0e0e0] bg-white"
                  }`}
                >
                  <span className="text-[32px]">{a.icon}</span>
                  <div>
                    <span className="text-[17px] font-bold text-[#2d2d2d] block">{a.short}</span>
                    <span className="text-[13px] text-[#999]">{a.desc}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-auto pb-8">
              <button
                onClick={finishOnboarding}
                disabled={!data.activityLevel}
                className="w-full py-4 rounded-2xl bg-[#8BC34A] text-white text-[17px] font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {"დასრულება ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// MAIN APP WRAPPER WITH AUTH
// =============================================

export default function CaloriesPage() {
  // Auth state
  const [authState, setAuthState] = useState<"loading" | "login" | "pin" | "onboarding" | "authenticated">("loading");
  const [authUser, setAuthUser] = useState<{ phone: string; name: string } | null>(null);
  const [authPhone, setAuthPhone] = useState("");

  // Check localStorage for saved session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("anukas-auth-session");
      if (saved) {
        const session = JSON.parse(saved);
        if (session && session.phone && session.name) {
          setAuthUser(session);
          setAuthState("authenticated");
          return;
        }
      }
    } catch {}
    setAuthState("login");
  }, []);

  function handleLogout() {
    localStorage.removeItem("anukas-auth-session");
    setAuthUser(null);
    setAuthPhone("");
    setAuthState("login");
  }

  function handleLoginSuccess(user: { phone: string; name: string }) {
    localStorage.setItem("anukas-auth-session", JSON.stringify(user));
    setAuthUser(user);
    setAuthState("authenticated");
  }

  // Auth screens
  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === "login") {
    return (
      <LoginPage
        onPhoneVerified={(phone) => {
          setAuthPhone(phone);
          setAuthState("pin");
        }}
        onNewUser={(phone) => {
          setAuthPhone(phone);
          setAuthState("onboarding");
        }}
      />
    );
  }

  if (authState === "pin") {
    return (
      <PinPage
        phone={authPhone}
        mode="login"
        onSuccess={(_pin, userData) => {
          handleLoginSuccess({ phone: authPhone, name: userData?.name || authPhone });
        }}
        onBack={() => setAuthState("login")}
      />
    );
  }

  if (authState === "onboarding") {
    return (
      <OnboardingPage
        phone={authPhone}
        onComplete={(user) => handleLoginSuccess(user)}
        onBack={() => setAuthState("login")}
      />
    );
  }

  // authState === "authenticated" — render the main app
  return <AuthenticatedApp onLogout={handleLogout} authUser={authUser!} />;
}

function AuthenticatedApp({ onLogout, authUser }: { onLogout: () => void; authUser: { phone: string; name: string } }) {
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"diary" | "challenge" | "progress" | "assistant">("diary");
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [waterMl, setWaterMl] = useState(0);
  const [weight, setWeight] = useState(65.0);
  const [showAddFood, setShowAddFood] = useState(false);
  const [currentMeal, setCurrentMeal] = useState("საუზმე");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [regime, setRegime] = useState<"standard" | "fast">("standard");
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [userActivities, setUserActivities] = useState<ActivityItem[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editGoalValue, setEditGoalValue] = useState("");
  const [activitySheetInitial, setActivitySheetInitial] = useState<{ emoji: string; name: string } | null>(null);
  const [activitySheetTab, setActivitySheetTab] = useState<"quick" | "text">("text");
  const [daysWithData, setDaysWithData] = useState<string[]>([]);
  const [lastKnownWeight, setLastKnownWeight] = useState(65.0);
  const dateLoadedRef = useRef<string | null>(null);

  // Load global data + today's daily data + days index on mount
  useEffect(() => {
    const today = getTodayStr();
    const phone = authUser.phone;
    Promise.all([
      fetch(`/api/data?phone=${phone}`).then((r) => r.json()),
      fetch(`/api/data?phone=${phone}&date=${today}`).then((r) => r.json()),
      fetch(`/api/data?phone=${phone}&daysIndex=1`).then((r) => r.json()),
    ])
      .then(([globalData, dailyData, daysIndex]) => {
        if (globalData) {
          if (globalData.profile) setProfile(globalData.profile);
          if (globalData.regime) setRegime(globalData.regime);
        }
        if (dailyData) {
          if (Array.isArray(dailyData.foods)) setFoods(dailyData.foods);
          if (typeof dailyData.waterMl === "number") setWaterMl(dailyData.waterMl);
          if (typeof dailyData.weight === "number") {
            setWeight(dailyData.weight);
            setLastKnownWeight(dailyData.weight);
          }
          if (Array.isArray(dailyData.userActivities)) setUserActivities(dailyData.userActivities);
        }
        if (Array.isArray(daysIndex)) setDaysWithData(daysIndex);
        dateLoadedRef.current = today;
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // When selectedDate changes (user taps a day), load that day's data
  const handleDateSelect = useCallback(
    (newDate: string) => {
      if (newDate === selectedDate) return;
      setSelectedDate(newDate);
      // Load daily data for the new date
      fetch(`/api/data?phone=${authUser.phone}&date=${newDate}`)
        .then((r) => r.json())
        .then((dailyData) => {
          if (dailyData) {
            setFoods(Array.isArray(dailyData.foods) ? dailyData.foods : []);
            setWaterMl(typeof dailyData.waterMl === "number" ? dailyData.waterMl : 0);
            if (typeof dailyData.weight === "number") {
              setWeight(dailyData.weight);
            } else {
              setWeight(lastKnownWeight);
            }
            setUserActivities(Array.isArray(dailyData.userActivities) ? dailyData.userActivities : []);
          } else {
            // No data for this day - start fresh
            setFoods([]);
            setWaterMl(0);
            setWeight(lastKnownWeight);
            setUserActivities([]);
          }
          dateLoadedRef.current = newDate;
        })
        .catch(() => {});
    },
    [selectedDate, lastKnownWeight]
  );

  // Save global data whenever profile/regime changes
  useEffect(() => {
    if (!loaded) return;
    saveGlobal(authUser.phone, profile, regime);
  }, [profile, regime, loaded]);

  // Save daily data whenever daily fields change
  useEffect(() => {
    if (!loaded) return;
    saveDaily(authUser.phone, selectedDate, foods, waterMl, weight, userActivities, goalCalories);
    // Update days index locally
    const hasData = foods.length > 0 || userActivities.length > 0 || waterMl > 0;
    setDaysWithData((prev) => {
      const set = new Set(prev);
      if (hasData) {
        set.add(selectedDate);
      } else {
        set.delete(selectedDate);
      }
      return Array.from(set);
    });
    // Track last known weight
    if (weight > 0) setLastKnownWeight(weight);
  }, [waterMl, weight, foods, userActivities, loaded, selectedDate]);

  const calculatedCalories = calculateCalories(profile, regime);
  const goalCalories = profile.manualGoalCalories ? Number(profile.manualGoalCalories) : calculatedCalories;
  const macros = calculateMacros(goalCalories);
  const consumed = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
      protein: acc.protein + f.protein,
    }),
    { calories: 0, carbs: 0, fat: 0, protein: 0 }
  );
  const totalBurned = userActivities.reduce((s, a) => s + a.caloriesBurned, 0);
  const remaining = goalCalories + totalBurned - consumed.calories;
  const isOverLimit = remaining < 0;
  const overAmount = Math.abs(remaining);
  const waterGoal = Math.round((Number(profile.weight) || 60) * 33);
  const waterPercent = Math.round((waterMl / waterGoal) * 100);

  // Show loading spinner until localStorage is read
  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showProfile) {
    return (
      <div className={`${dachiFont.variable} max-w-md mx-auto`}>
        <ProfilePage
          profile={profile}
          onSave={(data) => setProfile(data)}
          onBack={() => setShowProfile(false)}
          onLogout={onLogout}
          phone={authUser?.phone}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dachiFont.variable} min-h-screen bg-[#f5f5f5] max-w-md mx-auto flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
        <img src="/logo.png" alt="anukas calories" className="h-20" />
        <button
          onClick={() => setShowProfile(true)}
          className="w-11 h-11 rounded-full border-[1.5px] border-gray-300 flex items-center justify-center bg-white"
        >
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

      {/* Tab content */}
      {activeTab === "diary" && (
        <>
      {/* Weekly calendar strip */}
      <WeekCalendar
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
        daysWithData={daysWithData}
      />

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
              progress={goalCalories ? Math.min(100, (consumed.calories / goalCalories) * 100) : 0}
              color={isOverLimit ? "#F57C00" : "#4CAF50"}
              bgColor={isOverLimit ? "#FFF3E0" : "#e8e8e8"}
            />
            {/* Warning triangle when over limit */}
            {isOverLimit && (
              <div className="absolute top-2 right-[60px]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L1 21h22L12 2z" fill="#FFF3E0" stroke="#F57C00" strokeWidth="1.5" />
                  <path d="M12 9v4M12 17h.01" stroke="#F57C00" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm text-[#b0b0b0]">
                {isOverLimit ? "ზედმეტი" : "დაგრჩა"}
              </span>
              <span className={`text-[46px] font-bold leading-[52px] ${isOverLimit ? "text-[#F57C00]" : "text-[#4CAF50]"}`}>
                {isOverLimit ? `+${overAmount}` : remaining}
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
                {consumed.calories}
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
              <button
                onClick={() => { setEditGoalValue(String(goalCalories)); setShowEditGoal(true); }}
                className="text-[38px] font-bold text-[#2d2d2d] leading-[44px] underline decoration-dotted decoration-[#ccc] underline-offset-4"
              >
                {goalCalories}
              </button>
              <span className="text-[13px] text-[#b0b0b0] -mt-0.5">კკალ ✏️</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#ebebeb] mx-2 my-3.5" />

          {/* Macros */}
          <div className="flex justify-around pb-1.5 px-1">
            {/* Carbs */}
            {(() => { const over = consumed.carbs > macros.carbs; return (
            <div className="flex flex-col items-center">
              <div className="relative w-[82px] h-[82px] flex items-center justify-center mb-2">
                <CircularProgress
                  size={82}
                  strokeWidth={6}
                  progress={macros.carbs ? Math.min(100, (consumed.carbs / macros.carbs) * 100) : 0}
                  color={over ? "#E57373" : "#E8A0BF"}
                  bgColor={over ? "#FFEBEE" : "#F5DFE9"}
                />
                <div className="absolute flex flex-col items-center">
                  <span className={`text-[20px] font-bold leading-6 ${over ? "text-[#E57373]" : "text-[#2d2d2d]"}`}>
                    {consumed.carbs}
                  </span>
                  <span className="text-[11px] text-[#aaa] -mt-px">
                    / {macros.carbs}გ
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#777]">ნახშირწყლები</span>
            </div>
            ); })()}
            {/* Fats */}
            {(() => { const over = consumed.fat > macros.fat; return (
            <div className="flex flex-col items-center">
              <div className="relative w-[82px] h-[82px] flex items-center justify-center mb-2">
                <CircularProgress
                  size={82}
                  strokeWidth={6}
                  progress={macros.fat ? Math.min(100, (consumed.fat / macros.fat) * 100) : 0}
                  color={over ? "#64B5F6" : "#90B8DE"}
                  bgColor={over ? "#E3F2FD" : "#DAEAF8"}
                />
                <div className="absolute flex flex-col items-center">
                  <span className={`text-[20px] font-bold leading-6 ${over ? "text-[#42A5F5]" : "text-[#2d2d2d]"}`}>
                    {consumed.fat}
                  </span>
                  <span className="text-[11px] text-[#aaa] -mt-px">
                    / {macros.fat}გ
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#777]">ცხიმები</span>
            </div>
            ); })()}
            {/* Protein */}
            {(() => { const over = consumed.protein > macros.protein; return (
            <div className="flex flex-col items-center">
              <div className="relative w-[82px] h-[82px] flex items-center justify-center mb-2">
                <CircularProgress
                  size={82}
                  strokeWidth={6}
                  progress={macros.protein ? Math.min(100, (consumed.protein / macros.protein) * 100) : 0}
                  color={over ? "#FFB74D" : "#E8D5A0"}
                  bgColor={over ? "#FFF3E0" : "#F5EDDA"}
                />
                <div className="absolute flex flex-col items-center">
                  <span className={`text-[20px] font-bold leading-6 ${over ? "text-[#F57C00]" : "text-[#2d2d2d]"}`}>
                    {consumed.protein}
                  </span>
                  <span className="text-[11px] text-[#aaa] -mt-px">
                    / {macros.protein}გ
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#777]">ცილები</span>
            </div>
            ); })()}
          </div>
        </div>

        {/* Meal Cards */}
        {[
          { emoji: "🍳", title: "საუზმე", bg: "#FFF3E0" },
          { emoji: "🍲", title: "სადილი", bg: "#FFF3E0" },
          { emoji: "🥗", title: "ვახშამი", bg: "#F1F8E9" },
          { emoji: "🥜", title: "სნეკი", bg: "#FFF3E0" },
        ].map((meal) => {
          const mealFoods = foods.filter((f) => f.meal === meal.title);
          const mealCals = mealFoods.reduce((s, f) => s + f.calories, 0);
          return (
          <div key={meal.title} className="bg-white rounded-[18px] px-4 py-4 mb-2.5 shadow-sm">
            <div className="flex items-center">
              <div
                className="w-[50px] h-[50px] rounded-[15px] flex items-center justify-center"
                style={{ backgroundColor: meal.bg }}
              >
                <span className="text-[26px]">{meal.emoji}</span>
              </div>
              <div className="ml-3.5 flex-1">
                <span className="text-lg font-bold text-[#2d2d2d] block">{meal.title}</span>
                {mealCals > 0 && (
                  <span className="text-[12px] text-[#999]">{mealCals} კკალ</span>
                )}
              </div>
              <button
                onClick={() => { setCurrentMeal(meal.title); setShowAddFood(true); }}
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
            {/* Show added foods for this meal */}
            {mealFoods.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#f0f0f0]">
                {mealFoods.map((f) => {
                  const foodIndex = foods.indexOf(f);
                  return (
                  <div key={foodIndex} className="flex items-center py-2">
                    <div className="flex-1">
                      <span className="text-[13px] font-semibold text-[#555]">{f.name}</span>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[10px] text-[#aaa]">{f.portion}</span>
                        <span className="text-[10px]"><span className="text-[#E8D5A0]">{'\u25CF'}</span> {f.protein}გ</span>
                        <span className="text-[10px]"><span className="text-[#E8A0BF]">{'\u25CF'}</span> {f.carbs}გ</span>
                        <span className="text-[10px]"><span className="text-[#90B8DE]">{'\u25CF'}</span> {f.fat}გ</span>
                      </div>
                    </div>
                    <span className="text-[13px] font-bold text-[#2d2d2d] mr-2">{f.calories} კკალ</span>
                    <button
                      onClick={() => setFoods((prev) => prev.filter((_, idx) => idx !== foodIndex))}
                      className="w-7 h-7 rounded-lg bg-[#FEE2E2] flex items-center justify-center shrink-0"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}

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
                <AnimatedNumber
                  value={waterMl}
                  className="text-[42px] font-bold text-[#1E88E5] leading-[48px]"
                  duration={700}
                />
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
          <p className="text-[13px] text-[#aaa] mb-3.5">მიზანი: {profile.targetWeight || "58"} კგ</p>
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
            <button
              onClick={() => {
                setActivitySheetInitial(null);
                setActivitySheetTab("text");
                setShowAddActivity(true);
              }}
              className="flex items-center border-[1.5px] border-[#F57C00] rounded-full px-3.5 py-1.5"
            >
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
                  onClick={() => {
                    setActivitySheetInitial(a);
                    setActivitySheetTab("quick");
                    setShowAddActivity(true);
                  }}
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
          {userActivities.length === 0 ? (
            <p className="text-[13px] text-[#bbb]">ვარჯიში არ დამატებულა</p>
          ) : (
            <div>
              {userActivities.map((a, idx) => (
                <div key={idx} className="flex items-center py-2.5">
                  <span className="text-[20px] mr-3">{a.emoji}</span>
                  <div className="flex-1">
                    <span className="text-[14px] font-semibold text-[#2d2d2d]">{a.name}</span>
                    <span className="text-[12px] text-[#999] ml-2">{a.duration} წთ</span>
                  </div>
                  <div className="flex items-center gap-1 mr-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF6B35" stroke="#FF6B35" strokeWidth="1">
                      <path d="M12 22c4.97 0 8-3.582 8-8 0-4.418-4-8-4-8s0 4-4 4c-2 0-2-2-2-2S6 11.582 6 14c0 4.418 2.03 8 6 8z" />
                    </svg>
                    <span className="text-[14px] font-bold text-[#F57C00]">{a.caloriesBurned}</span>
                  </div>
                  <button
                    onClick={() => setUserActivities((prev) => prev.filter((_, i) => i !== idx))}
                    className="w-7 h-7 rounded-lg bg-[#FEE2E2] flex items-center justify-center shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <div className="h-px bg-[#ebebeb] my-2" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#888]">{userActivities.length} ვარჯიში დღეს</span>
                <div className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF6B35" stroke="#FF6B35" strokeWidth="1">
                    <path d="M12 22c4.97 0 8-3.582 8-8 0-4.418-4-8-4-8s0 4-4 4c-2 0-2-2-2-2S6 11.582 6 14c0 4.418 2.03 8 6 8z" />
                  </svg>
                  <span className="text-[14px] font-bold text-[#F57C00]">{totalBurned} კკალ დაწვა</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sheets */}
      <AddFoodSheet
        open={showAddFood}
        onClose={() => setShowAddFood(false)}
        currentMeal={currentMeal}
        onAdd={(item) => setFoods((prev) => [...prev, item])}
      />
      <AddActivitySheet
        open={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        onAdd={(item) => setUserActivities((prev) => [...prev, item])}
        initialActivity={activitySheetInitial}
        initialTab={activitySheetTab}
        goalCalories={goalCalories}
      />
      <SettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        profile={profile}
        regime={regime}
        onSave={(newGoal, newRegime) => {
          setProfile((p) => ({ ...p, goal: newGoal }));
          setRegime(newRegime);
        }}
      />

      {/* Manual goal edit popup */}
      {showEditGoal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowEditGoal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto animate-slideUp">
            <div className="bg-white rounded-t-[24px] px-5 pt-3 pb-8">
              <div className="flex justify-center mb-5">
                <div className="w-10 h-[5px] rounded-full bg-[#ddd]" />
              </div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[22px] font-extrabold text-[#2d2d2d]">დღიური კალორიები</h3>
                <button onClick={() => setShowEditGoal(false)} className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-[13px] text-[#888] mb-3">ჩაწერეთ სასურველი დღიური კალორიების რაოდენობა ან დატოვეთ ცარიელი ავტომატური გამოთვლისთვის</p>
              <div className="flex items-center p-4 rounded-2xl border border-[#e0e0e0] mb-2">
                <input
                  inputMode="numeric"
                  value={editGoalValue}
                  onChange={(e) => setEditGoalValue(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={String(calculatedCalories)}
                  className="text-[28px] font-bold text-[#2d2d2d] bg-transparent outline-none flex-1 w-0"
                />
                <span className="text-[16px] text-[#999] ml-2">კკალ</span>
              </div>
              <p className="text-[12px] text-[#aaa] mb-5">ავტომატური: {calculatedCalories} კკალ (პროფილის მიხედვით)</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setProfile((p) => ({ ...p, manualGoalCalories: undefined }));
                    setShowEditGoal(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl border border-[#e0e0e0] text-[15px] font-bold text-[#888]"
                >
                  ავტომატური
                </button>
                <button
                  onClick={() => {
                    const val = editGoalValue.trim();
                    if (val && Number(val) > 0) {
                      setProfile((p) => ({ ...p, manualGoalCalories: val }));
                    } else {
                      setProfile((p) => ({ ...p, manualGoalCalories: undefined }));
                    }
                    setShowEditGoal(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-[#4CAF50] text-[15px] font-bold text-white"
                >
                  შენახვა
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
        </>
      )}

      {activeTab === "progress" && (
        <ProgressPage
          profile={profile}
          regime={regime}
          phone={authUser.phone}
          onWeightGoalsSave={(sw, tw) => {
            setProfile((p) => ({
              ...p,
              weight: String(sw),
              startingWeight: String(sw),
              targetWeight: String(tw),
            }));
          }}
        />
      )}

      {activeTab === "challenge" && (
        <ChallengePage profile={profile} regime={regime} phone={authUser.phone} />
      )}

      {activeTab === "assistant" && (
        <div className="flex-1 flex items-center justify-center pb-28">
          <div className="text-center">
            <span className="text-[48px] block mb-3">💬</span>
            <p className="text-[18px] font-bold text-[#2d2d2d] mb-1">AI ასისტენტი</p>
            <p className="text-[14px] text-[#999]">მალე დაემატება</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex px-1.5 pt-1.5 pb-5 max-w-md mx-auto">
        <button onClick={() => setActiveTab("diary")} className={`flex-1 flex flex-col items-center py-2 rounded-[20px] mx-0.5 ${activeTab === "diary" ? "bg-[#f0f0f0]" : ""}`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={activeTab === "diary" ? "#333" : "#999"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span className={`text-[11px] mt-1 ${activeTab === "diary" ? "text-[#333] font-bold" : "text-[#999] font-medium"}`}>
            დღიური
          </span>
        </button>
        <button onClick={() => setActiveTab("challenge")} className={`flex-1 flex flex-col items-center py-2 rounded-[20px] mx-0.5 ${activeTab === "challenge" ? "bg-[#f0f0f0]" : ""}`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={activeTab === "challenge" ? "#333" : "#999"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 1012 0V2z" />
          </svg>
          <span className={`text-[11px] mt-1 ${activeTab === "challenge" ? "text-[#333] font-bold" : "text-[#999] font-medium"}`}>
            ჩელენჯი
          </span>
        </button>
        <button onClick={() => setActiveTab("progress")} className={`flex-1 flex flex-col items-center py-2 rounded-[20px] mx-0.5 ${activeTab === "progress" ? "bg-[#f0f0f0]" : ""}`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={activeTab === "progress" ? "#333" : "#999"}
            strokeWidth="2"
          >
            <rect x="3" y="12" width="4" height="9" rx="1" />
            <rect x="10" y="7" width="4" height="14" rx="1" />
            <rect x="17" y="3" width="4" height="18" rx="1" />
          </svg>
          <span className={`text-[11px] mt-1 ${activeTab === "progress" ? "text-[#333] font-bold" : "text-[#999] font-medium"}`}>
            პროგრესი
          </span>
        </button>
        <button onClick={() => setActiveTab("assistant")} className={`flex-1 flex flex-col items-center py-2 rounded-[20px] mx-0.5 ${activeTab === "assistant" ? "bg-[#f0f0f0]" : ""}`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={activeTab === "assistant" ? "#333" : "#999"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" />
          </svg>
          <span className={`text-[11px] mt-1 ${activeTab === "assistant" ? "text-[#333] font-bold" : "text-[#999] font-medium"}`}>
            ასისტენტი
          </span>
        </button>
      </div>
    </div>
  );
}
