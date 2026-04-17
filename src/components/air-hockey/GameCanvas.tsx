"use client";

import React, { useRef, useEffect, useCallback } from "react";
import type { GameState } from "./AirHockeyEngine";

interface GameCanvasProps {
  gameState: GameState;
  onPlayerMove: (x: number, y: number) => void;
  width: number;
  height: number;
}

// ── Colors ──────────────────────────────────────────────────────────
const BG = "#0A0F1C";
const FIELD = "#141B2D";
const BORDER = "rgba(255,255,255,0.08)";
const CENTER_LINE = "rgba(255,255,255,0.06)";
const GOAL_ZONE = "rgba(255,229,0,0.12)";
const PUCK_COLOR = "#FFE500";
const PLAYER_COLOR = "#FFE500";
const OPPONENT_COLOR = "#EF4444";
const SCORE_COLOR = "#F1F5F9";
const WIN_COLOR = "#FFE500";
const LOSE_COLOR = "#EF4444";
const OVERLAY_BG = "rgba(0,0,0,0.7)";

// ── Dimensions (relative to canvas) ────────────────────────────────
const FIELD_PADDING = 8;
const CORNER_RADIUS = 16;
const GOAL_WIDTH_RATIO = 0.4;
const GOAL_HEIGHT = 12;
const CENTER_CIRCLE_RATIO = 0.15;
const PUCK_RADIUS_RATIO = 0.035;
const PADDLE_RADIUS_RATIO = 0.055;

// ── Goal animation state (module-level to survive re-renders) ──────
let goalFlashStart = 0;
let goalScoredBy: "player" | "opponent" | null = null;
let plusOneAnim: { startTime: number; x: number; y: number; label: string } | null = null;

export default function GameCanvas({
  gameState,
  onPlayerMove,
  width,
  height,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const prevStatusRef = useRef<string>(gameState.status);
  const lastScoreRef = useRef({ player: 0, opponent: 0 });
  // Cache score string so we only re-measure when it changes
  const scoreCacheRef = useRef<string>("");

  // ── Touch / mouse handling ──────────────────────────────────────
  // Finger offset: shift the paddle slightly UP from the touch point so
  // the user can see the paddle above their finger. ~5% of field height
  // in normalized coords — enough to be visible, not so much that aim
  // feels disconnected.
  const FINGER_OFFSET_Y = 0.05;

  const toNormalized = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const rawY = (clientY - rect.top) / rect.height;
      const y = rawY - FINGER_OFFSET_Y; // paddle sits above finger
      onPlayerMove(
        Math.max(0, Math.min(1, x)),
        Math.max(0, Math.min(1, y)) // engine's constrainPlayer clamps to valid zone
      );
    },
    [onPlayerMove]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) toNormalized(touch.clientX, touch.clientY);
    };
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) toNormalized(touch.clientX, touch.clientY);
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons === 0 && e.type === "mousemove") {
        // Allow free movement (no button required) for easier play
      }
      toNormalized(e.clientX, e.clientY);
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [toNormalized]);

  // ── Detect goal events ──────────────────────────────────────────
  useEffect(() => {
    const s = gameState;
    if (s.status === "goal" && prevStatusRef.current !== "goal") {
      goalFlashStart = performance.now();
      // Determine who scored by checking score change
      if (s.score.player > lastScoreRef.current.player) {
        goalScoredBy = "player";
        plusOneAnim = {
          startTime: performance.now(),
          x: 0.5,
          y: 0.08,
          label: "+1",
        };
      } else {
        goalScoredBy = "opponent";
        plusOneAnim = {
          startTime: performance.now(),
          x: 0.5,
          y: 0.92,
          label: "+1",
        };
      }
    }
    prevStatusRef.current = s.status;
    lastScoreRef.current = {
      player: s.score.player,
      opponent: s.score.opponent,
    };
  }, [gameState]);

  // ── Render loop ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up DPR scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const draw = (now: number) => {
      const w = width;
      const h = height;
      const state = gameState;

      // Field bounds
      const fx = FIELD_PADDING;
      const fy = FIELD_PADDING;
      const fw = w - FIELD_PADDING * 2;
      const fh = h - FIELD_PADDING * 2;

      // ── 1. Clear + app background ─────────────────────────────
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      // ── 2. Field background with rounded corners ──────────────
      roundRect(ctx, fx, fy, fw, fh, CORNER_RADIUS);
      ctx.fillStyle = FIELD;
      ctx.fill();

      // ── 3. Goal zones (top = opponent goal, bottom = player goal)
      const goalW = fw * GOAL_WIDTH_RATIO;
      const goalX = fx + (fw - goalW) / 2;

      // Flash logic
      const flashActive =
        goalFlashStart > 0 && now - goalFlashStart < 500;
      const flashAlpha = flashActive
        ? 0.3 * (1 - (now - goalFlashStart) / 500)
        : 0;

      // Top goal zone (opponent scores here = player's goal)
      ctx.fillStyle =
        flashActive && goalScoredBy === "opponent"
          ? `rgba(255,229,0,${0.12 + flashAlpha})`
          : GOAL_ZONE;
      roundRectPartial(ctx, goalX, fy, goalW, GOAL_HEIGHT, CORNER_RADIUS, true);
      ctx.fill();

      // Bottom goal zone (player scores here = opponent's goal)
      ctx.fillStyle =
        flashActive && goalScoredBy === "player"
          ? `rgba(255,229,0,${0.12 + flashAlpha})`
          : GOAL_ZONE;
      roundRectPartial(
        ctx,
        goalX,
        fy + fh - GOAL_HEIGHT,
        goalW,
        GOAL_HEIGHT,
        CORNER_RADIUS,
        false
      );
      ctx.fill();

      // ── 4. Center line (dashed) ───────────────────────────────
      ctx.strokeStyle = CENTER_LINE;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(fx, fy + fh / 2);
      ctx.lineTo(fx + fw, fy + fh / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── 5. Center circle ──────────────────────────────────────
      const ccr = fw * CENTER_CIRCLE_RATIO;
      ctx.strokeStyle = CENTER_LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(fx + fw / 2, fy + fh / 2, ccr, 0, Math.PI * 2);
      ctx.stroke();

      // ── 6. Field border ───────────────────────────────────────
      roundRect(ctx, fx, fy, fw, fh, CORNER_RADIUS);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── 7. Puck ───────────────────────────────────────────────
      const puckR = fw * PUCK_RADIUS_RATIO;
      const puckX = fx + state.puck.x * fw;
      const puckY = fy + state.puck.y * fh;
      ctx.fillStyle = PUCK_COLOR;
      ctx.beginPath();
      ctx.arc(puckX, puckY, puckR, 0, Math.PI * 2);
      ctx.fill();

      // ── 8. Paddles ────────────────────────────────────────────
      const paddleR = fw * PADDLE_RADIUS_RATIO;

      // Player paddle (bottom)
      const ppX = fx + state.player.x * fw;
      const ppY = fy + state.player.y * fh;
      ctx.fillStyle = PLAYER_COLOR;
      ctx.beginPath();
      ctx.arc(ppX, ppY, paddleR, 0, Math.PI * 2);
      ctx.fill();
      // White ring
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ppX, ppY, paddleR, 0, Math.PI * 2);
      ctx.stroke();

      // Opponent paddle (top)
      const opX = fx + state.opponent.x * fw;
      const opY = fy + state.opponent.y * fh;
      ctx.fillStyle = OPPONENT_COLOR;
      ctx.beginPath();
      ctx.arc(opX, opY, paddleR, 0, Math.PI * 2);
      ctx.fill();
      // Dark ring
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(opX, opY, paddleR, 0, Math.PI * 2);
      ctx.stroke();

      // ── 9. Score overlay (center) ─────────────────────────────
      const scoreStr = `${state.score.player} - ${state.score.opponent}`;
      if (scoreStr !== scoreCacheRef.current) {
        scoreCacheRef.current = scoreStr;
      }
      ctx.font = 'bold 28px "Outfit", sans-serif';
      ctx.fillStyle = SCORE_COLOR;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.7;
      ctx.fillText(scoreStr, fx + fw / 2, fy + fh / 2);
      ctx.globalAlpha = 1;

      // ── 10. "+1" floating animation ───────────────────────────
      if (plusOneAnim) {
        const elapsed = now - plusOneAnim.startTime;
        const duration = 800;
        if (elapsed < duration) {
          const progress = elapsed / duration;
          const yOffset = -30 * progress;
          const alpha = 1 - progress;
          ctx.globalAlpha = alpha;
          ctx.font = 'bold 22px "Outfit", sans-serif';
          ctx.fillStyle = PUCK_COLOR;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            plusOneAnim.label,
            fx + plusOneAnim.x * fw,
            fy + plusOneAnim.y * fh + yOffset
          );
          ctx.globalAlpha = 1;
        } else {
          plusOneAnim = null;
        }
      }

      // ── 11. Game over overlay ─────────────────────────────────
      if (state.status === "finished") {
        ctx.fillStyle = OVERLAY_BG;
        roundRect(ctx, fx, fy, fw, fh, CORNER_RADIUS);
        ctx.fill();

        const won = state.score.player > state.score.opponent;
        const text = won ? "YOU WIN!" : "YOU LOSE";
        ctx.font = 'bold 32px "Outfit", sans-serif';
        ctx.fillStyle = won ? WIN_COLOR : LOSE_COLOR;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, fx + fw / 2, fy + fh / 2);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [width, height, gameState]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        display: "block",
        touchAction: "none",
        userSelect: "none",
      }}
    />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Rounded rect for goal zones - only rounds top or bottom corners */
function roundRectPartial(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  topRounded: boolean
) {
  const tr = topRounded ? Math.min(r, 6) : 0;
  const br = topRounded ? 0 : Math.min(r, 6);
  ctx.beginPath();
  ctx.moveTo(x + tr, y);
  ctx.lineTo(x + w - tr, y);
  if (tr > 0) {
    ctx.arcTo(x + w, y, x + w, y + tr, tr);
  } else {
    ctx.lineTo(x + w, y);
  }
  ctx.lineTo(x + w, y + h - br);
  if (br > 0) {
    ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  } else {
    ctx.lineTo(x + w, y + h);
  }
  ctx.lineTo(x + br, y + h);
  if (br > 0) {
    ctx.arcTo(x, y + h, x, y + h - br, br);
  } else {
    ctx.lineTo(x, y + h);
  }
  ctx.lineTo(x, y + tr);
  if (tr > 0) {
    ctx.arcTo(x, y, x + tr, y, tr);
  } else {
    ctx.lineTo(x, y);
  }
  ctx.closePath();
}
