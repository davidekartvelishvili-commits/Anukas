"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

export default function ScanPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
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
    const w = window.innerWidth;
    const h = window.innerHeight;
    setScreenSize({ w, h });
    setBox({ x: (w - 260) / 2, y: (h - 260) / 2, size: 260 });
  }, []);

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

  // Scanning loop using jsQR on full frame
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
        // Map video coords to screen coords (object-cover)
        const sw = screenSize.w;
        const sh = screenSize.h;
        const videoRatio = vw / vh;
        const screenRatio = sw / sh;
        let scale: number, offX: number, offY: number;

        if (videoRatio > screenRatio) {
          scale = sh / vh;
          offX = (sw - vw * scale) / 2;
          offY = 0;
        } else {
          scale = sw / vw;
          offX = 0;
          offY = (sh - vh * scale) / 2;
        }

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

        setTimeout(() => {
          setScanResult(code.data);
          setIsSnapping(false);
        }, 400);
      }
    }, 250);

    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    };
  }, [cameraError, scanResult, screenSize]);

  // Drag handlers
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
    setBox({ x: (screenSize.w - 260) / 2, y: (screenSize.h - 260) / 2, size: 260 });
  };

  return (
    <>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="fixed inset-0 flex flex-col">
        {!cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Glass overlay with cutout */}
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
            border: scanResult ? "2.5px solid #00E88F" : "1.5px solid rgba(255,255,255,0.2)",
            boxShadow: scanResult ? "0 0 30px rgba(0,232,143,0.5), inset 0 0 20px rgba(0,232,143,0.1)" : "none",
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
              Scan QR Code
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
            {scanResult ? (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="px-5 py-3 rounded-[16px]"
                  style={{
                    background: "rgba(50, 50, 50, 0.08)",
                    backdropFilter: "blur(12px) saturate(200%)",
                    WebkitBackdropFilter: "blur(12px) saturate(200%)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <p className="text-white text-[14px] font-medium break-all" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {scanResult}
                  </p>
                </div>
                <button
                  onClick={resetScan}
                  className="px-6 py-2 rounded-full active:scale-[0.95] transition-transform"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <span className="text-white text-[14px] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    Scan Again
                  </span>
                </button>
              </div>
            ) : (
              <p className="text-[14px]" style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.5)" }}>
                Point camera at a QR code — it will scan automatically
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
