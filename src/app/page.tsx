"use client";

import { Player } from "@remotion/player";
import { ShansiIntro } from "@/components/ShansiIntro";

export default function SplashScreen() {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#000000",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          aspectRatio: "9 / 16",
          borderRadius: 32,
          overflow: "hidden",
          boxShadow: "0 0 80px rgba(249, 231, 65, 0.12)",
        }}
      >
        <Player
          component={ShansiIntro}
          compositionWidth={1080}
          compositionHeight={1920}
          durationInFrames={300}
          fps={30}
          autoPlay
          loop
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <style>{`
        @media (max-width: 480px) {
          main > div {
            max-width: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            height: 100vh;
            aspect-ratio: unset !important;
          }
        }
      `}</style>
    </main>
  );
}
