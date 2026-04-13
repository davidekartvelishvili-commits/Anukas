import { spring, useCurrentFrame, useVideoConfig } from "remotion";

interface LogoRevealProps {
  startFrame: number;
}

export const LogoReveal: React.FC<LogoRevealProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < 0) return null;

  const scale = spring({
    frame: localFrame,
    fps,
    config: { stiffness: 60, damping: 12 },
  });

  const glowOpacity = Math.sin(frame / 15) * 0.3 + 0.7;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        fontSize: 120,
        fontWeight: 900,
        color: "#F9E741",
        letterSpacing: 12,
        textShadow: `0 0 60px #F9E741, 0 0 120px #F9E74155`,
        opacity: glowOpacity,
        fontFamily: "Outfit, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      SHANSI
    </div>
  );
};
