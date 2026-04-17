import type { Server as IOServer } from "socket.io";

// ── Physics constants ──
// Kept in sync with src/shared/gameConstants.ts (can't import directly
// because this is the backend CJS build — values are duplicated here).
const FIELD_W = 1.0;
const FIELD_H = 1.5;
const PUCK_RADIUS = 0.04;
const PADDLE_RADIUS = 0.065;
const CENTER_LINE = FIELD_H / 2; // 0.75
const GOAL_WIDTH = 0.28;
// Velocities are PER-TICK at 20fps. Bot mode runs at 60fps with
// per-frame velocities ~3× smaller. These are calibrated so the puck
// feels the same speed as bot mode to the player.
const MAX_PUCK_SPEED = 0.12;   // bot is 0.06 at 60fps → ×2 for 20fps
const FRICTION = 0.985;        // stronger per-tick friction (fewer ticks = less decay otherwise)
const WALL_RESTITUTION = 0.85;
const PADDLE_RESTITUTION = 0.7;
const PADDLE_TRANSFER = 0.4;   // gentler transfer — was 0.7 causing rocket launches
const MIN_HIT_SPEED = 0.015;   // bot is 0.005-ish

const TICK_MS = 1000 / 20; // 20fps server tick
const GOAL_PAUSE_FRAMES = 40; // ~2s at 20fps

// Robot AI
const ROBOT_REACTION_SPEED = 0.04;
const ROBOT_MISS_RATE = 0.08;

// ── Types ──

export interface PuckState {
  x: number; y: number; vx: number; vy: number; r: number;
}

export interface PaddleState {
  x: number; y: number; r: number;
  prevX?: number; prevY?: number;
}

export interface ServerGameState {
  puck: PuckState;
  paddles: { bottom: PaddleState; top: PaddleState };
  score: { bottom: number; top: number };
  goalTarget: number;
  status: "playing" | "goal" | "finished";
  winner: "bottom" | "top" | null;
  goalPauseFrames: number;
}

interface ActiveGame {
  interval: ReturnType<typeof setInterval>;
  state: ServerGameState;
  robotSides: Set<"bottom" | "top">;
}

export const activeGames: Map<string, ActiveGame> = new Map();

// ── Helpers ──

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function createInitialState(goalTarget: number): ServerGameState {
  return {
    puck: {
      x: FIELD_W / 2,
      y: FIELD_H / 2,
      vx: (Math.random() - 0.5) * 0.01,
      vy: (Math.random() > 0.5 ? 1 : -1) * 0.012,
      r: PUCK_RADIUS,
    },
    paddles: {
      bottom: { x: FIELD_W / 2, y: FIELD_H - 0.12, r: PADDLE_RADIUS },
      top: { x: FIELD_W / 2, y: 0.12, r: PADDLE_RADIUS },
    },
    score: { bottom: 0, top: 0 },
    goalTarget,
    status: "playing",
    winner: null,
    goalPauseFrames: 0,
  };
}

function resetPuckAfterGoal(state: ServerGameState, scoredOn: "bottom" | "top"): void {
  state.puck.x = FIELD_W / 2;
  state.puck.y = FIELD_H / 2;
  state.puck.vx = (Math.random() - 0.5) * 0.01;
  state.puck.vy = scoredOn === "bottom" ? 0.012 : -0.012;
}

// ── Wall bounce ──

function resolveWallBounce(puck: PuckState): void {
  // Left/right walls
  if (puck.x - puck.r <= 0) {
    puck.x = puck.r;
    puck.vx = Math.abs(puck.vx) * WALL_RESTITUTION;
  } else if (puck.x + puck.r >= FIELD_W) {
    puck.x = FIELD_W - puck.r;
    puck.vx = -Math.abs(puck.vx) * WALL_RESTITUTION;
  }

  // Top/bottom walls — exclude goal mouth
  const goalLeft = (FIELD_W - GOAL_WIDTH) / 2;
  const goalRight = (FIELD_W + GOAL_WIDTH) / 2;
  const inGoalMouth = puck.x > goalLeft && puck.x < goalRight;

  if (!inGoalMouth) {
    if (puck.y - puck.r <= 0) {
      puck.y = puck.r;
      puck.vy = Math.abs(puck.vy) * WALL_RESTITUTION;
    } else if (puck.y + puck.r >= FIELD_H) {
      puck.y = FIELD_H - puck.r;
      puck.vy = -Math.abs(puck.vy) * WALL_RESTITUTION;
    }
  }
}

// ── Goal detection ──

function checkGoal(puck: PuckState): "bottom" | "top" | null {
  const goalLeft = (FIELD_W - GOAL_WIDTH) / 2;
  const goalRight = (FIELD_W + GOAL_WIDTH) / 2;
  const inGoalMouth = puck.x > goalLeft && puck.x < goalRight;
  if (!inGoalMouth) return null;
  if (puck.y - puck.r < 0) return "top";     // scored on top's goal
  if (puck.y + puck.r > FIELD_H) return "bottom"; // scored on bottom's goal
  return null;
}

// ── Paddle-puck collision (proper circle-circle physics) ──

function resolvePaddleCollision(puck: PuckState, paddle: PaddleState): void {
  const dx = puck.x - paddle.x;
  const dy = puck.y - paddle.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = puck.r + paddle.r;

  if (dist >= minDist || dist <= 0) return;

  // 1. Push puck out of paddle
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  puck.x += nx * overlap;
  puck.y += ny * overlap;

  // 2. Get paddle velocity from tracked movement (per-tick delta, no scaling)
  const pvx = (paddle.prevX !== undefined) ? (paddle.x - paddle.prevX) : 0;
  const pvy = (paddle.prevY !== undefined) ? (paddle.y - paddle.prevY) : 0;

  // 3. Relative velocity along collision normal
  const relVx = puck.vx - pvx;
  const relVy = puck.vy - pvy;
  const relVN = relVx * nx + relVy * ny;

  // Only resolve if puck is moving toward paddle
  if (relVN >= 0) return;

  // 4. Elastic collision with restitution
  const impulse = -(1 + PADDLE_RESTITUTION) * relVN;
  puck.vx += impulse * nx;
  puck.vy += impulse * ny;

  // 5. Add paddle velocity (harder swing = faster puck)
  puck.vx += pvx * PADDLE_TRANSFER;
  puck.vy += pvy * PADDLE_TRANSFER;

  // 6. Clamp max speed
  const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
  if (speed > MAX_PUCK_SPEED) {
    const s = MAX_PUCK_SPEED / speed;
    puck.vx *= s;
    puck.vy *= s;
  }

  // 7. Minimum speed after hit
  const newSpeed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
  if (newSpeed < MIN_HIT_SPEED && newSpeed > 0) {
    const s = MIN_HIT_SPEED / newSpeed;
    puck.vx *= s;
    puck.vy *= s;
  }
}

// ── Robot AI ──

function updateRobotPaddle(state: ServerGameState, side: "bottom" | "top"): void {
  const paddle = state.paddles[side];
  const puck = state.puck;

  let targetX = puck.x;
  let targetY: number;

  if (side === "bottom") {
    targetY = clamp(
      puck.y > CENTER_LINE ? puck.y : FIELD_H - 0.15,
      CENTER_LINE + PADDLE_RADIUS,
      FIELD_H - PADDLE_RADIUS
    );
  } else {
    targetY = clamp(
      puck.y < CENTER_LINE ? puck.y : 0.15,
      PADDLE_RADIUS,
      CENTER_LINE - PADDLE_RADIUS
    );
  }

  if (Math.random() < ROBOT_MISS_RATE) {
    targetX += (Math.random() - 0.5) * 0.15;
  }
  targetX = clamp(targetX, PADDLE_RADIUS, FIELD_W - PADDLE_RADIUS);

  const dx = clamp(targetX - paddle.x, -ROBOT_REACTION_SPEED, ROBOT_REACTION_SPEED);
  const dy = clamp(targetY - paddle.y, -ROBOT_REACTION_SPEED, ROBOT_REACTION_SPEED);

  paddle.prevX = paddle.x;
  paddle.prevY = paddle.y;
  paddle.x += dx;
  paddle.y += dy;
}

// ── Emit helper ──

function emitState(io: IOServer, roomId: string, state: ServerGameState): void {
  const st = (state.status as string) === "playing" ? 1
    : (state.status as string) === "goal" ? 2
    : (state.status as string) === "finished" ? 3 : 0;
  const w = (state.winner as string) === "bottom" ? 1
    : (state.winner as string) === "top" ? 2 : 0;

  io.to(roomId).emit("gs", {
    p: [state.puck.x, state.puck.y, state.puck.vx, state.puck.vy],
    b: [state.paddles.bottom.x, state.paddles.bottom.y],
    t: [state.paddles.top.x, state.paddles.top.y],
    s: [state.score.bottom, state.score.top],
    st, w,
  });
}

// ── Main tick ──

function tick(
  roomId: string,
  io: IOServer,
  onGoal: (roomId: string, scorer: "bottom" | "top", score: { bottom: number; top: number }) => void,
  onGameOver: (roomId: string, winner: "bottom" | "top") => void
): void {
  const game = activeGames.get(roomId);
  if (!game) return;
  const { state } = game;

  // Goal pause countdown
  if (state.status === "goal") {
    state.goalPauseFrames--;
    if (state.goalPauseFrames <= 0) state.status = "playing";
    emitState(io, roomId, state);
    return;
  }

  if (state.status === "finished") return;

  // Robot paddles
  for (const side of game.robotSides) updateRobotPaddle(state, side);

  // Puck physics
  state.puck.vx *= FRICTION;
  state.puck.vy *= FRICTION;

  // Stop micro-movements
  if (Math.sqrt(state.puck.vx * state.puck.vx + state.puck.vy * state.puck.vy) < 0.001) {
    state.puck.vx = 0;
    state.puck.vy = 0;
  }

  state.puck.x += state.puck.vx;
  state.puck.y += state.puck.vy;

  // Walls
  resolveWallBounce(state.puck);

  // Paddle collisions
  resolvePaddleCollision(state.puck, state.paddles.bottom);
  resolvePaddleCollision(state.puck, state.paddles.top);

  // Goals
  const goalScoredOn = checkGoal(state.puck);
  if (goalScoredOn) {
    const scorer: "bottom" | "top" = goalScoredOn === "bottom" ? "top" : "bottom";
    state.score[scorer]++;

    if (state.score[scorer] >= state.goalTarget) {
      state.status = "finished";
      state.winner = scorer;
      emitState(io, roomId, state);
      onGameOver(roomId, scorer);
      return;
    }

    state.status = "goal";
    state.goalPauseFrames = GOAL_PAUSE_FRAMES;
    resetPuckAfterGoal(state, goalScoredOn);
    onGoal(roomId, scorer, { ...state.score });
  }

  emitState(io, roomId, state);
}

// ── Public API ──

export function startGameLoop(
  roomId: string,
  goalTarget: number,
  io: IOServer,
  onGoal: (roomId: string, scorer: "bottom" | "top", score: { bottom: number; top: number }) => void,
  onGameOver: (roomId: string, winner: "bottom" | "top") => void
): void {
  // Guard: never start two loops for the same room
  if (activeGames.has(roomId)) {
    console.warn(`[startGameLoop] loop already running for ${roomId} — skipping`);
    return;
  }
  const state = createInitialState(goalTarget);
  const game: ActiveGame = {
    interval: setInterval(() => tick(roomId, io, onGoal, onGameOver), TICK_MS),
    state,
    robotSides: new Set(),
  };
  activeGames.set(roomId, game);
}

export function updatePaddle(
  roomId: string,
  side: "bottom" | "top",
  x: number,
  y: number
): void {
  const game = activeGames.get(roomId);
  if (!game) return;
  const paddle = game.state.paddles[side];

  paddle.prevX = paddle.x;
  paddle.prevY = paddle.y;

  // Clamp to own half strictly
  const clampedX = clamp(x, PADDLE_RADIUS, FIELD_W - PADDLE_RADIUS);
  const clampedY = side === "bottom"
    ? clamp(y, CENTER_LINE + PADDLE_RADIUS, FIELD_H - PADDLE_RADIUS)
    : clamp(y, PADDLE_RADIUS, CENTER_LINE - PADDLE_RADIUS);

  paddle.x = clampedX;
  paddle.y = clampedY;
}

export function setRobotPlayer(roomId: string, side: "bottom" | "top"): void {
  const game = activeGames.get(roomId);
  if (game) game.robotSides.add(side);
}

export function clearRobotPlayer(roomId: string, side: "bottom" | "top"): void {
  const game = activeGames.get(roomId);
  if (game) game.robotSides.delete(side);
}

export function stopGameLoop(roomId: string): void {
  const game = activeGames.get(roomId);
  if (game) {
    clearInterval(game.interval);
    activeGames.delete(roomId);
  }
}

export function getGameState(roomId: string): ServerGameState | null {
  return activeGames.get(roomId)?.state ?? null;
}
