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

        {/* Single glass overlay with mask cutout */}
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(50, 50, 50, 0.08)",
            backdropFilter: "blur(12px) saturate(200%)",
            WebkitBackdropFilter: "blur(12px) saturate(200%)",
            maskImage: "radial-gradient(circle, transparent 0px, transparent 0px), linear-gradient(#000, #000)",
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cmask id='m'%3E%3Crect width='100%25' height='100%25' fill='white'/%3E%3Crect x='50%25' y='50%25' width='260' height='260' rx='20' fill='black' transform='translate(-130,-130)'/%3E%3C/mask%3E%3C/defs%3E%3Crect width='100%25' height='100%25' mask='url(%23m)'/%3E%3C/svg%3E")`,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
            zIndex: 1,
          }}
        />

        {/* Scanner square border */}
        <div
          className="absolute w-[260px] h-[260px] rounded-[20px] pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            zIndex: 2,
          }}
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
            className="text-center shrink-0"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease-out 0.3s",
              paddingBottom: "max(32px, calc(env(safe-area-inset-bottom, 0px) + 24px))",
            }}
          >
            <p
              className="text-[14px]"
              style={{ fontFamily: "var(--font-dm-sans)", color: "rgba(255,255,255,0.5)" }}
            >
              Point your camera at a QR code
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
