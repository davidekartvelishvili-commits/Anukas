import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { FloatingImage } from "./FloatingImage";
import { LogoReveal } from "./LogoReveal";
import { CoinsExplosion } from "./CoinsExplosion";
import { TaglineReveal } from "./TaglineReveal";

const TOTAL_IMAGES = 8;
const CENTER_X = 1080 / 2;
const CENTER_Y = 1920 / 2;
const ORBIT_RADIUS = 360;

export const ShansiIntro: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeOutOuter = interpolate(frame, [240, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const images = Array.from({ length: TOTAL_IMAGES }, (_, i) => i);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Floating product images: frames 0-300, fade out with everything else */}
      <AbsoluteFill style={{ opacity: fadeOutOuter }}>
        {images.map((i) => (
          <FloatingImage
            key={i}
            index={i}
            total={TOTAL_IMAGES}
            centerX={CENTER_X}
            centerY={CENTER_Y}
            radius={ORBIT_RADIUS}
          />
        ))}
      </AbsoluteFill>

      {/* Coins explosion: frames 90-150 */}
      <AbsoluteFill style={{ opacity: fadeOutOuter }}>
        <CoinsExplosion
          startFrame={90}
          centerX={CENTER_X}
          centerY={CENTER_Y}
        />
      </AbsoluteFill>

      {/* SHANSI logo: frames 60+, holds until end */}
      <LogoReveal startFrame={60} />

      {/* Tagline: frames 120+, holds until end */}
      <TaglineReveal startFrame={120} />
    </AbsoluteFill>
  );
};
