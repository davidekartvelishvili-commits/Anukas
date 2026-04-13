import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const PLACEHOLDER_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];

interface FloatingImageProps {
  index: number;
  total: number;
  centerX: number;
  centerY: number;
  radius: number;
}

export const FloatingImage: React.FC<FloatingImageProps> = ({
  index,
  total,
  centerX,
  centerY,
  radius,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const angle = (index / total) * Math.PI * 2;
  const targetX = centerX + radius * Math.cos(angle);
  const targetY = centerY + radius * Math.sin(angle);

  const entryProgress = spring({
    frame,
    fps,
    config: { stiffness: 40, damping: 14 },
    delay: index * 5,
  });

  const startAngle = angle + Math.PI;
  const startX = centerX + 900 * Math.cos(startAngle);
  const startY = centerY + 900 * Math.sin(startAngle);

  const x = startX + (targetX - startX) * entryProgress;
  const y = startY + (targetY - startY) * entryProgress;

  const floatY = Math.sin(frame / 20 + index) * 15;
  const rotation = Math.sin(frame / 30 + index * 2) * 8;

  const color = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];

  return (
    <div
      style={{
        position: "absolute",
        left: x - 65,
        top: y - 65 + floatY,
        width: 130,
        height: 130,
        borderRadius: 24,
        background: color,
        transform: `rotate(${rotation}deg)`,
        boxShadow: `0 8px 32px ${color}44`,
      }}
    />
  );
};
