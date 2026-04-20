"use client";

import React, { useEffect, useRef, useState, memo, useCallback } from "react";

// ============================================================================
// WORKER CREW — 5 tiny workers walk in a single-file LINE
// Uses requestAnimationFrame for smooth visible movement
// ============================================================================

const WORKER_IMG = "/images/worker.png";
const COUNT = 5;
const STAGGER = 500;       // ms between each worker starting
const WALK_SPEED = 12;     // % per second (slow, visible walk)
const BUILD_TIME = 2500;   // ms hammering at target
const APPEAR_MS = 400;
const DISAPPEAR_MS = 400;

interface Props {
  houseX: number;
  houseY: number;
  targetX: number;
  targetY: number;
  taskDurationMs: number;
  onComplete: () => void;
}

type Phase = "hidden" | "appear" | "walk-to" | "build" | "walk-home" | "disappear" | "done";

interface W {
  phase: Phase;
  x: number;
  y: number;
  phaseStart: number;
  targetX: number;
  targetY: number;
}

function WorkerCrewInner({ houseX, houseY, targetX, targetY, taskDurationMs, onComplete }: Props) {
  const rafRef = useRef(0);
  const workersRef = useRef<W[]>([]);
  const [renderTick, setRenderTick] = useState(0);
  const startTimeRef = useRef(0);
  const completedRef = useRef(false);

  const buildMs = taskDurationMs > 0 ? taskDurationMs : BUILD_TIME;

  // Small offsets so workers line up near the target
  const offsets = [
    { dx: -2.5, dy: 1.5 }, { dx: -1.2, dy: 0.8 }, { dx: 0, dy: 0 },
    { dx: 1.2, dy: 0.8 }, { dx: 2.5, dy: 1.5 },
  ];

  useEffect(() => {
    const now = performance.now();
    startTimeRef.current = now;
    completedRef.current = false;

    workersRef.current = Array.from({ length: COUNT }, (_, i) => ({
      phase: "hidden" as Phase,
      x: houseX,
      y: houseY,
      phaseStart: now + i * STAGGER,
      targetX: targetX + offsets[i].dx,
      targetY: targetY + offsets[i].dy,
    }));

    function tick(time: number) {
      let anyActive = false;
      let doneCount = 0;

      for (let i = 0; i < COUNT; i++) {
        const w = workersRef.current[i];
        const elapsed = time - w.phaseStart;

        if (w.phase === "hidden") {
          if (time >= w.phaseStart) {
            w.phase = "appear";
            w.phaseStart = time;
          }
          anyActive = true;
        } else if (w.phase === "appear") {
          if (elapsed >= APPEAR_MS) {
            w.phase = "walk-to";
            w.phaseStart = time;
          }
          anyActive = true;
        } else if (w.phase === "walk-to") {
          const dx = w.targetX - houseX;
          const dy = w.targetY - houseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const totalMs = (dist / WALK_SPEED) * 1000;
          const t = Math.min(elapsed / totalMs, 1);
          w.x = houseX + dx * t;
          w.y = houseY + dy * t;
          if (t >= 1) {
            w.phase = "build";
            w.phaseStart = time;
            w.x = w.targetX;
            w.y = w.targetY;
          }
          anyActive = true;
        } else if (w.phase === "build") {
          if (elapsed >= buildMs) {
            w.phase = "walk-home";
            w.phaseStart = time;
          }
          anyActive = true;
        } else if (w.phase === "walk-home") {
          const dx = houseX - w.targetX;
          const dy = houseY - w.targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const totalMs = (dist / WALK_SPEED) * 1000;
          const t = Math.min(elapsed / totalMs, 1);
          w.x = w.targetX + dx * t;
          w.y = w.targetY + dy * t;
          if (t >= 1) {
            w.phase = "disappear";
            w.phaseStart = time;
            w.x = houseX;
            w.y = houseY;
          }
          anyActive = true;
        } else if (w.phase === "disappear") {
          if (elapsed >= DISAPPEAR_MS) {
            w.phase = "done";
          }
          anyActive = true;
        } else if (w.phase === "done") {
          doneCount++;
        }
      }

      setRenderTick(t => t + 1);

      if (doneCount >= COUNT && !completedRef.current) {
        completedRef.current = true;
        onComplete();
        return;
      }

      if (anyActive) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [houseX, houseY, targetX, targetY, buildMs, onComplete]);

  const workers = workersRef.current;
  const goingLeft = targetX < houseX;

  return (
    <>
      <style>{css}</style>
      {workers.map((w, i) => {
        if (w.phase === "hidden" || w.phase === "done") return null;

        const elapsed = performance.now() - w.phaseStart;

        let opacity = 1;
        let scale = 1;
        if (w.phase === "appear") {
          const t = Math.min(elapsed / APPEAR_MS, 1);
          opacity = t;
          scale = 0.3 + t * 0.7;
        } else if (w.phase === "disappear") {
          const t = Math.min(elapsed / DISAPPEAR_MS, 1);
          opacity = 1 - t;
          scale = 1 - t * 0.7;
        }

        const isWalking = w.phase === "walk-to" || w.phase === "walk-home";
        const walkingHome = w.phase === "walk-home";
        const flip = walkingHome ? !goingLeft : goingLeft;

        // Walking bob
        let bobY = 0;
        if (isWalking) {
          bobY = Math.sin(elapsed * 0.012) * 2;
        }

        // Building hammer
        let hammerRot = 0;
        if (w.phase === "build") {
          hammerRot = Math.sin(elapsed * 0.015 + i * 1.2) * 10;
        }

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${w.x}%`,
              top: `${w.y}%`,
              transform: `translate(-50%, -100%) scale(${scale}) translateY(${bobY}px) rotate(${hammerRot}deg)`,
              opacity,
              zIndex: 15,
              pointerEvents: "none" as const,
              willChange: "left, top, transform, opacity",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={WORKER_IMG} alt="" draggable={false}
              style={{
                width: 24, height: 32, objectFit: "contain",
                transform: flip ? "scaleX(-1)" : "none",
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
              }}
            />
            {w.phase === "build" && (
              <div
                style={{
                  position: "absolute", bottom: -2, left: "50%",
                  width: 6, height: 6, borderRadius: "50%",
                  background: "rgba(139,111,71,0.35)",
                  transform: `translateX(-50%) scale(${0.5 + Math.sin(elapsed * 0.01 + i) * 0.5})`,
                  opacity: 0.3 + Math.sin(elapsed * 0.008 + i) * 0.3,
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

const css = "";

export default memo(WorkerCrewInner);
