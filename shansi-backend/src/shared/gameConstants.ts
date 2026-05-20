// Air Hockey shared constants — server side.
// MUST stay in sync with the frontend file at:
//   <repo>/src/shared/gameConstants.ts
// If you change a value here, change it there too. Both client physics
// (single-player engine + canvas input clamping) and server physics
// (multiplayer game loop) must read identical numbers — otherwise the
// game feels different in vs Robot vs vs Player modes.

export const FIELD_W = 1.0;
export const FIELD_H = 1.5;
export const PUCK_RADIUS = 0.04;
export const PADDLE_RADIUS = 0.065;
export const CENTER_LINE = FIELD_H / 2; // 0.75
export const GOAL_WIDTH = 0.28;

export const MAX_PUCK_SPEED = 0.06;
export const FRICTION = 0.997;
export const WALL_RESTITUTION = 0.85;
export const PADDLE_RESTITUTION = 0.85;
export const PADDLE_TRANSFER = 0.4;
export const MIN_HIT_SPEED = 0.005;
