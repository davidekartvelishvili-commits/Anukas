/**
 * Air Hockey Physics Engine
 *
 * Pure TypeScript game logic module — no React, no DOM.
 * All coordinates are normalized: width = 1.0, height = FIELD_H (1.6 for portrait).
 * The canvas renderer scales these to pixel space.
 */

// ─── Field Dimensions (portrait mode) ─────────────────────────────────────────

/** Normalized field width */
export const FIELD_W = 1.0;

/** Normalized field height (portrait — taller than wide) */
export const FIELD_H = 1.6;

// ─── Physics Constants ─────────────────────────────────────────────────────────

/** Puck friction multiplier applied every frame (1 = no friction) */
const PUCK_FRICTION = 0.998;

/** Maximum puck speed (normalized units per frame) */
const PUCK_MAX_SPEED = 0.025;

/** Minimum speed below which puck is considered stopped */
const PUCK_MIN_SPEED = 0.0003;

/** Wall bounce coefficient of restitution */
const WALL_RESTITUTION = 0.85;

/** Puck radius */
const PUCK_RADIUS = 0.025;

/** Paddle radius */
const PADDLE_RADIUS = 0.045;

/** Goal width (centered on each short edge) */
const GOAL_WIDTH = 0.30;

/** How much paddle velocity transfers to puck on hit (0–1) */
const PADDLE_INFLUENCE = 0.6;

/** Collision push-apart factor to prevent overlap */
const COLLISION_PUSH = 1.01;

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface Puck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export interface Paddle {
  x: number;
  y: number;
  r: number;
  /** Previous frame positions — used to derive paddle velocity */
  prevX?: number;
  prevY?: number;
}

export interface Score {
  player: number;
  opponent: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Status = 'ready' | 'playing' | 'goal' | 'finished';
export type Winner = 'player' | 'opponent' | null;

export interface GameState {
  puck: Puck;
  player: Paddle;
  opponent: Paddle;
  score: Score;
  goalTarget: number;
  status: Status;
  winner: Winner;
  robotDifficulty: Difficulty;
  /** Internal: frames remaining in goal pause */
  _goalPauseFrames: number;
  /** Internal: who scored the last goal (puck resets toward them) */
  _lastScoredOn: 'player' | 'opponent' | null;
}

// ─── Goal Zone Helpers ─────────────────────────────────────────────────────────

/** Left edge of goal zone (centered on field width) */
const goalLeft = (): number => (FIELD_W - GOAL_WIDTH) / 2;

/** Right edge of goal zone */
const goalRight = (): number => (FIELD_W + GOAL_WIDTH) / 2;

/** Check if an x-position is within the goal zone */
function inGoalZone(x: number): boolean {
  return x >= goalLeft() && x <= goalRight();
}

// ─── State Factory ─────────────────────────────────────────────────────────────

/**
 * Create the initial game state.
 * @param goalTarget — points needed to win (5, 10, 15, or 20)
 * @param difficulty — robot AI difficulty
 */
export function createInitialState(
  goalTarget: number,
  difficulty: Difficulty
): GameState {
  return {
    puck: {
      x: FIELD_W / 2,
      y: FIELD_H / 2,
      // Small random initial velocity so the puck isn't dead at start —
      // drifts toward the player's half for a natural "your serve" feel.
      vx: (Math.random() - 0.5) * 0.003,
      vy: 0.004 + Math.random() * 0.002,
      r: PUCK_RADIUS,
    },
    player: {
      x: FIELD_W / 2,
      y: FIELD_H * 0.82,
      r: PADDLE_RADIUS,
    },
    opponent: {
      x: FIELD_W / 2,
      y: FIELD_H * 0.18,
      r: PADDLE_RADIUS,
    },
    score: { player: 0, opponent: 0 },
    goalTarget,
    status: 'ready',
    winner: null,
    robotDifficulty: difficulty,
    _goalPauseFrames: 0,
    _lastScoredOn: null,
  };
}

// ─── Vector Helpers ────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function magnitude(vx: number, vy: number): number {
  return Math.sqrt(vx * vx + vy * vy);
}

function limitSpeed(vx: number, vy: number, max: number): { vx: number; vy: number } {
  const speed = magnitude(vx, vy);
  if (speed > max) {
    const scale = max / speed;
    return { vx: vx * scale, vy: vy * scale };
  }
  return { vx, vy };
}

// ─── Collision Detection & Response ────────────────────────────────────────────

/**
 * Resolve a circle–circle collision between the puck and a paddle.
 * Returns a new puck with updated position and velocity.
 */
function resolvePaddleCollision(puck: Puck, paddle: Paddle): Puck {
  const dx = puck.x - paddle.x;
  const dy = puck.y - paddle.y;
  const dist = magnitude(dx, dy);
  const minDist = puck.r + paddle.r;

  if (dist >= minDist || dist === 0) return puck;

  // Normal vector from paddle center to puck center
  const nx = dx / dist;
  const ny = dy / dist;

  // Separate the puck so it no longer overlaps
  const overlap = minDist - dist;
  const newX = puck.x + nx * overlap * COLLISION_PUSH;
  const newY = puck.y + ny * overlap * COLLISION_PUSH;

  // Reflect puck velocity along collision normal
  const dotVn = puck.vx * nx + puck.vy * ny;

  // Only collide if puck is moving toward the paddle
  if (dotVn >= 0) {
    return { ...puck, x: newX, y: newY };
  }

  let newVx = puck.vx - 2 * dotVn * nx;
  let newVy = puck.vy - 2 * dotVn * ny;

  // Add paddle velocity influence
  const pvx = (paddle.prevX !== undefined) ? (paddle.x - paddle.prevX) : 0;
  const pvy = (paddle.prevY !== undefined) ? (paddle.y - paddle.prevY) : 0;

  newVx += pvx * PADDLE_INFLUENCE;
  newVy += pvy * PADDLE_INFLUENCE;

  // Enforce max speed
  const clamped = limitSpeed(newVx, newVy, PUCK_MAX_SPEED);

  return {
    ...puck,
    x: newX,
    y: newY,
    vx: clamped.vx,
    vy: clamped.vy,
  };
}

// ─── Wall Bouncing ─────────────────────────────────────────────────────────────

/**
 * Bounce the puck off side walls. Does NOT handle top/bottom (those are goals).
 */
function bounceWalls(puck: Puck): Puck {
  let { x, y, vx, vy } = puck;

  // Left wall
  if (x - puck.r < 0) {
    x = puck.r;
    vx = Math.abs(vx) * WALL_RESTITUTION;
  }

  // Right wall
  if (x + puck.r > FIELD_W) {
    x = FIELD_W - puck.r;
    vx = -Math.abs(vx) * WALL_RESTITUTION;
  }

  // Top wall (only outside goal zone)
  if (y - puck.r < 0 && !inGoalZone(x)) {
    y = puck.r;
    vy = Math.abs(vy) * WALL_RESTITUTION;
  }

  // Bottom wall (only outside goal zone)
  if (y + puck.r > FIELD_H && !inGoalZone(x)) {
    y = FIELD_H - puck.r;
    vy = -Math.abs(vy) * WALL_RESTITUTION;
  }

  return { ...puck, x, y, vx, vy };
}

// ─── Goal Detection ────────────────────────────────────────────────────────────

/**
 * Check if a goal was scored. Returns 'player' or 'opponent' if the
 * respective side was scored on, or null if no goal.
 */
function detectGoal(puck: Puck): 'player' | 'opponent' | null {
  // Puck crossed top edge inside goal zone → player scores
  if (puck.y - puck.r <= 0 && inGoalZone(puck.x)) {
    return 'opponent'; // opponent was scored on
  }

  // Puck crossed bottom edge inside goal zone → opponent scores
  if (puck.y + puck.r >= FIELD_H && inGoalZone(puck.x)) {
    return 'player'; // player was scored on
  }

  return null;
}

// ─── Robot AI ──────────────────────────────────────────────────────────────────

interface RobotConfig {
  /** How fast the paddle moves toward its target each frame */
  reactionSpeed: number;
  /** Chance (0–1) of intentionally missing per decision cycle */
  missRate: number;
  /** Whether the AI predicts puck trajectory */
  predictive: boolean;
  /** Maximum y the opponent paddle can reach (fraction of FIELD_H) */
  maxY: number;
  /** Random offset applied to target x (sloppiness) */
  jitter: number;
}

const ROBOT_CONFIGS: Record<Difficulty, RobotConfig> = {
  easy: {
    reactionSpeed: 0.02,
    missRate: 0.20,
    jitter: 0.08,
    predictive: false,
    maxY: FIELD_H * 0.48, // stays well in own half
  },
  medium: {
    reactionSpeed: 0.04,
    missRate: 0.08,
    jitter: 0.03,
    predictive: false,
    maxY: FIELD_H * 0.55, // occasionally crosses midline
  },
  hard: {
    reactionSpeed: 0.07,
    missRate: 0.02,
    jitter: 0.01,
    predictive: true,
    maxY: FIELD_H * 0.58, // aggressive
  },
};

/** Seed-free deterministic-ish pseudo-random using sin */
let _robotSeed = 0;
function robotRandom(): number {
  _robotSeed++;
  return Math.abs(Math.sin(_robotSeed * 9301 + 49297) % 1);
}

/**
 * Predict where the puck will intersect a given y-line, bouncing off side walls.
 * Returns the predicted x-coordinate.
 */
function predictPuckX(puck: Puck, targetY: number): number {
  if (puck.vy >= 0) {
    // Puck moving away from opponent — just return puck x
    return puck.x;
  }

  let simX = puck.x;
  let simY = puck.y;
  let simVx = puck.vx;
  let simVy = puck.vy;

  // Simple simulation with a step limit to avoid infinite loops
  for (let i = 0; i < 300; i++) {
    simX += simVx;
    simY += simVy;

    // Side wall bounces
    if (simX - PUCK_RADIUS < 0) {
      simX = PUCK_RADIUS;
      simVx = -simVx;
    } else if (simX + PUCK_RADIUS > FIELD_W) {
      simX = FIELD_W - PUCK_RADIUS;
      simVx = -simVx;
    }

    if (simY <= targetY) {
      return clamp(simX, PADDLE_RADIUS, FIELD_W - PADDLE_RADIUS);
    }
  }

  return simX;
}

/**
 * Compute the robot paddle's target position and smoothly move toward it.
 * Returns updated opponent paddle.
 */
function updateRobot(state: GameState): Paddle {
  const config = ROBOT_CONFIGS[state.robotDifficulty];
  const { puck, opponent } = state;

  // Determine target x
  let targetX: number;
  let targetY: number;

  const puckComingToward = puck.vy < 0; // moving upward toward opponent

  if (puckComingToward) {
    if (config.predictive) {
      targetX = predictPuckX(puck, opponent.y);
    } else {
      targetX = puck.x;
    }

    // Apply jitter (sloppiness)
    targetX += (robotRandom() - 0.5) * config.jitter;

    // Intentional miss — probability scales with difficulty
    if (robotRandom() < config.missRate) {
      // Offset target to miss
      targetX += (robotRandom() > 0.5 ? 1 : -1) * GOAL_WIDTH * 0.4;
    }

    // Move toward puck y, but stay in own zone
    targetY = Math.min(puck.y - PADDLE_RADIUS, config.maxY);
  } else {
    // Puck moving away — return to defensive center
    targetX = FIELD_W / 2 + (robotRandom() - 0.5) * 0.05;
    targetY = FIELD_H * 0.15;
  }

  // Clamp targets to valid range
  targetX = clamp(targetX, opponent.r, FIELD_W - opponent.r);
  targetY = clamp(targetY, opponent.r, config.maxY);

  // Smoothly move toward target
  const dx = targetX - opponent.x;
  const dy = targetY - opponent.y;

  const newX = opponent.x + dx * config.reactionSpeed * 2;
  const newY = opponent.y + dy * config.reactionSpeed * 2;

  return {
    ...opponent,
    prevX: opponent.x,
    prevY: opponent.y,
    x: clamp(newX, opponent.r, FIELD_W - opponent.r),
    y: clamp(newY, opponent.r, config.maxY),
  };
}

// ─── Paddle Constraint ─────────────────────────────────────────────────────────

/** Constrain player paddle to bottom half and within field bounds */
function constrainPlayer(paddle: Paddle): Paddle {
  // Allow paddle to cross slightly past the center line so the player
  // can actually reach and strike a puck sitting on the center. The
  // paddle body (radius) extends past its center, so we let the center
  // go up to FIELD_H/2 - r so the paddle's edge touches center.
  return {
    ...paddle,
    x: clamp(paddle.x, paddle.r, FIELD_W - paddle.r),
    y: clamp(paddle.y, FIELD_H / 2 - paddle.r * 1.5, FIELD_H - paddle.r),
  };
}

/** Constrain opponent paddle to top half and within field bounds */
function constrainOpponent(paddle: Paddle): Paddle {
  const config = ROBOT_CONFIGS['hard']; // use widest range; robot logic self-constrains
  return {
    ...paddle,
    x: clamp(paddle.x, paddle.r, FIELD_W - paddle.r),
    y: clamp(paddle.y, paddle.r, FIELD_H / 2),
  };
}

// ─── Core Update ───────────────────────────────────────────────────────────────

/** Number of frames to pause after a goal (~60fps → 60 frames ≈ 1 second) */
const GOAL_PAUSE_FRAMES = 60;

/**
 * Advance the game state by one physics step.
 * Call this once per animation frame. The `dt` parameter is a time-step
 * multiplier (1.0 = normal speed). For fixed-step engines pass 1.
 *
 * @param state — current game state (treated as immutable)
 * @param dt — time step multiplier (typically 1.0)
 * @returns new game state
 */
export function updateGame(state: GameState, dt: number): GameState {
  // Don't update if game is finished or in ready state
  if (state.status === 'finished' || state.status === 'ready') {
    return state;
  }

  // Handle goal pause countdown
  if (state.status === 'goal') {
    if (state._goalPauseFrames > 0) {
      return { ...state, _goalPauseFrames: state._goalPauseFrames - 1 };
    }
    // Pause finished — reset
    return resetAfterGoal(state);
  }

  // --- Playing state ---

  let puck = { ...state.puck };

  // Apply velocity (scaled by dt)
  puck.x += puck.vx * dt;
  puck.y += puck.vy * dt;

  // Apply friction
  puck.vx *= PUCK_FRICTION;
  puck.vy *= PUCK_FRICTION;

  // Kill very small velocities
  if (magnitude(puck.vx, puck.vy) < PUCK_MIN_SPEED) {
    puck.vx = 0;
    puck.vy = 0;
  }

  // Enforce max speed
  const clamped = limitSpeed(puck.vx, puck.vy, PUCK_MAX_SPEED);
  puck.vx = clamped.vx;
  puck.vy = clamped.vy;

  // Check goal BEFORE wall bounce (so puck can enter goal zone)
  const scoredOn = detectGoal(puck);

  if (scoredOn) {
    const newScore = { ...state.score };
    if (scoredOn === 'opponent') {
      // Opponent was scored on → player gets a point
      newScore.player += 1;
    } else {
      // Player was scored on → opponent gets a point
      newScore.opponent += 1;
    }

    // Check for game over
    const isFinished =
      newScore.player >= state.goalTarget || newScore.opponent >= state.goalTarget;

    return {
      ...state,
      puck: {
        ...puck,
        // Stop puck in place during goal animation
        vx: 0,
        vy: 0,
      },
      score: newScore,
      status: isFinished ? 'finished' : 'goal',
      winner: isFinished
        ? newScore.player >= state.goalTarget
          ? 'player'
          : 'opponent'
        : null,
      _goalPauseFrames: GOAL_PAUSE_FRAMES,
      _lastScoredOn: scoredOn,
    };
  }

  // Wall bouncing (side walls + non-goal top/bottom)
  puck = bounceWalls(puck);

  // Paddle collisions
  puck = resolvePaddleCollision(puck, state.player);
  puck = resolvePaddleCollision(puck, state.opponent);

  // Update robot AI
  const opponent = updateRobot({ ...state, puck });

  return {
    ...state,
    puck,
    opponent,
    status: 'playing',
  };
}

// ─── Player Input ──────────────────────────────────────────────────────────────

/**
 * Move the human player's paddle to a given position (in normalized coords).
 * The position is clamped to the player's valid zone (bottom half).
 *
 * @param state — current game state
 * @param x — target x in normalized coords (0–1)
 * @param y — target y in normalized coords (0–FIELD_H)
 * @returns new game state with updated player paddle
 */
export function movePlayer(state: GameState, x: number, y: number): GameState {
  const player: Paddle = {
    ...state.player,
    prevX: state.player.x,
    prevY: state.player.y,
    x,
    y,
  };

  const constrained = constrainPlayer(player);

  // Auto-start the game on first touch
  const status = state.status === 'ready' ? 'playing' : state.status;

  return { ...state, player: constrained, status };
}

// ─── Post-Goal Reset ───────────────────────────────────────────────────────────

/**
 * Reset the puck to center after a goal, giving initial velocity toward
 * the player who was scored on (so they get "possession").
 *
 * @param state — current game state (should be in 'goal' status with timer expired)
 * @returns new game state in 'playing' status
 */
export function resetAfterGoal(state: GameState): GameState {
  const scoredOn = state._lastScoredOn;

  // Small initial velocity toward the scored-on player
  const vy = scoredOn === 'player' ? 0.005 : -0.005;

  return {
    ...state,
    puck: {
      x: FIELD_W / 2,
      y: FIELD_H / 2,
      vx: (Math.random() - 0.5) * 0.003, // slight random horizontal drift
      vy,
      r: PUCK_RADIUS,
    },
    player: {
      x: FIELD_W / 2,
      y: FIELD_H * 0.82,
      r: PADDLE_RADIUS,
    },
    opponent: {
      x: FIELD_W / 2,
      y: FIELD_H * 0.18,
      r: PADDLE_RADIUS,
    },
    status: 'playing',
    _goalPauseFrames: 0,
    _lastScoredOn: null,
  };
}
