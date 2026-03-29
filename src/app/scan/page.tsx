"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
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
    };
  }, []);

  return (
    <>
      <style>{`
        html, body { background: #000000 !important; }
        @keyframes scan-line {
          0% { top: 0%; }
          50% { top: 92%; }
          100% { top: 0%; }
        }
      `}</style>
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

        {/* Glass overlay with cutout */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {/* Top glass */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: "calc(50% - 130px)",
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
            }}
          />
          {/* Bottom glass */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: "calc(50% - 130px)",
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
            }}
          />
          {/* Left glass */}
          <div
            className="absolute left-0"
            style={{
              top: "calc(50% - 130px)",
              height: "260px",
              width: "calc(50% - 130px)",
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
            }}
          />
          {/* Right glass */}
          <div
            className="absolute right-0"
            style={{
              top: "calc(50% - 130px)",
              height: "260px",
              width: "calc(50% - 130px)",
              background: "rgba(50, 50, 50, 0.08)",
              backdropFilter: "blur(12px) saturate(200%)",
              WebkitBackdropFilter: "blur(12px) saturate(200%)",
            }}
          />
        </div>

        {/* Scanner square frame + corners */}
        <div
          className="absolute w-[260px] h-[260px] pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        >
          {/* Scanning line */}
          <div
            className="absolute left-[8px] right-[8px] h-[2px]"
            style={{
              background: "linear-gradient(90deg, transparent, #00E88F, transparent)",
              boxShadow: "0 0 15px #00E88F, 0 0 30px rgba(0,232,143,0.3)",
              animation: "scan-line 3s ease-in-out infinite",
            }}
          />

          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-[40px] h-[3px] rounded-full bg-white" />
          <div className="absolute top-0 left-0 w-[3px] h-[40px] rounded-full bg-white" />
          <div className="absolute top-0 right-0 w-[40px] h-[3px] rounded-full bg-white" />
          <div className="absolute top-0 right-0 w-[3px] h-[40px] rounded-full bg-white" />
          <div className="absolute bottom-0 left-0 w-[40px] h-[3px] rounded-full bg-white" />
          <div className="absolute bottom-0 left-0 w-[3px] h-[40px] rounded-full bg-white" />
          <div className="absolute bottom-0 right-0 w-[40px] h-[3px] rounded-full bg-white" />
          <div className="absolute bottom-0 right-0 w-[3px] h-[40px] rounded-full bg-white" />

          {/* Camera error text */}
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
          className="relative z-10 max-w-[430px] mx-auto w-full flex flex-col flex-1 px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between mb-8 shrink-0"
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

          {/* ── Instruction ── */}
          <div
            className="text-center mb-4 shrink-0"
            style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease-out 0.3s" }}
          >
            <p
              className="text-[14px]"
              style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.5)" }}
            >
              Point your camera at a QR code
            </p>
          </div>

          {/* ── Bottom actions ── */}
          <div
            className="shrink-0 flex flex-col items-center gap-3"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease-out 0.4s",
              paddingBottom: "max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))",
            }}
          >
            <button
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center active:scale-[0.95] transition-transform"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <span
              className="text-[12px]"
              style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.4)" }}
            >
              Upload from gallery
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
