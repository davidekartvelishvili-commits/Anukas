import { spring, useCurrentFrame, useVideoConfig } from "remotion";

interface TaglineRevealProps {
  startFrame: number;
}

const TAGLINE = "შანსი ყოველ ხარჯშია";

export const TaglineReveal: React.FC<TaglineRevealProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  if (localFrame < 0) return null;

  const characters = TAGLINE.split("");

  return (
    <div
      style={{
        position: "absolute",
        top: "56%",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 0,
        whiteSpace: "pre",
      }}
    >
      {characters.map((char, i) => {
        const charOpacity = spring({
          frame: localFrame - i * 4,
          fps,
          config: { stiffness: 100, damping: 20 },
        });

        return (
          <span
            key={i}
            style={{
              opacity: charOpacity,
              color: "#FFFFFF",
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: 4,
              fontFamily: "Outfit, sans-serif",
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};
