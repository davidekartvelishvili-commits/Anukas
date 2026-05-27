"use client";

import React, { useState, useEffect, useRef } from "react";
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

// Profile page
// Profile data type
interface ProfileData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
  activityLevel: string;
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

function ProfilePage({
  onBack,
  profile,
  onSave,
}: {
  onBack: () => void;
  profile: ProfileData;
  onSave: (data: ProfileData) => void;
}) {
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

// Save to server (debounced via ref)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function saveToServer(data: Record<string, unknown>) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, 500);
}

export default function CaloriesPage() {
  const [loaded, setLoaded] = useState(false);
  const [waterMl, setWaterMl] = useState(0);
  const [weight, setWeight] = useState(65.0);
  const [showAddFood, setShowAddFood] = useState(false);
  const [currentMeal, setCurrentMeal] = useState("საუზმე");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [regime, setRegime] = useState<"standard" | "fast">("standard");
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);

  // Load saved data from server on mount
  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((saved) => {
        if (saved) {
          if (saved.profile) setProfile(saved.profile);
          if (saved.regime) setRegime(saved.regime);
          if (typeof saved.waterMl === "number") setWaterMl(saved.waterMl);
          if (typeof saved.weight === "number") setWeight(saved.weight);
          if (Array.isArray(saved.foods)) setFoods(saved.foods);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Save to server whenever data changes
  useEffect(() => {
    if (!loaded) return;
    saveToServer({ profile, regime, waterMl, weight, foods });
  }, [profile, regime, waterMl, weight, foods, loaded]);

  const goalCalories = calculateCalories(profile, regime);
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
  const remaining = Math.max(0, goalCalories - consumed.calories);
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
        <h1
          className="text-[22px] text-[#2d2d2d]"
          style={{ fontFamily: "var(--font-dachi)" }}
        >
          ანუკას კალორიები
        </h1>
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
              color="#4CAF50"
              bgColor="#e8e8e8"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm text-[#b0b0b0]">დაგრჩა</span>
              <span className="text-[46px] font-bold text-[#4CAF50] leading-[52px]">
                {remaining}
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
              <span className="text-[38px] font-bold text-[#2d2d2d] leading-[44px]">
                {goalCalories}
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
                  progress={macros.carbs ? Math.min(100, (consumed.carbs / macros.carbs) * 100) : 0}
                  color="#E8A0BF"
                  bgColor="#F5DFE9"
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-[20px] font-bold text-[#2d2d2d] leading-6">
                    {consumed.carbs}
                  </span>
                  <span className="text-[11px] text-[#aaa] -mt-px">
                    / {macros.carbs}გ
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
                  progress={macros.fat ? Math.min(100, (consumed.fat / macros.fat) * 100) : 0}
                  color="#90B8DE"
                  bgColor="#DAEAF8"
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-[20px] font-bold text-[#2d2d2d] leading-6">
                    {consumed.fat}
                  </span>
                  <span className="text-[11px] text-[#aaa] -mt-px">
                    / {macros.fat}გ
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
                  progress={macros.protein ? Math.min(100, (consumed.protein / macros.protein) * 100) : 0}
                  color="#E8D5A0"
                  bgColor="#F5EDDA"
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-[20px] font-bold text-[#2d2d2d] leading-6">
                    {consumed.protein}
                  </span>
                  <span className="text-[11px] text-[#aaa] -mt-px">
                    / {macros.protein}გ
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
      <AddFoodSheet
        open={showAddFood}
        onClose={() => setShowAddFood(false)}
        currentMeal={currentMeal}
        onAdd={(item) => setFoods((prev) => [...prev, item])}
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
