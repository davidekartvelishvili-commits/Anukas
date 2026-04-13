import { AbsoluteFill } from "remotion";
import { CoinParticle } from "./CoinParticle";

interface CoinsExplosionProps {
  startFrame: number;
  centerX: number;
  centerY: number;
}

export const CoinsExplosion: React.FC<CoinsExplosionProps> = ({
  startFrame,
  centerX,
  centerY,
}) => {
  const coins = Array.from({ length: 30 }, (_, i) => i);

  return (
    <AbsoluteFill>
      {coins.map((i) => (
        <CoinParticle
          key={i}
          index={i}
          startFrame={startFrame}
          centerX={centerX}
          centerY={centerY}
        />
      ))}
    </AbsoluteFill>
  );
};
