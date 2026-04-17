import type { Server as IOServer } from "socket.io";

// ── Physics constants — MATCH BOT MODE exactly (both run at 60fps now) ──

const FIELD_W = 1.0;
const FIELD_H = 1.5;
const PUCK_RADIUS = 0.04;
const PADDLE_RADIUS = 0.065;
const CENTER_LINE = FIELD_H / 2;
const GOAL_WIDTH = 0.28;

const MAX_PUCK_SPEED = 0.04;
const FRICTION = 0.998;
const WALL_RESTITUTION = 0.85;
const PADDLE_RESTITUTION = 0.85;
const PADDLE_TRANSFER = 0.25;
const MIN_HIT_SPEED = 0.005;

const TICK_MS = 1000 / 60;     // 60fps — matches bot mode for reliable collision
const GOAL_PAUSE_FRAMES = 60;  // 1s at 60fps

// Broadcast every 3rd tick (20fps network) to save bandwidth.
// Collision still runs at 60fps but we only send state 20×/sec.
const BROADCAST_EVERY = 3;

const ROBOT_REACTION_SPEED = 0.04;
const ROBOT_MISS_RATE = 0.08;
const MAX_PADDLE_VEL = 0.5;    // clamp client-sent paddle velocity

// ── Types ──

export interface PuckState {
  x: number; y: number; vx: number; vy: number; r: number;
}

export interface PaddleState {
  x: number; y: number; r: number;
  prevX?: number; prevY?: number;
  // Client-sent velocity (clamped)
  clientVx?: number; clientVy?: number;
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
  tickCount: number; // for broadcast throttling
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
      vx: (Math.random() - 0.5) * 0.002,
      vy: (Math.random() > 0.5 ? 1 : -1) * 0.003,
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
  state.puck.vx = (Math.random() - 0.5) * 0.002;
  state.puck.vy = scoredOn === "bottom" ? 0.003 : -0.003;
}

// ── Wall bounce ──

function resolveWallBounce(puck: PuckState): void {
  if (puck.x - puck.r <= 0) {
    puck.x = puck.r;
    puck.vx = Math.abs(puck.vx) * WALL_RESTITUTION;
  } else if (puck.x + puck.r >= FIELD_W) {
    puck.x = FIELD_W - puck.r;
    puck.vx = -Math.abs(puck.vx) * WALL_RESTITUTION;
  }
  const goalLeft = (FIELD_W - GOAL_WIDTH) / 2;
  const goalRight = (FIELD_W + GOAL_WIDTH) / 2;
  const inGoal = puck.x > goalLeft && puck.x < goalRight;
  if (!inGoal) {
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
  if (puck.x <= goalLeft || puck.x >= goalRight) return null;
  if (puck.y - puck.r < 0) return "top";
  if (puck.y + puck.r > FIELD_H) return "bottom";
  return null;
}

// ── Paddle-puck collision with swept check ──

function resolvePaddleCollision(puck: PuckState, paddle: PaddleState): void {
  const minDist = puck.r + paddle.r;

  // Helper: try resolving collision at a specific paddle position
  const tryResolve = (px: number, py: number): boolean => {
    const dx = puck.x - px;
    const dy = puck.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= minDist || dist <= 0) return false;

    // Push out
    const nx = dx / dist;
    const ny = dy / dist;
    puck.x += nx * (minDist - dist);
    puck.y += ny * (minDist - dist);

    // Paddle velocity — prefer client-sent, fallback to server delta
    const pvx = paddle.clientVx ?? ((paddle.prevX !== undefined) ? (paddle.x - paddle.prevX) : 0);
    const pvy = paddle.clientVy ?? ((paddle.prevY !== undefined) ? (paddle.y - paddle.prevY) : 0);

    // Relative velocity along collision normal
    const relVN = (puck.vx - pvx) * nx + (puck.vy - pvy) * ny;
    if (relVN >= 0) return true; // already moving apart

    // Impulse
    puck.vx += -(1 + PADDLE_RESTITUTION) * relVN * nx;
    puck.vy += -(1 + PADDLE_RESTITUTION) * relVN * ny;

    // Paddle transfer
    puck.vx += pvx * PADDLE_TRANSFER;
    puck.vy += pvy * PADDLE_TRANSFER;

    // Clamp speed
    const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
    if (speed > MAX_PUCK_SPEED) {
      const s = MAX_PUCK_SPEED / speed;
      puck.vx *= s;
      puck.vy *= s;
    }

    // Min speed
    const ns = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
    if (ns > 0 && ns < MIN_HIT_SPEED) {
      const s = MIN_HIT_SPEED / ns;
      puck.vx *= s;
      puck.vy *= s;
    }

    return true;
  };

  // 1. Check current position
  if (tryResolve(paddle.x, paddle.y)) return;

  // 2. Swept check — midpoint between prev and current paddle position
  if (paddle.prevX !== undefined && paddle.prevY !== undefined) {
    const sweepDist = Math.sqrt(
      (paddle.x - paddle.prevX) ** 2 + (paddle.y - paddle.prevY) ** 2
    );
    if (sweepDist > 0.005) {
      const midX = (paddle.x + paddle.prevX) / 2;
      const midY = (paddle.y + paddle.prevY) / 2;
      tryResolve(midX, midY);
    }
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
      CENTER_LINE + PADDLE_RADIUS, FIELD_H - PADDLE_RADIUS
    );
  } else {
    targetY = clamp(
      puck.y < CENTER_LINE ? puck.y : 0.15,
      PADDLE_RADIUS, CENTER_LINE - PADDLE_RADIUS
    );
  }

  if (Math.random() < ROBOT_MISS_RATE) targetX += (Math.random() - 0.5) * 0.15;
  targetX = clamp(targetX, PADDLE_RADIUS, FIELD_W - PADDLE_RADIUS);

  const dx = clamp(targetX - paddle.x, -ROBOT_REACTION_SPEED, ROBOT_REACTION_SPEED);
  const dy = clamp(targetY - paddle.y, -ROBOT_REACTION_SPEED, ROBOT_REACTION_SPEED);

  paddle.prevX = paddle.x;
  paddle.prevY = paddle.y;
  paddle.x += dx;
  paddle.y += dy;
}

// ── Emit helper (compact) ──

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

// ── Main tick (runs at 60fps, broadcasts at 20fps) ──

function tick(
  roomId: string,
  io: IOServer,
  onGoal: (roomId: string, scorer: "bottom" | "top", score: { bottom: number; top: number }) => void,
  onGameOver: (roomId: string, winner: "bottom" | "top") => void
): void {
  const game = activeGames.get(roomId);
  if (!game) return;
  const { state } = game;
  game.tickCount++;

  const shouldBroadcast = game.tickCount % BROADCAST_EVERY === 0;

  // Goal pause countdown
  if (state.status === "goal") {
    state.goalPauseFrames--;
    if (state.goalPauseFrames <= 0) state.status = "playing";
    if (shouldBroadcast) emitState(io, roomId, state);
    return;
  }

  if (state.status === "finished") return;

  // Robot paddles
  for (const side of game.robotSides) updateRobotPaddle(state, side);

  // Puck physics (identical to bot mode)
  state.puck.vx *= FRICTION;
  state.puck.vy *= FRICTION;

  if (Math.sqrt(state.puck.vx ** 2 + state.puck.vy ** 2) < 0.0003) {
    state.puck.vx = 0;
    state.puck.vy = 0;
  }

  state.puck.x += state.puck.vx;
  state.puck.y += state.puck.vy;

  resolveWallBounce(state.puck);
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
    emitState(io, roomId, state); // always broadcast on goal
    return;
  }

  if (shouldBroadcast) emitState(io, roomId, state);
}

// ── Public API ──

export function startGameLoop(
  roomId: string,
  goalTarget: number,
  io: IOServer,
  onGoal: (roomId: string, scorer: "bottom" | "top", score: { bottom: number; top: number }) => void,
  onGameOver: (roomId: string, winner: "bottom" | "top") => void
): void {
  if (activeGames.has(roomId)) {
    console.warn(`[startGameLoop] loop already running for ${roomId} — skipping`);
    return;
  }
  const state = createInitialState(goalTarget);
  const game: ActiveGame = {
    interval: setInterval(() => tick(roomId, io, onGoal, onGameOver), TICK_MS),
    state,
    robotSides: new Set(),
    tickCount: 0,
  };
  activeGames.set(roomId, game);
}

export function updatePaddle(
  roomId: string,
  side: "bottom" | "top",
  x: number,
  y: number,
  vx?: number,
  vy?: number
): void {
  const game = activeGames.get(roomId);
  if (!game) return;
  const paddle = game.state.paddles[side];

  paddle.prevX = paddle.x;
  paddle.prevY = paddle.y;

  paddle.x = clamp(x, PADDLE_RADIUS, FIELD_W - PADDLE_RADIUS);
  paddle.y = side === "bottom"
    ? clamp(y, CENTER_LINE + PADDLE_RADIUS, FIELD_H - PADDLE_RADIUS)
    : clamp(y, PADDLE_RADIUS, CENTER_LINE - PADDLE_RADIUS);

  // Use client-sent velocity if provided (clamped for anti-cheat)
  if (vx !== undefined && vy !== undefined) {
    paddle.clientVx = clamp(vx, -MAX_PADDLE_VEL, MAX_PADDLE_VEL);
    paddle.clientVy = clamp(vy, -MAX_PADDLE_VEL, MAX_PADDLE_VEL);
  }
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
