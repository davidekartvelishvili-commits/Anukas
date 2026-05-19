"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch } from "@/services/api";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} კმ`;
  return `${Math.round(meters)} მ`;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= rating ? "#F9E741" : "#333"} stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function InteractiveStarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} onClick={() => onChange(i)} className="transition-transform active:scale-110">
          <svg width={32} height={32} viewBox="0 0 24 24" fill={i <= value ? "#F9E741" : "#333"} stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function MerchantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const merchantId = params.id as string;

  const [merchant, setMerchant] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestDist, setNearestDist] = useState<string | null>(null);
  const [nearestBranch, setNearestBranch] = useState<{ lat: number; lng: number } | null>(null);

  // Review form
  const [canReview, setCanReview] = useState(false);
  const [unreviewedPayments, setUnreviewedPayments] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedTxId, setSelectedTxId] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showCantReviewPopup, setShowCantReviewPopup] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    if (!merchantId) return;
    (async () => {
      try {
        const data = await apiFetch<any>(`/public/merchants/${merchantId}`);
        if (data.success) {
          setMerchant(data.merchant);
          setProducts(data.products || []);
          setBranches(data.branches || []);
          setReviews(data.reviews || []);
        }
      } catch {}
      finally { setLoading(false); }
    })();

    // Check if user can review
    apiFetch<any>(`/user/merchants/${merchantId}/can-review`).then((data) => {
      if (data.success) {
        setCanReview(data.canReview);
        setUnreviewedPayments(data.unreviewedPayments || []);
        if (data.unreviewedPayments?.length > 0) setSelectedTxId(data.unreviewedPayments[0].id);
      }
    }).catch(() => {});
  }, [merchantId]);

  // Calculate nearest branch distance
  useEffect(() => {
    if (!userLoc || branches.length === 0) return;
    let min = Infinity;
    let closest: { lat: number; lng: number } | null = null;
    for (const b of branches) {
      const d = haversineDistance(userLoc.lat, userLoc.lng, b.lat, b.lng);
      if (d < min) { min = d; closest = { lat: b.lat, lng: b.lng }; }
    }
    setNearestDist(formatDistance(min));
    setNearestBranch(closest);
  }, [userLoc, branches]);

  const submitReview = async () => {
    if (!reviewRating || !selectedTxId) return;
    setSubmittingReview(true);
    try {
      const res = await apiFetch<any>(`/user/merchants/${merchantId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment, payment_transaction_id: selectedTxId }),
      });
      if (res.success) {
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewComment("");
        // Refresh
        const data = await apiFetch<any>(`/public/merchants/${merchantId}`);
        if (data.success) {
          setMerchant(data.merchant);
          setReviews(data.reviews || []);
        }
        const canData = await apiFetch<any>(`/user/merchants/${merchantId}/can-review`);
        if (canData.success) {
          setCanReview(canData.canReview);
          setUnreviewedPayments(canData.unreviewedPayments || []);
        }
      }
    } catch (e: any) {
      alert(e.message || "შეცდომა");
    }
    finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F9E741] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!merchant) return (
    <div className="min-h-[100dvh] bg-black flex items-center justify-center">
      <p className="text-white">მერჩანტი ვერ მოიძებნა</p>
    </div>
  );

  const bigProducts = products.filter(p => p.sortOrder === 0 || p.sortOrder === undefined || p.sortOrder === null);
  const heroProduct = bigProducts[0];

  return (
    <AuthGuard>
      <style>{`html, body { background: #000 !important; }`}</style>
      <main className="min-h-[100dvh] bg-black pb-24">
        {/* Hero */}
        <div className="relative w-full" style={{ height: 280 }}>
          {heroProduct?.imageUrl ? (
            <img src={heroProduct.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1C1C1E 0%, #2A2A2E 100%)" }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,0.9) 100%)" }} />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 w-[40px] h-[40px] rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round"><path d="M13 4l-6 6 6 6" /></svg>
          </button>

          {/* Logo floating over hero */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80px] h-[80px] rounded-[20px] overflow-hidden shadow-xl" style={{ background: "#FFF", border: "3px solid #000" }}>
            {merchant.logoUrl ? (
              <img src={merchant.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "#F9E741" }}>
                <span className="text-[28px] font-bold" style={{ color: "#000" }}>{merchant.businessName.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-[430px] mx-auto px-4">
          {/* Merchant info */}
          <div className="text-center mt-14 mb-6">
            <h1 className="text-white text-[24px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
              {merchant.businessName}
            </h1>
            {merchant.businessNameKa && (
              <p className="text-[14px] mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-dm-sans)" }}>
                {merchant.businessNameKa}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
              {(merchant.avgRating > 0 || merchant.rating > 0) && (
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#F9E741" />
                    <circle cx="8.5" cy="10" r="1.2" fill="#1A1A1A" />
                    <circle cx="15.5" cy="10" r="1.2" fill="#1A1A1A" />
                    <path d="M8 15c1.5 2 6.5 2 8 0" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                  <span className="text-[14px] font-bold" style={{ color: "#F9E741" }}>
                    {(merchant.avgRating || merchant.rating || 0).toFixed(1)}
                  </span>
                  {merchant.reviewCount > 0 && (
                    <span className="text-[12px]" style={{ color: "#666" }}>({merchant.reviewCount})</span>
                  )}
                </div>
              )}
              {nearestDist && (
                <>
                  <span className="text-[12px]" style={{ color: "#555" }}>·</span>
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="5" r="3" fill="#9CA3AF" />
                      <path d="M12 10v4" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                      <path d="M12 14l-4 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                      <path d="M12 14l4 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                      <path d="M7 12l5 2 5-2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                    <span className="text-[13px]" style={{ color: "#9CA3AF" }}>{nearestDist}</span>
                  </div>
                </>
              )}
            </div>

            {/* Let's go button */}
            {nearestBranch && (
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${nearestBranch.lat},${nearestBranch.lng}&travelmode=walking`;
                  window.open(url, "_blank");
                }}
                className="mt-4 px-8 py-3 rounded-full text-[14px] font-bold flex items-center gap-2 mx-auto active:scale-[0.95] transition-transform"
                style={{ background: "#F9E741", color: "#1A1A1A" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l19-9-9 19-2-8-8-2z" />
                </svg>
                წავიდეთ!
              </button>
            )}
          </div>

          {/* Products */}
          {products.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white text-[18px] font-bold mb-3" style={{ fontFamily: "var(--font-outfit)" }}>
                პროდუქტები
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {products.map((p) => (
                  <div key={p.id} className="rounded-[14px] overflow-hidden relative" style={{ height: p.sortOrder === 1 ? 130 : 180 }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "#1C1C1E" }}>
                        <span className="text-[32px]">🍽</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
                      {p.name && (
                        <p className="text-white text-[12px] font-semibold truncate" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          {p.name}
                        </p>
                      )}
                      <span className="text-[13px] font-bold" style={{ color: "#F9E741" }}>₾{p.price?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white text-[18px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
                შეფასებები {reviews.length > 0 && <span className="text-[14px] font-normal" style={{ color: "#666" }}>({reviews.length})</span>}
              </h2>
              {!showReviewForm && (
                <button
                  onClick={() => {
                    if (canReview) {
                      setShowReviewForm(true);
                    } else {
                      setShowCantReviewPopup(true);
                    }
                  }}
                  className="text-[12px] px-4 py-1.5 rounded-full font-bold"
                  style={{ background: "#F9E741", color: "#000" }}
                >
                  + შეფასება
                </button>
              )}
            </div>

            {/* Review form */}
            {showReviewForm && (
              <div className="rounded-[14px] p-4 mb-4" style={{ background: "#1C1C1E" }}>
                <p className="text-[13px] font-bold text-white mb-3">დატოვე შეფასება</p>

                {unreviewedPayments.length > 1 && (
                  <div className="mb-3">
                    <label className="text-[11px] mb-1 block" style={{ color: "#666" }}>გადახდა</label>
                    <select
                      value={selectedTxId}
                      onChange={(e) => setSelectedTxId(e.target.value)}
                      className="w-full rounded-[8px] px-3 py-2 text-[13px] outline-none"
                      style={{ background: "#0F0F0F", color: "#FFF", border: "1px solid #252525" }}
                    >
                      {unreviewedPayments.map((tx) => (
                        <option key={tx.id} value={tx.id}>₾{tx.amount?.toFixed(2)} — {new Date(tx.createdAt).toLocaleDateString("ka-GE")}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-3">
                  <label className="text-[11px] mb-1 block" style={{ color: "#666" }}>რეიტინგი</label>
                  <InteractiveStarRating value={reviewRating} onChange={setReviewRating} />
                </div>

                <div className="mb-3">
                  <label className="text-[11px] mb-1 block" style={{ color: "#666" }}>კომენტარი (არასავალდებულო)</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="რა მოგეწონათ?"
                    rows={3}
                    className="w-full rounded-[8px] px-3 py-2 text-[13px] outline-none resize-none"
                    style={{ background: "#0F0F0F", color: "#FFF", border: "1px solid #252525" }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment(""); }}
                    className="flex-1 py-2.5 rounded-[8px] text-[13px]"
                    style={{ background: "#0F0F0F", color: "#999", border: "1px solid #252525" }}
                  >
                    გაუქმება
                  </button>
                  <button
                    onClick={submitReview}
                    disabled={!reviewRating || submittingReview}
                    className="flex-1 py-2.5 rounded-[8px] text-[13px] font-bold"
                    style={{ background: reviewRating ? "#F9E741" : "#333", color: reviewRating ? "#000" : "#666" }}
                  >
                    {submittingReview ? "..." : "გაგზავნა"}
                  </button>
                </div>
              </div>
            )}

            {/* Review list */}
            {reviews.length > 0 ? (
              <div className="flex flex-col gap-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-[12px] p-4" style={{ background: "#1C1C1E" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center" style={{ background: "#2A2A2E" }}>
                          <span className="text-[11px] font-bold text-white">{(r.userName || "?").charAt(0)}</span>
                        </div>
                        <span className="text-[13px] font-semibold text-white">{r.userName || "მომხმარებელი"}</span>
                      </div>
                      <span className="text-[11px]" style={{ color: "#666" }}>
                        {new Date(r.createdAt).toLocaleDateString("ka-GE")}
                      </span>
                    </div>
                    <StarRating rating={r.rating} size={14} />
                    {r.comment && (
                      <p className="text-[13px] mt-2" style={{ color: "#CCC", lineHeight: 1.5 }}>{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: "#555" }}>შეფასებები ჯერ არ არის</p>
            )}
          </div>

          {/* Branches */}
          {branches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white text-[18px] font-bold mb-3" style={{ fontFamily: "var(--font-outfit)" }}>
                ფილიალები
              </h2>
              <div className="flex flex-col gap-2">
                {branches.map((b, i) => {
                  const dist = userLoc ? formatDistance(haversineDistance(userLoc.lat, userLoc.lng, b.lat, b.lng)) : null;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-[12px] cursor-pointer active:scale-[0.98] transition-transform"
                      style={{ background: "#1C1C1E" }}
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=walking`;
                        window.open(url, "_blank");
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F9E741" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{b.name}</p>
                        {b.address && <p className="text-[11px]" style={{ color: "#666" }}>{b.address}</p>}
                      </div>
                      {dist && (
                        <span className="text-[12px] font-semibold shrink-0" style={{ color: "#9CA3AF" }}>{dist}</span>
                      )}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                        <path d="M3 11l19-9-9 19-2-8-8-2z" />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Can't review popup — glassy style */}
        {showCantReviewPopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowCantReviewPopup(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative rounded-[20px] px-6 py-7 max-w-[320px] w-full"
              style={{
                background: "rgba(50, 50, 50, 0.08)",
                backdropFilter: "blur(12px) saturate(200%)",
                WebkitBackdropFilter: "blur(12px) saturate(200%)",
                border: "1px solid rgba(255,255,255,0.2)",
                animation: "fadeIn 0.2s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <span className="text-[40px]">🔒</span>
              </div>
              <h3
                className="text-white text-[18px] font-bold mb-2 text-center"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                შეფასების დატოვება
              </h3>
              <p
                className="text-[rgba(255,255,255,0.6)] text-[14px] mb-5 leading-relaxed text-center"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                შეფასების დასატოვებლად ჯერ უნდა შეიძინოთ პროდუქტი <span className="text-white font-semibold">{merchant.businessNameKa || merchant.businessName}</span>-ში და დაასკანეროთ QR კოდი.
              </p>
              <button
                onClick={() => setShowCantReviewPopup(false)}
                className="w-full py-3 rounded-full text-[14px] font-bold"
                style={{ background: "#F9E741", color: "#1A1A1A" }}
              >
                გასაგებია
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </AuthGuard>
  );
}
