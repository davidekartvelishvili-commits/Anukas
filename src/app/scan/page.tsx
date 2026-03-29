"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [screenSize, setScreenSize] = useState({ w: 430, h: 932 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const boxSize = 260;

  // Center the box on mount
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setScreenSize({ w, h });
    setPos({ x: (w - boxSize) / 2, y: (h - boxSize) / 2 });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => setCameraError(true));

    return () => {
      clearTimeout(t);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  // QR scanning loop
  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) return;

    const detector = typeof window !== "undefined" && "BarcodeDetector" in window
      ? new (window as any).BarcodeDetector({ formats: ["qr_code"] })
      : null;

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || scanResult) return;
      const video = videoRef.current;
      if (video.readyState < 2) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Map the scanner box position to video coordinates
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const dw = window.innerWidth;
      const dh = window.innerHeight;

      const scaleX = vw / dw;
      const scaleY = vh / dh;

      const sx = pos.x * scaleX;
      const sy = pos.y * scaleY;
      const sw = boxSize * scaleX;
      const sh = boxSize * scaleY;

      canvas.width = sw;
      canvas.height = sh;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

      if (detector) {
        try {
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            setScanResult(barcodes[0].rawValue);
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
          }
        } catch {}
      }
    }, 300);
  }, [pos, scanResult]);

  useEffect(() => {
    if (!cameraError && !scanResult) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
      startScanning();
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    };
  }, [pos, cameraError, scanResult, startScanning]);

  // Drag handlers
  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    const touch = e.touches[0];
    dragOffset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const touch = e.touches[0];
    const newX = Math.max(0, Math.min(window.innerWidth - boxSize, touch.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - boxSize, touch.clientY - dragOffset.current.y));
    setPos({ x: newX, y: newY });
  };
  const onTouchEnd = () => { dragging.current = false; };

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const newX = Math.max(0, Math.min(window.innerWidth - boxSize, ev.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - boxSize, ev.clientY - dragOffset.current.y));
      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <>
      <style>{`html, body { background: #000000 !important; }`}</style>
      <meta name="theme-color" content="#000000" />

      <main className="fixed inset-0 flex flex-col">
        {/* Full-screen camera feed */}
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

        {/* Hidden canvas for QR scanning */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Single glass overlay with dynamic cutout */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "rgba(50, 50, 50, 0.08)",
            backdropFilter: "blur(12px) saturate(200%)",
            WebkitBackdropFilter: "blur(12px) saturate(200%)",
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${screenSize.w}' height='${screenSize.h}'%3E%3Cdefs%3E%3Cmask id='m'%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Crect x='${pos.x}' y='${pos.y}' width='${boxSize}' height='${boxSize}' rx='20' fill='black'/%3E%3C/mask%3E%3C/defs%3E%3Crect width='100%25' height='100%25' mask='url(%23m)'/%3E%3C/svg%3E")`,
            maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${screenSize.w}' height='${screenSize.h}'%3E%3Cdefs%3E%3Cmask id='m'%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Crect x='${pos.x}' y='${pos.y}' width='${boxSize}' height='${boxSize}' rx='20' fill='black'/%3E%3C/mask%3E%3C/defs%3E%3Crect width='100%25' height='100%25' mask='url(%23m)'/%3E%3C/svg%3E")`,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
            zIndex: 1,
          }}
        />

        {/* Draggable scanner square */}
        <div
          className="absolute rounded-[20px] touch-none cursor-grab active:cursor-grabbing"
          style={{
            width: boxSize,
            height: boxSize,
            left: pos.x,
            top: pos.y,
            border: scanResult ? "2px solid #00E88F" : "1.5px solid rgba(255,255,255,0.2)",
            boxShadow: scanResult ? "0 0 20px rgba(0,232,143,0.4)" : "none",
            transition: scanResult ? "border 0.3s, box-shadow 0.3s" : "none",
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
                Camera access denied.<br />Please enable camera permissions.
              </p>
            </div>
          )}
        </div>

        {/* UI layer */}
        <div
          className="relative z-10 max-w-[430px] mx-auto w-full flex flex-col flex-1 px-4 pointer-events-none"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          {/* ── Header ── */}
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
            <h1
              className="text-white text-[18px] font-bold"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Scan QR Code
            </h1>
            <div className="w-[44px]" />
          </div>

          <div className="flex-1" />

          {/* ── Result or instruction ── */}
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
                  onClick={() => { setScanResult(null); startScanning(); }}
                  className="px-6 py-2 rounded-full active:scale-[0.95] transition-transform"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <span className="text-white text-[14px] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
                    Scan Again
                  </span>
                </button>
              </div>
            ) : (
              <p
                className="text-[14px]"
                style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.5)" }}
              >
                Drag the scanner to find a QR code
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
