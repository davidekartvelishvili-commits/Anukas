"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, memo } from "react";

// ============================================================================
// WORKER CREW — 5 tiny workers walk in a single-file LINE
// Parent controls when building starts/stops via ref handle
// ============================================================================

const WORKER_IMG = "/images/worker.png";
const COUNT = 5;
const STAGGER = 500;
const WALK_SPEED = 12;     // % per second
const APPEAR_MS = 400;
const DISAPPEAR_MS = 400;

export interface WorkerCrewHandle {
  startReturn: () => void;
}

interface Props {
  houseX: number;
  houseY: number;
  targetX: number;
  targetY: number;
  onArrive: () => void;   // called when all workers reach the target
  onComplete: () => void;  // called when all workers return home
}

type Phase = "hidden" | "appear" | "walk-to" | "waiting" | "walk-home" | "disappear" | "done";

interface W {
  phase: Phase;
  x: number;
  y: number;
  phaseStart: number;
  targetX: number;
  targetY: number;
}

const WorkerCrewInner = forwardRef<WorkerCrewHandle, Props>(
  function WorkerCrew({ houseX, houseY, targetX, targetY, onArrive, onComplete }, ref) {
    const rafRef = useRef(0);
    const workersRef = useRef<W[]>([]);
    const [, setTick] = useState(0);
    const arrivedRef = useRef(false);
    const returnTriggeredRef = useRef(false);
    const completedRef = useRef(false);

    const goingLeft = targetX < houseX;

    const offsets = [
      { dx: -2.5, dy: 1.5 }, { dx: -1.2, dy: 0.8 }, { dx: 0, dy: 0 },
      { dx: 1.2, dy: 0.8 }, { dx: 2.5, dy: 1.5 },
    ];

    // Parent calls this to tell workers to walk home
    useImperativeHandle(ref, () => ({
      startReturn: () => {
        returnTriggeredRef.current = true;
      },
    }));

    useEffect(() => {
      const now = performance.now();
      arrivedRef.current = false;
      returnTriggeredRef.current = false;
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
        let arrivedCount = 0;
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
              w.phase = "waiting";
              w.x = w.targetX;
              w.y = w.targetY;
            }
            anyActive = true;
          } else if (w.phase === "waiting") {
            arrivedCount++;
            // Stay here until parent triggers return
            if (returnTriggeredRef.current) {
              w.phase = "walk-home";
              w.phaseStart = time + i * 300; // stagger return
            }
            anyActive = true;
          } else if (w.phase === "walk-home") {
            if (time < w.phaseStart) { anyActive = true; continue; } // waiting for stagger
            const el = time - w.phaseStart;
            const dx = houseX - w.targetX;
            const dy = houseY - w.targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const totalMs = (dist / WALK_SPEED) * 1000;
            const t = Math.min(el / totalMs, 1);
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

        // Notify parent when all arrive at target
        if (arrivedCount >= COUNT && !arrivedRef.current) {
          arrivedRef.current = true;
          onArrive();
        }

        if (doneCount >= COUNT && !completedRef.current) {
          completedRef.current = true;
          onComplete();
          return;
        }

        setTick(t => t + 1);

        if (anyActive || doneCount < COUNT) {
          rafRef.current = requestAnimationFrame(tick);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }, [houseX, houseY, targetX, targetY, onArrive, onComplete]);

    const workers = workersRef.current;

    return (
      <>
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
          const flip = w.phase === "walk-home" ? !goingLeft : goingLeft;

          let bobY = 0;
          if (isWalking) bobY = Math.sin(elapsed * 0.012) * 2;

          let hammerRot = 0;
          if (w.phase === "waiting" && returnTriggeredRef.current === false) {
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
              {w.phase === "waiting" && (
                <div style={{
                  position: "absolute", bottom: -2, left: "50%",
                  width: 6, height: 6, borderRadius: "50%",
                  background: "rgba(139,111,71,0.35)",
                  transform: `translateX(-50%) scale(${0.5 + Math.sin(elapsed * 0.01 + i) * 0.5})`,
                  opacity: 0.3 + Math.sin(elapsed * 0.008 + i) * 0.3,
                }} />
              )}
            </div>
          );
        })}
      </>
    );
  }
);

WorkerCrewInner.displayName = "WorkerCrew";
export default memo(WorkerCrewInner);
