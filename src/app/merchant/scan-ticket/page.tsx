"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { verifyTicketQR, redeemTicket, isMerchantAuthenticated } from "@/services/merchant";

// Merchant-side ticket scanner. Mirrors the user /scan page 1:1 in
// camera handling, overlay geometry, corner radii, and color palette —
// only the backend integration and the post-scan card differ.
//
// Accepts ONLY ticket QR payloads (SHTKT-...). Rejects merchant payment
// QRs and anything unrelated. Server enforces that the ticket belongs
// to the authenticated merchant.

export default function MerchantScanTicketPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [verified, setVerified] = useState<any | null>(null);
  const [redeemDone, setRedeemDone] = useState<any | null>(null);
  const [scanError, setScanError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [box, setBox] = useState({ x: 0, y: 0, size: 260 });
  const [isSnapping, setIsSnapping] = useState(false);
  const [screenSize, setScreenSize] = useState({ w: 430, h: 932 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isMerchantAuthenticated()) {
      router.replace("/merchant/login");
      return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    setScreenSize({ w, h });
    setBox({ x: (w - 260) / 2, y: (h - 260) / 2, size: 260 });
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError(true));
    return () => {
      clearTimeout(t);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, []);

  // Scanning loop (same algorithm as user /scan)
  useEffect(() => {
    if (cameraError || scanResult) return;
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);

    scanTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, vw, vh);
      const imageData = ctx.getImageData(0, 0, vw, vh);
      const code = jsQR(imageData.data, vw, vh);

      if (code) {
        // Reject anything that isn't a ticket payload — don't even try.
        if (!code.data.startsWith("SHTKT-")) {
          setScanError("ეს არ არის ტიკეტის QR");
          setScanResult(code.data);
          setErrorCode("INVALID_FORMAT");
          if (scanTimerRef.current) clearInterval(scanTimerRef.current);
          scanTimerRef.current = null;
          return;
        }

        const sw = screenSize.w;
        const sh = screenSize.h;
        const videoRatio = vw / vh;
        const screenRatio = sw / sh;
        let scale: number, offX: number, offY: number;
        if (videoRatio > screenRatio) { scale = sh / vh; offX = (sw - vw * scale) / 2; offY = 0; }
        else { scale = sw / vw; offX = 0; offY = (sh - vh * scale) / 2; }

        const loc = code.location;
        const minX = Math.min(loc.topLeftCorner.x, loc.bottomLeftCorner.x);
        const maxX = Math.max(loc.topRightCorner.x, loc.bottomRightCorner.x);
        const minY = Math.min(loc.topLeftCorner.y, loc.topRightCorner.y);
        const maxY = Math.max(loc.bottomLeftCorner.y, loc.bottomRightCorner.y);

        const qrX = minX * scale + offX;
        const qrY = minY * scale + offY;
        const qrW = (maxX - minX) * scale;
        const qrH = (maxY - minY) * scale;
        const padding = 30;
        const qrSize = Math.max(qrW, qrH) + padding * 2;

        setIsSnapping(true);
        setBox({
          x: Math.max(0, Math.min(sw - qrSize, qrX + qrW / 2 - qrSize / 2)),
          y: Math.max(0, Math.min(sh - qrSize, qrY + qrH / 2 - qrSize / 2)),
          size: Math.max(100, Math.min(400, qrSize)),
        });

        if (scanTimerRef.current) clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;

        setTimeout(async () => {
          const qrData = code.data;
          setScanResult(qrData);
          setIsSnapping(false);
          try {
            const res: any = await verifyTicketQR(qrData);
            if (res?.success) {
              setVerified(res);
            } else {
              setErrorCode(res?.code || "");
              setScanError(res?.message || "შეცდომა");
            }
          } catch (e: any) {
            // Extract error code from backend response if present
            const msg = e?.message || "შეცდომა";
            setScanError(msg);
          }
        }, 400);
      }
    }, 250);

    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    };
  }, [cameraError, scanResult, screenSize]);

  // Drag handlers (identical to user /scan)
  const onTouchStart = (e: React.TouchEvent) => {
    if (scanResult) return;
    dragging.current = true;
    const touch = e.touches[0];
    dragOffset.current = { x: touch.clientX - box.x, y: touch.clientY - box.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const touch = e.touches[0];
    setBox((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(screenSize.w - prev.size, touch.clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(screenSize.h - prev.size, touch.clientY - dragOffset.current.y)),
    }));
  };
  const onTouchEnd = () => { dragging.current = false; };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scanResult) return;
    dragging.current = true;
    dragOffset.current = { x: e.clientX - box.x, y: e.clientY - box.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setBox((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(screenSize.w - prev.size, ev.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(screenSize.h - prev.size, ev.clientY - dragOffset.current.y)),
      }));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const resetScan = () => {
    setScanResult(null);
    setVerified(null);
    setRedeemDone(null);
    setScanError("");
    setErrorCode("");
    setBox({ x: (screenSize.w - 260) / 2, y: (screenSize.h - 260) / 2, size: 260 });
  };

  const errorTone = errorCode === "ALREADY_USED" ? "#F97316" : "#EF4444";

  return (
    <>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="fixed inset-0 flex flex-col">
        {!cameraError ? (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Glass overlay with cutout — identical to user scanner */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "rgba(50, 50, 50, 0.08)",
            backdropFilter: "blur(12px) saturate(200%)",
            WebkitBackdropFilter: "blur(12px) saturate(200%)",
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${screenSize.w}' height='${screenSize.h}'%3E%3Cdefs%3E%3Cmask id='m'%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Crect x='${box.x}' y='${box.y}' width='${box.size}' height='${box.size}' rx='20' fill='black'/%3E%3C/mask%3E%3C/defs%3E%3Crect width='100%25' height='100%25' mask='url(%23m)'/%3E%3C/svg%3E")`,
            maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${screenSize.w}' height='${screenSize.h}'%3E%3Cdefs%3E%3Cmask id='m'%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Crect x='${box.x}' y='${box.y}' width='${box.size}' height='${box.size}' rx='20' fill='black'/%3E%3C/mask%3E%3C/defs%3E%3Crect width='100%25' height='100%25' mask='url(%23m)'/%3E%3C/svg%3E")`,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
            zIndex: 1,
          }}
        />

        {/* Scanner square */}
        <div
          className="absolute rounded-[20px] touch-none cursor-grab active:cursor-grabbing"
          style={{
            width: box.size,
            height: box.size,
            left: box.x,
            top: box.y,
            border: scanResult
              ? scanError
                ? `2.5px solid ${errorTone}`
                : "2.5px solid #00E88F"
              : "1.5px solid rgba(255,255,255,0.2)",
            boxShadow: scanResult
              ? scanError
                ? `0 0 30px ${errorTone}80, inset 0 0 20px ${errorTone}20`
                : "0 0 30px rgba(0,232,143,0.5), inset 0 0 20px rgba(0,232,143,0.1)"
              : "none",
            transition: isSnapping ? "all 0.35s ease-out" : "none",
            zIndex: 3,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[13px] text-[#999] text-center px-4" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Camera access denied.<br />Please enable permissions.
              </p>
            </div>
          )}
        </div>

        {/* UI layer */}
        <div
          className="relative z-10 max-w-[430px] mx-auto w-full flex flex-col flex-1 px-4 pointer-events-none"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          <div
            className="flex items-center justify-between mb-8 shrink-0 pointer-events-auto"
            style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease-out" }}
          >
            <button
              onClick={() => router.back()}
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6" />
              </svg>
            </button>
            <h1 className="text-white text-[18px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
              Scan Ticket QR
            </h1>
            <div className="w-[44px]" />
          </div>

          <div className="flex-1" />

          <div
            className="text-center shrink-0 pointer-events-auto"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease-out 0.3s",
              paddingBottom: "max(32px, calc(env(safe-area-inset-bottom, 0px) + 24px))",
            }}
          >
            {redeemDone ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ background: "rgba(0,232,143,0.15)" }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#00E88F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="8,16 14,22 24,10" /></svg>
                </div>
                <p className="text-white text-[18px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>ტიკეტი გააქტიურებულია!</p>
                <p className="text-[#999] text-[13px]" style={{ fontFamily: "var(--font-dm-sans)" }}>{redeemDone.title}</p>
                <button onClick={resetScan} className="px-8 py-3 rounded-full mt-2 active:scale-95 transition-transform" style={{ background: "#FFD700", color: "#000" }}>
                  <span className="text-[14px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>შემდეგი</span>
                </button>
              </div>
            ) : verified ? (
              <div className="flex flex-col items-center gap-3">
                <div className="px-6 py-4 rounded-[16px] w-full max-w-[320px]" style={{ background: "rgba(50,50,50,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    {verified.ticket?.logoUrl ? (
                      <img src={verified.ticket.logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", background: "#fff" }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{verified.ticket?.emoji || "🎫"}</div>
                    )}
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <p className="text-white text-[15px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>{verified.ticket?.title}</p>
                      <p className="text-[#aaa] text-[12px]" style={{ fontFamily: "var(--font-dm-sans)" }}>{verified.ticket?.titleKa}</p>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#ccc", textAlign: "left" }}>
                    <div><span style={{ color: "#888" }}>Price </span>{verified.ticket?.price}</div>
                    <div><span style={{ color: "#888" }}>Bonus </span><span style={{ color: "#22C55E" }}>{verified.ticket?.bonus}</span></div>
                    {verified.ticket?.screen && (<div><span style={{ color: "#888" }}>Screen </span>{verified.ticket.screen}</div>)}
                    {verified.ticket?.seat && (<div><span style={{ color: "#888" }}>Seat </span>{verified.ticket.seat}</div>)}
                  </div>
                  {verified.user && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "#888", fontFamily: "'DM Mono', monospace", textAlign: "left" }}>
                      user: {verified.user.phone || verified.user.name || "—"}
                    </div>
                  )}
                </div>
                {scanError && <p style={{ color: errorTone, fontSize: 13, fontFamily: "var(--font-dm-sans)" }}>{scanError}</p>}
                <button
                  onClick={async () => {
                    setConfirming(true); setScanError("");
                    try {
                      await redeemTicket(verified.userTicket.id);
                      setRedeemDone({ title: verified.ticket?.title });
                      setVerified(null);
                    } catch (e: any) { setScanError(e?.message || "შეცდომა"); }
                    finally { setConfirming(false); }
                  }}
                  disabled={confirming}
                  className="px-10 py-4 rounded-full active:scale-95 transition-transform disabled:opacity-50"
                  style={{ background: "#FFD700", color: "#000" }}
                >
                  <span className="text-[16px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>{confirming ? "..." : "გააქტიურება"}</span>
                </button>
                <button onClick={resetScan} className="text-[#999] text-[13px] mt-1" style={{ fontFamily: "var(--font-dm-sans)" }}>გაუქმება</button>
              </div>
            ) : scanResult && scanError ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${errorTone}22` }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={errorTone} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="14" cy="14" r="11" />
                    <line x1="14" y1="9" x2="14" y2="15" />
                    <circle cx="14" cy="19" r="1" fill={errorTone} />
                  </svg>
                </div>
                <p className="text-white text-[16px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>{scanError}</p>
                {errorCode === "ALREADY_USED" && (
                  <p className="text-[#aaa] text-[12px]" style={{ fontFamily: "var(--font-dm-sans)" }}>ეს ტიკეტი უკვე გააქტიურებულია</p>
                )}
                <button onClick={resetScan} className="px-8 py-3 rounded-full mt-2 active:scale-95 transition-transform" style={{ background: "#FFD700", color: "#000" }}>
                  <span className="text-[14px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>კიდევ სკანი</span>
                </button>
              </div>
            ) : scanResult ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#FFD700", borderTopColor: "transparent" }} />
                <p className="text-[#999] text-[13px]" style={{ fontFamily: "var(--font-dm-sans)" }}>მუშავდება...</p>
              </div>
            ) : (
              <p className="text-[14px]" style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.5)" }}>
                მიმართე კამერა ტიკეტის QR კოდზე
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
