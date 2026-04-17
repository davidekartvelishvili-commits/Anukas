// Shared Air Hockey constants — imported by BOTH server (gameLoop.ts)
// and client (GameCanvas.tsx, page.tsx) so values never drift apart.

export const FIELD_W = 1.0;
export const FIELD_H = 1.5;
export const PUCK_RADIUS = 0.04;
export const PADDLE_RADIUS = 0.065;
export const CENTER_LINE = FIELD_H / 2; // 0.75
export const GOAL_WIDTH = 0.28;

// Physics — same as bot mode (both run at 60fps now)
export const MAX_PUCK_SPEED = 0.06;
export const FRICTION = 0.997;
export const WALL_RESTITUTION = 0.85;
export const PADDLE_RESTITUTION = 0.85;
export const PADDLE_TRANSFER = 0.4;
export const MIN_HIT_SPEED = 0.005;
