import type { Server as IOServer } from "socket.io";

// ── Physics constants (match Phase 1 client engine) ──

const FIELD_W = 1.0;
const FIELD_H = 1.6;
const PUCK_RADIUS = 0.025;
const PADDLE_RADIUS = 0.045;
const PUCK_FRICTION = 0.997;
const PUCK_MAX_SPEED = 0.06;
const WALL_RESTITUTION = 0.85;
const PADDLE_INFLUENCE = 1.4;
const GOAL_WIDTH = 0.22;
// 20fps server tick — keeps network lean while still feeling responsive.
// Client does local paddle prediction at 60fps for instant feel.
const TICK_MS = 1000 / 20;

// Robot AI (medium difficulty)
const ROBOT_REACTION_SPEED = 0.04;
const ROBOT_MISS_RATE = 0.08;

// ── Types ──

export interface PuckState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export interface PaddleState {
  x: number;
  y: number;
  r: number;
  prevX?: number;
  prevY?: number;
}

export interface ServerGameState {
  puck: PuckState;
  paddles: {
    bottom: PaddleState;
    top: PaddleState;
  };
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

// ── Active games store ──

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
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() > 0.5 ? 1 : -1) * 0.01,
      r: PUCK_RADIUS,
    },
    paddles: {
      bottom: { x: FIELD_W / 2, y: FIELD_H - 0.1, r: PADDLE_RADIUS },
      top: { x: FIELD_W / 2, y: 0.1, r: PADDLE_RADIUS },
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
  // Launch toward the side that was scored on (they get possession)
  state.puck.vx = (Math.random() - 0.5) * 0.02;
  state.puck.vy = scoredOn === "bottom" ? 0.01 : -0.01;
}

function resolveWallBounce(puck: PuckState): void {
  // Left/right walls
  if (puck.x - puck.r < 0) {
    puck.x = puck.r;
    puck.vx = Math.abs(puck.vx) * WALL_RESTITUTION;
  } else if (puck.x + puck.r > FIELD_W) {
    puck.x = FIELD_W - puck.r;
    puck.vx = -Math.abs(puck.vx) * WALL_RESTITUTION;
  }

  // Top/bottom walls (excluding goal mouth)
  const goalLeft = (FIELD_W - GOAL_WIDTH) / 2;
  const goalRight = (FIELD_W + GOAL_WIDTH) / 2;
  const inGoalMouth = puck.x > goalLeft && puck.x < goalRight;

  if (!inGoalMouth) {
    if (puck.y - puck.r < 0) {
      puck.y = puck.r;
      puck.vy = Math.abs(puck.vy) * WALL_RESTITUTION;
    } else if (puck.y + puck.r > FIELD_H) {
      puck.y = FIELD_H - puck.r;
      puck.vy = -Math.abs(puck.vy) * WALL_RESTITUTION;
    }
  }
}

function checkGoal(puck: PuckState): "bottom" | "top" | null {
  const goalLeft = (FIELD_W - GOAL_WIDTH) / 2;
  const goalRight = (FIELD_W + GOAL_WIDTH) / 2;
  const inGoalMouth = puck.x > goalLeft && puck.x < goalRight;

  if (inGoalMouth) {
    if (puck.y - puck.r < 0) return "top"; // Puck past top edge = bottom scored on top's goal
    if (puck.y + puck.r > FIELD_H) return "bottom"; // Puck past bottom edge = top scored on bottom's goal
  }
  return null;
}

function resolvePaddleCollision(puck: PuckState, paddle: PaddleState): void {
  const dx = puck.x - paddle.x;
  const dy = puck.y - paddle.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = puck.r + paddle.r;

  if (dist < minDist && dist > 0) {
    // Push puck out of paddle
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;
    puck.x += nx * overlap;
    puck.y += ny * overlap;

    // Reflect velocity
    const dotProduct = puck.vx * nx + puck.vy * ny;
    puck.vx -= 2 * dotProduct * nx;
    puck.vy -= 2 * dotProduct * ny;

    // Apply paddle influence (transfer paddle movement to puck)
    if (paddle.prevX !== undefined && paddle.prevY !== undefined) {
      const pdx = paddle.x - paddle.prevX;
      const pdy = paddle.y - paddle.prevY;
      puck.vx += pdx * PADDLE_INFLUENCE;
      puck.vy += pdy * PADDLE_INFLUENCE;
    }

    // Apply wall restitution
    puck.vx *= WALL_RESTITUTION;
    puck.vy *= WALL_RESTITUTION;
  }
}

function enforceMaxSpeed(puck: PuckState): void {
  const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
  if (speed > PUCK_MAX_SPEED) {
    const scale = PUCK_MAX_SPEED / speed;
    puck.vx *= scale;
    puck.vy *= scale;
  }
}

function updateRobotPaddle(
  state: ServerGameState,
  side: "bottom" | "top"
): void {
  const paddle = state.paddles[side];
  const puck = state.puck;

  // Target: track puck X, stay in own half Y
  let targetX = puck.x;
  let targetY: number;

  if (side === "bottom") {
    // Stay in bottom half
    targetY = clamp(puck.y > FIELD_H / 2 ? puck.y : FIELD_H - 0.15, FIELD_H / 2 + PADDLE_RADIUS, FIELD_H - PADDLE_RADIUS);
  } else {
    // Stay in top half
    targetY = clamp(puck.y < FIELD_H / 2 ? puck.y : 0.15, PADDLE_RADIUS, FIELD_H / 2 - PADDLE_RADIUS);
  }

  // Introduce miss rate: sometimes aim slightly off
  if (Math.random() < ROBOT_MISS_RATE) {
    targetX += (Math.random() - 0.5) * 0.15;
  }

  targetX = clamp(targetX, PADDLE_RADIUS, FIELD_W - PADDLE_RADIUS);

  // Move toward target at reaction speed
  const dx = targetX - paddle.x;
  const dy = targetY - paddle.y;
  const moveX = clamp(dx, -ROBOT_REACTION_SPEED, ROBOT_REACTION_SPEED);
  const moveY = clamp(dy, -ROBOT_REACTION_SPEED, ROBOT_REACTION_SPEED);

  paddle.prevX = paddle.x;
  paddle.prevY = paddle.y;
  paddle.x += moveX;
  paddle.y += moveY;
}

// ── Public API ──

export function startGameLoop(
  roomId: string,
  goalTarget: number,
  io: IOServer,
  onGoal: (roomId: string, scorer: "bottom" | "top", score: { bottom: number; top: number }) => void,
  onGameOver: (roomId: string, winner: "bottom" | "top") => void
): void {
  const state = createInitialState(goalTarget);

  const game: ActiveGame = {
    interval: setInterval(() => tick(roomId, io, onGoal, onGameOver), TICK_MS),
    state,
    robotSides: new Set(),
  };

  activeGames.set(roomId, game);
}

function tick(
  roomId: string,
  io: IOServer,
  onGoal: (roomId: string, scorer: "bottom" | "top", score: { bottom: number; top: number }) => void,
  onGameOver: (roomId: string, winner: "bottom" | "top") => void
): void {
  const game = activeGames.get(roomId);
  if (!game) return;

  const { state } = game;

  // If in goal pause, count down
  if (state.status === "goal") {
    state.goalPauseFrames--;
    if (state.goalPauseFrames <= 0) {
      state.status = "playing";
    }
    // Send minimal payload — only fields the client needs to render.
    // Avoids serializing the full state object every tick.
    io.to(roomId).emit("gs", {
      p: [state.puck.x, state.puck.y, state.puck.vx, state.puck.vy],
      b: [state.paddles.bottom.x, state.paddles.bottom.y],
      t: [state.paddles.top.x, state.paddles.top.y],
      s: [state.score.bottom, state.score.top],
      st: (state.status as string) === "playing" ? 1 : (state.status as string) === "goal" ? 2 : (state.status as string) === "finished" ? 3 : 0,
      w: (state.winner as string) === "bottom" ? 1 : (state.winner as string) === "top" ? 2 : 0,
    });
    return;
  }

  if (state.status === "finished") return;

  // Update robot paddles
  for (const side of game.robotSides) {
    updateRobotPaddle(state, side);
  }

  // Apply friction
  state.puck.vx *= PUCK_FRICTION;
  state.puck.vy *= PUCK_FRICTION;

  // Move puck
  state.puck.x += state.puck.vx;
  state.puck.y += state.puck.vy;

  // Wall bounces
  resolveWallBounce(state.puck);

  // Paddle collisions
  resolvePaddleCollision(state.puck, state.paddles.bottom);
  resolvePaddleCollision(state.puck, state.paddles.top);

  // Enforce max speed
  enforceMaxSpeed(state.puck);

  // Check goals
  const goalScoredOn = checkGoal(state.puck);
  if (goalScoredOn) {
    // "bottom" scored on means top player scored, and vice versa
    const scorer: "bottom" | "top" = goalScoredOn === "bottom" ? "top" : "bottom";
    state.score[scorer]++;

    if (state.score[scorer] >= state.goalTarget) {
      state.status = "finished";
      state.winner = scorer;
      // Send minimal payload — only fields the client needs to render.
    // Avoids serializing the full state object every tick.
    io.to(roomId).emit("gs", {
      p: [state.puck.x, state.puck.y, state.puck.vx, state.puck.vy],
      b: [state.paddles.bottom.x, state.paddles.bottom.y],
      t: [state.paddles.top.x, state.paddles.top.y],
      s: [state.score.bottom, state.score.top],
      st: (state.status as string) === "playing" ? 1 : (state.status as string) === "goal" ? 2 : (state.status as string) === "finished" ? 3 : 0,
      w: (state.winner as string) === "bottom" ? 1 : (state.winner as string) === "top" ? 2 : 0,
    });
      onGameOver(roomId, scorer);
      return;
    }

    state.status = "goal";
    state.goalPauseFrames = 60; // ~1 second pause
    resetPuckAfterGoal(state, goalScoredOn);
    onGoal(roomId, scorer, { ...state.score });
  }

  // Send minimal payload — only fields the client needs to render.
    // Avoids serializing the full state object every tick.
    io.to(roomId).emit("gs", {
      p: [state.puck.x, state.puck.y, state.puck.vx, state.puck.vy],
      b: [state.paddles.bottom.x, state.paddles.bottom.y],
      t: [state.paddles.top.x, state.paddles.top.y],
      s: [state.score.bottom, state.score.top],
      st: (state.status as string) === "playing" ? 1 : (state.status as string) === "goal" ? 2 : (state.status as string) === "finished" ? 3 : 0,
      w: (state.winner as string) === "bottom" ? 1 : (state.winner as string) === "top" ? 2 : 0,
    });
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

  // Store previous position for influence calculation
  paddle.prevX = paddle.x;
  paddle.prevY = paddle.y;

  // Clamp paddle to own half
  const clampedX = clamp(x, PADDLE_RADIUS, FIELD_W - PADDLE_RADIUS);
  let clampedY: number;
  if (side === "bottom") {
    clampedY = clamp(y, FIELD_H / 2 + PADDLE_RADIUS, FIELD_H - PADDLE_RADIUS);
  } else {
    clampedY = clamp(y, PADDLE_RADIUS, FIELD_H / 2 - PADDLE_RADIUS);
  }

  paddle.x = clampedX;
  paddle.y = clampedY;
}

export function setRobotPlayer(roomId: string, side: "bottom" | "top"): void {
  const game = activeGames.get(roomId);
  if (!game) return;
  game.robotSides.add(side);
}

export function clearRobotPlayer(roomId: string, side: "bottom" | "top"): void {
  const game = activeGames.get(roomId);
  if (!game) return;
  game.robotSides.delete(side);
}

export function stopGameLoop(roomId: string): void {
  const game = activeGames.get(roomId);
  if (!game) return;
  clearInterval(game.interval);
  activeGames.delete(roomId);
}

export function getGameState(roomId: string): ServerGameState | null {
  const game = activeGames.get(roomId);
  return game?.state ?? null;
}
