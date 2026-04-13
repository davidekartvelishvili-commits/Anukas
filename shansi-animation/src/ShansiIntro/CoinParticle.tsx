import { interpolate, useCurrentFrame } from "remotion";

interface CoinParticleProps {
  index: number;
  startFrame: number;
  centerX: number;
  centerY: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export const CoinParticle: React.FC<CoinParticleProps> = ({
  index,
  startFrame,
  centerX,
  centerY,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > 60) return null;

  const angle = (index / 30) * Math.PI * 2 + seededRandom(index) * 0.5;
  const maxDist = 200 + seededRandom(index + 100) * 400;
  const size = 8 + seededRandom(index + 200) * 10;

  const distance = interpolate(localFrame, [0, 40], [0, maxDist], {
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(localFrame, [0, 20, 60], [1, 1, 0], {
    extrapolateRight: "clamp",
  });

  const x = centerX + Math.cos(angle) * distance;
  const y = centerY + Math.sin(angle) * distance;

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#F9E741",
        opacity,
        boxShadow: "0 0 12px #F9E74188",
      }}
    />
  );
};
